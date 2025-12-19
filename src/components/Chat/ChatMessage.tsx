'use client';

import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

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
        {!isUser && (
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
        )}
        {isUser && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--button-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--bg-primary)',
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            You
          </div>
        )}
        <div style={{ flex: 1, paddingTop: '4px' }}>
          <div
            style={{
              color: 'var(--text-primary)',
              fontSize: '15px',
              lineHeight: '1.6',
              fontWeight: '400',
            }}
          >
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {content}
            </div>
          </div>
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
