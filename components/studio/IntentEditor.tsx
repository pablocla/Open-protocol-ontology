import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, X, FileCode2 } from 'lucide-react';
import { intentParser } from '@/lib/mesh/intentParser';
import { useStudioStore } from '@/store/useStudioStore';

const DEFAULT_INTENT = `# OPO Declarative Intent
goal: analizar_ventas_mensual
agents: auto
memory: ontology
execution: mcp
review: enabled
filters:
  entity: PedidosVenta
  timeframe: last_month
output: json
`;

export default function IntentEditor({ isOpen, onClose, onExecute }: { isOpen: boolean; onClose: () => void, onExecute: (query: string) => void }) {
  const [code, setCode] = useState(DEFAULT_INTENT);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = () => {
    try {
      setError(null);
      const parsed = intentParser.parse(code);
      // For now, we just pass the goal as the query.
      // In a more complex setup, we'd pass the full parsed intent to the backend.
      onExecute(parsed.goal);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-950 border border-neutral-800 shadow-2xl rounded-xl flex flex-col w-full max-w-3xl h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center space-x-2 text-blue-400">
            <FileCode2 className="w-5 h-5" />
            <span className="text-sm font-semibold tracking-wide">Declarative Intent Editor</span>
          </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExecute}
            className="flex items-center space-x-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded transition-colors border border-emerald-500/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Intent</span>
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="yaml"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'var(--font-geist-mono)',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-950/80 border border-red-900 text-red-400 text-xs px-3 py-2 rounded-md">
            {error}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
