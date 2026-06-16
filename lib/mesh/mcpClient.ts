import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

// Cache of initialized MCP clients to avoid reconnecting on every call
const mcpClients = new Map<string, Client>();

export async function getMCPClient(endpoint: string): Promise<Client> {
  if (mcpClients.has(endpoint)) {
    return mcpClients.get(endpoint)!;
  }

  const transport = new SSEClientTransport(new URL(endpoint));
  const client = new Client(
    { name: "opo-mesh-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  mcpClients.set(endpoint, client);

  // Optional: handle disconnects
  transport.onclose = () => {
    mcpClients.delete(endpoint);
  };

  return client;
}

export async function callMCPTool(endpoint: string, toolName: string, args: any): Promise<any> {
  try {
    const client = await getMCPClient(endpoint);
    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      },
      CallToolResultSchema
    );
    return result;
  } catch (error) {
    console.error(`Error calling MCP tool ${toolName} at ${endpoint}:`, error);
    throw error;
  }
}
