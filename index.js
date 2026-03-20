import { createClient } from "redis";

let client;

export async function connect(url = "redis://localhost:6379") {
  client = createClient({ url });

  client.on("error", (err) => {
    console.error("Redis error:", err);
  });

  await client.connect();
  return client;
}

export async function set(key, value) {
  if (!client) throw new Error("Redis not connected");
  return client.set(key, value);
}

export async function get(key) {
  if (!client) throw new Error("Redis not connected");
  return client.get(key);
}

export async function del(key) {
  if (!client) throw new Error("Redis not connected");
  return client.del(key);
}