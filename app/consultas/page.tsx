'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, LayoutGrid, Loader2 } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';
import MeshPanel from '@/components/studio/MeshPanel';
import SettingsModal from '@/components/studio/SettingsModal';
import Onboarding from '@/components/studio/Onboarding';

export default function ConsultasPage() {
  const {
    project,
    loadProjectData,
    setErpWorkspace,
    setCurrentProvider,
    setLLMConfig,
    setApiKey
  } = useStudioStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function loadWorkspace() {
      if (project) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/studio/load');
        const data = await res.json();
        if (data.exists && data.project) {
          // Hydrate the store
          loadProjectData(data.project, data.nodes || [], data.edges || []);
          if (data.erpWorkspace) {
            setErpWorkspace(data.erpWorkspace);
          }
          if (data.ai) {
            if (data.ai.currentProvider) {
              setCurrentProvider(data.ai.currentProvider);
            }
            if (data.ai.currentProvider === 'ollama') {
              setLLMConfig('ollama', {
                baseUrl: data.ai.ollamaBaseUrl,
                model: data.ai.ollamaModel
              });
            } else if (data.ai.cloudApiKey) {
              setApiKey(data.ai.currentProvider, data.ai.cloudApiKey);
            }
          }
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error('Failed to auto-load workspace:', err);
        setShowOnboarding(true);
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspace();
  }, [mounted, project]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm font-mono text-neutral-400">Cargando espacio de trabajo...</p>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <Onboarding simplified />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <header className="h-12 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between px-4 shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded flex items-center justify-center font-bold text-white text-sm">
            O
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Consultas OPO</h1>
            <p className="text-[10px] text-neutral-500">Preguntá a tu ERP en lenguaje natural</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white px-2.5 py-1 rounded border border-neutral-800 hover:border-neutral-600 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Studio completo
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 text-[11px] text-neutral-300 hover:text-white px-2.5 py-1 rounded border border-neutral-800 hover:border-neutral-600 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Ajustes
          </button>
        </div>
      </header>

      <MeshPanel
        isOpen
        variant="fullscreen"
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}