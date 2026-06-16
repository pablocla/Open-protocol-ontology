'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { useStudioHealth } from '@/lib/studio/useStudioHealth';
import type { HealthStatus } from '@/lib/studio/studioHealth';

const DOT: Record<HealthStatus, string> = {
  ok: 'bg-emerald-400',
  warn: 'bg-amber-400',
  error: 'bg-red-400',
  skip: 'bg-neutral-500',
};

function StatusDot({ status }: { status: HealthStatus }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${DOT[status]} ${status === 'ok' ? 'animate-pulse' : ''}`}
    />
  );
}

interface StatusSemaphoreProps {
  compact?: boolean;
  onOpenSettings?: () => void;
}

export default function StatusSemaphore({ compact, onOpenSettings }: StatusSemaphoreProps) {
  const { health, loading, refresh } = useStudioHealth();

  if (loading && !health) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  if (!health) return null;

  const erpTitle = health.erp.error ? `${health.erp.label} — ${health.erp.error}` : health.erp.label;
  const aiTitle = health.ai.error ? `${health.ai.label} — ${health.ai.error}` : health.ai.label;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => (health.canQuery ? void refresh() : onOpenSettings?.())}
        className="flex items-center gap-2 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
        title={`${erpTitle} · ${aiTitle}`}
      >
        <StatusDot status={health.erp.status} />
        <StatusDot status={health.ai.status} />
        <span className="hidden md:inline">
          {health.dataMode === 'live' ? 'En vivo' : 'Demo'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div
        className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900/80 text-neutral-300"
        title={erpTitle}
      >
        <StatusDot status={health.erp.status} />
        <span className="max-w-[140px] truncate">{health.erp.label}</span>
        {health.erp.latencyMs != null && (
          <span className="text-neutral-500 font-mono">{health.erp.latencyMs}ms</span>
        )}
      </div>
      <div
        className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900/80 text-neutral-300"
        title={aiTitle}
      >
        <StatusDot status={health.ai.status} />
        <span className="max-w-[120px] truncate">{health.ai.label}</span>
      </div>
      <button
        type="button"
        onClick={() => void refresh()}
        className="p-1 text-neutral-500 hover:text-neutral-300 rounded"
        title="Reverificar conexión"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
}