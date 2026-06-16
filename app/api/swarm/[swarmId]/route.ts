import { NextResponse } from 'next/server';
import { semanticSwarmController } from '@/lib/engine/swarm';

/**
 * GET /api/swarm/[swarmId]
 * Get detailed state of a specific swarm.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const state = await semanticSwarmController.getSwarm(swarmId);

    if (!state) {
      return NextResponse.json({ success: false, error: 'Swarm not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, swarm: state });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/swarm/[swarmId]
 * Trigger execution of an additional sub-task inside an existing swarm.
 * 
 * Body: { task: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ swarmId: string }> }
) {
  try {
    const { swarmId } = await params;
    const body = await request.json();
    const { task } = body;

    if (!task) {
      return NextResponse.json({ success: false, error: 'task is required' }, { status: 400 });
    }

    const results = await semanticSwarmController.executeSubTask(swarmId, task);

    return NextResponse.json({ 
      success: true, 
      swarmId, 
      executedTask: task, 
      messagesProduced: results.length 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
