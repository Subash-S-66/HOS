# HOS API service

Run this persistent Node service separately from the Vercel-hosted Next frontend. Socket.IO and `node-cron` require a persistent process, so deploy `server/` to a Node host such as Render, Railway, Fly.io, or a container platform.

1. Copy the root `.env.example` to `.env` and set every value.
2. Create an admin in MongoDB with a bcrypt password hash in the `admins` collection.
3. Run `npm run server`.
4. In Vercel set `NEXT_PUBLIC_API_URL` to `https://your-api.example/api` and `NEXT_PUBLIC_SOCKET_URL` to `https://your-api.example`.

Terminate TLS at the hosting provider so the frontend connects only through HTTPS/WSS. Never expose the MongoDB URI, JWT secret, Cloudinary secret, or SMTP password in `NEXT_PUBLIC_*` variables.
