import { useStudioStore } from '@/store/useStudioStore';
import { Download, Cpu, Undo, Redo, Play, Loader2, FileCode2, Settings, MoreVertical, FolderOpen, Trash2, Save } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { generateAndDownloadMCP } from '@/lib/studio/mcpGenerator';
import { saveAs } from 'file-saver';
import { EntityNodeData } from '@/lib/studio/studioTypes';
import { toast } from 'sonner';
import StatusSemaphore from '@/components/studio/StatusSemaphore';
import Link from 'next/link';

export default function Topbar({ onToggleMeshPanel, onToggleIntentEditor, onToggleSettings }: { onToggleMeshPanel?: () => void, onToggleIntentEditor?: () => void, onToggleSettings?: () => void }) {
  const { project, setProjectName, clearProject, nodes, edges, erpWorkspace } = useStudioStore();
  const dataMode =
    erpWorkspace.dataMode === 'live' && erpWorkspace.connectionString.trim() ? 'live' : 'demo';
  const [name, setName] = useState(project?.name || 'Untitled Project');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSaveWorkspace = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/studio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, nodes, edges })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Espacio de trabajo guardado exitosamente.');
      } else {
        toast.error(data.error || 'No se pudo guardar el espacio de trabajo.');
      }
    } catch (error: any) {
      toast.error(`Error de red: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // We access temporal store
  const undo = useStudioStore.temporal.getState().undo;
  const redo = useStudioStore.temporal.getState().redo;

  useEffect(() => {
    setName(project?.name || 'Untitled Project');
  }, [project?.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    if (name.trim() !== project?.name) {
      setProjectName(name.trim() || 'Untitled Project');
      setName(name.trim() || 'Untitled Project');
    }
  };

  const validateGraph = () => {
    const entityNodes = nodes.filter(n => n.type === 'entityNode');
    if (entityNodes.length === 0) {
      toast.warning('Agregá al menos un Área de Negocio al lienzo.');
      return false;
    }

    for (const node of entityNodes) {
      const attrs = (node.data as EntityNodeData).attributes || [];
      if (!attrs.some(a => a.isPrimaryKey)) {
        toast.error(`El área "${(node.data as EntityNodeData).label}" no tiene identificador principal (PK).`);
        return false;
      }
    }
    return true;
  };

  const handleGenerateMCP = async () => {
    if (!validateGraph()) return;

    try {
      setIsGenerating(true);
      await generateAndDownloadMCP(nodes as any, edges as any, project?.name || 'Untitled Project');
      toast.success('Paquete de Empleado Virtual generado y descargado.');
    } catch (error) {
      console.error('Error generating MCP:', error);
      toast.error('Error generando el servidor MCP.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ project, nodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    saveAs(blob, `${(project?.name || 'opo-project').toLowerCase().replace(/\s+/g, '-')}.opo.json`);
    toast.success('Proyecto exportado como JSON.');
  };

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between pl-4 pr-8 z-50 shrink-0 relative">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 mr-4">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg">
            O
          </div>
          <span className="font-semibold tracking-wide text-white">Studio</span>
        </div>
        <div className="h-6 w-px bg-neutral-800" />
        
        <input 
          type="text" 
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          className="bg-transparent text-sm font-medium text-neutral-300 focus:text-white focus:outline-none hover:bg-neutral-900 px-2 py-1 rounded transition-colors"
        />
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center mr-2 bg-neutral-900 rounded-md p-0.5 border border-neutral-800">
          <button onClick={() => undo()} className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={() => redo()} className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors">
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <StatusSemaphore onOpenSettings={() => onToggleSettings?.()} />

        <Link
          href="/consultas"
          className="text-[10px] px-2.5 py-1 rounded border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 font-semibold transition-colors"
          title="Modo consultas para usuario final — sin lienzo técnico"
        >
          Consultas
        </Link>

        <button 
          onClick={handleSaveWorkspace}
          disabled={isSaving}
          className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 px-3.5 py-1.5 rounded-md transition-colors border border-neutral-800"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Save className="w-3.5 h-3.5 text-indigo-400" />}
          <span>Guardar</span>
        </button>

        <button
          onClick={onToggleMeshPanel}
          title="Ejecuta el Swarm completo: varios empleados coordinados, consultas ERP y aprobaciones HIL en la consola Mesh."
          className="flex items-center space-x-2 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 px-4 py-1.5 rounded-md transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]"
        >
          <Play className="w-4 h-4" />
          <span>Ejecutar Equipo</span>
        </button>

        {/* UX 2B: always-visible entry point to the HIL approvals UI that already lives in MeshPanel.
             The executor yields hilRequestId events; MeshPanel renders Approve/Reject wired to HILManager.
             This button makes the "abismo" (no canvas UI for pending human approvals) much smaller. */}
        <button
          onClick={onToggleMeshPanel}
          className="flex items-center space-x-1.5 text-xs font-semibold text-amber-300 bg-neutral-900 hover:bg-amber-900/30 border border-amber-700 px-3 py-1.5 rounded-md transition-colors"
          title="Abre la misma consola que Ejecutar Equipo. Si hay aprobaciones pendientes (HIL), aparecen ahí para Confirmar o Rechazar."
        >
          <span>⏳</span>
          <span>Aprobaciones</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 rounded-md transition-colors border border-transparent hover:border-neutral-700 flex items-center"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 glass-panel rounded-lg shadow-2xl py-1 z-50">
              <button 
                onClick={() => { setIsMenuOpen(false); onToggleIntentEditor?.(); }}
                className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center space-x-2"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Instrucciones del equipo (YAML)</span>
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); handleGenerateMCP(); }}
                disabled={isGenerating}
                className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center space-x-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                <span>Crear Empleado Virtual (exportar)</span>
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); handleExportJSON(); }}
                className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center space-x-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar mapa del sistema (JSON)</span>
              </button>
              <button 
                onClick={async () => {
                  setIsMenuOpen(false);
                  try {
                    const res = await fetch('/api/marketplace/publish', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        nodes, 
                        edges, 
                        project, 
                        options: { 
                          name: project?.name || 'Untitled DigitalEmployee',
                          description: 'Packaged via OPO Studio Vibe Coding'
                        } 
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(`Published "${data.digitalEmployee.name}" to Marketplace!`);
                    } else {
                      toast.error(data.error || 'Failed to publish');
                    }
                  } catch (e: any) {
                    toast.error('Error publishing to Marketplace');
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs text-emerald-300 hover:text-emerald-200 hover:bg-emerald-900/30 flex items-center space-x-2"
              >
                <span>🚀</span>
                <span>Activar en Marketplace</span>
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); onToggleSettings?.(); }}
                className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center space-x-2"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ajustes de IA</span>
              </button>
              <div className="h-px bg-neutral-800 my-1 mx-2" />
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  if (window.confirm('⚠️ ¿Estás seguro? Se borrarán todos los nodos, conexiones y configuraciones del proyecto actual.')) {
                    clearProject();
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-neutral-800 flex items-center space-x-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar lienzo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
