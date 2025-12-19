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
  isChatVisible: boolean;
}

export default function VisualizationPanel({ visualization, isChatVisible }: VisualizationPanelProps) {
  // Default to map if no visualization
  if (!visualization) {
    return <MapContainer isChatVisible={isChatVisible} />;
  }

  return (
    <div 
      className="visualization-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {visualization.type === 'map' && (
        <MapContainer 
          highlightedNeighborhoods={visualization.config.selectedNeighborhoods}
          isChatVisible={isChatVisible}
          mapAction={{
            type: 'showNeighborhoods',
            ...visualization.config
          } as any}
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
