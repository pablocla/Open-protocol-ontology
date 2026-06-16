import { Node, Edge } from '@xyflow/react';
import { EntityNodeData, RelationEdgeData, EntityAttribute } from '../studio/studioTypes';
import { OntologyGraph, OntologyEntity, OntologyRelation } from './meshTypes';

/**
 * Compiles the visual graph (nodes and edges) into a semantic Ontology Graph.
 */
export function compileOntology(
  nodes: Node<EntityNodeData>[],
  edges: Edge<RelationEdgeData>[],
  projectName: string = 'Untitled Project'
): OntologyGraph {
  
  const entityNodes = nodes.filter(n => n.type === 'entityNode');
  const compiledEntities: OntologyEntity[] = [];

  entityNodes.forEach(node => {
    // Find all outgoing edges from this node
    const outgoingEdges = edges.filter(e => e.source === node.id);
    const relations: OntologyRelation[] = [];

    outgoingEdges.forEach(edge => {
      const targetNode = entityNodes.find(n => n.id === edge.target);
      if (targetNode) {
        const edgeData = edge.data || {
          cardinality: 'ONE_TO_MANY',
          sourceFieldName: 'targetEntities',
          targetFieldName: 'sourceEntity'
        };

        relations.push({
          id: edge.id,
          targetEntityId: targetNode.id,
          targetEntityName: String(targetNode.data.label),
          cardinality: edgeData.cardinality,
          sourceFieldName: edgeData.sourceFieldName,
          targetFieldName: edgeData.targetFieldName
        });
      }
    });

    const attributes = (node.data.attributes as EntityAttribute[]) || [];

    compiledEntities.push({
      id: node.id,
      name: String(node.data.label),
      description: node.data.description as string | undefined,
      attributes: attributes.map(attr => ({
        id: attr.id,
        name: attr.name,
        type: attr.type,
        isPrimaryKey: attr.isPrimaryKey,
        isRequired: attr.isRequired,
        isUnique: attr.isUnique,
        length: attr.length,
        precision: attr.precision,
        scale: attr.scale,
        comment: attr.comment
      })),
      relations,
      rowCount: (node.data as any).rowCount || 0
    });
  });

  return {
    projectName,
    entities: compiledEntities,
    compiledAt: new Date().toISOString()
  };
}
