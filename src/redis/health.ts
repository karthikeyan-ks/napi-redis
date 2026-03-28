// src/redis/health.ts

import { NapiRedisHealth } from "../types/health"
import { connect } from "./client"

export async function getRedisHealth(): Promise<NapiRedisHealth> {
  try {
    const client = await connect()

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