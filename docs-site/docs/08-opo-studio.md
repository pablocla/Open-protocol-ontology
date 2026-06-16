---
sidebar_position: 8
---

# OPO Studio

**OPO Studio** es el "Enterprise AI Control Plane" del Open Protocol Ontology. Es una interfaz visual y un entorno de orquestación diseñado para resolver uno de los problemas más grandes de la Inteligencia Artificial Empresarial: **la falta de contexto unificado y coordinación semántica.**

## ¿Qué problema resuelve?

Hoy en día, las arquitecturas Multi-Agente (como LangGraph, CrewAI o BridgeSwarm) se enfocan en coordinar agentes para que escriban código o procesen texto. Su mayor limitación en entornos corporativos es que carecen de un entendimiento unificado del negocio:

- Si un agente necesita datos de un "Cliente", no sabe si buscar en SAP, Salesforce o una base de datos SQL.
- No conoce qué campos conforman a ese "Cliente" (¿es `customerId`, `id_cliente` o `AccountID`?).
- Los agentes terminan "alucinando" integraciones porque no comparten una ontología.
- Cada agente tiene su propio estado aislado y gasta tokens redundantes descubriendo el esquema de datos.

OPO Studio introduce el concepto de **Cognitive Mesh (Malla Cognitiva)**.

## ¿Qué es OPO Studio?

Es un entorno visual (basado en nodos) donde modelas la Ontología de tu negocio, registras a tus Agentes IA y conectas tus Herramientas (APIs, Bases de Datos, n8n), todo en un solo grafo. 

Este grafo se convierte en la "Memoria Semántica" absoluta de tu empresa. Cuando un agente ejecuta una tarea, no tiene que adivinar cómo es tu base de datos; la ontología le provee el mapa exacto de cómo interactuar.

## Características Principales

### 1. Semantic Memory Builder (Canvas Visual)
Puedes arrastrar y soltar nodos para mapear tu negocio:
- **Entity Nodes (Entidades):** Define tus modelos de datos (ej. `Factura`, `Cliente`, `Producto`), sus atributos y las relaciones entre ellos (1:1, 1:N).
- **Agent Nodes (Agentes):** Configura agentes especializados (ej. `Data Analyst`, `SQL Querier`, `Reviewer`), asígnales un modelo (Gemini, Claude, GPT-4o) y define sus *capabilities* (capacidades).
- **Tool Nodes (Herramientas):** Conecta endpoints reales (Servidores MCP, Webhooks de n8n, APIs REST o conexiones SQL directas).

### 2. Generación de Servidores MCP (Model Context Protocol)
Con un solo click en **"Generar MCP"**, OPO Studio toma todo tu canvas visual y compila un servidor MCP listo para usar. Este servidor expone tu ontología empresarial como herramientas (tools) estandarizadas que cualquier LLM compatible con MCP (Claude Desktop, Cursor, etc.) puede consumir.

### 3. Declarative Intents (Intenciones Declarativas)
En lugar de depender de prompts conversacionales ambiguos, OPO Studio utiliza un motor de ejecución basado en YAML. Puedes escribir "Intents" claros y reproducibles:

```yaml
goal: "Analizar las ventas del mes pasado y generar un reporte"
agents: auto
memory: ontology
execution: mcp
review: enabled
```

### 4. Malla Cognitiva en Tiempo Real (Ejecución)
OPO Studio cuenta con un panel de ejecución (`Execute Mesh`) que orquesta a tus agentes en tiempo real. 
- Muestra qué agente está trabajando.
- Qué herramienta está llamando.
- Y cómo los agentes se pasan el contexto entre sí (Handover).

## Cómo Empezar a Usarlo

1. **Inicia OPO Studio:** 
   Corre `npm run dev` en la raíz del proyecto y navega a `http://localhost:3000/studio`.
2. **Configura tus API Keys:**
   Abre las **Settings** (icono de engranaje) y coloca tu API Key de Gemini, OpenAI o Anthropic. Los agentes utilizan estas llaves localmente (Bring Your Own Key).
3. **Mapea tu Negocio:**
   Añade nodos de **Entity** para definir tu modelo de negocio. Puedes probar con el botón "Demo Protheus" en la pantalla de inicio para cargar un ERP de ejemplo.
4. **Crea tus Agentes:**
   Añade nodos de **Agent** y asociales un rol (ej: system prompt: "Eres un experto en ventas...").
5. **Genera o Ejecuta:**
   - Si quieres usar la ontología en otra app (ej. Claude Desktop), dale a **Generar MCP**.
   - Si quieres ejecutar flujos ahí mismo, abre el panel de **Execute Mesh** y corre un *Intent*.
