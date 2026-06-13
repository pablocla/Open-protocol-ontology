'use client';

/**
 * Open Protocol ONTOLOGY (OPO) - Alias Registry Browser
 * Licensed under the Apache License, version 2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Info, PlusCircle, Filter, SlidersHorizontal, CheckCircle } from 'lucide-react';
import registryData from '../../public/opo-registry.json';
import FeedbackWidget from '../../components/FeedbackWidget';

interface RegistryItem {
  alias: string;
  language: string;
  canonical: string;
  confidence: number;
  source: string;
  erp_context: string | null;
  notes: string | null;
}

export default function RegistryPage() {
  const items = useMemo<RegistryItem[]>(() => registryData as RegistryItem[], []);

  // Filter states
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [erpFilter, setErpFilter] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  // Available filters options lookup
  const languages = useMemo(() => {
    const list = new Set<string>();
    items.forEach((x) => list.add(x.language));
    return Array.from(list);
  }, [items]);

  const erps = useMemo(() => {
    const list = new Set<string>();
    items.forEach((x) => {
      if (x.erp_context) list.add(x.erp_context);
    });
    return Array.from(list);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search text
      const term = search.toLowerCase();
      const matchText =
        item.alias.toLowerCase().includes(term) ||
        item.canonical.toLowerCase().includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term));

      if (!matchText) return false;

      // Language filter
      if (langFilter !== 'all' && item.language !== langFilter) {
        return false;
      }

      // ERP context filter
      if (erpFilter !== 'all') {
        if (item.erp_context !== erpFilter) return false;
      }

      // Confidence filter
      if (item.confidence < minConfidence) {
        return false;
      }

      return true;
    });
  }, [items, search, langFilter, erpFilter, minConfidence]);

  return (
    <div className="relative min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial effects */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className="absolute bottom-[20%] left-[20%] h-[35%] w-[35%] rounded-full bg-emerald-500/1 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header Block */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <span>Universal Lookup</span>
            </span>
            <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Alias Synonym Registry
            </h1>
            <p className="mt-3 text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Global lookup table for AI systems to resolve user terms, localized labels, and vendor-specific database codes to canonical OPO classes.
            </p>
          </div>

          <div>
            <a
              href="#contribute-form"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 active:scale-95"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Contribute an Alias</span>
            </a>
          </div>
        </header>

        {/* Filter Toolbar controls */}
        <div className="flex flex-col gap-4 border border-zinc-900 bg-zinc-950/80 p-5 rounded-xl mb-8">
          {/* Top Row: Search and sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search field */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-600">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search synonyms, table codes, descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-900 bg-zinc-950/40 py-2 pl-10 pr-4 text-xs text-zinc-300 placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
              />
            </div>

            {/* Confidence thresholds */}
            <div className="flex flex-col gap-1.5 justify-center">
              <label className="font-mono text-xxs font-bold text-zinc-500 flex items-center justify-between">
                <span>Min Confidence:</span>
                <span className="text-emerald-400 font-bold">{(minConfidence * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-zinc-900 rounded-lg appearance-none h-1.5 cursor-pointer cursor-ew-resize"
              />
            </div>
          </div>

          {/* Bottom Row: Selector filters */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-zinc-900/60 text-xxs font-mono">
            <span className="text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter By Context:
            </span>

            {/* Language filter selector */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">Lang:</span>
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                className="rounded-lg border border-zinc-900 bg-zinc-950 px-2.5 py-1 text-zinc-300 text-xxs font-bold focus:border-emerald-500/40 focus:outline-none"
              >
                <option value="all">All Languages</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* ERP filter selector */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">ERP System:</span>
              <select
                value={erpFilter}
                onChange={(e) => setErpFilter(e.target.value)}
                className="rounded-lg border border-zinc-900 bg-zinc-950 px-2.5 py-1 text-zinc-300 text-xxs font-bold focus:border-emerald-500/40 focus:outline-none"
              >
                <option value="all">All Vendors</option>
                {erps.map((erp) => (
                  <option key={erp} value={erp}>
                    {erp}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Counter and Results and Table */}
        <div className="mb-6 font-mono text-xxs text-zinc-500 flex items-center justify-between">
          <span>Found <span className="text-zinc-300 font-bold">{filteredItems.length}</span> alias definitions</span>
          <span className="text-zinc-650 flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            Verified indexes
          </span>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-950 px-6 py-4 text-zinc-500 font-mono text-xxs uppercase tracking-wider">
                  <th className="p-4">Alias Code</th>
                  <th className="p-4">Lang</th>
                  <th className="p-4">Canonical OPO Class</th>
                  <th className="p-4 text-center">Confidence</th>
                  <th className="p-4">ERP Source Scope</th>
                  <th className="p-4">Registry Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-zinc-900/40 text-zinc-400 hover:bg-zinc-900/15 transition-all"
                    >
                      <td className="p-4 font-mono font-bold text-white whitespace-nowrap">
                        {item.alias}
                      </td>
                      <td className="p-4 font-mono text-xxs uppercase text-zinc-500">
                        {item.language}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <a
                          href={`/entities/${item.canonical.replace('opo:', '').toLowerCase()}/`}
                          className="font-mono text-xxs font-semibold text-emerald-400 hover:underline"
                        >
                          {item.canonical}
                        </a>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 font-mono text-xxs font-bold ${
                            item.confidence >= 0.9
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.confidence >= 0.7
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          }`}
                        >
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xxs text-zinc-400 max-w-xs truncate">
                        {item.erp_context || 'Universal common'}
                      </td>
                      <td className="p-4 text-zinc-500 text-xxs max-w-md">
                        {item.notes || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-650 font-mono text-xs">
                      No matching registered aliases discovered. Adjust filters above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Community Contribution Widget */}
        <section id="contribute-form" className="mt-16 border-t border-zinc-900 pt-10">
          <div className="mx-auto max-w-4xl bg-zinc-950 border border-zinc-900 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="mb-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-0.5 rounded">
                Active Protocol Feedback
              </span>
              <h2 className="text-xl font-serif font-medium text-white tracking-tight mt-3">
                Register a new Alias Synonym
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                Help build the universal ERP dictionary. Submit localized names, country-specific fields, or native ERP table references directly to our n8n feedback engine.
              </p>
            </div>
            
            <FeedbackWidget entityName="Customer" mode="alias" />
          </div>
        </section>
      </div>
    </div>
  );
}
