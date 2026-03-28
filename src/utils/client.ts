import { Redis } from 'ioredis'

let client: Redis | null = null;

export async function connect(url = 'redis://localhost:6379') {
    if (client) return client;

    client = new Redis(url)

    client.on("error", (error: Error) => {
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
