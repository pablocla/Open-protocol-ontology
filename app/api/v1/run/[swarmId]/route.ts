import { NextResponse } from 'next/server';
import { getApiKeyManager } from '@/lib/engine/auth/api-keys';
import { enqueueSwarmExecution } from '@/lib/engine/worker/swarm-queue';
import { getMeteringService } from '@/lib/engine/billing/metering';
import fs from 'fs';
import path from 'path';

// MOCK: We simulate fetching a swarm from the Registry
// In a real database, swarms are tied to tenantIds and have specific pre-defined Ontology & Intent graphs.
function getSwarmFromRegistry(swarmId: string) {
  try {
    const workspaceDir = process.env.OPO_WORKSPACE_DIR || process.cwd();
    const manifestPath = path.join(workspaceDir, '.well-known', 'opo.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return {
        id: swarmId,
        ontology: manifest._studio_canvas || {}, // Using the canvas directly as mock
        requiredKeys: ['openai'] // This swarm needs openai
      };
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header. Provide Bearer token.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const apiKeysManager = getApiKeyManager();
    const keyData = apiKeysManager.verifyApiKey(token);

    if (!keyData) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    const body = await request.json();
    const { query, inputs } = body;

    if (!query) {
      return NextResponse.json({ error: 'Missing required field: query' }, { status: 400 });
    }

    const swarm = getSwarmFromRegistry(swarmId);
    if (!swarm) {
      return NextResponse.json({ error: 'Swarm not found' }, { status: 404 });
    }

    const sessionId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Billing: Charge a fixed base rate for triggering, we can also charge later in the worker based on actual tokens
    const metering = getMeteringService();
    metering.reportUsage(keyData.tenantId, swarmId, 500); // base cost 500 tokens just to start

    // Setup Session
    const session = {
      id: sessionId,
      intent: { 
        id: `intent_${Date.now()}`,
        rawQuery: query,
        type: 'chat', 
        nodes: [], 
        confidence: 1,
        detectedEntities: [],
        detectedCapabilities: [],
        toolCalls: []
      } as any,
      messages: [{ id: `msg-init-${Date.now()}`, role: 'user' as const, content: query, timestamp: new Date().toISOString() }],
      ontologySnapshot: swarm.ontology as any,
      createdAt: new Date().toISOString()
    };

    // Note: The tenant's API keys (OpenAI) should be fetched from CredentialVault using tenantId.
    // For this mock, we pass empty apiKeys so it relies on the generic Vault fallback if needed, or we'd fetch them here.
    
    // 3. Enqueue the execution job
    await enqueueSwarmExecution({
      sessionId,
      session,
      apiKeys: {} // Should be fetched securely from Vault using keyData.tenantId
    });

    return NextResponse.json({ 
      success: true, 
      runId: sessionId,
      message: 'Swarm execution started. Connect to stream endpoint or configure webhooks to receive results.'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
