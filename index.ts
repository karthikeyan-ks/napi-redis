import Redis from 'ioredis';
import { connect } from './src/redis/client'
import { getRedisHealth } from './src/redis/health'

export class NapiRedis {

  public redis:Redis | null = null

  constructor(
    url: string,
    error: (err: Error) => void,
    success: () => void
  ) {
    connect(url, error).then((redis) => {
      this.redis = redis;
      success()
    });

    getRedisHealth()
      .then((result) => {
        if (result.error) {
          console.log("REDIS HEALTH ERROR");
        } else {
          console.log("REDIS HEALTH OK");
        }
      })
      .catch(error);
  }
}