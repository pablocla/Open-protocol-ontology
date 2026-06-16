import { X, Key, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { useStudioStore } from '@/store/useStudioStore';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ProtheusConnectionForm from './ProtheusConnectionForm';

// GROK OPTIMIZATION: Also surface server-side Vault keys in Studio Settings (makes the Credential Vault usable from the UI)
interface VaultKey {
  id: string;
  provider: string;
  name: string;
  createdAt: number;
}

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { apiKeys, setApiKey, erpWorkspace, setErpWorkspace } = useStudioStore();
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isScanning, setIsScanning] = useState(false);

  const handleReScan = async (formConfig: any) => {
    setIsScanning(true);
    try {
      const aiProvider = useStudioStore.getState().currentProvider || 'gemini';
      const configForProvider = useStudioStore.getState().llmConfigs[aiProvider] || {};
      const aiConfig = {
        provider: aiProvider,
        ollamaBaseUrl: configForProvider.baseUrl || 'http://localhost:11434',
        ollamaModel: configForProvider.model || 'llama3.1',
        cloudApiKey: configForProvider.apiKey || useStudioStore.getState().apiKeys[aiProvider] || '',
      };

      const onboardConfig = {
        ai: aiConfig,
        erp: {
          erpId: erpWorkspace.erpId || 'protheus',
          dataMode: formConfig.dataMode,
          mssql: formConfig.mssql,
          connectionString: formConfig.connectionString,
          filial: formConfig.filial,
          companySuffix: formConfig.companySuffix,
        },
      };

      const res = await fetch('/api/studio/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardConfig),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'No se pudo realizar el re-escaneo');
      }

      // Update Zustand store
      const store = useStudioStore.getState();
      store.loadProjectData(
        { name: result.projectName },
        result.nodes,
        result.edges
      );
      store.setErpWorkspace(result.erpWorkspace);
      toast.success('¡Re-escaneo completado con éxito!');
    } catch (e: any) {
      toast.error(`Fallo en el re-escaneo: ${e.message || 'Comprobá su conexión.'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveConnection = (config: any) => {
    setErpWorkspace(config);
    toast.success('Conexión guardada correctamente.');
  };

  const handleClose = () => {
    if (erpWorkspace.dataMode === 'live' && erpWorkspace.erpId === 'protheus' && !erpWorkspace.filial.trim()) {
      toast.warning('Modo cambiado a Demostración por falta de filial para Protheus en vivo.');
      setErpWorkspace({ dataMode: 'demo' });
    }
    onClose();
  };

  const handleDone = () => {
    if (erpWorkspace.dataMode === 'live' && erpWorkspace.erpId === 'protheus' && !erpWorkspace.filial.trim()) {
      toast.error('La filial es requerida para el modo en vivo de Protheus.');
      return;
    }
    onClose();
  };

  const [vaultKeys, setVaultKeys] = useState<VaultKey[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);

  async function loadVaultKeys() {
    setIsLoadingVault(true);
    try {
      const res = await fetch('/api/vault');
      const data = await res.json();
      if (data.success) setVaultKeys(data.keys || []);
    } catch (e) {
      // Non-fatal for the modal
    } finally {
      setIsLoadingVault(false);
    }
  }

  async function saveKeyToVault(provider: string, apiKey: string) {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          name: 'default',
          apiKey
        })
      });
      if (res.ok) {
        toast.success(`Key for ${provider} saved to server vault.`);
        loadVaultKeys();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`Failed to save key: ${err.error || 'Unknown error'}`);
      }
    } catch (e) {
      toast.error('Network error saving key to vault');
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadVaultKeys();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!apiKeys.gemini) {
      toast.error('Please enter a Gemini API Key first.');
      return;
    }
    
    setIsTesting(true);
    setTestStatus('idle');
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
      });
      
      if (res.ok) {
        setTestStatus('success');
        toast.success('Connection successful! API Key is valid.');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error:', errorData);
        setTestStatus('error');
        toast.error('Invalid API Key. Connection failed.');
      }
    } catch (error) {
      setTestStatus('error');
      toast.error('Network error during validation.');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-200">Settings & API Keys</h2>
          </div>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-neutral-400 mb-4">
            Choose the AI provider for OPO Studio execution and agents. Configure as many as you want — switch anytime. Stored locally.
          </p>

          {/* Prominent one-click for Ollama since the user confirmed it is running */}
          <div className="bg-emerald-900/30 border border-emerald-700 rounded p-3 mb-2">
            <button
              onClick={async () => {
                const base = 'http://localhost:11434';
                try {
                  const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(800) });
                  if (res.ok) {
                    const data = await res.json();
                    useStudioStore.getState().setCurrentProvider('ollama');
                    useStudioStore.getState().setLLMConfig('ollama', { baseUrl: base });
                    toast.success(`✅ Ollama connected at ${base}! Models: ${data.models?.map((m:any)=>m.name).slice(0,3).join(', ')}`);
                  } else {
                    toast.error('Ollama is running but /api/tags did not respond as expected.');
                  }
                } catch {
                  toast.error('Could not connect to Ollama at localhost:11434. Confirm it is really running on that port.');
                }
              }}
              className="w-full text-sm bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-medium flex items-center justify-center gap-2"
            >
              🚀 Quick-connect running Ollama (set as active provider + default URL)
            </button>
            <p className="text-center text-emerald-300 text-[10px] mt-1">Perfect for local/privacy-friendly development of agents &amp; automations</p>
          </div>

          {/* Special quick connect because you confirmed Ollama is running */}
          <div className="bg-emerald-950/40 border border-emerald-700 rounded p-3 -mt-1 mb-3">
            <button
              onClick={async () => {
                const base = 'http://localhost:11434';
                try {
                  const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(900) });
                  if (res.ok) {
                    const data = await res.json();
                    useStudioStore.getState().setCurrentProvider('ollama');
                    useStudioStore.getState().setLLMConfig('ollama', { baseUrl: base });
                    toast.success(`✅ Ollama connected! Models: ${data.models?.map((m:any) => m.name).slice(0,4).join(', ')}`);
                  } else {
                    toast.error('Ollama responded but /api/tags failed.');
                  }
                } catch (err) {
                  toast.error('Could not reach Ollama at localhost:11434. Confirm it is running and the port.');
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium py-2 rounded flex items-center justify-center gap-2"
            >
              🚀 One-click: Connect to running Ollama + make it the active provider
            </button>
            <div className="text-center text-emerald-300 text-[10px] mt-1">Uses default http://localhost:11434 — perfect for local development of agents &amp; automations</div>
          </div>

          {/* Global Active Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Active Provider (global for now, per-agent coming)</label>
            <select
              value={useStudioStore.getState().currentProvider || 'gemini'}
              onChange={(e) => {
                const provider = e.target.value as any;
                useStudioStore.getState().setCurrentProvider(provider);
                toast.success(`Switched to ${provider}`);
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white"
            >
              <option value="open-code">Open Code (Local coding models via Ollama)</option>
              <option value="ollama">Ollama (Local general)</option>
              <option value="openrouter">OpenRouter (Unified 400+ models + routing)</option>
              <option value="grok">Grok (xAI)</option>
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </select>
            <p className="text-[10px] text-neutral-500">Use the configs below. Agents will use the active one unless overridden in the DigitalEmployee.</p>
          </div>

          {/* Config per provider - user can fill what they want */}
          {[
            { prov: 'ollama', label: 'Ollama (connect local models)', fields: ['baseUrl', 'model'] },
            { prov: 'open-code', label: 'Open Code (Ollama coding models like codellama/deepseek-coder)', fields: ['baseUrl', 'model'] },
            { prov: 'openrouter', label: 'OpenRouter (one key for hundreds of models)', fields: ['apiKey', 'model'] },
            { prov: 'grok', label: 'Grok / xAI', fields: ['apiKey', 'model'] },
            { prov: 'gemini', label: 'Google Gemini', fields: ['apiKey', 'model'] },
            { prov: 'openai', label: 'OpenAI', fields: ['apiKey', 'model'] },
            { prov: 'anthropic', label: 'Anthropic Claude', fields: ['apiKey', 'model'] },
          ].map(({ prov, label, fields }) => {
            const config = useStudioStore.getState().llmConfigs[prov] || {};
            const isConfigured = (prov === 'ollama' || prov === 'open-code')
              ? !!config.baseUrl
              : (!!config.apiKey || vaultKeys.some(k => k.provider.toLowerCase() === prov.toLowerCase()));

            return (
              <div key={prov} className="border border-neutral-700 rounded p-3 space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-medium text-neutral-300">{label}</label>
                  <span className={`text-[10px] px-1 rounded ${isConfigured ? 'bg-emerald-900 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                    {isConfigured ? 'configured' : 'not set'}
                  </span>
                </div>

                {fields.includes('baseUrl') && (
                  <input
                    type="text"
                    placeholder="http://localhost:11434"
                    value={config.baseUrl || ''}
                    onChange={(e) => {
                      useStudioStore.getState().setLLMConfig(prov, { baseUrl: e.target.value });
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs"
                  />
                )}

                {fields.includes('apiKey') && (
                  <input
                    type="password"
                    placeholder={prov === 'openrouter' ? 'sk-or-...' : 'API key...'}
                    value={config.apiKey || ''}
                    onChange={(e) => {
                      useStudioStore.getState().setLLMConfig(prov, { apiKey: e.target.value });
                    }}
                    onBlur={(e) => {
                      saveKeyToVault(prov, e.target.value);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs"
                  />
                )}

                <input
                  type="text"
                  placeholder={prov.includes('ollama') || prov === 'open-code' ? 'llama3.1 or codellama' : 'model name (optional, uses default)'}
                  value={config.model || ''}
                  onChange={(e) => {
                    useStudioStore.getState().setLLMConfig(prov, { model: e.target.value });
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs"
                />

                {(prov === 'ollama' || prov === 'open-code') && (
                  <button
                    onClick={async () => {
                      const base = config.baseUrl || 'http://localhost:11434';
                      try {
                        const res = await fetch(`${base}/api/tags`);
                        if (res.ok) {
                          const data = await res.json();
                          toast.success(`Ollama connected! Models: ${data.models?.map((m:any)=>m.name).join(', ') || 'ok'}`);
                        } else {
                          toast.error('Could not connect to Ollama. Is it running?');
                        }
                      } catch {
                        toast.error('Ollama connection failed. Check URL and that Ollama is started.');
                      }
                    }}
                    className="text-[10px] px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded"
                  >
                    Test Ollama Connection
                  </button>
                )}

                {prov === 'openrouter' && config.apiKey && (
                  <p className="text-[9px] text-emerald-400">Tip: In model field you can put 'openai/gpt-4o' or leave for routing. Supports fallbacks.</p>
                )}
              </div>
            );
          })}

          {/* Server Vault Keys (read-only list + delete) — improves functional visibility of the Credential Vault */}
          <div className="pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300">Server Vault Keys (for Mesh execution)</label>
              <button 
                onClick={loadVaultKeys} 
                className="text-[10px] text-neutral-400 hover:text-neutral-200"
                disabled={isLoadingVault}
              >
                {isLoadingVault ? '...' : 'Refresh'}
              </button>
            </div>
            {vaultKeys.length === 0 ? (
              <p className="text-[11px] text-neutral-500">No keys stored in the server vault yet. Use the Vault API or Dashboard to add them.</p>
            ) : (
              <div className="space-y-1 max-h-24 overflow-auto text-xs">
                {vaultKeys.map(k => (
                  <div key={k.id} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 px-2 py-1 rounded">
                    <span className="font-mono truncate">{k.provider}:{k.name}</span>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this key from the vault?')) return;
                        await fetch(`/api/vault?id=${k.id}`, { method: 'DELETE' });
                        loadVaultKeys();
                        toast.success('Key removed from vault');
                      }}
                      className="text-red-400 hover:text-red-300 p-0.5"
                      title="Delete from server vault"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ERP Workspace Connection */}
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <ProtheusConnectionForm
              initialMode={erpWorkspace.dataMode || 'demo'}
              initialConnectionString={erpWorkspace.connectionString || ''}
              initialFilial={erpWorkspace.filial || '01'}
              initialCompanySuffix={erpWorkspace.companySuffix || '010'}
              submitButtonLabel="Guardar conexión"
              showReScan={true}
              onReScan={handleReScan}
              isScanning={isScanning}
              onVerified={handleSaveConnection}
            />
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={handleDone}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
