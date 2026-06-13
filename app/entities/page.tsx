'use client';

/**
 * Open Protocol ONTOLOGY (OPO) - Entities Browser
 * Licensed under the Apache License, version 2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, Grid, Archive, Database, HelpCircle } from 'lucide-react';
import { getAllEntities } from '../../lib/entities';
import EntityCard from '../../components/EntityCard';

export default function EntitiesPage() {
  const allEntities = useMemo(() => getAllEntities(), []);
  
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const filteredEntities = useMemo(() => {
    return allEntities.filter((entity) => {
      // Filter by tier
      if (selectedTier !== null && entity.tier !== selectedTier) {
        return false;
      }
      // Filter by search query (checks name, description, and aliases)
      const query = search.trim().toLowerCase();
      if (!query) return true;
      
      const matchName = entity.name.toLowerCase().includes(query);
      const matchDesc = entity.description.toLowerCase().includes(query);
      const matchAlias = entity.aliases.some((alias) =>
        alias.toLowerCase().includes(query)
      );

      return matchName || matchDesc || matchAlias;
    });
  }, [allEntities, search, selectedTier]);

  return (
    <div className="relative min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Dynamic decoration background grids */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className="absolute top-[10%] right-[10%] h-[30%] w-[30%] rounded-full bg-emerald-500/2 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-mono font-medium text-emerald-400">
            <span>Unified Dictionary</span>
          </div>
          <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Semantic Entity Browser
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Discover the 23 standard OPO entity categories containing canonical schema structures, multi-language table mappings, and AI-optimized query rules.
          </p>
        </header>

        {/* Filters and Search Bar Row */}
        <div className="flex flex-col gap-4 border border-zinc-900 bg-zinc-950 p-4 rounded-xl mb-8 md:flex-row md:items-center justify-between">
          {/* Search Input wrapper */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-600">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search entities by name, alias, table code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-900 bg-zinc-950/80 py-2 pl-10 pr-4 text-xs text-zinc-300 placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
            />
          </div>

          {/* Tier Buttons bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xxs font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 pr-2">
              <SlidersHorizontal className="h-3 w-3" />
              Filter Tier:
            </span>
            <button
              onClick={() => setSelectedTier(null)}
              className={`rounded-lg px-3 py-1.5 text-xxs font-mono font-bold uppercase transition-all ${
                selectedTier === null
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              All Tiers ({allEntities.length})
            </button>
            <button
              onClick={() => setSelectedTier(1)}
              className={`rounded-lg px-3 py-1.5 text-xxs font-mono font-bold uppercase transition-all ${
                selectedTier === 1
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent'
              }`}
            >
              Tier 1 (Core)
            </button>
            <button
              onClick={() => setSelectedTier(2)}
              className={`rounded-lg px-3 py-1.5 text-xxs font-mono font-bold uppercase transition-all ${
                selectedTier === 2
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-blue-500/60 hover:text-blue-400 hover:bg-blue-500/5 border border-transparent'
              }`}
            >
              Tier 2 (Risk)
            </button>
            <button
              onClick={() => setSelectedTier(3)}
              className={`rounded-lg px-3 py-1.5 text-xxs font-mono font-bold uppercase transition-all ${
                selectedTier === 3
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'text-purple-500/60 hover:text-purple-400 hover:bg-purple-500/5 border border-transparent'
              }`}
            >
              Tier 3 (Budget)
            </button>
          </div>
        </div>

        {/* Results Count Info panel */}
        <p className="font-mono text-xxs text-zinc-500 mb-6">
          Showing <span className="text-zinc-300 font-bold">{filteredEntities.length}</span> of {allEntities.length} entities and synonyms
        </p>

        {/* Entities Grid */}
        {filteredEntities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntities.map((entity, idx) => (
              <motion.div
                key={entity.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
              >
                <EntityCard entity={entity} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-2xl py-16 text-center">
            <Archive className="h-10 w-10 text-zinc-700 mb-4" />
            <span className="font-mono text-sm font-semibold text-zinc-400">No entities matches search criteria</span>
            <span className="mt-1.5 text-xs text-zinc-600 max-w-xs leading-relaxed">
              {"Try searching simpler terms like \"Client\", \"KNA1\", \"Invoice\", \"Precios\", or check tier classifications above."}
            </span>
            <button
              onClick={() => { setSearch(''); setSelectedTier(null); }}
              className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-xxs font-mono font-bold text-zinc-300 hover:text-white transition-all border border-zinc-800"
            >
              Clear Search Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
