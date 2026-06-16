import { Node, Edge } from '@xyflow/react';
import { EntityNodeData } from './studioTypes';
import type { GuidanceAlert } from '@/store/useStudioStore';
import { semanticSwarmController } from '@/lib/engine/swarm';

/**
 * GuidanceEngine - Generalized for ANY system (DBs, APIs, processes) that needs OPO semantics + Vibe Coding.
 * 
 * Steers users through "Vibe Coding" best practices to build, orchestrate, package and monetize as 
 * "DigitalEmployees" (packaged swarms/microservices) following the BridgeMind-style SaaS model.
 * 
 * Covers:
 * - Semantic modeling for any data source (not just ERP).
 * - Flow diagrams & process automation using canvas nodes + execution.
 * - High-level swarm orchestration (SemanticSwarmController).
 * - Packaging as DigitalEmployee for Marketplace / Headless API.
 * - IP protection awareness (hide prompts, expose only I/O).
 * - Headless / monetizable microservice usage.
 * 
 * Trigger on canvas changes, discover, validate, pre-execution, or manually via "🧭 Guidance" button.
 * Alerts include actionable buttons (e.g. launch swarm, package employee, open headless docs).
 */

export interface GuidanceContext {
  hasDiscovered?: boolean;
  lastExecution?: 'success' | 'error';
  hasSwarmUsage?: boolean;
  isPackagingMode?: boolean; // When user is thinking about publishing
}

