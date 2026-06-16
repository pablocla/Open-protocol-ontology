import { NextResponse } from 'next/server';
import { SwarmMemory } from '@/lib/engine/blackboard/blackboard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const channel = `session:${sessionId}:stream`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        
        const sendMsg = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const handler = async (msg: any) => {
          sendMsg(msg);
          if (msg.type === 'done' || msg.type === 'error') {
            await SwarmMemory.unsubscribe(channel, handler);
            controller.close();
          }
        };

        // Notify that we are connected and listening
        sendMsg({ type: 'session', sessionId, status: 'connected to background worker' });

        await SwarmMemory.subscribe(channel, handler);

        // Client disconnected cleanup
        request.signal.addEventListener('abort', async () => {
          await SwarmMemory.unsubscribe(channel, handler);
        });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
