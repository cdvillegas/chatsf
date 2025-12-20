/**
 * Visualization Types - Simplified for Neighborhood Selection
 */

export type VisualizationType = 'map';

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
    visualizationMode?: 'neighborhoods';
  };
}

export type VisualizationState = MapVisualization;

// Enhanced Message type with visualization
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visualization?: VisualizationState;
}
