import type { NextFunction, Request, RequestHandler, Response } from "express"
import NapiRedis from "../../index.ts"
import { redisClient } from "../redis/client.ts"

type CacheableBody = unknown

export interface NapiRedisMiddlewareOptions {
  url?: string
  ttl?: number
  key?: (req: Request) => string
  inferResources?: (req: Request) => string[]
}

function getPathSegments(url: string): string[] {
  const pathname = new URL(url, "http://napi-redis.local").pathname
  return pathname.split("/").filter(Boolean)
}

function getDefaultRouteKey(req: Request): string {
  return `napi:route:${req.method}:${req.originalUrl || req.url}`
}

function getRouteResourcesKey(routeKey: string): string {
  return `${routeKey}:resources`
}

function getResourceRoutesKey(resource: string): string {
  return `napi:resource:${resource}:routes`
}

function getBodyId(req: Request): string | undefined {
  const body = (req as Request & { body?: unknown }).body

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return undefined
  }

  const id = (body as Record<string, unknown>).id
  if (typeof id === "string" || typeof id === "number" || typeof id === "boolean") {
    return String(id)
  }

  return undefined
}

function inferDefaultResources(req: Request): string[] {
  const segments = getPathSegments(req.originalUrl || req.url)

  if (segments.length === 0) {
    return []
  }

  const resources = new Set<string>()
  resources.add(segments[0])

  if (segments[1]) {
    resources.add(`${segments[0]}:${segments[1]}`)
  }

  if (req.method === "POST") {
    const bodyId = getBodyId(req)
    if (bodyId) {
      resources.add(`${segments[0]}:${bodyId}`)
    }
  }

  return [...resources]
}

async function updateRouteResources(routeKey: string, resources: string[]) {
  const routeResourcesKey = getRouteResourcesKey(routeKey)
  const previousResources = await redisClient.smembers(routeResourcesKey)

  await Promise.all(
    previousResources.map((resource) =>
      redisClient.srem(getResourceRoutesKey(resource), routeKey)
    )
  )

  await redisClient.del(routeResourcesKey)

  if (resources.length === 0) {
    return
  }

  await redisClient.sadd(routeResourcesKey, ...resources)
  await Promise.all(
    resources.map((resource) =>
      redisClient.sadd(getResourceRoutesKey(resource), routeKey)
    )
  )
}

async function cacheRouteResponse(
  routeKey: string,
  body: CacheableBody,
  ttl: number | undefined,
  resources: string[]
) {
  const payload = JSON.stringify(body)

  if (ttl && ttl > 0) {
    await redisClient.set(routeKey, payload, { EX: ttl })
  } else {
    await redisClient.set(routeKey, payload)
  }

  await updateRouteResources(routeKey, resources)
}

async function invalidateRoute(routeKey: string) {
  const routeResourcesKey = getRouteResourcesKey(routeKey)
  const resources = await redisClient.smembers(routeResourcesKey)

  await Promise.all(
    resources.map((resource) =>
      redisClient.srem(getResourceRoutesKey(resource), routeKey)
    )
  )

  await Promise.all([
    redisClient.del(routeKey),
    redisClient.del(routeResourcesKey),
  ])
}

async function invalidateResources(resources: string[]) {
  const uniqueResources = [...new Set(resources.filter(Boolean))]

  for (const resource of uniqueResources) {
    const resourceRoutesKey = getResourceRoutesKey(resource)
    const routes = await redisClient.smembers(resourceRoutesKey)

    for (const routeKey of routes) {
      await invalidateRoute(routeKey)
    }

    await redisClient.del(resourceRoutesKey)
  }
}

function shouldInvalidate(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())
}

export function napiRedisMiddleware(
  options: NapiRedisMiddlewareOptions = {}
): RequestHandler {
  const db = new NapiRedis(options.url)
  let connectionPromise: Promise<void> | null = null

  async function ensureConnected() {
    if (db.redis) {
      return
    }

    if (!connectionPromise) {
      connectionPromise = db.connect().finally(() => {
        connectionPromise = null
      })
    }

    await connectionPromise
  }

  return async function napiRedisExpressMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await ensureConnected()

      const trackedResources = new Set<string>()
      const invalidationResources = new Set<string>()

      req.napiRedis = db
      req.napiRedisTrack = (...resources: string[]) => {
        for (const resource of resources) {
          if (resource) {
            trackedResources.add(resource)
          }
        }
      }
      req.napiRedisInvalidate = (...resources: string[]) => {
        for (const resource of resources) {
          if (resource) {
            invalidationResources.add(resource)
          }
        }
      }

      if (req.method === "GET") {
        const routeKey = options.key ? options.key(req) : getDefaultRouteKey(req)
        const cached = await redisClient.get(routeKey)

        if (cached) {
          res.setHeader("x-napi-redis-cache", "HIT")
          res.setHeader("content-type", "application/json; charset=utf-8")
          res.send(cached)
          return
        }

        let responseBody: CacheableBody | undefined
        const originalJson = res.json.bind(res)

        res.json = ((body: CacheableBody) => {
          responseBody = body
          return originalJson(body)
        }) as Response["json"]

        res.on("finish", () => {
          if (responseBody === undefined || res.statusCode >= 400) {
            return
          }

          const inferredResources = options.inferResources
            ? options.inferResources(req)
            : inferDefaultResources(req)
          const resources = [...new Set([...inferredResources, ...trackedResources])]

          void cacheRouteResponse(routeKey, responseBody, options.ttl, resources).catch(
            (error: Error) => {
              console.error("napi-redis cache write failed:", error)
            }
          )
        })
      } else if (shouldInvalidate(req.method)) {
        res.on("finish", () => {
          if (res.statusCode >= 400) {
            return
          }

          const inferredResources = options.inferResources
            ? options.inferResources(req)
            : inferDefaultResources(req)
          const resources = [...new Set([...inferredResources, ...invalidationResources])]

          void invalidateResources(resources).catch((error: Error) => {
            console.error("napi-redis invalidation failed:", error)
          })
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
