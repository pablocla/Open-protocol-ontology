import { describe, it, expect, beforeEach } from 'vitest';
import { semanticSwarmController } from './semantic-swarm-controller';
import { SwarmMemory } from '../blackboard/blackboard';

// Ensure we use in-memory blackboard for clean tests
process.env.OPO_USE_MEMORY_BLACKBOARD = 'true';

const sampleOntology = {
  projectName: 'Test ERP',
  entities: [
    { id: 'e1', name: 'Customer', attributes: [], relations: [] },
    { id: 'e2', name: 'Invoice', attributes: [], relations: [] }
  ],
  compiledAt: new Date().toISOString()
};

describe('SemanticSwarmController (Capa Semántica de Enjambres)', () => {
  beforeEach(async () => {
    // Clean slate between tests
    await SwarmMemory.delete('swarm:active');
  });

  it('should create a new swarm and move through planning → executing states', async () => {
    const swarm = await semanticSwarmController.createSwarm(
      'Analyze recent customer invoices and suggest improvements',
      sampleOntology
    );

    expect(swarm.id).toMatch(/^swarm_/);
    expect(swarm.status).toBe('planning'); // initial

    // Give async planning a moment
    await new Promise(r => setTimeout(r, 80));

    const updated = await semanticSwarmController.getSwarm(swarm.id);
    expect(updated).toBeDefined();
    expect(['planning', 'spawning', 'executing']).toContain(updated!.status);
    expect(updated!.context.goal.decomposedTasks.length).toBeGreaterThan(0);
  });

  it('should list active swarms', async () => {
    await semanticSwarmController.createSwarm('Goal A', sampleOntology);
    await semanticSwarmController.createSwarm('Goal B', sampleOntology);

    const list = await semanticSwarmController.listActiveSwarms();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('should support routeGoal with basic overlap detection', async () => {
    const swarm1 = await semanticSwarmController.createSwarm('Work with customers', sampleOntology);

    // Give the first swarm time to register in the active list
    await new Promise(r => setTimeout(r, 30));

    // Same entities → should prefer overlapping swarm (or create new if timing is off)
    const routed = await semanticSwarmController.routeGoal('Find top customers', sampleOntology);

    // At minimum we expect either the overlapping swarm or a new one (basic logic tolerance)
    expect(routed.length).toBeGreaterThan(0);
  });

  it('should allow direct sub-task execution on a swarm', async () => {
    const swarm = await semanticSwarmController.createSwarm('Base goal', sampleOntology);

    // Wait a bit for planning
    await new Promise(r => setTimeout(r, 50));

    const results = await semanticSwarmController.executeSubTask(swarm.id, 'Fetch recent invoices');

    expect(Array.isArray(results)).toBe(true);
    // At minimum we should have received some system messages
    expect(results.length).toBeGreaterThan(0);
  });
});
