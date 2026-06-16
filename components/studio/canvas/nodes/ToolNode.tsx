import { Handle, Position } from '@xyflow/react';
import { Wrench } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';

export default function ToolNode({ data, id, selected }: any) {
  const { activeNodeId } = useStudioStore();
  const isActive = activeNodeId === id;
  const type = data.type || 'mcp';
  const typeLabels = {
    mcp: 'MCP Server',
    n8n_webhook: 'n8n Webhook',
    rest_api: 'REST API',
    sql_direct: 'Direct SQL'
  };

  return (
    <div className={`
      w-[280px] bg-neutral-900 border-2 rounded-lg shadow-xl text-sm transition-all duration-300
      ${selected ? 'border-amber-500 shadow-amber-500/20' : 'border-neutral-700 hover:border-neutral-600'}
      ${isActive ? 'ring-4 ring-amber-500/50 animate-pulse bg-amber-950/20 shadow-amber-500/40' : ''}
    `}>
      {/* HEADER */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-amber-500/20 rounded">
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-semibold text-neutral-200">{data.label || 'Tool'}</span>
        </div>
      </div>

      {/* BODY */}
      <div className="p-3 space-y-3">
        {data.description && (
          <p className="text-xs text-neutral-400">{data.description}</p>
        )}

        <div className="flex flex-col space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">Type</span>
          <span className="text-xs text-neutral-300 font-mono bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
            {typeLabels[type as keyof typeof typeLabels] || type}
          </span>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">Endpoint</span>
          <span className="text-xs text-amber-200 font-mono truncate bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
            {data.endpoint || 'http://localhost:...'}
          </span>
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-amber-500 border-2 border-neutral-900" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-amber-500 border-2 border-neutral-900" 
      />
    </div>
  );
}
