# HomeJoy Production Deployment Guide

This guide details the step-by-step procedure for deploying HomeJoy (FastAPI backend + Vite/React frontend + MongoDB Atlas) to production cloud environments.

---

## 1. Pre-Deployment Security Notice

> [!WARNING]
> **CRITICAL SECURITY REQUIREMENT:**  
> Sensitive credentials were detected in historical local `.env` files.  
> **Before hosting live, do NOT reuse existing passwords. Generate new credentials:**
> 1. Rotate the MongoDB Atlas database user password.
> 2. Generate a new high-entropy JWT secret key:
>    ```bash
>    python -c "import secrets; print(secrets.token_hex(32))"
>    ```
> 3. Generate a strong `ADMIN_SETUP_SECRET`:
>    ```bash
>    python -c "import secrets; print(secrets.token_urlsafe(24))"
>    ```

---

## 2. MongoDB Atlas Configuration

1. **Create/Verify Cluster:** Ensure your MongoDB Atlas M0 (Free Tier) or M10 cluster is provisioned.
2. **Database User:**
   - Go to **Database Access** -> **Add New Database User**.
   - Select **Password** authentication.
   - Assign role **Read and write to any database** or limit to `homejoy_db`.
3. **Network Access (IP Access List):**
   - Go to **Network Access** -> **Add IP Address**.
   - If hosting on serverless/PaaS platforms (e.g., Render, Railway, Vercel), add `0.0.0.0/0` (Allow access from anywhere).
4. **Get Connection String:**
   - Under **Clusters** -> **Connect** -> **Drivers** (Python 3.12+).
   - Format:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/homejoy_db?retryWrites=true&w=majority&appName=Cluster0
     ```

---

## 3. Backend Deployment (Render / Railway / VPS)

### Option A: Render.com (Web Service)
1. Link your GitHub repository.
2. Select **Web Service**.
3. Set **Root Directory**: `backend`
4. Set **Environment**: `Python 3`
5. **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
6. **Start Command**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
   ```
7. Configure Environment Variables in Render Dashboard:
   - `MONGODB_URL`: `mongodb+srv://...`
   - `DB_NAME`: `homejoy_db`
   - `JWT_SECRET_KEY`: `<your_rotated_64_char_hex_secret>`
   - `JWT_ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
   - `ADMIN_SETUP_SECRET`: `<your_rotated_admin_setup_secret>`
   - `FRONTEND_URL`: `https://your-frontend-domain.vercel.app`

### Option B: Linux VPS (Ubuntu / Systemd + Nginx)
1. Clone repository to `/var/www/homejoy`.
2. Set up virtualenv:
   ```bash
   cd /var/www/homejoy/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Create Systemd Service `/etc/systemd/system/homejoy-backend.service`:
   ```ini
   [Unit]
   Description=HomeJoy FastAPI Backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/homejoy/backend
   EnvironmentFile=/var/www/homejoy/backend/.env
   ExecStart=/var/www/homejoy/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
4. Start service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable homejoy-backend
   sudo systemctl start homejoy-backend
   ```

---

## 4. Frontend Deployment (Vercel / Netlify)

### Option A: Vercel
1. Link your GitHub repository to Vercel.
2. Set **Root Directory**: `frontend`
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-domain.onrender.com` (no trailing slash)
7. Deploy.
8. Single Page Application (SPA) routing is handled automatically by Vite/Vercel.

### Option B: Netlify
1. Link repo to Netlify with Base directory: `frontend`.
2. Build command: `npm run build`
3. Publish directory: `frontend/dist`
4. Add `_redirects` file to `frontend/public/_redirects`:
   ```
   /*    /index.html   200
   ```
5. Set `VITE_API_URL` in Netlify Environment Variables.

---

## 5. Environment Variable Reference

### Backend (`backend/.env`)
```env
# Database
MONGODB_URL=mongodb+srv://<user>:<password>@cluster0.mongodb.net/homejoy_db?retryWrites=true&w=majority
DB_NAME=homejoy_db

# Security & Tokens
JWT_SECRET_KEY=your_rotated_64_char_random_hex_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Administrative Seeding Guard
ADMIN_SETUP_SECRET=your_rotated_secure_setup_secret

# Production CORS
FRONTEND_URL=https://your-production-frontend.vercel.app

# Google OAuth (Optional / Prototype)
GOOGLE_CLIENT_ID=your_production_google_client_id.apps.googleusercontent.com
```

### Frontend (`frontend/.env.production`)
```env
VITE_API_URL=https://your-backend-api.onrender.com
```

---

## 6. Post-Deployment Verification Checklist

1. [ ] Check health endpoint: `GET https://<backend>/health` returns `{"status":"healthy","database":"connected"}`.
2. [ ] Seed initial Admin account securely:
   ```bash
   curl -X POST https://<backend>/api/admin/seed-admin \
     -H "Content-Type: application/json" \
     -H "X-Admin-Setup-Secret: <your_admin_setup_secret>" \
     -d '{"email":"admin@homejoy.com","password":"<strong_admin_pass>","name":"System Admin"}'
   ```
3. [ ] Verify registration endpoint rejects unauthorized roles (`Admin`, `Caregiver`, `Doctor`).
4. [ ] Verify frontend login at `https://<frontend>/login`.
5. [ ] Verify daily check-in and risk explanation display.
6. [ ] Verify caregiver priority queue and help request lifecycle.

---

## 7. Rollback Instructions

If a faulty build is deployed:
1. **Frontend:** In Vercel/Netlify dashboard, select the previous successful deployment and click **Promote to Production** (instant zero-downtime rollback).
2. **Backend:** In Render/Railway dashboard, select previous successful commit deploy, or on VPS:
   ```bash
   git checkout <previous_stable_commit>
   sudo systemctl restart homejoy-backend
   ```
