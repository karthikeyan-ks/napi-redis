import type NapiRedis from "../../index.ts"

declare global {
  namespace Express {
    interface Request {
      napiRedis: NapiRedis
      napiRedisTrack: (...resources: string[]) => void
      napiRedisInvalidate: (...resources: string[]) => void
    }
  }
}

export {}
