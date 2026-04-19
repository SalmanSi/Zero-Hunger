# ZeroHunger Deployment Guide

## Architecture Overview

This app uses a **monorepo structure** with:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL on Supabase (already configured, free tier)

---

## What's Already Done

1. ✅ CORS configured for production domains
2. ✅ Frontend proxy configured for development
3. ✅ Production build scripts verified working
4. ✅ Backend has Procfile for deployment platforms

---

## Deployment Options (All Free)

### Option A: Render.com (Recommended)
- **Backend**: Free 750 hours/month
- **Frontend**: Free static site hosting
- **Database**: Uses existing Supabase (free tier)

### Option B: Vercel + Render
- **Frontend**: Vercel (free)
- **Backend**: Render (free)
- **Database**: Supabase (free)

---

## Step-by-Step Deployment

### Prerequisites
1. Push your code to GitHub

### Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: zerohunger-api
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
5. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://<db_user>:<db_password>@<db_host>:5432/<db_name>
   JWT_SECRET=your-new-secure-secret-key
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   PORT=5000
   ```
6. Click "Create Web Service"

**Wait for build to complete and note your backend URL** (e.g., `https://zerohunger-api.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
6. Click "Deploy"

**Wait for deployment and note your frontend URL**

### Step 3: Update CORS on Backend

1. Go to Render dashboard → Your backend service → "Environment"
2. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   ```
3. Click "Save Changes"

### Step 4: Verify Deployment

1. Visit your frontend URL
2. Try registering a new user
3. Check if data appears in your Supabase dashboard

---

## Database: Supabase (Already Configured)

Your PostgreSQL database is hosted on Supabase. Keep credentials private and load them only from env vars:
- **Host**: your Supabase pooler host
- **Port**: 5432
- **Database**: your database name
- **User**: your database user
- **Password**: your database password

### To Access Database:
1. Go to [supabase.com](https://supabase.com)
2. Sign in → Select your project
3. Click "Table Editor" to view data
4. Click "SQL Editor" to run queries

### Supabase Free Tier Limits:
- 500 MB database storage
- 2 GB bandwidth/month
- 500 MB file storage
- Enough for small production apps

---

## Troubleshooting

### Backend Shows "Bad Gateway"
- Check that Prisma generate ran during build
- Verify DATABASE_URL is correct in Render env vars
- Check Render logs for errors

### Frontend Can't Connect to API
- Ensure VITE_API_URL is set correctly (no trailing slash)
- Verify CORS_ORIGINS includes your Vercel URL

### Database Connection Failed
- Supabase might have paused the project (free tier pauses after 7 days of inactivity)
- Go to Supabase dashboard → Click "Restore project"

---

## Environment Variables Summary

### Backend (.env)
| Variable | Description |
|----------|-------------|
| DATABASE_URL | Supabase PostgreSQL connection string |
| JWT_SECRET | Secret key for JWT tokens (generate new one) |
| PORT | Server port (5000) |
| CORS_ORIGINS | Frontend URL for CORS |

### Frontend (.env)
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL (e.g., https://api.onrender.com/api) |

---

## Quick Commands

```bash
# Development
cd backend && npm run dev    # Start backend
cd frontend && npm run dev    # Start frontend

# Production build
cd backend && npm run build
cd frontend && npm run build

# Database
cd backend && npm run db:generate  # Generate Prisma client
cd backend && npm run db:push      # Push schema to database
```
