import { Express } from "express"

type InternalContext = {
    resId: string;
    resourceKey: string;
}

export interface RouteOption<T = any> {
    key?: (req: Request) => string;
    ttl?: number;
    handler?: (req: Request) => Promise<T>
}