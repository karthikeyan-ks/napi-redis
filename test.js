import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import NapiRedis from "./index.ts";
import { napiRedisMiddleware } from "./index.ts";
import { redisClient } from "./src/redis/client.ts";

const db = new NapiRedis("redis://localhost:6379");
const collection = `users_test_${Date.now()}`;

try {
  await db.connect();
  await db.connect();

  const inserted = await db.insert(collection, {
    id: "1",
    name: "Karthikeyan",
    deptId: "10",
    active: true,
    profile: { role: "admin" },
  });

  assert.deepEqual(inserted, {
    id: "1",
    name: "Karthikeyan",
    deptId: "10",
    active: "true",
  });

  const user = await db.findById(collection, "1");
  assert.deepEqual(user, inserted);

  await db.insert(collection, {
    id: "2",
    name: "Karthikeyan",
    deptId: "10",
  });

  await db.insert(collection, {
    id: "3",
    name: "Karthikeyan",
    deptId: "20",
  });

  const byName = await db.find(collection, { name: "Karthikeyan" });
  assert.equal(byName.length, 3);

  const byNameAndDept = await db.find(collection, {
    name: "Karthikeyan",
    deptId: "10",
  });
  assert.equal(byNameAndDept.length, 2);
  assert.deepEqual(
    byNameAndDept.map((record) => record.id).sort(),
    ["1", "2"]
  );

  const missing = await db.findById(collection, "999");
  assert.equal(missing, null);

  const noMatch = await db.find(collection, { name: "Nobody" });
  assert.deepEqual(noMatch, []);

  const middleware = napiRedisMiddleware({
    url: "redis://localhost:6379",
    ttl: 60,
  });

  const createResponse = () => {
    const response = new EventEmitter();
    response.statusCode = 200;
    response.headers = {};
    response.body = undefined;
    response.finished = false;
    response.setHeader = (name, value) => {
      response.headers[name.toLowerCase()] = value;
    };
    response.json = (body) => {
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.body = body;
      response.finished = true;
      response.emit("finish");
      return response;
    };
    response.send = (body) => {
      response.body = body;
      response.finished = true;
      response.emit("finish");
      return response;
    };
    return response;
  };

  const getReq = {
    method: "GET",
    url: `/${collection}/1`,
    originalUrl: `/${collection}/1`,
  };

  const firstRes = createResponse();
  let getNextCalled = false;
  await middleware(getReq, firstRes, () => {
    getNextCalled = true;
  });
  assert.equal(getNextCalled, true);
  assert.ok(getReq.napiRedis);
  firstRes.json({ id: "1", name: "Karthikeyan" });
  await new Promise((resolve) => setTimeout(resolve, 25));

  const secondRes = createResponse();
  let secondNextCalled = false;
  await middleware({ ...getReq }, secondRes, () => {
    secondNextCalled = true;
  });
  assert.equal(secondNextCalled, false);
  assert.equal(secondRes.headers["x-napi-redis-cache"], "HIT");
  assert.equal(
    secondRes.body,
    JSON.stringify({ id: "1", name: "Karthikeyan" })
  );

  const writeReq = {
    method: "PUT",
    url: `/${collection}/1`,
    originalUrl: `/${collection}/1`,
  };
  const writeRes = createResponse();
  let writeNextCalled = false;
  await middleware(writeReq, writeRes, () => {
    writeNextCalled = true;
  });
  assert.equal(writeNextCalled, true);
  writeRes.json({ ok: true });
  await new Promise((resolve) => setTimeout(resolve, 25));

  const cachedRoute = await redisClient.get(`napi:route:GET:/${collection}/1`);
  assert.equal(cachedRoute, null);

  console.log("Redis test passed");
} finally {
  await db.disconnect();
}
