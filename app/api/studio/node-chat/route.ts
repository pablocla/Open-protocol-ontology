import { NextResponse } from 'next/server';

// API for per-node chat (Mosaic view)
// Uses the node's systemPrompt + history to chat with Ollama directly for isolated interaction.
// Supports streaming for real-time "Vibe Coding" and auto-configuration of the agent.

export async function POST(request: Request) {
  try {
    // GROK FIX #1: receive apiKeys/llmConfigs/currentProvider from client NodeChatInterface so cloud mosaic chats succeed with real user keys
    const { 
      nodeId, 
      messages, 
      systemPrompt, 
      model = 'llama3.1', 
      baseUrl = 'http://localhost:11434', 
      llmProvider = 'ollama',
      apiKeys = {},
      llmConfigs = {},
      currentProvider
    } = await request.json();

    if (!nodeId || !messages || !systemPrompt) {
      return NextResponse.json({ error: 'Missing nodeId, messages or systemPrompt' }, { status: 400 });
    }

    // Build chat messages: system + history
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    // If not local Ollama/open-code, use unified callLLM with real key from client-provided state
    const isLocal = llmProvider === 'ollama' || llmProvider === 'open-code' || !llmProvider;

    if (!isLocal) {
      const { callLLM } = await import('@/lib/mesh/llm');
      const { resolveApiKey } = await import('@/lib/mesh/vaultResolver');
      // Resolve the effective key: prefer server-side vault keys, then local fallback
      const effectiveProvider = llmProvider || currentProvider || 'gemini';
      const cfg = llmConfigs[effectiveProvider] || {};
      const providerKey = resolveApiKey(effectiveProvider) || cfg.apiKey || resolveApiKey(currentProvider || 'gemini') || '';
      const fullPrompt = chatMessages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      const responseText = await callLLM(fullPrompt, {
        provider: effectiveProvider as any,
        apiKey: providerKey,
        systemInstruction: systemPrompt,
        model: model || cfg.model,
      });
      return NextResponse.json({ 
        message: { role: 'assistant', content: responseText },
        done: true 
      });
    }

    // Local (Ollama / open-code) stream
    const ollamaResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: true,
        options: {
          temperature: 0.7,
        }
      })
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      return NextResponse.json({ error: `Ollama error: ${errorText}` }, { status: 502 });
    }

    // Stream the response back (NDJSON from Ollama)
    // Client will parse and accumulate the 'message.content'
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Pass through the raw NDJSON chunks
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Node chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
