import { redisClient } from "../redis/client.ts"

export class CacheEngine {
  async getEntity<T>(type: string, id: string): Promise<T | null> {
    const key = `${type}:${id}`
    const data = await redisClient.get(key)

    return data ? JSON.parse(data) : null
  }

  async setEntity<T extends { id: string }>(
    type: string,
    entity: T
  ) {
    const key = `${type}:${entity.id}`
    await redisClient.set(key, JSON.stringify(entity))
  }

  async linkRoute(route: string, keys: string[]) {
    await redisClient.sadd(route, ...keys)
  }

  async getRoute(route: string) {
    return redisClient.smembers(route)
  }

  async invalidateRoute(route: string) {
    const keys = await this.getRoute(route)

    if (!keys.length) return

    for (const key of keys) {
      await redisClient.del(key)
    }

    await redisClient.del(route)
  }
}
