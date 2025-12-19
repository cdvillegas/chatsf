/**
 * AI Agent Orchestrator
 * Handles OpenAI chat completions with function calling
 */

import OpenAI from 'openai';
import { getToolDefinitions, executeTool } from './connectors';
import type { VisualizationState } from '@/types/visualization';

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

const SYSTEM_PROMPT = `You are ChatSF, an intelligent data exploration assistant for San Francisco.

CORE CAPABILITIES:
- Answer questions with rich, contextual insights
- Create intelligent visualizations to enhance understanding
- Control maps, generate charts, and display data tables

VISUALIZATION DECISION FRAMEWORK:

**Use MAP when:**
- User asks about specific neighborhoods (select + zoom)
- Comparing 2-4 neighborhoods spatially (compare_on_map)
- Questions about location, distance, or geography (draw_route)
- Crime/safety questions (show_crime_overlay)

**Use BAR CHART when:**
- Comparing values across categories (crime by neighborhood, incidents by type)
- Rankings (safest neighborhoods, most common crimes)

**Use LINE CHART when:**
- Showing trends over time (crime trends, monthly patterns)
- Time series data

**Use PIE CHART when:**
- Showing proportions or percentages (crime breakdown, neighborhood distribution)

**Use TABLE when:**
- User needs detailed data to browse
- Multiple attributes per item (neighborhood stats)
- User says "show me the data" or "break it down"

**Use SCATTER PLOT when:**
- Exploring correlations (crime vs population density)
- Identifying outliers

**Use HEATMAP GRID when:**
- Time + category matrices (crime by hour and day of week)
- Intensity comparisons

MULTI-TURN WORKFLOW:
1. Fetch data using data connectors (neighborhood, crime, etc.)
2. Choose the BEST visualization for this specific query
3. Use visualization tools to create the view
4. Provide a clear, concise text explanation

RULES:
- Always create ONE visualization per response
- Let visualizations speak - keep text concise
- Don't ask permission - just create the best viz
- If user explicitly requests a viz type, use it
- Default to map for neighborhood questions, charts for data analysis`;

export async function chat(options: ChatOptions): Promise<{
  message: string;
  visualization?: VisualizationState;
}> {
  const { messages, maxIterations = 5 } = options;

  // Add system prompt if not present
  const fullMessages = messages[0]?.role === 'system' 
    ? messages 
    : [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages];

  let iteration = 0;
  let currentMessages = [...fullMessages];
  let visualization: VisualizationState | undefined;

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
      return {
        message: assistantMessage.content || 'I apologize, I couldn\'t generate a response.',
        visualization,
      };
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

      console.log(`🔧 Tool called: ${toolName}`, toolParams);

      try {
        const result = await executeTool(toolName, toolParams);
        
        console.log(`✅ Tool result for ${toolName}:`, typeof result, result ? JSON.stringify(result).substring(0, 200) : 'null');
        
        // Track visualization tool calls (render_* and map control tools)
        if (toolName.startsWith('render_') || 
            ['select_neighborhoods', 'zoom_to_area', 'compare_on_map', 'show_crime_overlay', 'draw_route', 'reset_map'].includes(toolName)) {
          try {
            // Parse the visualization state from the tool result
            visualization = JSON.parse(result);
            console.log(`📊 Visualization set:`, visualization.type);
          } catch (e) {
            console.error('Failed to parse visualization:', e, 'Result was:', result);
          }
        }
        
        currentMessages.push({
          role: 'tool' as any,
          content: typeof result === 'string' ? result : JSON.stringify(result),
          tool_call_id: toolCall.id,
        } as any);
      } catch (error) {
        console.error(`❌ Tool error for ${toolName}:`, error);
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
    visualization,
  };
}
