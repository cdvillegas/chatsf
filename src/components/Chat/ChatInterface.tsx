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
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
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

    try {
      // Call chat API
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

      const data = await response.json();

      // Add assistant message with visualization
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        visualization: data.visualization,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Auto-select the new message if it has a visualization
      if (data.visualization) {
        setSelectedMessageId(assistantMessage.id);
        onVisualizationChange?.(data.visualization);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    handleSend(question);
  };

  // Handle message selection
  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
    const message = messages.find(m => m.id === messageId);
    if (message?.visualization) {
      onVisualizationChange?.(message.visualization);
    }
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
                isSelected={selectedMessageId === message.id}
                onSelect={handleMessageSelect}
              />
            ))}
            {isLoading && (
              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--bg-primary)',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    C
                  </div>
                  <div style={{ flex: 1, paddingTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span className="loading-dot"></span>
                      <span className="loading-dot" style={{ animationDelay: '0.2s' }}></span>
                      <span className="loading-dot" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />

    </div>
  );
}
