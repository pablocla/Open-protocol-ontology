# grokauct.md — Semantic Control Layer for Agent Swarms (Prompt + Spec)

## Objetivo
Diseñar e implementar **una capa semántica superior** (Semantic Control Layer) que controle y orqueste **enjambres de agentes** (swarms) en OPO.

Esta capa vive por encima de:
- SemanticRouter (intención por query)
- AgentExecutor (ejecución de pipelines individuales)
- Blackboard / SwarmMemory (memoria compartida y pub/sub)
- ResourceBroker (control de recursos)

## Principios clave de la capa semántica

1. **Gestión de ciclo de vida de enjambres**
   - Crear, pausar, terminar, fusionar enjambres.
   - Soporte para swarms jerárquicos (swarm of swarms).

2. **Descomposición y ruteo semántico de alto nivel**
   - Recibe "goals" de alto nivel (no solo queries).
   - Usa razonamiento semántico (LLM + ontología) para descomponer en sub-objetivos.
   - Decide si crear un nuevo swarm, reutilizar uno existente, o delegar a varios en paralelo.

3. **Coordinación entre enjambres**
   - Comunicación explícita entre swarms vía Blackboard (canales de control).
   - Negociación, sincronización y transferencia de conocimiento entre swarms.

4. **Gobernanza y observabilidad**
   - Políticas a nivel de swarm (guardrails, HIL a nivel de orquestación).
   - Métricas, estado y Time-Travel a nivel de swarm (no solo por ejecución individual).
   - Control de recursos agregados (usando el Broker).

5. **Memoria semántica a nivel de enjambre**
   - El Blackboard actúa como bus y memoria compartida.
   - La capa semántica puede consolidar conocimiento entre múltiples swarms.

## Estado actual del proyecto (base sobre la que construir)
- `lib/engine/blackboard/` → SwarmMemory (Redis + Memory adapters con PubSub y Semantic Locks)
- `lib/mesh/semanticRouter.ts` → Detección de entidades + capabilities + pipeline de agentes
- `lib/mesh/agentExecutor.ts` → Ejecución del pipeline + HIL + tools
- `lib/mesh/registry.ts` → Registro dinámico de agentes y tools
- `lib/engine/broker/resource-broker.ts` → Control de concurrencia y rate limiting por key
- `app/api/mesh/query/route.ts` → Punto de entrada actual (un pipeline por request)

## Requisitos para la implementación inicial (lógica básica)
- Usar el Blackboard existente como único bus de coordinación (no crear otro sistema de mensajería).
- Mantener compatibilidad hacia atrás con el flujo actual de query → intent → executor.
- Ofrecer una API clara: `createSwarm(goal, ontology)`, `routeGoal(...)`, `publishToSwarm(...)`.
- Soportar al menos:
  - Creación de swarms
  - Descomposición básica de goals
  - Publicación de eventos de control entre swarms
  - Listado de swarms activos
- Dejar ganchos claros para integración futura con HIL a nivel de swarm, ResourceBroker, y marketplace de DigitalEmployees.

## Eventos de control sugeridos (SwarmControlEvent)
- goal_received
- swarm_spawned
- task_decomposed
- agent_assigned
- inter_swarm_message
- status_changed
- hil_required (a nivel de orquestación)
- swarm_completed

## Próximos pasos recomendados
1. Definir tipos fuertes (`swarm-types.ts`).
2. Implementar el `SemanticSwarmController` (singleton que usa SwarmMemory).
3. Agregar capacidad de suscripción a canales de control por swarm.
4. (Opcional) Exponer un endpoint o método para que el Studio / marketplace pueda crear y monitorear swarms de alto nivel.
5. Integrar con el flujo existente de `agentExecutor` (por ejemplo, que un swarm pueda "delegar" ejecución de un sub-goal a un pipeline del executor).

---

Este archivo sirve como prompt de referencia para la construcción de la capa.

Si tenés el prompt original más detallado, pegalo aquí para refinar la implementación.
