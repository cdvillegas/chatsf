<div align="center">

<img src="public/logo-dark.png" alt="ChatSF" width="60" align="left" style="margin-right: 20px;"/>

# ChatSF

### Your AI guide to San Francisco neighborhoods

*Natural conversation meets interactive maps. Explore 117 neighborhoods through intelligent chat.*

<br clear="left"/>

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started)

</div>

---

## Overview

ChatSF transforms how you explore San Francisco. Ask questions about neighborhoods in natural language, and watch as the map responds—highlighting areas, zooming to locations, and providing thoughtful, data-driven insights.

Unlike static guides or overwhelming data tables, ChatSF understands context. It knows when you ask about "the Marina" versus "where families live," and responds with relevant information while visualizing neighborhoods in real-time.

### Ask Anything

```
→ "Where should I live for good food?"
→ "What's Pacific Heights like?"
→ "Compare the Marina and Mission neighborhoods"
→ "Which neighborhood has the best parks?"
```

The AI highlights neighborhoods as it discusses them, creating a seamless exploration experience.

---

## Features

### 🤖 **Intelligent Conversation**
Natural language understanding powered by GPT-4o. Ask follow-up questions, compare neighborhoods, or dive deep into specific areas.

### 🗺️ **Live Map Integration**
Interactive Mapbox visualization that responds to the conversation. Neighborhoods highlight as they're discussed, with smooth zoom animations and transitions.

### ⚡ **Real-Time Streaming**
Responses stream in character-by-character with elegant animations. Map updates happen instantly, before text appears.

### 🌃 **Complete Coverage**
All 117 official San Francisco neighborhoods, from Alamo Square to Yerba Buena, with accurate boundaries and data.

### 🎨 **Beautiful UI**
Thoughtfully designed interface with dark mode support, responsive layouts, and smooth animations throughout.

### 📊 **Data-Driven Insights**
Objective information about neighborhoods including crime statistics, amenities, and local characteristics.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 with App Router |
| **Language** | TypeScript |
| **AI Engine** | OpenAI GPT-4o with function calling |
| **Maps** | Mapbox GL JS |
| **Database** | PostgreSQL with Prisma ORM |
| **Auth** | NextAuth.js |
| **Styling** | CSS Modules with theme system |
| **Deployment** | Docker-ready with production configs |

---

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** database
- **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))
- **Mapbox token** ([get one here](https://account.mapbox.com/access-tokens/))

### Quick Start

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

---

## Architecture

### AI Agent System

The AI system uses a modular, tool-based architecture:

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AI Agent      │ ◄── System prompt with SF context
│   (GPT-4o)      │ ◄── Conversation history
└────────┬────────┘
         │
         ├──► Map Connector (highlights neighborhoods)
         ├──► Crime Connector (analyzes data)
         └──► DataSF Connector (external queries)
         │
         ▼
┌─────────────────┐
│  Streaming API  │ ◄── Server-sent events
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Chat + Map UI  │ ◄── Real-time updates
└─────────────────┘
```

**Key Components:**

- **Agent** (`lib/ai/agent.ts`) - Orchestrates the conversation, manages tool calls, and maintains context
- **Connectors** (`lib/ai/connectors/`) - Modular tools that extend the AI's capabilities
- **Streaming** (`app/api/chat/route.ts`) - Delivers responses in real-time via SSE

### Map System

The map visualization layer:

1. **Data Loading** - 117 neighborhood GeoJSON features with crime statistics
2. **Dynamic Styling** - Theme-aware colors, hover states, and selection highlights
3. **Camera Control** - Smart zoom behavior for single or multiple neighborhoods
4. **State Management** - Persistent selection tracking with feature IDs

---

## Project Structure

```
chatsf/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/         # NextAuth endpoints
│   │   │   ├── chat/         # Streaming chat API
│   │   │   └── crime/        # Crime data endpoints
│   │   ├── layout.tsx        # Root layout with theme
│   │   └── page.tsx          # Main chat interface
│   │
│   ├── components/
│   │   ├── Auth/             # Sign-in modal, navbar
│   │   ├── Chat/             # Message list, input, streaming
│   │   ├── Map/              # Mapbox container
│   │   └── Visualization/    # Data panels
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── agent.ts      # Core AI orchestration
│   │   │   └── connectors/   # Tool implementations
│   │   ├── neighborhoods/
│   │   │   └── canonical.ts  # SF neighborhood list & matching
│   │   ├── auth.ts           # NextAuth config
│   │   └── prisma.ts         # Database client
│   │
│   ├── contexts/
│   │   └── ThemeContext.tsx  # Dark/light mode
│   │
│   └── types/                # TypeScript definitions
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Initial data
│
├── public/
│   ├── sf-neighborhoods.json # GeoJSON boundaries
│   └── *.png                 # Assets
│
└── scripts/
    └── import-crime-data.ts  # Data import utilities
```

---

## Development

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Run production server |
| `npm run lint` | Check code with ESLint |
| `npx prisma studio` | Open database GUI |
| `npx prisma db push` | Sync schema to database |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✓ | Random secret for session encryption |
| `NEXTAUTH_URL` | ✓ | Base URL (e.g., `http://localhost:3000`) |
| `OPENAI_API_KEY` | ✓ | OpenAI API key with GPT-4o access |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | ✓ | Mapbox public access token |

---

## Deployment

### Docker

Production-ready Docker configuration included:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Platform Deployment

Compatible with:
- **Vercel** - Zero-config Next.js deployment
- **Railway** - Managed PostgreSQL included
- **Render** - Docker or native builds
- **AWS/GCP/Azure** - Standard container deployment

---

## Design Philosophy

ChatSF is built on three principles:

1. **Conversation First** - Natural language is the interface. No learning curve.
2. **Visual Feedback** - The map isn't decoration—it's part of the conversation.
3. **Thoughtful Responses** - Balanced, factual information without editorializing.

The goal is to make exploring a city feel like talking to a knowledgeable local friend, not querying a database.

---

## License

MIT License - feel free to use this project as you wish.

---

<div align="center">

**Built with ❤️ in San Francisco**

</div>
