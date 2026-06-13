'use client';

/**
 * Open Protocol ONTOLOGY (OPO) - Collaborative Feedback Widget Component
 * Licensed under the Apache License, version 2.0
 * Copyright 2025 The OPO Contributors
 */

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Github, Send, Sparkles, Globe } from 'lucide-react';
import { getAllEntities } from '../lib/entities';
import { submitContribution, OPOContribution } from '../lib/n8n';

interface FeedbackWidgetProps {
  entityName?: string;
  aliasContext?: string;
  erpContext?: string;
  mode: 'alias' | 'mapping' | 'rfc' | 'correction';
}

const erpList = [
  { value: 'SAP_S4', label: 'SAP S/4HANA' },
  { value: 'Odoo17', label: 'Odoo 17 Community/Enterprise' },
  { value: 'Protheus', label: 'TOTVS Protheus' },
  { value: 'Tango', label: 'Tango Gestión' },
  { value: 'Dynamics365', label: 'Microsoft Dynamics 365' },
  { value: 'NetSuite', label: 'Oracle NetSuite' },
  { value: 'QuickBooks', label: 'QuickBooks Online' },
  { value: 'Salesforce', label: 'Salesforce' },
  { value: 'InforCloud', label: 'Infor CloudSuite' },
  { value: 'Workday', label: 'Workday' },
  { value: 'SageX3', label: 'Sage X3 / Sage 300' },
  { value: 'Other', label: 'Other ERP / System' }
];

const t = {
  en: {
    title: "In-App Feedback Engine",
    subtitle: "Help standardize global ERP schemas. Your submission directly feeds the registry.",
    contribType: "Contribution Type",
    entity: "Canonical OPO Entity",
    erpSystem: "ERP System Source",
    alias: "Proposed Alias or Native Table Name",
    aliasPlaceholder: "e.g., BKPF, res.partner, SF2...",
    confidence: "Confidence Level",
    notes: "Context & Technical Evidence",
    notesPlaceholder: "Explain why this mapping or alias is accurate. Include table, field, or API docs reference if possible.",
    contact: "Contact (Email or GitHub Handle, Optional)",
    contactPlaceholder: "e.g., github-user or mail@example.com",
    submit: "Submit Contribution",
    submitting: "Submitting to n8n Gateway...",
    success: "Contribution received! Our n8n workflow will open a GitHub issue within minutes.",
    error: "n8n gateway webhook not configured or unavailable.",
    useGithubFallback: "You can submit this contribution directly via pre-filled GitHub Issue:",
    githubFallback: "Create Pre-filled Issue on GitHub",
    confidenceHigh: "0.9+ Direct, certified native schema mapping",
    confidenceMed: "0.7 - 0.89 Highly probable / common alias matching",
    confidenceLow: "< 0.7 Ambiguous or loosely related context",
    types: {
      alias: "New Canonical Alias",
      mapping: "ERP Schema Mapping Detail",
      rfc: "Request for Comments (RFC) New Entity",
      correction: "Correction on Existing Schema"
    }
  },
  es: {
    title: "Motor de Colaboración OPO",
    subtitle: "Ayudá a estandarizar los esquemas ERP globales. Tus aportes alimentan el registro directo.",
    contribType: "Tipo de Contribución",
    entity: "Entidad OPO Canónica",
    erpSystem: "Sistema ERP Origen",
    alias: "Alias Propuesto o Nombre de Tabla Nativa",
    aliasPlaceholder: "ej., BKPF, res.partner, SF2...",
    confidence: "Nivel de Confianza",
    notes: "Contexto y Evidencia Técnica",
    notesPlaceholder: "Explicá por qué este mapeo o alias es correcto. Incluí referencias a tablas, campos o APIs.",
    contact: "Contacto (Email o GitHub Handle, Opcional)",
    contactPlaceholder: "ej., usuario-github o mail@ejemplo.com",
    submit: "Enviar Contribución",
    submitting: "Enviando a n8n Gateway...",
    success: "¡Contribución recibida! Nuestro workflow de n8n abrirá un Issue en GitHub en minutos.",
    error: "El gateway de n8n no está configurado o no se encuentra disponible.",
    useGithubFallback: "Podés enviar esta contribución directamente mediante un Issue pre-completado de GitHub:",
    githubFallback: "Crear Issue Pre-completado en GitHub",
    confidenceHigh: "0.9+ Mapeo de esquema certificado o nativo",
    confidenceMed: "0.7 - 0.89 Match de alias común y altamente probable",
    confidenceLow: "< 0.7 Contexto ambiguo o relación indirecta",
    types: {
      alias: "Alias de Entidad para el Registro",
      mapping: "Detalle de Mapeo ERP",
      rfc: "Propuesta de Nueva Entidad (RFC)",
      correction: "Corrección de Esquema Existente"
    }
  }
};

