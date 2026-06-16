import { NextResponse } from 'next/server';
import { registry } from '@/lib/mesh/registry';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'agents';

  if (type === 'agents') {
    return NextResponse.json({ agents: registry.getAllAgents() });
  } else if (type === 'tools') {
    return NextResponse.json({ tools: registry.getAllTools() });
  }

  return NextResponse.json({ error: 'Invalid type. Use ?type=agents or ?type=tools' }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'agents';
    const body = await request.json();

    if (type === 'agents') {
      registry.registerAgent(body);
      return NextResponse.json({ success: true, agent: body });
    } else if (type === 'tools') {
      registry.registerTool(body);
      return NextResponse.json({ success: true, tool: body });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
