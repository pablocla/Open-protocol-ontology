import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { MOCK_PROTHEUS_NODES, MOCK_PROTHEUS_EDGES } from '@/lib/studio/mockProtheus';
import { buildAgentTemplateGraph } from '@/lib/studio/deployAgentTemplate';
import { EntityAttribute, EntityNodeData, RelationEdgeData } from '@/lib/studio/studioTypes';

export type StudioDataMode = 'demo' | 'live';
export type ErpId = 'protheus' | 'sap' | 'odoo' | 'netsuite' | 'otro';

export interface ErpWorkspace {
  erpId: ErpId | null;
  connectionString: string;
  filial: string;
  companySuffix: string;
  dataMode: StudioDataMode;
  dialect: 'mssql' | 'postgresql' | 'oracle';
}

export interface QueryExecutionPayload {
  mode: 'mock' | 'live';
  connectionString?: string;
  filial?: string;
  companySuffix?: string;
  context?: {
    erp?: string;
    filial?: string;
    companySuffix?: string;
    dialect?: string;
  };
}

const DEFAULT_ERP_WORKSPACE: ErpWorkspace = {
  erpId: null,
  connectionString: '',
  filial: '',
  companySuffix: '010',
  dataMode: 'demo',
  dialect: 'mssql',
};

interface StudioState {
  project: { name: string } | null;
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  apiKeys: Record<string, string>;
  currentProvider: 'ollama' | 'grok' | 'gemini' | 'openai' | 'anthropic' | 'open-code' | 'openrouter';
  setCurrentProvider: (provider: 'ollama' | 'grok' | 'gemini' | 'openai' | 'anthropic' | 'open-code' | 'openrouter') => void;
  llmConfigs: Record<string, { apiKey?: string; baseUrl?: string; model?: string }>;
  setLLMConfig: (provider: string, config: { apiKey?: string; baseUrl?: string; model?: string }) => void;
  activeNodeId: string | null;
  setApiKey: (provider: string, key: string) => void;
  setActiveNodeId: (id: string | null) => void;
  setProject: (project: { name: string } | null) => void;
  setProjectName: (name: string) => void;
  addNode: (node: Node) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (node: Node | null) => void;
  setSelectedEdge: (edge: Edge | null) => void;
  updateNodeData: (nodeId: string, data: Partial<EntityNodeData>) => void;
  updateEdgeData: (edgeId: string, data: Partial<RelationEdgeData>) => void;
  addAttribute: (nodeId: string, attr: EntityAttribute) => void;
  updateAttribute: (nodeId: string, attrId: string, partial: Partial<EntityAttribute>) => void;
  removeAttribute: (nodeId: string, attrId: string) => void;
  loadMockProtheus: () => void;
  loadProtheusBaseline: (project: { name: string }, nodes: any[], edges: any[]) => void;
  clearProject: () => void;
  loadProjectData: (project: { name: string }, nodes: any[], edges: any[]) => void;

