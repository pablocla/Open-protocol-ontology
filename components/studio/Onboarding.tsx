import { useStudioStore } from '@/store/useStudioStore';
import { Database, Plus, Workflow, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Onboarding() {
  const { loadProtheusBaseline, loadProjectData, setProject } = useStudioStore();
  const [isLoadingBaseline, setIsLoadingBaseline] = useState(false);
  const [hasLocalManifest, setHasLocalManifest] = useState(false);
  const [localData, setLocalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkLocalManifest() {
      try {
        const res = await fetch('/api/studio/load');
        const data = await res.json();
        if (data.exists) {
          setHasLocalManifest(true);
          setLocalData(data);
        }
      } catch (err) {
        console.error('Error checking local manifest:', err);
      }
    }
    checkLocalManifest();
  }, []);

  const handleLoadLocalProject = () => {
    if (!localData) return;
    try {
      setIsLoading(true);
      loadProjectData(localData.project, localData.nodes, localData.edges);
      toast.success('Ontología cargada desde tu workspace local.');
    } catch (e: any) {
      toast.error('Error al cargar la ontología local.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlankProject = () => {
    setProject({ name: 'Untitled Project' });
  };

  const handleLoadProtheusBaseline = async () => {
    try {
      setIsLoadingBaseline(true);
      const res = await fetch('/api/studio/protheus-baseline');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al cargar baseline');
      loadProtheusBaseline(data.project, data.nodes, data.edges);
      toast.success(`Ontología Protheus baseline v${data.baselineVersion}: ${data.summary.entities} entidades, ${data.summary.relationships} relaciones.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar baseline Protheus');
    } finally {
      setIsLoadingBaseline(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-neutral-950 text-white">
      <div className="max-w-2xl text-center space-y-8 p-6">
        <h1 className="text-5xl font-bold tracking-tight">Bienvenido a OPO Studio</h1>
        <p className="text-xl text-neutral-400">
          La fábrica de conocimiento empresarial para IA y automatización.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
          {hasLocalManifest && (
            <button 
              onClick={handleLoadLocalProject}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-8 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 hover:border-indigo-500 transition-all group md:col-span-2"
            >
              {isLoading ? (
                <Loader2 className="w-12 h-12 text-indigo-500 mb-4 animate-spin" />
              ) : (
                <Workflow className="w-12 h-12 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
              )}
              <h2 className="text-xl font-semibold mb-2">Cargar del Workspace</h2>
              <p className="text-neutral-500 text-sm">Carga el manifiesto .well-known/opo.json detectado localmente en tu proyecto.</p>
            </button>
          )}

          <button 
            onClick={handleLoadProtheusBaseline}
            disabled={isLoadingBaseline}
            className="flex flex-col items-center justify-center p-8 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 hover:border-blue-500 transition-all group"
          >
            {isLoadingBaseline ? (
              <Loader2 className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
            ) : (
              <Database className="w-12 h-12 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            )}
            <h2 className="text-xl font-semibold mb-2">Protheus — Ontología Baseline</h2>
            <p className="text-neutral-500 text-sm">Premodelo con SA*, SC*, SF*, SE* y relaciones SX9. Luego escaneá solo tablas/campos custom de tu instalación.</p>
          </button>

          <button 
            onClick={handleBlankProject}
            className="flex flex-col items-center justify-center p-8 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 hover:border-emerald-500 transition-all group"
          >
            <Plus className="w-12 h-12 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-semibold mb-2">Proyecto en Blanco</h2>
            <p className="text-neutral-500 text-sm">Empieza a diseñar tu ontología desde cero.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
