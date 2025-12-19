'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartVisualization } from '@/types/visualization';

interface LineChartViewProps {
  data: ChartVisualization['data'];
  options?: ChartVisualization['options'];
  title?: string;
}

export default function LineChartView({ data, options, title }: LineChartViewProps) {
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
        <LineChart data={chartData}>
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
            <Line 
              key={idx} 
              type="monotone"
              dataKey={`dataset${idx}`}
              name={dataset.label}
              stroke={dataset.borderColor || `hsl(${idx * 60}, 70%, 50%)`}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
