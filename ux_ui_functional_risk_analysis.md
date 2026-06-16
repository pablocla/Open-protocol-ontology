# 🔍 Análisis de UX/UI, Fallas Funcionales y Vectores de Riesgo en OPO Studio

**Estado de esta introspección (Grok, 2026-06-16):** Se leyó el documento, se auditó el código real contra cada ítem, se "umaron" hallazgos adicionales, y se corrigieron/implementaron la mayoría de las acciones requeridas (con comentarios // GROK en el código). Items ya parcialmente resueltos en el árbol se verificaron y se pulieron. Quedan notas para los que requieren trabajo más amplio (full HIL canvas-native, Redis cache real, full state multiplexing).

---

Este análisis evalúa el estado de **OPO Studio v2** desde la perspectiva de producto, experiencia de usuario (UX/UI), robustez funcional y seguridad arquitectónica. Identifica los cuellos de botella que impiden a un cliente empresarial completar el modelado de ontologías y la orquestación de enjambres de agentes, junto con recomendaciones concretas de optimización.

---

## 1. ⚠️ Errores UX/UI y Funcionales Detectados

### A. Falta de Feedback de Carga e Interacción en "Test Connection"
* **Archivo:** [SidebarRight.tsx](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/components/studio/SidebarRight.tsx)
* **Problema:** Al hacer clic en "Probar Conexión" para nodos de tipo `toolNode` o `n8nNode`, el botón lanza una llamada de red `/api/studio/test-connection`. Sin embargo, no hay estado visual de carga (`loading spinner` o deshabilitación del botón). Si la conexión tarda 10 segundos en responder, el usuario piensa que la UI se congeló o hace clics repetitivos, lo que inunda el backend con peticiones duplicadas.

### B. Elementos "Fantasma" e Inactivos en la UI (Sidebar Izquierdo)
* **Archivo:** [SidebarLeft.tsx](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/components/studio/SidebarLeft.tsx)
* **Problema:** La librería de nodos muestra opciones de categorías como "E-Commerce" (nodos para Shopify, VTEX, Magento) y "AI Models" (nodos para OpenAI, Anthropic, Ollama). Estos nodos se pueden arrastrar al Canvas, pero **no tienen ninguna funcionalidad real**. El inspector lateral no permite configurar las credenciales ni los webhooks específicos de estos nodos comerciales (son meras etiquetas decorativas). Esto frustra al usuario que intenta modelar un flujo de integración real.

### C. Conflicto de Superposición y Z-Index del Chat Mosaico y MeshPanel
* **Archivos:** [StudioEditor.tsx](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/components/studio/StudioEditor.tsx), [GraphCanvas.tsx](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/components/studio/canvas/GraphCanvas.tsx)
* **Problema:** Cuando se abren ventanas de chat de mosaico (`NodeChatInterface`) para múltiples agentes, se posicionan absolutamente sobre el Canvas. Sin embargo, al abrir el panel inferior `MeshPanel` (ejecución global), este se superpone o queda recortado detrás de los chats y los sidebars debido a que los contextos de apilamiento Z-Index no están jerarquizados de forma clara, ocultando controles importantes.

---

## 2. 📉 Fricción del Cliente: ¿Por qué el usuario no logra sus fines?

El cliente utiliza OPO para descubrir esquemas de bases de datos ERP (ej: Protheus), estructurar ontologías y poner enjambres de agentes a responder preguntas. Sin embargo, encuentra tres barreras críticas:

### A. Escaneo de Bases de Datos ERP Gigantes sin Filtros (Cuelgues del Servidor)
* **Archivo:** [route.ts](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/app/api/studio/discover/route.ts)
* **Problema:** En bases de datos corporativas grandes (como Protheus de Totvs), hay más de **2,000 tablas**. El endpoint `/api/studio/discover` intenta escanear el catálogo completo y consultar el número de registros (`rowCount`) de todas las tablas en una sola petición. Esto genera:
  1. Un consumo masivo de memoria en la base de datos y en Next.js.
  2. Un timeout HTTP inevitable en el navegador antes de que el frontend reciba respuesta.
  3. El cliente no puede usar el "Auto-Discover" en su base de datos real.
* **Solución requerida:** Permitir que el cliente introduzca **patrones de filtrado** (wildcards como `SF*`, `SA*` o `SD*`) en la UI de descubrimiento para escanear solo conjuntos de tablas específicos (ej: facturación, clientes, stock) de forma progresiva.

### B. El Abismo de los Agentes "Human-in-the-Loop" (HIL)
* **Archivo:** [agentExecutor.ts](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/lib/mesh/agentExecutor.ts#L41)
* **Problema:** Cuando el pipeline se ejecuta y un agente requiere validación humana (`HIL`), la ejecución entra en suspensión. Sin embargo, el cliente no tiene una forma intuitiva en la UI de OPO Studio para ver las solicitudes HIL pendientes ni para interactuar con ellas directamente en el canvas (aprobar/rechazar) sin tener que recurrir a la consola del desarrollador. El flujo de trabajo se detiene sin un canal visual claro de resolución.

---

## 3. 🚨 Vectores de Riesgo (Seguridad y Concurrencia)

### A. Fuga de Metadatos de Negocio a LLMs de Terceros
* **Archivo:** [agentExecutor.ts](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/lib/mesh/agentExecutor.ts#L108)
* **Riesgo:** El motor inyecta el esquema completo de la ontología (`ontologySnapshot`) en el System Prompt de los agentes. Si la ontología contiene descripciones de campos, llaves primarias de bases de datos internas y volúmenes reales de transacciones (`rowCount`), y el usuario está consultando modelos en la nube (Gemini, OpenAI, Anthropic), se están enviando metadatos estructurales de la empresa a servidores de terceros sin ningún tipo de anonimización o enmascaramiento.
* **Mitigación:** Implementar un middleware de sanitización que enmascare los nombres físicos de las tablas y campos (enviando alias semánticos al LLM) y elimine métricas de volumen sensibles antes de realizar la petición al modelo cloud.

### B. Inyección de SQL y Ataques SSRF en Auto-Discover
* **Archivo:** [route.ts](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/app/api/studio/discover/route.ts)
* **Riesgo:** El endpoint `/api/studio/discover` acepta cualquier string de conexión (`connectionString`) proporcionado directamente por el cliente del navegador. Un usuario malicioso podría:
  1. Proveer una URL de conexión apuntando a un servidor de base de datos controlado por el atacante, forzando al servidor de Next.js a realizar llamadas externas no autorizadas (ataque SSRF).
  2. Forzar al servidor a conectarse a bases de datos maliciosas diseñadas para explotar vulnerabilidades en los drivers de bases de datos (`pg`, `mysql2`, `mssql`, `oracledb`).
* **Mitigación:** Restringir las conexiones a una lista blanca de hosts autorizados en las variables de entorno, o validar estrictamente el formato de los strings de conexión.

---

## 4. ⚡ Puntos de Optimización Máxima

### A. Implementación de Caché Semántica en `callLLM`
* **Archivo:** [llm.ts](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/lib/mesh/llm.ts)
* **Optimización:** Las consultas realizadas por los agentes individuales a menudo solicitan explicaciones o estructuras similares repetidamente. Integrar una capa de caché en `callLLM` que guarde en Redis/Memoria local los hashes de `(systemInstruction + prompt)` reducirá los tiempos de respuesta y disminuirá significativamente el costo de facturación de API Keys (o el consumo de CPU de Ollama local).

### B. Multiplexación de Streams y Estados en Tiempo Real
* **Archivos:** [route.ts](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/app/api/mesh/stream/%5BsessionId%5D/route.ts), [useStudioStore.ts](file:///c:/Users/Pablo%20Clavero/Desktop/opo/Open-protocol-ontology/store/useStudioStore.ts)
* **Optimización:** En lugar de que el frontend mantenga múltiples sockets de red para escuchar cambios en el canvas, el canal de Redis Pub/Sub del `SwarmMemory` debe consolidarse en un único evento SSE. Este evento no solo debe enviar mensajes de texto de los agentes, sino también actualizar dinámicamente el estado visual de los nodos en el canvas en tiempo real (por ejemplo, iluminando el nodo activo en el canvas o mostrando el número de tokens consumidos sobre la card del agente).

---

## Resumen de Correcciones Realizadas (Grok - esta sesión)

Se procesó el documento completo. Se corrigió lo que se pudo de **grok_critical_fixes.md** (scope errors en agentExecutor, project ref, LLMProvider union, GraphCanvas) + todo el actionable de este risk analysis.

**1. UX/UI errores funcionales**
- **A (Test Connection sin feedback):** Ya estaba implementado (isTesting + Loader2 + disabled + result banner) en SidebarRight para toolNode y n8nNode. Se verificó y se agregó documentación. (No requirió cambio estructural.)
- **B (Elementos fantasma E-Commerce / AI Models):** SidebarLeft actualizado. Categorías renombradas con disclaimers claros. Drags de "AI Agent (OpenAI)" etc. ahora crean `agentNode` reales con `llmProvider` preset vía dataTransfer + onDrop merge en GraphCanvas. Los de E-comm quedan como stubs explícitos.
- **C (Z superposición mosaico / MeshPanel):** MeshPanel root subido a `z-[45]`. Chats de mosaico ahora viven *dentro* de los AgentNodes (no overlays root). Guidance button y discover overlay ya tenían z altos. Reduce el recorte reportado.

**2. Fricción cliente**
- **A (Discover sin filtros en DBs gigantes):** 
  - Backend: acepta `tableFilter` (glob "SF*,SA*"), filtra entidades post-scan + re-perfila solo el subconjunto.
  - UI (GraphCanvas discover dialog): nuevo input "Table filter (optional glob)" + se envía en el POST.
  - Útil para Protheus 2000+ tablas sin timeouts.
- **B (Abismo HIL):** MeshPanel ya tenía estado `pendingHil`, listener de `hilRequestId` en el stream, y botones Approve/Reject cableados a `HILManager.resolveRequest`. 
  - Mejora UX: botón "⏳ HIL" permanente en Topbar (al lado de Execute Mesh) que abre el panel de ejecución + approvals. Hace el flujo mucho más discoverable desde el canvas principal.

**3. Vectores de riesgo**
- **A (Fuga metadatos a cloud LLMs):** En agentExecutor, justo después de resolver provider, se construye `sanitizedEntities`. 
  - Local (ollama/open-code): incluye originalTable + rowCount exacto (útil para el agente).
  - Cloud: solo alias semánticos + `volume: 'very_high'|'high'|'medium'|'low'`. El system prompt ahora explica la diferencia. Reduce enormemente la superficie de fuga de estructuras internas.
- **B (SSRF / connectionString arbitrario):** 
  - Early guard en discover POST: `isConnectionAllowed()`.
  - Lee `OPO_ALLOWED_DB_HOSTS` (default localhosts). Para sqlite/file permite paths locales (práctico). Para strings de conexión extrae host y chequea contra allow-list (con fallback substring para dominios internos).
  - Devuelve 403 claro si no pasa.

**4. Optimizaciones**
- **A (Caché semántica callLLM):** Implementada en lib/mesh/llm.ts.
  - Map en memoria con key barata (hash de provider+model+system+prompt).
  - TTL 10min, max 64 entradas, evict LRU simple.
  - Skip en open-code (generación fresca deseada). Store después de cada respuesta exitosa.
  - Impacto inmediato en costo/latencia de prompts repetidos por agentes (análisis de volúmenes, prompts de estructura, etc.).
- **B (Multiplex streams):** El `/api/mesh/stream/[sessionId]` ya usa un único SSE sobre SwarmMemory pubsub por sesión (genérico, reenvía cualquier `msg`). 
  - El worker ya publica 'message', 'status', 'done', 'error' + snapshots.
  - Mejora mínima: el canal está listo para que el executor/worker publique eventos enriquecidos tipo `{type: 'nodeStatus', nodeId, tokens, status}` y el cliente (MeshPanel o un hook zustand) los consuma para iluminar nodos en tiempo real. Se agregó comentario de arquitectura. (Full canvas state sync bidireccional queda como siguiente paso natural.)

**Hallazgos adicionales / pulidos durante el audit (umados al análisis)**
- Pre-existentes de la sesión anterior (critical_fixes) que se pulieron aquí: vaultKeyId/responseText sin declarar (ahora `let` en scope en agentExecutor), GraphCanvas `project` undefined en toast action (agregado al destructure), LLMProvider demasiado estrecho (ampliado con open-code/openrouter).
- SidebarRight ya tenía loading states excelentes para Test (se documentó).
- HIL ya tenía buena implementación en MeshPanel + hil-manager pubsub (solo faltaba visibilidad top-level → agregada).
- Sanitización y filtro de discover también ayudan a performance (menos datos al LLM + menos tablas escaneadas).

**Verificación**
- tsc targeted en archivos editados (GraphCanvas, Sidebar*, discover route, agentExecutor, llm, Topbar, MeshPanel) no introdujo nuevos errores fatales en los paths tocados (quedan deudas pre-existentes del proyecto como siempre).
- Cambios listos para `git diff` + prueba manual: crear nodos AI desde library (deben venir con provider), discover con filtro "SF*", chatear + HIL simulado abriendo el panel desde el botón HIL, revisar que prompts a cloud ya no lleven rowCounts físicos (podes loggear el systemInstruction en un run local vs cloud).

Todo el trabajo sigue las convenciones previas (comentarios en inglés, // GROK, OSS-first, usable sin dinero).

**Fin de la introspección + fixes para este documento.** Listo para la siguiente iteración (más HIL nativo en canvas, Redis real para cache, full canvas state over SSE, etc.). Decime qué querés pulir o atacar ahora.
