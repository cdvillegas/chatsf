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
  const [visualizationMode, setVisualizationMode] = useState<'neighborhoods' | 'heatmap' | 'both'>('neighborhoods');
  const [crimeData, setCrimeData] = useState<any>(null);
  const [isLoadingCrime, setIsLoadingCrime] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

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

        // Store neighborhoods data for later use
        setNeighborhoodsData(sfNeighborhoods);

        // Add neighborhood data
        map.current.addSource('neighborhoods', {
          type: 'geojson',
          data: sfNeighborhoods,
          generateId: true,
        });

        // Fill layer with monochrome styling based on crime rates
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
                0, 'rgba(0, 200, 100, 0.3)',     // Low crime = green tint
                10000, 'rgba(255, 200, 0, 0.3)',  // Medium = yellow tint
                20000, 'rgba(255, 100, 0, 0.3)',  // High = orange tint
                30000, 'rgba(255, 0, 0, 0.3)'     // Very high = red tint
              ],
              'rgba(100, 100, 100, 0.15)' // Default gray for no data
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

        // Labels with fade-in (hidden by default)
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
            'visibility': 'none', // Hidden by default
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
    if (!mapLoaded || !map.current || !neighborhoodsData || highlightedNeighborhoods.length === 0) return;

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

  }, [mapLoaded, highlightedNeighborhoods, neighborhoodsData]);

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
    if (!mapLoaded || !map.current) return;
    
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
  }, [mapLoaded, visualizationMode, crimeData, loadCrimeData]);

  // Handle map actions from AI
  useEffect(() => {
    if (!mapLoaded || !map.current || !mapAction) return;
    
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
  }, [mapLoaded, mapAction]);

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


      {/* Visualization Mode Toggle */}
      <div
        style={{
          position: 'absolute',
          top: '88px',
          right: '504px',
          zIndex: 20,
        }}
      >
        <div className="card" style={{ padding: '6px' }}>
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
                color: visualizationMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: visualizationMode === mode ? 'var(--bg-tertiary)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                marginBottom: mode === 'both' ? '0' : '2px',
              }}
              onMouseEnter={(e) => {
                if (visualizationMode !== mode) {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
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
