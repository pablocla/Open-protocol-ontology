import { GoogleGenAI } from '@google/genai';
import { SwarmMemory } from '../engine/blackboard/blackboard';

/**
 * Unified LLM caller for OPO Studio.
 * Supports: ollama, grok (xai), gemini, openai, anthropic.
 * 
 * For ALPHA we implement real calls for Gemini + Ollama.
 * Others fall back to a clear error or can be extended.
 */

export type LLMProvider = 'ollama' | 'grok' | 'gemini' | 'openai' | 'anthropic' | 'open-code' | 'openrouter'; // widened for per-agent + mosaic + studio settings (GROK)

export interface LLMCallOptions {
  provider: LLMProvider;
  apiKey: string;           // for ollama this is the baseUrl
  systemInstruction?: string;
  model?: string;
}

function cacheKey(provider: string, model: string | undefined, system: string | undefined, p: string): string {
  const base = `${provider}|${model || ''}|${system || ''}|${p}`;
  // cheap hash
  let h = 0; for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) | 0;
  return String(h);
}

async function storeCache(provider: string, model: string | undefined, system: string | undefined, p: string, value: string) {
  if (provider === 'open-code') return;
  const hash = cacheKey(provider, model, system, p);
  const key = `opo:llm:cache:${hash}`;
  await SwarmMemory.set(key, value, 600); // 10 min TTL
}

export async function callLLM(prompt: string, opts: LLMCallOptions): Promise<string> {
  const { provider, apiKey, systemInstruction, model } = opts;

  // cache check (skip for providers that are very cheap/local or when explicitly wanted non-cached)
  const shouldCache = provider !== 'open-code'; // ollama is fast+non-deterministic (skip top-level read); open-code wants fresh generations. Per-branch stores still populate for identical repeats.
  if (shouldCache) {
    const hash = cacheKey(provider, model, systemInstruction, prompt);
    const key = `opo:llm:cache:${hash}`;
    const hit = await SwarmMemory.get(key);
    if (hit) {
      return hit;
    }
  }

  if (provider === 'gemini') {
    if (!apiKey) throw new Error('Gemini API key required. Set it in Settings.');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction }
    });
    const geminiText = response.text || '';
    await storeCache(provider, model, systemInstruction, prompt, geminiText);
    return geminiText;
  }

  if (provider === 'ollama') {
    const baseUrl = apiKey || 'http://localhost:11434';
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.1',
        prompt,
        system: systemInstruction,
        stream: false,
        options: { temperature: 0.7 }
      })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama request failed (is it running at ${baseUrl}?): ${errText}`);
    }
    const data = await res.json();
    const ollamaText = data.response || '';
    await storeCache(provider, model, systemInstruction, prompt, ollamaText);
    return ollamaText;
  }

  // "Open Code" mode: Dedicated support for local/open coding agents via Ollama.
  // Perfect for "Vibe Coding" generation of automations, DigitalEmployees, Protheus scripts,
  // n8n workflows, MCP tools, agent behaviors, etc. without sending proprietary code/data to the cloud.
  if (provider === 'open-code' || ((provider as any) === 'ollama' && (model?.toLowerCase().includes('code') || model?.toLowerCase().includes('coder')))) {
    const baseUrl = apiKey || 'http://localhost:11434';
    const codingSystem = systemInstruction || 
      "You are an expert open-source code generation specialist. " +
      "Focus on producing clean, secure, well-documented, production-ready code. " +
      "Always include comments explaining the business logic. " +
      "Prefer standard libraries and avoid unnecessary dependencies. " +
      "If the task involves ERP/Protheus integration, suggest safe, auditable approaches.";

    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'codellama:13b' || 'deepseek-coder:6.7b',
        prompt: prompt,
        system: codingSystem,
        stream: false,
        options: { temperature: 0.3, top_p: 0.9 } // Lower temp for more deterministic code
      })
    });
    if (!res.ok) throw new Error(`Open Code (Ollama) request failed. Is Ollama running with a code model?`);
    const data = await res.json();
    const codeText = data.response || '';
    await storeCache('open-code', model, codingSystem, prompt, codeText); // store under open-code key for future identical vibe-coding prompts
    return codeText;
  }

  // For grok / openai / anthropic we can use OpenAI-compatible endpoints
  if (['grok', 'openai'].includes(provider)) {
    const base = provider === 'grok' ? 'https://api.x.ai/v1' : 'https://api.openai.com/v1';
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || (provider === 'grok' ? 'grok-2' : 'gpt-4o'),
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!res.ok) throw new Error(`${provider} API error`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    await storeCache(provider, model, systemInstruction, prompt, text);
    return text;
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemInstruction,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) throw new Error('Anthropic API error');
    const data = await res.json();
    const anthText = data.content?.[0]?.text || '';
    await storeCache(provider, model, systemInstruction, prompt, anthText);
    return anthText;
  }

  // OpenRouter: Unified gateway to 400+ models (OpenAI-compatible)
  // Solves fragmentation: single API key + intelligent routing across providers/models.
  // Great for cost optimization, fallbacks, and accessing specialized models (coding, reasoning, cheap open-source).
  // In OPO: Use for dynamic model selection per role in a DigitalEmployee swarm,
  // or let OpenRouter auto-route based on your config (e.g. cheapest suitable for simple tasks).
  if (provider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://opo-studio.example.com', // optional, for rankings
        'X-Title': 'OPO Studio'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o', // or 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.1-70b', etc.
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ]
        // OpenRouter supports extra params like route: 'fallback', 'cheapest', etc.
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error(`Provider ${provider} not yet fully implemented.`);
}
