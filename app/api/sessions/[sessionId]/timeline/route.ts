import { NextResponse } from 'next/server';
import { SwarmMemory } from '@/lib/engine/blackboard/blackboard';
import { getTimeTravelDB } from '@/lib/engine/timetravel/time-travel-db';

// GROK OPTIMIZATION: Use the shared, optimized TimeTravelDB (with indexes + auto-prune)
const timeTravel = getTimeTravelDB();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const snapshots = timeTravel.getSnapshots(sessionId);
    
    return NextResponse.json({ success: true, snapshots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Optional endpoint to manually push a snapshot (useful for testing or if the engine pushes here)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    // Usually the engine saves automatically now. This remains for manual/debug triggers.
    const snapshot = await SwarmMemory.takeSnapshot();
    timeTravel.saveSnapshot(sessionId, snapshot);

    return NextResponse.json({ success: true, snapshotId: snapshot.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
