import { resolveApiKey } from '@/lib/mesh/vaultResolver';
import { checkOllamaHealth } from '@/lib/studio/ollamaHealth';
import { executeParameterizedSql } from '@/lib/studio/sqlExecutor';
import { detectDriverFromUrl } from '@/lib/mesh/adapters/totvs/protheusDbClient';

export type HealthStatus = 'ok' | 'warn' | 'error' | 'skip';

export interface HealthCheckResult {
  status: HealthStatus;
  label: string;
  latencyMs?: number;
  error?: string;
}

export interface StudioHealthResult {
  erp: HealthCheckResult;
  ai: HealthCheckResult;
  dataMode: 'demo' | 'live';
  canQuery: boolean;
  checkedAt: number;
}

export interface StudioHealthInput {
  dataMode?: 'demo' | 'live';
  connectionString?: string;
  filial?: string;
  erpId?: string | null;
  dialect?: string;
  currentProvider?: string;
  ollamaBaseUrl?: string;
}

const PING_SQL: Record<string, string> = {
  mssql: 'SELECT 1 AS ping',
  postgresql: 'SELECT 1 AS ping',
  oracle: 'SELECT 1 AS ping FROM DUAL',
};

async function pingErp(input: StudioHealthInput): Promise<HealthCheckResult> {
  const mode = input.dataMode ?? 'demo';

  if (mode !== 'live') {
    return {
      status: 'warn',
      label: 'Demostración — datos de ejemplo',
    };
  }

  const connectionString = input.connectionString?.trim();
  if (!connectionString) {
    return {
      status: 'error',
      label: 'Sin conexión ERP',
      error: 'Configurá la conexión en Ajustes para usar datos reales.',
    };
  }

  if (input.erpId === 'protheus' && !input.filial?.trim()) {
    return {
      status: 'error',
      label: 'Filial requerida',
      error: 'Indicá la filial de Protheus en Ajustes.',
    };
  }

  const driver = (input.dialect as 'mssql' | 'postgresql' | 'oracle') || detectDriverFromUrl(connectionString);
  const sql = PING_SQL[driver] || PING_SQL.postgresql;
  const started = Date.now();

  try {
    await executeParameterizedSql({ connectionString, sql, driver });
    const latencyMs = Date.now() - started;
    const filialHint = input.filial?.trim() ? ` · Filial ${input.filial.trim()}` : '';
    return {
      status: 'ok',
      label: `ERP conectado${filialHint}`,
      latencyMs,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return {
      status: 'error',
      label: 'ERP no responde',
      latencyMs: Date.now() - started,
      error: message,
    };
  }
}

interface CacheEntry {
  result: HealthCheckResult;
  timestamp: number;
}
const aiHealthCache: Record<string, CacheEntry> = {};

async function pingAi(input: StudioHealthInput): Promise<HealthCheckResult> {
  const provider = (input.currentProvider || 'gemini').toLowerCase();
  const started = Date.now();

  if (provider === 'ollama' || provider === 'open-code') {
    const baseUrl = input.ollamaBaseUrl?.trim() || 'http://localhost:11434';
    const result = await checkOllamaHealth(baseUrl);
    const latencyMs = Date.now() - started;
    if (result.ok) {
      return {
        status: 'ok',
        label: `IA local (${provider})`,
        latencyMs,
      };
    }
    return {
      status: 'error',
      label: 'IA local no disponible',
      latencyMs,
      error: result.error || 'Ollama no responde',
    };
  }

  const apiKey = resolveApiKey(provider);
  if (!apiKey) {
    return {
      status: 'warn',
      label: `Sin clave ${provider}`,
      error: 'Configurá la API key en Ajustes o variables de entorno.',
    };
  }

  // 30-second memory caching
  const cacheKey = `${provider}:${apiKey.substring(0, 8)}`;
  const cached = aiHealthCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let url = '';
    const headers: Record<string, string> = {};

    if (provider === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${apiKey}`;
    } else if (provider === 'openai') {
      url = 'https://api.openai.com/v1/models';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === 'grok') {
      url = 'https://api.x.ai/v1/models';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      url = 'https://api.openai.com/v1/models'; // fallback/openrouter
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      throw new Error(`Credenciales inválidas (HTTP ${res.status})`);
    }

    const latencyMs = Date.now() - started;
    const result: HealthCheckResult = {
      status: 'ok',
      label: `Asistente listo (${provider})`,
      latencyMs,
    };
    aiHealthCache[cacheKey] = { result, timestamp: Date.now() };
    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - started;
    const errorMsg = err.name === 'AbortError' ? 'Tiempo de espera agotado (5s)' : err.message;
    const result: HealthCheckResult = {
      status: 'error',
      label: `Error de conexión con ${provider}`,
      latencyMs,
      error: errorMsg,
    };
    aiHealthCache[cacheKey] = { result, timestamp: Date.now() - 25000 }; // try again in 5s
    return result;
  }
}

export async function checkStudioHealth(input: StudioHealthInput): Promise<StudioHealthResult> {
  const dataMode = input.dataMode === 'live' ? 'live' : 'demo';
  const [erp, ai] = await Promise.all([pingErp({ ...input, dataMode }), pingAi(input)]);

  const canQuery =
    dataMode === 'demo' || (erp.status === 'ok' && ai.status !== 'error');

  return {
    erp,
    ai,
    dataMode,
    canQuery,
    checkedAt: Date.now(),
  };
}