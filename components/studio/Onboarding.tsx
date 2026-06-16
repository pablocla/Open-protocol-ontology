'use client';

import { useStudioStore, type ErpId } from '@/store/useStudioStore';
import { PENDING_DEPLOY_KEY } from '@/lib/studio/studioDeepLink';
import {
  Building2,
  Check,
  ChevronRight,
  Database,
  Loader2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import OnboardingStepper from './OnboardingStepper';
import OllamaSetupForm from './OllamaSetupForm';
import ProtheusConnectionForm from './ProtheusConnectionForm';

const ERP_OPTIONS: {
  id: ErpId;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
}[] = [
  { id: 'protheus', label: 'TOTVS Protheus', subtitle: 'ERP latinoamericano', icon: '🇧🇷', color: 'border-blue-500/50 bg-blue-500/10' },
  { id: 'sap', label: 'SAP', subtitle: 'S/4HANA y Business One', icon: '🟦', color: 'border-indigo-500/50 bg-indigo-500/10' },
  { id: 'odoo', label: 'Odoo', subtitle: 'ERP open source', icon: '🟣', color: 'border-violet-500/50 bg-violet-500/10' },
  { id: 'netsuite', label: 'NetSuite', subtitle: 'ERP en la nube', icon: '☁️', color: 'border-cyan-500/50 bg-cyan-500/10' },
  { id: 'otro', label: 'Otro sistema', subtitle: 'Base de datos o API propia', icon: '🔗', color: 'border-neutral-600 bg-neutral-800/50' },
];

const SCAN_LABELS = [
  'Verificando credenciales del sistema...',
  'Escaneando catálogo SX2 (Tablas del ERP)...',
  'Esquematizando campos del SX3 (Columnas y tipos)...',
  'Mapeando relaciones de integridad SX9 (DER)...',
  'Generando ontología del negocio (.opo.json)...',
  'Inicializando blackboard y base semántica...',
];

interface OnboardingProps {
  pendingDeployTemplate?: string | null;
  showGuide?: boolean;
  simplified?: boolean;
}

export default function Onboarding({
  pendingDeployTemplate,
  showGuide = false,
  simplified = false,
}: OnboardingProps) {
  const router = useRouter();
  const {
    loadProjectData,
    setProject,
    setErpWorkspace,
    setCurrentProvider,
    setLLMConfig,
    setApiKey,
    deployAgentTemplate,
  } = useStudioStore();

  const [step, setStep] = useState(simplified ? 1 : 0); // Skip AI setup if simplified
  const [selectedErp, setSelectedErp] = useState<ErpId>('protheus');

  // Config State
  const [aiConfig, setAiConfig] = useState<any>({
    provider: 'ollama',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.1',
  });
  const [erpConfig, setErpConfig] = useState<any>({
    dataMode: 'demo',
    filial: '01',
    companySuffix: '010',
  });

  // Scan state
  const [scanIndex, setScanIndex] = useState(0);
  const [scanDone, setScanDone] = useState<boolean[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [discoverStats, setDiscoverStats] = useState({
    entities: 0,
    relationships: 0,
  });

  // Local Workspace State
  const [hasLocalManifest, setHasLocalManifest] = useState(false);
  const [localData, setLocalData] = useState<any>(null);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  useEffect(() => {
    async function checkLocalManifest() {
      try {
        const res = await fetch('/api/studio/load');
        const data = await res.json();
        if (data.exists) {
          setHasLocalManifest(true);
          setLocalData(data);
        }
      } catch {
        /* ignore */
      }
    }
    void checkLocalManifest();
  }, []);

  // Scan labels animation
  useEffect(() => {
    if (step !== 2 || !isScanning) return;
    setScanDone(SCAN_LABELS.map(() => false));
    setScanIndex(0);
    const interval = setInterval(() => {
      setScanIndex((prev) => {
        const next = prev + 1;
        setScanDone((done) => {
          const updated = [...done];
          if (prev < updated.length) updated[prev] = true;
          return updated;
        });
        if (next >= SCAN_LABELS.length) clearInterval(interval);
        return Math.min(next, SCAN_LABELS.length - 1);
      });
    }, 900);
    return () => clearInterval(interval);
  }, [step, isScanning]);

  const handleAiVerified = (config: any) => {
    setAiConfig(config);
    setStep(1);
  };

  const handleErpVerified = async (config: any) => {
    setErpConfig(config);
    setIsScanning(true);
    setStep(2);

    try {
      const onboardConfig = {
        ai: aiConfig,
        erp: {
          erpId: selectedErp,
          dataMode: config.dataMode,
          mssql: config.mssql,
          connectionString: config.connectionString,
          filial: config.filial,
          companySuffix: config.companySuffix,
        },
      };

      const res = await fetch('/api/studio/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardConfig),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'No se pudo realizar el onboarding');
      }

      // Populate Zustand store
      loadProjectData(
        { name: result.projectName },
        result.nodes,
        result.edges
      );
      setErpWorkspace(result.erpWorkspace);
      setCurrentProvider(result.currentProvider);
      if (result.currentProvider === 'ollama') {
        setLLMConfig('ollama', result.llmConfigs.ollama);
      } else {
        setApiKey(result.currentProvider, result.llmConfigs[result.currentProvider].apiKey);
      }

      setDiscoverStats({
        entities: result.stats.entities,
        relationships: result.stats.relationships,
      });

      // Complete scanning animation
      setScanDone(SCAN_LABELS.map(() => true));
      setScanIndex(SCAN_LABELS.length - 1);
      await new Promise((r) => setTimeout(r, 600));

      if (simplified) {
        // Skip final step and go directly to queries in simplified mode
        finalizeOnboarding(result);
        toast.success('¡Onboarding listo! Empezá a realizar tus consultas.');
        router.push('/consultas');
      } else {
        setStep(3);
      }
    } catch (e: any) {
      toast.error(`Fallo en el análisis: ${e.message || 'Comprobá su conexión.'}`);
      setStep(1);
    } finally {
      setIsScanning(false);
    }
  };

  const finalizeOnboarding = (result?: any) => {
    const activeProject = result?.projectName || `Protheus — Equipo`;
    setProject({ name: activeProject });
    
    // Apply deep-link deployments if any
    const pending =
      pendingDeployTemplate ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(PENDING_DEPLOY_KEY) : null);
    if (pending) {
      const title = deployAgentTemplate(pending);
      if (title) {
        toast.success(`"${title}" ya está en tu equipo.`);
      }
      sessionStorage.removeItem(PENDING_DEPLOY_KEY);
    }
  };

  const handleFinishConsultas = () => {
    finalizeOnboarding();
    toast.success('¡Listo! Empezá a consultar tu ERP en lenguaje natural.');
    router.push('/consultas');
  };

  const handleFinishStudio = () => {
    finalizeOnboarding();
    toast.success('Lienzo de Studio listo para configurar su Swarm de agentes.');
    router.push('/studio');
  };

  const handleLoadLocalProject = () => {
    if (!localData) return;
    setIsLoadingLocal(true);
    try {
      loadProjectData(localData.project, localData.nodes, localData.edges);
      if (localData.erpWorkspace) setErpWorkspace(localData.erpWorkspace);
      if (localData.ai) {
        setCurrentProvider(localData.ai.currentProvider);
        if (localData.ai.ollamaBaseUrl) {
          setLLMConfig('ollama', {
            baseUrl: localData.ai.ollamaBaseUrl,
            model: localData.ai.ollamaModel,
          });
        }
        if (localData.ai.cloudApiKey) {
          setApiKey(localData.ai.currentProvider, localData.ai.cloudApiKey);
        }
      }
      toast.success('Espacio de trabajo cargado desde los archivos locales.');
      router.push('/consultas');
    } catch (err) {
      toast.error('Error al restaurar el espacio de trabajo local.');
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const onboardingSteps = ['Asistente IA', 'Conectar ERP', 'Analizar', '¡Listo!'];

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full bg-neutral-950 text-white overflow-y-auto py-10 px-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            OPO Studio
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            {simplified
              ? 'Conectá su ERP en un paso y comenzá a realizar consultas en lenguaje natural.'
              : 'Conectá su base de datos, configurá su IA local y creá su Swarm de agentes cognitivos.'}
          </p>
        </div>

        {/* Stepper (Only if not simplified) */}
        {!simplified && (
          <div className="py-2">
            <OnboardingStepper currentStep={step} steps={onboardingSteps} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: AI setup */}
          {step === 0 && !simplified && (
            <motion.div
              key="step-ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <OllamaSetupForm
                initialProvider={aiConfig.provider}
                initialBaseUrl={aiConfig.ollamaBaseUrl}
                initialModel={aiConfig.ollamaModel}
                initialApiKey={aiConfig.cloudApiKey}
                onVerified={handleAiVerified}
              />
              {hasLocalManifest && (
                <div className="flex items-center justify-center pt-2">
                  <button
                    onClick={handleLoadLocalProject}
                    disabled={isLoadingLocal}
                    className="flex items-center space-x-2 text-xs text-violet-400 hover:text-violet-300 font-semibold bg-violet-950/20 border border-violet-850 px-4 py-2 rounded-xl"
                  >
                    {isLoadingLocal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Reanudar desde .opo/workspace.json existente</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: ERP Selection & Connection Form */}
          {step === 1 && (
            <motion.div
              key="step-erp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* ERP Provider Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Seleccioná su ERP</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {ERP_OPTIONS.map((erp) => (
                    <button
                      key={erp.id}
                      type="button"
                      onClick={() => setSelectedErp(erp.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        selectedErp === erp.id
                          ? 'border-violet-500 bg-violet-500/10 text-violet-300 shadow'
                          : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-lg">{erp.icon}</span>
                      <span className="text-xs font-bold whitespace-nowrap">{erp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedErp === 'protheus' ? (
                <ProtheusConnectionForm
                  initialMode={erpConfig.dataMode}
                  initialConnectionString={erpConfig.connectionString}
                  initialFilial={erpConfig.filial}
                  initialCompanySuffix={erpConfig.companySuffix}
                  onVerified={handleErpVerified}
                  onSkipDemo={() => handleErpVerified({ dataMode: 'demo', filial: '01', companySuffix: '010' })}
                />
              ) : (
                <div className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-2xl text-center space-y-4">
                  <span className="text-3xl">🧩</span>
                  <h3 className="font-semibold text-neutral-200">Adaptador {selectedErp.toUpperCase()} en preparación</h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Los esquemas baselines para {ERP_OPTIONS.find((e) => e.id === selectedErp)?.label} están en fase beta.
                    Podés continuar en Modo Demostración para simular el comportamiento.
                  </p>
                  <button
                    onClick={() => handleErpVerified({ dataMode: 'demo', filial: '01', companySuffix: '010' })}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Usar Demostración
                  </button>
                </div>
              )}

              {simplified && hasLocalManifest && (
                <div className="flex items-center justify-center pt-2">
                  <button
                    onClick={handleLoadLocalProject}
                    disabled={isLoadingLocal}
                    className="flex items-center space-x-2 text-xs text-violet-400 hover:text-violet-300 font-semibold bg-violet-950/20 border border-violet-850 px-4 py-2 rounded-xl"
                  >
                    {isLoadingLocal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Reanudar desde .opo/workspace.json existente</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Introspection loader */}
          {step === 2 && (
            <motion.div
              key="step-scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-neutral-900/30 border border-neutral-800 p-8 rounded-2xl flex flex-col items-center justify-center space-y-8"
            >
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-16 h-16 animate-spin text-violet-500 opacity-60" />
                <Database className="w-6 h-6 text-violet-400 absolute" />
              </div>

              <div className="space-y-4 w-full max-w-md">
                <div className="text-center space-y-1.5">
                  <h3 className="font-semibold text-neutral-200">Introspección Semántica</h3>
                  <p className="text-xs text-neutral-500">Mapeando diccionario de datos SX del sistema...</p>
                </div>

                <div className="space-y-2 bg-neutral-950/80 border border-neutral-850 p-4 rounded-xl font-mono text-[10px] text-neutral-400">
                  {SCAN_LABELS.map((lbl, idx) => {
                    const done = scanDone[idx];
                    const active = scanIndex === idx;
                    return (
                      <div key={lbl} className="flex items-center space-x-2">
                        {done ? (
                          <span className="text-emerald-400">✓</span>
                        ) : active ? (
                          <span className="text-violet-400 animate-pulse">⠋</span>
                        ) : (
                          <span className="text-neutral-700">·</span>
                        )}
                        <span className={done ? 'text-neutral-400' : active ? 'text-neutral-200 font-semibold' : 'text-neutral-600'}>
                          {lbl}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Success screen */}
          {step === 3 && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-neutral-900/40 border border-neutral-800 p-8 rounded-2xl text-center space-y-8"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl">
                ✓
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-white">¡Mapeo del ERP completado!</h3>
                <p className="text-sm text-neutral-400 max-w-md mx-auto">
                  La estructura de su sistema Protheus fue procesada con éxito y el archivo de ontología ya está en su espacio de trabajo.
                </p>
              </div>

              {/* Discovery Stats */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto bg-neutral-950/60 p-4 rounded-xl border border-neutral-850">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-violet-400">{discoverStats.entities}</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Entidades SX2</span>
                </div>
                <div className="text-center border-l border-neutral-850">
                  <span className="block text-2xl font-bold text-violet-400">{discoverStats.relationships}</span>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Relaciones SX9</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleFinishConsultas}
                  className="py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/15"
                >
                  <span>Empezar a consultar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleFinishStudio}
                  className="py-3 px-6 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Abrir Studio Avanzado</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}