/**
 * MapControlConnector
 * Provides tools for the AI to control the map visualization
 */

import { BaseConnector, ConnectorTool } from './base';
import { z } from 'zod';
import type { MapVisualization } from '@/types/visualization';

export default class MapControlConnector extends BaseConnector {
  name = 'map';
  description = 'Tools for controlling the map view and selecting neighborhoods';

  tools: ConnectorTool[] = [
      {
        name: 'select_neighborhoods',
        description: 'Highlight and optionally zoom to specific neighborhoods on the map. Use when user asks about specific neighborhoods.',
        parameters: z.object({
          neighborhoods: z.array(z.string()).describe('Neighborhood names or slugs to highlight'),
          zoom: z.boolean().optional().default(true).describe('Whether to zoom to fit selected neighborhoods'),
          title: z.string().optional().describe('Optional title for this map view')
        }),
        execute: async (args: any): Promise<string> => {
          const visualization: MapVisualization = {
            type: 'map',
            title: args.title,
            config: {
              selectedNeighborhoods: args.neighborhoods,
              visualizationMode: 'neighborhoods'
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'zoom_to_area',
        description: 'Zoom the map to show a specific area defined by neighborhoods. Use for "show me X area" queries.',
        parameters: z.object({
          neighborhoods: z.array(z.string()).describe('Neighborhoods defining the area to zoom to'),
          title: z.string().optional().describe('Optional title for this map view')
        }),
        execute: async (args: any): Promise<string> => {
          const visualization: MapVisualization = {
            type: 'map',
            title: args.title,
            config: {
              selectedNeighborhoods: args.neighborhoods,
              visualizationMode: 'neighborhoods'
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'compare_on_map',
        description: 'Show multiple neighborhoods side-by-side for visual comparison. Use when comparing 2-4 neighborhoods spatially.',
        parameters: z.object({
          neighborhoods: z.array(z.string()).min(2).max(4).describe('2-4 neighborhoods to compare'),
          title: z.string().optional().describe('Optional comparison title')
        }),
        execute: async (args: any): Promise<string> => {
          const visualization: MapVisualization = {
            type: 'map',
            title: args.title || `Comparing ${args.neighborhoods.join(' vs ')}`,
            config: {
              selectedNeighborhoods: args.neighborhoods,
              visualizationMode: 'neighborhoods'
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'show_crime_overlay',
        description: 'Display crime data as a heatmap overlay on the map. Use when discussing safety or crime-related topics.',
        parameters: z.object({
          neighborhood: z.string().optional().describe('Optional: focus on specific neighborhood'),
          category: z.string().optional().describe('Optional: filter by crime category'),
          title: z.string().optional().describe('Optional title for this view')
        }),
        execute: async (args: any): Promise<string> => {
          const visualization: MapVisualization = {
            type: 'map',
            title: args.title,
            config: {
              selectedNeighborhoods: args.neighborhood ? [args.neighborhood] : undefined,
              visualizationMode: 'both'
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'draw_route',
        description: 'Draw a route between two neighborhoods. Use for distance or commute questions.',
        parameters: z.object({
          from: z.string().describe('Starting neighborhood'),
          to: z.string().describe('Destination neighborhood'),
          via: z.array(z.string()).optional().describe('Optional waypoints'),
          title: z.string().optional().describe('Optional route title')
        }),
        execute: async (args: any): Promise<string> => {
          // For now, we'll just select both neighborhoods
          // TODO: Implement actual routing when we have that capability
          const neighborhoods = [args.from, args.to, ...(args.via || [])];
          
          const visualization: MapVisualization = {
            type: 'map',
            title: args.title || `Route from ${args.from} to ${args.to}`,
            config: {
              selectedNeighborhoods: neighborhoods,
              visualizationMode: 'neighborhoods',
              route: {
                coordinates: [], // TODO: Calculate actual route
                from: args.from,
                to: args.to
              }
            }
          };
          
          return JSON.stringify(visualization);
        }
      },
      
      {
        name: 'reset_map',
        description: 'Reset the map to default SF view, clearing all selections. Use when starting a new topic or user seems lost.',
        parameters: z.object({}),
        execute: async (args: any): Promise<string> => {
          const visualization: MapVisualization = {
            type: 'map',
            config: {
              center: [-122.4194, 37.7749],
              zoom: 12.5,
              visualizationMode: 'neighborhoods'
            }
          };
          
          return JSON.stringify(visualization);
        }
      }
    ];
}
