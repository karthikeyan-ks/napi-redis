import type { Redis } from 'ioredis';
import { connect, disconnect, redisClient } from './src/redis/client.ts'

type Primitive = string | number | boolean
type RecordData = Record<string, unknown>
type StoredRecord = Record<string, string>

function isIndexableValue(value: unknown): value is Primitive {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
}

function toStoredRecord(data: RecordData): StoredRecord {
  const stored: StoredRecord = {}

  for (const [key, value] of Object.entries(data)) {
    if (isIndexableValue(value)) {
      stored[key] = String(value)
    }
  }

  return stored
}

export class NapiRedis {

  public redis:Redis | null = null
  private readonly url: string

  constructor(url = "redis://localhost:6379") {
    this.url = url
  }

  async connect() {
    this.redis = await connect(this.url)
  }

  private async ensureConnected() {
    if (!this.redis) {
      await this.connect()
    }
  }

  private getRecordKey(collection: string, id: string) {
    return `${collection}:${id}`
  }

  private getCollectionIdsKey(collection: string) {
    return `${collection}:ids`
  }

  private getIndexKey(collection: string, field: string, value: string) {
    return `${collection}:index:${field}:${value}`
  }

  private async removeExistingIndexes(collection: string, id: string, existing: StoredRecord) {
    const removals = Object.entries(existing)
      .filter(([field, value]) => field !== "id" && value !== undefined)
      .map(([field, value]) => redisClient.srem(this.getIndexKey(collection, field, value), id))

    await Promise.all(removals)
  }

  async insert(collection: string, data: RecordData): Promise<StoredRecord> {
    await this.ensureConnected()

    if (!isIndexableValue(data.id) || String(data.id).length === 0) {
      throw new Error("insert requires a top-level primitive id field")
    }

    const record = toStoredRecord(data)
    const id = record.id

    if (!id) {
      throw new Error("insert requires a top-level primitive id field")
    }

    const recordKey = this.getRecordKey(collection, id)
    const existing = await redisClient.hgetall(recordKey)

    if (Object.keys(existing).length > 0) {
      await this.removeExistingIndexes(collection, id, existing)
    }

    await redisClient.hset(recordKey, record)
    await redisClient.sadd(this.getCollectionIdsKey(collection), id)

    const indexWrites = Object.entries(record)
      .filter(([field]) => field !== "id")
      .map(([field, value]) => redisClient.sadd(this.getIndexKey(collection, field, value), id))

    await Promise.all(indexWrites)

    return record
  }

  async findById(collection: string, id: string): Promise<StoredRecord | null> {
    await this.ensureConnected()

    const record = await redisClient.hgetall(this.getRecordKey(collection, id))
    return Object.keys(record).length > 0 ? record : null
  }

  async find(collection: string, query: Record<string, Primitive>): Promise<StoredRecord[]> {
    await this.ensureConnected()

    const queryEntries = Object.entries(query)

    const ids = queryEntries.length === 0
      ? await redisClient.smembers(this.getCollectionIdsKey(collection))
      : await redisClient.sinter(
          ...queryEntries.map(([field, value]) =>
            this.getIndexKey(collection, field, String(value))
          )
        )

    if (ids.length === 0) {
      return []
    }

    const records = await Promise.all(ids.map((id) => this.findById(collection, id)))
    return records.filter((record): record is StoredRecord => record !== null)
  }

  async disconnect() {
    await disconnect();
    this.redis = null
    console.log("NAPI REDIS gracefully shutdown...");
  }
}

export default NapiRedis
