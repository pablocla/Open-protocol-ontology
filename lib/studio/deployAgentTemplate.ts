import { Connection, Edge, Node } from '@xyflow/react';
import {
  AGENT_TEMPLATES,
  ENTITY_ALIASES,
  ENTITY_DISPLAY_NAMES,
} from './agentTemplates';

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${idCounter++}`;

function findEntityNode(nodes: Node[], entityKey: string): Node | undefined {
  const aliases = ENTITY_ALIASES[entityKey] ?? [entityKey.toLowerCase()];
  return nodes.find(
    (n) =>
      n.type === 'entityNode' &&
      aliases.some((alias) =>
        String(n.data?.label ?? '')
          .toLowerCase()
          .includes(alias)
      )
  );
}

export function buildAgentTemplateGraph(
  templateId: string,
  existingNodes: Node[],
  existingEdges: Edge[]
): { nodes: Node[]; edges: Edge[]; templateTitle: string } | null {
  const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  const nodes = [...existingNodes];
  const edges = [...existingEdges];
  const entityNodeIds: string[] = [];
  const baseX = 320;
  const baseY = 180;

  template.relatedEntities.forEach((entityKey, idx) => {
    let entityNode = findEntityNode(nodes, entityKey);
    if (!entityNode) {
      entityNode = {
        id: nextId('entity'),
        type: 'entityNode',
        position: { x: baseX + idx * 300, y: baseY + 220 },
        data: {
          label: ENTITY_DISPLAY_NAMES[entityKey] ?? entityKey,
          description: `Área de negocio vinculada al empleado virtual`,
          attributes: [],
        },
      };
      nodes.push(entityNode);
    }
    entityNodeIds.push(entityNode.id);
  });

  const agentNode: Node = {
    id: nextId('agent'),
    type: 'agentNode',
    position: {
      x: baseX + ((template.relatedEntities.length - 1) * 300) / 2,
      y: baseY,
    },
    data: {
      label: template.title,
      description: template.description,
      capabilities: template.capabilities,
      domains: template.domains,
      systemPrompt: template.systemPrompt,
      templateId: template.id,
    },
  };
  nodes.push(agentNode);

  entityNodeIds.forEach((targetId) => {
    const edgeId = `e-${agentNode.id}-${targetId}`;
    if (!edges.some((e) => e.id === edgeId)) {
      const connection: Connection = {
        source: agentNode.id,
        target: targetId,
        sourceHandle: null,
        targetHandle: null,
      };
      edges.push({
        ...connection,
        id: edgeId,
        animated: true,
        type: 'smoothstep',
        data: {
          cardinality: 'ONE_TO_MANY',
          sourceFieldName: 'targetEntities',
          targetFieldName: 'sourceEntity',
        },
      });
    }
  });

  return { nodes, edges, templateTitle: template.title };
}