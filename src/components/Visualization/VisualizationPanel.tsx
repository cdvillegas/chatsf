'use client';

import { VisualizationState } from '@/types/visualization';
import MapContainer from '@/components/Map/MapContainer';

interface VisualizationPanelProps {
  visualization: VisualizationState | null;
}

export default function VisualizationPanel({ visualization }: VisualizationPanelProps) {
  // Default to map if no visualization
  if (!visualization) {
    return <MapContainer />;
  }

  // Always render map with selected neighborhoods
  return (
    <MapContainer 
      highlightedNeighborhoods={visualization.config.selectedNeighborhoods}
    />
  );
}
