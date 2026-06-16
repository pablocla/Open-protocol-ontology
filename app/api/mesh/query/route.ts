import { NextResponse } from 'next/server';
import { semanticRouter } from '@/lib/mesh/semanticRouter';
import { OntologyGraph, ToolDefinition } from '@/lib/mesh/meshTypes';
import { registry } from '@/lib/mesh/registry';
import { enqueueSwarmExecution } from '@/lib/engine/worker/swarm-queue';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, ontology, llmConfig, erpExecution } = body;

    // Resolve all API keys on the server side securely
    const { resolveAllApiKeys, resolveApiKey } = await import('@/lib/mesh/vaultResolver');
    const resolvedApiKeys = resolveAllApiKeys();

    // Populate keys in llmConfig.llmConfigs so the backend has them when agentExecutor looks there
    const updatedLlmConfigs = { ...(llmConfig?.llmConfigs || {}) };
    for (const prov of Object.keys(updatedLlmConfigs)) {
      if (!updatedLlmConfigs[prov].apiKey) {
        updatedLlmConfigs[prov].apiKey = resolvedApiKeys[prov] || resolveApiKey(prov);
      }
    }

    if (!query || !ontology) {
      return NextResponse.json({ error: 'Missing query or ontology' }, { status: 400 });
    }

    // Auto-register tools from workspace
    try {
      const workspaceDir = process.env.OPO_WORKSPACE_DIR || process.cwd();
      const manifestPath = path.join(workspaceDir, '.well-known', 'opo.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const canvas = manifest._studio_canvas;
        if (canvas && canvas.nodes) {
          const toolNodes = canvas.nodes.filter((n: any) => n.type === 'toolNode' || n.type === 'n8nNode');
          
          toolNodes.forEach((node: any) => {
            const endpoint = node.type === 'n8nNode' ? node.data.webhookUrl : node.data.endpoint;
            if (endpoint) {
              const toolDef: ToolDefinition = {
                id: node.id,
                name: node.data.label || 'Tool',
                type: (node.type === 'n8nNode' ? 'n8n_webhook' : (node.data.type || 'mcp')) as any,
                endpoint: endpoint,
                entities: (ontology.entities || []).map((e: any) => e.name),
                operations: [
                  {
                    name: `call_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}`,
                    description: `Call trigger on ${node.data.label || 'Tool'}`,
                    entityTarget: '',
                    inputSchema: { payload: { type: 'string' } }
                  }
                ]
              };
              
              (ontology.entities || []).forEach((entity: any) => {
                toolDef.operations.push({
                  name: `search_${entity.name.toLowerCase()}`,
                  description: `Query data for entity ${entity.name}`,
                  entityTarget: entity.name,
                  inputSchema: { query: { type: 'string' } }
                });
              });

              registry.registerTool(toolDef as any);
              
              const dataQuerier = registry.getAgent('data-querier');
              if (dataQuerier) {
                if (!dataQuerier.tools) dataQuerier.tools = [];
                if (!dataQuerier.tools.some(t => t.toolId === toolDef.id)) {
                  dataQuerier.tools.push({ toolId: toolDef.id, permissions: ['read', 'write'] });
                }
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('[Mesh Query API] Failed to auto-register workspace tools:', e);
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // 1. Route the intent synchronously so we know what needs to be done
    const intent = await semanticRouter.route(query, ontology as OntologyGraph, resolvedApiKeys);

    // 2. Setup Session
    const session = {
      id: sessionId,
      intent,
      messages: [],
      ontologySnapshot: ontology as OntologyGraph,
      createdAt: new Date().toISOString()
    };

    // 3. Enqueue the execution job
    await enqueueSwarmExecution({
      sessionId,
      session,
      apiKeys: resolvedApiKeys,
      llmConfig: {
        ...llmConfig,
        llmConfigs: updatedLlmConfigs,
      },
      erpExecution: erpExecution || { mode: 'mock' },
    });

    // Return immediately to avoid HTTP timeouts. The client will connect to /api/mesh/stream/[sessionId] to get updates
    return NextResponse.json({ 
      success: true, 
      sessionId, 
      intent 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
