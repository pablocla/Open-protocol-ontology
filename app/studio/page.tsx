"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStudioStore } from '@/store/useStudioStore';
import StudioEditor from '@/components/studio/StudioEditor';
import Onboarding from '@/components/studio/Onboarding';
import { ReactFlowProvider } from '@xyflow/react';
import { parseStudioDeepLink, PENDING_DEPLOY_KEY } from '@/lib/studio/studioDeepLink';

function StudioPageContent() {
  const {
    project,
    loadProjectData,
    setErpWorkspace,
    setCurrentProvider,
    setLLMConfig,
    setApiKey
  } = useStudioStore();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const deepLink = parseStudioDeepLink(searchParams);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (deepLink.deploy) {
      sessionStorage.setItem(PENDING_DEPLOY_KEY, deepLink.deploy);
    }
  }, [deepLink.deploy]);

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
        }
      } catch (err) {
        console.error('Failed to auto-load workspace in studio:', err);
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
        <span className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
        <p className="text-sm font-mono text-neutral-400 font-semibold text-center">Cargando espacio de trabajo...</p>
      </div>
    );
  }

  if (project) {
    return (
      <ReactFlowProvider>
        <StudioEditor
          initialOpen={deepLink.open}
          initialDeployTemplate={deepLink.deploy}
          showGuideBanner={deepLink.guide}
        />
      </ReactFlowProvider>
    );
  }

  return <Onboarding pendingDeployTemplate={deepLink.deploy} showGuide={deepLink.guide} />;}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioPageContent />
    </Suspense>
  );
}