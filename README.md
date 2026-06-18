# MomentumX — Become Who You're Meant to Be

AI-powered goal-achievement platform. Set a goal, get a personalized action plan, track daily progress, and chat with AI to stay on course.

---

## Run Locally

```bash
bash start.sh
```

Then open http://localhost:5173

---

## Deploy to the Web (GitHub → Railway + Vercel)

### 1. Push to GitHub

```bash
bash deploy.sh
```

Follow the printed instructions to create a repo named **MomentumX** on GitHub and push.

### 2. Deploy Backend → Railway

1. Go to https://railway.app and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo** → select **MomentumX**
3. Railway detects the `Procfile` automatically
4. In Railway → **Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `GROQ_API_KEY`
   - `FRONTEND_URL` (set after Vercel deploy, e.g. `https://momentumx.vercel.app`)
5. Copy your Railway domain (e.g. `https://momentumx-production.railway.app`)

### 3. Deploy Frontend → Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project** → import **MomentumX**
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key
   - `VITE_API_URL` — your Railway backend URL (from step 2)
4. Click **Deploy**

### 4. Update CORS in Railway

Go back to Railway → Variables → add/update:
- `FRONTEND_URL` = your Vercel URL (e.g. `https://momentumx.vercel.app`)

Redeploy the Railway service. Done — your app is live!

---

## Environment Variables

| File | Variable | Where to get it |
|------|----------|----------------|
| `server/.env` | `SUPABASE_URL` | Supabase → Settings → API |
| `server/.env` | `SUPABASE_SERVICE_KEY` | Supabase → Settings → API (service_role) |
| `server/.env` | `GROQ_API_KEY` | https://console.groq.com |
| `.env` | `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `.env` | `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API (anon) |
| `.env` | `VITE_API_URL` | Your Railway URL (production only) |

---

## Tech Stack

- **Frontend**: React 19 + Vite, hosted on Vercel
- **Backend**: Node.js + Express 5, hosted on Railway
- **Database / Auth**: Supabase (PostgreSQL + Row Level Security)
- **AI**: Groq (llama-3.3-70b-versatile, free tier)
- **Payments**: Stripe (optional)
