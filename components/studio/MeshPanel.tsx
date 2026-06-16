import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Terminal, X, BrainCircuit, Loader2, Bug, Check, X as XIcon, ChevronRight } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';
import { compileOntology } from '@/lib/mesh/ontologyCompiler';
import PipelineStatusBar, { AgentStatus } from './PipelineStatusBar';
import RecurringQueriesChips from './RecurringQueriesChips';
import {
  RecurringQuery,
  buildOpoQueryFromTemplate,
} from '@/lib/studio/recurringQueries';
import {
  parseOpoResponseFromContent,
  serializeOpoResponse,
  ParsedOpoResponse,
} from '@/lib/studio/opoResponseParser';
import {
  matchRecurringQueryFromText,
  shouldUseDirectQuery,
} from '@/lib/studio/matchRecurringQuery';
import { buildConsultaSummary } from '@/lib/studio/consultasSummary';
import { useStudioHealth } from '@/lib/studio/useStudioHealth';
import StatusSemaphore from '@/components/studio/StatusSemaphore';

// GROK OPTIMIZATION: Import existing debugger components so Time-Travel is actually usable from a run
import { TimelinePlayer } from '@/components/debugger/TimelinePlayer';
import { FrameInspector } from '@/components/debugger/FrameInspector';
import { SwarmMemorySnapshot } from '@/lib/engine/types/blackboard';

function tryParseJsonArray(text: string): Record<string, any>[] | null {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    const lines = cleanText.split('\n');
    if (lines[0].startsWith('```')) {
      lines.shift();
    }
    if (lines[lines.length - 1] === '```') {
      lines.pop();
    }
    cleanText = lines.join('\n').trim();
  }

  if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
    try {
      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        return parsed;
      }
    } catch (e) {
      // Ignored
    }
  }
  return null;
}

