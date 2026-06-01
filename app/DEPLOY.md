# My Digital Kingdom - Full-Stack Deployment Guide

## What You Are Getting

A **complete full-stack creator-fan platform** with:

- **Frontend**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Hono + tRPC 11 + Drizzle ORM + SQLite (better-sqlite3)
- **Payments**: PayPal integration (sandbox/live)
- **Email**: Resend transactional email
- **Auth**: OAuth (Kimi) + username/password with JWT + bcrypt
- **Database**: 20 tables, full CRUD, auto-seeding

---

## Quick Start (5 minutes)

### 1. Clone/Copy the Project

```bash
cd my-app
npm install
```

### 2. Set Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required
DATABASE_URL=./data/mdk.db
FAN_JWT_SECRET=your-super-secret-key-here

# PayPal (optional - for real payments)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENV=sandbox   # change to "live" for production

# Email (optional - for notifications)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com

# Kimi OAuth (optional - for OAuth login)
VITE_KIMI_AUTH_URL=
VITE_APP_ID=
KIMI_AUTH_URL=
KIMI_OPEN_URL=
OWNER_UNION_ID=
```

### 3. Initialize the Database

```bash
# The database auto-creates on first run. To seed with initial data:
curl -X POST http://localhost:3000/api/init-db
```

### 4. Run the Full-Stack App

```bash
npm start
```

The app runs on `http://localhost:3000` with both frontend and backend.

---

## Deployment Options

### Option A: Railway/Render/Fly.io (Recommended)

1. Push code to GitHub
2. Create new project on Railway/Render/Fly
3. Set environment variables in the dashboard
4. Use `npm start` as the start command
5. The backend serves both API and static files automatically

### Option B: VPS / Dedicated Server

```bash
# On your server
git clone <your-repo>
cd my-app
npm install
npm run build
cp .env.example .env
# Edit .env with your secrets
npm start
```

Use PM2 or systemd to keep it running:
```bash
npm install -g pm2
pm2 start dist/boot.js --name "my-digital-kingdom"
pm2 save
pm2 startup
```

### Option C: Docker

```dockerfile
# Dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV DATABASE_URL=/app/data/mdk.db
ENV FAN_JWT_SECRET=change-me
EXPOSE 3000
CMD ["node", "dist/boot.js"]
```

```bash
docker build -t my-digital-kingdom .
docker run -p 3000:3000 -v mdk-data:/app/data my-digital-kingdom
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/init-db` | POST | Seed database with initial data |
| `/api/trpc/*` | ALL | tRPC API (all data operations) |
| `/api/oauth/callback` | GET | Kimi OAuth callback |
| `/api/paypal/create-order` | POST | Create PayPal payment |
| `/api/paypal/capture-order` | POST | Capture PayPal payment |
| `/api/send-email` | POST | Send transactional email |

---

## Database Schema (20 Tables)

- `users` - OAuth users (Kimi login)
- `fans` - Fan accounts (username/password)
- `posts` - Content posts (thoughts, creations, updates)
- `comments` - Post comments
- `products` - Shop products
- `messages` - Fan-creator DMs
- `orders` - Shop orders
- `favorites` - Saved posts
- `socialLinks` - Social media links
- `collections` - Content collections
- `polls` - Community polls
- `stories` - 24hr stories
- `sales` - Active sales/discounts
- `tips` - Post tips
- `walletEntries` - Revenue tracking
- `withdrawals` - Payout requests
- `siteSettings` - Site configuration
- `contentPrefs` - Fan content preferences
- `notifPrefs` - Fan notification preferences
- `paymentMethods` - Saved payment cards
- `donations` - Donation records
- `rewardCodes` - Discount reward codes
- `analytics` - Page view analytics

---

## Configuration Checklist

### For PayPal Payments
1. Create PayPal Developer account at https://developer.paypal.com
2. Create a sandbox app to get Client ID and Secret
3. Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in .env
4. For production, change `PAYPAL_ENV=live`

### For Email Notifications
1. Create Resend account at https://resend.com
2. Add and verify your domain
3. Generate API key
4. Set `RESEND_API_KEY` and `FROM_EMAIL` in .env

### For Kimi OAuth Login
1. Register app on Kimi Open Platform
2. Get App ID and App Secret
3. Configure OAuth callback URL
4. Set all `KIMI_*` and `VITE_*` variables in .env

---

## Features

| Feature | Status |
|---------|--------|
| Creator feed (posts, comments, likes, tips) | ✅ Full backend + DB |
| Shop (products, cart, checkout) | ✅ Full backend + DB |
| Direct messaging (fan ↔ creator) | ✅ Full backend + DB |
| Profile management (avatar, bio, cover) | ✅ Full backend + DB |
| Admin panel (King Panel) | ✅ Full backend + DB |
| AI Agent dashboard | ✅ Frontend (OpenAI-ready) |
| Leaderboard (fan rankings) | ✅ Full backend + DB |
| Donation system + reward codes | ✅ Full backend + DB + PayPal |
| Payment methods (card storage) | ✅ Full backend + DB |
| Email notifications | ✅ Backend + Resend |
| Site settings editor | ✅ Full backend + DB |
| Content/notification preferences | ✅ Full backend + DB |
| Sales and discounts | ✅ Full backend + DB |
| Polls and stories | ✅ Full backend + DB |
| Wallet and withdrawals | ✅ Full backend + DB |
| Analytics | ✅ Full backend + DB |
| OAuth login (Kimi) | ✅ Backend ready |
| Fan username/password auth | ✅ Backend + JWT + bcrypt |
