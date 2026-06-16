import { Handle, Position } from '@xyflow/react';
import { Wrench } from 'lucide-react';
import { NodeProps } from '@xyflow/react';

export function MCPToolNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-xl border-2 border-orange-500/50 bg-neutral-900/90 backdrop-blur-sm min-w-[250px]">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-orange-400" />
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
          <Wrench size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{data.label as string || 'MCP Tool'}</h3>
          <p className="text-xs text-neutral-400 font-mono truncate max-w-[150px]">
            {data.mcpCommand as string || 'unknown'}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-800">
        <div className="text-xs font-semibold text-neutral-400 mb-1">Provides:</div>
        <div className="flex flex-wrap gap-1">
          {Array.isArray(data.tools) ? (
            data.tools.map((t: any, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
                {t.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-neutral-500 italic">No tools discovered yet</span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-orange-400" />
    </div>
  );
}
