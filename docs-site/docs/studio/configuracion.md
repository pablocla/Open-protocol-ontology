---
sidebar_position: 9
sidebar_label: ⚙️ Configuración (Settings)
---

# Modal de Configuración (SettingsModal)

Para gestionar tus API Keys, configurar los servidores de base de datos e integrar herramientas externas de forma segura, OPO Studio cuenta con un panel unificado de **Configuración (Settings)** al que puedes acceder haciendo clic en el icono de **Engranaje** en la barra superior.

---

## 1. Proveedores de Modelos de IA (LLM Providers)

OPO Studio soporta una arquitectura híbrida (nube y local) para procesar el razonamiento de los agentes:

### Ollama (Local y Gratuito)
* **Uso:** El motor ideal para pruebas de concepto, desarrollo local y para procesar información confidencial del ERP que no puede salir de los servidores de la empresa.
* **Requisitos:** Tener instalado Ollama en tu máquina y el modelo que deseas usar (ej: `llama3` o `qwen2.5`).
* **Configuración:** Indica la URL de tu endpoint local (por defecto `http://localhost:11434`).

### OpenAI / Google / Anthropic / xAI (Grok)
* **Uso:** Ideal para flujos de trabajo que requieran razonamiento avanzado, análisis complejo de textos comerciales o multilingüismo de alto nivel.
* **Configuración:** Debes colocar tu API Key personal en el campo correspondiente. Estas claves se guardan localmente en tu navegador/workspace (filosofía *Bring Your Own Key* - BYOK) y no son transmitidas a ningún servidor de OPO.

---

## 2. Parámetros de Base de Datos

Aquí configuras la conexión al motor de tu ERP o base de datos de producción:

- **DATABASE_URL:** La cadena de conexión en formato URI (ej. `postgresql://usuario:pass@localhost:5432/db` o `mssql://...`).
- **Dialecto:** Selección del driver de conexión (PostgreSQL, SQL Server u Oracle).
- **Esquema de Diccionario (Protheus):** Para sistemas Protheus, puedes habilitar la lectura de las tablas `SX2/SX3/SX9` indicando en qué base de datos y esquema se alojan dentro de tu servidor corporativo.

---

## 3. Integración con n8n y Webhooks

OPO Studio puede enviar eventos directamente a flujos de trabajo tradicionales en n8n:

- **Webhook URL:** Registra la URL expuesta por tu disparador de webhook en n8n.
- **Canal de Aprobación:** Define a qué webhook debe llamar el nodo `ApprovalNode` cuando requiera una firma humana para continuar la ejecución de una acción.
