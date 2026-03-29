export type RedisClient = {
    get(key: string): Promise<string | null>
    set(key: string, value: string, ...args: any[]): Promise<any>;
    del(key: string): Promise<any>;
    hset(key: string, data: Record<string, string>): Promise<any>;
    hgetall(key: string): Promise<Record<string, string>>;
    sadd(key: string, ...members: string[]): Promise<any>;
    srem(key: string, ...members: string[]): Promise<any>;
    smembers(key: string): Promise<string[]> 
    sinter(...keys: string[]): Promise<string[]>
} 
