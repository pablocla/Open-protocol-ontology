/**
 * Open Protocol ONTOLOGY (OPO) - Adoption Guide Page
 * Licensed under the Apache License, version 2.0
 */

import React from 'react';
import { CheckCircle2, ChevronRight, Terminal, Globe, Key, ShieldCheck } from 'lucide-react';
import CopyButton from '../../components/CopyButton';

// Step 1 mock code blocks
const discoveryDeclarationCode = `{
  "opo_version": "0.1.0",
  "system_identity": {
    "erp_name": "TOTVS Protheus",
    "version": "12.1.2310"
  },
  "endpoints": {
    "opo:Customer": {
      "path": "/api/opo/v1/customers",
      "methods": ["GET"],
      "schema": "https://openontology.vercel.app/ontology/schemas/Customer.json"
    }
  }
}`;

// Step 2 mock code block
const expressAdapterSnippet = `import express from 'express';

const app = express();

// OPO-INV-001: Discovery Location Bound
app.get('/.well-known/opo.json', (req, res) => {
  res.json({
    opo_version: "0.1.0",
    system_identity: {
      erp_name": "My Custom Adapter",
      version: "1.0.0",
      jurisdictions: ["AR", "BR"]
    },
    endpoints: {
      "opo:Invoice": {
        "path": "/api/opo/invoices",
        "methods": ["GET"],
        "schema": "https://openontology.vercel.app/ontology/schemas/Invoice.json"
      }
    }
  });
});

// Semantic endpoint mapping
app.get('/api/opo/invoices', async (req, res) => {
  try {
    // 1. Safe query from internal database (e.g. SF2/BKPF)
    const nativeData = await db.query("SELECT * FROM invoices LIMIT 50");
    
    // 2. Map structural fields into standard OPO Invoice schema
    const opoInvoices = nativeData.map((row) => ({
      id: row.invoice_id.toString(),
      number: row.serial_number,
      issueDate: row.created_at.toISOString().split('T')[0],
      dueDate: row.due_date.toISOString().split('T')[0],
      grandTotal: {
        units: Math.floor(row.total_amount),
        currency: row.currency_code
      }
    }));
    
    // 3. Return results compliant with OPO
    res.json(opoInvoices);
  } catch (err) {
    res.status(500).json({
      error_code: "OPO-ERR-005",
      message: "Direct ERP connection error"
    });
  }
});`;

export default function AdoptPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Visual background decorations */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className="absolute -bottom-[20%] right-[10%] h-[40%] w-[35%] rounded-full bg-emerald-500/2 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Page Title header */}
        <header className="mb-12 border-b border-zinc-900 pb-8 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <span>Implementation Guide</span>
          </span>
          <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
            OPO Adapter Onboarding
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Configure your enterprise adapter in three simple phases to enable direct, high-confidence semantic integration for AI agents.
          </p>
        </header>

        {/* Dynamic Step Flow blocks */}
        <div className="space-y-12 mb-16">
          {/* Phase 1 */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/15 mb-4">
                01
              </div>
              <h3 className="font-mono text-sm font-bold text-white mb-3">
                Expose Manifest Profile
              </h3>
              <p className="text-xxs text-zinc-400 leading-relaxed max-w-sm mb-4">
                Configure your reverse proxy, API gateway, or root express routes to host your identity schema manifest exactly at <code className="font-mono text-white">/.well-known/opo.json</code>.
              </p>
              <div className="flex items-center gap-2 text-xxs font-mono text-zinc-500">
                <Globe className="h-4 w-4 text-emerald-400/80" />
                <span>Exposed globally on port 443</span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-2.5 bg-zinc-950">
                <span className="font-mono text-xxs font-bold text-zinc-400 flex items-center gap-1">
                  JSON Declaration Profile
                </span>
                <CopyButton text={discoveryDeclarationCode} label="JSON Manifest" />
              </div>
              <pre className="p-5 bg-zinc-900/10 text-xxs font-mono text-zinc-500 overflow-x-auto max-h-56">
                <code>{discoveryDeclarationCode}</code>
              </pre>
            </div>
          </section>

          {/* Phase 2 */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/15 mb-4">
                02
              </div>
              <h3 className="font-mono text-sm font-bold text-white mb-3">
                Map Database Schemas
              </h3>
              <p className="text-xxs text-zinc-400 leading-relaxed max-w-sm mb-4">
                Program standard mapping formulas matching local databases (SAP, Totvs, Odoo) to standard fields, handling properties validation.
              </p>
              <div className="flex items-center gap-2 text-xxs font-mono text-zinc-500">
                <Terminal className="h-4 w-4 text-blue-400/80" />
                <span>Zero-state translations</span>
              </div>
            </div>

            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-2.5 bg-zinc-950">
                <span className="font-mono text-xxs font-bold text-zinc-400">Express mapping middleware</span>
                <CopyButton text={expressAdapterSnippet} label="Adapter Code" />
              </div>
              <pre className="p-5 bg-zinc-900/10 text-xxs font-mono text-zinc-500 overflow-x-auto max-h-64 leading-normal">
                <code>{expressAdapterSnippet}</code>
              </pre>
            </div>
          </section>

          {/* Phase 3 */}
          <section className="border-t border-zinc-900/60 pt-10">
            <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/15 mt-1">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-white">
                    Submit Adapter Manifest to Global Directory
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-400 max-w-lg leading-relaxed">
                    Once compliant, submit your manifest endpoint to directory hubs structure registries. Allow search bots to crawl the /.well-known file directly.
                  </p>
                </div>
              </div>
              
              <a
                href="https://github.com/pablocla/Open-protocol-ontology/issues/new?title=Register+Active+OPO+Adapter"
                target="_blank"
                rel="noreferrer"
                className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
              >
                <span>Register Your Manifest</span>
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        </div>

        {/* Interactive Protocol Compliance Checklist */}
        <section className="bg-zinc-950 border border-zinc-900 rounded-xl p-8">
          <h2 className="font-mono text-base font-bold text-white mb-6">
            OPO Compliance Checklist
          </h2>

          <div className="space-y-4 font-sans text-xs">
            {/* Item 1 */}
            <div className="flex items-start gap-4 pb-4 border-b border-zinc-900/60 last:border-0 last:pb-0">
              <div className="text-emerald-400 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-mono text-xxs font-bold text-zinc-300 uppercase">Universal URI Exposure (OPO-INV-001)</span>
                <span className="block mt-1 text-zinc-500">The adapter manifest MUST be queried successfully exactly at: <code className="font-mono text-zinc-400">/.well-known/opo.json</code></span>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-4 pb-4 border-b border-zinc-900/60 last:border-0 last:pb-0">
              <div className="text-emerald-400 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-mono text-xxs font-bold text-zinc-300 uppercase">Schema Payload Compliance (OPO-INV-002)</span>
                <span className="block mt-1 text-zinc-500">JSON returned by standard queries validates completely without deviations against JSON Schema Draft-2020 definitions.</span>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-4 pb-4 border-b border-zinc-900/60 last:border-0 last:pb-0">
              <div className="text-emerald-400 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-mono text-xxs font-bold text-zinc-300 uppercase">Deterministic confidence check (OPO-INV-003)</span>
                <span className="block mt-1 text-zinc-500">The adapter restricts database queries if search synonym confidence levels fall sub 70% threshold.</span>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-start gap-4">
              <div className="text-emerald-400 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-mono text-xxs font-bold text-zinc-300 uppercase">Stateless mapping rules (OPO-INV-004)</span>
                <span className="block mt-1 text-zinc-500">The intermediate adapter does not persist client transactional details locally, ensuring private transport channels.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

