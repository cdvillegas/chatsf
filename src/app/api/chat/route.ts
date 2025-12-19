/**
 * Chat API Route
 * Handles streaming chat responses from the AI agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { chat } from '@/lib/ai/agent';

export async function POST(req: NextRequest) {
  try {
    // Check authentication (optional - you can make this public)
    const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    // Call the AI agent
    const response = await chat({ messages });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', message: String(error) },
      { status: 500 }
    );
  }
}
