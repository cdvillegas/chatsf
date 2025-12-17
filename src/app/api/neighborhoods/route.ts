import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NeighborhoodCollection } from '@/types';

export async function GET() {
  try {
    const neighborhoods = await prisma.neighborhood.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        boundary: true,
        avgRating: true,
        ratingCount: true,
      },
    });

    // Convert to GeoJSON FeatureCollection
    const geojson: NeighborhoodCollection = {
      type: 'FeatureCollection',
      features: neighborhoods.map((n) => ({
        type: 'Feature',
        properties: {
          id: n.id,
          name: n.name,
          slug: n.slug,
          avgRating: n.avgRating,
          ratingCount: n.ratingCount,
        },
        geometry: n.boundary,
      })),
    };

    return NextResponse.json(geojson);
  } catch (error) {
    console.error('Failed to fetch neighborhoods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch neighborhoods' },
      { status: 500 }
    );
  }
}
