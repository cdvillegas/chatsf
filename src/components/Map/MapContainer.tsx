'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTheme } from '@/contexts/ThemeContext';

interface MapContainerProps {
  highlightedNeighborhoods?: string[];
  onNeighborhoodSelect?: (slug: string | null) => void;
  mapAction?: {
    type: 'showHeatmap' | 'showNeighborhoods';
    data?: any;
  } | null;
}

export default function MapContainer({ 
  highlightedNeighborhoods = [],
  onNeighborhoodSelect,
  mapAction = null
}: MapContainerProps) {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<string | null>(null);
  const [neighborhoodsData, setNeighborhoodsData] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const selectedNeighborhoodsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    console.log('🗺️ Initializing map with theme:', theme);

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!token) {
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set!');
      return;
    }

    mapboxgl.accessToken = token;

    const mapStyle = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
    console.log('🎨 Using map style:', mapStyle);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [-122.4194, 37.7749],
      zoom: 12.5,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    console.log('✅ Map instance created');

    // Add attribution in bottom right
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // Smooth zoom controls
    const nav = new mapboxgl.NavigationControl({ showCompass: false });
    map.current.addControl(nav, 'bottom-left');

    map.current.on('load', async () => {
      if (!map.current) return;

      try {
        const response = await fetch('/sf-neighborhoods.json');
        const sfNeighborhoods = await response.json();
        
        console.log(`✨ Loaded ${sfNeighborhoods.features.length} neighborhoods`);

        // Try to fetch crime stats (non-blocking)
        try {
          const crimeResponse = await fetch('/api/neighborhoods/crime-stats');
          if (crimeResponse.ok) {
            const crimeStats = await crimeResponse.json();
            
            // Create a map of slug to crime stats
            const crimeStatsMap = new Map();
            crimeStats.forEach((stat: any) => {
              crimeStatsMap.set(stat.slug, stat);
            });
            
            // Merge crime stats into neighborhood features
            sfNeighborhoods.features = sfNeighborhoods.features.map((feature: any) => {
              const slug = feature.properties.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              const stats = crimeStatsMap.get(slug);
              
              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  crimeRate: stats?.totalIncidents || 0,
                  violentCrimes: stats?.violentCrimes || 0,
                  propertyCrimes: stats?.propertyCrimes || 0,
                }
              };
            });
            
            console.log('✅ Merged crime stats into neighborhoods');
          } else {
            console.warn('Crime stats API not available, using default coloring');
          }
        } catch (err) {
          console.warn('Failed to load crime stats, map will still work:', err);
        }

        // Add numeric IDs to features BEFORE storing or loading into Mapbox
        sfNeighborhoods.features = sfNeighborhoods.features.map((feature: any, index: number) => ({
          ...feature,
          id: index  // Add sequential numeric ID
        }));

        console.log('✅ Added IDs to', sfNeighborhoods.features.length, 'features');

        // Store neighborhoods data for later use
        setNeighborhoodsData(sfNeighborhoods);

        // Add neighborhood data
        map.current.addSource('neighborhoods', {
          type: 'geojson',
          data: sfNeighborhoods,
        });

        // Fill layer with uniform styling
        map.current.addLayer({
          id: 'neighborhoods-fill',
          type: 'fill',
          source: 'neighborhoods',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(100, 100, 100, 0.4)', // Much more visible when selected
              theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(150, 150, 150, 0.12)' // Very transparent white/gray
            ],
            'fill-opacity': 1.0, // Always full opacity, color handles the transparency
          },
          layout: {},
        });

        // Outline layer with vibrant matching colors
        map.current.addLayer({
          id: 'neighborhoods-outline',
          type: 'line',
          source: 'neighborhoods',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              theme === 'dark' ? '#ffffff' : '#000000',  // White/Black on hover
              theme === 'dark' ? 'rgba(180, 180, 180, 0.5)' : 'rgba(60, 60, 60, 0.6)'  // Lighter in dark mode, darker in light mode
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              2.5,
              1.2
            ],
            'line-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1.0,
              0.8
            ],
          },
        });

        // Labels visible by default
        map.current.addLayer({
          id: 'neighborhoods-labels',
          type: 'symbol',
          source: 'neighborhoods',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 10,
              14, 13
            ],
            'text-max-width': 10,
            'text-line-height': 1.2,
            'visibility': 'visible', // Visible by default
          },
          paint: {
            'text-color': theme === 'dark' ? '#ffffff' : '#000000',
            'text-halo-color': theme === 'dark' ? '#000000' : '#ffffff',
            'text-halo-width': theme === 'dark' ? 1.5 : 2,
            'text-halo-blur': 0.5,
            'text-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.6,
              12, 1
            ],
          },
        });

        // Hide POI and place labels from base Mapbox style
        const style = map.current.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer: any) => {
            // Hide POI, place, and settlement labels but keep road/street names
            if (layer.type === 'symbol' && layer.id.includes('label')) {
              if (layer.id.includes('poi') || 
                  layer.id.includes('place') || 
                  layer.id.includes('settlement') ||
                  layer.id.includes('airport') ||
                  layer.id.includes('park') ||
                  layer.id.includes('water')) {
                map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
              }
            }
          });
        }

        // Add crime heatmap source (initially empty)
        map.current.addSource('crime-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        // Add heatmap layer
        map.current.addLayer({
          id: 'crime-heatmap',
          type: 'heatmap',
          source: 'crime-points',
          paint: {
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              15, 3
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 255, 0)',
              0.2, 'royalblue',
              0.4, 'cyan',
              0.6, 'lime',
              0.8, 'yellow',
              1, 'red'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              15, 20
            ],
            'heatmap-opacity': 0.8,
          },
          layout: {
            visibility: 'none' // Start hidden
          }
        });

        // Add crime points layer (for detailed view)
        map.current.addLayer({
          id: 'crime-points',
          type: 'circle',
          source: 'crime-points',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 2,
              15, 4
            ],
            'circle-color': [
              'match',
              ['get', 'category'],
              'ASSAULT', '#ff0000',
              'ROBBERY', '#ff3300',
              'BURGLARY', '#ff6600',
              'LARCENY/THEFT', '#ff9900',
              'VEHICLE THEFT', '#ffcc00',
              'VANDALISM', '#ffff00',
              '#ff6600' // default
            ],
            'circle-opacity': 0.6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.5,
          },
          layout: {
            visibility: 'none' // Start hidden
          }
        });

        let hoveredFeatureId: number | null = null;

        // Smooth hover effect
        map.current.on('mousemove', 'neighborhoods-fill', (e) => {
          if (!map.current) return;
          
          map.current.getCanvas().style.cursor = 'pointer';

          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            
            // Only process if feature has an ID
            if (feature.id === undefined || feature.id === null) {
              console.warn('Feature has no ID for hover:', feature.properties?.name);
              return;
            }
            
            if (hoveredFeatureId !== null) {
              map.current.setFeatureState(
                { source: 'neighborhoods', id: hoveredFeatureId },
                { hover: false }
              );
            }

            hoveredFeatureId = feature.id as number;
            
            map.current.setFeatureState(
              { source: 'neighborhoods', id: hoveredFeatureId },
              { hover: true }
            );

            setHoveredNeighborhood(feature.properties?.name);
          }
        });

        map.current.on('mouseleave', 'neighborhoods-fill', () => {
          if (!map.current) return;
          
          map.current.getCanvas().style.cursor = '';

          if (hoveredFeatureId !== null) {
            map.current.setFeatureState(
              { source: 'neighborhoods', id: hoveredFeatureId },
              { hover: false }
            );
          }

          hoveredFeatureId = null;
          setHoveredNeighborhood(null);
        });

        // Click to select and fly to neighborhood
        map.current.on('click', 'neighborhoods-fill', (e) => {
          if (!map.current || !e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const name = feature.properties?.name;

          // Check if feature has an ID
          if (feature.id === undefined || feature.id === null) {
            console.error('❌ Feature has no ID for click:', name);
            return;
          }

          // Clear previous selections
          selectedNeighborhoodsRef.current.forEach(id => {
            map.current?.setFeatureState(
              { source: 'neighborhoods', id },
              { selected: false }
            );
          });
          selectedNeighborhoodsRef.current.clear();

          // Set selected state for clicked feature
          map.current.setFeatureState(
            { source: 'neighborhoods', id: feature.id as number },
            { selected: true }
          );
          selectedNeighborhoodsRef.current.add(feature.id as number);

          // Smooth fly to
          map.current.flyTo({
            center: e.lngLat,
            zoom: 14,
            duration: 1000,
            essential: true,
            easing: (t) => t * (2 - t),
          });
        });

        console.log('✨ Map ready!');
        setMapLoaded(true);
      } catch (error) {
        console.error('❌ Error:', error);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setMapLoaded(false);
    };
  }, [theme]);


  // Handle highlighted neighborhoods from AI chat
  useEffect(() => {
    if (!mapLoaded || !map.current || !neighborhoodsData) return;

    // Clear previous selections
    selectedNeighborhoodsRef.current.forEach(id => {
      map.current?.setFeatureState(
        { source: 'neighborhoods', id },
        { selected: false }
      );
    });
    selectedNeighborhoodsRef.current.clear();

    if (highlightedNeighborhoods.length === 0) return;

    console.log('🎯 Highlighting neighborhoods:', highlightedNeighborhoods);

    // Find matching features - match against exact names from our canonical list
    const features = neighborhoodsData.features.filter((feature: any) => {
      const featureName = feature.properties?.name || '';
      return highlightedNeighborhoods.some(hn => 
        featureName === hn || 
        featureName.toLowerCase() === hn.toLowerCase()
      );
    });

    if (features.length === 0) {
      console.log('⚠️ No matching neighborhoods found for:', highlightedNeighborhoods);
      return;
    }

    console.log(`✅ Found ${features.length} matching neighborhoods`);

    // Set selected state for ALL matched features
    features.forEach((feature: any) => {
      console.log(`Setting selected=true for feature ID: ${feature.id} (${feature.properties?.name})`);
      map.current?.setFeatureState(
        { source: 'neighborhoods', id: feature.id },
        { selected: true }
      );
      selectedNeighborhoodsRef.current.add(feature.id);
    });

    console.log('📍 Selected neighborhood IDs:', Array.from(selectedNeighborhoodsRef.current));

    // Calculate bounds for all highlighted neighborhoods
    const bounds = new mapboxgl.LngLatBounds();
    features.forEach((feature: any) => {
      if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon: any) => {
          polygon[0].forEach((coord: any) => {
            bounds.extend(coord as [number, number]);
          });
        });
      } else if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach((coord: any) => {
          bounds.extend(coord as [number, number]);
        });
      }
    });

    // If single neighborhood, use flyTo like clicking (same behavior)
    if (features.length === 1) {
      const center = bounds.getCenter();
      map.current.flyTo({
        center: center,
        zoom: 14,
        duration: 1000,
        essential: true,
        easing: (t) => t * (2 - t),
      });
    } else {
      // Multiple neighborhoods: fit bounds to show all
    map.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 100, right: 500 }, // Account for chat panel
        duration: 1000,
      maxZoom: 13.5,
    });
    }

  }, [mapLoaded, highlightedNeighborhoods, neighborhoodsData]);

  return (
    <>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100vh',
          position: 'relative',
        }} 
      />
      
      {/* Hover tooltip */}
      {hoveredNeighborhood && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: '88px',
            left: '24px',
            padding: '10px 14px',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <p className="text-primary" style={{ 
            fontWeight: 500, 
            margin: 0,
            fontSize: '14px',
          }}>
            {hoveredNeighborhood}
          </p>
        </div>
      )}

    </>
  );
}
