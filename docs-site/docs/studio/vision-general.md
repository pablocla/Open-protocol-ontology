---
sidebar_position: 1
sidebar_label: 🎨 Visión General
---

# OPO Studio: Visión General

**OPO Studio** es el panel de control visual y entorno de orquestación de bajo código del Open Protocol Ontology. 

Ha sido diseñado específicamente para que **Analistas de Negocio, Consultores Funcionales y Administradores de ERPs** puedan conectar bases de datos complejas e inyectar Inteligencia Artificial en sus procesos corporativos de forma segura, rápida y sin escribir código.

```mermaid
graph TD
    subgraph OPO Studio (Canvas)
        A[Conexión ERP] --> B[Auto-descubrimiento]
        B --> C[Lienzo Visual / Nodos]
        C --> D[Swarm de Agentes]
    end
    
    D -->|Exportar| E[Servidor MCP Local]
    D -->|Ejecutar| F[Malla Cognitiva en Vivo]
```

---

## El Rol del Analista

Tradicionalmente, programar un bot de IA para que consulte un ERP requería meses de desarrollo: escribir APIs personalizadas, mapear esquemas JSON, configurar integraciones de red y pagar costosas API Keys. 

OPO Studio elimina esta fricción. Como consultor funcional o analista de negocio, conoces las reglas y cómo operan las tablas en tu ERP. Con OPO Studio, puedes:
- Conectar tu base de datos mediante una interfaz visual simple.
- Dejar que el motor de auto-descubrimiento analice las tablas y relaciones (`SX9` en Protheus, etc.).
- Diseñar el flujo arrastrando nodos en un canvas de forma intuitiva.
- Configurar y probar "Empleados Virtuales" al instante usando modelos locales gratuitos (Ollama).

---

## Interfaz de OPO Studio

Al ingresar a la interfaz, te encontrarás con tres áreas principales de trabajo:

### 1. El Lienzo Visual (GraphCanvas)
Es la cuadrícula central interactiva basada en `@xyflow/react`. Aquí arrastras, ordenas y conectas diferentes componentes:
- **Entidades (Entity):** Muestran el mapeo de tablas (ej. `Clientes`).
- **Empleados (Agent):** Representan los cerebros de IA configurados.
- **Habilidades (Tool/n8n):** Las acciones que los agentes pueden ejecutar.

### 2. Panel de Configuración Lateral (SidebarRight)
Cuando seleccionas un nodo en el canvas, este panel se abre a la derecha para permitirte refinar sus propiedades:
- Editar el System Prompt de un agente.
- Seleccionar el modelo (Llama3, Gemini, GPT-4).
- Mapear nombres de columnas físicas a nombres lógicos en una entidad.

### 3. Ejecución en Mosaico (NodeChatInterface)
Cada nodo de agente cuenta con un botón de chat. Al hacerle clic, se abre una ventana de chat integrada dentro del propio nodo en el canvas. Esto te permite chatear e interactuar con múltiples agentes al mismo tiempo en paralelo (Mosaico), probando individualmente sus respuestas y habilidades antes de desplegarlos a producción.
