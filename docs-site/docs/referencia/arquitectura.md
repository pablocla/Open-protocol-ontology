---
sidebar_position: 2
sidebar_label: 🗺️ Arquitectura de OPO
---

# Arquitectura General de OPO

El proyecto **Open Protocol Ontology (OPO)** está estructurado como una suite modular de herramientas que operan de forma conjunta para tender un puente semántico sobre sistemas de gestión corporativos legados.

A continuación, se detalla el mapa general de componentes y cómo fluye la información a través de ellos.

---

## Diagrama de Bloques General

El siguiente flujo describe cómo interactúa un usuario final con el sistema y cómo se traduce la consulta a través de las diferentes capas del ecosistema OPO hasta llegar a los datos físicos de la empresa:

```mermaid
graph TD
    subgraph Capa de Usuario (Interfaces)
        A[Usuario Final / Chat] -->|Lenguaje Natural| B(Claude / ChatGPT)
        A -->|Intents YAML / UI| C[OPO Studio Canvas]
    end

    subgraph Capa de Orquestacion (Cognitive Mesh)
        B -->|Model Context Protocol| D[Servidor MCP OPO]
        C -->|Intent Executor| E[Mesh Runtime / Swarm]
    end

    subgraph Capa Semantica (Core SDK)
        D -->|OPOQL Query| F[opo-sdk / Core Translator]
        E -->|OPOQL Query| F
        G[/.well-known/opo.json] -->|Describe Esquemas| F
    end

    subgraph Capa del Sistema (ERP)
        F -->|Select SQL Seguro| H[(Base de Datos ERP - Read Only)]
        F -->|Mutaciones REST| I{API REST ERP - Write}
    end
```

---

## Detalle de Componentes

### 1. Interfaces y Clientes de Entrada
*   **OPO Studio:** La consola web visual (React/Next.js) utilizada para diseñar la ontología, configurar los Empleados Virtuales (Agentes), y probar flujos de trabajo locales (con Ollama).
*   **Modelos de Lenguaje (LLMs externos):** Herramientas externas como Claude Desktop o Cursor que se conectan al servidor MCP de OPO para dar superpoderes corporativos al chat de desarrollo del usuario.

### 2. Capa de Orquestación (Cognitive Mesh & MCP)
*   **Servidor MCP (Model Context Protocol):** Expone las consultas semánticas como herramientas estándar y seguras que los LLMs pueden invocar en tiempo real.
*   **Mesh Runtime:** El motor que controla la comunicación entre los múltiples agentes configurados en OPO Studio. Coordina el paso de tokens de control (Handover) y consolida los contextos lógicos compartidos.

### 3. Core SDK y Traductores (OPO Engine)
*   **opo-sdk:** Librería base escrita en TypeScript que procesa las queries semánticas (OPOQL).
*   **sqlTranslator.ts:** Módulo del SDK encargado de compilar OPOQL a código SQL crudo parametrizado. Integra automáticamente las políticas del sistema de destino (ej: inyectar `D_E_L_E_T_ = ' '` para Protheus o mapear las tablas del diccionario `SX`).

### 4. Sistemas de Gestión Empresarial (ERP)
*   **Base de Datos (SQL Server, Oracle, Postgres):** Los repositorios de datos finales que se acceden únicamente en modalidad de **solo-lectura** mediante consultas compiladas de forma segura.
*   **Servicios REST (AdvPL/TLPP en Protheus, OData en SAP):** Canales web oficiales del ERP que el motor de OPO consume de manera obligatoria cuando un agente necesita realizar mutaciones (escribir, actualizar o borrar datos), garantizando la correctitud y ejecución de todas las reglas de negocio de la empresa.
