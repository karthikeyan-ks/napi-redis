export type RedisClient = {
    get(key: string): Promise<string | null>
    set(key: string, value: string, ...args: any[]): Promise<any>;
    del(key: string): Promise<any>;
    sadd(key: string, ...members: string[]): Promise<any>;
    smembers(key: string): Promise<string[]> 
}