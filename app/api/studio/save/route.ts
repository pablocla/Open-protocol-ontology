import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project, nodes, edges } = body;

    if (!nodes || !edges) {
      return NextResponse.json({ success: false, error: 'Missing nodes or edges data' }, { status: 400 });
    }

    const workspaceDir = process.env.OPO_WORKSPACE_DIR || process.cwd();
    const manifestDir = path.join(workspaceDir, '.well-known');
    const manifestPath = path.join(manifestDir, 'opo.json');

    console.log(`[API Save] Saving manifest to: ${manifestPath}`);

    // Compile entities from visual graph
    const entityNodes = nodes.filter((n: any) => n.type === 'entityNode');
    const supportedEntities: any[] = [];
    const customMappings: Record<string, any> = {};

    entityNodes.forEach((node: any) => {
      const canonicalName = String(node.data.label).trim();
      const canonicalUri = `opo:${canonicalName}`;
      const tableName = node.id; // Node ID represents physical reference

      supportedEntities.push({
        canonical: canonicalUri,
        native_reference: tableName,
        confidence: 1.0,
        limitations: node.data.description || `Mapped table ${tableName}`
      });

      const fieldsMapping: Record<string, string> = {};
      const attributes = node.data.attributes || [];
      
      attributes.forEach((attr: any) => {
        const camelName = attr.name.toLowerCase().replace(/_([a-z])/g, (_m: any, group: string) => group.toUpperCase());
        fieldsMapping[camelName] = attr.name;
      });

      customMappings[canonicalName] = {
        [`${tableName}_fields`]: fieldsMapping,
        attributes // Preserve full visual schema metadata
      };
    });

    // Compile relationships
    const relationships = edges.map((edge: any) => {
      const sourceNode = entityNodes.find((n: any) => n.id === edge.source);
      const targetNode = entityNodes.find((n: any) => n.id === edge.target);
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceCanonical: sourceNode ? `opo:${sourceNode.data.label}` : '',
        targetCanonical: targetNode ? `opo:${targetNode.data.label}` : '',
        sourceColumn: edge.data?.sourceFieldName || 'targetEntities',
        targetColumn: edge.data?.targetFieldName || 'sourceEntity',
        cardinality: edge.data?.cardinality || 'ONE_TO_MANY'
      };
    });

    // Load existing manifest if any, to preserve standard keys
    let existingManifest: any = {};
    if (fs.existsSync(manifestPath)) {
      try {
        existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (e) {
        // Ignored
      }
    }

    const compiledManifest = {
      opo_version: '0.1.0',
      system_identity: {
        erp_name: project?.name || existingManifest.system_identity?.erp_name || 'My ERP',
        version: existingManifest.system_identity?.version || '1.0',
        organization_name: existingManifest.system_identity?.organization_name || 'My Organization'
      },
      adapter_configuration: existingManifest.adapter_configuration || {
        base_url: '',
        protocol_interface: 'REST'
      },
      supported_entities: supportedEntities,
      custom_mappings: customMappings,
      relationships: relationships,
      updatedAt: new Date().toISOString(),
      
      // Extended private canvas state for restoration
      _studio_canvas: {
        project: project || { name: 'My OPO Project' },
        nodes,
        edges
      }
    };

    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }

    fs.writeFileSync(manifestPath, JSON.stringify(compiledManifest, null, 2), 'utf8');

    return NextResponse.json({ 
      success: true, 
      message: 'Workspace saved successfully!', 
      path: manifestPath 
    });

  } catch (error: any) {
    console.error('[API Save] Error saving workspace:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to save workspace: ${error.message}` 
    }, { status: 500 });
  }
}