export function runGuidance(
  nodes: Node[],
  edges: Edge[],
  context: GuidanceContext = {}
): GuidanceAlert[] {
  const alerts: Omit<GuidanceAlert, 'timestamp' | 'dismissed'>[] = [];
  const entityNodes = nodes.filter(n => n.type === 'entityNode');
  const agentNodes = nodes.filter(n => n.type === 'agentNode');
  const triggerActionNodes = nodes.filter(n => 
    n.type === 'triggerNode' || n.type === 'actionNode' || n.type === 'approvalNode'
  );
  const toolNodes = nodes.filter(n => n.type === 'toolNode' || n.type === 'n8nNode');

  // === 1. SEMANTIC MODELING for ANY system (DB/API/process) ===
  if ((context.hasDiscovered || entityNodes.length > 0) && entityNodes.length > 0) {
    const missingSemantics = entityNodes.filter(n => {
      const attrs = (n.data as EntityNodeData).attributes || [];
      return attrs.length > 0 && !attrs.some(a => (a as any).semanticTags?.length > 0);
    });

    if (missingSemantics.length > 0) {
      alerts.push({
        id: '',
        type: 'info',
        title: 'Add Semantics for Smart Agents',
        message: `${missingSemantics.length} entities lack semanticTags. Essential for any data source (DB, API, legacy system) so agents understand business meaning beyond table names.`,
        useCase: 'general',
        actions: [{
          label: 'Add Semantic Tags (Sidebar)',
          action: () => alert('Pro tip: In right sidebar, tag attributes e.g. ["identifier", "customer", "financial"]. This powers semantic routing.')
        }]
      });
    }

    if (entityNodes.length > 0 && agentNodes.length === 0) {
      alerts.push({
        id: '',
        type: 'action',
        title: 'Ready for Semantic Agents?',
        message: 'You modeled data. Add Agents (with capabilities) + connect to Tools for automated reasoning over any system.',
        useCase: 'general',
        actions: [{
          label: 'Create Swarm for Semantics',
          action: async () => {
            const goal = 'Provide semantic understanding and operations over the modeled data source using OPO ontology';
            console.log('[Guidance] Launching swarm for semantic layer...');
            // In full impl: await semanticSwarmController.createSwarm(goal, compiledOntology);
          }
        }]
      });
    }
  }

  // === 2. FLOW DIAGRAMS & PROCESS AUTOMATION (general) ===
  const hasTrigger = triggerActionNodes.length > 0;
  const hasConnectedFlow = edges.length >= 1 && triggerActionNodes.length >= 2;

  if (hasTrigger && hasConnectedFlow) {
    alerts.push({
      id: '',
      type: 'success',
      title: 'Flow / Process Detected',
      message: 'Excellent vibe coding! Connected triggers/actions/approvals form a process diagram. Execute via Mesh or package as orchestratable DigitalEmployee for automation.',
      useCase: 'process-automation',
      actions: [{
        label: 'Orchestrate with Swarm (Headless Ready)',
        action: () => {
          console.log('[Guidance] Recommend packaging this flow as DigitalEmployee for reusable headless API.');
        }
      }]
    });
  }

  if (hasConnectedFlow && !nodes.some(n => n.type === 'approvalNode')) {
    alerts.push({
      id: '',
      type: 'info',
      title: 'Add Governance to your Flow?',
      message: 'Production processes need human checkpoints. Insert Approval nodes or let the swarm handle HIL escalation.',
      useCase: 'process-automation'
    });
  }

  // === 3. SWARM ORCHESTRATION (core of Vibe Coding + BridgeMind emulation) ===
  if (agentNodes.length >= 2 && !context.hasSwarmUsage) {
    alerts.push({
      id: '',
      type: 'action',
      title: 'Level Up to Swarm Orchestration',
      message: 'Multiple specialized agents = perfect for a coordinated "Digital Employee". Use the Semantic Control Layer to manage roles, coordination, and long-running tasks via Blackboard.',
      useCase: 'swarm-orchestration',
      actions: [{
        label: 'Launch High-Level Swarm',
        action: async () => {
          const goal = 'Orchestrate the agents and tools in this canvas as a reliable autonomous team for the defined process or data operations';
          // Real call would compile ontology first
          console.log('[Vibe Guidance] Creating swarm with goal:', goal);
          // await semanticSwarmController.createSwarm(goal, ontologyFromCanvas);
        }
      }]
    });
  }

  // === 4. VIBE CODING → PACKAGE AS DIGITALEMPLOYEE (SaaS/Marketplace path) ===
  const looksLikeEmployee = agentNodes.length >= 1 && toolNodes.length >= 1 && (hasTrigger || entityNodes.length > 0);

  if (looksLikeEmployee || context.isPackagingMode) {
    alerts.push({
      id: '',
      type: 'success',
      title: 'Ready to Package as DigitalEmployee?',
      message: 'This canvas (agents + tools + flows + semantics) can become a sellable microservice. Package it to hide internal prompts/know-how and expose clean Inputs/Outputs for headless calls (Zapier, your apps, etc.).',
      useCase: 'swarm-orchestration', // reuse for packaging
      actions: [
        {
          label: 'Define I/O & Package (IP Protected)',
          action: () => {
            // Uses the real stub
            const stub = generateDigitalEmployeeStub(nodes, edges);
            console.log('=== DIGITALEMPLOYEE PACKAGE (IP protected internals) ===');
            console.log(JSON.stringify(stub, null, 2));
            alert('DigitalEmployee package generated (see console). In real SaaS this would save to marketplace DB, generate Zod schema, register headless route, and hide prompts.');
          }
        },
        {
          label: 'Publish to Marketplace (20/80 Revenue Share)',
          action: () => {
            console.log('[Guidance] Would create DigitalEmployee record, generate API schema (Zod), register in headless runner, set price per execution.');
          }
        }
      ]
    });
  }

  // === 5. HEADLESS / MONETIZABLE USE (the SaaS money maker) ===
  if (agentNodes.length > 0 && toolNodes.length > 0) {
    alerts.push({
      id: '',
      type: 'info',
      title: 'Headless API Available',
      message: 'Once packaged, buyers get a permanent REST endpoint + API key. Your DigitalEmployee becomes a microservice they can call from anywhere without opening OPO Studio.',
      useCase: 'general',
      actions: [{
        label: 'View Example cURL / Docs',
        action: () => alert('Example: curl -X POST https://opo.yourdomain.com/api/v1/run/your-employee-id -H "X-OPO-Key: xxx" -d \'{"input": "..."}\'')
      }]
    });
  }

  // === AI-Assisted Table Introspection (the missing "mini robot" for discover) ===
  if (context.hasDiscovered && entityNodes.length > 0) {
    alerts.push({
      id: '',
      type: 'info',
      title: 'AI Table Introspection Helper',
      message: 'To introspect tables with AI: 1) Run Discover. 2) Use Guidance or create a "Discovery Assistant" AgentNode. 3) Ask it "Analyze field sizes (length/precision) and row counts from the ontology. Suggest which tables (e.g. high volume like SX2/SX3 vs params SX6) are core and what structures/attributes to model in OPO." The LLM now receives full column metadata (sizes, comments) + volumes so it can intelligently recommend structures.',
      useCase: 'general',
      actions: [{
        label: 'Run Guidance for Introspection',
        action: () => {
          // The auto-guidance already triggers; this is a hint
          alert('The Guidance system (bottom or "Guide Me" button) and your agents now get rich metadata. Try adding an AgentNode called "Discovery Assistant" and run a query like the one in the alert.');
        }
      }]
    });
  }

  // Anti-patterns (general)
  const agentsWithoutTools = agentNodes.filter(a => !((a.data as any)?.toolBindings?.length));
  if (agentsWithoutTools.length > 0 && toolNodes.length > 0) {
    alerts.push({
      id: '',
      type: 'warning',
      title: 'Wire Agents to Capabilities',
      message: 'Agents without tool connections can\'t do real work on your system. Connect them for automation or semantic operations.',
      useCase: 'general'
    });
  }

  // === Ollama / Local models for efficient development ===
  // This is the key value for "Vibe Coding" local iteration without cloud costs or data leakage.
  if (agentNodes.length > 0 || triggerActionNodes.length > 0) {
    alerts.push({
      id: '',
      type: 'info',
      title: 'Use Local Ollama for Fast & Private Iteration',
      message: 'Switch to "Ollama" or "Open Code" in Settings for free, local, private AI. Ideal for rapid prototyping of DigitalEmployees, automations, code generation for Protheus tools, and Vibe Coding loops. No API costs, data stays on your machine. When the local model is uncertain, it will escalate to human superior (HIL) automatically.',
      useCase: 'general',
      actions: [{
        label: 'Open Settings & Connect Ollama',
        action: () => {
          // User can open Settings; in practice this could trigger the modal
          alert('Go to top-right Settings icon (gear) > select Ollama or Open Code from the provider dropdown > use the green "Quick Connect to running Ollama" button. Then agents will run locally.');
        }
      }]
    });
  }

  const disconnected = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id));
  if (disconnected.length > 2 && nodes.length > 4) {
    alerts.push({
      id: '',
      type: 'warning',
      title: 'Tighten Your Flow Diagram',
      message: 'Disconnected nodes weaken process automation and swarm coordination. Connect everything into clear flows or semantic relations.',
      useCase: 'flow-diagram'
    });
  }

  return alerts.map((alert, index) => ({
    ...alert,
    id: alert.id || `guidance-${index}-${Date.now()}`,
    timestamp: Date.now(),
    dismissed: false
  }));
}

export function shouldRunGuidance(nodes: Node[], previousCount = 0): boolean {
  return nodes.length > previousCount || nodes.some(n => n.type === 'entityNode' || n.type === 'agentNode');
}

// Helper for packaging flow (future: call from "Publish" button)
export function generateDigitalEmployeeStub(nodes: Node[], edges: Edge[]) {
  // Very basic stub - real version would use compileOntology + extract I/O from Agent/Tool nodes
  const inputs = ['query', 'context']; // derived from user intent / entity fields
  const outputs = ['result', 'structuredData', 'auditLog'];

  return {
    id: `de-${Date.now()}`,
    name: 'Untitled Digital Employee',
    description: 'Packaged from OPO Studio Vibe Coding session.',
    version: '1.0.0',
    inputsSchema: { type: 'object', properties: Object.fromEntries(inputs.map(i => [i, {type:'string'}])) },
    outputsSchema: { type: 'object', properties: Object.fromEntries(outputs.map(o => [o, {type:'string'}])) },
    // Internal implementation (hidden from buyer):
    // internalSwarmId, agentPrompts, blackboardKeys (tenant protected), etc.
    pricePerExecution: 0.05,
    creatorRevenueShare: 0.8
  };
}
