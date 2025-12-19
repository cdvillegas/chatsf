'use client';

import { HeatmapGridVisualization } from '@/types/visualization';

interface HeatmapGridViewProps {
  data: HeatmapGridVisualization['data'];
  options?: HeatmapGridVisualization['options'];
  title?: string;
}

export default function HeatmapGridView({ data, options, title }: HeatmapGridViewProps) {
  // Find min and max values for color scaling
  const allValues = data.values.flat();
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const getColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    
    switch (options?.colorScale) {
      case 'blue':
        return `rgba(59, 130, 246, ${normalized})`;
      case 'green':
        return `rgba(34, 197, 94, ${normalized})`;
      case 'red':
        return `rgba(239, 68, 68, ${normalized})`;
      case 'gradient':
      default:
        // Green -> Yellow -> Red gradient
        if (normalized < 0.5) {
          const r = Math.floor(normalized * 2 * 255);
          return `rgb(${r}, 255, 0)`;
        } else {
          const g = Math.floor((1 - normalized) * 2 * 255);
          return `rgb(255, ${g}, 0)`;
        }
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: '40px',
      overflowY: 'auto',
      background: 'var(--bg-primary)'
    }}>
      {title && (
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '24px',
        }}>
          {title}
        </h2>
      )}
      <div style={{ 
        overflowX: 'auto',
        display: 'inline-block',
        minWidth: '100%',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `auto repeat(${data.xLabels.length}, 1fr)`,
          gap: '2px',
          background: 'var(--border-primary)',
          padding: '2px',
          borderRadius: '8px',
        }}>
          {/* Top-left empty cell */}
          <div style={{ 
            padding: '12px',
            background: 'var(--bg-secondary)',
            minWidth: '120px',
          }} />
          
          {/* Column headers */}
          {data.xLabels.map((label, idx) => (
            <div
              key={`x-${idx}`}
              style={{
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                minWidth: '80px',
              }}
            >
              {label}
            </div>
          ))}
          
          {/* Rows */}
          {data.yLabels.map((yLabel, yIdx) => (
            <>
              {/* Row header */}
              <div
                key={`y-${yIdx}`}
                style={{
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {yLabel}
              </div>
              
              {/* Cell values */}
              {data.values[yIdx].map((value, xIdx) => (
                <div
                  key={`cell-${yIdx}-${xIdx}`}
                  style={{
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: value > (maxValue - minValue) / 2 + minValue ? 'white' : 'var(--text-primary)',
                    textAlign: 'center',
                    background: getColor(value),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '48px',
                  }}
                >
                  {options?.showValues !== false && value.toFixed(0)}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
