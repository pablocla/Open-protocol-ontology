import { NextResponse } from 'next/server';
import { HILManager } from '@/lib/engine/hil/hil-manager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { status } = await request.json();
    const { requestId } = await params;

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 });
    }

    await HILManager.resolveRequest(requestId, status);
    
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
