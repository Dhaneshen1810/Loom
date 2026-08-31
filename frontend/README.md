# Loom frontend

The frontend uses Next.js and a server-side authentication bridge. The browser
never receives the backend JWT; Next.js stores it in an HttpOnly cookie and
forwards requests from the server layer.

## Getting started

Copy the local environment file:

```bash
cp .env.example .env.local
```

Start the Rust backend on port `3000`, then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Environment

- `BACKEND_API_URL`: server-only URL for the Rust API. Do not prefix it with
  `NEXT_PUBLIC_`; credentials and JWTs should remain in the server layer.
