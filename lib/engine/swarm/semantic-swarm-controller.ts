import { SwarmMemory } from '../blackboard/blackboard';
import { OntologyGraph, MeshSession, AgentMessage } from '../../mesh/meshTypes';
import {
  SwarmId,
  SwarmGoal,
  SwarmState,
  SwarmStatus,
  SwarmContext,
  SwarmControlEvent,
  ISemanticSwarmController
} from './swarm-types';
import { randomBytes } from 'crypto';
import { semanticRouter } from '../../mesh/semanticRouter';
import { agentExecutor } from '../../mesh/agentExecutor'; // GROK OPTIMIZATION: Real delegation to existing pipeline executor

/**
 * SemanticSwarmController
 * 
 * Capa Semántica de Control de Enjambres de Agentes (OPO Swarm Control Layer).
 * 
 * This layer sits ABOVE the existing per-pipeline AgentExecutor and SemanticRouter.
 * 
 * Responsibilities (inspired by swarm control / blackboard architectures):
 * - Accept high-level goals
 * - Perform semantic decomposition into sub-goals / tasks
 * - Decide whether to spawn new swarms, reuse existing ones, or create hierarchical swarms-of-swarms
 * - Coordinate multiple concurrent/persistent swarms via the Blackboard (PubSub + shared state)
 * - Provide governance, monitoring, and cross-swarm communication
 * - Integrate with ResourceBroker (future) for resource-aware swarm allocation
 * - Surface HIL at the swarm-orchestration level, not only inside individual agents
 * 
 * Current implementation is the "lógica básica" version:
 * - Uses SwarmMemory (Blackboard) as the single source of truth for swarm state and coordination.
 * - Simple rule + LLM-assisted decomposition (via existing semanticRouter where possible).
 * - Spawns lightweight SwarmState records.
 * - Basic pub/sub control plane on the blackboard.
 * 
 * Future extensions (when the full prompt from grokauct.md is available):
 * - Rich goal ontology
 * - Persistent long-lived swarms
 * - Advanced inter-swarm negotiation protocols
 * - Full integration with the ResourceBroker for rate-limited agent access across swarms
 * - Semantic memory consolidation across swarms
 */

// Internal blackboard keys
const SWARM_STATE_PREFIX = 'swarm:state:';
const SWARM_CONTROL_CHANNEL = 'swarm:control';
const SWARM_LIST_KEY = 'swarm:active';

export class SemanticSwarmController implements ISemanticSwarmController {
  private activeSwarms: Map<SwarmId, SwarmState> = new Map();

  constructor() {
    // Bootstrap: in a real system we would hydrate from Blackboard on startup
    this.hydrateFromBlackboard().catch(console.error);
  }

  private async hydrateFromBlackboard(): Promise<void> {
    try {
      const swarmIds = (await SwarmMemory.get(SWARM_LIST_KEY)) || [];
      for (const id of swarmIds) {
        const state = await SwarmMemory.get(`${SWARM_STATE_PREFIX}${id}`);
        if (state) {
          this.activeSwarms.set(id, state);
        }
      }
    } catch (e) {
      console.warn('[SemanticSwarmController] Failed to hydrate swarms from blackboard', e);
    }
  }

  private async persistSwarm(state: SwarmState): Promise<void> {
    await SwarmMemory.set(`${SWARM_STATE_PREFIX}${state.id}`, state);

    // Maintain a simple active list
    const currentList: string[] = (await SwarmMemory.get(SWARM_LIST_KEY)) || [];
    if (!currentList.includes(state.id)) {
      currentList.push(state.id);
      await SwarmMemory.set(SWARM_LIST_KEY, currentList);
    }
  }

