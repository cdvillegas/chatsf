'use client';

import { useState } from 'react';
import { TableVisualization } from '@/types/visualization';

interface TableViewProps {
  data: TableVisualization['data'];
  options?: TableVisualization['options'];
  title?: string;
}

export default function TableView({ data, options, title }: TableViewProps) {
  const [sortBy, setSortBy] = useState(options?.sortBy || '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options?.sortOrder || 'asc');

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  const sortedRows = [...data.rows].sort((a, b) => {
    if (!sortBy) return 0;
    
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortOrder === 'asc' 
      ? aStr.localeCompare(bStr) 
      : bStr.localeCompare(aStr);
  });

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
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
        }}>
          <thead style={{ 
            background: 'var(--bg-secondary)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}>
            <tr>
              {data.columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: column.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    borderBottom: '1px solid var(--border-primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {column.label}
                    {column.sortable !== false && sortBy === column.key && (
                      <span style={{ fontSize: '10px' }}>
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {data.columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: '14px 16px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-primary)',
                    }}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
