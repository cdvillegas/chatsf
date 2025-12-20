<div align="center">

<img src="public/logo-dark.png" alt="ChatSF" width="100"/>

# ChatSF

**Your AI guide to San Francisco neighborhoods**

*Natural conversation meets interactive maps. Explore 117 neighborhoods through intelligent chat.*

</div>

## Overview

Ask questions about San Francisco neighborhoods in plain English. The AI responds with insights while the map highlights and zooms to show you exactly where things are.

**Try asking:**
```
"Where should I live for good food?"
"What's Pacific Heights like?"
"Compare the Marina and Mission"
"Which neighborhoods are family-friendly?"
```

Simple conversation, instant visual feedback.

## Features

- **🤖 Intelligent Conversation** - Natural language understanding powered by GPT-4o
- **🗺️ Live Map Integration** - Interactive visualization that responds to the conversation
- **⚡ Real-Time Streaming** - Responses stream in with elegant animations
- **🌃 Complete Coverage** - All 117 official San Francisco neighborhoods
- **🎨 Beautiful UI** - Dark mode support with smooth animations
- **📊 Data-Driven** - Objective information including crime statistics and amenities

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 with App Router |
| **Language** | TypeScript |
| **AI Engine** | OpenAI GPT-4o with function calling |
| **Maps** | Mapbox GL JS |
| **Database** | PostgreSQL with Prisma ORM |
| **Auth** | NextAuth.js |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Mapbox token ([get one here](https://account.mapbox.com/access-tokens/))

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/cdvillegas/chatsf.git
   cd chatsf
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/chatsf"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   OPENAI_API_KEY="sk-..."
   NEXT_PUBLIC_MAPBOX_TOKEN="pk...."
   ```

3. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. **Launch**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) 🚀

## Architecture

ChatSF uses a modular AI architecture where the agent orchestrates conversation flow and calls specialized tools (connectors) to interact with the map, analyze crime data, and query external sources. Responses stream to the client via server-sent events, with map updates happening instantly before text appears.

**Key components:**
- `lib/ai/agent.ts` - Core AI orchestration
- `lib/ai/connectors/` - Modular tools (map, crime, data)
- `app/api/chat/route.ts` - Streaming API endpoint
- `components/Map/MapContainer.tsx` - Interactive Mapbox visualization

## Development

**Commands:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
```

**Environment Variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Session encryption secret |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o access) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token |

## Deployment

Production-ready Docker configuration included:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Compatible with Vercel, Railway, Render, and standard container platforms.

## License

MIT License - feel free to use this project as you wish.

---

<div align="center">

**Built with ❤️ in San Francisco**

</div>
