# Data Connectors

This directory contains extensible data connectors for the AI agent. Each connector provides tools that the AI can use to answer questions about San Francisco.

## Architecture

```
src/lib/ai/
├── agent.ts              # Main AI orchestrator with OpenAI
├── connectors/
│   ├── base.ts          # Base connector interface
│   ├── index.ts         # Connector registry
│   ├── neighborhoods.ts # SF neighborhoods data
│   ├── datasf.ts        # DataSF open data APIs
│   └── [your-new-connector].ts
```

## How It Works

1. **Connectors** provide **tools** (functions) that the AI can call
2. **Tools** are automatically registered and exposed to OpenAI's function calling
3. When a user asks a question, the AI decides which tools to use
4. Results are returned to the AI, which formulates a natural language response

## Creating a New Connector

### 1. Create Your Connector File

```typescript
// src/lib/ai/connectors/weather.ts

import { z } from 'zod';
import { BaseConnector, ConnectorTool } from './base';

export class WeatherConnector extends BaseConnector {
  name = 'Weather';
  description = 'Access San Francisco weather data';

  tools: ConnectorTool[] = [
    {
      name: 'get_current_weather',
      description: 'Get current weather conditions in San Francisco',
      parameters: z.object({
        include_forecast: z.boolean().optional().describe('Include 7-day forecast'),
      }),
      execute: async (params) => {
        // Your implementation here
        const response = await fetch('https://api.weather.gov/...');
        const data = await response.json();
        
        return {
          temperature: data.temp,
          conditions: data.conditions,
          // ... more data
        };
      },
    },
    // Add more tools...
  ];
}
```

### 2. Register Your Connector

```typescript
// src/lib/ai/connectors/index.ts

import { WeatherConnector } from './weather';

const connectors: BaseConnector[] = [
  new NeighborhoodsConnector(),
  new DataSFConnector(),
  new WeatherConnector(), // ← Add your connector here
];
```

That's it! Your connector is now available to the AI.

## Existing Connectors

### NeighborhoodsConnector

Provides access to SF neighborhood data from the database.

**Tools:**
- `search_neighborhoods` - Search by name or characteristics
- `get_neighborhood_details` - Get detailed info about a neighborhood
- `compare_neighborhoods` - Compare multiple neighborhoods
- `get_top_neighborhoods` - Get top-rated neighborhoods by category

**Example Questions:**
- "What neighborhoods have the best food?"
- "Compare Marina and Mission"
- "Tell me about Noe Valley"

### DataSFConnector

Provides access to San Francisco open data via DataSF APIs.

**Tools:**
- `get_crime_data` - Get recent crime incidents
- `get_crime_statistics` - Get aggregated crime stats
- `get_311_cases` - Get 311 service requests

**Example Questions:**
- "What's the crime rate in Tenderloin?"
- "Show me recent 311 cases in SOMA"
- "Which neighborhoods have the most burglaries?"

## Tool Best Practices

### 1. Clear Descriptions

```typescript
{
  name: 'get_crime_data',
  description: 'Get recent crime incidents in San Francisco, optionally filtered by neighborhood or category',
  // ✅ Clear what it does and what filters are available
}
```

### 2. Well-Defined Parameters

```typescript
parameters: z.object({
  neighborhood: z.string().optional().describe('Filter by neighborhood name'),
  category: z.string().optional().describe('Crime category (e.g., "Larceny Theft", "Assault")'),
  limit: z.number().optional().default(50).describe('Maximum number of incidents to return'),
})
```

### 3. Structured Responses

```typescript
return {
  incidents: [...],
  count: data.length,
  filters: { neighborhood, category },
};
// ✅ Consistent, parseable structure
```

### 4. Error Handling

```typescript
try {
  const response = await fetch(...);
  if (!response.ok) {
    return { error: 'Failed to fetch data', status: response.status };
  }
  // ... process data
} catch (error) {
  return { error: 'Request failed', message: String(error) };
}
```

## Ideas for New Connectors

### Transit Connector
- Real-time MUNI schedules
- BART arrival times
- Bike share availability
- Parking availability

### Housing Connector
- Rental prices by neighborhood
- Recent home sales
- Zillow/Redfin integration
- Housing market trends

### Events Connector
- Upcoming events in SF
- Concerts, festivals, sports
- Neighborhood-specific events
- Weekly recurring events

### Demographics Connector
- Population statistics
- Income levels
- Age distribution
- Education levels

### Food Connector
- Yelp integration
- Restaurant counts by neighborhood
- Cuisine types
- Price ranges

### Parks & Recreation Connector
- Park locations and ratings
- Hiking trails
- Playgrounds
- Sports facilities

## Testing Your Connector

1. **Test in isolation:**
   ```typescript
   const connector = new YourConnector();
   const result = await connector.executeTool('your_tool_name', { param: 'value' });
   console.log(result);
   ```

2. **Test with AI:**
   - Start the dev server: `npm run dev`
   - Open the chat interface
   - Ask a question that would use your connector
   - Check the console logs to see if your tool is called

3. **Check responses:**
   - Is the data accurate?
   - Is it formatted clearly?
   - Does the AI understand how to present it?

## Performance Tips

1. **Cache external API calls** when possible
2. **Limit result sizes** (use pagination)
3. **Use database indexes** for fast queries
4. **Return only necessary data** (don't over-fetch)
5. **Handle rate limits** gracefully

## Questions?

The connector system is designed to be simple and extensible. If you have ideas for new connectors or need help implementing one, just add it and test it out!

Happy building! 🚀
