"use client";

import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

export default function ActionNode({ data, selected }: any) {
  return (
    <div className={`bg-neutral-900 border-2 rounded-lg shadow-xl w-64 transition-colors ${selected ? 'border-emerald-500' : 'border-neutral-700'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500 border-2 border-neutral-900" />
      
      <div className="p-3 border-b border-neutral-800 flex items-center space-x-2 bg-emerald-900/20 rounded-t-lg">
        <Play className="w-4 h-4 text-emerald-400" />
        <div className="font-semibold text-sm truncate">{data.label}</div>
      </div>
      
      <div className="p-3 space-y-2 bg-neutral-900 rounded-b-lg">
        <div className="text-xs text-neutral-500 uppercase font-semibold tracking-wider">
          {data.type || 'Action'}
        </div>
        <div className="text-xs text-neutral-400">
          {data.description || 'Ejecuta una acción en el sistema'}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-neutral-900" />
    </div>
  );
}