  // Guidance & Alerts system (to steer users toward best practices for big use cases)
  alerts: GuidanceAlert[];
  addAlert: (alert: Omit<GuidanceAlert, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;

  // Mosaic Multi-Agent Chat
  nodeChats: Record<string, NodeMessage[]>;
  openMosaicWindows: string[];
  addNodeMessage: (nodeId: string, message: NodeMessage) => void;
  clearNodeChat: (nodeId: string) => void;
  toggleMosaicWindow: (nodeId: string) => void;
  deployAgentTemplate: (templateId: string) => string | null;

  erpWorkspace: ErpWorkspace;
  setErpWorkspace: (partial: Partial<ErpWorkspace>) => void;
  resolveQueryMode: () => 'mock' | 'live';
  buildQueryExecutionPayload: () => QueryExecutionPayload;
}

export interface NodeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GuidanceAlert {
  id: string;
  type: 'info' | 'warning' | 'success' | 'action';
  title: string;
  message: string;
  useCase?: 'process-automation' | 'erp-audit' | 'flow-diagram' | 'swarm-orchestration' | 'general';
  actions?: Array<{ label: string; action: () => void }>; // e.g. buttons to add nodes or launch swarm
  timestamp: number;
  dismissed: boolean;
}

export const useStudioStore = create<StudioState>()(
  persist(
    temporal(
      (set, get) => ({
        project: null,
        nodes: [],
        edges: [],
        selectedNode: null,
        selectedEdge: null,
        apiKeys: {},
        currentProvider: 'ollama',
        setCurrentProvider: (provider) => set({ currentProvider: provider }),
        llmConfigs: {
          ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.1' },
        },
        setLLMConfig: (provider, config) => set((state) => ({
          llmConfigs: {
            ...state.llmConfigs,
            [provider]: { ...state.llmConfigs[provider], ...config }
          }
        })),
        activeNodeId: null,
        setApiKey: (provider, key) => set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
        setActiveNodeId: (id) => set({ activeNodeId: id }),
        setProject: (project) => set({ project }),
        setProjectName: (name) => {
          const { project } = get();
          if (project) {
            set({ project: { ...project, name } });
          }
        },
        addNode: (node) => set({ nodes: [...get().nodes, node] }),
        onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
        onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
        onConnect: (connection) => {
          const newEdge: Edge = {
            ...connection,
            id: `e-${connection.source}-${connection.target}`,
            animated: true,
            type: 'smoothstep',
            data: {
              cardinality: 'ONE_TO_MANY',
              sourceFieldName: 'targetEntities',
              targetFieldName: 'sourceEntity'
            }
          };
          set({ edges: addEdge(newEdge, get().edges) });
        },
        setSelectedNode: (node) => set({ selectedNode: node }),
        setSelectedEdge: (edge) => set({ selectedEdge: edge }),
        updateNodeData: (nodeId, data) => {
          set({
            nodes: get().nodes.map((node) => {
              if (node.id === nodeId) {
                const updatedNode = { ...node, data: { ...node.data, ...data } };
                if (get().selectedNode?.id === nodeId) set({ selectedNode: updatedNode });
                return updatedNode;
              }
              return node;
            })
          });
        },
        updateEdgeData: (edgeId, data) => {
          set({
            edges: get().edges.map((edge) => {
              if (edge.id === edgeId) {
                const updatedEdge = { ...edge, data: { ...edge.data, ...data } };
                if (get().selectedEdge?.id === edgeId) set({ selectedEdge: updatedEdge });
                return updatedEdge;
              }
              return edge;
            })
          });
        },
        addAttribute: (nodeId, attr) => {
          set({
            nodes: get().nodes.map((node) => {
              if (node.id === nodeId && node.type === 'entityNode') {
                const attributes = [...(node.data.attributes as EntityAttribute[] || []), attr];
                const updatedNode = { ...node, data: { ...node.data, attributes } };
                if (get().selectedNode?.id === nodeId) set({ selectedNode: updatedNode });
                return updatedNode;
              }
              return node;
            })
          });
        },
        updateAttribute: (nodeId, attrId, partial) => {
          set({
            nodes: get().nodes.map((node) => {
              if (node.id === nodeId && node.type === 'entityNode') {
                const attributes = (node.data.attributes as EntityAttribute[]).map(a => a.id === attrId ? { ...a, ...partial } : a);
                const updatedNode = { ...node, data: { ...node.data, attributes } };
                if (get().selectedNode?.id === nodeId) set({ selectedNode: updatedNode });
                return updatedNode;
              }
              return node;
            })
          });
        },
        removeAttribute: (nodeId, attrId) => {
          set({
            nodes: get().nodes.map((node) => {
              if (node.id === nodeId && node.type === 'entityNode') {
                const attributes = (node.data.attributes as EntityAttribute[]).filter(a => a.id !== attrId);
                const updatedNode = { ...node, data: { ...node.data, attributes } };
                if (get().selectedNode?.id === nodeId) set({ selectedNode: updatedNode });
                return updatedNode;
              }
              return node;
            })
          });
        },
        loadMockProtheus: () => {
          set({
            project: { name: 'Protheus ERP Demo' },
            nodes: MOCK_PROTHEUS_NODES,
            edges: MOCK_PROTHEUS_EDGES,
            selectedNode: null,
            selectedEdge: null
          });
        },
        loadProtheusBaseline: (project, nodes, edges) => {
          set({
            project,
            nodes,
            edges,
            selectedNode: null,
            selectedEdge: null,
          });
        },
         loadProjectData: (project, nodes, edges) => {
          set({
            project,
            nodes,
            edges,
            selectedNode: null,
            selectedEdge: null
          });
        },
        clearProject: () => {
          set({ 
            project: null, 
            nodes: [], 
            edges: [], 
            selectedNode: null, 
            selectedEdge: null,
            nodeChats: {}, 
            openMosaicWindows: [] 
          });
        },

        // Guidance alerts implementation
        alerts: [],
        addAlert: (alert) => set((state) => ({
          alerts: [
            ...state.alerts.filter(a => !a.dismissed),
            {
              ...alert,
              id: `alert-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
              timestamp: Date.now(),
              dismissed: false
            }
          ].slice(-8) // keep last 8
        })),
        dismissAlert: (id) => set((state) => ({
          alerts: state.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a)
        })),
        clearAlerts: () => set({ alerts: [] }),

        // Mosaic Chat State
        nodeChats: {},
        openMosaicWindows: [],
        addNodeMessage: (nodeId, message) => set((state) => ({
          nodeChats: {
            ...state.nodeChats,
            [nodeId]: [...(state.nodeChats[nodeId] || []), message]
          }
        })),
        clearNodeChat: (nodeId) => set((state) => {
          const newChats = { ...state.nodeChats };
          delete newChats[nodeId];
          return { nodeChats: newChats };
        }),
        toggleMosaicWindow: (nodeId) => set((state) => ({
          openMosaicWindows: state.openMosaicWindows.includes(nodeId)
            ? state.openMosaicWindows.filter(id => id !== nodeId)
            : [...state.openMosaicWindows, nodeId]
        })),
        deployAgentTemplate: (templateId) => {
          const state = get();
          const result = buildAgentTemplateGraph(templateId, state.nodes, state.edges);
          if (!result) return null;
          set({
            nodes: result.nodes,
            edges: result.edges,
            project: state.project ?? { name: 'Mi Equipo de Empleados Virtuales' },
          });
          return result.templateTitle;
        },

        erpWorkspace: { ...DEFAULT_ERP_WORKSPACE },
        setErpWorkspace: (partial) =>
          set((state) => ({
            erpWorkspace: { ...state.erpWorkspace, ...partial },
          })),
        resolveQueryMode: () => {
          const ws = get().erpWorkspace;
          if (ws.dataMode === 'live' && ws.connectionString.trim()) return 'live';
          return 'mock';
        },
        buildQueryExecutionPayload: () => {
          const ws = get().erpWorkspace;
          const mode = get().resolveQueryMode();
          const filial = ws.filial.trim() || undefined;
          const companySuffix = ws.companySuffix || '010';
          return {
            mode,
            connectionString: mode === 'live' ? ws.connectionString.trim() : undefined,
            filial,
            companySuffix,
            context: {
              erp: ws.erpId === 'protheus' ? 'protheus' : undefined,
              filial,
              companySuffix,
              dialect: ws.dialect,
            },
          };
        },
      }),
      {
        partialize: (state) => ({
          nodes: state.nodes,
          edges: state.edges,
          apiKeys: state.apiKeys,
          currentProvider: state.currentProvider,
          llmConfigs: state.llmConfigs,
          erpWorkspace: state.erpWorkspace,
        }),
      }
    ),
    { name: 'opo-studio-storage' }
  )
);
