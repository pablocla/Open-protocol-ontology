'use client';

/**
 * Open Protocol ONTOLOGY (OPO) - Homepage
 * Licensed under the Apache License, version 2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Layers, Network, Terminal, CheckCircle2, Copy } from 'lucide-react';

export default function HomePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('https://openprotocol.dev/ontology/opo-ai-primer.md');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden bg-[#0a0a0a] pb-20 text-slate-300">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pt-12 sm:pt-16">
        <div className="text-left space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400"
          >
            <span>OPO Release</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">v0.1.0</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-light text-white leading-tight"
          >
            Connecting <span className="font-mono italic text-emerald-400">AI Agents</span> to <span className="border-b border-slate-700">Enterprise ERPs</span> via a shared semantic bridge.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl"
          >
            Open Protocol Ontology (OPO) is a static, machine-readable specification designed to eliminate the translation friction between Large Language Models and legacy financial systems.
          </motion.p>

          {/* Quick View Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6"
          >
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-lg group hover:border-emerald-500/50 transition-colors">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Tier 1 Entities</div>
              <div className="text-3xl text-white font-mono mb-1">13</div>
              <p className="text-xs text-slate-500 leading-relaxed">Core financial objects like Invoices, Customers, and Payments.</p>
            </div>
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-lg group hover:border-emerald-500/50 transition-colors">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Total Aliases</div>
              <div className="text-3xl text-white font-mono mb-1">240+</div>
              <p className="text-xs text-slate-500 leading-relaxed">Mapping BKPF, SF2, Odoo 17, and SAP S/4 to canonical OPO terms.</p>
            </div>
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-lg group hover:border-emerald-500/50 transition-colors">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">AI Ready</div>
              <div className="text-3xl text-white font-mono mb-1">100%</div>
              <p className="text-xs text-slate-500 leading-relaxed">JSON-LD and system prompts optimized for direct LLM ingestion.</p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-6 flex flex-wrap gap-4"
          >
            <Link
              href="/entities/"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-650 hover:bg-emerald-500 px-5 py-2.5 text-xs font-mono font-bold text-black shadow-sm transition-all active:scale-95"
            >
              Browse Entity Schemas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/spec/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-5 py-2.5 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              Learn Protocol Specification
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The Problem & Solution Section */}
      <section className="mx-auto max-w-4xl px-4 mt-16">
        <hr className="border-slate-800 mb-16" />
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-8 lg:grid lg:grid-cols-2 lg:gap-12 backdrop-blur-sm">
          <div>
            <h2 className="font-mono text-sm font-bold tracking-tight text-white uppercase text-emerald-405">
              The Problem: AI Speak CRM, ERPs Speak Shorthand
            </h2>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              When an AI agent runs a business search, it looks for an <strong>Invoice</strong> or a <strong>Partner</strong>. Instead, it encounters proprietary legacy table indices — SAP&apos;s <code className="font-mono text-emerald-300">BKPF</code> / <code className="font-mono text-emerald-300">MARA</code>, NetSuite records, or TOTVS Protheus&apos;s <code className="font-mono text-blue-300">SF2</code> / <code className="font-mono text-blue-300">SA1</code> tables. 
            </p>
            <p className="mt-4 text-slate-400 text-xs leading-relaxed">
              Without standard semantic abstraction, developers must build custom ETL pipes and mapping utilities for every client, creating brittle systems that crash on minor middleware updates.
            </p>
          </div>
          <div className="mt-8 lg:mt-0 flex flex-col justify-center border-t border-slate-800 pt-8 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-12">
            <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2 uppercase text-blue-405">
              <Network className="h-4 w-4 text-emerald-400" />
              The OPO Solution
            </h3>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              OPO introduces a universal discovery format. ERP-connected adapters announce canonical entity schemas that match unified concepts. AI systems read standard fields (like <code className="font-mono text-emerald-400">grandTotal</code>, <code className="font-mono text-emerald-400">taxId</code>) directly at <code className="font-mono text-emerald-300">/.well-known/opo.json</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Universal Protocol Adaptation Section */}
      <section className="mx-auto max-w-4xl px-4 mt-20">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Universal Adaptation</h3>
          <span className="text-[10px] font-mono text-emerald-500">v0.1.0_LATEST</span>
        </div>
        
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm overflow-hidden relative group transition-all hover:bg-slate-900/40 hover:border-slate-700">
          {/* Background Gradient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
          
          <div className="relative z-10">
            <h2 className="font-mono text-lg font-bold text-white mb-4">
              Write Once, Resolve Anywhere.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-8 max-w-2xl">
              OPO is strictly agnostic to your underlying infrastructure. AI Agents send a single, standardized JSON payload (<code className="font-mono text-emerald-400">OpoQuery</code>), and the OPO Sidecar dynamically translates the intent into the required native protocol. <strong>No AI hallucinations, no complex prompt engineering for specific endpoints.</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* SQL Card */}
              <div className="p-5 border border-slate-700/50 bg-black/50 rounded-lg hover:border-emerald-500/50 transition-colors shadow-sm">
                <div className="text-emerald-400 font-mono text-xs font-bold mb-3 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  SQL Adapters
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Translates semantic queries directly into strictly typed Postgres, Oracle, or SQL Server dialects. The ultimate bridge for legacy ERP indices like <span className="font-mono text-emerald-200">BKPF</span>.
                </p>
              </div>

              {/* REST / GraphQL Card */}
              <div className="p-5 border border-slate-700/50 bg-black/50 rounded-lg hover:border-blue-500/50 transition-colors shadow-sm">
                <div className="text-blue-400 font-mono text-xs font-bold mb-3 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  REST & GraphQL
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Maps canonical actions directly to modern API endpoints or GraphQL mutations. The AI interacts with OPO, and OPO orchestrates the HTTP headers and payloads automatically.
                </p>
              </div>

              {/* n8n Orchestration Card */}
              <div className="p-5 border border-slate-700/50 bg-black/50 rounded-lg hover:border-purple-500/50 transition-colors shadow-sm">
                <div className="text-purple-400 font-mono text-xs font-bold mb-3 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                  n8n Orchestration
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bridge complex multi-step actions by wiring OPO directly into <strong>n8n webhooks</strong>. OPO structures and secures the AI&apos;s data, while n8n executes the workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid: Quickstart Paths */}
      <section className="mx-auto max-w-4xl px-4 mt-20">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Three Paths to Standard Implementation</h3>
          <span className="text-[10px] font-mono text-emerald-500">v0.1.0_LATEST</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Path 1 */}
          <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/10 p-6 hover:border-slate-700 transition-all group">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-emerald-500/10 text-emerald-404 mb-6 font-mono font-bold text-xs">
              01
            </div>
            <h3 className="font-mono text-xs font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">
              I am building an AI Agent
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Configure your agent core to consult the AI system primer file and dynamically inspect OPO schemas for data resolution.
            </p>
            <Link href="/adopt/" className="mt-auto pt-6 text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5 hover:underline">
              Integration docs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Path 2 */}
          <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/10 p-6 hover:border-slate-700 transition-all group">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-500/10 text-blue-404 mb-6 font-mono font-bold text-xs">
              02
            </div>
            <h3 className="font-mono text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase">
              I am building an ERP Client
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Expose a standardized manifest JSON at /.well-known/opo.json to allow seamless third-party AI discovery.
            </p>
            <Link href="/adopt/" className="mt-auto pt-6 text-xs font-mono font-semibold text-blue-400 flex items-center gap-1.5 hover:underline">
              Host manifest guide <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Path 3 */}
          <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/10 p-6 hover:border-slate-700 transition-all group">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-zinc-800/40 text-slate-300 mb-6 font-mono font-bold text-xs">
              M:A
            </div>
            <h3 className="font-mono text-xs font-bold text-white group-hover:text-slate-200 transition-colors uppercase">
              I want to contribute aliases
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Submit multi-language synonyms and table correlations to extend high-confidence scores inside the universal registry.
            </p>
            <Link href="/registry/" className="mt-auto pt-6 text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5 hover:underline">
              Contribute aliases <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Semantic Resolution Algorithm Block */}
      <section className="mx-auto max-w-4xl px-4 mt-20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Semantic Resolution Code</h3>
          <span className="text-[10px] font-mono text-emerald-600">v0.1.0_LATEST</span>
        </div>
        <div className="bg-black/90 rounded-lg border border-slate-800 p-6 font-mono text-xs overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <div className="text-emerald-400">{"// Resolver implementation for ERP Adapters"}</div>
          <div className="mt-2 text-slate-300 leading-relaxed">
            <span className="text-pink-400">const</span> <span className="text-blue-400">resolveEntity</span> = (alias) =&gt; &#123;
            <br />&nbsp;&nbsp;<span className="text-pink-405">return</span> registry.filter(entry =&gt; entry.alias === alias);
            <br />&nbsp;&nbsp;<span className="text-slate-500">{"// Returns canonical opo:Invoice for 'BKPF' (SAP)"}</span>
            <br />&nbsp;&nbsp;<span className="text-slate-500">{"// Returns canonical opo:Invoice for 'SF2' (TOTVS)"}</span>
            <br />&#125;
          </div>
          <div className="mt-4 p-4 bg-slate-900/35 rounded border border-slate-800/60">
            <div className="flex justify-between items-center text-[10px] uppercase text-slate-500 mb-2">
              <span>registry/entry/001</span>
              <span>Confidence: 1.0</span>
            </div>
            <div className="text-slate-300 font-mono text-[11px]">
              &#123; &quot;alias&quot;: <span className="text-orange-300">&quot;Factura&quot;</span>, &quot;language&quot;: <span className="text-orange-300">&quot;es&quot;</span>, &quot;canonical&quot;: <span className="text-orange-300">&quot;opo:Invoice&quot;</span> &#125;
            </div>
          </div>
        </div>
      </section>

      {/* Entity Tier Overview */}
      <section className="mx-auto max-w-4xl px-4 mt-20">
        <div className="bg-slate-900/25 border border-slate-800 rounded-lg p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1 */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wilder">
              <Layers className="h-3.5 w-3.5_custom" />
              Tier 1 — Core Master Records
            </div>
            <h4 className="font-mono text-2xl font-extrabold text-white">13 Entities</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Essential enterprise foundations including Parties, Customers, Suppliers, Products, Invoices, Payments, and Price Books. Highly standardized.
            </p>
          </div>

          {/* Tier 2 */}
          <div className="space-y-2 md:border-l md:border-slate-800/80 md:pl-8">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wilder">
              <BookOpen className="h-3.5 w-3.5_custom" />
              Tier 2 — Treasury & Logistics
            </div>
            <h4 className="font-mono text-2xl font-extrabold text-white">8 Entities</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Operational vectors covering Credit Risk Profiles, Outstandings Exposure, Warehouse Locations, Shipments, and Tax Certificates.
            </p>
          </div>

          {/* Tier 3 */}
          <div className="space-y-2 md:border-l md:border-slate-800/80 md:pl-8">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wilder">
              <Network className="h-3.5 w-3.5_custom" />
              Tier 3 — Analytics
            </div>
            <h4 className="font-mono text-2xl font-extrabold text-white">2 Entities</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fuzzy control boundaries mapping Cost Center ledger structures and collaborative project timelines.
            </p>
          </div>
        </div>
      </section>

      {/* AI Prompt Injection Box */}
      <section className="mx-auto max-w-4xl px-4 mt-20">
        <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/15 p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">AI Prompt Adapter</span>
              </div>
              <h3 className="mt-2 font-mono text-sm font-bold text-white uppercase">
                Integrate OPO directly into your LLM Context
              </h3>
              <p className="mt-2 text-xs text-slate-400 max-w-xl leading-relaxed">
                Feed your autonomous agent our dense, token-optimized primer file. It explains mapping algorithms, discovery loops, and standard endpoints.
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 rounded-lg bg-slate-850 px-4.5 py-2.5 text-xs font-mono font-bold text-slate-200 hover:bg-slate-750 hover:text-white border border-slate-700/50 active:scale-95 transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Primer URL</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-6 border-t border-slate-800 pt-6">
            <a
              href="/opo-ai-primer.md"
              target="_blank"
              className="text-xs font-mono font-semibold text-emerald-400 hover:underline flex items-center gap-1.5"
            >
              View raw primer prompt file <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
