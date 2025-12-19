/**
 * Neighborhood Crime Stats API Route
 * Returns crime statistics for all neighborhoods
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const neighborhoods = await prisma.neighborhood.findMany({
      include: {
        crimeStats: true,
      }
    });

    const stats = neighborhoods.map(hood => ({
      slug: hood.slug,
      name: hood.name,
      totalIncidents: hood.crimeStats?.totalIncidents || 0,
      violentCrimes: hood.crimeStats?.violentCrimes || 0,
      propertyCrimes: hood.crimeStats?.propertyCrimes || 0,
      crimeRate: hood.crimeStats?.totalIncidents || 0, // Use total as rate for now
    }));

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Crime stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crime stats', message: String(error) },
      { status: 500 }
    );
  }
}
