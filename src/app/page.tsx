'use client';

import { useState } from 'react';
import MapContainer from '@/components/Map/MapContainer';
import ChatInterface from '@/components/Chat/ChatInterface';

export default function Home() {
  const [highlightedNeighborhoods, setHighlightedNeighborhoods] = useState<string[]>([]);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [mapAction, setMapAction] = useState<any>(null);

  const handleMapAction = (action: any) => {
    setMapAction(action);
    // Clear after a short delay to allow MapContainer to process it
    setTimeout(() => setMapAction(null), 100);
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <MapContainer 
          highlightedNeighborhoods={highlightedNeighborhoods}
          isChatVisible={isChatVisible}
          mapAction={mapAction}
        />
      </div>

      {/* Chat Toggle Button */}
      {!isChatVisible && (
        <button
          onClick={() => setIsChatVisible(true)}
          className="btn-primary"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            fontSize: '20px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 45,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          💬
        </button>
      )}

      {/* Chat Interface */}
      <ChatInterface 
        onNeighborhoodsHighlight={setHighlightedNeighborhoods}
        onMapAction={handleMapAction}
        isVisible={isChatVisible}
        onToggle={() => setIsChatVisible(false)}
      />
    </>
  );
}
