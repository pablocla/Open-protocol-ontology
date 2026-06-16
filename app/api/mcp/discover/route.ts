import { NextResponse } from 'next/server';
import { MCPManager } from '@/lib/engine/mcp/mcp-client';

export async function POST(request: Request) {
  try {
    const { command, args } = await request.json();

    if (!command) {
      return NextResponse.json({ error: 'Missing MCP server command' }, { status: 400 });
    }

    const tools = await MCPManager.discoverTools(command, args || []);
    
    return NextResponse.json({ success: true, tools });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
