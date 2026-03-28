import type { Redis } from 'ioredis';
import { connect,disconnect } from './src/redis/client.ts'
import { getRedisHealth } from './src/redis/health.ts'

export class NapiRedis {

  public redis:Redis | null = null

  constructor(
    url: string,
    error: (err: Error) => void,
    success: () => void
  ) {
    void (async () => {
      try {
        this.redis = await connect(url, error);

        const result = await getRedisHealth(url, error);
        if (result.error) {
          console.log("REDIS HEALTH ERROR");
        } else {
          console.log("REDIS HEALTH OK");
        }

        success();
      } catch (err) {
        error(err instanceof Error ? err : new Error(String(err)));
      }
    })();
  }

  async disconnect() {
    await disconnect();
    console.log("NAPI REDIS gracefully shutdown...");
  }
}
