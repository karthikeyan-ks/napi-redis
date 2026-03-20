import assert from "node:assert/strict";

import { connect, disconnect, get, set } from "./index.js";

try {
  await connect();
  await set("name", "Karthikeyan");

  assert.equal(await get("name"), "Karthikeyan");
  console.log("Redis test passed");
} finally {
  await disconnect();
}
