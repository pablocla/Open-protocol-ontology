/**
 * Open Protocol ONTOLOGY (OPO) - Specification Page
 * Licensed under the Apache License, version 2.0
 */

import React from 'react';
import { ShieldAlert, BookOpen, Fingerprint, Terminal, Code, Cpu } from 'lucide-react';
import CopyButton from '../../components/CopyButton';
import FeedbackWidget from '../../components/FeedbackWidget';

// Mock code for OPOAdapter definition
const adapterTypeScriptCode = `/**
 * Core OPO Adapter TypeScript Core Interface Specification
 */

export interface OPOAdapter {
  /**
   * Universal Discovery Endpoint query mapping.
   * Service MUST locate compliance manifest at /.well-known/opo.json
   */
  getManifest(): Promise<OPOManifest>;

  /**
   * Fetch standard query collection matching OPO schema.
   * @param entity Canonical OPO entity (e.g. "opo:Customer")
   * @param filters Semantic properties criteria
   */
  queryEntity<T>(entity: string, filters?: Record<string, any>): Promise<T[]>;
}

export interface OPOManifest {
  opo_version: string;
  system_identity: {
    erp_name: string;
    version: string;
    jurisdictions: string[];
  };
  adapter_configuration: {
    base_url: string;
    authentication_type: 'OAuth2' | 'APIKey' | 'Basic';
  };
  supported_entities: Array<{
    canonical: string;
    native_reference: string;
    confidence: number;
    limitations?: string;
  }>;
}`;

