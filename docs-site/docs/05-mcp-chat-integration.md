---
sidebar_position: 5
---

# Integración MCP (Chat)

El **Model Context Protocol (MCP)** es un estándar abierto que permite a los asistentes de inteligencia artificial (como Claude Desktop, Cursor o agentes personalizados) descubrir e interactuar con herramientas y datos locales de forma segura.

OPO provee un servidor MCP nativo. Esto significa que puedes exponer toda la ontología de tu empresa directamente a tu interfaz de chat favorita, permitiéndole a la IA consultar bases de datos ERPs usando **OPO-QL**.

## Servidor OPO MCP

El paquete `opo-sdk` expone un comando para inicializar un servidor MCP a través de los protocolos de transporte estándar (stdio o SSE).

### Iniciar el Servidor

```bash
npx opo-mcp serve --registry ./registry --port 8080
```

Al inicializar este servidor, el OPO expone a la red (o por stdio) las "Tools" de MCP. Una de las herramientas principales expuestas es:

- `executeOpoQl(query: OpoQlDocument)`: Una herramienta que la IA puede llamar enviándole un JSON OPO-QL. El servidor transpilará esa consulta y se la enviará al sistema físico correspondiente.

## Conectando Claude Desktop

Si usas la aplicación Claude Desktop, puedes configurarla para que hable con OPO de forma transparente.

1. Abre la configuración de Claude Desktop (generalmente en `~/.anthropic/claude_desktop_config.json`).
2. Agrega OPO a la lista de servidores MCP:

```json
{
  "mcpServers": {
    "opo-ontology": {
      "command": "npx",
      "args": ["opo-mcp", "serve", "--registry", "C:/mi-proyecto/registry"]
    }
  }
}
```

3. Reinicia Claude. A partir de ahora, puedes escribirle: *"¿Cuáles son los montos de facturación del cliente Acme Corp en nuestro SAP?"* y Claude utilizará la herramienta MCP de OPO para traducir tu pregunta a OPO-QL, ejecutarla y darte la respuesta en lenguaje natural.
