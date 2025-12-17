# Quick Start Guide

Get your SF Neighborhood Rating app up and running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- Docker Desktop running
- A Mapbox account (free tier is fine)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Create a `.env` file:

```bash
cp .env.example .env
```

**Edit `.env` and replace these 2 REQUIRED values:**

1. **NEXTAUTH_SECRET** - Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and replace `generate_with_openssl_rand_base64_32`

2. **NEXT_PUBLIC_MAPBOX_TOKEN** - Replace `pk.xxx` with your actual Mapbox token (see step 3)

**Leave everything else as-is for now.** The other values in `.env.example` will work for local development:
- `DATABASE_URL` is already correct for Docker PostgreSQL
- `NEXTAUTH_URL` is already set to `http://localhost:3000`
- OAuth credentials are dummy values - you can still sign up with email/password
- `NODE_ENV=development` is correct for local dev

### 3. Get Your Mapbox Token

1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for free account
3. Go to Account → Tokens
4. Copy your default public token (starts with `pk.`)
5. Paste it in your `.env` file as `NEXT_PUBLIC_MAPBOX_TOKEN`

### 4. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 5. Set Up Database

```bash
# Run migrations
npx prisma migrate dev

# Seed with real SF neighborhood data
npm run prisma:seed
```

### 6. Start the App

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

## What You'll See

- **Interactive Map**: Real SF neighborhood boundaries from [DataSF](https://data.sfgov.org/-/SF-Find-Neighborhoods/pty2-tcw4)
- **Hover Effects**: Electoral map-style hover with dynamic badges
- **Color Coding**: Neighborhoods colored by rating (red = low, green = high)
- **Click to Rate**: Click any neighborhood to view details and leave a rating

## Quick Test

1. **Hover over neighborhoods** - See the tooltip with stats
2. **Click "Sign In"** - Use email/password (no OAuth needed for testing)
3. **Click a neighborhood** - Opens detail panel
4. **Rate it** - Give it a 5-star rating with category breakdowns
5. **Leave a review** - Add a comment
6. **Add tags** - Create community tags like "Dog Friendly"

## What You Actually Need (Summary)

### ✅ REQUIRED (2 things):
1. **Mapbox Token** - Free at [mapbox.com](https://www.mapbox.com/)
2. **NextAuth Secret** - Generate with `openssl rand -base64 32`

### ⚠️ NOT REQUIRED for Quick Start:
- OAuth apps (Google/Facebook/Twitter) - You can use email/password sign-up instead
- Google Analytics - Optional
- Datadog - Optional

### 📝 Already Configured in .env.example:
- Database URL (for Docker PostgreSQL)
- NextAuth URL (localhost:3000)
- Dummy OAuth values (work for testing)

## Setting Up OAuth (Optional - For Social Login)

**You can skip this for now** - the app works fine with email/password authentication.

If you want social login later:

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID & Secret to `.env`

### Facebook & Twitter
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed OAuth setup instructions.

## Troubleshooting

### "Database connection failed"
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart PostgreSQL
docker compose restart postgres
```

### "Mapbox map not loading"
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
- Token must start with `pk.`
- Token must be a **public** token

### "OAuth not working"
- For local dev, you can use email/password sign-up
- OAuth requires proper setup with redirect URIs

### "No neighborhoods showing"
```bash
# Re-run the seed
npm run prisma:seed
```

## Next Steps

- Add more neighborhoods
- Customize the rating categories
- Deploy to production (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- Set up Google Analytics
- Add more dynamic badges and stats

## Features Implemented

✅ Interactive Mapbox map with real SF boundaries  
✅ Electoral map-style hover effects  
✅ Color-coded neighborhoods by rating  
✅ Click to view details and rate  
✅ Restaurant-style rating system (5 stars + categories)  
✅ Yelp-style reviews with helpful voting  
✅ Community tags (like "Dog Friendly")  
✅ Social login (Google, Facebook, Twitter)  
✅ Email/password authentication  
✅ Dynamic badges ("Top Rated", "Foodie Paradise", etc.)  
✅ Responsive design  
✅ Docker deployment ready  

## Data Source

Neighborhood boundaries are fetched from [SF OpenData](https://data.sfgov.org/-/SF-Find-Neighborhoods/pty2-tcw4) during seeding, giving you accurate, real SF neighborhood polygons!

Enjoy rating SF neighborhoods! 🌉✨
