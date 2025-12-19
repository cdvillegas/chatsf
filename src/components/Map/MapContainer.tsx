'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContainerProps {
  highlightedNeighborhoods?: string[];
  onNeighborhoodSelect?: (slug: string | null) => void;
  isChatVisible?: boolean;
  mapAction?: {
    type: 'showHeatmap' | 'showNeighborhoods';
    data?: any;
  } | null;
}

export default function MapContainer({ 
  highlightedNeighborhoods = [],
  onNeighborhoodSelect,
  isChatVisible = true,
  mapAction = null
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<string | null>(null);
  const [neighborhoodsData, setNeighborhoodsData] = useState<any>(null);
  const [visualizationMode, setVisualizationMode] = useState<'neighborhoods' | 'heatmap' | 'both'>('neighborhoods');
  const [crimeData, setCrimeData] = useState<any>(null);
  const [isLoadingCrime, setIsLoadingCrime] = useState(false);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!token) {
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set!');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.4194, 37.7749],
      zoom: 12.5,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

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

        // Store neighborhoods data for later use
        setNeighborhoodsData(sfNeighborhoods);

        // Add neighborhood data
        map.current.addSource('neighborhoods', {
          type: 'geojson',
          data: sfNeighborhoods,
          generateId: true,
        });

        // Fill layer with crime-rate coloring (green = safe, red = high crime)
        map.current.addLayer({
          id: 'neighborhoods-fill',
          type: 'fill',
          source: 'neighborhoods',
          paint: {
            'fill-color': [
              'case',
              ['>', ['get', 'crimeRate'], 0],
              [
                'interpolate',
                ['linear'],
                ['get', 'crimeRate'],
                0, '#00ff00',      // No crime = bright green
                5000, '#7FFF00',   // Low = chartreuse
                10000, '#FFFF00',  // Low-medium = yellow
                15000, '#FFD700',  // Medium = gold
                20000, '#FFA500',  // Medium-high = orange
                25000, '#FF6347',  // High = tomato
                30000, '#FF0000'   // Very high = red
              ],
              // Fallback to vibrant colors if no crime data
              [
                'match',
                ['%', ['id'], 20],
                0, '#FF6B9D',
                1, '#4ECDC4',
                2, '#FFD93D',
                3, '#FF6F61',
                4, '#6BCF7F',
                5, '#95E1D3',
                6, '#F38181',
                7, '#AA96DA',
                8, '#FCBAD3',
                9, '#A8E6CF',
                10, '#FFD54F',
                11, '#81C784',
                12, '#64B5F6',
                13, '#FFB74D',
                14, '#E57373',
                15, '#BA68C8',
                16, '#4DB6AC',
                17, '#FF8A65',
                18, '#9575CD',
                19, '#AED581',
                '#FF6B9D'
              ]
            ],
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.7,
                0.5
              ],
              13, [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.8,
                0.65
              ]
            ],
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
              [
                'match',
                ['%', ['id'], 20],
                0, '#FF5582',
                1, '#3CCCC3',
                2, '#FFDD57',
                3, '#FF5C54',
                4, '#5FD068',
                5, '#85DDD0',
                6, '#FF6F6C',
                7, '#9D85CF',
                8, '#FFADD0',
                9, '#98EBC0',
                10, '#FFDD3F',
                11, '#71D77A',
                12, '#54C5FF',
                13, '#FFBB40',
                14, '#FF6B6B',
                15, '#C058D2',
                16, '#3DC4B5',
                17, '#FF9560',
                18, '#8C6AD1',
                19, '#ACE571',
                '#FF5582'
              ],
              '#ffffff'
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              2.5,
              1.5
            ],
            'line-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.9,
              0.7
            ],
          },
        });

        // Labels with fade-in
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
          },
          paint: {
            'text-color': '#1f2937',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
            'text-halo-blur': 1,
            'text-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.6,
              12, 1
            ],
          },
        });

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

        // Click to fly to neighborhood
        map.current.on('click', 'neighborhoods-fill', (e) => {
          if (!map.current || !e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const name = feature.properties?.name;

          console.log('Clicked neighborhood:', name);

          // Smooth fly to
          map.current.flyTo({
            center: e.lngLat,
            zoom: 13.5,
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t),
          });
        });

        console.log('✨ Map ready!');
      } catch (error) {
        console.error('❌ Error:', error);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);


  // Handle highlighted neighborhoods from AI chat
  useEffect(() => {
    if (!map.current || !neighborhoodsData || highlightedNeighborhoods.length === 0) return;

    console.log('🎯 Highlighting neighborhoods:', highlightedNeighborhoods);

    // Find matching features
    const features = neighborhoodsData.features.filter((feature: any) => {
      const name = feature.properties?.name?.toLowerCase() || '';
      const slug = name.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return highlightedNeighborhoods.some(hn => 
        hn.toLowerCase() === slug || 
        hn.toLowerCase().includes(name) ||
        name.includes(hn.toLowerCase())
      );
    });

    if (features.length === 0) {
      console.log('No matching neighborhoods found');
      return;
    }

    console.log(`Found ${features.length} matching neighborhoods`);

    // Calculate bounds for all highlighted neighborhoods
    const bounds = new mapboxgl.LngLatBounds();
    features.forEach((feature: any) => {
      if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon: any) => {
          polygon[0].forEach((coord: any) => {
            bounds.extend(coord as [number, number]);
          });
        });
      }
    });

    // Fly to show all highlighted neighborhoods
    map.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 100, right: 500 }, // Account for chat panel
      duration: 1200,
      maxZoom: 13.5,
    });

  }, [highlightedNeighborhoods, neighborhoodsData]);

  // Load crime data
  const loadCrimeData = useCallback(async (neighborhood?: string, category?: string) => {
    if (!map.current) return;
    
    setIsLoadingCrime(true);
    try {
      const params = new URLSearchParams();
      if (neighborhood) params.append('neighborhood', neighborhood);
      if (category) params.append('category', category);
      params.append('limit', '1000');
      
      const response = await fetch(`/api/crime/heatmap?${params}`);
      const data = await response.json();
      
      setCrimeData(data);
      
      // Update map source
      const source = map.current.getSource('crime-points');
      if (source && source.type === 'geojson') {
        (source as mapboxgl.GeoJSONSource).setData(data);
      }
      
      console.log(`✅ Loaded ${data.features.length} crime incidents`);
    } catch (error) {
      console.error('Failed to load crime data:', error);
    } finally {
      setIsLoadingCrime(false);
    }
  }, []);

  // Toggle visualization mode
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    // Check if layers exist before trying to modify them
    if (!map.current.getLayer('neighborhoods-fill')) {
      console.log('Layers not ready yet, skipping visibility toggle');
      return;
    }
    
    const neighborhoodsVisible = visualizationMode === 'neighborhoods' || visualizationMode === 'both';
    const crimeVisible = visualizationMode === 'heatmap' || visualizationMode === 'both';
    
    console.log('Setting visualization mode:', visualizationMode);
    
    // Toggle neighborhood layers
    map.current.setLayoutProperty('neighborhoods-fill', 'visibility', neighborhoodsVisible ? 'visible' : 'none');
    map.current.setLayoutProperty('neighborhoods-outline', 'visibility', neighborhoodsVisible ? 'visible' : 'none');
    map.current.setLayoutProperty('neighborhoods-labels', 'visibility', neighborhoodsVisible ? 'visible' : 'none');
    
    // Toggle crime layers
    if (map.current.getLayer('crime-heatmap')) {
      map.current.setLayoutProperty('crime-heatmap', 'visibility', crimeVisible ? 'visible' : 'none');
    }
    
    // Load crime data if switching to crime view and no data loaded yet
    if (crimeVisible && !crimeData) {
      loadCrimeData();
    }
  }, [visualizationMode]);

  // Handle map actions from AI
  useEffect(() => {
    if (!map.current || !mapAction || !map.current.isStyleLoaded()) return;
    
    if (mapAction.type === 'showHeatmap' && mapAction.data) {
      console.log('🎯 AI requested heat map visualization');
      
      // Update crime data source with AI-provided data
      const source = map.current.getSource('crime-points');
      if (source && source.type === 'geojson') {
        (source as mapboxgl.GeoJSONSource).setData(mapAction.data);
        setCrimeData(mapAction.data);
      }
      
      // Switch to heat map or both view
      setVisualizationMode('both');
    }
  }, [mapAction]);

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
          style={{
            position: 'absolute',
            top: '88px',
            left: '24px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '10px 14px',
            zIndex: 10,
            pointerEvents: 'none',
            border: '1px solid #e5e5e5',
          }}
        >
          <p style={{ 
            fontWeight: 500, 
            color: '#000', 
            margin: 0,
            fontSize: '14px',
          }}>
            {hoveredNeighborhood}
          </p>
        </div>
      )}


      {/* Visualization Mode Toggle */}
      <div
        style={{
          position: 'absolute',
          top: '88px',
          right: isChatVisible ? '504px' : '24px',
          zIndex: 20,
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '6px',
            border: '1px solid #e5e5e5',
          }}
        >
          {(['neighborhoods', 'heatmap', 'both'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVisualizationMode(mode)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: visualizationMode === mode ? '500' : '400',
                color: visualizationMode === mode ? '#000' : '#666',
                background: visualizationMode === mode ? '#f0f0f0' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                marginBottom: mode === 'both' ? '0' : '2px',
              }}
              onMouseEnter={(e) => {
                if (visualizationMode !== mode) {
                  e.currentTarget.style.background = '#f9f9f9';
                }
              }}
              onMouseLeave={(e) => {
                if (visualizationMode !== mode) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {mode === 'neighborhoods' && '🗺️ Neighborhoods'}
              {mode === 'heatmap' && '🔥 Crime Data'}
              {mode === 'both' && '👁️ Both'}
            </button>
          ))}
        </div>
      </div>

    </>
  );
}
