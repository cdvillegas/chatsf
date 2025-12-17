'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<string | null>(null);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!token) {
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set!');
      return;
    }

    console.log('Creating map with token:', token.substring(0, 20) + '...');

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.4194, 37.7749],
      zoom: 12,
    });

    map.current.on('error', (e) => {
      console.error('❌ Map error:', e);
    });

    map.current.on('style.load', () => {
      console.log('✅ Map style loaded!');
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Load neighborhoods when map is ready
    map.current.on('load', async () => {
      if (!map.current) return;

      console.log('✅ Map fully loaded, adding neighborhoods...');

      try {
        // Fetch the neighborhoods data
        const response = await fetch('/sf-neighborhoods.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const sfNeighborhoods = await response.json();
        
        console.log(`✅ Loaded ${sfNeighborhoods.features.length} SF neighborhoods`);

        // Add neighborhood data as a source
        map.current.addSource('neighborhoods', {
          type: 'geojson',
          data: sfNeighborhoods,
        });

        // Add fill layer with hover effect
        map.current.addLayer({
          id: 'neighborhoods-fill',
          type: 'fill',
          source: 'neighborhoods',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.4,
          },
        });

        // Add outline layer
        map.current.addLayer({
          id: 'neighborhoods-outline',
          type: 'line',
          source: 'neighborhoods',
          paint: {
            'line-color': '#1e40af',
            'line-width': 2,
          },
        });

        // Add labels
        map.current.addLayer({
          id: 'neighborhoods-labels',
          type: 'symbol',
          source: 'neighborhoods',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 11,
          },
          paint: {
            'text-color': '#1f2937',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });

        // Hover effect
        map.current.on('mouseenter', 'neighborhoods-fill', (e) => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features.length > 0) {
            setHoveredNeighborhood(e.features[0].properties?.name);
          }
        });

        map.current.on('mouseleave', 'neighborhoods-fill', () => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = '';
          setHoveredNeighborhood(null);
        });

        // Click handler
        map.current.on('click', 'neighborhoods-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const name = feature.properties?.name;
            const link = feature.properties?.link;
            
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="padding: 12px; min-width: 200px;">
                  <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${name}</h3>
                  ${link ? `<a href="${link}" target="_blank" style="color: #3b82f6; text-decoration: underline; font-size: 14px;">Learn more →</a>` : ''}
                </div>
              `)
              .addTo(map.current!);
          }
        });

        console.log('✅ All layers added successfully!');
      } catch (error) {
        console.error('❌ Failed to load neighborhoods:', error);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <>
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      
      {hoveredNeighborhood && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '16px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '12px',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <p style={{ fontWeight: 600, color: '#111', margin: 0 }}>{hoveredNeighborhood}</p>
        </div>
      )}
    </>
  );
}
