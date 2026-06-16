import { Handle, Position } from '@xyflow/react';
import { Brain, Settings2, Trash2, MessageSquare } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';
import NodeChatInterface from './NodeChatInterface';

export default function AgentNode({ data, id, selected }: any) {
  const { activeNodeId, openMosaicWindows } = useStudioStore();
  const isActive = activeNodeId === id;
  const isMosaicOpen = openMosaicWindows.includes(id);
  const capabilities = data.capabilities || [];

  return (
    <div className={`
      w-[280px] bg-neutral-900 border-2 rounded-lg shadow-xl text-sm transition-all duration-300
      ${selected ? 'border-violet-500 shadow-violet-500/20' : 'border-neutral-700 hover:border-neutral-600'}
      ${isActive ? 'ring-4 ring-violet-500/50 animate-pulse bg-violet-950/20 shadow-violet-500/40' : ''}
    `}>
      {/* HEADER */}
      <div className="bg-violet-500/10 border-b border-violet-500/20 px-3 py-2 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-violet-500/20 rounded">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-violet-300/80 uppercase tracking-wider leading-none">Empleado Virtual</span>
            <span className="font-semibold text-neutral-200">{data.label || 'Sin nombre'}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            useStudioStore.getState().toggleMosaicWindow(id);
          }}
          className="p-1 hover:bg-violet-500/20 rounded transition-colors"
          title="Mosaico IA: chateá solo con este empleado (Ollama local o nube). No ejecuta el Swarm ni consultas ERP del equipo completo."
        >
          <MessageSquare className="w-4 h-4 text-violet-400" />
        </button>
      </div>

      {/* BODY */}
      <div className="p-3 space-y-3">
        {data.description && (
          <p className="text-xs text-neutral-400">{data.description}</p>
        )}

        {capabilities.length > 0 && (
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider block mb-1.5">Habilidades Asignadas</span>
            <div className="flex flex-wrap gap-1">
              {capabilities.map((cap: string, i: number) => (
                <span key={i} className="text-[10px] bg-violet-500/10 text-violet-300 border border-violet-500/20 px-1.5 py-0.5 rounded">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mosaic Chat - expands inside the node when toggled. Allows multiple agents with open chats simultaneously (Mosaico view) */}
        {isMosaicOpen && (
          <NodeChatInterface
            nodeId={id}
            systemPrompt={data.systemPrompt || 'You are a helpful agent in the OPO swarm.'}
            llmProvider={data.llmProvider}
            llmModel={data.llmModel}
            baseUrl={useStudioStore.getState().llmConfigs[data.llmProvider || useStudioStore.getState().currentProvider]?.baseUrl || 'http://localhost:11434'}
          />
        )}
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-violet-500 border-2 border-neutral-900" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-violet-500 border-2 border-neutral-900" 
      />
    </div>
  );
}
