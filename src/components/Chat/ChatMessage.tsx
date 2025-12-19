'use client';

import React from 'react';
import type { Message, VisualizationType } from '@/types/visualization';

interface ChatMessageProps {
  message: Message;
  isSelected: boolean;
  onSelect: (messageId: string) => void;
}

function getVizLabel(type: VisualizationType): string {
  const labels = {
    map: 'Map view',
    bar: 'Bar chart',
    line: 'Line chart',
    pie: 'Pie chart',
    scatter: 'Scatter plot',
    table: 'Data table',
    heatmapGrid: 'Heatmap'
  };
  return labels[type];
}

export default function ChatMessage({ message, isSelected, onSelect }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasVisualization = !!message.visualization;

  return (
    <div
      onClick={() => hasVisualization && onSelect(message.id)}
      style={{
        padding: '16px 0',
        animation: 'fadeIn 0.3s ease-out',
        cursor: hasVisualization ? 'pointer' : 'default',
        background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
        borderRadius: '8px',
        transition: 'background 0.15s ease',
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
          <div
            style={{
              color: 'var(--text-primary)',
              fontSize: '15px',
              lineHeight: '1.6',
              fontWeight: '400',
            }}
          >
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.content}
            </div>
          </div>
          
          {/* Visualization indicator */}
          {hasVisualization && (
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}>
              📊 {getVizLabel(message.visualization.type)}
            </div>
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
