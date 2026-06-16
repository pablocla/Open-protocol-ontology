"use client";

import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';
import GraphCanvas from './canvas/GraphCanvas';
import MeshPanel from './MeshPanel';
import IntentEditor from './IntentEditor';
import SettingsModal from './SettingsModal';
import Topbar from './Topbar';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { toast } from 'sonner';
import { runGuidance } from '@/lib/studio/GuidanceEngine';
import { checkOllamaViaApi } from '@/lib/studio/ollamaHealth';
import type { StudioDeepLinkOpen } from '@/lib/studio/studioDeepLink';
import { Users, X } from 'lucide-react';

interface StudioEditorProps {
  initialOpen?: StudioDeepLinkOpen | null;
  initialDeployTemplate?: string | null;
  showGuideBanner?: boolean;
}

export default function StudioEditor({
  initialOpen = null,
  initialDeployTemplate = null,
  showGuideBanner = false,
}: StudioEditorProps) {
  const [isMeshPanelOpen, setIsMeshPanelOpen] = useState(false);
  const [isIntentEditorOpen, setIsIntentEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [meshQuery, setMeshQuery] = useState('');
  const [showFirstEmployeeBanner, setShowFirstEmployeeBanner] = useState(false);
  const [showFlowGuide, setShowFlowGuide] = useState(showGuideBanner);
  const [showEmptyCanvasGuide, setShowEmptyCanvasGuide] = useState(false);
  const deepLinkApplied = useRef(false);

  const {
    apiKeys,
    nodes,
    edges,
    alerts,
    addAlert,
    dismissAlert,
    currentProvider,
    llmConfigs,
    deployAgentTemplate,
  } = useStudioStore();

  const agentCount = nodes.filter((n) => n.type === 'agentNode').length;

  useEffect(() => {
    if (nodes.length > 2) {
      const newAlerts = runGuidance(nodes as never[], edges as never[], { hasDiscovered: true });
      newAlerts.forEach((a) => {
        if (!alerts.some((existing) => existing.title === a.title && !existing.dismissed)) {
          addAlert(a);
        }
      });
    }
  }, [nodes.length, edges.length]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { __OPO_CURRENT_PROVIDER?: string; __OPO_LLM_CONFIGS?: unknown }).__OPO_CURRENT_PROVIDER =
        currentProvider;
      (window as Window & { __OPO_LLM_CONFIGS?: unknown }).__OPO_LLM_CONFIGS = llmConfigs;
    }
  }, [currentProvider, llmConfigs]);

  useEffect(() => {
    setShowFirstEmployeeBanner(agentCount === 0);
    setShowEmptyCanvasGuide(nodes.length === 0);
  }, [agentCount, nodes.length]);

  useEffect(() => {
    const { setLLMConfig, llmConfigs } = useStudioStore.getState();
    if (!llmConfigs.ollama?.baseUrl) {
      setLLMConfig('ollama', {
        baseUrl: 'http://localhost:11434',
        model: llmConfigs.ollama?.model || 'llama3.1',
      });
    }
    if (sessionStorage.getItem('opo-show-guide') === '1') {
      setShowFlowGuide(true);
      sessionStorage.removeItem('opo-show-guide');
    }
  }, []);

  const hasLlmConfigured = useCallback(() => {
    const hasOllama =
      currentProvider === 'ollama' &&
      !!(llmConfigs.ollama?.baseUrl || llmConfigs.ollama?.apiKey);
    const hasCloudKey =
      !!apiKeys.gemini ||
      !!apiKeys.openai ||
      !!apiKeys.anthropic ||
      !!apiKeys.grok ||
      !!apiKeys.openrouter ||
      !!llmConfigs.gemini?.apiKey ||
      !!llmConfigs.openai?.apiKey ||
      !!llmConfigs.anthropic?.apiKey;
    return { hasOllama, hasCloudKey, ready: hasOllama || hasCloudKey };
  }, [apiKeys, currentProvider, llmConfigs]);

  const openMeshPanel = useCallback(
    async (opts?: { query?: string; skipCredentialsGate?: boolean }) => {
      if (!opts?.skipCredentialsGate) {
        const { hasOllama, hasCloudKey, ready } = hasLlmConfigured();
        if (!ready) {
          toast.error('Configurá Ollama (URL local) o una API key en Settings antes de ejecutar el Mesh.', {
            action: {
              label: 'Abrir Settings',
              onClick: () => setIsSettingsOpen(true),
            },
          });
          setIsSettingsOpen(true);
          return false;
        }

        if (hasOllama || currentProvider === 'ollama') {
          const base = llmConfigs.ollama?.baseUrl || 'http://localhost:11434';
          const health = await checkOllamaViaApi(base);
          if (!health.ok) {
            toast.error(
              `Ollama no responde en ${base}. Ejecutá "ollama serve" e instalá un modelo (ej. ollama pull llama3.1).`,
              {
                action: {
                  label: 'Settings',
                  onClick: () => setIsSettingsOpen(true),
                },
              }
            );
            setIsSettingsOpen(true);
            return false;
          }
        }
      }

      if (opts?.query) setMeshQuery(opts.query);
      setIsMeshPanelOpen(true);
      return true;
    },
    [currentProvider, hasLlmConfigured, llmConfigs.ollama?.baseUrl]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      if (detail?.query) {
        setMeshQuery(detail.query);
        void openMeshPanel({ query: detail.query });
      }
    };
    window.addEventListener('opo-open-mesh', handler);
    return () => window.removeEventListener('opo-open-mesh', handler);
  }, [openMeshPanel]);

  useEffect(() => {
    if (deepLinkApplied.current) return;
    deepLinkApplied.current = true;

    if (initialDeployTemplate) {
      const title = deployAgentTemplate(initialDeployTemplate);
      if (title) {
        toast.success(`"${title}" agregado a tu equipo.`);
        setShowFirstEmployeeBanner(false);
      }
    }
    if (initialOpen === 'settings') {
      setIsSettingsOpen(true);
    }
    if (initialOpen === 'mesh') {
      void openMeshPanel();
    }
  }, [initialDeployTemplate, initialOpen, deployAgentTemplate, openMeshPanel]);

  const visibleAlerts = alerts.filter((a) => !a.dismissed);

  const handleToggleMeshPanel = () => {
    if (isMeshPanelOpen) {
      setIsMeshPanelOpen(false);
      return;
    }
    void openMeshPanel();
  };

  const handleExecuteIntent = (query: string) => {
    setMeshQuery(query);
    void openMeshPanel({ query });
  };

  const scrollToEmployees = () => {
    document.getElementById('empleados-disponibles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      <Topbar
        onToggleMeshPanel={handleToggleMeshPanel}
        onToggleIntentEditor={() => setIsIntentEditorOpen(!isIntentEditorOpen)}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      />

      {showFlowGuide && (
        <div className="bg-violet-950/40 border-b border-violet-800/50 px-4 py-2 text-xs flex items-center justify-between gap-3 shrink-0">
          <span className="text-violet-200">
            <strong>Flujo:</strong> 1) Contratar empleado (panel izquierdo) → 2) Ejecutar Equipo (Mesh) o Mosaico en un nodo →
            3) Ollama local o API en Settings
          </span>
          <button
            type="button"
            onClick={() => setShowFlowGuide(false)}
            className="text-violet-400 hover:text-white shrink-0"
            aria-label="Cerrar guía"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showEmptyCanvasGuide && (
        <div className="bg-neutral-900 border-b border-neutral-700 px-4 py-2.5 text-xs flex items-center justify-between gap-3 shrink-0">
          <span className="text-neutral-300">
            Lienzo vacío: arrastrá áreas desde la biblioteca técnica o{' '}
            <strong>contratá un empleado virtual</strong> en el panel izquierdo.
          </span>
          <button
            type="button"
            onClick={scrollToEmployees}
            className="shrink-0 px-3 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            Empezar acá
          </button>
        </div>
      )}

      {showFirstEmployeeBanner && !showEmptyCanvasGuide && (
        <div className="bg-indigo-950/50 border-b border-indigo-800/60 px-4 py-2.5 text-xs flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-indigo-200">
            <Users className="w-4 h-4 text-violet-400 shrink-0" />
            <span>
              Tu mapa está listo. Podés <strong>Ejecutar Equipo</strong> o ir a <strong>Consultas</strong> ya mismo.
              Contratar un empleado en el panel izquierdo es opcional (personaliza el equipo en el lienzo).
            </span>
          </div>
          <button
            type="button"
            onClick={scrollToEmployees}
            className="shrink-0 px-3 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            Ver empleados
          </button>
        </div>
      )}

      {visibleAlerts.length > 0 && (
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 text-xs flex items-center gap-3 overflow-x-auto shrink-0">
          <span className="font-semibold text-violet-400 shrink-0">🧭 OPO Guidance:</span>
          {visibleAlerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-2 px-3 py-1 rounded border shrink-0 ${
                alert.type === 'warning'
                  ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300'
                  : alert.type === 'success'
                    ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
                    : alert.type === 'action'
                      ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300'
              }`}
            >
              <span className="font-medium">{alert.title}:</span>
              <span className="text-[11px] max-w-[320px] truncate">{alert.message}</span>
              {alert.actions?.map((act, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (typeof act.action === 'function') act.action();
                    dismissAlert(alert.id);
                  }}
                  className="ml-1 text-[10px] px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded"
                >
                  {act.label}
                </button>
              ))}
              <button type="button" onClick={() => dismissAlert(alert.id)} className="ml-1 opacity-60 hover:opacity-100">
                ×
              </button>
            </div>
          ))}
          {visibleAlerts.length > 2 && (
            <span className="text-neutral-500 text-[10px]">+{visibleAlerts.length - 2} more</span>
          )}
          <button
            type="button"
            onClick={() => useStudioStore.getState().clearAlerts()}
            className="ml-auto text-[10px] text-neutral-400 hover:text-white"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <SidebarLeft />

        <main className="flex-1 relative">
          <GraphCanvas />
          <MeshPanel
            isOpen={isMeshPanelOpen}
            onClose={() => setIsMeshPanelOpen(false)}
            initialQuery={meshQuery}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          <IntentEditor
            isOpen={isIntentEditorOpen}
            onClose={() => setIsIntentEditorOpen(false)}
            onExecute={handleExecuteIntent}
          />

          <button
            type="button"
            onClick={() => {
              const ga = runGuidance(nodes as never[], edges as never[], { hasDiscovered: true });
              ga.forEach((a) => addAlert(a));
              toast.info('OPO Guidance actualizado para tu modelo actual');
            }}
            className="absolute bottom-4 right-4 z-30 bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
            title="Sugerencias para automatización, auditoría ERP y swarms"
          >
            🧭 Guidance
          </button>
        </main>

        <SidebarRight />
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}