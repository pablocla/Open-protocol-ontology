import { ToolDefinition } from './meshTypes';
import { callMCPTool } from './mcpClient';

export class OPORuntime {
  
  /**
   * Executes a semantic tool call abstracting away the transport layer.
   */
  async executeTool(toolDef: ToolDefinition, operationName: string, args: Record<string, unknown>): Promise<any> {
    
    switch (toolDef.type) {
      case 'mcp':
        return this.executeMCPTool(toolDef, operationName, args);
      case 'n8n_webhook':
        return this.executeN8nWebhook(toolDef, args);
      case 'rest_api':
        return this.executeRestApi(toolDef, args);
      case 'sql_direct':
        return this.executeDirectSQL(toolDef, args);
      default:
        throw new Error(`Unsupported tool type: ${toolDef.type}`);
    }
  }

  private async executeMCPTool(toolDef: ToolDefinition, operationName: string, args: Record<string, unknown>): Promise<any> {
    console.log(`[OPORuntime] Executing MCP Tool ${operationName} on ${toolDef.endpoint}`);
    try {
      const result = await callMCPTool(toolDef.endpoint, operationName, args);
      return {
        status: 'success',
        provider: 'mcp',
        operation: operationName,
        data: result
      };
    } catch (error: any) {
      return {
        status: 'error',
        provider: 'mcp',
        message: error.message
      };
    }
  }

  private async executeN8nWebhook(toolDef: ToolDefinition, args: Record<string, unknown>): Promise<any> {
    console.log(`[OPORuntime] Triggering n8n webhook on ${toolDef.endpoint}`);
    try {
      const response = await fetch(toolDef.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      const data = await response.json().catch(() => ({}));
      return { status: 'success', provider: 'n8n_webhook', data };
    } catch (error: any) {
      return { status: 'error', provider: 'n8n_webhook', message: error.message };
    }
  }

  private async executeRestApi(toolDef: ToolDefinition, args: Record<string, unknown>): Promise<any> {
    try {
      // Very basic REST mapping. Real implementation would map method and path params.
      const response = await fetch(toolDef.endpoint, {
        method: 'POST', // Defaulting to POST for execution
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      const data = await response.json().catch(() => ({}));
      return { status: 'success', provider: 'rest_api', data };
    } catch (error: any) {
      return { status: 'error', provider: 'rest_api', message: error.message };
    }
  }

  private async executeDirectSQL(toolDef: ToolDefinition, args: Record<string, unknown>): Promise<any> {
    // Requires a secure backend proxy to actually execute SQL.
    // For now, if the endpoint is provided, we send the query there.
    try {
      const response = await fetch(toolDef.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: args.query || args })
      });
      const data = await response.json().catch(() => ({}));
      return { status: 'success', provider: 'sql_direct', data };
    } catch (error: any) {
      return { status: 'error', provider: 'sql_direct', message: error.message };
    }
  }
}

export const opoRuntime = new OPORuntime();
