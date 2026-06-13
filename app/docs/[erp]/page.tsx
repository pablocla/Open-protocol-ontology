import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { 
  ArrowLeft, Calendar, Activity, ShieldAlert, CheckCircle2, 
  MapPin, Clock, Star, Terminal, Layers, HelpCircle, ExternalLink, RefreshCw 
} from 'lucide-react';
import { ERP_GUIDES, getGuideBySlug, ERPGuide } from '../../../lib/docs';
import FeedbackWidget from '../../../components/FeedbackWidget';
import CopyButton from '../../../components/CopyButton';

interface PageProps {
  params: Promise<{ erp: string }>;
}

export async function generateStaticParams() {
  return ERP_GUIDES.map((guide) => ({
    erp: guide.slug,
  }));
}

// Custom simple parser to split markdown content into visual blocks.
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const renderedElements: React.JSX.Element[] = [];
  
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';
  
  let inList = false;
  let listItems: string[] = [];

  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-4 space-y-1.5 text-xs text-slate-300 leading-relaxed font-sans">
          {listItems.map((item, id) => {
            // parse basic bold in bullet
            const text = parseInlineStyles(item);
            return <li key={id}>{text}</li>;
          })}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key: string) => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const rows = tableRows.slice(2); // skip separator line at index 1

      renderedElements.push(
        <div key={`table-wrapper-${key}`} className="my-6 overflow-x-auto border border-slate-800 rounded-lg bg-black/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 font-mono text-zinc-400">
                {headers.map((h, i) => (
                  <th key={i} className="p-3 font-semibold uppercase tracking-wider">{h.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-850 hover:bg-slate-900/10 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3 text-slate-300 antialiased font-sans">
                      {parseInlineStyles(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Basic bold and inline code parsing
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let index = 0;

    // Regex for helper tags: bold (**text**) or code (`text`)
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const tokens = currentText.split(regex);

    return tokens.map((token, id) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={id} className="font-semibold text-white">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return <code key={id} className="bg-slate-900 px-1.5 py-0.5 border border-slate-800 rounded font-mono text-xxs text-emerald-400">{token.slice(1, -1)}</code>;
      }
      return token;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // close block
        const codeText = codeLines.join('\n');
        renderedElements.push(
          <div key={`code-${i}`} className="relative my-6 group rounded border border-slate-800 bg-[#070707] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-1.5 bg-[#0f0f0f] border-b border-slate-850 text-[10px] font-mono text-slate-500">
              <span className="uppercase font-bold tracking-wide text-emerald-500">{codeLang || 'code'}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={codeText} label="Code" />
              </div>
            </div>
            <pre className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-emerald-300">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        // open block
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Handle markdown tables
    if (line.trim().startsWith('|')) {
      flushList(`pre-tbl-${i}`);
      inTable = true;
      const cells = line.split('|').filter((_, id, arr) => id > 0 && id < arr.length - 1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(`tbl-${i}`);
    }

    // List tracking
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      inList = true;
      listItems.push(line.trim().slice(2));
      continue;
    } else if (inList) {
      flushList(`list-${i}`);
    }

    // Horizontal Rules
    if (line.trim() === '---') {
      renderedElements.push(<hr key={`hr-${i}`} className="border-t border-slate-800 my-8" />);
      continue;
    }

    // Headings
    if (line.trim().startsWith('# ')) {
      renderedElements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-serif font-medium text-white tracking-tight mt-8 mb-4">
          {line.slice(2)}
        </h1>
      );
      continue;
    } else if (line.trim().startsWith('## ')) {
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-lg font-serif font-medium text-white tracking-tight mt-8 mb-3 border-b border-slate-900 pb-1.5">
          {line.slice(3)}
        </h2>
      );
      continue;
    }

    // Blank lines
    if (line.trim() === '') {
      continue;
    }

    // Regular Paragraphs
    renderedElements.push(
      <p key={`p-${i}`} className="text-xs text-slate-300 leading-relaxed font-sans mb-4 antialiased">
        {parseInlineStyles(line)}
      </p>
    );
  }

  // Flush any lingering lists or tables
  if (inList) flushList('final');
  if (inTable) flushTable('final');

  return <div>{renderedElements}</div>;
}

export default async function ERPGuidePage({ params }: PageProps) {
  const resolvedParams = await params;
  const guide = getGuideBySlug(resolvedParams.erp);

  if (!guide) {
    notFound();
  }

  // Load raw markdown files inside build environment
  let fileContent = '';
  try {
    const filePath = path.join(process.cwd(), 'public/docs', guide.guideFile);
    fileContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error loading markdown file: ${guide.guideFile}`, err);
    fileContent = `# OPO Adapter Guide: ${guide.name}\n\n*Error: Could not render source file details due to standard filesystem constraints.*`;
  }

  const getDifficultyColor = (diff: 'low' | 'medium' | 'high') => {
    switch (diff) {
      case 'low': return 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/40';
      case 'medium': return 'text-amber-400 bg-amber-950/30 border border-amber-900/40';
      case 'high': return 'text-red-400 bg-red-950/30 border border-red-900/40';
    }
  };

  const getCompatibilityColor = (comp: 'full' | 'partial' | 'community') => {
    switch (comp) {
      case 'full': return 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/50';
      case 'partial': return 'text-sky-400 bg-sky-950/30 border border-sky-900/50';
      case 'community': return 'text-indigo-400 bg-indigo-950/30 border border-indigo-900/50';
    }
  };

  return (
    <main className="flex-1 py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/docs/"
          className="inline-flex items-center gap-1.5 font-mono text-xxs font-bold uppercase text-slate-500 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to ERP directory</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content Area */}
        <div id="opo-doc-rendering" className="lg:col-span-8 bg-slate-900/10 border border-slate-850 rounded-xl p-6 md:p-8 backdrop-blur-sm">
          <MarkdownRenderer content={fileContent} />

          {/* Feedback Form Widget */}
          <div className="mt-12 border-t border-slate-800 pt-8">
            <h4 className="text-sm font-serif text-white mb-2 font-medium">Have something to contribute for {guide.name}?</h4>
            <p className="text-xxs font-mono text-slate-500 mb-6 uppercase tracking-wider">Help complete table offsets and registry maps</p>
            <FeedbackWidget 
              entityName="Invoice" 
              erpContext={guide.slug === 'odoo-17' ? 'Odoo17' : guide.slug === 'totvs-protheus' ? 'Protheus' : guide.slug === 'quickbooks-online' ? 'QuickBooks' : guide.slug === 'sap-s4hana' ? 'SAP_S4' : guide.slug === 'tango-gestion' ? 'Tango' : guide.slug}
              mode="mapping" 
            />
          </div>
        </div>

        {/* Sidebar Specifications Area */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Integration Metadata</span>
            </h3>

            <div className="space-y-4">
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Vendor Profile</span>
                <span className="text-xs font-serif font-medium text-white">{guide.vendor}</span>
              </div>

              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Version Tested</span>
                <span className="text-xs font-mono text-slate-300">{guide.version}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-mono text-slate-500 uppercase">API Standard</span>
                  <span className="inline-flex mt-1 text-[10px] font-mono font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {guide.apiType}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-slate-500 uppercase">Auth Protocol</span>
                  <span className="inline-flex mt-1 text-[10px] font-mono font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {guide.authMethod}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-mono text-slate-500 uppercase">Setup Complexity</span>
                  <span className={`inline-flex mt-1 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${getDifficultyColor(guide.difficulty)}`}>
                    {guide.difficulty}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-slate-500 uppercase">Setup Duration</span>
                  <span className="inline-flex mt-1 items-center gap-1 text-[10px] font-mono text-slate-300">
                    <Clock className="w-3 h-3 text-slate-500" />
                    ~{guide.estimatedSetupMinutes} mins
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Deployment Footprint</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono mt-1 text-slate-300 uppercase tracking-wide">
                  <Activity className="w-3.5 h-3.5 text-zinc-500" />
                  {guide.deploymentModel} Managed
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Target Jurisdictions</span>
                <div className="flex flex-wrap gap-1">
                  {guide.region.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-[10px] font-mono text-slate-400">
                      <MapPin className="w-2.5 h-2.5 text-emerald-500" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase">OPO Compatibility</span>
                <span className={`inline-flex mt-1 text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded ${getCompatibilityColor(guide.opoCompatibility)}`}>
                  {guide.opoCompatibility} Support
                </span>
              </div>
            </div>
          </div>

          {/* Table mappings in sidebar */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-800 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Native Table Registers</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              {guide.nativeMappings.map((m) => (
                <div key={m.entity} className="flex justify-between items-center bg-black/20 p-2 rounded border border-slate-850">
                  <div>
                    <span className="block font-mono text-xxs text-slate-500">{m.entity}</span>
                    <span className="font-mono text-xs text-slate-300 font-semibold">{m.erpTable}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase">Confidence</span>
                    <span className="font-mono text-xxs text-emerald-400 bg-emerald-950/20 border border-emerald-900/35 px-1 py-0.2 rounded font-bold">
                      {m.score.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations and troubleshooting references */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 backdrop-blur-sm font-sans">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>Limits & Offsets</span>
            </h3>
            <ul className="list-disc pl-4 space-y-2 text-xxs text-slate-400 leading-relaxed">
              {guide.knownLimitations.map((limit, identifier) => (
                <li key={identifier}>{limit}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
