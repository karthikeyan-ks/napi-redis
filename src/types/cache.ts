import { RedisClient } from "./redis";

export interface CacheOptions {
  redis: RedisClient;
  prefix?: string;
  defaultTTL?: number;
}