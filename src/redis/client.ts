import Redis from "ioredis"
import type { RedisClient } from "../types"

let client: Redis | null = null
let connecting: Promise<Redis> | null = null

export async function connect(
  url = "redis://localhost:6379",
  error: (err: Error) => void = (err: Error) => {
    console.error(err)
  },
  
): Promise<Redis> {
  if (client) return client

  if (connecting) return connecting

  connecting = (async () => {
    const instance = new Redis(url)

    instance.on("error", (err) => {
      error(err)
    })

    // ensure connection works
    await instance.ping()

    client = instance
    connecting = null

    return client
  })()

  return connecting
}

async function getClient(): Promise<Redis> {
  if (!client) {
    await connect();
  }
  return client!
}

export const redisClient: RedisClient = {
  async get(key) {
    const c = await getClient()
    return c.get(key);
  },

  async set(key, value, options) {
    const c = await getClient();

    if (options?.EX) {
      return c.set(key, value, "EX", options.EX);
    }

    if (options?.PX) {
      return c.set(key, value, "PX", options.PX);
    }
    return c.set(key, value);
  },

  async del(key) {
    const c = await getClient()
    return c.del(key)
  },

  async sadd(key, ...members) {
    const c = await getClient()
    return c.sadd(key, ...members)
  },

  async smembers(key) {
    const c = await getClient();
    return c.smembers(key)
  },

}

export async function disconnect() {
  if (!client) return

  await client.quit()
  client = null
}