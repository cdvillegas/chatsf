/**
 * Base interface for data connectors
 * All connectors should implement this interface
 */

import { z } from 'zod';

export interface ConnectorTool {
  name: string;
  description: string;
  parameters: z.ZodType<any>;
  execute: (params: any) => Promise<any>;
}

export abstract class BaseConnector {
  abstract name: string;
  abstract description: string;
  abstract tools: ConnectorTool[];

  /**
   * Get all tools from this connector
   */
  getTools(): ConnectorTool[] {
    return this.tools;
  }

  /**
   * Execute a specific tool
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found in connector ${this.name}`);
    }
    return await tool.execute(params);
  }
}
