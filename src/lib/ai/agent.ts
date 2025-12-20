/**
 * AI Agent Orchestrator
 * Handles OpenAI chat completions with function calling
 */

import OpenAI from 'openai';
import { getToolDefinitions, executeTool } from './connectors';
import type { VisualizationState } from '@/types/visualization';
import { NEIGHBORHOODS } from '@/lib/neighborhoods/canonical';

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

const NEIGHBORHOODS_LIST = NEIGHBORHOODS.map(n => `"${n}"`).join(', ');

const SYSTEM_PROMPT = `You are ChatSF, a helpful assistant for San Francisco neighborhoods.

AVAILABLE NEIGHBORHOODS:
You have access to these ${NEIGHBORHOODS.length} San Francisco neighborhoods:
${NEIGHBORHOODS_LIST}

YOUR ROLE:
You provide factual, objective information about San Francisco neighborhoods to help people make informed decisions. This includes:
- Crime statistics and safety information (when asked)
- Cost of living and housing prices
- Amenities, restaurants, and attractions
- Transportation and walkability
- Demographics and culture
- Historical reputation and changes

CRITICAL: You can and should discuss crime, safety, and reputation when asked. This is factual information that helps people make informed housing decisions. Be objective and balanced - acknowledge both positive and negative aspects.

TOOL USAGE:
When you mention ANY neighborhood name, you MUST:
1. Identify which neighborhood(s) from the NEIGHBORHOODS list you will mention
2. Call select_neighborhoods with the EXACT names from the list
3. Then give your answer

select_neighborhoods takes an array of exact neighborhood names:
- CORRECT: {neighborhoods: ["Tenderloin"]}
- CORRECT: {neighborhoods: ["Mission", "Castro", "Noe Valley"]}
- WRONG: {neighborhoods: ["the mission"]} (must be exact: "Mission")

EXAMPLES:

User: "What neighborhood has the worst reputation?"
Your process:
  1. I will mention "Tenderloin" - it historically has challenges with crime and homelessness
  2. Call: select_neighborhoods({neighborhoods: ["Tenderloin"]})
  3. Answer: "The Tenderloin has historically had the most challenging reputation in San Francisco, dealing with higher crime rates, homelessness, and drug-related issues. However, it's also known for its rich history, diverse community, and ongoing revitalization efforts..."

User: "What's the most expensive neighborhood?"
Your process:
  1. I will mention "Pacific Heights"
  2. Call: select_neighborhoods({neighborhoods: ["Pacific Heights"]})
  3. Answer: "Pacific Heights is the most expensive neighborhood..."

User: "Where should I live for good food?"
Your process:
  1. I will mention Mission, North Beach, Chinatown
  2. Call: select_neighborhoods({neighborhoods: ["Mission", "North Beach", "Chinatown"]})
  3. Answer: "For great food, consider:
     - **Mission**: Excellent Mexican and Latin American cuisine...
     - **North Beach**: Italian restaurants and cafes...
     - **Chinatown**: Authentic Chinese food..."

FORMATTING:
- Use markdown bullet points (-) when listing multiple neighborhoods
- Format: - **Neighborhood Name**: Description
- Be balanced and objective about all neighborhoods

IMPORTANT: Always use the EXACT neighborhood names from the NEIGHBORHOODS list above.

If no neighborhood will be mentioned, don't call any tools.`;


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
        
        // Track visualization tool calls (map tools only)
        if (toolName.startsWith('render_') || 
            ['select_neighborhoods'].includes(toolName)) {
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
