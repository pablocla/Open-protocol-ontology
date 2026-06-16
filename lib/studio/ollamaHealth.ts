export interface OllamaHealthResult {
  ok: boolean;
  models: string[];
  error?: string;
}

export async function checkOllamaHealth(baseUrl: string): Promise<OllamaHealthResult> {
  const normalized = baseUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${normalized}/api/tags`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      return { ok: false, models: [], error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const models = (data.models || []).map((m) => m.name).filter(Boolean);
    return { ok: models.length > 0, models, error: models.length ? undefined : 'Sin modelos instalados' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo conectar';
    return { ok: false, models: [], error: message };
  }
}

export async function checkOllamaViaApi(baseUrl?: string): Promise<OllamaHealthResult> {
  const res = await fetch('/api/studio/ollama-health', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl }),
  });
  const data = await res.json();
  return data as OllamaHealthResult;
}