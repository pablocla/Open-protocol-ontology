import { useState, useEffect } from 'react';
import { Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { checkOllamaViaApi } from '@/lib/studio/ollamaHealth';

interface OllamaSetupFormProps {
  initialProvider?: 'ollama' | 'gemini' | 'openai';
  initialBaseUrl?: string;
  initialModel?: string;
  initialApiKey?: string;
  onVerified: (config: {
    provider: 'ollama' | 'gemini' | 'openai';
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    cloudApiKey?: string;
  }) => void;
}

export default function OllamaSetupForm({
  initialProvider = 'ollama',
  initialBaseUrl = 'http://localhost:11434',
  initialModel = 'llama3.1',
  initialApiKey = '',
  onVerified,
}: OllamaSetupFormProps) {
  const [provider, setProvider] = useState<'ollama' | 'gemini' | 'openai'>(initialProvider);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [model, setModel] = useState(initialModel);
  const [apiKey, setApiKey] = useState(initialApiKey);
  
  const [modelsList, setModelsList] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (provider === 'ollama') {
      // Auto test connection on mount to populate models if possible
      void testOllamaConnection(false);
    }
  }, [provider]);

  const testOllamaConnection = async (showToast = true) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await checkOllamaViaApi(baseUrl.trim());
      if (res.ok) {
        setModelsList(res.models);
        setTestResult({ ok: true, message: `Conexión exitosa. ${res.models.length} modelos disponibles.` });
        if (res.models.length > 0 && !res.models.includes(model)) {
          setModel(res.models[0]);
        }
      } else {
        setTestResult({
          ok: false,
          message: res.error || 'Ollama no responde. ¿Está corriendo localmente?',
        });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || 'Error de conexión' });
    } finally {
      setTesting(false);
    }
  };

  const testCloudConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/studio/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentProvider: provider,
          apiKeys: { [provider]: apiKey.trim() },
        }),
      });
      const data = await res.json();
      if (data.ai && data.ai.status === 'ok') {
        setTestResult({ ok: true, message: 'API Key verificada con éxito.' });
      } else {
        setTestResult({
          ok: false,
          message: data.ai?.error || `No pudimos verificar la API Key de ${provider}.`,
        });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || 'Error de verificación' });
    } finally {
      setTesting(false);
    }
  };

  const handleTest = () => {
    if (provider === 'ollama') {
      void testOllamaConnection(true);
    } else {
      void testCloudConnection();
    }
  };

  const handleContinue = () => {
    onVerified({
      provider,
      ollamaBaseUrl: provider === 'ollama' ? baseUrl.trim() : undefined,
      ollamaModel: provider === 'ollama' ? model : undefined,
      cloudApiKey: provider !== 'ollama' ? apiKey.trim() : undefined,
    });
  };

  return (
    <div className="space-y-6 bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-6 rounded-2xl">
      <div className="flex items-center space-x-2 text-violet-400">
        <Sparkles className="w-5 h-5" />
        <h2 className="text-lg font-semibold tracking-wide">Configurá su Asistente IA</h2>
      </div>

      {/* Provider selector */}
      <div className="grid grid-cols-3 gap-3">
        {(['ollama', 'gemini', 'openai'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setProvider(p);
              setTestResult(null);
            }}
            className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1.5 ${
              provider === p
                ? 'bg-violet-600/15 border-violet-500 text-violet-300'
                : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900/30'
            }`}
          >
            <span className="text-base">{p === 'ollama' ? '🦙' : p === 'gemini' ? '✨' : '🟢'}</span>
            <span className="capitalize">{p === 'ollama' ? 'Ollama (Local)' : p}</span>
          </button>
        ))}
      </div>

      {/* Connection options */}
      <div className="space-y-4">
        {provider === 'ollama' ? (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">URL del Servidor</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
                placeholder="http://localhost:11434"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Modelo local</label>
              {modelsList.length > 0 ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 text-neutral-300"
                >
                  {modelsList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 text-neutral-400 font-mono"
                  placeholder="llama3.1"
                />
              )}
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">API Key de {provider === 'gemini' ? 'Gemini' : 'OpenAI'}</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
              placeholder={`Pegar clave api de ${provider === 'gemini' ? 'Google AI Studio' : 'OpenAI'}`}
            />
          </div>
        )}
      </div>

      {/* Test feedback */}
      {testResult && (
        <div
          className={`flex items-start space-x-3 p-3.5 rounded-xl border text-xs leading-relaxed ${
            testResult.ok
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/30 border-red-500/30 text-red-300'
          }`}
        >
          {testResult.ok ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex space-x-3 pt-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="flex-1 py-2.5 px-4 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {testing && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
          <span>{testing ? 'Verificando...' : 'Probar conexión'}</span>
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!testResult?.ok}
          className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
