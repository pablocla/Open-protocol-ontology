import { NextResponse } from 'next/server';
import { checkStudioHealth, type StudioHealthInput } from '@/lib/studio/studioHealth';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as StudioHealthInput;
    const result = await checkStudioHealth(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Health check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}