# napi-redis

A lightweight **normalized data layer on top of Redis** for Node.js.
Think of it as a minimal ORM-like wrapper that brings structure, indexing, and relationships to Redis.

---

## ✨ Why napi-redis?

Redis is fast, but working with raw commands can get messy when your data grows.

`napi-redis` helps you:

* Organize data into **collections (like tables)**
* Store structured data using **hashes**
* Query using **indexes**
* Model simple **relationships**
* Avoid repeated JSON parsing/stringifying

---

## 📦 Installation

```bash
npm install napi-redis
```

---

## 🚀 Quick Start

```js
import NapiRedis from "napi-redis";

const db = new NapiRedis("redis://localhost:6379");

await db.connect();

// insert data
await db.insert("users", {
  id: "1",
  name: "Karthikeyan",
  deptId: "10"
});

// fetch by id
const user = await db.findById("users", "1");
console.log(user);

// query using index
const users = await db.find("users", { name: "Karthikeyan" });
console.log(users);
```

---

## 🧠 Core Concepts

### 1. Collections

Data is grouped into collections (like tables):

```
users:1
users:2
departments:10
```

---

### 2. Hash-based Storage

Each record is stored as a Redis hash:

```
HSET users:1 name "Karthikeyan" deptId "10"
```

---

### 3. Indexing

Indexes are stored using Redis sets:

```
users:index:name:Karthikeyan → [1, 5, 9]
```

This allows fast lookup without scanning all keys.

---

### 4. Relationships

You can store references between collections:

```js
{
  id: "1",
  name: "Karthikeyan",
  deptId: "10"
}
```

Future versions will support automatic relation resolution.

---

## 📚 API (v1)

### `connect()`

Connect to Redis.

### `insert(collection, data)`

Insert a record.

### `findById(collection, id)`

Get a single record by ID.

### `find(collection, query)`

Query records using indexed fields.

---

## ⚙️ Example

```js
await db.insert("departments", {
  id: "10",
  name: "Computer Science"
});

const dept = await db.findById("departments", "10");
```

---

## 🔥 Roadmap

* [ ] Schema definition
* [ ] Automatic indexing
* [ ] Relationship population (`include`)
* [ ] TTL support
* [ ] In-memory fallback (when Redis is down)
* [ ] TypeScript support

---

## ⚠️ Notes

* This is an early version (v1)
* Not intended as a full replacement for relational databases
* Best suited for caching layers, lightweight data storage, and fast lookups

---

## 🤝 Contributing

Feel free to open issues or submit PRs:
https://github.com/karthikeyan-ks/napi-redis

---

## 📄 License

ISC
