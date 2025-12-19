/**
 * Neighborhoods Connector
 * Provides access to SF neighborhood data
 */

import { z } from 'zod';
import { BaseConnector, ConnectorTool } from './base';
import { prisma } from '@/lib/prisma';

export class NeighborhoodsConnector extends BaseConnector {
  name = 'Neighborhoods';
  description = 'Access San Francisco neighborhood information and boundaries';

  tools: ConnectorTool[] = [
    {
      name: 'search_neighborhoods',
      description: 'Search for neighborhoods by name or characteristics. Returns neighborhood IDs that can be used with other tools.',
      parameters: z.object({
        query: z.string().optional().describe('Search query for neighborhood name'),
        limit: z.number().optional().default(10).describe('Maximum number of results to return'),
      }),
      execute: async (params) => {
        const { query, limit = 10 } = params;
        
        let where: any = {};
        if (query) {
          where = {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } }
            ]
          };
        }

        const neighborhoods = await prisma.neighborhood.findMany({
          where,
          take: limit,
          select: {
            id: true,
            name: true,
            slug: true,
            avgRating: true,
            ratingCount: true,
          },
        });

        return {
          neighborhoods: neighborhoods.map(n => ({
            id: n.id,
            name: n.name,
            slug: n.slug,
            avgRating: n.avgRating,
            ratingCount: n.ratingCount,
          })),
          count: neighborhoods.length,
        };
      },
    },
    {
      name: 'get_neighborhood_details',
      description: 'Get detailed information about a specific neighborhood including boundaries and statistics',
      parameters: z.object({
        neighborhood_id: z.string().describe('The neighborhood ID or slug'),
      }),
      execute: async (params) => {
        const { neighborhood_id } = params;

        const neighborhood = await prisma.neighborhood.findFirst({
          where: {
            OR: [
              { id: neighborhood_id },
              { slug: neighborhood_id },
            ]
          },
          include: {
            ratings: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: {
                    name: true,
                  }
                }
              }
            },
            comments: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        });

        if (!neighborhood) {
          return { error: 'Neighborhood not found' };
        }

        return {
          id: neighborhood.id,
          name: neighborhood.name,
          slug: neighborhood.slug,
          avgRating: neighborhood.avgRating,
          ratingCount: neighborhood.ratingCount,
          recentRatings: neighborhood.ratings.map(r => ({
            overall: r.overall,
            safety: r.safety,
            vibe: r.vibe,
            transit: r.transit,
            food: r.food,
            nightlife: r.nightlife,
            value: r.value,
            userName: r.user.name,
            createdAt: r.createdAt,
          })),
          recentComments: neighborhood.comments.map(c => ({
            text: c.text,
            userName: c.user.name,
            createdAt: c.createdAt,
          })),
        };
      },
    },
    {
      name: 'compare_neighborhoods',
      description: 'Compare multiple neighborhoods side by side',
      parameters: z.object({
        neighborhood_ids: z.array(z.string()).describe('Array of neighborhood IDs or slugs to compare'),
      }),
      execute: async (params) => {
        const { neighborhood_ids } = params;

        const neighborhoods = await prisma.neighborhood.findMany({
          where: {
            OR: neighborhood_ids.flatMap(id => [
              { id },
              { slug: id },
            ])
          },
          include: {
            ratings: {
              select: {
                safety: true,
                vibe: true,
                transit: true,
                food: true,
                nightlife: true,
                value: true,
              }
            }
          }
        });

        return {
          comparison: neighborhoods.map(n => {
            const avgStats = n.ratings.reduce((acc, r) => {
              acc.safety += r.safety || 0;
              acc.vibe += r.vibe || 0;
              acc.transit += r.transit || 0;
              acc.food += r.food || 0;
              acc.nightlife += r.nightlife || 0;
              acc.value += r.value || 0;
              acc.count++;
              return acc;
            }, { safety: 0, vibe: 0, transit: 0, food: 0, nightlife: 0, value: 0, count: 0 });

            const count = avgStats.count || 1;

            return {
              name: n.name,
              slug: n.slug,
              avgRating: n.avgRating,
              ratingCount: n.ratingCount,
              stats: {
                safety: (avgStats.safety / count).toFixed(1),
                vibe: (avgStats.vibe / count).toFixed(1),
                transit: (avgStats.transit / count).toFixed(1),
                food: (avgStats.food / count).toFixed(1),
                nightlife: (avgStats.nightlife / count).toFixed(1),
                value: (avgStats.value / count).toFixed(1),
              }
            };
          })
        };
      },
    },
    {
      name: 'get_top_neighborhoods',
      description: 'Get top-rated neighborhoods by overall rating or specific category',
      parameters: z.object({
        category: z.enum(['overall', 'safety', 'vibe', 'transit', 'food', 'nightlife', 'value']).optional().default('overall').describe('Category to rank by'),
        limit: z.number().optional().default(5).describe('Number of neighborhoods to return'),
      }),
      execute: async (params) => {
        const { category = 'overall', limit = 5 } = params;

        if (category === 'overall') {
          const neighborhoods = await prisma.neighborhood.findMany({
            where: {
              ratingCount: {
                gt: 0
              }
            },
            orderBy: {
              avgRating: 'desc'
            },
            take: limit,
            select: {
              id: true,
              name: true,
              slug: true,
              avgRating: true,
              ratingCount: true,
            }
          });

          return {
            category,
            neighborhoods: neighborhoods.map(n => ({
              name: n.name,
              slug: n.slug,
              rating: n.avgRating,
              ratingCount: n.ratingCount,
            }))
          };
        } else {
          // For specific categories, we need to calculate from ratings
          const neighborhoods = await prisma.neighborhood.findMany({
            include: {
              ratings: {
                select: {
                  [category]: true,
                }
              }
            }
          });

          const scored = neighborhoods
            .map(n => {
              const ratings = n.ratings.filter(r => r[category] !== null);
              if (ratings.length === 0) return null;
              
              const avg = ratings.reduce((sum, r) => sum + (r[category] || 0), 0) / ratings.length;
              
              return {
                name: n.name,
                slug: n.slug,
                rating: avg,
                ratingCount: ratings.length,
              };
            })
            .filter(n => n !== null)
            .sort((a, b) => (b?.rating || 0) - (a?.rating || 0))
            .slice(0, limit);

          return {
            category,
            neighborhoods: scored,
          };
        }
      },
    }
  ];
}
