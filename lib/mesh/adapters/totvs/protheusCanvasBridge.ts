import { Node, Edge } from '@xyflow/react';
import { EntityNodeData, RelationEdgeData } from '../../../studio/studioTypes';
import { ProtheusDeltaReport } from './protheusDeltaMerge';
import { OpoManifestFromProtheus, ProtheusEntityAttribute } from './protheusTypes';

export interface ProtheusCanvasGraph {
  project: { name: string };
  nodes: Node<EntityNodeData>[];
  edges: Edge<RelationEdgeData>[];
}

function isDeltaAttribute(attr: ProtheusEntityAttribute): boolean {
  return (attr.comment || '').includes('[_opo_origin:delta]');
}

/**
 * Convierte un manifiesto OPO Protheus en nodos/edges para OPO Studio canvas.
 */
export function manifestToCanvasGraph(
  manifest: OpoManifestFromProtheus,
  delta?: ProtheusDeltaReport
): ProtheusCanvasGraph {
  const nodes: Node<EntityNodeData>[] = [];
  const edges: Edge<RelationEdgeData>[] = [];
  const deltaTables = new Set(delta?.newTables.map((t) => t.X2_CHAVE.toUpperCase()) ?? []);
  const deltaFields = new Set(
    delta?.newFields.map((f) => `${f.table.toUpperCase()}.${f.field}`) ?? []
  );

  const entities = manifest.supported_entities || [];
  const mappings = manifest.custom_mappings || {};

  entities.forEach((ent, idx) => {
    const canonicalName = ent.canonical.replace(/^opo:/, '');
    const tableName = ent.native_reference.split(' ')[0].trim();
    const mappingInfo: any = mappings[canonicalName] || {};
    const attrs = (mappingInfo.attributes as ProtheusEntityAttribute[]) || [];

    nodes.push({
      id: tableName,
      type: 'entityNode',
      position: { x: 80 + (idx % 4) * 300, y: 80 + Math.floor(idx / 4) * 280 },
      data: {
        label: canonicalName,
        description: ent.limitations || mappingInfo.protheus_meta?.description || tableName,
        type: deltaTables.has(tableName.toUpperCase()) ? 'Custom Table' : 'Table',
        attributes: attrs.map((a) => ({
          ...a,
          comment: deltaFields.has(`${tableName.toUpperCase()}.${a.name}`)
            ? `${a.comment || a.name} 🆕`
            : a.comment,
        })),
      },
    });
  });

  (manifest.relationships || []).forEach((rel, idx) => {
    const isNew = delta?.newRelationships.some((d) => d.id === rel.id);
    edges.push({
      id: rel.id || `e-${rel.sourceTable}-${rel.targetTable}-${idx}`,
      source: rel.sourceTable,
      target: rel.targetTable,
      animated: true,
      type: 'smoothstep',
      data: {
        label: isNew ? 'SX9 🆕' : 'SX9',
        cardinality: rel.cardinality,
        sourceFieldName: rel.sourceField,
        targetFieldName: rel.targetField,
      },
    });
  });

  return {
    project: { name: manifest.system_identity?.erp_name || 'TOTVS Protheus' },
    nodes,
    edges,
  };
}

/** Entidades para el endpoint /api/studio/discover (formato legacy) */
export function manifestToDiscoverEntities(manifest: OpoManifestFromProtheus, delta?: ProtheusDeltaReport) {
  const graph = manifestToCanvasGraph(manifest, delta);
  return graph.nodes.map((n) => ({
    name: String(n.data.label),
    originalTable: n.id,
    description: n.data.description || '',
    attributes: n.data.attributes || [],
    isDelta: n.data.type === 'Custom Table',
    rowCount: 0,
  }));
}