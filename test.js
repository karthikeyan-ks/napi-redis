import assert from "node:assert/strict";
import NapiRedis from "./index.ts";

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

  console.log("Redis test passed");
} finally {
  await db.disconnect();
}
