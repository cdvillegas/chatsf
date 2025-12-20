'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/types/visualization';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export default function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasVisualization = !!message.visualization;

  return (
    <div
      style={{
        padding: '16px 0',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        alignItems: 'flex-start',
      }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isUser ? 'var(--button-primary)' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--bg-primary)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {isUser ? 'U' : 'C'}
        </div>
        <div style={{ flex: 1, paddingTop: '4px' }}>
          {isLoading && message.content === '' ? (
            // Show loading dots while waiting for stream
            <div style={{ paddingTop: '4px', display: 'flex', gap: '4px' }}>
              <span className="loading-dot"></span>
              <span className="loading-dot" style={{ animationDelay: '0.2s' }}></span>
              <span className="loading-dot" style={{ animationDelay: '0.4s' }}></span>
            </div>
          ) : (
            <>
              <div
                className="chat-message-content"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  fontWeight: '400',
                }}
              >
                {isUser ? (
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {message.content}
                  </div>
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p style={{ margin: '0 0 12px 0' }}>{children}</p>,
                      strong: ({children}) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                      ol: ({children}) => <ol style={{ margin: '0 0 12px 0', paddingLeft: '24px', listStyleType: 'decimal' }}>{children}</ol>,
                      ul: ({children}) => <ul style={{ margin: '0 0 12px 0', paddingLeft: '24px', listStyleType: 'disc' }}>{children}</ul>,
                      li: ({children}) => <li style={{ marginBottom: '6px', display: 'list-item' }}>{children}</li>,
                      code: ({children}) => (
                        <code style={{
                          background: 'var(--bg-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'monospace'
                        }}>
                          {children}
                        </code>
                      ),
                      pre: ({children}) => (
                        <pre style={{
                          background: 'var(--bg-secondary)',
                          padding: '12px',
                          borderRadius: '6px',
                          overflow: 'auto',
                          margin: '0 0 12px 0'
                        }}>
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
          
              {/* Visualization indicator - shows when neighborhood is selected */}
              {hasVisualization && message.visualization.config.selectedNeighborhoods && message.visualization.config.selectedNeighborhoods.length > 0 && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                }}>
                  📍 {message.visualization.config.selectedNeighborhoods.join(', ')}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
