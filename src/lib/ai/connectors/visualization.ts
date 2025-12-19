/**
 * VisualizationConnector
 * Provides tools for the AI to render various data visualizations
 */

import { BaseConnector, ConnectorTool } from './base';
import { z } from 'zod';
import type { VisualizationState } from '@/types/visualization';

export default class VisualizationConnector extends BaseConnector {
  name = 'visualization';
  description = 'Tools for creating data visualizations (charts, tables, heatmaps)';

  getTools(): ConnectorTool[] {
    return [
      {
        name: 'render_bar_chart',
        description: 'Create a bar chart to compare values across categories. Best for rankings, comparing neighborhoods, or showing categorical breakdowns.',
        schema: z.object({
          title: z.string().optional().describe('Chart title'),
          xLabel: z.string().optional().describe('X-axis label'),
          yLabel: z.string().optional().describe('Y-axis label'),
          categories: z.array(z.string()).describe('Category labels for x-axis'),
          datasets: z.array(z.object({
            label: z.string().describe('Dataset name'),
            values: z.array(z.number()).describe('Values for each category'),
            color: z.string().optional().describe('Bar color (hex or CSS color)')
          })).describe('One or more datasets to plot'),
          showLegend: z.boolean().optional().default(true).describe('Show legend')
        }),
        handler: async (args: any): Promise<string> => {
          const visualization: VisualizationState = {
            type: 'bar',
            title: args.title,
            data: {
              labels: args.categories,
              datasets: args.datasets.map((ds: any) => ({
                label: ds.label,
                data: ds.values,
                backgroundColor: ds.color || undefined
              }))
            },
            options: {
              xAxisLabel: args.xLabel,
              yAxisLabel: args.yLabel,
              showLegend: args.showLegend
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'render_line_chart',
        description: 'Create a line chart to show trends over time or sequences. Best for time series data, crime trends, or historical patterns.',
        schema: z.object({
          title: z.string().optional().describe('Chart title'),
          xLabel: z.string().optional().describe('X-axis label (e.g., "Month", "Year")'),
          yLabel: z.string().optional().describe('Y-axis label'),
          timepoints: z.array(z.string()).describe('Time points or sequence labels'),
          datasets: z.array(z.object({
            label: z.string().describe('Dataset name'),
            values: z.array(z.number()).describe('Values for each time point'),
            color: z.string().optional().describe('Line color')
          })).describe('One or more data series to plot'),
          showLegend: z.boolean().optional().default(true)
        }),
        handler: async (args: any): Promise<string> => {
          const visualization: VisualizationState = {
            type: 'line',
            title: args.title,
            data: {
              labels: args.timepoints,
              datasets: args.datasets.map((ds: any) => ({
                label: ds.label,
                data: ds.values,
                borderColor: ds.color || undefined
              }))
            },
            options: {
              xAxisLabel: args.xLabel,
              yAxisLabel: args.yLabel,
              showLegend: args.showLegend
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'render_pie_chart',
        description: 'Create a pie chart to show proportions or percentages. Best for showing breakdown of categories (e.g., crime types as % of total).',
        schema: z.object({
          title: z.string().optional().describe('Chart title'),
          categories: z.array(z.string()).describe('Category names'),
          values: z.array(z.number()).describe('Values for each category'),
          showLegend: z.boolean().optional().default(true)
        }),
        handler: async (args: any): Promise<string> => {
          const visualization: VisualizationState = {
            type: 'pie',
            title: args.title,
            data: {
              labels: args.categories,
              datasets: [{
                label: 'Distribution',
                data: args.values
              }]
            },
            options: {
              showLegend: args.showLegend
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'render_scatter_plot',
        description: 'Create a scatter plot to explore correlations between two variables. Best for finding relationships (e.g., crime vs population density).',
        schema: z.object({
          title: z.string().optional().describe('Chart title'),
          xLabel: z.string().describe('X-axis variable label'),
          yLabel: z.string().describe('Y-axis variable label'),
          points: z.array(z.object({
            label: z.string().describe('Point label (e.g., neighborhood name)'),
            x: z.number().describe('X-axis value'),
            y: z.number().describe('Y-axis value')
          })).describe('Data points to plot')
        }),
        handler: async (args: any): Promise<string> => {
          const visualization: VisualizationState = {
            type: 'scatter',
            title: args.title,
            data: {
              labels: args.points.map((p: any) => p.label),
              datasets: [
                {
                  label: args.xLabel,
                  data: args.points.map((p: any) => p.x)
                },
                {
                  label: args.yLabel,
                  data: args.points.map((p: any) => p.y)
                }
              ]
            },
            options: {
              xAxisLabel: args.xLabel,
              yAxisLabel: args.yLabel
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'render_table',
        description: 'Create a sortable data table. Best when user needs to browse detailed data or wants "show me the data".',
        schema: z.object({
          title: z.string().optional().describe('Table title'),
          columns: z.array(z.object({
            key: z.string().describe('Column identifier'),
            label: z.string().describe('Column display name'),
            sortable: z.boolean().optional().default(true).describe('Allow sorting')
          })).describe('Table columns'),
          rows: z.array(z.record(z.any())).describe('Table rows as objects (key-value pairs)'),
          sortBy: z.string().optional().describe('Initial sort column'),
          sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
        }),
        handler: async (args: any): Promise<string> => {
          const visualization: VisualizationState = {
            type: 'table',
            title: args.title,
            data: {
              columns: args.columns,
              rows: args.rows
            },
            options: {
              sortBy: args.sortBy,
              sortOrder: args.sortOrder
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'render_heatmap_grid',
        description: 'Create a heatmap grid to show intensity across two dimensions. Best for time+category matrices (e.g., crime by hour and day of week).',
        schema: z.object({
          title: z.string().optional().describe('Heatmap title'),
          xLabels: z.array(z.string()).describe('Column labels (e.g., hours, days)'),
          yLabels: z.array(z.string()).describe('Row labels (e.g., crime types)'),
          values: z.array(z.array(z.number())).describe('2D array of values (rows × columns)'),
          colorScale: z.enum(['blue', 'green', 'red', 'gradient']).optional().default('gradient'),
          showValues: z.boolean().optional().default(true).describe('Show numbers in cells')
        }),
        handler: async (args: any): Promise<string> => {
          const visualization: VisualizationState = {
            type: 'heatmapGrid',
            title: args.title,
            data: {
              xLabels: args.xLabels,
              yLabels: args.yLabels,
              values: args.values
            },
            options: {
              colorScale: args.colorScale,
              showValues: args.showValues
            }
          };
          
          return JSON.stringify(visualization);
        }
      }
    ];
  }
}
