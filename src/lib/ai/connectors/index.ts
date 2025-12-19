/**
 * Connector Registry
 * Manages all data connectors and their tools
 */

import { BaseConnector } from './base';
import { NeighborhoodsConnector } from './neighborhoods';
import { DataSFConnector } from './datasf';
import { CrimeConnector } from './crime';

// Registry of all available connectors
const connectors: BaseConnector[] = [
  new NeighborhoodsConnector(),
  new DataSFConnector(),
  new CrimeConnector(),
];

/**
 * Get all registered connectors
 */
export function getConnectors(): BaseConnector[] {
  return connectors;
}

/**
 * Get all tools from all connectors
 */
export function getAllTools() {
  return connectors.flatMap(connector => 
    connector.getTools().map(tool => ({
      ...tool,
      connectorName: connector.name,
    }))
  );
}

/**
 * Execute a tool by name
 */
export async function executeTool(toolName: string, params: any): Promise<any> {
  for (const connector of connectors) {
    const tool = connector.getTools().find(t => t.name === toolName);
    if (tool) {
      return await connector.executeTool(toolName, params);
    }
  }
  throw new Error(`Tool ${toolName} not found in any connector`);
}

/**
 * Get tool definitions for OpenAI function calling
 */
export function getToolDefinitions() {
  return getAllTools().map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: zodToJsonSchema(tool.parameters),
        required: getRequiredFields(tool.parameters),
      },
    },
  }));
}

// Helper to convert Zod schema to JSON schema
function zodToJsonSchema(schema: any): any {
  // Basic implementation - can be expanded
  if (schema._def?.typeName === 'ZodObject') {
    const shape = schema._def.shape();
    const properties: any = {};
    
    for (const [key, value] of Object.entries(shape)) {
      const field: any = value;
      properties[key] = zodFieldToJson(field);
    }
    
    return properties;
  }
  return {};
}

function zodFieldToJson(field: any): any {
  const def = field._def;
  
  if (def.typeName === 'ZodString') {
    return { type: 'string', description: def.description };
  } else if (def.typeName === 'ZodNumber') {
    return { type: 'number', description: def.description };
  } else if (def.typeName === 'ZodBoolean') {
    return { type: 'boolean', description: def.description };
  } else if (def.typeName === 'ZodArray') {
    return {
      type: 'array',
      items: zodFieldToJson(def.type),
      description: def.description,
    };
  } else if (def.typeName === 'ZodEnum') {
    return {
      type: 'string',
      enum: def.values,
      description: def.description,
    };
  } else if (def.typeName === 'ZodOptional') {
    return zodFieldToJson(def.innerType);
  } else if (def.typeName === 'ZodDefault') {
    return {
      ...zodFieldToJson(def.innerType),
      default: def.defaultValue(),
    };
  }
  
  return { type: 'string' };
}

function getRequiredFields(schema: any): string[] {
  if (schema._def?.typeName !== 'ZodObject') return [];
  
  const shape = schema._def.shape();
  const required: string[] = [];
  
  for (const [key, value] of Object.entries(shape)) {
    const field: any = value;
    if (field._def.typeName !== 'ZodOptional' && field._def.typeName !== 'ZodDefault') {
      required.push(key);
    }
  }
  
  return required;
}
