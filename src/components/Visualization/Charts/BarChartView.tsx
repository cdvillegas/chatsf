'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartVisualization } from '@/types/visualization';

interface BarChartViewProps {
  data: ChartVisualization['data'];
  options?: ChartVisualization['options'];
  title?: string;
}

export default function BarChartView({ data, options, title }: BarChartViewProps) {
  // Transform data for Recharts
  const chartData = data.labels.map((label, i) => ({
    name: label,
    ...data.datasets.reduce((acc, dataset, idx) => ({
      ...acc,
      [`dataset${idx}`]: dataset.data[i]
    }), {})
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
        <BarChart data={chartData}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border-primary)" 
            opacity={0.3}
          />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-secondary)"
            style={{ fontSize: '13px' }}
            label={options?.xAxisLabel ? { value: options.xAxisLabel, position: 'bottom' } : undefined}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            style={{ fontSize: '13px' }}
            label={options?.yAxisLabel ? { value: options.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              color: 'var(--text-primary)'
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          {(options?.showLegend !== false) && <Legend />}
          {data.datasets.map((dataset, idx) => (
            <Bar 
              key={idx} 
              dataKey={`dataset${idx}`}
              name={dataset.label}
              fill={dataset.backgroundColor as string || `hsl(${idx * 60}, 70%, 50%)`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
