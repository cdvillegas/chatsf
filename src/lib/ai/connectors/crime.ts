/**
 * Crime Data Connector
 * Provides access to SF crime incident data
 */

import { z } from 'zod';
import { BaseConnector, ConnectorTool } from './base';
import { prisma } from '@/lib/prisma';

export class CrimeConnector extends BaseConnector {
  name = 'Crime';
  description = 'Access San Francisco crime incident data (2015-2018)';

  tools: ConnectorTool[] = [
    {
      name: 'get_crime_by_neighborhood',
      description: 'Get crime statistics for a specific neighborhood with optional filtering by category and date range',
      parameters: z.object({
        neighborhood: z.string().describe('Neighborhood name or slug'),
        category: z.string().optional().describe('Specific crime category (e.g., "ASSAULT", "LARCENY/THEFT", "VEHICLE THEFT")'),
        startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
        endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
      }),
      execute: async (params) => {
        const { neighborhood, category, startDate, endDate } = params;

        // Find neighborhood
        const hood = await prisma.neighborhood.findFirst({
          where: {
            OR: [
              { slug: neighborhood.toLowerCase().replace(/\s+/g, '-') },
              { name: { contains: neighborhood, mode: 'insensitive' } }
            ]
          }
        });

        if (!hood) {
          return { error: 'Neighborhood not found', available: await this.getNeighborhoodList() };
        }

        // Build where clause
        const where: any = { neighborhood: hood.slug };
        if (category) {
          where.category = { contains: category, mode: 'insensitive' };
        }
        if (startDate || endDate) {
          where.date = {};
          if (startDate) where.date.gte = new Date(startDate);
          if (endDate) where.date.lte = new Date(endDate);
        }

        // Get incidents
        const incidents = await prisma.crimeIncident.findMany({
          where,
          select: {
            category: true,
            date: true,
            resolution: true,
            pdDistrict: true,
          },
          orderBy: { date: 'desc' },
          take: 1000,
        });

        // Aggregate by category
        const categoryBreakdown: Record<string, number> = {};
        incidents.forEach(inc => {
          categoryBreakdown[inc.category] = (categoryBreakdown[inc.category] || 0) + 1;
        });

        return {
          neighborhood: hood.name,
          totalIncidents: incidents.length,
          dateRange: {
            start: startDate || '2015-01-01',
            end: endDate || '2018-05-31'
          },
          categoryBreakdown,
          topCategories: Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([cat, count]) => ({ category: cat, count })),
        };
      },
    },
    {
      name: 'compare_neighborhood_safety',
      description: 'Compare crime rates across multiple neighborhoods. Returns ranked comparison.',
      parameters: z.object({
        neighborhoods: z.array(z.string()).describe('Array of neighborhood names or slugs to compare'),
        metric: z.enum(['total', 'violent', 'property']).optional().default('total').describe('Metric to compare by'),
      }),
      execute: async (params) => {
        const { neighborhoods, metric = 'total' } = params;

        const results = [];

        for (const hoodName of neighborhoods) {
          const hood = await prisma.neighborhood.findFirst({
            where: {
              OR: [
                { slug: hoodName.toLowerCase().replace(/\s+/g, '-') },
                { name: { contains: hoodName, mode: 'insensitive' } }
              ]
            },
            include: {
              crimeStats: true,
            }
          });

          if (!hood) continue;

          let value = 0;
          if (hood.crimeStats) {
            if (metric === 'total') value = hood.crimeStats.totalIncidents;
            else if (metric === 'violent') value = hood.crimeStats.violentCrimes;
            else if (metric === 'property') value = hood.crimeStats.propertyCrimes;
          }

          results.push({
            neighborhood: hood.name,
            slug: hood.slug,
            [metric + 'Incidents']: value,
          });
        }

        // Sort by metric (ascending = safer)
        results.sort((a, b) => {
          const aVal = a[metric + 'Incidents'];
          const bVal = b[metric + 'Incidents'];
          return aVal - bVal;
        });

        return {
          metric,
          comparison: results,
          safest: results[0],
          mostDangerous: results[results.length - 1],
        };
      },
    },
    {
      name: 'get_safest_neighborhoods',
      description: 'Get neighborhoods ranked by safety (lowest crime). Returns top N safest neighborhoods.',
      parameters: z.object({
        limit: z.number().optional().default(10).describe('Number of neighborhoods to return'),
        crimeType: z.enum(['total', 'violent', 'property']).optional().default('total').describe('Type of crime to rank by'),
      }),
      execute: async (params) => {
        const { limit = 10, crimeType = 'total' } = params;

        const neighborhoods = await prisma.neighborhood.findMany({
          include: {
            crimeStats: true,
          }
        });

        console.log(`📊 Found ${neighborhoods.length} neighborhoods, ${neighborhoods.filter(h => h.crimeStats).length} with crime stats`);

        // Filter and sort
        const withStats = neighborhoods
          .filter(h => h.crimeStats)
          .map(h => {
            let value = 0;
            if (h.crimeStats) {
              if (crimeType === 'total') value = h.crimeStats.totalIncidents;
              else if (crimeType === 'violent') value = h.crimeStats.violentCrimes;
              else if (crimeType === 'property') value = h.crimeStats.propertyCrimes;
            }
            return {
              neighborhood: h.name,
              slug: h.slug,
              incidents: value,
              violentCrimes: h.crimeStats?.violentCrimes || 0,
              propertyCrimes: h.crimeStats?.propertyCrimes || 0,
              totalIncidents: h.crimeStats?.totalIncidents || 0,
            };
          })
          .sort((a, b) => a.incidents - b.incidents)
          .slice(0, limit);

        console.log(`✅ Returning ${withStats.length} neighborhoods with stats`);

        return {
          crimeType,
          safestNeighborhoods: withStats,
          dataRange: '2015-2018',
        };
      },
    },
    {
      name: 'get_crime_trends',
      description: 'Analyze crime trends over time for a neighborhood or citywide',
      parameters: z.object({
        neighborhood: z.string().optional().describe('Specific neighborhood (leave empty for citywide)'),
        timeGranularity: z.enum(['month', 'year']).optional().default('month').describe('Granularity of time series'),
      }),
      execute: async (params) => {
        const { neighborhood, timeGranularity = 'month' } = params;

        let where: any = {};
        if (neighborhood) {
          const hood = await prisma.neighborhood.findFirst({
            where: {
              OR: [
                { slug: neighborhood.toLowerCase().replace(/\s+/g, '-') },
                { name: { contains: neighborhood, mode: 'insensitive' } }
              ]
            }
          });
          if (hood) {
            where.neighborhood = hood.slug;
          }
        }

        const incidents = await prisma.crimeIncident.findMany({
          where,
          select: {
            date: true,
            category: true,
          }
        });

        // Group by time period
        const timeSeries: Record<string, number> = {};
        incidents.forEach(inc => {
          let key: string;
          if (timeGranularity === 'year') {
            key = inc.date.getFullYear().toString();
          } else {
            key = `${inc.date.getFullYear()}-${String(inc.date.getMonth() + 1).padStart(2, '0')}`;
          }
          timeSeries[key] = (timeSeries[key] || 0) + 1;
        });

        // Convert to sorted array
        const trend = Object.entries(timeSeries)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([period, count]) => ({ period, count }));

        // Calculate trend direction
        const recentPeriods = trend.slice(-6); // Last 6 periods
        const avgRecent = recentPeriods.reduce((sum, p) => sum + p.count, 0) / recentPeriods.length;
        const earlierPeriods = trend.slice(0, Math.min(6, trend.length - 6));
        const avgEarlier = earlierPeriods.reduce((sum, p) => sum + p.count, 0) / earlierPeriods.length;
        
        const trendDirection = avgRecent > avgEarlier ? 'increasing' : avgRecent < avgEarlier ? 'decreasing' : 'stable';
        const changePercent = earlierPeriods.length > 0 ? ((avgRecent - avgEarlier) / avgEarlier * 100).toFixed(1) : 0;

        return {
          neighborhood: neighborhood || 'San Francisco (citywide)',
          timeGranularity,
          trend,
          analysis: {
            direction: trendDirection,
            changePercent: `${changePercent}%`,
            totalIncidents: incidents.length,
          }
        };
      },
    },
    {
      name: 'get_crime_hotspots',
      description: 'Get specific crime incident locations for heat map visualization. Returns coordinates and details.',
      parameters: z.object({
        neighborhood: z.string().optional().describe('Filter by neighborhood'),
        category: z.string().optional().describe('Filter by crime category'),
        limit: z.number().optional().default(1000).describe('Maximum number of points (max 1000 for performance)'),
      }),
      execute: async (params) => {
        const { neighborhood, category, limit = 1000 } = params;

        const where: any = {};
        
        if (neighborhood) {
          const hood = await prisma.neighborhood.findFirst({
            where: {
              OR: [
                { slug: neighborhood.toLowerCase().replace(/\s+/g, '-') },
                { name: { contains: neighborhood, mode: 'insensitive' } }
              ]
            }
          });
          if (hood) {
            where.neighborhood = hood.slug;
          }
        }

        if (category) {
          where.category = { contains: category, mode: 'insensitive' };
        }

        const incidents = await prisma.crimeIncident.findMany({
          where,
          select: {
            latitude: true,
            longitude: true,
            category: true,
            date: true,
            address: true,
          },
          take: Math.min(limit, 1000),
          orderBy: { date: 'desc' },
        });

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        incidents.forEach(inc => {
          categoryBreakdown[inc.category] = (categoryBreakdown[inc.category] || 0) + 1;
        });

        return {
          totalPoints: incidents.length,
          filters: { neighborhood, category },
          categoryBreakdown,
          geoJson: {
            type: 'FeatureCollection',
            features: incidents.map(inc => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [inc.longitude, inc.latitude],
              },
              properties: {
                category: inc.category,
                date: inc.date.toISOString(),
                address: inc.address,
              }
            }))
          }
        };
      },
    }
  ];

  private async getNeighborhoodList(): Promise<string[]> {
    const neighborhoods = await prisma.neighborhood.findMany({
      select: { name: true }
    });
    return neighborhoods.map(n => n.name);
  }
}
