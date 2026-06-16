'use client';

import { useMemo, useState } from 'react';
import { MessageSquareQuote, Play, ChevronDown, ChevronUp } from 'lucide-react';
import {
  RecurringQuery,
  buildMeshPromptFromQuery,
  getRecurringQueriesForContext,
} from '@/lib/studio/recurringQueries';
import { useStudioStore } from '@/store/useStudioStore';
import { compileOntology } from '@/lib/mesh/ontologyCompiler';

interface RecurringQueriesChipsProps {
  onSelectMeshPrompt: (prompt: string) => void;
  onDirectReport?: (query: RecurringQuery, params: Record<string, string>) => void;
  disabled?: boolean;
}

export default function RecurringQueriesChips({
  onSelectMeshPrompt,
  onDirectReport,
  disabled,
}: RecurringQueriesChipsProps) {
  const { nodes, edges, project } = useStudioStore();
  const [expanded, setExpanded] = useState(true);
  const [activeQuery, setActiveQuery] = useState<RecurringQuery | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const ontology = useMemo(
    () => compileOntology(nodes as never[], edges as never[], project?.name),
    [nodes, edges, project?.name]
  );

  const queries = useMemo(
    () => getRecurringQueriesForContext(ontology, project?.name),
    [ontology, project?.name]
  );

  if (!queries.length) return null;

  const openParams = (q: RecurringQuery) => {
    const defaults: Record<string, string> = {};
    for (const p of q.params) defaults[p.key] = p.defaultValue;
    setParamValues(defaults);
    setActiveQuery(q);
  };

  const handleChat = () => {
    if (!activeQuery) return;
    onSelectMeshPrompt(buildMeshPromptFromQuery(activeQuery, paramValues));
    setActiveQuery(null);
  };

  const handleDirect = () => {
    if (!activeQuery || !onDirectReport) return;
    onDirectReport(activeQuery, paramValues);
    setActiveQuery(null);
  };

  const byCategory = queries.reduce<Record<string, RecurringQuery[]>>((acc, q) => {
    (acc[q.category] ||= []).push(q);
    return acc;
  }, {});

  return (
    <div className="border-b border-neutral-800 bg-neutral-900/40 px-3 py-2 shrink-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-400 font-semibold w-full"
      >
        <MessageSquareQuote className="w-3.5 h-3.5" />
        Consultas recurrentes
        {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 max-h-28 overflow-y-auto">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <span className="text-[9px] text-neutral-500 uppercase">{cat}</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {items.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => (q.params.length ? openParams(q) : onSelectMeshPrompt(buildMeshPromptFromQuery(q)))}
                    title={q.description}
                    className="text-[10px] px-2 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 disabled:opacity-40 transition-colors"
                  >
                    {q.humanLabel}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeQuery && (
        <div className="mt-2 p-2 rounded border border-neutral-700 bg-neutral-950 text-xs space-y-2">
          <div className="font-medium text-neutral-200">{activeQuery.humanLabel}</div>
          <p className="text-[10px] text-neutral-500">{activeQuery.description}</p>
          {activeQuery.params.map((p) => (
            <label key={p.key} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-neutral-400">{p.label}</span>
              <input
                value={paramValues[p.key] ?? p.defaultValue}
                onChange={(e) => setParamValues((prev) => ({ ...prev, [p.key]: e.target.value }))}
                placeholder={p.placeholder}
                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] font-mono"
              />
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleChat}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-violet-600 hover:bg-violet-500 rounded text-[10px] text-white"
            >
              <MessageSquareQuote className="w-3 h-3" /> Preguntar en chat
            </button>
            {onDirectReport && (
              <button
                type="button"
                onClick={handleDirect}
                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] text-white"
                title="Ejecuta OPO-QL directo con paginación (sin swarm)"
              >
                <Play className="w-3 h-3" /> Reporte
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveQuery(null)}
            className="text-[10px] text-neutral-500 hover:text-neutral-300"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}