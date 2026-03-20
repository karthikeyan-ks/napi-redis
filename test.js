import { connect, set, get } from "./index.js";

await connect();

await set("name", "Karthikeyan");
console.log(await get("name"));