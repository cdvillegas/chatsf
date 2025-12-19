'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onNeighborhoodsHighlight?: (neighborhoods: string[]) => void;
  onMapAction?: (action: any) => void;
  isVisible?: boolean;
  onToggle?: () => void;
}

const SUGGESTED_QUESTIONS = [
  "What are the safest neighborhoods?",
  "Where should I live for good food?",
  "Compare Marina vs Mission",
  "Show me crime in the Tenderloin",
];

export default function ChatInterface({ 
  onNeighborhoodsHighlight,
  onMapAction,
  isVisible = true,
  onToggle 
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

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Highlight neighborhoods on map if provided
      if (data.highlightNeighborhoods && data.highlightNeighborhoods.length > 0) {
        onNeighborhoodsHighlight?.(data.highlightNeighborhoods);
      }
      
      // Trigger map action if provided (e.g., show heat map)
      if (data.mapAction) {
        onMapAction?.(data.mapAction);
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

  return (
    <div
      ref={chatContainerRef}
      style={{
        position: 'fixed',
        right: isVisible ? '0' : '-480px',
        top: '64px',
        bottom: '0',
        width: '480px',
        background: 'var(--bg-primary)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderLeft: '1px solid var(--border-primary)',
      }}
    >
      {/* Header - Minimal */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={onToggle}
          className="theme-toggle"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          ✕
        </button>
      </div>

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
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
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
                      background: 'var(--accent-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '500',
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
