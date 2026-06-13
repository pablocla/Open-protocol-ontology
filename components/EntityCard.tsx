/**
 * Open Protocol ONTOLOGY (OPO) - Entity Card Component
 * Licensed under the Apache License, version 2.0
 */

import React from 'react';
import { ArrowRight, Layers, FileText, Settings, Database } from 'lucide-react';
import { OPOEntity } from '../lib/entities';

interface EntityCardProps {
  entity: OPOEntity;
}

export default function EntityCard({ entity }: EntityCardProps) {
  const erpCount = Object.keys(entity.erpMappings).length;

  return (
    <a
      href={`/entities/${entity.name.toLowerCase()}/`}
      className="flex flex-col rounded-2xl border border-zinc-900 bg-zinc-950 p-6 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/2 transition-all group relative overflow-hidden"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
          opo:{entity.name}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xxs font-mono font-medium ${
            entity.tier === 1
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
              : entity.tier === 2
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
              : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
          }`}
        >
          Tier {entity.tier}
        </span>
      </div>

      <p className="mt-3 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
        {entity.description}
      </p>

      {/* Stats footer block */}
      <div className="mt-6 flex items-center justify-between border-t border-zinc-900/80 pt-4 text-xxs font-mono text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-zinc-600" />
            <span>{entity.aliases.length} aliases</span>
          </span>
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3 text-zinc-600" />
            <span>{erpCount} ERPs mapped</span>
          </span>
        </div>
        <span className="text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  );
}
