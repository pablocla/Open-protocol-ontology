import { useState } from 'react';
import { Database, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { buildMssqlConnectionString, parseMssqlConnectionString } from '@/lib/studio/onboarding/connectionBuilder';

interface ProtheusConnectionFormProps {
  initialMode?: 'demo' | 'live';
  initialConnectionString?: string;
  initialFilial?: string;
  initialCompanySuffix?: string;
  onVerified: (config: {
    dataMode: 'demo' | 'live';
    connectionString?: string;
    filial: string;
    companySuffix: string;
    mssql?: any;
  }) => void;
  onSkipDemo?: () => void;
  submitButtonLabel?: string;
  showReScan?: boolean;
  onReScan?: (config: any) => Promise<void> | void;
  isScanning?: boolean;
}

export default function ProtheusConnectionForm({
  initialMode = 'live',
  initialConnectionString = '',
  initialFilial = '01',
  initialCompanySuffix = '010',
  onVerified,
  onSkipDemo,
  submitButtonLabel = 'Continuar',
  showReScan = false,
  onReScan,
  isScanning = false,
}: ProtheusConnectionFormProps) {
  const [dataMode, setDataMode] = useState<'demo' | 'live'>(initialMode);
  
  // SSMS connection form fields
  const parsedMssql = parseMssqlConnectionString(initialConnectionString);
  const [server, setServer] = useState(parsedMssql?.server || '');
  const [port, setPort] = useState<number>(parsedMssql?.port || 1433);
  const [database, setDatabase] = useState(parsedMssql?.database || '');
  const [user, setUser] = useState(parsedMssql?.user || '');
  const [password, setPassword] = useState(parsedMssql?.password || '');
  const [encrypt, setEncrypt] = useState(parsedMssql?.encrypt ?? false);
  const [trustServer, setTrustServer] = useState(parsedMssql?.trustServerCertificate ?? true);

  const [filial, setFilial] = useState(initialFilial);
  const [companySuffix, setCompanySuffix] = useState(initialCompanySuffix);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const getBuiltConfig = () => {
    if (dataMode === 'demo') {
      return {
        dataMode,
        filial: filial.trim() || '01',
        companySuffix: companySuffix.trim() || '010',
      };
    }

    const mssql = {
      server: server.trim(),
      port: Number(port) || 1433,
      database: database.trim(),
      user: user.trim() || undefined,
      password: password || undefined,
      encrypt,
      trustServerCertificate: trustServer,
    };

    const connectionString = buildMssqlConnectionString(mssql);
    return {
      dataMode,
      connectionString,
      filial: filial.trim() || '01',
      companySuffix: companySuffix.trim() || '010',
      mssql,
    };
  };

  const handleTestConnection = async () => {
    if (!server.trim() || !database.trim()) {
      setTestResult({ ok: false, message: 'Faltan campos obligatorios: Servidor y Base de Datos.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const config = getBuiltConfig();
    try {
      const res = await fetch('/api/studio/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataMode: 'live',
          connectionString: config.connectionString,
          filial: config.filial,
          dialect: 'mssql',
          erpId: 'protheus',
        }),
      });

      const data = await res.json();
      if (data.erp && data.erp.status === 'ok') {
        setTestResult({ ok: true, message: '¡Conexión al ERP establecida con éxito!' });
      } else {
        const errDetail = data.erp?.error || 'No pudimos conectarnos al servidor SQL.';
        setTestResult({
          ok: false,
          message: `Error de conexión: ${errDetail}. ¿Estás conectado a la VPN? ¿El puerto ${port} está abierto?`,
        });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: `No se pudo conectar: ${e.message || 'Error del servidor Next.js'}` });
    } finally {
      setTesting(false);
    }
  };

  const handleContinue = () => {
    const config = getBuiltConfig();
    if (dataMode === 'live' && !testResult?.ok) {
      // Force connection check in live mode
      void handleTestConnection();
      return;
    }
    onVerified(config);
  };

  return (
    <div className="space-y-6 bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-6 rounded-2xl">
      <div className="flex items-center space-x-2 text-violet-400">
        <Database className="w-5 h-5" />
        <h2 className="text-lg font-semibold tracking-wide">Configurá la Conexión de su ERP</h2>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-850">
        <button
          type="button"
          onClick={() => {
            setDataMode('live');
            setTestResult(null);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            dataMode === 'live'
              ? 'bg-violet-600 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Conectar Base Real (En vivo)
        </button>
        <button
          type="button"
          onClick={() => {
            setDataMode('demo');
            setTestResult(null);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            dataMode === 'demo'
              ? 'bg-violet-600 text-white shadow'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Usar Demostración (Mock)
        </button>
      </div>

      {dataMode === 'live' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Servidor / Host</label>
              <input
                type="text"
                value={server}
                onChange={(e) => {
                  setServer(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
                placeholder="ej: 192.168.1.100 o localhost\SQLEXPRESS"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Puerto</label>
              <input
                type="number"
                value={port}
                onChange={(e) => {
                  setPort(Number(e.target.value));
                  setTestResult(null);
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
                placeholder="1433"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Base de Datos SQL</label>
            <input
              type="text"
              value={database}
              onChange={(e) => {
                setDatabase(e.target.value);
                setTestResult(null);
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
              placeholder="ej: PROTHEUS_PROD"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Usuario SQL</label>
              <input
                type="text"
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
                placeholder="sa o opo_read"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-1">
            <label className="flex items-center space-x-2 text-xs text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={encrypt}
                onChange={(e) => {
                  setEncrypt(e.target.checked);
                  setTestResult(null);
                }}
                className="rounded border-neutral-800 text-violet-600 focus:ring-violet-500 bg-neutral-950"
              />
              <span>Cifrar conexión (Encrypt)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={trustServer}
                onChange={(e) => {
                  setTrustServer(e.target.checked);
                  setTestResult(null);
                }}
                className="rounded border-neutral-800 text-violet-600 focus:ring-violet-500 bg-neutral-950"
              />
              <span>Confiar en Certificado</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-850 text-xs text-neutral-400 leading-relaxed">
          💡 <strong>Modo Demostración activo:</strong> Se cargará la estructura base del diccionarioSX2/SX3/SX9 con datos simulados (mock) para probar las consultas de compras, ventas y stock inmediatamente.
        </div>
      )}

      {/* Common Protheus Parameters */}
      <div className="border-t border-neutral-850 pt-4 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Filial Protheus</label>
          <input
            type="text"
            value={filial}
            onChange={(e) => setFilial(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
            placeholder="ej: 01"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Sufijo de tablas</label>
          <input
            type="text"
            value={companySuffix}
            onChange={(e) => setCompanySuffix(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-violet-500 font-mono text-neutral-300"
            placeholder="010 (SX2010)"
          />
        </div>
      </div>

      {/* Connection result feedback */}
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

      {/* Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex space-x-3">
          {dataMode === 'live' && (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || isScanning}
              className="flex-1 py-2.5 px-4 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {testing && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
              <span>{testing ? 'Conectando...' : 'Probar conexión'}</span>
            </button>
          )}

          {dataMode === 'demo' && onSkipDemo && (
            <button
              type="button"
              onClick={onSkipDemo}
              disabled={isScanning}
              className="flex-1 py-2.5 px-4 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 font-semibold rounded-xl text-sm transition-all"
            >
              Saltar a consultas
            </button>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={(dataMode === 'live' && !testResult?.ok) || isScanning}
            className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center"
          >
            {submitButtonLabel}
          </button>
        </div>

        {showReScan && onReScan && (
          <button
            type="button"
            onClick={() => onReScan(getBuiltConfig())}
            disabled={isScanning || (dataMode === 'live' && !testResult?.ok)}
            className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-750 text-violet-400 font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 border border-violet-900/30 disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
            )}
            <span>{isScanning ? 'Analizando estructura...' : 'Re-escanear estructura (Discover)'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
