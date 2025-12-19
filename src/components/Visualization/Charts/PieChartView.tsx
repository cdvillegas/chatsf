'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartVisualization } from '@/types/visualization';

interface PieChartViewProps {
  data: ChartVisualization['data'];
  options?: ChartVisualization['options'];
  title?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B9D', '#4ECDC4', '#95E1D3'
];

export default function PieChartView({ data, options, title }: PieChartViewProps) {
  // For pie charts, we'll use the first dataset
  const dataset = data.datasets[0];
  const chartData = data.labels.map((label, i) => ({
    name: label,
    value: dataset.data[i]
  }));

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--bg-primary)'
    }}>
      {title && (
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '24px',
          width: '100%',
        }}>
          {title}
        </h2>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius="70%"
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              color: 'var(--text-primary)'
            }}
          />
          {(options?.showLegend !== false) && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
