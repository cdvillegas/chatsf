<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.png">
  <img src="public/logo-light.png" alt="ChatSF logo" width="96">
</picture>

# ChatSF

**Talk to a map of San Francisco.**

Ask about any of the city's 117 neighborhoods in plain English — the AI answers while the map highlights, zooms, and visualizes exactly what it's talking about.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-function%20calling-412991?logo=openai&logoColor=white)](https://platform.openai.com/docs/guides/function-calling)
[![Mapbox](https://img.shields.io/badge/Mapbox-GL%20JS-000000?logo=mapbox&logoColor=white)](https://docs.mapbox.com/mapbox-gl-js)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)](https://www.prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<br>

<img src="docs/hero.png" alt="ChatSF — interactive San Francisco neighborhood map with a chat panel" width="900">

<sub>A personal experiment in pairing an LLM agent with a live, conversational map.</sub>

</div>

---

## ✨ What it does

Most "AI + maps" demos bolt a chatbot next to a map. In ChatSF, **the conversation drives the map**. The agent decides which neighborhoods matter to your question, selects them on the map before the text even finishes streaming, and pulls real city data to back up its answer.

> **"Where should I live if I want great food and a quiet street?"**
> **"What's Pacific Heights actually like?"**
> **"Compare the Marina and the Mission on safety."**
> **"Which neighborhoods have had the most car break-ins this year?"**

## 🧭 Features

|  |  |
|---|---|
| 💬 **Conversational** | Ask follow-ups, compare places, change your mind — it keeps context. |
| 🗺️ **Map that listens** | Neighborhoods highlight and the camera flies to them as the agent answers. |
| ⚡ **Streaming** | Map updates land first, then the response streams in over server-sent events. |
| 🚨 **Real city data** | Crime incidents, trends, hotspots, and 311 cases from [DataSF](https://datasf.org). |
| 🌃 **Full coverage** | All 117 official San Francisco neighborhoods, with real boundaries. |
| 🌗 **Light & dark** | A clean UI that looks good either way. |

## 🧠 How it works

ChatSF is built around a small **agent loop**. The model never touches the map or the data directly — it calls **tools**, and each tool lives in a pluggable **connector**.

```mermaid
flowchart LR
    U([You]) -->|question| C[Chat API<br/>SSE stream]
    C --> A{{AI agent<br/>OpenAI tool calling}}
    A -->|select_neighborhoods| M[Map connector]
    A -->|crime stats, trends, hotspots| K[Crime connector]
    A -->|incidents, 311 cases| D[DataSF connector]
    K --> DB[(PostgreSQL)]
    D --> API[(data.sfgov.org)]
    M -->|highlight + zoom| UI[Mapbox map]
    A -->|streamed answer| UI
```

**Tools the agent can call**

| Connector | Tools |
|---|---|
| **Map** | `select_neighborhoods` |
| **Crime** | `get_crime_by_neighborhood` · `compare_neighborhood_safety` · `get_safest_neighborhoods` · `get_crime_trends` · `get_crime_hotspots` |
| **DataSF** | `get_crime_data` · `get_crime_statistics` · `get_311_cases` |

Adding a new data source is one file — see the [connector guide](src/lib/ai/connectors/README.md).

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| AI | OpenAI chat completions with function calling |
| Maps | Mapbox GL JS |
| Data | PostgreSQL + Prisma, DataSF open data |
| Auth | NextAuth.js |
| Styling | Tailwind CSS 4 |

## 🚀 Run it locally

**You'll need:** Node.js 18+, PostgreSQL, an [OpenAI API key](https://platform.openai.com/api-keys), and a [Mapbox token](https://account.mapbox.com/access-tokens/).

```bash
git clone https://github.com/cdvillegas/chatsf.git
cd chatsf
npm install
cp .env.example .env.local   # then fill in your keys
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chatsf"
NEXTAUTH_SECRET="any-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_MAPBOX_TOKEN="pk...."
```

```bash
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Open [localhost:3000](http://localhost:3000) and start asking.

<details>
<summary><b>Prefer Docker?</b></summary>

```bash
docker-compose up -d
```

A production compose file is also included: `docker-compose -f docker-compose.prod.yml up -d`.

</details>

## 📁 Project structure

```
src/
├── app/api/chat/          # Streaming chat endpoint (SSE)
├── components/
│   ├── Chat/              # Chat UI
│   └── Map/               # Mapbox map
└── lib/ai/
    ├── agent.ts           # Agent loop + system prompt
    └── connectors/        # Map, crime, and DataSF tools
```

## 📄 License

[MIT](LICENSE) © Chris Villegas

<div align="center">
<br>
<sub>Built in San Francisco 🌉</sub>
</div>
