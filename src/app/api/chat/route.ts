/**
 * Chat API Route
 * Handles streaming chat responses from the AI agent
 */

import { NextRequest } from 'next/server';
import { chat } from '@/lib/ai/agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the AI response
    const result = await chat({ messages });

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // FIRST: Send visualization immediately if available
        if (result.visualization) {
          const vizData = JSON.stringify({
            content: '',
            visualization: result.visualization,
            done: false,
          });
          controller.enqueue(encoder.encode(`data: ${vizData}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to ensure it's processed
        }

        // THEN: Stream the message text
        const text = result.message;
        const chunkSize = 5;
        
        for (let i = 0; i < text.length; i += chunkSize) {
          const chunk = text.slice(i, i + chunkSize);
          const data = JSON.stringify({
            content: chunk,
            done: i + chunkSize >= text.length,
          });
          
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
