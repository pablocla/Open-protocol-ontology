"use client";

import React from 'react';
import { SwarmMemorySnapshot } from '@/lib/engine/types/blackboard';
import { Lock, Database } from 'lucide-react';

interface FrameInspectorProps {
  snapshot: SwarmMemorySnapshot | null;
}

export function FrameInspector({ snapshot }: FrameInspectorProps) {
  if (!snapshot) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden text-sm">
      <div className="bg-neutral-800 px-4 py-2 border-b border-neutral-700 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Database size={16} className="text-indigo-400" />
          State Inspector
        </h3>
        <span className="text-xs text-neutral-400 font-mono">{snapshot.id}</span>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div>
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Memory State</h4>
          {Object.keys(snapshot.state).length === 0 ? (
            <div className="text-neutral-500 italic">Empty</div>
          ) : (
            <div className="bg-black/50 p-3 rounded border border-neutral-800 overflow-x-auto">
              <pre className="text-green-400 font-mono text-xs">
                {JSON.stringify(snapshot.state, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Lock size={14} /> Semantic Locks
          </h4>
          {snapshot.locks.length === 0 ? (
            <div className="text-neutral-500 italic">No active locks</div>
          ) : (
            <div className="flex flex-col gap-2">
              {snapshot.locks.map((lock, i) => (
                <div key={i} className="flex items-center justify-between bg-neutral-800/50 p-2 rounded border border-neutral-700/50">
                  <span className="font-mono text-yellow-400">{lock.entityId}</span>
                  <span className="text-xs text-neutral-300">Agent: <span className="text-indigo-300">{lock.agentId}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
