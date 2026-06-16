'use client';

import { useCallback, useEffect, useState } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import type { StudioHealthResult } from '@/lib/studio/studioHealth';

const DEFAULT_POLL_MS = 60_000;

export function useStudioHealth(pollMs = DEFAULT_POLL_MS) {
  const { erpWorkspace, currentProvider, llmConfigs, resolveQueryMode } = useStudioStore();
  const [health, setHealth] = useState<StudioHealthResult | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const dataMode = resolveQueryMode();
    const ollamaCfg = llmConfigs.ollama || llmConfigs['open-code'];
    try {
      const res = await fetch('/api/studio/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataMode,
          connectionString: erpWorkspace.connectionString,
          filial: erpWorkspace.filial,
          erpId: erpWorkspace.erpId,
          dialect: erpWorkspace.dialect,
          currentProvider,
          ollamaBaseUrl: ollamaCfg?.baseUrl,
        }),
      });
      if (res.ok) {
        setHealth((await res.json()) as StudioHealthResult);
      }
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, [
    currentProvider,
    erpWorkspace.connectionString,
    erpWorkspace.dialect,
    erpWorkspace.erpId,
    erpWorkspace.filial,
    llmConfigs,
    resolveQueryMode,
  ]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  return { health, loading, refresh };
}