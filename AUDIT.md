# AUDIT: Exploración y Auditoría OPO Studio

## 1. Rutas de API y Responsabilidad Inferida
Las siguientes rutas se encuentran en `app/api/`:
- `mesh/query/route.ts`: Engine principal. Recibe el request del mesh (query, ontología, api keys), registra herramientas dinámicamente desde `.well-known/opo.json`, enruta el intent vía `semanticRouter`, e inicia la ejecución pipeline de agentes mandando mensajes por Server-Sent Events (SSE).
- `mesh/registry/route.ts`: Administra el registro de Tools y Agents.
- `studio/discover/route.ts`: Conecta a bases de datos (Postgres, MySQL, SQLite, Oracle, MSSQL) para inferir entidades dinámicamente y devolverlas para el canvas.
- `studio/load/route.ts`: Carga el estado guardado del canvas (mock/local storage backend).
- `studio/save/route.ts`: Guarda el estado del canvas.
- `studio/rest-explore/route.ts`: Proxy server-side para explorar endpoints REST y evitar CORS en el UI del Studio.
- `studio/ollama-enrich/route.ts`: Llama a un entorno Ollama local para inferir y autogenerar entidades a partir del payload JSON.
- `studio/test-connection/route.ts`: Prueba genérica de conectividad (ej. n8n u otros endpoints).

## 2. Componentes React del Canvas
Ubicados en `components/studio/canvas/`:
- **Nodos:** `ActionNode.tsx`, `AgentNode.tsx`, `EntityNode.tsx`, `N8nNode.tsx`, `ToolNode.tsx`, `TriggerNode.tsx`
- **Utilidades/UI:** `CanvasEmptyState.tsx`, `ContextMenu.tsx`, `GraphCanvas.tsx` (Contenedor principal de ReactFlow).

## 3. Dependencias Actuales (Summary de package.json)
- **Core:** Next.js 15.4.9, React 19.2.1, TypeScript 5.9.3.
- **UI & State:** `@xyflow/react` (Canvas), `zustand` (State management), `tailwindcss` & `lucide-react`.
- **LLM & AI:** `@google/genai` (Integración nativa Gemini).
- **Base de Datos & APIs:** `pg`, `mysql2`, `mssql`, `better-sqlite3`, `oracledb` (Drivers de auto-discovery), `@modelcontextprotocol/sdk`.
- **Validación:** `ajv`, `ajv-formats`.
- **Utils:** `chalk`, `commander`, `prompts` (CLI utils).

## 4. Deuda Técnica Encontrada (TECHNICAL_DEBT.md target)
- **API Keys Globales:** Las llaves de OpenAI, Anthropic y Gemini se pasan en crudo desde el frontend al backend en el payload del `mesh/query`. No hay almacenamiento encriptado.
- **Acoplamiento Fuerte:** El `agentExecutor.ts` y `semanticRouter.ts` crean instancias de `GoogleGenAI` hardcodeadas en base a las llaves recibidas en la petición. No hay abstracción para inyección de dependencias segura.
- **Falta de Memoria en el Mesh:** Cada ejecución del mesh lanza el pipeline (`executePipeline`) de manera efímera. Los agentes no comparten un estado real más allá del context prompt.
- **Falta de Rate Limiting:** No hay control de concurrencia. Si el canvas tiene 10 nodos agente, y todos se disparan, golpean la API de Gemini simultáneamente.

## 5. Decisiones de Arquitectura a no romper
- **Compatibilidad MCP:** El archivo `.well-known/opo.json` es el estándar actual. Se debe extender, no modificar destructivamente.
- **Server-Sent Events (SSE):** El pipeline en `mesh/query/route.ts` usa un `ReadableStream` para reportar progreso en tiempo real. Esta mecánica de reporte (logs) al frontend no debe romperse al reescribir el Engine.
- **Visual Node Typings:** Los nodos `EntityNode`, `AgentNode`, etc., tienen atributos estandarizados (`data.label`, `data.attributes`). El nuevo motor debe parsear estos mismos objetos.
