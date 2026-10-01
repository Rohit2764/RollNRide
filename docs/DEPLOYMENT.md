# RollNRide Cloud Deployment Guide

This guide walks you through deploying both the **FastAPI Backend** and the **React Vite Frontend** live to the web with free-tier and low-cost options.

---

## Architecture Overview

RollNRide supports two cloud deployment topologies:

```
[Option A: Decoupled Cloud (Recommended for Speed & Global CDN)]
Frontend: Vercel / Netlify / Render Static Site (https://rollnride.vercel.app)
               │ (HTTPS REST API & WSS WebSockets)
               ▼
Backend:  Render / Railway / Fly.io (https://rollnride-api.onrender.com)

[Option B: Containerized / VPS]
Single Host / Cloud VM running Docker Compose behind Nginx reverse proxy
```

---

## Option 1: Vercel (Frontend) + Render (Backend) — 100% Free & Recommended

This takes under 5 minutes and gives you a global CDN for the frontend and automated SSL.

### Step 1: Push your code to GitHub
Make sure your project is committed to your GitHub account:
```bash
git add .
git commit -m "feat: cloud deployment configurations"
git remote add origin https://github.com/<your-username>/rollnride.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend on Render (Free)
1. Go to [render.com](https://render.com) and create an account.
2. Click **New +** $\to$ **Web Service**.
3. Select your GitHub repository.
4. Fill in the service configuration:
   - **Name**: `rollnride-api`
   - **Region**: Choose closest to you (e.g. Frankfurt, Oregon, Singapore)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `JWT_SECRET` = (Click *Generate* or type a secure 32+ char string)
   - `SIMULATION_ENABLED` = `true`
6. Click **Deploy Web Service**.
7. Once deployed, note your public backend URL (e.g., `https://rollnride-api.onrender.com`).
   - Check health: `https://rollnride-api.onrender.com/health`
   - Interactive Swagger API: `https://rollnride-api.onrender.com/docs`

---

### Step 3: Deploy Frontend on Vercel (Free)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** $\to$ **Project**.
3. Import your `rollnride` repository.
4. In the configuration window:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://rollnride-api.onrender.com/api` (use your actual Render backend URL)
6. Click **Deploy**.
7. Vercel will build and deploy the React application to `https://rollnride.vercel.app`!
   *Client-side routing is automatically handled by the included `frontend/vercel.json`.*

---

## Option 2: Render Blueprint (1-Click Deployment)

RollNRide includes a pre-configured `render.yaml` file in the root directory.

1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** $\to$ **Blueprint**.
3. Connect your GitHub repository.
4. Render will parse `render.yaml` and show:
   - `rollnride-backend` (Web Service)
   - `rollnride-frontend` (Static Site with automatic API host linking)
5. Click **Apply**.
Render will deploy both services in parallel and configure their routes automatically.

---

## Option 3: Railway (All-in-One Deployment)

[Railway.app](https://railway.app) allows deploying with PostgreSQL and Redis:

1. Sign up on [railway.app](https://railway.app).
2. Click **New Project** $\to$ **Deploy from GitHub repo**.
3. Select your repo.
4. In Railway project settings, you can deploy:
   - Service 1: `backend` (Docker or Python buildpack)
   - Service 2: `frontend`
5. In the Frontend service settings $\to$ **Variables**, add:
   - `VITE_API_URL` = `https://${{rollnride-backend.RAILWAY_PUBLIC_DOMAIN}}/api`
6. Under **Networking**, generate a public domain for each service.

---

## Option 4: Linux / Cloud VPS (Ubuntu, DigitalOcean, AWS, GCP)

If deploying to your own virtual server with Docker:

1. Clone repo onto server:
   ```bash
   git clone https://github.com/<your-username>/rollnride.git
   cd rollnride
   ```
2. Build and launch:
   ```bash
   docker compose up -d --build
   ```
3. Your app is live on port 80!
   - Frontend & reverse proxy: `http://<your-server-ip>`
   - To add HTTPS, install Certbot:
     ```bash
     sudo apt install -y certbot python3-certbot-nginx
     ```

---

## Post-Deployment Checklist

- [ ] Open frontend URL in browser and verify the landing page renders smoothly.
- [ ] Test the **Demo Role** persona switcher in the top navbar (test Admin and Customer).
- [ ] Verify WebSockets connection in the browser DevTools Network tab (`ws://` or `wss://` on `/ws/fleet` or `/ws/dashboard` with status 101 Switching Protocols).
- [ ] Confirm the **Operations Center** map loads Leaflet tiles and markers move autonomously.
- [ ] Test booking a vehicle and navigating to the active trip HUD (`/trip/:id`).
