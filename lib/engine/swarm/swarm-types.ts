import { OntologyGraph } from '../../mesh/meshTypes';
import { AgentMessage } from '../../mesh/meshTypes';

/**
 * Semantic Swarm Control Layer Types
 * 
 * This defines the "Capa Semántica" that sits above individual agent pipelines
 * to orchestrate, coordinate, and govern multiple concurrent or persistent
 * agent swarms (enjambres de agentes).
 * 
 * It uses the existing Blackboard (SwarmMemory) as the shared semantic memory
 * and coordination bus (PubSub + Locks + State).
 */

export type SwarmId = string;
export type SwarmGoalId = string;

export type SwarmStatus = 
  | 'planning'      // High-level goal received, decomposing
  | 'spawning'      // Creating sub-swarms / assigning agents
  | 'executing'     // Active work happening
  | 'coordinating'  // Inter-swarm communication / synchronization
  | 'paused'        // Waiting for HIL or external input
  | 'completed'
  | 'failed';

export interface SwarmGoal {
  id: SwarmGoalId;
  rawGoal: string;                    // Original high-level objective
  decomposedTasks: string[];          // Semantic sub-goals produced by the layer
  priority: number;                   // 1-10
  ontologyScope?: string[];           // Which entities this goal touches
}

export interface SwarmContext {
  swarmId: SwarmId;
  goal: SwarmGoal;
  ontology: OntologyGraph;
  participatingAgents: string[];      // Agent IDs from registry
  createdAt: string;
  parentSwarmId?: SwarmId;            // For hierarchical swarms (swarm of swarms)
}

export interface SwarmState {
  id: SwarmId;
  status: SwarmStatus;
  context: SwarmContext;
  messages: AgentMessage[];           // Shared log for this swarm (synced via blackboard)
  metrics: {
    tasksCompleted: number;
    tokensUsed: number;
    lastActivity: string;
  };
  blackboardPrefix: string;           // e.g. `swarm:${swarmId}:`
}

export type SwarmControlEvent =
  | { type: 'goal_received'; goal: SwarmGoal; ontology: OntologyGraph }
  | { type: 'swarm_spawned'; swarmId: SwarmId; parentId?: SwarmId }
  | { type: 'task_decomposed'; swarmId: SwarmId; tasks: string[] }
  | { type: 'agent_assigned'; swarmId: SwarmId; agentId: string; task: string }
  | { type: 'inter_swarm_message'; fromSwarm: SwarmId; toSwarm: SwarmId; payload: any }
  | { type: 'status_changed'; swarmId: SwarmId; from: SwarmStatus; to: SwarmStatus }
  | { type: 'hil_required'; swarmId: SwarmId; reason: string; context: any }
  | { type: 'swarm_completed'; swarmId: SwarmId; result: any };

/**
 * Interface for the Semantic Control Layer.
 * This is the "capa semántica" that controls the swarms.
 */
export interface ISemanticSwarmController {
  createSwarm(goal: string, ontology: OntologyGraph, options?: { parentSwarmId?: SwarmId }): Promise<SwarmState>;
  
  getSwarm(swarmId: SwarmId): Promise<SwarmState | undefined>;
  
  listActiveSwarms(): Promise<SwarmState[]>;
  
  /**
   * High-level semantic routing / orchestration.
   * The controller decides if this goal needs one swarm, multiple sub-swarms,
   * or delegation to existing swarms.
   */
  routeGoal(goal: string, ontology: OntologyGraph): Promise<SwarmId[]>;

  /**
   * Send a semantically meaningful message between swarms or to the controller.
   * Uses the Blackboard pub/sub under the hood.
   */
  publishToSwarm(targetSwarmId: SwarmId, event: SwarmControlEvent): Promise<void>;

  /**
   * Graceful shutdown / merge of a swarm.
   */
  terminateSwarm(swarmId: SwarmId, reason?: string): Promise<void>;
}
