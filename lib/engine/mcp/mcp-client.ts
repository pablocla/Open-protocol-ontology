import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface MCPToolInfo {
  name: string;
  description?: string;
  inputSchema?: any;
}

export class MCPManager {
  /**
   * Discovers tools exposed by an MCP Server via stdio.
   * Note: In a real server environment, starting arbitrary stdio commands is risky.
   * This assumes a trusted local workspace.
   */
  static async discoverTools(command: string, args: string[]): Promise<MCPToolInfo[]> {
    const transport = new StdioClientTransport({
      command,
      args
    });

    const client = new Client(
      {
        name: "opo-mcp-discoverer",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    try {
      await client.connect(transport);
      
      const response = await client.request({ method: "tools/list" }, z.any());
      
      const tools = (response as any).tools || [];
      return tools.map((t: any) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }));
    } finally {
      // Ensure we clean up the child process
      try {
        await client.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

// Dummy zod import for type checking the request
import { z } from 'zod';
