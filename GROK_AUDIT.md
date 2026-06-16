# 🤖 GROK_AUDIT.md — Auditoría Fase 1: OPO Studio v2 (Motor Distribuido)

**Fecha de auditoría:** 2026-06-15  
**Agente:** Grok (basado en instrucciones del Master Prompt OPO Studio v2 + prompt Gemini equivalente)  
**Alcance:** Solo lectura / introspección. No se realizaron modificaciones de código.  
**Enfoque principal:**  
- `lib/engine/vault/` (CredentialVault + AES-256-GCM)  
- `lib/engine/broker/` (ResourceBroker + BullMQ + ioredis)  
- `lib/engine/blackboard/` (RedisBlackboardAdapter / Memory + PubSub + Locks)  
- `lib/engine/guardrails/` (Zod middleware + validator)  
- `lib/engine/hil/` (HILManager)  
- `lib/mesh/agentExecutor.ts` (motor principal)  
- `app/api/` (mesh/query, vault, hil, sessions/timeline, dashboard, studio/*, etc.)  
- `components/studio/`, `components/debugger/`, `store/useStudioStore.ts` y flujos relacionados (Time-Travel / Timeline).  

Se revisaron también: docker-compose.yml, package.json, tsconfig.json, lib/mesh/* (semanticRouter, registry, opoRuntime, meshTypes), lib/engine/types/*, tests existentes, y el flujo completo de inyección de credenciales + snapshots.

**Nota:** Existe un `AUDIT.md` previo (estado anterior al motor distribuido) que identificaba deuda de "apiKeys en crudo desde frontend". El nuevo motor intenta resolverlo pero queda incompleto (ver abajo).

---

## Code Smells & Anti-patrones

1. **Tipado `any` generalizado (falta de tipado estricto):**
   - `lib/mesh/agentExecutor.ts`: `config: any`, `toolCallPart: any`, `p: any`, `error: any`. Casts `as const` mezclados con any.
   - `lib/engine/hil/hil-manager.ts`: `context: any`, `timeoutId: any`, handlers `(msg: any)`.
   - `lib/engine/guardrails/middleware.ts:5`: `schema: any`; `err: any`.
   - `lib/engine/guardrails/validator.ts`: `jsonSchema: any`, `schema: any`, `payload: any`, `validatePayload` retorna `any`.
   - `lib/engine/blackboard/blackboard.ts` + `memory-adapter.ts` + `types/blackboard.ts`: `value: any`, `message: any`, `handler: (message: any)`, `state: Record<string, any>`.
   - `lib/engine/broker/resource-broker.ts:20`: `rejectAcquire: (err: any)`.
   - `app/api/mesh/query/route.ts`: Múltiples `(n: any)`, `(node: any)`, `(e: any)`, `data: any`, `error: any`, `as any` en tool registration y manifest parsing.
   - `app/api/studio/*`, `vault/route.ts`, `hil/*`, `dashboard/route.ts`, `mcp/discover/route.ts`: `error: any` / `err: any` ubicuos.
   - `lib/mesh/*` (opoRuntime, mcpClient, intentParser): varios `Promise<any>`, `args: any`, casts.
   - `store/useStudioStore.ts:42`: `nodes: any[]`, `edges: any[]` en `loadProjectData`.

2. **Asincronía mal manejada y race conditions:**
   - `lib/engine/broker/resource-broker.ts`:
     - `acquireKey` crea job BullMQ y hace `new Promise` que resuelve desde el Worker callback. Depende de timing de `waitingAgents.set` vs worker execution.
     - `releaseKey`: lógica hacky con `this.activeLocks.keys().next().value` (iterador Map) + fallback sin jobId. Comentarios internos reconocen que es "simplified/hacky".
     - `activeLocks` y `waitingAgents` son Maps en memoria del singleton; no sobreviven reinicios y pueden quedarse huérfanos.
   - `lib/engine/hil/hil-manager.ts`: `setTimeout` + subscribe/unsubscribe manual. El handler hace `clearTimeout` + unsubscribe async. Race si se resuelve por timeout y publish simultáneo. `context: any` se serializa sin control.
   - Blackboard pub/sub (ambos adapters): en Memory usa `setTimeout(..., 0)` para simular async. No hay garantías de orden o entrega.
   - `app/api/mesh/query/route.ts:107-113`: `takeSnapshot()` se llama en el loop SSE pero el resultado se ignora (solo try/catch warn). Nunca se persiste en TimeTravelDB. El `session.id` local no se propaga.
   - Múltiples `new CredentialVault()` / `new TimeTravelDB()` por request (ver rendimiento).

3. **Patrones frágiles / singletons sin ownership:**
   - `ResourceBroker` y `SwarmMemory` (getBlackboard) son singletons exportados creados en module scope. Se instancian al importar.
   - `CredentialVault` se crea dentro del singleton del broker + en cada handler de `/api/vault/*`. Nunca se llama `.close()` en paths de producción.
   - TimeTravelDB (definido inline en `app/api/sessions/[sessionId]/timeline/route.ts`) también se instancia por request sin close.
   - Blackboard Redis crea **3 instancias de ioredis** (client + pub + sub) + la del broker. Sin handlers de shutdown.
   - No hay `process.on('SIGTERM'/'beforeExit')` ni cleanup en source (solo en dist/cli compilado).

4. **Lógica incompleta / "TODO en producción":**
   - `agentExecutor.ts:116-125`: Intenta `ResourceBroker.acquireKey` pero ignora el valor real (solo metadata `CredentialKey`). Comentarios explícitos: "In a real implementation we would get the actual secret... For this prompt, let's assume we read from apiKeys directly". Siempre cae en fallback `geminiKeyStr = apiKeys.gemini`.
   - `getKey(id)` del Vault **nunca es llamado** en toda la codebase (grep confirmó solo store/list/delete + listKeys en broker).
   - En `query/route.ts` y `semanticRouter.ts`: LLM (GoogleGenAI) siempre se construye con `apiKeys.gemini` del body (cliente).
   - `isStrictSchema` hack: `agent.systemPrompt.includes('STRICT_JSON')` + dummySchema.
   - Registro dinámico de tools desde `.well-known/opo.json` usa casts `as any` y muta el registry global.
   - Broker: `consumption` en memoria pura (se pierde en restart). `getConsumptionReport` hace JSON.parse(JSON.stringify()).

5. **Otros smells:**
   - Duplicación de CREATE TABLE en constructores (vault y TimeTravelDB).
   - Mezcla de responsabilidades en AgentExecutor (LLM call + guardrails + tool exec + HIL + snapshot + key mgmt).
   - En `SettingsModal.tsx:20`: test de conexión envía la key Gemini directamente en querystring a `generativelanguage.googleapis.com` (visible en browser devtools, proxies, logs).
   - Snapshots del blackboard (takeSnapshot) serializan **todo** el estado sin redacción.
   - Ausencia de tipos compartidos para eventos SSE (`{type: 'message' | 'status' | ..., message?}`) y PubSub (hil:new_request, hil:resolve:*).
   - Error messages se exponen directamente al cliente en muchos endpoints.

---

## Cuellos de botella de rendimiento

1. **Blackboard snapshots (Time-Travel):**
   - Llamado **en cada paso del pipeline** dentro del generador SSE (`query/route.ts`).
   - `RedisBlackboardAdapter.takeSnapshot()`: `await this.client.keys('opo:bb:*')` + `keys('opo:lock:*')` + GET por cada uno. `KEYS` es O(N) y bloqueante en Redis grande. Prohibido en producción para datasets medianos.
   - Memory adapter hace full dump de Maps (mejor pero igual costoso si se llama frecuentemente).
   - Los snapshots **nunca se guardan** realmente en la DB de timeline (ver más abajo). Solo se "demuestran".

2. **SQLite (Vault + TimeTravelDB):**
   - Cada request HTTP a `/api/vault/*` y `/api/sessions/*/timeline` hace `new Database(dbPath)` + `CREATE TABLE IF NOT EXISTS`.
   - Mejor-sqlite3 es síncrono; abrir/cerrar repetidamente genera overhead y posibles file descriptor leaks si el GC no actúa rápido (especialmente en dev con HMR y muchos requests).
   - **No hay índices**: tabla `snapshots` solo PK en `id`. Búsquedas `WHERE sessionId = ? ORDER BY timestamp` hacen full table scan.
   - Ningún mecanismo de limpieza/compresión de snapshots antiguos. La DB `data/timetravel.db` (o path custom) puede crecer indefinidamente.
   - Vault usa misma DB `opo.db` (o OPO_DB_PATH). Múltiples instancias concurrentes posibles (aunque SQLite soporta mejor que muchos).

3. **Redis + BullMQ + Locks:**
   - Conexión Redis compartida del broker creada a nivel de módulo (`new Redis(REDIS_URL, { maxRetriesPerRequest: null })`).
   - Blackboard Redis: 3 clientes separados. Sin `maxRetries` gestionados en todos los paths ni circuit breaker.
   - BullMQ: workers/queues se crean por cada `CredentialKey` (initKeyQueue). Nunca se cierran excepto en `_close()` de tests. Jobs completados/fallidos se acumulan en Redis (sin `removeOnComplete` / `removeOnFail` configurado).
   - Locks semánticos (blackboard): acquire usa SET NX PX (correcto), pero release hace GET + condicional DEL (race condition posible bajo concurrencia alta; debería usar Lua script o WATCH).
   - No hay expiración automática de locks expirados (solo TTL en la key, pero `takeSnapshot` los reporta igual).
   - En dev Next.js: reinicios del servidor dejan conexiones Redis huérfanas (hasta timeout del server). Múltiples workers para misma key posible.

4. **Otros:**
   - Pipeline completo: cada agente hace LLM call + tool + snapshot + HIL posible. Sin batching ni caching de intent.
   - `getBlackboard()` singleton lazy pero una vez creado, si cambias env OPO_USE_MEMORY_BLACKBOARD no se recrea.
   - En `broker`: `consumption` crece en memoria sin límites ni persistencia.

---

## Vulnerabilidades de Seguridad

1. **Credential Vault (AES-256-GCM) — Problemas críticos de key management:**
   - Cifrado en sí parece correcto: IV random por entrada, authTag appended (`encrypted:tag`), GCM mode con setAuthTag en decrypt.
   - **Fuga del secret de cifrado:**  
     ```ts
     const secretHex = process.env.OPO_VAULT_SECRET || randomBytes(32).toString('hex');
     ```
     Si no se define `OPO_VAULT_SECRET`, genera uno nuevo **en cada `new CredentialVault()`**. Las keys almacenadas con un secret no se pueden desencriptar después de reiniciar el proceso. Pérdida total de datos en vault.
   - `getKey(id)` devuelve el **secreto en texto plano** (string). Nunca es llamado hoy, pero cuando se integre (ver agentExecutor comments), cualquier caller que lo ponga en logs, blackboard.set, snapshot.state, HIL context o SSE messages → **fuga inmediata**.
   - Actualmente **la inyección real de llaves no usa el Vault**: `agentExecutor` y `semanticRouter` siempre usan `apiKeys` del payload del cliente (frontend). El broker solo hace "rate limiting simulado" vía jobs. Vault es básicamente un CRUD UI + consumo dashboard, no un secreto runtime seguro.
   - `/api/vault` expone listKeys (metadata) pero cualquiera con acceso al endpoint puede ver qué providers están configurados.

2. **Fugas de datos / keys en Dashboard, Blackboard y Time-Travel:**
   - Snapshots (SwarmMemorySnapshot) guardan `state: Record<string, any>` + locks tal cual. Si algún agente o HIL request pone datos sensibles en blackboard (fácil vía `set`), aparece en FrameInspector (UI) y en la SQLite de timeline (JSON plaintext).
   - `HILManager.requestApproval(..., context: any)`: el contexto (en executor: `{ pipelineHistory }`) se almacena en blackboard bajo `hil:requests`. pipelineHistory contiene mensajes de agentes (posiblemente con datos de negocio sensibles). Se publica por PubSub.
   - TimelinePlayer + FrameInspector renderizan el snapshot completo en cliente sin sanitización.
   - No hay redacción (`redactSecrets`, `filterKeys`) en `takeSnapshot`, publish, o logs.
   - En `agentExecutor` el `pipelineHistory` y `contents` para Gemini incluyen todo el historial; si alguna vez se inyecta una key desencriptada aquí, queda en memoria y en posibles errores.

3. **Exposición de keys desde el cliente (herencia del AUDIT previo):**
   - `store/useStudioStore.ts`: `apiKeys` se persiste en localStorage (partialize explícito) y se envía en claro en cada POST a `/api/mesh/query` y posiblemente otros.
   - SettingsModal test: key va en query param de URL a Google (no solo al backend).
   - Ningún endpoint de vault se usa para obtener el secreto en tiempo de ejecución del mesh. El "motor distribuido" todavía depende de keys del browser.
   - En producción sin HTTPS (o con proxy mal configurado), keys viajan en body JSON.

4. **Otros riesgos:**
   - Errores crudos devueltos al cliente (`error: error.message`) pueden filtrar paths, queries internas, nombres de keys, etc.
   - Ausencia de validación de input en storeKey (cualquier string se cifra).
   - Mejor-sqlite3 y Redis sin autenticación/encriptación en tránsito por defecto (depende de deploy).
   - En `resource-broker.ts` y `blackboard`: no hay rate limiting real en el lado de consumo de Gemini más allá del mock de jobs.
   - No hay rotación de secrets ni auditoría de accesos al vault.
   - Docker-compose expone Redis y Postgres sin passwords fuertes en algunos servicios y sin volúmenes seguros para keys.

---

## Cobertura de Pruebas (Test Gaps)

**Estado actual (ejecución `npx vitest run`):**  
- 3 archivos de test, **10 tests pasaron** (444ms).  
  - `lib/engine/blackboard/blackboard.test.ts` (4 tests) — solo MemoryBlackboardAdapter.  
  - `lib/engine/broker/resource-broker.test.ts` (2 tests) — usa mocks pesados de ioredis/bullmq + parches `(ResourceBroker as any)` + setup manual de env.  
  - `lib/engine/guardrails/validator.test.ts` (4 tests) — cubre compile/validate + middleware retries (espera warnings en stderr).  

**Archivos críticos SIN cobertura (o cobertura cero en vitest):**

- `lib/mesh/agentExecutor.ts` — motor principal completo (pipeline, HIL integration, guardrails, LLM calls, tool exec, key acquire/release). Debe mockearse BullMQ + GoogleGenAI.
- `lib/engine/hil/hil-manager.ts` — timeouts, resoluciones, subscribe/unsubscribe races, persistencia en blackboard. (Mencionado explícitamente en Fase 2).
- `lib/engine/vault/credential-vault.ts` — encrypt/decrypt, store/get/list/delete, manejo del secret, close(). (Solo tocado indirectamente vía parches en broker test).
- `app/api/sessions/[sessionId]/timeline/route.ts` + clase inline `TimeTravelDB` — get/save, serialización, queries.
- `lib/mesh/semanticRouter.ts` — routing + LLM intent analysis.
- `lib/mesh/registry.ts`, `lib/mesh/opoRuntime.ts`, `lib/mesh/*` restantes.
- `lib/engine/blackboard/blackboard.ts` (Redis adapter real — solo memory se testea).
- `lib/engine/broker/resource-broker.ts` (lógica real de workers/locks sin mocks invasivos).
- Todos los routes de `app/api/` (mesh/query SSE, vault, hil, dashboard, studio/*, mcp/*). (No hay tests de API handlers).
- `components/studio/*` y `components/debugger/*` (UI logic, aunque hay @playwright/test en devDeps).
- Flujo completo E2E del canvas → query SSE → snapshots → HIL.
- No hay script `"test"` en package.json (solo se invoca vía npx).
- No cobertura de error paths reales (Redis down, DB locked, LLM rate limit, etc.).
- No tests de inicialización de singletons, cleanup, o comportamiento bajo HMR/restart de Next.js.

**Brechas adicionales:**
- Mocks de BullMQ en el broker test son incompletos (comentarios internos lo reconocen: "mocking BullMQ deeply ... is hard").
- No hay tests que validen que las keys **nunca** aparecen en snapshots/blackboard/logs.
- Falta de property-based testing o fuzz para guardrails/validator.

---

## Resumen de Hallazgos Clave y Riesgos Prioritarios

- El "nuevo motor distribuido" es una base sólida (BullMQ para broker, blackboard Redis/PubSub, HIL, guardrails Zod, vault AES-GCM, TimeTravel SQLite) pero **la integración de secrets es incompleta y peligrosa** si se termina de cablear sin las protecciones de Fase 2.
- **Prioridad máxima (seguridad):** Nunca exponer keys desencriptadas + patrón de cleanup Redis/SQLite + indexes + garbage collection de jobs/snapshots.
- **Prioridad alta (estabilidad):** Quitar hacks de release/acquire, tipar todo, unificar tipos de eventos SSE/PubSub, tests reales de executor + hil.
- El Time-Travel debugger está "medio implementado": la UI y la tabla existen, pero el engine no persiste snapshots y la DB no está optimizada.
- Mucha deuda de "cualquier cosa" heredada de prototipo (anys, singletons crudos, keys en cliente).

**Archivos que más impacto tendrán en Fase 2:**
- `lib/mesh/agentExecutor.ts`
- `lib/engine/broker/resource-broker.ts`
- `lib/engine/hil/hil-manager.ts`
- `app/api/sessions/[sessionId]/timeline/route.ts` (y extraer TimeTravelDB)
- `lib/engine/vault/credential-vault.ts` + `blackboard.ts`
- `app/api/mesh/query/route.ts` + `lib/engine/types/*`
- Agregar `vitest` calls + mocks buenos + script de test.

---

**FIN DE FASE 1 — DETENCIÓN OBLIGATORIA**

He completado la auditoría de solo-lectura y generado este `GROK_AUDIT.md` en la raíz.

**¿Estás de acuerdo con los hallazgos?**  
Por favor confirma explícitamente (sí / estoy de acuerdo / proceed / o con correcciones específicas) antes de que continúe con **FASE 2** (refactorización, escrituras, optimizaciones de seguridad, tests nuevos con `npx vitest run`, etc.).

Una vez que apruebes, procederé siguiendo las reglas:
- Código y comentarios en inglés.
- Comentarios `// GROK OPTIMIZATION: ...` en cambios centrales.
- Autonomía para `npm install`, `npx vitest run`, builds, etc.
- Solo después de tu OK.

Estoy listo para la siguiente fase cuando me des luz verde. ¿Procedo?
