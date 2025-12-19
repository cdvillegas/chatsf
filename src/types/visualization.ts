/**
 * Visualization Types for AI-Driven Data Exploration
 */

export type VisualizationType = 
  | 'map' 
  | 'bar' 
  | 'line' 
  | 'pie' 
  | 'scatter' 
  | 'table' 
  | 'heatmapGrid';

export interface BaseVisualization {
  type: VisualizationType;
  title?: string;
  description?: string;
}

export interface MapVisualization extends BaseVisualization {
  type: 'map';
  config: {
    selectedNeighborhoods?: string[];
    bounds?: [[number, number], [number, number]];
    center?: [number, number];
    zoom?: number;
    visualizationMode?: 'neighborhoods' | 'heatmap' | 'both';
    route?: {
      coordinates: [number, number][];
      from: string;
      to: string;
      distance?: string;
      duration?: string;
    };
    heatmapData?: any;
  };
}

export interface ChartVisualization extends BaseVisualization {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }>;
  };
  options?: {
    xAxisLabel?: string;
    yAxisLabel?: string;
    showLegend?: boolean;
  };
}

export interface TableVisualization extends BaseVisualization {
  type: 'table';
  data: {
    columns: Array<{ key: string; label: string; sortable?: boolean }>;
    rows: Array<Record<string, any>>;
  };
  options?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    pageSize?: number;
  };
}

export interface HeatmapGridVisualization extends BaseVisualization {
  type: 'heatmapGrid';
  data: {
    xLabels: string[];
    yLabels: string[];
    values: number[][];
  };
  options?: {
    colorScale?: 'blue' | 'green' | 'red' | 'gradient';
    showValues?: boolean;
  };
}

export type VisualizationState = 
  | MapVisualization 
  | ChartVisualization 
  | TableVisualization 
  | HeatmapGridVisualization;

// Enhanced Message type with visualization
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visualization?: VisualizationState;
}