  private generateSwarmId(): SwarmId {
    return `swarm_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  async createSwarm(
    goal: string,
    ontology: OntologyGraph,
    options: { parentSwarmId?: SwarmId } = {}
  ): Promise<SwarmState> {
    const swarmId = this.generateSwarmId();

    const swarmGoal: SwarmGoal = {
      id: `goal_${swarmId}`,
      rawGoal: goal,
      decomposedTasks: [],
      priority: 5,
      ontologyScope: ontology.entities.map(e => e.name)
    };

    const context: SwarmContext = {
      swarmId,
      goal: swarmGoal,
      ontology,
      participatingAgents: [],
      createdAt: new Date().toISOString(),
      parentSwarmId: options.parentSwarmId
    };

    const state: SwarmState = {
      id: swarmId,
      status: 'planning',
      context,
      messages: [],
      metrics: {
        tasksCompleted: 0,
        tokensUsed: 0,
        lastActivity: new Date().toISOString()
      },
      blackboardPrefix: `swarm:${swarmId}:`
    };

    this.activeSwarms.set(swarmId, state);
    await this.persistSwarm(state);

    // Emit control event
    await this.publishToSwarm(swarmId, {
      type: 'swarm_spawned',
      swarmId,
      parentId: options.parentSwarmId
    });

    // Kick off semantic decomposition (async, non-blocking for the caller)
    this.decomposeAndPlan(state).catch(err => {
      console.error(`[Swarm ${swarmId}] Decomposition failed`, err);
    });

    return state;
  }

  private async decomposeAndPlan(state: SwarmState): Promise<void> {
    const { goal, ontology } = state.context;

    // Use the existing SemanticRouter as a building block for intent understanding.
    // In a richer implementation this would be a dedicated meta-planner LLM call.
    try {
      const intent = await semanticRouter.route(goal.rawGoal, ontology, {}); // apiKeys empty here; controller can be extended

      state.context.goal.decomposedTasks = intent.detectedEntities.length > 0
        ? intent.detectedEntities.map(e => `Understand and operate on ${e}`)
        : [goal.rawGoal];

      state.context.participatingAgents = intent.agentPipeline.length > 0
        ? intent.agentPipeline
        : ['data-querier', 'data-analyst'];

      state.status = 'spawning';
      await this.persistSwarm(state);

      await this.publishToSwarm(state.id, {
        type: 'task_decomposed',
        swarmId: state.id,
        tasks: state.context.goal.decomposedTasks
      });

      // GROK OPTIMIZATION: Transition to executing AND actually run work using the real AgentExecutor.
      state.status = 'executing';
      await this.persistSwarm(state);

      await this.publishToSwarm(state.id, {
        type: 'status_changed',
        swarmId: state.id,
        from: 'spawning',
        to: 'executing'
      });

      // Kick off real sub-task execution (delegates to AgentExecutor pipeline)
      this.executePlannedTasks(state).catch(err => {
        console.error(`[Swarm ${state.id}] Task execution error`, err);
      });
    } catch (error) {
      state.status = 'failed';
      await this.persistSwarm(state);
      console.error(`[SemanticSwarmController] Planning failed for ${state.id}`, error);
    }
  }

  async getSwarm(swarmId: SwarmId): Promise<SwarmState | undefined> {
    if (this.activeSwarms.has(swarmId)) {
      return this.activeSwarms.get(swarmId);
    }
    // Fallback to blackboard
    const fromBb = await SwarmMemory.get(`${SWARM_STATE_PREFIX}${swarmId}`);
    if (fromBb) {
      this.activeSwarms.set(swarmId, fromBb);
    }
    return fromBb;
  }

  async listActiveSwarms(): Promise<SwarmState[]> {
    return Array.from(this.activeSwarms.values());
  }

  async routeGoal(goal: string, ontology: OntologyGraph): Promise<SwarmId[]> {
    // Basic semantic routing logic at the swarm layer:
    // - If there are already active swarms that cover overlapping entities, we can attach or delegate.
    // - Otherwise spawn a new top-level swarm.

    const active = await this.listActiveSwarms();
    const goalEntities = ontology.entities.map(e => e.name);

    const overlapping = active.filter(s => {
      const swarmEntities = s.context.ontology.entities.map(e => e.name);
      return goalEntities.some(ge => swarmEntities.includes(ge));
    });

    if (overlapping.length > 0) {
      // For now, just delegate to the first overlapping swarm (simple policy)
      const target = overlapping[0];
      await this.publishToSwarm(target.id, {
        type: 'goal_received',
        goal: { id: `goal_${Date.now()}`, rawGoal: goal, decomposedTasks: [], priority: 5 },
        ontology
      } as any);
      return [target.id];
    }

    // No good overlap → create fresh swarm
    const newSwarm = await this.createSwarm(goal, ontology);
    return [newSwarm.id];
  }

  async publishToSwarm(targetSwarmId: SwarmId, event: SwarmControlEvent): Promise<void> {
    const channel = `swarm:${targetSwarmId}:control`;
    await SwarmMemory.publish(channel, event);

    // Also store recent control events in the swarm state for observability (Time-Travel friendly)
    const state = await this.getSwarm(targetSwarmId);
    if (state) {
      // We store a lightweight log entry
      state.messages.push({
        id: `ctrl-${Date.now()}`,
        role: 'system',
        content: `[SwarmControl] ${event.type}`,
        timestamp: new Date().toISOString()
      });
      await this.persistSwarm(state);
    }
  }

  async terminateSwarm(swarmId: SwarmId, reason = 'manual'): Promise<void> {
    const state = await this.getSwarm(swarmId);
    if (!state) return;

    state.status = 'completed';
    await this.persistSwarm(state);

    await this.publishToSwarm(swarmId, {
      type: 'swarm_completed',
      swarmId,
      result: { reason }
    } as any);

    this.activeSwarms.delete(swarmId);

    // Remove from active list
    const list: string[] = (await SwarmMemory.get(SWARM_LIST_KEY)) || [];
    const newList = list.filter(id => id !== swarmId);
    await SwarmMemory.set(SWARM_LIST_KEY, newList);
  }

  /**
   * GROK OPTIMIZATION: Actually execute real work inside a swarm using the existing AgentExecutor.
   * This bridges the high-level semantic control layer with the concrete pipeline execution.
   * Results and progress are written back to the swarm's blackboard state.
   */
  async executeSubTask(swarmId: SwarmId, taskDescription: string): Promise<AgentMessage[]> {
    const state = await this.getSwarm(swarmId);
    if (!state) throw new Error(`Swarm ${swarmId} not found`);

    // Build a minimal MeshSession for this sub-task
    const subSession: MeshSession = {
      id: `${swarmId}-task-${Date.now()}`,
      intent: {
        id: `subintent-${Date.now()}`,
        rawQuery: taskDescription,
        detectedEntities: state.context.goal.ontologyScope || [],
        detectedCapabilities: state.context.participatingAgents,
        agentPipeline: state.context.participatingAgents.length > 0 
          ? state.context.participatingAgents 
          : ['data-querier', 'data-analyst'],
        status: 'executing'
      },
      messages: [],
      ontologySnapshot: state.context.ontology,
      createdAt: new Date().toISOString()
    };

    const results: AgentMessage[] = [];

    try {
      // GROK FIX #5 context: pass empty; per-agent llmProvider in session + apiKeys (or vault later) resolve inside executor. For full multi-tenant/ headless pass llmConfig from parent.
      const generator = agentExecutor.executePipeline(subSession, {}, undefined);

      for await (const msg of generator) {
        results.push(msg);

        // Feed live messages into the swarm's shared state (observable via Time-Travel + UI)
        state.messages.push(msg);

        if (msg.role === 'assistant' || msg.content?.includes('Tool')) {
          state.metrics.tasksCompleted += 1;
        }
      }

      // Publish progress to the swarm control channel
      await this.publishToSwarm(swarmId, {
        type: 'agent_assigned',
        swarmId,
        agentId: state.context.participatingAgents[0] || 'unknown',
        task: taskDescription
      } as any);

      state.status = 'executing';
      await this.persistSwarm(state);

      return results;
    } catch (err: any) {
      const errorMsg: AgentMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `Swarm sub-task failed: ${err.message}`,
        timestamp: new Date().toISOString()
      };
      state.messages.push(errorMsg);
      state.status = 'failed';
      await this.persistSwarm(state);
      throw err;
    }
  }

  /**
   * High-level helper: After planning, execute the decomposed tasks using the real executor.
   * This is the key bridge that makes the semantic control layer actually "do work".
   */
  private async executePlannedTasks(state: SwarmState): Promise<void> {
    const tasks = state.context.goal.decomposedTasks;
    if (tasks.length === 0) return;

    state.status = 'executing';
    await this.persistSwarm(state);

    // Execute the first task for basic logic (future: fan-out to multiple sub-swarms or parallel tasks)
    const firstTask = tasks[0];

    try {
      const taskResults = await this.executeSubTask(state.id, firstTask);

      // Summarize results into swarm messages
      const summary: AgentMessage = {
        id: `summary-${Date.now()}`,
        role: 'system',
        content: `Completed sub-task "${firstTask}". ${taskResults.length} messages produced.`,
        timestamp: new Date().toISOString()
      };
      state.messages.push(summary);
      state.metrics.tasksCompleted += 1;

      await this.persistSwarm(state);

      await this.publishToSwarm(state.id, {
        type: 'status_changed',
        swarmId: state.id,
        from: 'executing',
        to: 'executing'
      } as any);

    } catch (e) {
      console.error(`[Swarm ${state.id}] Task execution failed`, e);
    }
  }

  /**
   * Convenience: Subscribe to control events for a specific swarm.
   * Useful for UI dashboards, other controllers, or long-lived agent workers.
   */
  async subscribeToSwarmControl(swarmId: SwarmId, handler: (event: SwarmControlEvent) => void): Promise<void> {
    const channel = `swarm:${swarmId}:control`;
    await SwarmMemory.subscribe(channel, (msg) => {
      handler(msg as SwarmControlEvent);
    });
  }
}

// Singleton for the whole system (similar to how SwarmMemory and ResourceBroker work)
export const semanticSwarmController = new SemanticSwarmController();
