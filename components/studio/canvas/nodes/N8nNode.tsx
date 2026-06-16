import { Handle, Position } from '@xyflow/react';
import { Network, Link2, AlertCircle } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';

export default function N8nNode({ data, id, selected }: any) {
  const { activeNodeId } = useStudioStore();
  const isActive = activeNodeId === id;
  const webhookUrl = data.webhookUrl || '';
  const isConfigured = webhookUrl.length > 0;

  return (
    <div className={`
      w-[260px] bg-neutral-900 border-2 rounded-lg shadow-xl text-sm transition-all duration-300
      ${selected ? 'border-orange-500 shadow-orange-500/20' : 'border-neutral-700 hover:border-neutral-600'}
      ${isActive ? 'ring-4 ring-orange-500/50 animate-pulse bg-orange-950/20 shadow-orange-500/40' : ''}
    `}>
      {/* HEADER */}
      <div className="bg-orange-500/10 border-b border-orange-500/20 px-3 py-2 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-orange-500/20 rounded">
            <Network className="w-4 h-4 text-orange-400" />
          </div>
          <span className="font-semibold text-neutral-200">{data.label || 'n8n Connector'}</span>
        </div>
        <div className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
          isConfigured ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
        }`}>
          {isConfigured ? 'Active' : 'Unconfigured'}
        </div>
      </div>

      {/* BODY */}
      <div className="p-3 space-y-2">
        {isConfigured ? (
          <div className="flex items-center space-x-2 text-xs text-neutral-400 bg-neutral-950 p-2 rounded border border-neutral-800">
            <Link2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate font-mono text-[10px]" title={webhookUrl}>
              {webhookUrl}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-neutral-500 bg-neutral-950/40 p-2 rounded border border-dashed border-neutral-800">
            <AlertCircle className="w-4 h-4 text-neutral-600 shrink-0" />
            <span>Configure n8n Webhook URL in properties.</span>
          </div>
        )}
        <div className="text-[10px] text-neutral-500 leading-relaxed font-mono">
          Outputs translated query response automatically.
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-orange-500 border-2 border-neutral-900" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-orange-500 border-2 border-neutral-900" 
      />
    </div>
  );
}
