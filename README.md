# Rate My Neighborhood - SF

A map-based social neighborhood rating application for San Francisco, featuring restaurant-style reviews and ratings to help apartment hunters make informed decisions.

## Features

- 🗺️ Interactive Mapbox map with SF neighborhood boundaries
- ⭐ Restaurant-style 5-star rating system with category breakdowns
- 💬 Yelp/DoorDash-style reviews with helpful voting
- 🏷️ Community-generated tags and attributes
- 🔐 Social login (Google, Facebook, Twitter) + email/password
- 📊 Google Analytics tracking
- 🐳 Docker deployment ready

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Mapping**: Mapbox GL JS
- **Deployment**: Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- Mapbox API token
- OAuth credentials (Google, Facebook, Twitter)

### Setup

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

3. **Start PostgreSQL:**

```bash
docker compose up postgres -d
```

4. **Run database migrations:**

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. **Start the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app (Consumer type)
3. Add Facebook Login product
4. Add redirect URI: `http://localhost:3000/api/auth/callback/facebook`

### Twitter OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create a new app with OAuth 2.0
3. Add callback URL: `http://localhost:3000/api/auth/callback/twitter`

## Docker Deployment

Build and run with Docker Compose:

```bash
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Database Management

- **Prisma Studio**: `npm run prisma:studio`
- **Generate Prisma Client**: `npm run prisma:generate`
- **Create Migration**: `npm run prisma:migrate`
- **Seed Database**: `npm run prisma:seed`

## Project Structure

```
rate-my-neighborhood/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   ├── page.tsx        # Main map interface
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── Auth/          # Authentication components
│   │   ├── Map/           # Map components
│   │   ├── RatingForm/    # Rating components
│   │   ├── Comments/      # Review components
│   │   └── Tags/          # Tag components
│   └── lib/               # Utility functions
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── docker-compose.yml     # Docker configuration
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
