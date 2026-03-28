import Redis from 'ioredis'
import type { RedisClient } from '../types'
import { error } from 'node:console';

let client: Redis | null = null;

export async function connect(url = 'redis://localhost:6379') {
    if (client) return client;

    client = new Redis(url)

    client.on("error", (error) => {
        console.error("Redis error:", error)
    })
    return client
}

async function getClient(): Promise<Redis> {
    if (!client) {
        await connect();
    } 
    return client!
}