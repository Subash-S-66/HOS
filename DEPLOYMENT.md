# House of Spanking (HOS) Deployment Guide

This project consists of two main components:
1. **Frontend**: Next.js App (located in the root `/`)
2. **Backend**: Express Server with WebSockets (`socket.io`) & MongoDB integration (located in `/server`)

---

## 1. Deploying Frontend to Vercel

The frontend is ready for Vercel out of the box because it uses a standard Next.js directory structure.

### Steps to Deploy
1. Push your repository to **GitHub / GitLab / Bitbucket**.
2. Log into the [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
3. Import your repository.
4. Keep the **Framework Preset** as **Next.js** and the **Root Directory** as `./` (default).
5. Open the **Environment Variables** section and configure:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend endpoint (e.g., `https://hos-backend.onrender.com/api`).
   - `NEXT_PUBLIC_SOCKET_URL`: The base URL of your deployed backend for WebSocket connections (e.g., `https://hos-backend.onrender.com`).
6. Click **Deploy**. Vercel will build the frontend and serve it.

> Gallery uploads can be up to 15 MB. Set `NEXT_PUBLIC_API_URL` to the separately deployed Node API; do not send these uploads through the Vercel `/api` rewrite, whose request-body limit is lower.

---

## 2. Deploying Backend to a Node Host (Render / Railway / Fly)

Because the backend uses WebSockets (`socket.io`) for real-time chat, it **cannot** be deployed as a serverless function (like Vercel). WebSockets require a persistent Node server container. We recommend using **Render.com** (Web Service) or **Railway.app** (Service).

### Option A: Render.com
1. Click **New > Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `hos-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
4. Add the required **Environment Variables** (see below).
5. Click **Create Web Service**.

### Option B: Railway.app
1. Click **New Project > Deploy from GitHub repo**.
2. Select your repository.
3. In the service settings, customize the start script:
   - **Start Command**: `npm run server`
4. Add the required **Environment Variables** (see below).

---

## 3. Required Backend Environment Variables

Make sure to set these variables on your deployed backend host:

| Name | Example Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | Connection string to your MongoDB Database |
| `JWT_SECRET` | `your-secure-random-phrase` | Secret key used for signing session tokens |
| `CLIENT_ORIGIN` | `https://your-hos-frontend.vercel.app` | URL of the frontend (must match your Vercel URL exactly for CORS and credential passing) |
| `PORT` | `5000` | The port the server runs on (optional, defaults to `4000`) |

### Optional Variables (for Email & Images)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: If you use Cloudinary to host graphics/gallery items.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `APPLICATION_EMAIL_TO`: If you configure member recruitment details emails.

---

## 4. Local Testing checklist before going live

Ensure you've tested locally that:
* The `.gitignore` prevents logs (`*.log`) and local environment files (`.env.local`, `.env`) from leaking to your public repo.
* Both `npm run build` and `npm run dev` compile successfully.
