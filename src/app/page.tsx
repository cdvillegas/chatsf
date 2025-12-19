'use client';

import { useState } from 'react';
import VisualizationPanel from '@/components/Visualization/VisualizationPanel';
import ChatInterface from '@/components/Chat/ChatInterface';
import type { VisualizationState } from '@/types/visualization';

export default function Home() {
  const [currentVisualization, setCurrentVisualization] = useState<VisualizationState | null>(null);

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <VisualizationPanel 
          visualization={currentVisualization}
        />
      </div>

      {/* Chat Interface - Always visible */}
      <ChatInterface 
        onVisualizationChange={setCurrentVisualization}
      />
    </>
  );
}
