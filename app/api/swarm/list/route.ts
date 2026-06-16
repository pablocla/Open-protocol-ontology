import { NextResponse } from 'next/server';
import { semanticSwarmController } from '@/lib/engine/swarm';

/**
 * GET /api/swarm/list
 * Returns all currently active swarms managed by the semantic control layer.
 */
export async function GET() {
  try {
    const swarms = await semanticSwarmController.listActiveSwarms();

    return NextResponse.json({
      success: true,
      swarms: swarms.map(s => ({
        id: s.id,
        status: s.status,
        goal: s.context.goal.rawGoal,
        agents: s.context.participatingAgents,
        tasksCompleted: s.metrics.tasksCompleted,
        lastActivity: s.metrics.lastActivity,
        createdAt: s.context.createdAt
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
