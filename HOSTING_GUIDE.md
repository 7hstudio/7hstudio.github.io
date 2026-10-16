# 🚀 7H STUDIOS • 24/7 Free Hosting Guide

This guide explains how to host the **7H STUDIOS** website online **100% FREE** with **24/7 uptime (no sleep)**.

---

## 🌟 Method 1: Render.com (Recommended - 100% Free Cloud)

Render is the most reliable cloud platform for hosting Node.js web applications with free SSL/HTTPS certificates.

### Step 1: Upload Project to GitHub
1. Create a free account on [GitHub.com](https://github.com).
2. Click **New Repository**, name it `7h-studios-web`, and make it **Private** or **Public**.
3. Upload all files from this folder (`7h-studios-web`) into the repository.

### Step 2: Create Web Service on Render
1. Go to [Render.com](https://render.com) and sign up with GitHub.
2. Click **New +** &rarr; **Web Service**.
3. Select your `7h-studios-web` repository.
4. Configure the settings:
   - **Name:** `7h-studios` (or any name you prefer)
   - **Region:** Frankfurt (EU)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Step 3: Add Environment Variables
In the **Environment Variables** section on Render, add:

| Key | Value |
|---|---|
| `DISCORD_TOKEN` | `[YOUR_DISCORD_BOT_TOKEN]` |
| `CLIENT_ID` | `1560743842775568504` |
| `GUILD_ID` | `1418023065560023052` |
| `DOMAIN` | `https://7h-studios.onrender.com` *(replace with your real Render URL)* |

Click **Create Web Service**. Render will build and launch your site in ~1 minute!

### Step 4: Update Discord Developer Portal
Once your Render URL is live (e.g., `https://7h-studios.onrender.com`):
1. Open [Discord Developer Portal &rarr; Applications &rarr; 1560743842775568504 &rarr; OAuth2](https://discord.com/developers/applications/1560743842775568504/oauth2/general).
2. Under **Redirects**, click **Add Redirect**.
3. Add: `https://7h-studios.onrender.com/api/auth/callback`
4. Click **Save Changes**.

### Step 5: Keep 24/7 Always On (Never Sleep)
Render's free tier sleeps after 15 minutes of inactivity. To make it **never sleep**:
1. Go to [UptimeRobot.com](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) (both 100% free).
2. Create a **New Monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **URL:** `https://7h-studios.onrender.com/api/health`
   - **Monitoring Interval:** `Every 5 minutes`
3. Save. UptimeRobot will ping the `/api/health` endpoint every 5 minutes, keeping your server awake **24/7/365** with 0 cold starts!
