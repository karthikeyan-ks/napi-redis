// src/redis/health.ts

import type { NapiRedisHealth } from "../types/health.ts"
import { connect } from "./client.ts"

export async function getRedisHealth(
  url = "redis://localhost:6379",
  error?: (err: Error) => void
): Promise<NapiRedisHealth> {
  try {
    const client = await connect(url, error)

    const start = Date.now()
    const res = await client.ping()
    const latency = Date.now() - start

    return {
      status: res === "PONG" ? "ok" : "unknown",
      latency,
    }
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "unknown",
    }
  }
}
