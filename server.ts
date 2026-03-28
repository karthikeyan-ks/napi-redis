import { NapiRedis } from "./index.ts";

new NapiRedis("redis://localhost:6379", console.error,()=> {
    console.log("Napi redis started...")
});
