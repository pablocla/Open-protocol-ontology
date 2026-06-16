import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const workspaceDir = process.env.OPO_WORKSPACE_DIR || process.cwd();
    const manifestPath = path.join(workspaceDir, '.well-known', 'opo.json');
    const workspacePath = path.join(workspaceDir, '.opo', 'workspace.json');

    console.log(`[API Load] Loading workspace from: ${workspacePath} and manifest: ${manifestPath}`);

    let manifest: any = {};
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (e) {
        console.error('[API Load] Error parsing manifest:', e);
      }
    }

    if (fs.existsSync(workspacePath)) {
      try {
        const wsData = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
        const erpWorkspace = wsData.erpWorkspace || {};
        const ai = wsData.ai || {};
        
        // Resolve password/API key if references are provided
        if (erpWorkspace && erpWorkspace.connectionRef && erpWorkspace.connectionRef.startsWith('vault:')) {
          try {
            const { CredentialVault } = require('@/lib/engine/vault/credential-vault');
            const vault = new CredentialVault();
            const keyId = erpWorkspace.connectionRef.replace('vault:', '');
            const password = vault.getKey(keyId);
            vault.close();
            
            // Reconstruct full connectionString if mssqlMasked exists
            if (erpWorkspace.mssqlMasked) {
              const { buildMssqlConnectionString } = require('@/lib/studio/onboarding/connectionBuilder');
              const fullMssql = { ...erpWorkspace.mssqlMasked, password };
              erpWorkspace.connectionString = buildMssqlConnectionString(fullMssql);
            }
          } catch (vaultErr) {
            console.warn('[API Load] Failed to resolve connection password from vault:', vaultErr);
          }
        }

        if (ai && ai.cloudApiKeyRef && ai.cloudApiKeyRef.startsWith('vault:')) {
          try {
            const { CredentialVault } = require('@/lib/engine/vault/credential-vault');
            const vault = new CredentialVault();
            const keyId = ai.cloudApiKeyRef.replace('vault:', '');
            ai.cloudApiKey = vault.getKey(keyId);
            vault.close();
          } catch (vaultErr) {
            console.warn('[API Load] Failed to resolve cloud API key from vault:', vaultErr);
          }
        }

        return NextResponse.json({
          exists: true,
          project: wsData.project || { name: 'OPO Project' },
          nodes: wsData.nodes || [],
          edges: wsData.edges || [],
          erpWorkspace,
          ai,
          manifest
        });
      } catch (wsErr: any) {
        console.error('[API Load] Error loading workspace.json, falling back:', wsErr);
      }
    }

    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({ 
        exists: false, 
        message: 'No OPO manifest found in workspace.' 
      });
    }

    // If canvas metadata exists, return it directly
    if (manifest._studio_canvas) {
      return NextResponse.json({
        exists: true,
        project: manifest._studio_canvas.project || { name: manifest.system_identity?.erp_name || 'Discovered Project' },
        nodes: manifest._studio_canvas.nodes || [],
        edges: manifest._studio_canvas.edges || [],
        manifest
      });
    }

    // Reconstruct nodes and edges dynamically from standard OPO metadata if canvas is missing
    console.log('[API Load] _studio_canvas missing. Reconstructing visual graph from OPO manifest...');
    
    const nodes: any[] = [];
    const edges: any[] = [];
    
    const entities = manifest.supported_entities || [];
    const mappings = manifest.custom_mappings || {};
    const relationships = manifest.relationships || [];

    // 1. Reconstruct Entity Nodes
    entities.forEach((ent: any, idx: number) => {
      const canonicalName = ent.canonical.replace(/^opo:/, '');
      const mappingInfo = mappings[canonicalName] || {};
      const fieldsKey = Object.keys(mappingInfo).find(k => k.endsWith('_fields'));
      const fields = fieldsKey ? mappingInfo[fieldsKey] : {};
      
      // Mapped attributes
      const attributes = (mappingInfo.attributes as any[]) || Object.keys(fields).map((fieldName, fIdx) => ({
        id: `attr-${canonicalName}-${fieldName}`,
        name: fields[fieldName],
        type: 'String' as const,
        isPrimaryKey: fIdx === 0,
        isRequired: fIdx === 0,
        isUnique: fIdx === 0
      }));

      nodes.push({
        id: ent.native_reference || canonicalName,
        type: 'entityNode',
        position: { x: 100 + (idx % 3) * 320, y: 100 + Math.floor(idx / 3) * 250 },
        data: {
          label: canonicalName,
          description: ent.limitations || `Auto-discovered physical table ${ent.native_reference}`,
          attributes
        }
      });
    });

    // 2. Reconstruct Relation Edges
    relationships.forEach((rel: any) => {
      edges.push({
        id: rel.id || `e-${rel.source}-${rel.target}`,
        source: rel.source,
        target: rel.target,
        animated: true,
        type: 'smoothstep',
        data: {
          cardinality: rel.cardinality || 'ONE_TO_MANY',
          sourceFieldName: rel.sourceField || rel.sourceColumn || 'targetEntities',
          targetFieldName: rel.targetField || rel.targetColumn || 'sourceEntity'
        }
      });
    });

    return NextResponse.json({
      exists: true,
      project: { name: manifest.system_identity?.erp_name || 'Discovered Project' },
      nodes,
      edges,
      manifest
    });

  } catch (error: any) {
    console.error('[API Load] Error loading local workspace:', error);
    return NextResponse.json({ 
      exists: false, 
      error: `Failed to load workspace: ${error.message}` 
    }, { status: 500 });
  }
}
