'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import type { Message, VisualizationState } from '@/types/visualization';

interface ChatInterfaceProps {
  onVisualizationChange?: (viz: VisualizationState | null) => void;
}

const SUGGESTED_QUESTIONS = [
  "What are the safest neighborhoods?",
  "Where should I live for good food?",
  "Compare Marina vs Mission",
  "Show me crime in the Tenderloin",
];

export default function ChatInterface({ 
  onVisualizationChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setShowSuggestions(false);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create placeholder for assistant message with loading state
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '', // Empty content means show loading dots
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Call chat API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let visualizationUpdated = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Update visualization immediately when received
                if (data.visualization && !visualizationUpdated) {
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessageId
                        ? { ...m, visualization: data.visualization }
                        : m
                    )
                  );
                  onVisualizationChange?.(data.visualization);
                  visualizationUpdated = true;
                }
                
                // Accumulate text content
                if (data.content) {
                  accumulatedContent += data.content;
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedContent }
                        : m
                    )
                  );
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      // Replace the loading message with error
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessageId
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    handleSend(question);
  };

  return (
    <div
      ref={chatContainerRef}
      style={{
        position: 'fixed',
        right: '0',
        top: '64px',
        bottom: '0',
        width: '480px',
        background: 'var(--bg-primary)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        borderLeft: '1px solid var(--border-primary)',
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: messages.length > 0 ? '20px' : '0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && showSuggestions ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            padding: '40px 20px',
          }}>
            <h3
              style={{
                fontSize: '28px',
                fontWeight: '400',
                color: 'var(--text-primary)',
                margin: '0 0 32px 0',
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}
            >
              What would you like to know?
            </h3>

            <div style={{ width: '100%', maxWidth: '360px' }}>
              {SUGGESTED_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(question)}
                  className="chat-button"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    marginBottom: '10px',
                    fontSize: '14px',
                    textAlign: 'left',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    lineHeight: '1.4',
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLoading={isLoading && message.content === ''}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />

    </div>
  );
}
