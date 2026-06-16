---
sidebar_position: 3
sidebar_label: 🎛️ Lienzo Visual (Canvas)
---

# El Lienzo Visual (GraphCanvas)

El corazón interactivo de OPO Studio es su **Lienzo Visual (Canvas)**, construido sobre `@xyflow/react` (anteriormente React Flow).

Este entorno interactivo te permite arrastrar componentes, definir dependencias y trazar el mapa de tus datos y agentes conectando nodos mediante cables visuales (aristas/edges).

---

## Tipos de Nodos Disponibles

Cada componente en tu arquitectura se representa mediante un tipo de nodo específico en el lienzo:

| Nodo | Nombre en UI | Color | Propósito |
| :--- | :--- | :--- | :--- |
| **EntityNode** | `Área de Negocio (Entidad)` | Azul | Representa una entidad de datos mapeada de tu ERP (ej: `Clientes`, `Facturas`). Muestra sus campos semánticos y tipos de datos. |
| **AgentNode** | `Empleado Virtual` | Violeta | Representa un agente de IA con su propio rol (system prompt), modelo asignado y un chat de pruebas integrado. |
| **ToolNode** | `Habilidad SQL / REST` | Gris | Funciones directas autogeneradas por OPO para leer o escribir información en el sistema (ej: `get_invoice_by_id`). |
| **MCPToolNode** | `Habilidad MCP Externa` | Amarillo | Herramientas provistas por servidores MCP de terceros (ej: buscar archivos en disco, mandar mails por Gmail). |
| **N8nNode** | `Conector n8n` | Naranja | Webhooks de n8n para gatillar flujos de integración externos y automatizaciones tradicionales. |
| **ApprovalNode** | `Aprobación Humana` | Rojo | Nodo de control (Human-in-the-loop) que frena la ejecución hasta que un usuario apruebe la acción físicamente. |
| **ActionNode** | `Acción Genérica` | Celeste | Pasos lógicos intermedios o llamadas a microservicios externos. |
| **TriggerNode** | `Disparador` | Verde | Eventos iniciales que inician el flujo (ej: "Llegó un nuevo mail con factura"). |

---

## Cómo interactuar con el Canvas

* **Arrastrar y soltar:** Abre el panel lateral izquierdo (`SidebarLeft`), selecciona un nodo y arrástralo al lienzo.
* **Conectar cables:** Haz clic y mantén presionado en los círculos laterales de un nodo (Handles) y arrastra el cable hacia el handle de otro nodo para conectarlos.
  - Conectar una **Entidad** a una **Habilidad (Tool)** mapea automáticamente los parámetros.
  - Conectar una **Habilidad** a un **Empleado Virtual (Agent)** le concede al agente acceso a ejecutar esa habilidad.
* **Seleccionar y configurar:** Al hacer clic en cualquier nodo, el panel derecho (`SidebarRight`) se actualizará mostrando su configuración detallada (ej: cambiar el LLM o renombrar campos).
* **Eliminar:** Selecciona un nodo y presiona la tecla `Supr` o `Backspace` en tu teclado, o haz clic en el botón de basura en su tarjeta de propiedades.
