'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

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
      style: 'mapbox://styles/mapbox/light-v11',
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

        // Add neighborhood data
        map.current.addSource('neighborhoods', {
          type: 'geojson',
          data: sfNeighborhoods,
          generateId: true,
        });

        // Fill layer with gradient
        map.current.addLayer({
          id: 'neighborhoods-fill',
          type: 'fill',
          source: 'neighborhoods',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#3b82f6',
              ['boolean', ['feature-state', 'hover'], false],
              '#60a5fa',
              '#93c5fd'
            ],
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.3,
              13, 0.5
            ],
          },
          layout: {},
        });

        // Outline layer
        map.current.addLayer({
          id: 'neighborhoods-outline',
          type: 'line',
          source: 'neighborhoods',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#1e40af',
              ['boolean', ['feature-state', 'hover'], false],
              '#2563eb',
              '#ffffff'
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              3,
              ['boolean', ['feature-state', 'hover'], false],
              2.5,
              1.5
            ],
            'line-opacity': 0.8,
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

        let hoveredFeatureId: number | null = null;
        let selectedFeatureId: number | null = null;

        // Smooth hover effect
        map.current.on('mousemove', 'neighborhoods-fill', (e) => {
          if (!map.current) return;
          
          map.current.getCanvas().style.cursor = 'pointer';

          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            
            if (hoveredFeatureId !== null && hoveredFeatureId !== selectedFeatureId) {
              map.current.setFeatureState(
                { source: 'neighborhoods', id: hoveredFeatureId },
                { hover: false }
              );
            }

            hoveredFeatureId = feature.id as number;
            
            if (hoveredFeatureId !== selectedFeatureId) {
              map.current.setFeatureState(
                { source: 'neighborhoods', id: hoveredFeatureId },
                { hover: true }
              );
            }

            setHoveredNeighborhood(feature.properties?.name);
          }
        });

        map.current.on('mouseleave', 'neighborhoods-fill', () => {
          if (!map.current) return;
          
          map.current.getCanvas().style.cursor = '';

          if (hoveredFeatureId !== null && hoveredFeatureId !== selectedFeatureId) {
            map.current.setFeatureState(
              { source: 'neighborhoods', id: hoveredFeatureId },
              { hover: false }
            );
          }

          hoveredFeatureId = null;
          setHoveredNeighborhood(null);
        });

        // Click with beautiful popup
        map.current.on('click', 'neighborhoods-fill', (e) => {
          if (!map.current || !e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const name = feature.properties?.name;
          const link = feature.properties?.link;

          // Remove previous selection
          if (selectedFeatureId !== null) {
            map.current.setFeatureState(
              { source: 'neighborhoods', id: selectedFeatureId },
              { selected: false }
            );
          }

          // Set new selection
          selectedFeatureId = feature.id as number;
          map.current.setFeatureState(
            { source: 'neighborhoods', id: selectedFeatureId },
            { selected: true }
          );

          setSelectedNeighborhood(name);

          // Remove existing popup
          if (popupRef.current) {
            popupRef.current.remove();
          }

          // Create beautiful popup
          const popupHTML = `
            <div style="
              padding: 20px; 
              min-width: 280px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            ">
              <div style="
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
              ">
                <div style="
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                "></div>
                <h3 style="
                  font-weight: 600; 
                  font-size: 20px; 
                  margin: 0;
                  color: #111827;
                  letter-spacing: -0.01em;
                ">${name}</h3>
              </div>
              <div style="
                padding: 12px;
                background: linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%);
                border-radius: 12px;
                margin-bottom: 12px;
              ">
                <div style="
                  font-size: 14px;
                  color: #6b7280;
                  margin-bottom: 8px;
                ">Coming soon:</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <span style="
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    background: white;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #3b82f6;
                    font-weight: 500;
                  ">⭐ Ratings</span>
                  <span style="
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    background: white;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #8b5cf6;
                    font-weight: 500;
                  ">💬 Reviews</span>
                  <span style="
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    background: white;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #ec4899;
                    font-weight: 500;
                  ">📸 Photos</span>
                </div>
              </div>
              ${link ? `
                <a 
                  href="${link}" 
                  target="_blank"
                  style="
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #3b82f6; 
                    text-decoration: none; 
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                  "
                  onmouseover="this.style.gap='8px'"
                  onmouseout="this.style.gap='6px'"
                >
                  Learn more on Wikipedia
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              ` : ''}
            </div>
          `;

          popupRef.current = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '320px',
            className: 'custom-popup',
            offset: 15,
          })
            .setLngLat(e.lngLat)
            .setHTML(popupHTML)
            .addTo(map.current);

          // Smooth fly to
          map.current.flyTo({
            center: e.lngLat,
            zoom: 13.5,
            duration: 1000,
            essential: true,
            easing: (t) => t * (2 - t), // easeOutQuad
          });

          popupRef.current.on('close', () => {
            if (map.current && selectedFeatureId !== null) {
              map.current.setFeatureState(
                { source: 'neighborhoods', id: selectedFeatureId },
                { selected: false }
              );
              selectedFeatureId = null;
              setSelectedNeighborhood(null);
            }
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

  return (
    <>
      <style jsx global>{`
        .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .mapboxgl-popup-close-button {
          font-size: 24px !important;
          padding: 8px 12px !important;
          color: #9ca3af !important;
          transition: all 0.2s;
        }
        
        .mapboxgl-popup-close-button:hover {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
        }

        .mapboxgl-ctrl-group {
          border-radius: 12px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }

        .mapboxgl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
        }

        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>

      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      
      {/* Glassmorphic hover tooltip */}
      {hoveredNeighborhood && !selectedNeighborhood && (
        <div
          style={{
            position: 'absolute',
            top: '88px',
            left: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            padding: '16px 20px',
            zIndex: 10,
            pointerEvents: 'none',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <p style={{ 
            fontWeight: 600, 
            color: '#111827', 
            margin: 0,
            fontSize: '16px',
            letterSpacing: '-0.01em',
          }}>
            {hoveredNeighborhood}
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            margin: '4px 0 0 0',
            fontWeight: 500,
          }}>
            Click to explore
          </p>
        </div>
      )}

      {/* Beautiful info card */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          zIndex: 10,
          maxWidth: '320px',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}>
            🏘️
          </div>
          <div>
            <h3 style={{ 
              fontWeight: 700, 
              fontSize: '18px', 
              color: '#111827', 
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              San Francisco
            </h3>
            <p style={{ 
              fontSize: '13px', 
              color: '#6b7280', 
              margin: '2px 0 0 0',
              fontWeight: 500,
            }}>
              117 neighborhoods
            </p>
          </div>
        </div>
        
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)',
          borderRadius: '12px',
          marginBottom: '12px',
        }}>
          <p style={{ 
            fontSize: '13px', 
            color: '#4b5563',
            margin: 0,
            lineHeight: '1.6',
            fontWeight: 500,
          }}>
            Explore neighborhoods, discover hidden gems, and find your perfect SF spot.
          </p>
        </div>

        <div style={{ 
          fontSize: '12px', 
          color: '#9ca3af',
          fontWeight: 500,
        }}>
          💡 Hover to preview • Click to explore
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