function DataTableView({
  rows,
  pagination,
  onLoadMore,
  loadingMore,
}: {
  rows: Record<string, unknown>[];
  pagination?: ParsedOpoResponse['pagination'];
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  if (!rows.length) return <div className="text-xs text-neutral-500">Sin filas en el resultado.</div>;

  const headers = Object.keys(rows[0]);

  const handleDownloadCSV = () => {
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((fieldName) => {
            const val = row[fieldName];
            const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            return `"${strVal.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opo-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-3 my-2 w-full">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-emerald-400 font-semibold">📊 Reporte estructurado</span>
        <div className="flex items-center gap-2">
          {pagination && (
            <span className="text-[10px] text-neutral-500 font-mono">
              Mostrando {pagination.returnedCount}
              {pagination.hasNextPage ? ` (página de ${pagination.limit})` : ''}
            </span>
          )}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold rounded border border-neutral-700"
          >
            📥 CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-neutral-800 rounded-md max-h-60">
        <table className="w-full text-[11px] text-left border-collapse bg-neutral-950">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400">
              {headers.map((h) => (
                <th key={h} className="p-2 font-semibold capitalize">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-neutral-800/50 hover:bg-neutral-900/30 text-neutral-300"
              >
                {headers.map((h) => {
                  const cellVal = row[h];
                  const displayVal =
                    typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal ?? '');
                  return (
                    <td key={h} className="p-2 font-mono truncate max-w-[200px]" title={displayVal}>
                      {displayVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination?.hasNextPage && onLoadMore && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded border border-amber-500/30 bg-amber-500/10">
          <span className="text-[10px] text-amber-200">
            Hay más resultados — {pagination.limit} filas por página.
          </span>
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
          >
            {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
            Cargar {pagination.limit} más
          </button>
        </div>
      )}
    </div>
  );
}

function MessageContentRenderer({
  content,
  summary,
  messageId,
  sourceQuery,
  onLoadMore,
  loadingMore,
}: {
  content: string;
  summary?: string;
  messageId?: string;
  sourceQuery?: Record<string, unknown>;
  onLoadMore?: (messageId: string, cursor: string, sourceQuery?: Record<string, unknown>) => void;
  loadingMore?: boolean;
}) {
  const opoResponse = parseOpoResponseFromContent(content);
  const jsonArray = opoResponse?.data ?? tryParseJsonArray(content);

  if (jsonArray && jsonArray.length > 0) {
    return (
      <div>
        {summary && (
          <p className="text-sm text-neutral-200 mb-2 whitespace-pre-wrap leading-relaxed">{summary}</p>
        )}
        <DataTableView
          rows={jsonArray}
          pagination={opoResponse?.pagination}
          loadingMore={loadingMore}
          onLoadMore={
            opoResponse?.pagination?.hasNextPage &&
            opoResponse.pagination.endCursor &&
            messageId &&
            onLoadMore
              ? () =>
                  onLoadMore(
                    messageId,
                    opoResponse.pagination.endCursor!,
                    sourceQuery || opoResponse.sourceQuery
                  )
              : undefined
          }
        />
        <details className="text-[10px] text-neutral-500 cursor-pointer mt-2">
          <summary className="hover:text-neutral-400">Ver JSON completo</summary>
          <pre className="mt-1 p-2 bg-neutral-950 border border-neutral-900 rounded overflow-x-auto max-h-40 whitespace-pre text-[10px]">
            {content}
          </pre>
        </details>
      </div>
    );
  }

  return <div className="whitespace-pre-wrap">{content}</div>;
}

interface MeshMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  summary?: string;
  agentId?: string;
  hilRequestId?: string;
  sourceQuery?: Record<string, unknown>;
  recurringQueryId?: string;
}

export default function MeshPanel({
  isOpen,
  onClose,
  initialQuery,
  variant = 'dock',
  onOpenSettings,
}: {
  isOpen: boolean;
  onClose?: () => void;
  initialQuery?: string;
  variant?: 'dock' | 'fullscreen';
  onOpenSettings?: () => void;
}) {
  const {
    nodes,
    edges,
    project,
    apiKeys,
    setActiveNodeId,
    erpWorkspace,
    buildQueryExecutionPayload,
    currentProvider,
    llmConfigs,
  } = useStudioStore();
  const queryMode = erpWorkspace.dataMode === 'live' && erpWorkspace.connectionString.trim() ? 'live' : 'demo';
  const { health, refresh: refreshHealth } = useStudioHealth();
  const queryBlocked = health !== null && !health.canQuery;
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<MeshMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [loadingMoreFor, setLoadingMoreFor] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<{agentId: string, status: AgentStatus}[]>([]);

  // GROK OPTIMIZATION: Track the current run's session so we can power the debugger + HIL from the console
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SwarmMemorySnapshot | null>(null);

  // HIL state surfaced in the console (parsed from structured messages)
  const [pendingHil, setPendingHil] = useState<{ requestId: string; agentId: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialQuery && isOpen && !isExecuting) {
      setQuery(initialQuery);
    }
  }, [initialQuery, isOpen]);

  const getOntology = useCallback(
    () => compileOntology(nodes as never[], edges as never[], project?.name),
    [nodes, edges, project?.name]
  );

  const handleLoadMore = async (
    messageId: string,
    cursor: string,
    sourceQuery?: Record<string, unknown>
  ) => {
    if (!sourceQuery?.entity) return;
    setLoadingMoreFor(messageId);

    try {
      const execPayload = buildQueryExecutionPayload();
      const res = await fetch('/api/studio/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sourceQuery,
          pagination: { cursor },
          ontology: getOntology(),
          projectName: project?.name,
          ...execPayload,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Load more failed');

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const existing = parseOpoResponseFromContent(msg.content);
          const merged: ParsedOpoResponse = {
            data: [...(existing?.data || []), ...(payload.data || [])],
            pagination: payload.pagination,
            sourceQuery: sourceQuery,
          };
          return { ...msg, content: serializeOpoResponse(merged), sourceQuery };
        })
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar más';
      setMessages((prev) => [
        ...prev,
        { id: `err-more-${Date.now()}`, role: 'system', content: `Error paginación: ${message}` },
      ]);
    } finally {
      setLoadingMoreFor(null);
    }
  };

  const handleDirectReport = async (
    recurring: RecurringQuery,
    paramValues: Record<string, string>,
    options?: { skipUserMessage?: boolean }
  ) => {
    const opoQuery = buildOpoQueryFromTemplate(recurring, paramValues);
    setIsExecuting(true);

    if (!options?.skipUserMessage) {
      const userMsg: MeshMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: `[Consulta recurrente] ${recurring.humanLabel}`,
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    try {
      const execPayload = buildQueryExecutionPayload();
      const res = await fetch('/api/studio/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: recurring.id,
          params: paramValues,
          ontology: getOntology(),
          projectName: project?.name,
          ...execPayload,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Query failed');

      const assistantMsg: MeshMessage = {
        id: `report-${Date.now()}`,
        role: 'assistant',
        agentId: 'opo-report',
        summary: buildConsultaSummary(recurring, payload.data || [], payload.pagination),
        content: serializeOpoResponse({
          data: payload.data || [],
          pagination: payload.pagination,
          sourceQuery: opoQuery,
        }),
        sourceQuery: opoQuery,
        recurringQueryId: recurring.id,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error en reporte';
      setMessages((prev) => [
        ...prev,
        { id: `err-report-${Date.now()}`, role: 'system', content: `Error: ${message}` },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isExecuting || queryBlocked) return;

    const userText = query.trim();
    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: userText };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');

    const ontology = getOntology();
    const directMatch = matchRecurringQueryFromText(userText, ontology, project?.name);
    if (shouldUseDirectQuery(directMatch)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-fast-${Date.now()}`,
          role: 'system',
          content: `⚡ Consulta reconocida: «${directMatch.query.humanLabel}» — respuesta rápida sin Swarm.`,
        },
      ]);
      await handleDirectReport(directMatch.query, directMatch.paramValues, { skipUserMessage: true });
      return;
    }

    setIsExecuting(true);
    setPipelineSteps([]);
    setCurrentSessionId(null);
    setPendingHil(null);
    setShowDebugger(false);
    setSelectedSnapshot(null);

    try {
      const erpExecution = buildQueryExecutionPayload();

      // Sanitize llmConfigs: remove API keys before sending over the wire
      const sanitizedLlmConfigs = Object.keys(llmConfigs).reduce((acc: any, key) => {
        const { apiKey, ...rest } = llmConfigs[key];
        acc[key] = rest;
        return acc;
      }, {});

      const startRes = await fetch('/api/mesh/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg.content,
          ontology,
          llmConfig: { currentProvider, llmConfigs: sanitizedLlmConfigs },
          erpExecution,
        }),
      });

      const startPayload = await startRes.json();
      if (!startRes.ok) throw new Error(startPayload.error || 'Mesh query failed');

      const sessionId = startPayload.sessionId as string;
      setCurrentSessionId(sessionId);

      if (startPayload.intent?.agentPipeline) {
        setPipelineSteps(
          startPayload.intent.agentPipeline.map((id: string) => ({
            agentId: id,
            status: 'pending' as AgentStatus,
          }))
        );
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            content: `Pipeline: ${startPayload.intent.agentPipeline.join(' → ')}`,
          },
        ]);
      }

      const streamRes = await fetch(`/api/mesh/stream/${sessionId}`);
      if (!streamRes.body) throw new Error('No stream body');

      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const handleStreamEvent = (data: Record<string, unknown>) => {
        if (data.type === 'session') {
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              role: 'system',
              content: `Session started: ${data.sessionId}`,
            },
          ]);
        } else if (data.type === 'intent' && data.intent) {
          const intent = data.intent as { agentPipeline: string[] };
          setPipelineSteps(
            intent.agentPipeline.map((id) => ({
              agentId: id,
              status: 'pending' as AgentStatus,
            }))
          );
        } else if (data.type === 'message' && data.message) {
          const msg = data.message as MeshMessage & { hilRequestId?: string };
          setMessages((prev) => [...prev, msg]);

          if (msg.hilRequestId) {
            setPendingHil({ requestId: msg.hilRequestId, agentId: msg.agentId || 'unknown' });
          }
          if (msg.content?.includes('HIL pending') && msg.hilRequestId) {
            setPendingHil({ requestId: msg.hilRequestId, agentId: msg.agentId || 'unknown' });
          }

          if (msg.agentId && msg.role === 'system' && msg.content.includes('Handing over')) {
            setActiveNodeId(msg.agentId);
            setPipelineSteps((prev) =>
              prev.map((s) => (s.agentId === msg.agentId ? { ...s, status: 'active' } : s))
            );
          } else if (msg.agentId && msg.role === 'assistant') {
            setActiveNodeId(null);
            setPipelineSteps((prev) =>
              prev.map((s) => (s.agentId === msg.agentId ? { ...s, status: 'done' } : s))
            );
            setPendingHil(null);
          } else if (
            msg.agentId &&
            msg.role === 'system' &&
            (msg.content.includes('error') || msg.content.includes('rejected by Human'))
          ) {
            setActiveNodeId(null);
            setPipelineSteps((prev) =>
              prev.map((s) => (s.agentId === msg.agentId ? { ...s, status: 'error' } : s))
            );
            setPendingHil(null);
          }
        } else if (data.type === 'error') {
          throw new Error(String(data.error || 'Stream error'));
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            handleStreamEvent(JSON.parse(line.slice(6)));
          } catch (parseErr: unknown) {
            if (parseErr instanceof Error && parseErr.message !== 'Stream error') {
              // ignore malformed chunks
            } else {
              throw parseErr;
            }
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { id: 'err', role: 'system', content: `Error: ${error.message}` }]);
    } finally {
      setIsExecuting(false);
      setActiveNodeId(null);
    }
  };

  // Real HIL resolution from the console (calls the existing API)
  const handleHilResolve = async (status: 'approved' | 'rejected') => {
    if (!pendingHil) return;

    try {
      const res = await fetch(`/api/hil/${pendingHil.requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setMessages(prev => [...prev, {
          id: `hil-${Date.now()}`,
          role: 'system',
          content: `🧑‍⚖️ HIL ${status.toUpperCase()} for ${pendingHil.agentId}`
        }]);
        setPendingHil(null);
      } else {
        setMessages(prev => [...prev, {
          id: `hil-err-${Date.now()}`,
          role: 'system',
          content: `Failed to ${status} HIL request`
        }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: 'hil-net-err', role: 'system', content: `HIL network error: ${e.message}` }]);
    }
  };

  if (!isOpen) return null;

  const isFullscreen = variant === 'fullscreen';
  const shellClass = isFullscreen
    ? 'flex-1 flex flex-col min-h-0 bg-neutral-950'
    : 'fixed bottom-0 left-[288px] right-[350px] h-[42vh] bg-neutral-950 border-t border-neutral-800 shadow-2xl flex flex-col z-[45]';

  return (
    <div className={shellClass}>
      {/* Header */}
      <div className="h-10 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-3 text-violet-400">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {isFullscreen ? 'Consultas OPO' : 'OPO Cognitive Mesh Console'}
          </span>
          
          <span
            className={`ml-2 text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wide ${
              queryMode === 'live'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/40'
            }`}
            title={
              queryMode === 'live'
                ? 'Consultas contra la base de datos conectada'
                : 'Datos de demostración — conectá tu ERP para datos reales'
            }
          >
            {queryMode === 'live' ? 'Datos en vivo' : 'Demostración'}
          </span>

          {/* Show current LLM provider - useful for Ollama/local vs cloud */}
          <StatusSemaphore compact onOpenSettings={onOpenSettings} />
          
          {/* GROK OPTIMIZATION: Show live session + one-click access to the now-functional Time-Travel debugger */}
          {currentSessionId && (
            <button
              onClick={() => setShowDebugger(true)}
              className="ml-2 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300"
              title="Open Time-Travel Debugger for this run"
            >
              <Bug className="w-3 h-3" /> Debug run
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentSessionId && (
            <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
              {currentSessionId}
            </span>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <PipelineStatusBar steps={pipelineSteps} />

      <RecurringQueriesChips
        disabled={isExecuting}
        onSelectMeshPrompt={(prompt) => setQuery(prompt)}
        onDirectReport={handleDirectReport}
      />

      {/* GROK OPTIMIZATION: Prominent real HIL approval UI inside the running console */}
      {pendingHil && (
        <div className="mx-4 mt-2 p-2 bg-yellow-900/30 border border-yellow-600/40 rounded flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-yellow-400">HUMAN APPROVAL REQUIRED</span>
            <span className="ml-2 text-neutral-300">Agent: <span className="font-mono">{pendingHil.agentId}</span></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleHilResolve('approved')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-1 text-[11px]"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => handleHilResolve('rejected')}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded flex items-center gap-1 text-[11px]"
            >
              <XIcon className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-neutral-500 mb-1 flex items-center space-x-1">
              {msg.role === 'system' ? <Terminal className="w-3 h-3" /> : (msg.role === 'assistant' ? <BrainCircuit className="w-3 h-3 text-violet-400" /> : null)}
              <span>{msg.agentId || msg.role.toUpperCase()}</span>
            </span>
            <div className={`
              px-3 py-2 rounded-lg max-w-[90%] overflow-x-auto
              ${msg.role === 'user' ? 'bg-blue-600 text-white' : 
                msg.role === 'system' ? 'bg-neutral-900 text-neutral-400 border border-neutral-800' : 
                'bg-violet-900/30 text-violet-200 border border-violet-500/30'}
            `}>
              <MessageContentRenderer
                content={msg.content}
                summary={msg.summary}
                messageId={msg.id}
                sourceQuery={msg.sourceQuery}
                onLoadMore={handleLoadMore}
                loadingMore={loadingMoreFor === msg.id}
              />
            </div>
          </div>
        ))}
        {isExecuting && (
          <div className="flex items-center space-x-2 text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Swarm ejecutando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {queryBlocked && (
        <div className="mx-4 mb-1 p-2 rounded border border-red-500/40 bg-red-950/40 text-[11px] text-red-200 flex items-center justify-between gap-2">
          <span>
            {health?.erp.error || 'No se puede consultar el ERP en este momento.'}
            {queryMode === 'live' ? ' Revisá Ajustes o usá modo demostración.' : ''}
          </span>
          <button
            type="button"
            onClick={() => void refreshHealth()}
            className="shrink-0 px-2 py-0.5 rounded bg-red-800/60 hover:bg-red-700 text-white text-[10px] font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800 shrink-0">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              queryBlocked
                ? 'Conexión ERP no disponible — corregí Ajustes para continuar'
                : 'Ej: ¿Cuánto debe el cliente 000219? · Pedidos del mes · Facturas vencidas...'
            }
            disabled={isExecuting || queryBlocked}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-neutral-200 disabled:opacity-60"
          />
          <button 
            type="submit" 
            disabled={isExecuting || !query.trim() || queryBlocked}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* GROK OPTIMIZATION: Embedded Time-Travel Debugger modal — now actually works because we persist snapshots with sessionId */}
      {showDebugger && currentSessionId && (
        <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowDebugger(false)}>
          <div 
            className="bg-neutral-950 border border-neutral-800 rounded-xl w-full max-w-5xl max-h-[82vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/60">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
                <Bug className="w-4 h-4" /> Time-Travel Debugger — Session {currentSessionId}
              </div>
              <button onClick={() => setShowDebugger(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Timeline</div>
                <TimelinePlayer 
                  sessionId={currentSessionId} 
                  onSnapshotSelect={setSelectedSnapshot} 
                />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">State Inspector</div>
                <FrameInspector snapshot={selectedSnapshot} />
              </div>
            </div>

            <div className="p-3 border-t border-neutral-800 text-[10px] text-neutral-500 bg-neutral-900/50">
              Snapshots are automatically captured during execution. Use the slider or play button to travel through the swarm's memory and locks.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