export default function SpecPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Visual Design Grid overlays */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className="absolute -top-[10%] left-[20%] h-[40%] w-[30%] rounded-full bg-blue-500/2 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Page title and intro */}
        <header className="mb-12 border-b border-zinc-900 pb-8 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-mono font-medium text-blue-400">
            <span>Protocol Specification</span>
          </span>
          <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Protocol Invariants & Architectures
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Technical criteria to ensure compliance when building, deploying, or requesting data from OPO semantic adapters.
          </p>
        </header>

        {/* 6 Protocol Invariants Section */}
        <section className="space-y-6 mb-16">
          <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2.5 mb-6">
            <ShieldAlert className="h-5 w-5 text-emerald-400" />
            The Six Protocol Invariants
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INV-001 */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xxs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  OPO-INV-001
                </span>
                <h4 className="mt-3 font-mono text-xs font-bold text-white">Discovery Location Bound</h4>
                <p className="mt-2 text-xxs text-zinc-500 leading-relaxed">
                  Compliant systems MUST serve their JSON discovery manifest exactly at the universal relative endpoint: <code className="font-mono text-zinc-400">/.well-known/opo.json</code>. Alternate dynamic paths are strictly forbidden.
                </p>
              </div>
            </div>

            {/* INV-002 */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xxs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  OPO-INV-002
                </span>
                <h4 className="mt-3 font-mono text-xs font-bold text-white">Draft-2020 JSON Schema Enforcement</h4>
                <p className="mt-2 text-xxs text-zinc-500 leading-relaxed">
                  Every payload returned by an adapter querying OPO structures MUST validate completely against its canonical Draft-2020-12 schema definition with zero structural deviations.
                </p>
              </div>
            </div>

            {/* INV-003 */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xxs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  OPO-INV-003
                </span>
                <h4 className="mt-3 font-mono text-xs font-bold text-white">Deterministic Alias Confidence</h4>
                <p className="mt-2 text-xxs text-zinc-500 leading-relaxed">
                  Adapters resolving queries matching terms with confidence indexes <code className="font-mono text-zinc-400">&lt; 0.7</code> MUST halt transactional operations and solicit human clarification. No speculative executions allowed.
                </p>
              </div>
            </div>

            {/* INV-004 */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xxs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  OPO-INV-004
                </span>
                <h4 className="mt-3 font-mono text-xs font-bold text-white">Stateless Adapter Mapping</h4>
                <p className="mt-2 text-xxs text-zinc-500 leading-relaxed">
                  OPO-compliant adapters MUST NOT store persistent operational data. Adapters act purely as real-time stateless semantic translators between target LLMs and standard ERP structures.
                </p>
              </div>
            </div>

            {/* INV-005 */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xxs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  OPO-INV-005
                </span>
                <h4 className="mt-3 font-mono text-xs font-bold text-white">Strict Versioning Authority</h4>
                <p className="mt-2 text-xxs text-zinc-500 leading-relaxed">
                  Ontology modifications must follow semantic numbering guidelines. Major updates that break backward compatibility (such as field dropping) MUST trigger a major increment.
                </p>
              </div>
            </div>

            {/* INV-006 */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xxs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  OPO-INV-006
                </span>
                <h4 className="mt-3 font-mono text-xs font-bold text-white">Apache 2.0 Compliance licensing</h4>
                <p className="mt-2 text-xxs text-zinc-500 leading-relaxed">
                  All derivative adapter layouts, mapping schemes, or discovery profiles built directly matching the schema standard MUST remain open, attribution-neutral, and commercially reusable under Apache 2.0 terms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Discovery Mechanism Spec Section */}
        <section className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 mb-16">
          <h2 className="font-mono text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-emerald-400" />
            The Discovery Loop Algorithm
          </h2>
          <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
            When an orchestrating agent encounters an unknown business address, it executes a standardized <strong>OPO Handshake</strong>. The loop consists of three steps:
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xxs text-zinc-500">
            <div className="bg-zinc-900/40 p-4 border border-zinc-900 rounded-lg">
              <span className="block font-bold text-emerald-400 mb-1">ST-01: Manifest Scan</span>
              Agent executes GET request at /.well-known/opo.json, assessing ERP versions, capabilities, and dynamic endpoint lists.
            </div>
            <div className="bg-zinc-900/40 p-4 border border-zinc-900 rounded-lg">
              <span className="block font-bold text-blue-400 mb-1">ST-02: Synonym Check</span>
              Fuzzy terms supplied by user profiles are checked against opo-registry.json to map correct canonical elements (like Customer).
            </div>
            <div className="bg-zinc-900/40 p-4 border border-zinc-900 rounded-lg">
              <span className="block font-bold text-purple-400 mb-1">ST-03: API Query</span>
              Request filters are validated against standard JSON Schema, sending structured outputs to the adapter endpoint.
            </div>
          </div>
        </section>

        {/* Adapter Interface Box */}
        <section className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden mb-16">
          <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-3 bg-zinc-950">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
              <Code className="h-4 w-4 text-emerald-400" />
              OPOAdapter Programmatic Interface Specification
            </span>
            <CopyButton text={adapterTypeScriptCode} label="TypeScript Code" />
          </div>
          <pre className="p-6 bg-zinc-900/20 text-xxs font-mono text-zinc-400 overflow-x-auto leading-relaxed max-h-[350px]">
            <code>{adapterTypeScriptCode}</code>
          </pre>
        </section>

        {/* Protocol Error Codes */}
        <section className="bg-zinc-950 border border-zinc-900 rounded-xl p-8">
          <h2 className="font-mono text-base font-bold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-zinc-400" />
            Universal OPO Error Code Catalog
          </h2>

          <div className="overflow-x-auto font-sans text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 font-mono text-xxs uppercase text-zinc-500 tracking-wider">
                  <th className="pb-3 pr-4">Error Code</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3">Agent Directive</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-001</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">Missing credentials or authorization token expired.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Prompt user to re-configure OAuth profiles.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-002</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">Requested entity schema is not configured in target adapter.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Notify that the entity cannot be loaded on this system.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-003</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">JSON Output fails canonical schema validation checks.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Halt results display and logs schema differences.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-004</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">The underlying ERP gateway execution timeout (&gt;30s).</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Alert user regarding offline status. Try caching.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-005</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">Endpoint schema conflict. Database and OPO values diverge.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Downgrade mapping confidence factor and alert administrator.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-006</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">Database transaction lock or concurrency failure.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Safe retry exponentially after 2,000ms.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-007</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">Query filter syntax violates specified type rules.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Re-check dynamic input mapping parameters.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-008</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">API rate ceiling limit breached at standard adapter endpoints.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Buffer subsequent queries under 1 request per sec.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-009</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">Jurisdiction routing failure. Unsupported regulatory tax rules.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Halt calculation and prompt user regarding locale settings.</td>
                </tr>
                <tr className="border-b border-zinc-900/50 hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold text-emerald-400">OPO-ERR-010</td>
                  <td className="py-3 pr-4 text-zinc-400 leading-relaxed">Underlying ERP connection offline or database server offline.</td>
                  <td className="py-3 text-zinc-500 leading-relaxed">Wait 10 minutes or check cloud credentials.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Protocol RFC Feedback Section */}
        <section className="mt-16 border-t border-zinc-900 pt-10">
          <div className="bg-[#0b0b0b] border border-zinc-900 rounded-xl p-6 md:p-8">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-950 px-2 py-0.5 rounded">
              RFC Proposal Channel
            </span>
            <h2 className="text-xl font-serif font-medium text-white mt-4">
              Propose an extension or change request
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed mt-1 mb-6">
              Have issues with the error code registers or invariants? Submit a formal Request for Comments (RFC) directly to our system workflow.
            </p>
            <FeedbackWidget entityName="Protocol" mode="rfc" />
          </div>
        </section>
      </div>
    </div>
  );
}
