'use client';

import { VisualizationState } from '@/types/visualization';
import MapContainer from '@/components/Map/MapContainer';
import BarChartView from './Charts/BarChartView';
import LineChartView from './Charts/LineChartView';
import PieChartView from './Charts/PieChartView';
import ScatterView from './Charts/ScatterView';
import TableView from './Charts/TableView';
import HeatmapGridView from './Charts/HeatmapGridView';

interface VisualizationPanelProps {
  visualization: VisualizationState | null;
}

export default function VisualizationPanel({ visualization }: VisualizationPanelProps) {
  // Default to map if no visualization
  if (!visualization) {
    return <MapContainer />;
  }

  return (
    <div 
      className="visualization-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'opacity 0.2s ease',
      }}
    >
      {visualization.type === 'map' && (
        <MapContainer 
          highlightedNeighborhoods={visualization.config.selectedNeighborhoods}
        />
      )}
      
      {visualization.type === 'bar' && (
        <BarChartView 
          data={visualization.data} 
          options={visualization.options}
          title={visualization.title}
        />
      )}
      
      {visualization.type === 'line' && (
        <LineChartView 
          data={visualization.data} 
          options={visualization.options}
          title={visualization.title}
        />
      )}
      
      {visualization.type === 'pie' && (
        <PieChartView 
          data={visualization.data} 
          options={visualization.options}
          title={visualization.title}
        />
      )}
      
      {visualization.type === 'scatter' && (
        <ScatterView 
          data={visualization.data} 
          options={visualization.options}
          title={visualization.title}
        />
      )}
      
      {visualization.type === 'table' && (
        <TableView 
          data={visualization.data} 
          options={visualization.options}
          title={visualization.title}
        />
      )}
      
      {visualization.type === 'heatmapGrid' && (
        <HeatmapGridView 
          data={visualization.data} 
          options={visualization.options}
          title={visualization.title}
        />
      )}
    </div>
  );
}
