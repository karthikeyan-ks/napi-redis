import type { RedisClient } from "./redis.js";

export interface CacheOptions {
  redis: RedisClient;
  prefix?: string;
  defaultTTL?: number;
}
