"use client";

import { Handle, Position } from '@xyflow/react';
import { Database } from 'lucide-react';
import { EntityAttribute } from '@/lib/studio/studioTypes';

export default function EntityNode({ data, selected }: any) {
  const attributes = (data.attributes as EntityAttribute[]) || [];

  return (
    <div className={`bg-neutral-900 border-2 rounded-lg shadow-xl w-72 transition-colors ${selected ? 'border-blue-500' : 'border-neutral-700'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-neutral-900" />
      
      <div className="p-3 border-b border-neutral-800 flex items-center space-x-2 bg-blue-900/20 rounded-t-lg">
        <Database className="w-4 h-4 text-blue-400 shrink-0" />
        <div className="font-semibold text-sm truncate">{data.label}</div>
      </div>
      
      <div className="p-3 bg-neutral-900 rounded-b-lg flex flex-col max-h-[300px]">
        <div className="flex items-center justify-between text-xs text-neutral-500 uppercase font-semibold tracking-wider mb-2 shrink-0">
          <span>{data.type || 'Entity'}</span>
          {data.rowCount > 0 && (
            <span className={`text-[9px] px-1 rounded ${data.rowCount > 100000 ? 'bg-red-500/20 text-red-400' : data.rowCount > 10000 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`} title="Approximate record count - high volume tables are usually core business structures to prioritize in OPO ontology">
              ~{Math.round(data.rowCount / 1000)}k rows
            </span>
          )}
        </div>
        
        {attributes.length > 0 && (
          <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
            {attributes.map((attr) => (
              <div key={attr.id} className="flex items-center justify-between text-xs font-mono bg-neutral-950 p-1.5 rounded border border-neutral-800">
                <div className="flex items-center space-x-2 overflow-hidden">
                  <span className="text-neutral-300 truncate font-semibold">{attr.name}</span>
                  <div className="flex space-x-1 shrink-0">
                    {attr.isPrimaryKey && <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1 rounded border border-yellow-500/20">PK</span>}
                    {attr.isRequired && <span className="text-[9px] bg-red-500/10 text-red-400 px-1 rounded border border-red-500/20">REQ</span>}
                    {attr.isUnique && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1 rounded border border-blue-500/20">UNQ</span>}
                  </div>
                </div>
                <span className="text-neutral-500 ml-2 shrink-0">{attr.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-neutral-900" />
    </div>
  );
}