export default function FeedbackWidget({
  entityName = 'Party',
  aliasContext = '',
  erpContext = 'SAP_S4',
  mode
}: FeedbackWidgetProps) {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [type, setType] = useState<'alias' | 'mapping' | 'rfc' | 'correction'>(mode);
  const [entity, setEntity] = useState(`opo:${entityName}`);
  const [erp, setErp] = useState(erpContext);
  const [alias, setAlias] = useState(aliasContext);
  const [confidence, setConfidence] = useState(0.9);
  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const entities = getAllEntities();
  const currentText = t[lang];

  const getConfidenceText = (val: number) => {
    if (val >= 0.9) return currentText.confidenceHigh;
    if (val >= 0.7) return currentText.confidenceMed;
    return currentText.confidenceLow;
  };

  const getGitHubUrl = () => {
    const titleText = `OPO Community Contribution: [${type.toUpperCase()}] for ${entity}`;
    const bodyText = `## OPO Community Contribution Submission\n\n` +
      `- **Contribution Type:** ${type.toUpperCase()}\n` +
      `- **Canonical OPO Entity:** ${entity}\n` +
      `- **ERP System Context:** ${erp}\n` +
      `- **Proposed Alias / Table Target:** ${alias || 'N/A'}\n` +
      `- **Assessed Level of Confidence:** ${confidence}\n` +
      `- **Optional Submitter Contact:** ${contact || 'Anonymous'}\n` +
      `- **Telemetry Timestamp:** ${new Date().toISOString()}\n\n` +
      `### Submitter Evidence & Practical Context\n\n` +
      `${notes || 'None provided.'}\n\n` +
      `*Submitted via OPO Live Core Interface fallback.*`;

    return `https://github.com/pablocla/Open-protocol-ontology/issues/new?title=${encodeURIComponent(titleText)}&body=${encodeURIComponent(bodyText)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    const payload: OPOContribution = {
      type,
      entity,
      erp,
      alias,
      confidence,
      notes,
      contact: contact.trim() || null,
      source_url: typeof window !== 'undefined' ? window.location.href : 'https://openprotocol.dev',
      timestamp: new Date().toISOString()
    };

    if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
      // Degrades gracefully to fallback Github Issue
      setStatus('error');
      setErrorMessage(currentText.error);
      return;
    }

    const response = await submitContribution(payload, webhookUrl);
    if (response.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(response.message || currentText.error);
    }
  };

  return (
    <div id="opo-feedback-widget" className="my-10 bg-slate-900/40 border border-slate-800 rounded-lg p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 rounded transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'ESP' : 'ENG'}</span>
        </button>
      </div>

      <div className="mb-6 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-serif font-medium tracking-wide uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 mb-3">
          <Sparkles className="w-3 h-3" />
          <span>Community FEEDBACK Gateway</span>
        </div>
        <h3 className="text-lg font-serif font-medium text-white tracking-tight">{currentText.title}</h3>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">{currentText.subtitle}</p>
      </div>

      {status === 'success' ? (
        <div className="bg-emerald-950/20 border border-emerald-900/60 rounded p-6 flex items-start gap-4 animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-white">Submission Successful</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">{currentText.success}</p>
            <div className="mt-4">
              <a
                href="https://github.com/pablocla/Open-protocol-ontology/issues"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xxs font-bold uppercase bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-all"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Visit OPO GitHub Issues</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                {currentText.contribType}
              </label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full bg-[#121212] border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="alias">{currentText.types.alias}</option>
                <option value="mapping">{currentText.types.mapping}</option>
                <option value="rfc">{currentText.types.rfc}</option>
                <option value="correction">{currentText.types.correction}</option>
              </select>
            </div>

            {/* Entity selection */}
            <div>
              <label className="block text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                {currentText.entity}
              </label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="w-full bg-[#121212] border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                {entities.map((ent) => (
                  <option key={ent.name} value={`opo:${ent.name}`}>
                    opo:{ent.name} ({ent.tier === 1 ? 'Tier 1' : ent.tier === 2 ? 'Tier 2' : 'Tier 3'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ERP source */}
            <div>
              <label className="block text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                {currentText.erpSystem}
              </label>
              <select
                value={erp}
                onChange={(e) => setErp(e.target.value)}
                className="w-full bg-[#121212] border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                {erpList.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Proposed Alias */}
            <div>
              <label className="block text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                {currentText.alias}
              </label>
              <input
                type="text"
                required
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={currentText.aliasPlaceholder}
                className="w-full bg-[#121212] border border-slate-800 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Slider for confidence */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400">
                {currentText.confidence}
              </label>
              <span className="text-xs font-mono font-semibold text-emerald-400">{confidence.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-850 h-2 rounded cursor-pointer mb-2"
            />
            <div className="text-[10px] font-mono text-zinc-500">
              {getConfidenceText(confidence)}
            </div>
          </div>

          {/* Notes textarea */}
          <div>
            <label className="block text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              {currentText.notes}
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={currentText.notesPlaceholder}
              className="w-full bg-[#121212] border border-slate-800 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Contact field */}
          <div>
            <label className="block text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              {currentText.contact}
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={currentText.contactPlaceholder}
              className="w-full bg-[#121212] border border-slate-800 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Submitting buttons and status message */}
          {status === 'error' && (
            <div className="bg-red-950/20 border border-red-900/60 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in select-all">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-white">{errorMessage}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{currentText.useGithubFallback}</p>
                </div>
              </div>
              <a
                href={getGitHubUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase bg-red-950/60 hover:bg-slate-700 text-red-200 px-4 py-2 border border-red-900/60 hover:border-slate-600 rounded transition-all text-center justify-center shrink-0"
              >
                <Github className="w-4 h-4" />
                <span>{currentText.githubFallback}</span>
              </a>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold uppercase px-5 py-2.5 rounded shadow shadow-emerald-500/20 hover:shadow-emerald-400/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>{currentText.submitting}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{currentText.submit}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
