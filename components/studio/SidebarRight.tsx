import { useStudioStore } from '@/store/useStudioStore';
import { Bot, Plus, Network, Link as LinkIcon, ArrowRight, Brain, Database, Wrench, Loader2 } from 'lucide-react';
import AttributeRow from './AttributeRow';
import TagInput from './TagInput';
import { EntityAttribute, RelationCardinality } from '@/lib/studio/studioTypes';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function SidebarRight() {
  const { 
    selectedNode, 
    selectedEdge, 
    updateNodeData, 
    updateEdgeData, 
    addAttribute, 
    updateAttribute, 
    removeAttribute 
  } = useStudioStore();

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setTestResult(null);
  }, [selectedNode?.id]);

  const handleTestConnection = async () => {
    if (!selectedNode) return;
    const endpoint = (selectedNode.type === 'n8nNode' ? selectedNode.data.webhookUrl : selectedNode.data.endpoint) as string;
    const type = selectedNode.type === 'n8nNode' ? 'n8n_webhook' : (selectedNode.data.type as string);
    
    if (!endpoint) {
      toast.error(selectedNode.type === 'n8nNode' ? 'Por favor, introduce la URL del webhook de n8n.' : 'Por favor, introduce un Endpoint o URL de conexión.');
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/studio/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type || 'mcp',
          endpoint: endpoint
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
        toast.success(data.message);
      } else {
        setTestResult({ success: false, message: data.error || 'La prueba de conexión falló.' });
        toast.error(data.error || 'La prueba de conexión falló.');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error de red.' });
      toast.error(err.message || 'Error de red.');
    } finally {
      setIsTesting(false);
    }
  };

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="w-[350px] bg-neutral-950 flex flex-col shrink-0 border-l border-neutral-800 shadow-xl z-10">
        <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 space-y-3 p-6">
          <Bot className="w-12 h-12 opacity-20 mb-2" />
          <p className="text-sm">Selecciona un nodo o conexión en el canvas para inspeccionar sus propiedades.</p>
        </div>
      </aside>
    );
  }

  // --- EDGE SELECTED MODE ---
  if (selectedEdge) {
    const edgeData = selectedEdge.data || {};
    const cardinality = (edgeData.cardinality as RelationCardinality) || 'ONE_TO_MANY';
    const sourceFieldName = (edgeData.sourceFieldName as string) || '';
    const targetFieldName = (edgeData.targetFieldName as string) || '';

    return (
      <aside className="w-[350px] bg-neutral-950 flex flex-col shrink-0 border-l border-neutral-800 shadow-xl z-10">
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center space-x-2 mb-1">
            <Network className="w-4 h-4 text-pink-500" />
            <h3 className="font-semibold text-sm text-neutral-200">Relación</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono mt-2 bg-neutral-950 p-2 rounded border border-neutral-800">
            <span className="truncate max-w-[120px]">{selectedEdge.source}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[120px]">{selectedEdge.target}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-neutral-950 space-y-5">
          <div>
            <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Cardinalidad</label>
            <select
              value={cardinality}
              onChange={(e) => updateEdgeData(selectedEdge.id, { cardinality: e.target.value as RelationCardinality })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-pink-500/50 transition-colors text-neutral-200"
            >
              <option value="ONE_TO_ONE">One-to-One (1:1)</option>
              <option value="ONE_TO_MANY">One-to-Many (1:N)</option>
              <option value="MANY_TO_MANY">Many-to-Many (N:M)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-400 mb-1.5 flex items-center space-x-1">
              <LinkIcon className="w-3 h-3" />
              <span>Nombre en origen ({selectedEdge.source})</span>
            </label>
            <input
              type="text"
              value={sourceFieldName}
              onChange={(e) => updateEdgeData(selectedEdge.id, { sourceFieldName: e.target.value })}
              placeholder="Ej: posts"
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-pink-500/50 transition-colors text-neutral-200"
            />
            <p className="text-[10px] text-neutral-500 mt-1">Cómo se llamará el campo de relación en el modelo origen.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-400 mb-1.5 flex items-center space-x-1">
              <LinkIcon className="w-3 h-3" />
              <span>Nombre en destino ({selectedEdge.target})</span>
            </label>
            <input
              type="text"
              value={targetFieldName}
              onChange={(e) => updateEdgeData(selectedEdge.id, { targetFieldName: e.target.value })}
              placeholder="Ej: author"
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-pink-500/50 transition-colors text-neutral-200"
            />
            <p className="text-[10px] text-neutral-500 mt-1">Cómo se llamará el campo de relación en el modelo destino.</p>
          </div>
        </div>
      </aside>
    );
  }

  // --- NODE SELECTED MODE ---
  const nodeData = selectedNode!.data;
  const nodeType = selectedNode!.type;
  const attributes = (nodeData.attributes as EntityAttribute[]) || [];

  const handleAddAttribute = () => {
    addAttribute(selectedNode!.id, {
      id: `attr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `field_${attributes.length + 1}`,
      type: 'String',
      isPrimaryKey: false,
      isRequired: false,
      isUnique: false
    });
  };

  const getTitle = () => {
    if (nodeType === 'entityNode') return { title: 'Entity Schema', icon: <Database className="w-4 h-4 text-blue-500" /> };
    if (nodeType === 'agentNode') return { title: 'Agent Config', icon: <Brain className="w-4 h-4 text-violet-500" /> };
    if (nodeType === 'toolNode') return { title: 'Tool Config', icon: <Wrench className="w-4 h-4 text-amber-500" /> };
    if (nodeType === 'n8nNode') return { title: 'n8n Config', icon: <Network className="w-4 h-4 text-orange-500" /> };
    return { title: 'Node Properties', icon: <div className="w-2 h-2 rounded-full bg-blue-500" /> };
  };

  const headerInfo = getTitle();

  return (
    <aside className="w-[350px] bg-neutral-950 flex flex-col shrink-0 border-l border-neutral-800 shadow-xl z-10">
      <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center space-x-2 mb-1">
          {headerInfo.icon}
          <h3 className="font-semibold text-sm text-neutral-200">{headerInfo.title}</h3>
        </div>
        <p className="text-xs text-neutral-500 font-mono">{selectedNode!.type}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-neutral-950 space-y-5">
        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Entity Name</label>
          <input 
            type="text" 
            value={(nodeData.label as string) || ''} 
            onChange={(e) => updateNodeData(selectedNode!.id, { label: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-neutral-200"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Description</label>
          <textarea 
            value={(nodeData.description as string) || ''}
            onChange={(e) => updateNodeData(selectedNode!.id, { description: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:border-blue-500/50 transition-colors text-neutral-200"
          />
        </div>

        {nodeType === 'entityNode' && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-neutral-400">Fields / Attributes</label>
              <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                {attributes.length}
              </span>
            </div>

            <div className="space-y-3">
              {attributes.map(attr => (
                <AttributeRow 
                  key={attr.id}
                  attribute={attr}
                  onChange={(attrId, partial) => updateAttribute(selectedNode!.id, attrId, partial)}
                  onRemove={(attrId) => removeAttribute(selectedNode!.id, attrId)}
                />
              ))}
            </div>

            <button 
              onClick={handleAddAttribute}
              className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium py-2 px-4 rounded transition-colors flex items-center justify-center space-x-1.5 border border-neutral-800 border-dashed hover:border-neutral-700"
            >
              <Plus className="w-3 h-3" />
              <span>Add Field</span>
            </button>
          </div>
        )}

        {nodeType === 'agentNode' && (
          <div className="pt-2 space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Capabilities</label>
              <TagInput 
                tags={(nodeData.capabilities as string[]) || []}
                onChange={(tags) => updateNodeData(selectedNode!.id, { capabilities: tags })}
                placeholder="Ej: sql, analytics"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">LLM Provider (optional - mix for efficiency)</label>
              <select
                value={(nodeData.llmProvider as string) || ''}
                onChange={(e) => updateNodeData(selectedNode!.id, { llmProvider: e.target.value || undefined })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 transition-colors text-neutral-200"
              >
                <option value="">Use global (from Settings)</option>
                <option value="open-code">Open Code (local coding via Ollama - best for generating automation code)</option>
                <option value="ollama">Ollama (local - free, private, fast for dev)</option>
                <option value="openrouter">OpenRouter (unified cloud models)</option>
                <option value="grok">Grok</option>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
              <p className="text-[9px] text-neutral-500 mt-0.5">Local = no cost, data stays here, great for iterating on Protheus automations & DigitalEmployees. Cloud = more powerful reasoning.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">LLM Model (optional)</label>
              <input
                type="text"
                value={(nodeData.llmModel as string) || ''}
                onChange={(e) => updateNodeData(selectedNode!.id, { llmModel: e.target.value || undefined })}
                placeholder="e.g. llama3.1, gpt-4o, claude-3.5-sonnet"
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 transition-colors text-neutral-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">System Prompt</label>
              <textarea 
                value={(nodeData.systemPrompt as string) || ''}
                onChange={(e) => updateNodeData(selectedNode!.id, { systemPrompt: e.target.value })}
                placeholder="You are an expert agent..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:border-violet-500/50 transition-colors text-neutral-200"
              />
            </div>
          </div>
        )}

        {nodeType === 'n8nNode' && (
          <div className="pt-2 space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Webhook URL</label>
              <input 
                type="text" 
                value={(nodeData.webhookUrl as string) || ''} 
                onChange={(e) => updateNodeData(selectedNode!.id, { webhookUrl: e.target.value })}
                placeholder="https://n8n.my-company.com/webhook/..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors text-neutral-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">HTTP Method</label>
              <select
                value={(nodeData.httpMethod as string) || 'POST'}
                onChange={(e) => updateNodeData(selectedNode!.id, { httpMethod: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors text-neutral-200"
              >
                <option value="POST">POST (Envío de payload JSON)</option>
                <option value="GET">GET (Petición simple sin cuerpo)</option>
              </select>
            </div>
            
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !nodeData.webhookUrl}
                className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 text-xs font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center space-x-1.5 border border-neutral-700"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    <span>Validando webhook...</span>
                  </>
                ) : (
                  <span>Probar Conexión Webhook</span>
                )}
              </button>
              
              {testResult && (
                <div className={`mt-2 p-2 rounded text-xs border ${
                  testResult.success 
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/40' 
                    : 'bg-red-950/20 text-red-400 border-red-800/40'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        )}

        {nodeType === 'toolNode' && (
          <div className="pt-2 space-y-4">
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Tool Type</label>
              <select
                value={(nodeData.type as string) || 'mcp'}
                onChange={(e) => updateNodeData(selectedNode!.id, { type: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50 transition-colors text-neutral-200"
              >
                <option value="mcp">MCP Server</option>
                <option value="n8n_webhook">n8n Webhook</option>
                <option value="rest_api">REST API</option>
                <option value="sql_direct">Direct SQL Query</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Endpoint / Base URL</label>
              <input 
                type="text" 
                value={(nodeData.endpoint as string) || ''} 
                onChange={(e) => updateNodeData(selectedNode!.id, { endpoint: e.target.value })}
                placeholder="https://api.erp.com/v1"
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50 transition-colors text-neutral-200"
              />
            </div>
            
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !nodeData.endpoint}
                className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 text-xs font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center space-x-1.5 border border-neutral-700"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>Validando conexión...</span>
                  </>
                ) : (
                  <span>Probar Conexión</span>
                )}
              </button>
              
              {testResult && (
                <div className={`mt-2 p-2 rounded text-xs border ${
                  testResult.success 
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/40' 
                    : 'bg-red-950/20 text-red-400 border-red-800/40'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>
            
            {nodeData.type === 'rest_api' && (
              <div className="pt-2">
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">OpenAPI / Swagger Spec URL</label>
                <input 
                  type="text" 
                  value={(nodeData.openApiSpec as string) || ''} 
                  onChange={(e) => updateNodeData(selectedNode!.id, { openApiSpec: e.target.value })}
                  placeholder="https://api.erp.com/swagger.json"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50 transition-colors text-neutral-200"
                />
                <p className="text-[10px] text-neutral-500 mt-1">Si el ERP no permite acceso a BD, dale su Swagger. El Agente aprenderá a usar sus endpoints automáticamente.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
