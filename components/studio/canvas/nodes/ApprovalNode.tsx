import { Handle, Position } from '@xyflow/react';
import { UserCheck } from 'lucide-react';
import { NodeProps } from '@xyflow/react';
import { useState, useEffect } from 'react';

export function ApprovalNode({ data, isConnectable }: NodeProps) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');

  // In a real implementation, we would poll or listen via SSE/WebSocket
  // for HIL requests matching this node's ID to update the UI status.
  // For the prompt, the functional graphic instance is required.

  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl border-2 bg-neutral-900/90 backdrop-blur-sm w-[280px]
      ${status === 'pending' ? 'border-yellow-500 animate-pulse' : 
        status === 'approved' ? 'border-green-500' : 
        status === 'rejected' ? 'border-red-500' : 'border-indigo-500/50'}`}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-400" />
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${
          status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
          status === 'approved' ? 'bg-green-500/20 text-green-400' :
          status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'
        }`}>
          <UserCheck size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{data.label as string || 'Human Approval'}</h3>
          <p className="text-xs text-neutral-400">{status.toUpperCase()}</p>
        </div>
      </div>

      {status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button 
            className="flex-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 text-xs py-1 rounded transition-colors"
            onClick={() => setStatus('approved')}
          >
            Approve
          </button>
          <button 
            className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs py-1 rounded transition-colors"
            onClick={() => setStatus('rejected')}
          >
            Reject
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-400" />
    </div>
  );
}
