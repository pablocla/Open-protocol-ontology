import { NextResponse } from 'next/server';
import { semanticSwarmController } from '@/lib/engine/swarm';
import { OntologyGraph } from '@/lib/mesh/meshTypes';

/**
 * POST /api/swarm/create
 * Creates a new high-level semantic swarm for a goal.
 * 
 * Body:
 * {
 *   goal: string,
 *   ontology: OntologyGraph
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goal, ontology } = body;

    if (!goal || !ontology) {
      return NextResponse.json({ success: false, error: 'goal and ontology are required' }, { status: 400 });
    }

    const swarmState = await semanticSwarmController.createSwarm(goal, ontology as OntologyGraph);

    return NextResponse.json({ 
      success: true, 
      swarm: {
        id: swarmState.id,
        status: swarmState.status,
        goal: swarmState.context.goal.rawGoal,
        agents: swarmState.context.participatingAgents
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
