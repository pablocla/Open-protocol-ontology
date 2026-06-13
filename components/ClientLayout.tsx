'use client';

/**
 * Open Protocol ONTOLOGY (OPO) - Client Layout Component
 * Licensed under the Apache License, version 2.0
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, Check, Copy, ExternalLink, Github, Terminal } from 'lucide-react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'es'>('en');

  React.useEffect(() => {
    const stored = localStorage.getItem('opo-lang');
    if (stored === 'es' || stored === 'en') {
      setLang(stored);
    }
  }, []);

  const toggleLang = (newLang: 'en' | 'es') => {
    setLang(newLang);
    localStorage.setItem('opo-lang', newLang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('opo-lang-change', { detail: newLang }));
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText('https://openprotocol.dev/ontology/opo-ai-primer.md');
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const navItems = [
    { labelEn: 'Home', labelEs: 'Inicio', href: '/', num: '01' },
    { labelEn: 'Entity Browser', labelEs: 'Explorador', href: '/entities/', num: '02' },
    { labelEn: 'ERP Docs', labelEs: 'Docs de ERP', href: '/docs/', num: '03' },
    { labelEn: 'Protocol Spec', labelEs: 'Espec de Protocolo', href: '/spec/', num: '04' },
    { labelEn: 'Alias Registry', labelEs: 'Registro de Alias', href: '/registry/', num: '05' },
    { labelEn: 'Adopt OPO', labelEs: 'Adoptar OPO', href: '/adopt/', num: '06' },
    { labelEn: 'Web Validator', labelEs: 'Validador Web', href: '/validator/', num: '07' },
  ];

  // Helper to determine active state
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Sidebar Top Banner */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-black font-black font-mono shadow-md group-hover:bg-emerald-400 transition-colors">
            O
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight text-lg leading-tight">OPO v0.1.0</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Open Protocol</p>
          </div>
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <div className="px-6 mb-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          {lang === 'en' ? 'Main Menu' : 'Menú Principal'}
        </div>
        <ul className="space-y-1.5 px-3">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const label = lang === 'en' ? item.labelEn : item.labelEs;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-xs font-mono font-medium rounded-md transition-all ${
                    active
                      ? 'text-white bg-slate-800/60 border border-slate-700/50 shadow-sm shadow-black/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <span className={`mr-3 text-[10px] uppercase font-mono ${active ? 'text-emerald-400 font-bold' : 'opacity-40 italic'}`}>
                    {item.num}.
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

         {/* Resources Section */}
        <div className="px-6 mt-10 mb-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          {lang === 'en' ? 'Resources' : 'Recursos'}
        </div>
        <ul className="space-y-1 px-3 text-xs">
          <li>
            <Link
              href="/opo-context.jsonld"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white rounded hover:bg-slate-900/40 transition-colors"
            >
              <span>{lang === 'en' ? 'JSON-LD Context' : 'Contexto JSON-LD'}</span>
              <ArrowUpRight className="h-3 w-3 text-slate-600" />
            </Link>
          </li>
          <li>
            <Link
              href="/entities/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white rounded hover:bg-slate-900/40 font-mono text-[11px] transition-colors"
            >
              <span>/public/schemas/</span>
              <Terminal className="h-3 w-3 text-slate-600" />
            </Link>
          </li>
          <li>
            <Link
              href="/opo-ai-primer.md"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white rounded hover:bg-slate-900/40 transition-colors"
            >
              <span>{lang === 'en' ? 'AI System Primer' : 'Guía de Inicio de IA'}</span>
              <ArrowUpRight className="h-3 w-3 text-slate-600" />
            </Link>
          </li>
        </ul>
      </nav>

      {/* Sidebar Footer block */}
      <div className="p-6 mt-auto border-t border-slate-800">
        <div className="text-[10px] text-slate-500 font-mono leading-relaxed">
          LICENSE: Apache 2.0<br />
          © 2025 OPO Contributors
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-slate-300 font-sans overflow-hidden selection:bg-emerald-500/30 select-none">
      
      {/* Sidebar - Desktop */}
      <aside className="w-64 border-r border-slate-800 hidden md:flex flex-col shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop mask */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer card */}
          <aside className="relative flex flex-col w-64 max-w-xs bg-[#0a0a0a] border-r border-slate-800 h-full animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Top Header Action Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 bg-[#0a0a0a]/90 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-md border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 flex md:hidden transition-all"
            >
              <Menu className="h-4 w-4" />
            </button>
            
            <span className="text-[11px] font-mono text-slate-500 truncate hidden sm:inline max-w-xs md:max-w-none">
              IRI: https://openprotocol.dev/ontology/
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector Flags */}
            <div className="flex items-center gap-1 border border-slate-800 rounded-lg p-0.5 bg-slate-950/40 mr-1 sm:mr-2">
              <button
                onClick={() => toggleLang('en')}
                className={`px-1.5 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all ${
                  lang === 'en'
                    ? 'bg-slate-800/80 text-white font-bold border border-slate-700/50 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="English Language"
              >
                <span>🇺🇸</span>
                <span className="hidden xs:inline">EN</span>
              </button>
              <button
                onClick={() => toggleLang('es')}
                className={`px-1.5 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all ${
                  lang === 'es'
                    ? 'bg-slate-800/80 text-white font-bold border border-slate-700/50 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Idioma Español"
              >
                <span>🇪🇸</span>
                <span className="hidden xs:inline">ES</span>
              </button>
            </div>

            <a
              href="https://github.com/openprotocol/ontology"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-400 hover:text-white border border-slate-800 rounded hover:border-slate-700 transition-colors bg-slate-950/40"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">GitHub</span>
            </a>
            
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-black rounded transition-all active:scale-95 shadow-sm"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{lang === 'en' ? 'Copied!' : '¡Copiado!'}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{lang === 'en' ? 'Copy AI Prompt' : 'Copiar Prompt IA'}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Content Area - Scrollable viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] relative select-text">
          {children}
        </main>

        {/* Status Bar Footer */}
        <footer className="h-10 border-t border-slate-800 bg-[#070707] flex items-center justify-between px-4 sm:px-8 text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider shrink-0 z-20">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              STABLE
            </span>
            <span className="hidden xs:inline font-mono text-slate-600">
              OPO-INV-001 THROUGH OPO-INV-006 ACTIVE
            </span>
          </div>
          <div className="italic text-slate-600 tracking-normal lower-case first-letter:uppercase">
            consumed by machines, built by humans
          </div>
        </footer>
      </div>
    </div>
  );
}
