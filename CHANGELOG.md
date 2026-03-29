# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-03-29

### Added
- Added `napiRedisMiddleware()` for easy Express integration
- Added automatic caching for `GET` JSON responses
- Added automatic cache invalidation for `POST`, `PUT`, `PATCH`, and `DELETE`
- Added `req.napiRedis` for direct Redis access inside Express route handlers
- Added `req.napiRedisTrack()` and `req.napiRedisInvalidate()` for custom cache-resource mapping
- Added Express TypeScript request augmentation

### Changed
- Implemented the README v1 API:
  - `connect()`
  - `insert()`
  - `findById()`
  - `find()`
  - `disconnect()`
- Standardized the constructor to `new NapiRedis(url?)`
- Added default export support for `import NapiRedis from "napi-redis"`
- Records are now stored as Redis hashes
- Top-level primitive fields are automatically indexed
- Multi-field queries now use Redis set intersection

### Fixed
- Removed the old callback-style constructor flow
- Updated internal connection flow to be idempotent
- Updated server usage to match the new API

### Tests
- Added integration tests for insert and lookup
- Added tests for indexed queries
- Added tests for Express GET cache hits
- Added tests for cache invalidation after write operations

### Example

```ts
import express from "express";
import { napiRedisMiddleware } from "napi-redis";

const app = express();

app.use(express.json());
app.use(
  napiRedisMiddleware({
    url: "redis://localhost:6379",
    ttl: 60,
  })
);

app.get("/users/:id", async (req, res) => {
  const user = await req.napiRedis.findById("users", req.params.id);
  res.json(user);
});

app.put("/users/:id", async (req, res) => {
  await req.napiRedis.insert("users", {
    id: req.params.id,
    ...req.body,
  });

  res.json({ ok: true });
});



One small note: if you put code blocks inside `CHANGELOG.md`, keep them short so the file stays readable on GitHub.

If you want, I can also give you:
- a more professional open-source style changelog
- a shorter minimal changelog
- a release-note version and a changelog version separately
