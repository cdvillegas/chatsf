/**
 * MapControlConnector
 * Provides tool for the AI to select neighborhoods on the map
 */

import { BaseConnector, ConnectorTool } from './base';
import { z } from 'zod';
import { NEIGHBORHOODS } from '@/lib/neighborhoods/canonical';
import type { MapVisualization } from '@/types/visualization';

export default class MapControlConnector extends BaseConnector {
  name = 'map';
  description = 'Control map view by selecting neighborhoods';

  tools: ConnectorTool[] = [
    {
      name: 'select_neighborhoods',
      description: 'Select and zoom to neighborhoods on the map. Pass the exact neighborhood names from the NEIGHBORHOODS list.',
      parameters: z.object({
        neighborhoods: z.array(z.string()).describe('Array of exact neighborhood names from the NEIGHBORHOODS list (e.g., ["Pacific Heights", "Marina", "Mission"])'),
        title: z.string().optional().describe('Optional title for this map view')
      }),
      execute: async (args: any): Promise<string> => {
        const { neighborhoods, title } = args;
        
        console.log(`🎯 Selected neighborhoods:`, neighborhoods);
        
        const visualization: MapVisualization = {
          type: 'map',
          title,
          config: {
            selectedNeighborhoods: neighborhoods,
            visualizationMode: 'neighborhoods'
          }
        };
        
        return JSON.stringify(visualization);
      }
    }
  ];
}
