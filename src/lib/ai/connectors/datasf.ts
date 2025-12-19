/**
 * DataSF Connector
 * Provides access to San Francisco open data
 */

import { z } from 'zod';
import { BaseConnector, ConnectorTool } from './base';

export class DataSFConnector extends BaseConnector {
  name = 'DataSF';
  description = 'Access San Francisco open data including crime, housing, and city services';

  private readonly BASE_URL = 'https://data.sfgov.org/resource';

  tools: ConnectorTool[] = [
    {
      name: 'get_crime_data',
      description: 'Get recent crime incidents in San Francisco, optionally filtered by neighborhood or category',
      parameters: z.object({
        neighborhood: z.string().optional().describe('Filter by neighborhood name'),
        category: z.string().optional().describe('Crime category (e.g., "Larceny Theft", "Assault", "Burglary")'),
        limit: z.number().optional().default(50).describe('Maximum number of incidents to return'),
      }),
      execute: async (params) => {
        const { neighborhood, category, limit = 50 } = params;

        try {
          // DataSF Crime Data endpoint
          const endpoint = `${this.BASE_URL}/wg3w-h783.json`;
          const queryParams = new URLSearchParams({
            '$limit': limit.toString(),
            '$order': 'incident_datetime DESC',
          });

          if (neighborhood) {
            queryParams.append('analysis_neighborhood', neighborhood);
          }
          if (category) {
            queryParams.append('incident_category', category);
          }

          const response = await fetch(`${endpoint}?${queryParams}`);
          if (!response.ok) {
            return { error: 'Failed to fetch crime data', status: response.status };
          }

          const data = await response.json();

          return {
            incidents: data.slice(0, limit).map((incident: any) => ({
              date: incident.incident_datetime,
              category: incident.incident_category,
              description: incident.incident_description,
              neighborhood: incident.analysis_neighborhood,
              resolution: incident.resolution,
            })),
            count: data.length,
            filters: { neighborhood, category },
          };
        } catch (error) {
          return { error: 'Failed to fetch crime data', message: String(error) };
        }
      },
    },
    {
      name: 'get_crime_statistics',
      description: 'Get aggregated crime statistics by neighborhood',
      parameters: z.object({
        neighborhood: z.string().optional().describe('Specific neighborhood to get stats for'),
      }),
      execute: async (params) => {
        const { neighborhood } = params;

        try {
          const endpoint = `${this.BASE_URL}/wg3w-h783.json`;
          const queryParams = new URLSearchParams({
            '$select': 'analysis_neighborhood,incident_category,count(*) as count',
            '$group': 'analysis_neighborhood,incident_category',
            '$order': 'count DESC',
            '$limit': '500',
          });

          if (neighborhood) {
            queryParams.append('$where', `analysis_neighborhood='${neighborhood}'`);
          }

          const response = await fetch(`${endpoint}?${queryParams}`);
          if (!response.ok) {
            return { error: 'Failed to fetch crime statistics', status: response.status };
          }

          const data = await response.json();

          // Group by neighborhood
          const byNeighborhood: any = {};
          data.forEach((item: any) => {
            const hood = item.analysis_neighborhood || 'Unknown';
            if (!byNeighborhood[hood]) {
              byNeighborhood[hood] = {
                neighborhood: hood,
                totalIncidents: 0,
                categories: {}
              };
            }
            byNeighborhood[hood].totalIncidents += parseInt(item.count);
            byNeighborhood[hood].categories[item.incident_category] = parseInt(item.count);
          });

          return {
            statistics: Object.values(byNeighborhood),
            filter: neighborhood || 'all',
          };
        } catch (error) {
          return { error: 'Failed to fetch crime statistics', message: String(error) };
        }
      },
    },
    {
      name: 'get_311_cases',
      description: 'Get recent 311 service requests (non-emergency city services) in San Francisco',
      parameters: z.object({
        category: z.string().optional().describe('Service request category'),
        neighborhood: z.string().optional().describe('Filter by neighborhood'),
        limit: z.number().optional().default(50).describe('Maximum number of cases to return'),
      }),
      execute: async (params) => {
        const { category, neighborhood, limit = 50 } = params;

        try {
          const endpoint = `${this.BASE_URL}/vw6y-z8j6.json`;
          const queryParams = new URLSearchParams({
            '$limit': limit.toString(),
            '$order': 'requested_datetime DESC',
          });

          if (category) {
            queryParams.append('service_name', category);
          }
          if (neighborhood) {
            queryParams.append('neighborhoods_sffind_boundaries', neighborhood);
          }

          const response = await fetch(`${endpoint}?${queryParams}`);
          if (!response.ok) {
            return { error: 'Failed to fetch 311 data', status: response.status };
          }

          const data = await response.json();

          return {
            cases: data.slice(0, limit).map((case_: any) => ({
              id: case_.service_request_id,
              category: case_.service_name,
              description: case_.service_details,
              status: case_.status_description,
              neighborhood: case_.neighborhoods_sffind_boundaries,
              requestedDate: case_.requested_datetime,
              closedDate: case_.closed_date,
            })),
            count: data.length,
          };
        } catch (error) {
          return { error: 'Failed to fetch 311 data', message: String(error) };
        }
      },
    }
  ];
}
