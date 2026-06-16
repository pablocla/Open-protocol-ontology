import { Node, Edge } from '@xyflow/react';
import { EntityNodeData, RelationEdgeData } from './studioTypes';

export const MOCK_PROTHEUS_NODES: Node<EntityNodeData>[] = [
  {
    id: 'sx2',
    type: 'entityNode',
    position: { x: 100, y: 100 },
    data: {
      label: 'Diccionario de Datos (SX2)',
      type: 'Core Table',
      description: 'Tablas del sistema',
      attributes: [
        { id: 'attr-1', name: 'X2_CHAVE', type: 'String', isPrimaryKey: true, isRequired: true, isUnique: true },
        { id: 'attr-2', name: 'X2_ARQUIVO', type: 'String', isPrimaryKey: false, isRequired: true, isUnique: false }
      ]
    }
  },
  {
    id: 'sa1',
    type: 'entityNode',
    position: { x: 500, y: 100 },
    data: {
      label: 'Clientes (SA1)',
      type: 'Table',
      description: 'Cadastro de Clientes',
      attributes: [
        { id: 'attr-3', name: 'A1_COD', type: 'String', isPrimaryKey: true, isRequired: true, isUnique: true },
        { id: 'attr-4', name: 'A1_NOME', type: 'String', isPrimaryKey: false, isRequired: true, isUnique: false },
        { id: 'attr-5', name: 'A1_CGC', type: 'String', isPrimaryKey: false, isRequired: false, isUnique: false }
      ]
    }
  },
  {
    id: 'sa2',
    type: 'entityNode',
    position: { x: 500, y: 350 },
    data: {
      label: 'Proveedores (SA2)',
      type: 'Table',
      description: 'Cadastro de Fornecedores',
      attributes: [
        { id: 'attr-6', name: 'A2_COD', type: 'String', isPrimaryKey: true, isRequired: true, isUnique: true },
        { id: 'attr-7', name: 'A2_NOME', type: 'String', isPrimaryKey: false, isRequired: true, isUnique: false }
      ]
    }
  },
  {
    id: 'sc5',
    type: 'entityNode',
    position: { x: 900, y: 100 },
    data: {
      label: 'Pedidos Venta (SC5)',
      type: 'Table',
      description: 'Pedidos de Venda',
      attributes: [
        { id: 'attr-8', name: 'C5_NUM', type: 'String', isPrimaryKey: true, isRequired: true, isUnique: true },
        { id: 'attr-9', name: 'C5_CLIENTE', type: 'String', isPrimaryKey: false, isRequired: true, isUnique: false }
      ]
    }
  }
];

export const MOCK_PROTHEUS_EDGES: Edge<RelationEdgeData>[] = [
  { id: 'e-sx2-sa1', source: 'sx2', target: 'sa1', animated: true, data: { label: 'Meta', cardinality: 'ONE_TO_ONE', sourceFieldName: 'clientes', targetFieldName: 'diccionario' } },
  { id: 'e-sx2-sa2', source: 'sx2', target: 'sa2', animated: true, data: { label: 'Meta', cardinality: 'ONE_TO_ONE', sourceFieldName: 'proveedores', targetFieldName: 'diccionario' } },
  { id: 'e-sx2-sc5', source: 'sx2', target: 'sc5', animated: true, data: { label: 'Meta', cardinality: 'ONE_TO_ONE', sourceFieldName: 'pedidos', targetFieldName: 'diccionario' } },
  { id: 'e-sa1-sc5', source: 'sa1', target: 'sc5', animated: true, data: { label: '1:N', cardinality: 'ONE_TO_MANY', sourceFieldName: 'pedidos_venta', targetFieldName: 'cliente' } }
];
