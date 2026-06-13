'use client';

/**
 * Open Protocol ONTOLOGY (OPO) - ERP Documentation Index Interface
 * Licensed under the Apache License, version 2.0
 * Copyright 2025 The OPO Contributors
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ArrowRight, Settings, Command, Globe, CheckCircle2, ShieldCheck, Cpu, Github } from 'lucide-react';
import { ERP_GUIDES, ERPGuide } from '../../lib/docs';

export default function DocsPage() {
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [deploymentFilter, setDeploymentFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Filter logic
  const filteredGuides = ERP_GUIDES.filter((guide) => {
    const matchesSearch =
      guide.name.toLowerCase().includes(search.toLowerCase()) ||
      guide.vendor.toLowerCase().includes(search.toLowerCase()) ||
      guide.apiType.toLowerCase().includes(search.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === 'all' || guide.difficulty === difficultyFilter;

    const matchesDeployment =
      deploymentFilter === 'all' || guide.deploymentModel === deploymentFilter;

    const matchesRegion =
      regionFilter === 'all' ||
      guide.region.some((r) => r.toLowerCase() === regionFilter.toLowerCase()) ||
      (regionFilter === 'LATAM' && (guide.region.includes('Brazil') || guide.region.includes('Argentina') || guide.region.includes('LATAM')));

    return matchesSearch && matchesDifficulty && matchesDeployment && matchesRegion;
  });

  const getDifficultyColor = (diff: 'low' | 'medium' | 'high') => {
    switch (diff) {
      case 'low':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-990/40';
      case 'medium':
        return 'bg-amber-950/40 text-amber-400 border border-amber-900/40';
      case 'high':
        return 'bg-red-950/40 text-red-400 border border-red-900/40';
    }
  };

  const getCompatibilityBadge = (comp: 'full' | 'partial' | 'community') => {
    switch (comp) {
      case 'full':
        return 'text-emerald-400 border border-emerald-900 bg-emerald-950/20';
      case 'partial':
        return 'text-sky-400 border border-sky-900 bg-sky-950/20';
      case 'community':
        return 'text-indigo-400 border border-indigo-900 bg-indigo-950/20';
    }
  };

  return (
    <main className="flex-1 py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="mb-12 border-b border-slate-800 pb-10">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 mb-4">
          <BookOpen className="w-3.5 h-3.5" />
          <span>OPO PROTOCOL SUITE</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-white tracking-tight leading-none mb-4">
          ERP Integration Directory
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Step-by-step technical guides to build, configure, and deploy Open Protocol adapters for the world's leading ERP packages. Expose standardized 
          <code className="bg-slate-900 px-1 border border-slate-800 rounded font-mono text-xs mx-1 text-emerald-300">/.well-known/opo.json</code> discovery interfaces.
        </p>
      </div>

      {/* Control center & filtering panel */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-lg p-5 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-xs shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ERPs, vendors, APIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0d0d0d] border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          {/* Difficulty filter */}
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-slate-800 rounded px-3 py-2 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Difficulty (All)</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Deployment model filter */}
          <div>
            <select
              value={deploymentFilter}
              onChange={(e) => setDeploymentFilter(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-slate-800 rounded px-3 py-2 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Deployment (All)</option>
              <option value="cloud">Cloud-Native</option>
              <option value="hybrid">Hybrid</option>
              <option value="onpremise">On-Premise</option>
            </select>
          </div>

          {/* Region filter */}
          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-slate-800 rounded px-3 py-2 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Region (All)</option>
              <option value="Global">Global</option>
              <option value="US">US</option>
              <option value="EU">EU</option>
              <option value="LATAM">LATAM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid container */}
      {filteredGuides.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-800/60 rounded">
          <p className="text-sm font-mono text-slate-500">No integration guides match your specified search matrices.</p>
          <button
            onClick={() => {
              setSearch('');
              setDifficultyFilter('all');
              setDeploymentFilter('all');
              setRegionFilter('all');
            }}
            className="mt-4 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xxs font-bold uppercase rounded transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <div
              key={guide.slug}
              className="group bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850 hover:border-slate-700 rounded-lg p-5 flex flex-col justify-between transition-all"
            >
              <div>
                {/* Upper line: difficulty & setup time */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${getDifficultyColor(guide.difficulty)}`}>
                    {guide.difficulty} setup
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Est. {guide.estimatedSetupMinutes} mins
                  </span>
                </div>

                {/* Name & Vendor */}
                <div className="mb-4">
                  <h3 className="text-base font-serif font-medium text-white group-hover:text-emerald-400 transition-colors">
                    {guide.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                    <span>by {guide.vendor}</span>
                    <span className="text-slate-600">•</span>
                    <span>{guide.version}</span>
                  </div>
                </div>

                {/* Compatibility and API badges */}
                <div className="flex flex-wrap gap-1.5 mb-5 text-[10px] font-mono">
                  <span className="bg-[#121212] px-2 py-0.5 rounded text-zinc-400 border border-zinc-800">
                    {guide.apiType} API
                  </span>
                  <span className="bg-[#121212] px-2 py-0.5 rounded text-zinc-400 border border-zinc-800">
                    {guide.authMethod} Auth
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${getCompatibilityBadge(guide.opoCompatibility)}`}>
                    {guide.opoCompatibility} COMPAT
                  </span>
                </div>

                {/* Tier 1 Schema Coverage score */}
                <div className="mb-6 bg-slate-900/40 p-3 rounded border border-slate-850/50">
                  <div className="flex justify-between items-center text-[10px] font-mono mb-2">
                    <span className="text-slate-400">Tier-1 Entity Coverage</span>
                    <span className="font-semibold text-emerald-400">{guide.tier1Coverage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded"
                      style={{ width: `${guide.tier1Coverage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom footer bar: view guide */}
              <div className="border-t border-slate-800/60 pt-4 mt-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-600" />
                  {guide.deploymentModel}
                </span>

                <Link
                  href={`/docs/${guide.slug}/`}
                  className="inline-flex items-center gap-1.5 font-mono text-xxs font-bold uppercase text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span>Build Adapter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info Banner */}
      <div className="mt-16 bg-[#000]/20 border border-slate-800/80 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Can't discover your enterprise ERP catalog?</h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-xl">
              Become a schema pioneer. Support the global AI enablement of corporate data models. Check our instructions to publish custom tables as canonical OPO entities.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <a
            href="https://github.com/pablocla/Open-protocol-ontology"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-500 text-white font-mono text-xxs font-bold uppercase tracking-wider rounded transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>Contribute a Guide</span>
          </a>
        </div>
      </div>
    </main>
  );
}
