import { NextResponse } from 'next/server';
import { checkOllamaHealth } from '@/lib/studio/ollamaHealth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const baseUrl =
      typeof body.baseUrl === 'string' && body.baseUrl.trim()
        ? body.baseUrl.trim()
        : 'http://localhost:11434';

    const result = await checkOllamaHealth(baseUrl);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ollama health check failed';
    return NextResponse.json({ ok: false, models: [], error: message }, { status: 500 });
  }
}