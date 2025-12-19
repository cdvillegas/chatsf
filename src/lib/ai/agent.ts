/**
 * AI Agent Orchestrator
 * Handles OpenAI chat completions with function calling
 */

import OpenAI from 'openai';
import { getToolDefinitions, executeTool } from './connectors';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: any;
  tool_calls?: any[];
}

export interface ChatOptions {
  messages: Message[];
  maxIterations?: number;
}

const SYSTEM_PROMPT = `You are ChatSF, an AI assistant that helps people learn about San Francisco neighborhoods and city data.

You have access to several tools to help answer questions:
- Search and get details about SF neighborhoods
- Compare neighborhoods side by side
- Get crime data and statistics (2015-2018)
- Access 311 service requests
- Analyze crime trends and safety

When users ask questions:
1. Use the appropriate tools to gather data
2. Provide clear, helpful answers with specific details
3. Be conversational and friendly, but concise
4. If you don't have data, say so honestly
5. Format responses cleanly and professionally

Always explain your reasoning when providing neighborhood recommendations.

For map interactions, neighborhoods will be automatically highlighted when you mention them by name.`;

export async function chat(options: ChatOptions): Promise<{
  message: string;
  toolCalls?: any[];
  highlightNeighborhoods?: string[];
  mapAction?: {
    type: 'showHeatmap' | 'showNeighborhoods';
    data?: any;
  };
}> {
  const { messages, maxIterations = 5 } = options;

  // Add system prompt if not present
  const fullMessages = messages[0]?.role === 'system' 
    ? messages 
    : [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages];

  let iteration = 0;
  let currentMessages = [...fullMessages];
  let usedCrimeHotspots = false;
  let crimeHotspotData: any = null;

  while (iteration < maxIterations) {
    iteration++;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: currentMessages as any,
      tools: getToolDefinitions(),
      tool_choice: 'auto',
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0].message;

    // If no tool calls, return the response
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      const result: any = {
        message: assistantMessage.content || 'I apologize, I couldn\'t generate a response.',
        highlightNeighborhoods: extractNeighborhoods(assistantMessage.content || ''),
      };
      
      // Add heat map action if crime hotspots were used
      if (usedCrimeHotspots && crimeHotspotData) {
        result.mapAction = {
          type: 'showHeatmap' as const,
          data: crimeHotspotData,
        };
      }
      
      return result;
    }

    // Execute all tool calls
    currentMessages.push({
      role: 'assistant',
      content: assistantMessage.content || '',
      tool_calls: assistantMessage.tool_calls,
    } as any);

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const toolParams = JSON.parse(toolCall.function.arguments);

      try {
        const result = await executeTool(toolName, toolParams);
        
        // Track if crime hotspots tool was used
        if (toolName === 'get_crime_hotspots') {
          usedCrimeHotspots = true;
          crimeHotspotData = result.geoJson;
        }
        
        currentMessages.push({
          role: 'tool' as any,
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
        } as any);
      } catch (error) {
        currentMessages.push({
          role: 'tool' as any,
          content: JSON.stringify({ error: String(error) }),
          tool_call_id: toolCall.id,
        } as any);
      }
    }
  }

  // If we hit max iterations, return a fallback
  return {
    message: 'I needed to gather a lot of information. Let me summarize what I found...',
  };
}

/**
 * Extract neighborhood names/slugs from AI response for map highlighting
 */
function extractNeighborhoods(content: string): string[] {
  const neighborhoods: string[] = [];
  
  // Common SF neighborhood patterns
  const patterns = [
    /\b(Mission|Marina|Castro|SOMA|SoMa|Nob Hill|Russian Hill|Pacific Heights|Haight|Sunset|Richmond|Presidio|Financial District|North Beach|Chinatown|Tenderloin|Hayes Valley|Potrero Hill|Dogpatch|Bernal Heights|Glen Park|Noe Valley|Twin Peaks|Excelsior|Bayview|Visitacion Valley)\b/gi,
  ];

  patterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const hood = match[0].toLowerCase().replace(/\s+/g, '-');
      if (!neighborhoods.includes(hood)) {
        neighborhoods.push(hood);
      }
    }
  });

  return neighborhoods;
}
