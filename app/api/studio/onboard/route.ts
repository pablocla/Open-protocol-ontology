import { NextResponse } from 'next/server';
import { runDiscovery, persistWorkspace } from '@/lib/studio/onboarding/onboardingOrchestrator';
import { OnboardingConfig } from '@/lib/studio/onboarding/onboardingTypes';

export async function POST(request: Request) {
  try {
    const config = (await request.json()) as OnboardingConfig;
    
    // Run discovery
    const { manifest, graph } = await runDiscovery(config);
    
    // Persist manifest and workspace.json
    const { manifestPath, workspacePath, connectionRef } = await persistWorkspace(config, manifest, graph);
    
    const erpWorkspace = {
      erpId: config.erp.erpId,
      dataMode: config.erp.dataMode,
      filial: config.erp.filial,
      companySuffix: config.erp.companySuffix,
      dialect: config.erp.erpId === 'protheus' ? 'mssql' : 'postgresql',
      connectionString: config.erp.connectionString,
      connectionRef
    };

    const llmConfigs: any = {};
    if (config.ai.provider === 'ollama') {
      llmConfigs.ollama = { baseUrl: config.ai.ollamaBaseUrl, model: config.ai.ollamaModel };
    } else {
      llmConfigs[config.ai.provider] = { apiKey: config.ai.cloudApiKey };
    }

    return NextResponse.json({
      success: true,
      projectName: config.erp.dataMode === 'live' ? `Protheus — ${config.erp.mssql?.database || 'Empresa'}` : 'Protheus ERP Demo',
      stats: {
        entities: graph.nodes?.length || 0,
        relationships: graph.edges?.length || 0,
      },
      manifestPath,
      workspacePath,
      nodes: graph.nodes || [],
      edges: graph.edges || [],
      erpWorkspace,
      currentProvider: config.ai.provider,
      llmConfigs,
    });
  } catch (error: any) {
    console.error('[API Onboard] Onboarding execution failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Onboarding execution failed',
    }, { status: 500 });
  }
}
