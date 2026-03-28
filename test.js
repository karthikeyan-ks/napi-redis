import { NapiRedis } from "./index.ts";

let client;
try {
  await new Promise((resolve, reject) => {
    client = new NapiRedis("redis://localhost:6379", reject, resolve);
  });
  console.log("Redis test passed");
} finally {
  await client?.disconnect();
}
