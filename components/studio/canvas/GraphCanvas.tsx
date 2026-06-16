"use client";

import { useCallback, useRef, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStudioStore } from '@/store/useStudioStore';
import EntityNode from './nodes/EntityNode';
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import AgentNode from './nodes/AgentNode';
import ToolNode from './nodes/ToolNode';
import N8nNode from './nodes/N8nNode';
import CanvasEmptyState from './CanvasEmptyState';
import ContextMenu from './ContextMenu';
import RestExplorer from '../RestExplorer';
import { toast } from 'sonner';
import { Brain, Database, Globe } from 'lucide-react';
import { EntityAttribute } from '@/lib/studio/studioTypes';
// (no NodeChatInterface here: mosaico expands inside the AgentNode body for simultaneous visible diagram + per-agent chats)

const nodeTypes = { 
  entityNode: EntityNode,
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  agentNode: AgentNode,
  toolNode: ToolNode,
  n8nNode: N8nNode
};

let id = 0;
const getId = () => `dndnode_${Date.now()}_${id++}`;

export default function GraphCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setSelectedNode, 
    setSelectedEdge,
    addNode,
    loadProjectData,
    project   // GROK FIX: was missing, caused 'project' not defined in Auto-Discover success toast action (startAIIntrospection)
  } = useStudioStore();
  // Note: openMosaicWindows + toggleMosaicWindow used by AgentNode for "expand chat inside node" mosaico. GraphCanvas no longer renders floating overlays (prevents #2 props crash + duplicates).
  const { screenToFlowPosition } = useReactFlow();

  const [menu, setMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    panePosition: { x: number; y: number };
    node: Node | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    panePosition: { x: 0, y: 0 },
    node: null
  });

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      const presetRaw = event.dataTransfer.getData('application/preset');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let extraData: any = {};
      if (presetRaw) {
        try { extraData = JSON.parse(presetRaw); } catch {}
      }

      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
          label: label || `${type} node`,
          attributes: type === 'entityNode' ? [] : undefined,
          ...extraData   // e.g. { llmProvider: 'openai' } from AI Model stubs in library - makes "ghost" drags produce usable preconfigured AgentNodes
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onPaneContextMenu = useCallback(
    (event: any) => {
      event.preventDefault();
      if (!reactFlowWrapper.current) return;
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      
      const panePos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setMenu({
        isOpen: true,
        position: { x: event.clientX - rect.left, y: event.clientY - rect.top },
        panePosition: panePos,
        node: null
      });
    },
    [screenToFlowPosition]
  );

  const onNodeContextMenu = useCallback(
    (event: any, node: Node) => {
      event.preventDefault();
      if (!reactFlowWrapper.current) return;
      const rect = reactFlowWrapper.current.getBoundingClientRect();

      const panePos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setMenu({
        isOpen: true,
        position: { x: event.clientX - rect.left, y: event.clientY - rect.top },
        panePosition: panePos,
        node
      });
    },
    [screenToFlowPosition]
  );

  const handleAddNode = useCallback(
    (type: string, label: string, position: { x: number; y: number }, extraData?: any) => {
      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
          label,
          ...(extraData || {})
        },
      };
      addNode(newNode);
    },
    [addNode]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      onNodesChange([{ id: nodeId, type: 'remove' }]);
    },
    [onNodesChange]
  );

  // ---- FIX 2: Real ontological validation ----
  const handleValidateNode = useCallback(
    (targetNode: Node | null) => {
      const nodesToValidate = targetNode ? [targetNode] : nodes;
      const issues: string[] = [];
      let passCount = 0;

      for (const n of nodesToValidate) {
        const label = String(n.data.label || n.type);

        if (n.type === 'entityNode') {
          const attrs = (n.data.attributes as EntityAttribute[]) || [];
          if (attrs.length === 0) {
            issues.push(`❌ "${label}": No tiene atributos definidos.`);
          } else {
            const hasPK = attrs.some(a => a.isPrimaryKey);
            if (!hasPK) issues.push(`❌ "${label}": No tiene clave primaria (PK).`);
            
            const emptyNames = attrs.filter(a => !a.name || a.name.trim() === '');
            if (emptyNames.length > 0) issues.push(`⚠️ "${label}": Tiene ${emptyNames.length} atributo(s) sin nombre.`);
            
            if (hasPK && emptyNames.length === 0) passCount++;
          }

          // Check orphan (no connections)
          const hasEdges = edges.some(e => e.source === n.id || e.target === n.id);
          if (!hasEdges && nodes.length > 1) {
            issues.push(`⚠️ "${label}": Nodo huérfano (sin conexiones).`);
          }
        } else if (n.type === 'agentNode') {
          if (!n.data.systemPrompt || String(n.data.systemPrompt).trim() === '') {
            issues.push(`⚠️ "${label}": Agent sin System Prompt configurado.`);
          } else {
            passCount++;
          }
        } else if (n.type === 'toolNode') {
          if (!n.data.endpoint || String(n.data.endpoint).trim() === '') {
            issues.push(`❌ "${label}": Tool sin Endpoint configurado.`);
          } else {
            passCount++;
          }
        } else if (n.type === 'n8nNode') {
          if (!n.data.webhookUrl || String(n.data.webhookUrl).trim() === '') {
            issues.push(`❌ "${label}": n8n sin Webhook URL configurada.`);
          } else {
            passCount++;
          }
        }
      }

      if (issues.length === 0) {
        toast.success(`✅ Validación completada: ${passCount} nodo(s) sin errores.`);
      } else {
        issues.forEach(issue => {
          if (issue.startsWith('❌')) {
            toast.error(issue);
          } else {
            toast.warning(issue);
          }
        });
        if (passCount > 0) {
          toast.success(`✅ ${passCount} nodo(s) pasaron la validación.`);
        }
      }
    },
    [nodes, edges]
  );

  // ---- FIX 1: Auto-Discover (Universal + REST) ----
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  const [discoverTab, setDiscoverTab] = useState<'sql' | 'rest'>('sql');
  const [dbDriver, setDbDriver] = useState('postgresql');
  const [discoverUrl, setDiscoverUrl] = useState('');
  const [tableFilter, setTableFilter] = useState(''); // GROK UX: glob filter e.g. SF*,SA* to scan only relevant tables in huge DBs (Protheus 2000+ tables)
  const [companySuffix, setCompanySuffix] = useState('010');
  const [protheusSimulateDelta, setProtheusSimulateDelta] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  const handleAutoDiscover = useCallback(() => {
    setDiscoverTab('sql');
    setIsDiscoverOpen(true);
  }, []);

  const executeDiscover = async () => {
    const isProtheus = dbDriver === 'totvs-protheus';
    if (!isProtheus && !discoverUrl.trim()) {
      toast.error('Ingresá un Connection String (ej: postgres://user:pass@host:5432/db)');
      return;
    }
    if (isProtheus && !protheusSimulateDelta && !discoverUrl.trim()) {
      toast.error('Para scan incremental real contra SX2/SX3/SX9 necesitás connection string, o activá "Simular deltas demo".');
      return;
    }
    setIsDiscovering(true);
    try {
      const res = await fetch('/api/studio/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driver: dbDriver,
          connectionString: discoverUrl || undefined,
          filePath: dbDriver === 'sqlite' ? discoverUrl : undefined,
          tableFilter: tableFilter.trim() || undefined,
          protheusMode: 'incremental',
          companySuffix,
          simulateDelta: isProtheus ? protheusSimulateDelta : false,
        })
      });
      const data = await res.json();
      if (data.success && data.entities) {
        if (data.graph?.nodes?.length) {
          loadProjectData(data.graph.project || { name: 'TOTVS Protheus' }, data.graph.nodes, data.graph.edges || []);
        } else {
          let xOffset = 100;
          const yBase = 200;
          data.entities.forEach((entity: any, idx: number) => {
            const newNode = {
              id: getId(),
              type: 'entityNode',
              position: { x: xOffset + idx * 320, y: yBase + (idx % 2 === 0 ? 0 : 150) },
              data: {
                label: entity.name,
                description: entity.description || '',
                attributes: entity.attributes || [],
                rowCount: entity.rowCount || 0,
                lastProfiled: new Date().toISOString()
              }
            };
            addNode(newNode);
          });
        }

        const deltaMsg = data.delta?.hasChanges
          ? ` 🆕 ${data.delta.newTables?.length || 0} tabla(s), ${data.delta.newFields?.length || 0} campo(s), ${data.delta.newRelationships?.length || 0} relación(es) nuevas.`
          : '';

        toast.success(`🔍 ${data.summary || `${data.entities.length} entidad(es) cargadas.`}${deltaMsg}`, {
          action: {
            label: '🤖 Start AI Introspection',
            onClick: () => startAIIntrospection(data.entities, project?.name || 'Untitled')
          }
        });
        setIsDiscoverOpen(false);
        setDiscoverUrl('');
        setTableFilter('');
      } else {
        toast.error(data.error || 'No se pudieron descubrir entidades.');
      }
    } catch (err: any) {
      toast.error(`Error de red: ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };
  const startAIIntrospection = (discoveredEntities: any[], projectName: string) => {
    // Create the "Discovery Assistant" mini-robot agent automatically
    const assistantNode = {
      id: `dndnode_${Date.now()}_discovery_assistant`,
      type: 'agentNode',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 150 },
      data: {
        label: 'Discovery Assistant',
        description: 'AI helper for table introspection and structure prioritization',
        capabilities: ['analysis', 'introspection', 'prioritization'],
        domains: ['data-modeling', 'erp'],
        systemPrompt: `You are an expert OPO Discovery Assistant.

You have access to the discovered entities with full metadata:
- rowCount: approximate number of records (high volume = core transactional structures)
- attributes with: length, precision, scale, comment (from SX3 or DB metadata for Protheus-like systems)

Your job when the user asks:
1. Analyze which tables have the MOST records (high volume) vs low (config/params like SX6).
2. Recommend which ones are CORE structures to model as first-class OPO entities.
3. For high-volume tables, suggest key attributes (considering field sizes, PKs, comments).
4. Suggest relations and semantic tags.
5. Output in clear, actionable format: "Core entities to model first: ... with these attributes..."

Always consider:
- High rowCount tables are usually the important business objects.
- Field sizes (length/precision) indicate importance and data type constraints.
- Comments from SX3 or DB give real business meaning.

Be helpful, structured, and focus on helping the user build a solid OPO ontology from the raw DB discovery.

For TOTVS Protheus projects, also orient the user toward recurring business queries available in the Mesh console: pedidos por cliente (SC5), deuda/saldo (SA1), facturas (SF2), ítems de pedido (SC6). Map natural language questions to canonical entities (SalesOrderHeader, Customer, SalesInvoiceHeader).`,
        toolBindings: [],
        llmProvider: 'ollama', // default to local if available, user can change
      }
    };

    addNode(assistantNode);

    // Open the IntentEditor with a pre-filled powerful query
    // We use the existing handle from parent via a custom event or direct store
    // For simplicity, set a suggested query in the store or just toast the query
    const suggestedQuery = `Analiza los volúmenes de registros (rowCount) y los metadatos de campos (length, precision, scale, comments de SX3 si existen). 
Identifica las tablas con MÁS registros (core/transaccionales) vs las de pocos registros (params/config como SX6).
Sugiere las estructuras OPO prioritarias: qué entidades modelar primero, atributos clave (considerando tamaños), y relaciones importantes.
Usa los datos del ontology actual.`;

    toast.info('Discovery Assistant created! Suggested query for AI introspection added to guidance.', {
      action: {
        label: 'Open Mesh Console',
        onClick: () => {
          // This will be handled by parent or we can dispatch
          window.dispatchEvent(new CustomEvent('opo-open-mesh', { detail: { query: suggestedQuery } }));
        }
      }
    });

    // Trigger guidance with introspection context
    // The existing Guidance will pick up the new agent and entities
  };

  const handleOllamaAnalyze = async (payload: any, mode: 'infer-rest' | 'enrich-sql' = 'infer-rest') => {
    setIsEnriching(true);
    const loadingToast = toast.loading('🧠 Ollama analizando y extrayendo entidades...');
    try {
      const res = await fetch('/api/studio/ollama-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, payload })
      });
      const data = await res.json();
      if (data.success && data.data && data.data.entities) {
        let xOffset = 100;
        const yBase = 400;
        data.data.entities.forEach((entity: any, idx: number) => {
          const newNode = {
            id: getId(),
            type: 'entityNode',
            position: { x: xOffset + idx * 320, y: yBase + (idx % 2 === 0 ? 0 : 150) },
            data: {
              label: entity.name,
              description: entity.description || 'Inferido por Ollama',
              attributes: entity.attributes.map((a: any, i: number) => ({
                id: `attr-ollama-${Date.now()}-${i}`,
                name: a.name,
                type: a.type || 'String',
                isPrimaryKey: !!a.isPrimaryKey,
                isRequired: false
              })),
              rowCount: entity.rowCount || 0
            }
          };
          addNode(newNode);
        });
        toast.success(`✨ Ollama inferió ${data.data.entities.length} entidades de la respuesta REST.`, { id: loadingToast });
        setIsDiscoverOpen(false);
      } else if (data.success && data.data && data.data.enrichedEntities) {
         // Handle enrich mode if needed in future
         toast.success('Entidades enriquecidas con éxito.', { id: loadingToast });
      } else {
        toast.error(data.error || 'Ollama no devolvió entidades válidas.', { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(`Error de IA Local: ${err.message}`, { id: loadingToast });
    } finally {
      setIsEnriching(false);
    }
  };

  // Make startAIIntrospection available for the ollama path too (if user wants AI analysis after enriching)
  // (already defined above)
  // ---- FIX 2b: Parametrize ----
  const handleParametrize = useCallback(
    (targetNode: Node | null) => {
      if (targetNode) {
        setSelectedNode(targetNode);
        toast.info(`Configurá el endpoint y tipo de conexión para "${targetNode.data.label}" en el panel derecho →`);
      } else {
        toast.info('Seleccioná un nodo y configurá su endpoint en el panel derecho →');
      }
    },
    [setSelectedNode]
  );

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          setSelectedEdge(null);
          setSelectedNode(node);
          setMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onEdgeClick={(_, edge) => {
          setSelectedNode(null);
          setSelectedEdge(edge);
          setMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
          setMenu(prev => ({ ...prev, isOpen: false }));
        }}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-neutral-900"
        colorMode="dark"
        defaultEdgeOptions={{ animated: true, type: 'smoothstep' }}
      >
        <Background color="#222" gap={20} size={2} />
        <Controls className="bg-neutral-800 border-neutral-700 fill-white" />
        <MiniMap 
          className="bg-neutral-900 border border-neutral-800" 
          nodeColor="#3b82f6" 
          maskColor="rgba(0, 0, 0, 0.7)"
        />
        {nodes.length === 0 && <CanvasEmptyState />}
      </ReactFlow>

      <ContextMenu
        isOpen={menu.isOpen}
        position={menu.position}
        panePosition={menu.panePosition}
        node={menu.node}
        onClose={() => setMenu(prev => ({ ...prev, isOpen: false }))}
        onAddNode={handleAddNode}
        onDeleteNode={handleDeleteNode}
        onValidateNode={handleValidateNode}
        onAutoDiscover={handleAutoDiscover}
        onParametrize={handleParametrize}
      />

      {/* Auto-Discover Dialog */}
      {isDiscoverOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-xl flex flex-col w-full max-w-4xl h-[80vh] shadow-2xl overflow-hidden border border-neutral-800">
            {/* Header / Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-900/50">
              <button 
                onClick={() => setDiscoverTab('sql')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors ${discoverTab === 'sql' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/10' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'}`}
              >
                <Database className="w-4 h-4" /> <span>SQL Database</span>
              </button>
              <button 
                onClick={() => setDiscoverTab('rest')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors ${discoverTab === 'rest' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-900/10' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'}`}
              >
                <Globe className="w-4 h-4" /> <span>REST API Explorer</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 bg-neutral-950/80">
              {discoverTab === 'sql' && (
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">Conectar a Base de Datos</h3>
                    <p className="text-sm text-neutral-400">
                      OPO escaneará el esquema de información de tu base de datos para generar entidades automáticamente.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Driver SQL</label>
                      <select 
                        value={dbDriver} 
                        onChange={(e) => setDbDriver(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="totvs-protheus">TOTVS Protheus (SX2/SX3/SX9 incremental)</option>
                        <option value="postgresql">PostgreSQL</option>
                        <option value="mysql">MySQL / MariaDB</option>
                        <option value="mssql">SQL Server</option>
                        <option value="oracle">Oracle</option>
                        <option value="sqlite">SQLite</option>
                      </select>
                    </div>

                    {dbDriver === 'totvs-protheus' && (
                      <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-3 space-y-3">
                        <p className="text-xs text-blue-200/80">
                          Carga el baseline pre-armado y escanea solo tablas/campos/relaciones que no estén en el registro OPO público.
                        </p>
                        <label className="flex items-center gap-2 text-sm text-neutral-300">
                          <input
                            type="checkbox"
                            checked={protheusSimulateDelta}
                            onChange={(e) => setProtheusSimulateDelta(e.target.checked)}
                            className="rounded border-neutral-600"
                          />
                          Simular deltas demo (ZZ1 + C5_XOPOCRM) sin BD
                        </label>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sufijo empresa (SX2010 → 010)</label>
                          <input
                            type="text"
                            value={companySuffix}
                            onChange={(e) => setCompanySuffix(e.target.value)}
                            placeholder="010"
                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm font-mono text-neutral-200"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        {dbDriver === 'sqlite' ? 'File Path' : dbDriver === 'totvs-protheus' ? 'Connection String (opcional en demo)' : 'Connection String'}
                      </label>
                      <input
                        type="text"
                        value={discoverUrl}
                        onChange={(e) => setDiscoverUrl(e.target.value)}
                        placeholder={
                          dbDriver === 'postgresql' ? 'postgres://user:password@host:5432/db' :
                          dbDriver === 'mysql' ? 'mysql://user:password@host:3306/db' :
                          dbDriver === 'mssql' ? 'Server=localhost;Database=master;User Id=sa;Password=secret;' :
                          dbDriver === 'sqlite' ? '/absolute/path/to/database.sqlite' : '...'
                        }
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-neutral-200 font-mono"
                      />
                    </div>

                    {/* UX 2A fix: allow user to type table glob filters so giant ERP DBs don't OOM/timeout the discover call */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Table filter (optional glob)</label>
                      <input
                        type="text"
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value)}
                        placeholder='SF*, SA*, customer*, SD*  (comma-separated)'
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-neutral-200 font-mono"
                      />
                      <p className="text-[10px] text-neutral-500">Useful for Protheus/SX* or other 1000+ table DBs. Only matching tables are scanned + profiled.</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-800">
                    <button
                      onClick={() => { setIsDiscoverOpen(false); setDiscoverUrl(''); setTableFilter(''); }}
                      className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={executeDiscover}
                      disabled={isDiscovering || (dbDriver !== 'totvs-protheus' && !discoverUrl.trim()) || (dbDriver === 'totvs-protheus' && !protheusSimulateDelta && !discoverUrl.trim())}
                      className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded transition-colors flex items-center space-x-2 shadow-lg shadow-blue-900/20"
                    >
                      {isDiscovering ? (
                        <><span className="animate-spin">⏳</span><span>Escaneando...</span></>
                      ) : (
                        <><Database className="w-4 h-4"/><span>Escanear Esquema</span></>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {discoverTab === 'rest' && (
                <RestExplorer onAnalyze={(body) => handleOllamaAnalyze(body, 'infer-rest')} />
              )}
            </div>

            {/* Absolute close button for rest tab */}
            {discoverTab === 'rest' && (
              <button 
                onClick={() => setIsDiscoverOpen(false)}
                className="absolute top-4 right-4 bg-neutral-800 hover:bg-neutral-700 text-white p-1.5 rounded-full z-10"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
