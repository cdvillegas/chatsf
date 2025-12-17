'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    console.log('Initializing map...');
    console.log('Token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.4194, 37.7749],
        zoom: 12,
      });

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully!');
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
      });
    } catch (error) {
      console.error('❌ Failed to create map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div 
        ref={mapContainer} 
        style={{ 
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }} 
      />
    </div>
  );
}
