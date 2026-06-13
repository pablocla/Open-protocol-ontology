/**
 * Open Protocol ONTOLOGY (OPO) - Standard Entity Dynamic Detail Page
 * Licensed under the Apache License, version 2.0
 */

import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers, Terminal, Database, HelpCircle, CheckCircle2 } from 'lucide-react';
import { getAllEntities, getEntity } from '../../../lib/entities';
import CopyButton from '../../../components/CopyButton';
import FeedbackWidget from '../../../components/FeedbackWidget';

// Static params generator for all 23 OPO entities
export async function generateStaticParams() {
  return getAllEntities().map((e) => ({
    entity: e.name.toLowerCase(),
  }));
}

// Generate page header metadata statically
export async function generateMetadata({ params }: { params: Promise<{ entity: string }> }) {
  const { entity: entityParam } = await params;
  const entity = getEntity(entityParam);
  if (!entity) return { title: 'Entity Not Found | OPO' };
  return {
    title: `opo:${entity.name} Schema Specification | OPO v0.1.0`,
    description: entity.description,
  };
}

interface PageProps {
  params: Promise<{ entity: string }>;
}

export default async function EntityDetailPage({ params }: PageProps) {
  const { entity: entityParam } = await params;
  const entity = getEntity(entityParam);
  if (!entity) {
    return notFound();
  }

  const erpEntries = Object.entries(entity.erpMappings);

  // Generate a mock complete JSON-LD context for standard showcase
  const jsonLdCode = `{
  "@context": "https://openprotocol.dev/ontology/opo-context.jsonld",
  "@id": "opo:${entity.name}",
  "@type": "rdfs:Class",
  "label": "${entity.name}",
  "tier": ${entity.tier},
  "comment": "${entity.description}"
}`;

  return (
    <div className="relative min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back Link Button */}
        <div className="mb-8">
          <Link
            href="/entities/"
            className="inline-flex items-center gap-1.5 font-mono text-xxs font-bold uppercase text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Entity Browser</span>
          </Link>
        </div>

        {/* Header Metadata Section */}
        <header className="border-b border-zinc-900 pb-8 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                <span>opo:{entity.name}</span>
              </div>
              <h1 className="mt-2 font-mono text-4xl font-extrabold text-white">
                {entity.name}
              </h1>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs font-bold uppercase ${
                entity.tier === 1
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                  : entity.tier === 2
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
              }`}
            >
              Tier {entity.tier} Standard Record
            </span>
          </div>

          <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-3xl">
            {entity.description}
          </p>
        </header>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Large Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* Properties Schema Table */}
            <section className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden p-6">
              <h3 className="font-mono text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Schema Properties Validation
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-xxs uppercase tracking-wider">
                      <th className="pb-3 pr-4">Property</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Description</th>
                      <th className="pb-3">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entity.properties.map((prop) => (
                      <tr key={prop.name} className="border-b border-zinc-900/60 text-zinc-400 hover:bg-zinc-900/10 transition-colors">
                        <td className="py-3 pr-4 font-mono font-semibold text-white">{prop.name}</td>
                        <td className="py-3 pr-4 font-mono text-zinc-500 text-xxs">{prop.type}</td>
                        <td className="py-3 pr-4 leading-relaxed text-zinc-400">{prop.description}</td>
                        <td className="py-3">
                          {prop.required ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-xxs font-semibold text-emerald-400">
                              Yes
                            </span>
                          ) : (
                            <span className="text-zinc-650 font-mono text-xxs">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* AI Discovery Instructions & Hints */}
            <section className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
              <h3 className="font-mono text-sm font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-emerald-400" />
                AI Discovery Prompt Hints
              </h3>
              <p className="text-xxs text-zinc-500 font-mono mb-4">
                These phrases allow LLMs to run fuzzy maps toward this canonical entity:
              </p>
              <ul className="space-y-2.5">
                {entity.aiHints.map((hint, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="text-emerald-400/75 select-none font-mono mt-0.5">↳</span>
                    <span>&ldquo;{hint}&rdquo;</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Distinctive Mappings & Use Cases */}
            <section className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
              <h3 className="font-mono text-sm font-bold text-white mb-3">
                Boundary Boundaries
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                This entity represents specific business processes. Review the distinguishable-from terms to prevent semantic confusion:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xxs font-mono font-bold text-zinc-500 uppercase flex items-center pr-2">
                  Distinguish from:
                </span>
                {entity.distinguishableFrom.map((item) => (
                  <a
                    key={item}
                    href={`/entities/${item.toLowerCase()}/`}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-900 bg-zinc-950 px-2.5 py-1 text-xxs font-mono text-zinc-400 hover:border-zinc-800 hover:text-white transition-all"
                  >
                    opo:{item} ↗
                  </a>
                ))}
              </div>
            </section>
          </div>

          {/* Right Smaller Column */}
          <div className="space-y-10">
            {/* Alias synonyms card */}
            <section className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
              <h3 className="font-mono text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-400" />
                Protocol Synonyms
              </h3>
              <p className="text-xxs text-zinc-500 font-mono mb-4">
                High-confidence synonyms registered in our standard index:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entity.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="inline-flex rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 font-mono text-xxs text-zinc-300"
                  >
                    {alias}
                  </span>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-zinc-900/60">
                <a
                  href="/registry/"
                  className="font-mono text-xxs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View full registry database ➔
                </a>
              </div>
            </section>

            {/* ERP Mappings list */}
            <section className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
              <h3 className="font-mono text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-400" />
                ERP Master Tables Map
              </h3>
              <p className="text-xxs text-zinc-500 font-mono mb-4">
                Standard tables mapped for industry ERP core structures:
              </p>
              <div className="space-y-3 font-sans text-xs">
                {erpEntries.map(([erp, tables]) => (
                  <div key={erp} className="border-b border-zinc-900/40 pb-2.5 last:border-b-0 last:pb-0">
                    <span className="block font-mono text-xxs font-bold text-zinc-400 uppercase tracking-wider">{erp}</span>
                    <span className="block mt-0.5 text-zinc-500 font-mono text-xxs">{tables}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Code Snippets Section */}
        <section className="mt-12 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
          {/* Header tabs controls bar */}
          <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-950 px-6 py-3">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              Machine-Readable Definitions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-900">
            {/* JSON Schema Viewer */}
            <div className="bg-zinc-950 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xxs font-mono font-bold uppercase tracking-wider text-zinc-400">JSON Schema Draft 2020</span>
                  <CopyButton text={entity.rawSchema} label="JSON Schema" />
                </div>
                <p className="text-xxs text-zinc-500 leading-relaxed mb-4">
                  Standard format queried by validators and adapter compilers relative to OPO v0.1.0 parameters.
                </p>
              </div>
              <pre className="rounded-lg bg-zinc-900/60 p-4 text-xxs font-mono overflow-x-auto text-zinc-400 max-h-56">
                <code>{entity.rawSchema}</code>
              </pre>
            </div>

            {/* JSON-LD snippet */}
            <div className="bg-zinc-950 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xxs font-mono font-bold uppercase tracking-wider text-zinc-400">JSON-LD Metadata API</span>
                  <CopyButton text={jsonLdCode} label="JSON-LD" />
                </div>
                <p className="text-xxs text-zinc-500 leading-relaxed mb-4">
                  Semantic reference mapping standard RDF parameters for schema graph crawls.
                </p>
              </div>
              <pre className="rounded-lg bg-zinc-900/60 p-4 text-xxs font-mono overflow-x-auto text-zinc-400 max-h-56">
                <code>{jsonLdCode}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="mt-12 border-t border-slate-900 pt-8">
          <h3 className="font-mono text-sm font-bold text-white mb-2">
            Contribute Alias Synonyms for {entity.name}
          </h3>
          <p className="text-xxs text-zinc-500 font-mono mb-6 uppercase tracking-wider">
            Help expand our global language index and LLM discovery dictionary
          </p>
          <div className="bg-[#0c0c0c] border border-slate-800 rounded-lg p-5">
            <FeedbackWidget entityName={entity.name} mode="alias" />
          </div>
        </section>
      </div>
    </div>
  );
}
