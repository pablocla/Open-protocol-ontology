"use client";

import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';
import GraphCanvas from './canvas/GraphCanvas';
import MeshPanel from './MeshPanel';
import IntentEditor from './IntentEditor';
import SettingsModal from './SettingsModal';
import Topbar from './Topbar';
import { useState, useEffect } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import { toast } from 'sonner';
import { runGuidance } from '@/lib/studio/GuidanceEngine';

export default function StudioEditor() {
  const [isMeshPanelOpen, setIsMeshPanelOpen] = useState(false);
  const [isIntentEditorOpen, setIsIntentEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [meshQuery, setMeshQuery] = useState('');
  const { apiKeys, nodes, edges, alerts, addAlert, dismissAlert, currentProvider, llmConfigs } = useStudioStore();

  // Auto-run guidance on significant canvas changes (debounced in real use)
  useEffect(() => {
    if (nodes.length > 2) {
      const newAlerts = runGuidance(nodes as any, edges as any, { hasDiscovered: true });
      newAlerts.forEach(a => {
        // Avoid duplicates
        if (!alerts.some(existing => existing.title === a.title && !existing.dismissed)) {
          addAlert(a);
        }
      });
    }
  }, [nodes.length, edges.length]); // simplified trigger

  // Sync current provider + full LLM configs to global so agentExecutor/semanticRouter/llm.ts can read at runtime (client-side execution for now)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__OPO_CURRENT_PROVIDER = currentProvider;
      (window as any).__OPO_LLM_CONFIGS = llmConfigs;  // full per-provider configs (apiKey, baseUrl, model)
    }
  }, [currentProvider, llmConfigs]);

  // Listen for introspection assistant requests (from discover "Start AI Introspection")
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.query) {
        setMeshQuery(e.detail.query);
        setIsMeshPanelOpen(true);
      }
    };
    window.addEventListener('opo-open-mesh', handler);
    return () => window.removeEventListener('opo-open-mesh', handler);
  }, []);

  const visibleAlerts = alerts.filter(a => !a.dismissed);

  const handleToggleMeshPanel = () => {
    if (!isMeshPanelOpen) {
      const hasOllama =
        currentProvider === 'ollama' &&
        !!(llmConfigs.ollama?.baseUrl || llmConfigs.ollama?.apiKey);
      const hasCloudKey =
        !!apiKeys.gemini ||
        !!apiKeys.openai ||
        !!apiKeys.anthropic ||
        !!apiKeys.grok ||
        !!apiKeys.openrouter;

      if (!hasOllama && !hasCloudKey) {
        toast.error('⚙️ Configurá Ollama (URL local) o una API key en Settings antes de ejecutar el Mesh.', {
          action: {
            label: 'Abrir Settings',
            onClick: () => setIsSettingsOpen(true),
          },
        });
        setIsSettingsOpen(true);
        return;
      }
    }
    setIsMeshPanelOpen(!isMeshPanelOpen);
  };

  const handleExecuteIntent = (query: string) => {
    setMeshQuery(query);
    setIsMeshPanelOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      <Topbar 
        onToggleMeshPanel={handleToggleMeshPanel} 
        onToggleIntentEditor={() => setIsIntentEditorOpen(!isIntentEditorOpen)}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      />

      {/* Guidance & Alerts Bar - steers users toward best practices for big use cases (process automation, ERP audit + semantics, flows, swarms) */}
      {visibleAlerts.length > 0 && (
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 text-xs flex items-center gap-3 overflow-x-auto shrink-0">
          <span className="font-semibold text-violet-400 shrink-0">🧭 OPO Guidance:</span>
          {visibleAlerts.slice(0, 2).map(alert => (
            <div key={alert.id} className={`flex items-center gap-2 px-3 py-1 rounded border shrink-0 ${
              alert.type === 'warning' ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300' :
              alert.type === 'success' ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' :
              alert.type === 'action' ? 'bg-blue-900/30 border-blue-700 text-blue-300' :
              'bg-neutral-800 border-neutral-700 text-neutral-300'
            }`}>
              <span className="font-medium">{alert.title}:</span>
              <span className="text-[11px] max-w-[320px] truncate">{alert.message}</span>
              {alert.actions?.map((act, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    if (typeof act.action === 'function') {
                      act.action();
                    }
                    dismissAlert(alert.id);
                  }}
                  className="ml-1 text-[10px] px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded"
                >
                  {act.label}
                </button>
              ))}
              <button onClick={() => dismissAlert(alert.id)} className="ml-1 opacity-60 hover:opacity-100">×</button>
            </div>
          ))}
          {visibleAlerts.length > 2 && (
            <span className="text-neutral-500 text-[10px]">+{visibleAlerts.length - 2} more</span>
          )}
          <button onClick={() => useStudioStore.getState().clearAlerts()} className="ml-auto text-[10px] text-neutral-400 hover:text-white">Clear all</button>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden relative">
        <SidebarLeft />
        
        <main className="flex-1 relative">
          <GraphCanvas />
          <MeshPanel isOpen={isMeshPanelOpen} onClose={() => setIsMeshPanelOpen(false)} initialQuery={meshQuery} />
          <IntentEditor isOpen={isIntentEditorOpen} onClose={() => setIsIntentEditorOpen(false)} onExecute={handleExecuteIntent} />

          {/* Floating Guidance trigger - always available to steer toward best practices */}
          <button
            onClick={() => {
              const ga = runGuidance(nodes as any, edges as any, { hasDiscovered: true });
              ga.forEach(a => addAlert(a));
              toast.info('OPO Guidance updated for your current model');
            }}
            className="absolute bottom-4 right-4 z-30 bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
            title="Run smart alerts & suggestions for process automation, ERP semantic audits, flow diagrams and swarm orchestration"
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

