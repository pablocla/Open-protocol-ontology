import { Database, Brain, Wrench, Sparkles, ArrowRight } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';
import { toast } from 'sonner';

export default function CanvasEmptyState() {
  const { loadProtheusBaseline } = useStudioStore();

  const handleLoadBaseline = async () => {
    try {
      const res = await fetch('/api/studio/protheus-baseline');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      loadProtheusBaseline(data.project, data.nodes, data.edges);
      toast.success('Ontología Protheus baseline cargada.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar baseline');
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="pointer-events-auto max-w-lg text-center space-y-6 p-8">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-indigo-400" />
        </div>
        
        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Design your Ontology</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Drag entities from the left panel to start building your business knowledge graph. 
            Connect them to define relationships, then let the Cognitive Mesh reason over your data.
          </p>
        </div>

        {/* Quick Start Cards */}
        <div className="grid grid-cols-3 gap-3 text-left">
          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg">
            <Database className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-xs font-medium text-neutral-200">Entities</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Define your data models</div>
          </div>
          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg">
            <Brain className="w-5 h-5 text-violet-400 mb-2" />
            <div className="text-xs font-medium text-neutral-200">Agents</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Add AI reasoning</div>
          </div>
          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg">
            <Wrench className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-xs font-medium text-neutral-200">Tools</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Connect MCP servers</div>
          </div>
        </div>

        {/* Load Demo */}
        <button
          onClick={handleLoadBaseline}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
        >
          <span>Load Protheus Baseline</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
