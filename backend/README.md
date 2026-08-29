# Loom backend

Basic Axum API backed by PostgreSQL through SQLx.

## Run locally

```sh
docker compose up -d
cargo run
```

The server listens at `http://localhost:3000`.

## Endpoints

```sh
curl http://localhost:3000/

curl -X POST http://localhost:3000/hello \
  -H "content-type: application/json" \
  -d '{"name":"Dhan"}'

curl -X PUT http://localhost:3000/hello/Dhan
```
