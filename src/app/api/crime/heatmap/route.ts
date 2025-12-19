/**
 * Crime Heat Map API Route
 * Returns GeoJSON FeatureCollection of crime incidents for map visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const neighborhood = searchParams.get('neighborhood');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Build where clause
    const where: any = {};
    
    if (neighborhood) {
      // Find neighborhood by slug or name
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

    // Fetch incidents
    const incidents = await prisma.crimeIncident.findMany({
      where,
      select: {
        latitude: true,
        longitude: true,
        category: true,
        date: true,
        address: true,
        pdDistrict: true,
      },
      take: Math.min(limit, 1000), // Max 1000 for performance
      orderBy: { date: 'desc' },
    });

    // Convert to GeoJSON
    const geoJson = {
      type: 'FeatureCollection',
      features: incidents.map(incident => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [incident.longitude, incident.latitude],
        },
        properties: {
          category: incident.category,
          date: incident.date.toISOString(),
          address: incident.address,
          district: incident.pdDistrict,
        }
      }))
    };

    return NextResponse.json(geoJson);
  } catch (error) {
    console.error('Heat map API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crime data', message: String(error) },
      { status: 500 }
    );
  }
}
