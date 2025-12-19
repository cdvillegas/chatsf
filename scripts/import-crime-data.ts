/**
 * Crime Data Import Script
 * Imports 2015-2018 crime data from CSV into PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// CSV columns: PdId, IncidntNum, Incident Code, Category, Descript, DayOfWeek, Date, Time, PdDistrict, Resolution, Address, X, Y, location, data_loaded_at
interface CrimeRow {
  PdId: string;
  IncidntNum: string;
  'Incident Code': string;
  Category: string;
  Descript: string;
  DayOfWeek: string;
  Date: string;
  Time: string;
  PdDistrict: string;
  Resolution: string;
  Address: string;
  X: string;
  Y: string;
  location: string;
  data_loaded_at: string;
}

// Point-in-polygon check (simplified - for full neighborhoods we'd use turf.js)
interface Point {
  latitude: number;
  longitude: number;
}

interface NeighborhoodGeoJSON {
  name: string;
  slug: string;
  geometry: {
    type: string;
    coordinates: any;
  };
}

// Load neighborhood boundaries
async function loadNeighborhoods(): Promise<NeighborhoodGeoJSON[]> {
  const neighborhoodsFromDB = await prisma.neighborhood.findMany({
    select: {
      name: true,
      slug: true,
      boundary: true,
    }
  });

  return neighborhoodsFromDB.map(n => ({
    name: n.name,
    slug: n.slug,
    geometry: n.boundary as any,
  }));
}

// Simple point-in-polygon check for MultiPolygon
function pointInNeighborhood(point: Point, neighborhood: NeighborhoodGeoJSON): boolean {
  const { coordinates } = neighborhood.geometry;
  
  if (neighborhood.geometry.type !== 'MultiPolygon') return false;
  
  // Check each polygon in the MultiPolygon
  for (const polygon of coordinates) {
    if (pointInPolygon(point, polygon[0])) {
      return true;
    }
  }
  
  return false;
}

// Ray casting algorithm for point in polygon
function pointInPolygon(point: Point, polygon: number[][]): boolean {
  const { latitude: lat, longitude: lng } = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Find which neighborhood a point belongs to
function findNeighborhood(point: Point, neighborhoods: NeighborhoodGeoJSON[]): string | null {
  for (const neighborhood of neighborhoods) {
    if (pointInNeighborhood(point, neighborhood)) {
      return neighborhood.slug;
    }
  }
  return null;
}

// Parse CSV line (handles quoted fields)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse date from MM/DD/YYYY format
function parseDate(dateStr: string): Date | null {
  try {
    const [month, day, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
}

async function main() {
  console.log('🚀 Starting crime data import...');
  console.log('📁 Loading neighborhood boundaries...');
  
  const neighborhoods = await loadNeighborhoods();
  console.log(`✅ Loaded ${neighborhoods.length} neighborhoods\n`);
  
  const csvPath = path.join(__dirname, '../data/crime/Police_Department_Incident_Reports__Historical_2003_to_May_2018_20251218.csv');
  
  console.log('📖 Reading CSV file...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  console.log(`📊 Total lines in CSV: ${lines.length.toLocaleString()}`);
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  console.log('Header columns:', header);
  
  let processed = 0;
  let imported = 0;
  let skipped = 0;
  let batch: any[] = [];
  const BATCH_SIZE = 5000;
  
  console.log('\n⏳ Processing rows (filtering 2015-2018)...\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = parseCSVLine(line);
      if (values.length < header.length) continue;
      
      // Create row object
      const row: any = {};
      header.forEach((col, idx) => {
        row[col] = values[idx].replace(/^"|"$/g, ''); // Remove surrounding quotes
      });
      
      // Parse date
      const date = parseDate(row.Date);
      if (!date) {
        skipped++;
        continue;
      }
      
      const year = date.getFullYear();
      
      // Filter for 2015-2018
      if (year < 2015 || year > 2018) {
        skipped++;
        continue;
      }
      
      // Parse coordinates
      const longitude = parseFloat(row.X);
      const latitude = parseFloat(row.Y);
      
      // Skip invalid coordinates
      if (isNaN(longitude) || isNaN(latitude) || longitude === -120.5 || latitude === 90) {
        skipped++;
        continue;
      }
      
      // Find neighborhood
      const neighborhoodSlug = findNeighborhood({ latitude, longitude }, neighborhoods);
      
      // Add to batch
      batch.push({
        pdId: row.PdId,
        incidentNum: row.IncidntNum,
        incidentCode: row['Incident Code'],
        category: row.Category,
        description: row.Descript,
        dayOfWeek: row.DayOfWeek,
        date,
        time: row.Time,
        pdDistrict: row.PdDistrict,
        resolution: row.Resolution,
        address: row.Address,
        longitude,
        latitude,
        neighborhood: neighborhoodSlug,
      });
      
      processed++;
      
      // Insert batch
      if (batch.length >= BATCH_SIZE) {
        try {
          await prisma.crimeIncident.createMany({
            data: batch,
            skipDuplicates: true,
          });
          imported += batch.length;
          console.log(`✅ Imported ${imported.toLocaleString()} incidents (${processed.toLocaleString()} processed, ${skipped.toLocaleString()} skipped)`);
          batch = [];
        } catch (error: any) {
          console.error('❌ Batch insert error:', error.message);
          // Clear batch and continue
          batch = [];
        }
      }
      
    } catch (error: any) {
      // Skip malformed rows
      continue;
    }
  }
  
  // Insert remaining batch
  if (batch.length > 0) {
    try {
      await prisma.crimeIncident.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += batch.length;
      console.log(`✅ Imported final batch of ${batch.length} incidents`);
    } catch (error: any) {
      console.error('❌ Final batch insert error:', error.message);
    }
  }
  
  console.log('\n📈 Import Summary:');
  console.log(`   Total processed: ${processed.toLocaleString()}`);
  console.log(`   Successfully imported: ${imported.toLocaleString()}`);
  console.log(`   Skipped (out of range or invalid): ${skipped.toLocaleString()}`);
  
  // Compute neighborhood crime stats
  console.log('\n📊 Computing neighborhood crime statistics...');
  
  const allNeighborhoods = await prisma.neighborhood.findMany();
  
  for (const hood of allNeighborhoods) {
    const incidents = await prisma.crimeIncident.findMany({
      where: { neighborhood: hood.slug }
    });
    
    if (incidents.length === 0) continue;
    
    // Count by category
    const categoryBreakdown: Record<string, number> = {};
    let violentCrimes = 0;
    let propertyCrimes = 0;
    let otherCrimes = 0;
    
    const violentCategories = ['ASSAULT', 'ROBBERY', 'SEX OFFENSES, FORCIBLE', 'WEAPON LAWS'];
    const propertyCategories = ['LARCENY/THEFT', 'VEHICLE THEFT', 'BURGLARY', 'VANDALISM', 'STOLEN PROPERTY'];
    
    incidents.forEach(inc => {
      categoryBreakdown[inc.category] = (categoryBreakdown[inc.category] || 0) + 1;
      
      if (violentCategories.includes(inc.category)) {
        violentCrimes++;
      } else if (propertyCategories.includes(inc.category)) {
        propertyCrimes++;
      } else {
        otherCrimes++;
      }
    });
    
    // Monthly trend (simplified - just count by year-month)
    const monthlyTrend: Record<string, number> = {};
    incidents.forEach(inc => {
      const yearMonth = `${inc.date.getFullYear()}-${String(inc.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[yearMonth] = (monthlyTrend[yearMonth] || 0) + 1;
    });
    
    // Upsert stats
    await prisma.neighborhoodCrimeStats.upsert({
      where: { neighborhoodId: hood.id },
      create: {
        neighborhoodId: hood.id,
        totalIncidents: incidents.length,
        violentCrimes,
        propertyCrimes,
        otherCrimes,
        categoryBreakdown,
        monthlyTrend,
      },
      update: {
        totalIncidents: incidents.length,
        violentCrimes,
        propertyCrimes,
        otherCrimes,
        categoryBreakdown,
        monthlyTrend,
      }
    });
    
    console.log(`   ✅ ${hood.name}: ${incidents.length} incidents`);
  }
  
  console.log('\n🎉 Import complete!');
}

main()
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
