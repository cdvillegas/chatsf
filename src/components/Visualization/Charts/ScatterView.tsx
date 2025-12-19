'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartVisualization } from '@/types/visualization';

interface ScatterViewProps {
  data: ChartVisualization['data'];
  options?: ChartVisualization['options'];
  title?: string;
}

export default function ScatterView({ data, options, title }: ScatterViewProps) {
  // Transform data for scatter plot
  const chartData = data.labels.map((label, i) => ({
    name: label,
    x: data.datasets[0]?.data[i] || 0,
    y: data.datasets[1]?.data[i] || 0,
  }));

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
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
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border-primary)"
            opacity={0.3}
          />
          <XAxis 
            dataKey="x" 
            stroke="var(--text-secondary)"
            type="number"
            style={{ fontSize: '13px' }}
            label={options?.xAxisLabel ? { value: options.xAxisLabel, position: 'bottom' } : undefined}
          />
          <YAxis 
            dataKey="y"
            stroke="var(--text-secondary)"
            type="number"
            style={{ fontSize: '13px' }}
            label={options?.yAxisLabel ? { value: options.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              color: 'var(--text-primary)'
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          {(options?.showLegend !== false) && <Legend />}
          <Scatter 
            name={data.datasets[0]?.label || 'Data Points'} 
            data={chartData} 
            fill="hsl(220, 70%, 50%)"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
