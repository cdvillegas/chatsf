#!/usr/bin/env python3
import csv
import json
import re

def parse_multipolygon(wkt):
    """Parse WKT MULTIPOLYGON to GeoJSON coordinates"""
    # Remove MULTIPOLYGON wrapper
    coords_str = wkt.replace('MULTIPOLYGON (((', '').replace(')))', '')
    
    # Split into coordinate pairs
    pairs = coords_str.split(', ')
    coordinates = []
    
    for pair in pairs:
        parts = pair.strip().split()
        if len(parts) == 2:
            lng, lat = float(parts[0]), float(parts[1])
            coordinates.append([lng, lat])
    
    return [[coordinates]]  # GeoJSON MultiPolygon format

features = []

with open('SF_Find_Neighborhoods_20251216.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            geometry_coords = parse_multipolygon(row['the_geom'])
            
            features.append({
                'type': 'Feature',
                'properties': {
                    'name': row['name'],
                    'link': row['link'],
                },
                'geometry': {
                    'type': 'MultiPolygon',
                    'coordinates': geometry_coords
                }
            })
        except Exception as e:
            print(f"Error parsing {row['name']}: {e}")

geojson = {
    'type': 'FeatureCollection',
    'features': features
}

with open('src/data/sf-neighborhoods.json', 'w') as f:
    json.dump(geojson, f, indent=2)

print(f"✅ Converted {len(features)} neighborhoods to GeoJSON")
