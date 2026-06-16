# Guía completa: Open Protocol Ontology (OPO)

Tutorial para ver todo el proyecto, ejecutar todas las funciones localmente y/o pasarlo a Claude para análisis.

**Repositorio:** https://github.com/pablocla/Open-protocol-ontology

---

## Tabla de contenidos

1. [Cómo obtener el proyecto](#1-cómo-obtener-el-proyecto)
2. [Requisitos previos](#2-requisitos-previos)
3. [Instalación y arranque local](#3-instalación-y-arranque-local)
4. [Qué ver y probar en la web](#4-qué-ver-y-probar-en-la-web)
5. [Comandos CLI](#5-comandos-cli-todas-las-funciones)
6. [Tests y build de producción](#6-tests-y-build-de-producción)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Pasarlo a Claude para análisis](#8-pasarlo-a-claude-para-análisis)
9. [Checklist rápido](#9-checklist-rápido)
10. [Problemas frecuentes](#10-problemas-frecuentes)

---

## 1. Cómo obtener el proyecto

### Opción A — Clonar desde GitHub (recomendada)

```bash
git clone https://github.com/pablocla/Open-protocol-ontology.git
cd Open-protocol-ontology
```

### Opción B — Compartir sin Git

Pablo puede:

1. **Invitar al colaborador** en GitHub (Settings → Collaborators).
2. **Enviar un ZIP** del proyecto (sin `node_modules/` ni `.next/`).
3. **Crear un release** en GitHub con el código empaquetado.

> **Importante:** `.env` está en `.gitignore` y no se sube al repo. Cada persona debe crear el suyo desde `.env.example`.

---

## 2. Requisitos previos

| Requisito | Versión / nota |
|-----------|----------------|
| **Node.js** | 20 LTS o superior |
| **npm** | Viene con Node |
| **Git** | Para clonar |
| **Redis** | Opcional (mejora ejecución de swarms; sin Redis usa memoria) |
| **Visual Studio Build Tools** | Solo en Windows, si falla `better-sqlite3` al instalar |

### Verificar instalación

```bash
node -v    # debe ser v20+
npm -v
git --version
```

### Windows: si `npm install` falla en módulos nativos

```powershell
npm install --global windows-build-tools
```

O instalar **"Desktop development with C++"** desde [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

---

## 3. Instalación y arranque local

### Paso 1 — Instalar dependencias

```bash
cd Open-protocol-ontology
npm install
```

### Paso 2 — Variables de entorno

```bash
cp .env.example .env
```

En Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Editar `.env`:

```env
# Obligatorio para funciones de IA (CLI inspect, agentes en Studio)
GEMINI_API_KEY="tu-api-key-de-google-ai-studio"

# Opcional
APP_URL="http://localhost:3000"
NEXT_PUBLIC_N8N_WEBHOOK_URL=""   # dejar vacío si no usa n8n

# Opcional — modo desarrollo sin Redis
OPO_USE_MEMORY_BLACKBOARD=true

# Opcional — si tiene Redis local
# REDIS_URL="redis://localhost:6379"

# Opcional — seguridad del vault de credenciales
# OPO_VAULT_SECRET="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

**Obtener API Key de Gemini:** https://aistudio.google.com/apikey

### Paso 3 — Compilar la CLI

```bash
npm run build:cli
```

### Paso 4 — Arrancar OPO Studio (interfaz principal)

**Opción 1 — npm:**

```bash
npm run dev
```

**Opción 2 — CLI:**

```bash
npx opo studio
```

Abrir en el navegador: **http://localhost:3000**

---

## 4. Qué ver y probar en la web

| URL | Qué hace |
|-----|----------|
| `http://localhost:3000` | Landing / home |
| `http://localhost:3000/studio` | **OPO Studio** — canvas visual, agentes, MCP, mesh |
| `http://localhost:3000/entities` | Catálogo de entidades OPO |
| `http://localhost:3000/registry` | Registro de alias semánticos |
| `http://localhost:3000/validator` | Validador de schemas |
| `http://localhost:3000/spec` | Especificación del protocolo |
| `http://localhost:3000/docs` | Documentación integrada |
| `http://localhost:3000/adopt` | Ejemplos de adopción |
| `http://localhost:3000/marketplace` | Marketplace de integraciones |
| `http://localhost:3000/dashboard` | Dashboard |

### Flujo recomendado en OPO Studio

1. Ir a `/studio`.
2. Clic en **Settings** (engranaje) → pegar API keys (Gemini, OpenAI, Anthropic).
3. Completar el **onboarding** (Conectar → Analizar → Listo).
4. Explorar nodos: Entity, Agent, Tool, MCP, Trigger, etc.
5. **Generar MCP** → exporta servidor MCP para Claude Desktop / Cursor.
6. **Execute Mesh** → ejecutar workflows multi-agente con Intents YAML.

### Consultas Protheus en vivo (datos reales)

Por defecto, sin conexión a BD, OPO usa **modo demostración** (datos mock). Para consultas reales:

1. En el onboarding, elegí **TOTVS Protheus**.
2. Ingresá **connection string** SQL Server (Protheus suele usar MSSQL):

   ```text
   Server=localhost,1433;Database=PROTHEUS;User Id=sa;Password=TuPassword;Encrypt=false
   ```

3. Ingresá **filial** (ej. `01`) y sufijo empresa (default `010`).
4. Completá el análisis — el badge debe mostrar **Sistema real** / **Datos en vivo**.

**Probar consultas:**

- Abrí la consola **OPO Cognitive Mesh** (panel inferior).
- Usá los chips de consultas recurrentes (ej. *Deuda del cliente*) **o** escribí: `¿Cuánto debe el cliente 000219?`
- El badge del Mesh debe indicar **Datos en vivo** o **Demostración** según el workspace.

**Variable de entorno (seguridad SSRF):**

```env
# Hosts permitidos para connectionString (dev)
OPO_ALLOWED_DB_HOSTS=localhost,127.0.0.1,::1,host.docker.internal
```

Si la BD está en otro host, agregalo a la lista. Sin esto, `execute-query` y el swarm rechazan la conexión con 403.

**Redis (opcional):** el swarm ejecuta en background vía BullMQ. Sin Redis, configurá `OPO_USE_MEMORY_BLACKBOARD=true` en `.env` para desarrollo local.

### Assets del protocolo (estáticos)

Todos en `/public/`:

| Archivo | Descripción |
|---------|-------------|
| `public/opo-context.jsonld` | Contexto semántico JSON-LD v1.1 |
| `public/opo-registry.json` | Diccionario alias → schemas (100+ términos) |
| `public/opo-ai-primer.md` | Prompt optimizado para LLMs |
| `public/opo-manifest.example.json` | Manifiesto ejemplo Protheus/TOTVS |
| `public/opo-manifest.example2.json` | Manifiesto ejemplo Odoo 17 |
| `public/.well-known/opo.json` | Endpoint de discovery de referencia |
| `public/schemas/*.json` | JSON Schemas de las 23 entidades OPO |

---

## 5. Comandos CLI (todas las funciones)

Después de `npm run build:cli`:

```bash
# Ver ayuda general
npx opo --help

# Inicializar proyecto OPO sidecar
npx opo init

# Validar mappings contra schemas
npx opo validate --mapping ./mappings/invoice.json

# Traducir OPO-QL → SQL
npx opo translate --mapping ./mappings/invoice.json --query ./mock-query.json

# Generar tipos TypeScript desde mappings
npx opo generate --mapping ./mappings/invoice.json

# Mutar/actualizar mappings
npx opo mutate --help

# Inspección IA de schemas (requiere GEMINI_API_KEY)
npx opo inspect -e Invoice -s ./schema.sql -t sql

# Descubrir entidades en base de datos
npx opo discover --help

# Servidor MCP por stdio (para Claude Desktop)
npx opo mcp-start --mappings ./registry

# Lanzar Studio
npx opo studio
npx opo studio --port 3001
```

### Ejemplo: consulta OPO-QL

Crear `mock-query.json`:

```json
{
  "select": {
    "id": true,
    "totalAmount": true,
    "status": true
  },
  "filter": {
    "AND": [
      { "field": "status", "operator": "eq", "value": "PAID" },
      { "field": "totalAmount", "operator": "gte", "value": 500 }
    ]
  },
  "limit": 10
}
```

Ejecutar:

```bash
npx opo translate --mapping ./mappings/invoice.json --query ./mock-query.json
```

Salida esperada (SQL seguro):

```sql
SELECT ID_FACT AS "id", MONTO_FINAL AS "totalAmount", ESTADO_DOC AS "status"
FROM FACTURAS_HISTORICAS
WHERE ESTADO_DOC = $1 AND MONTO_FINAL >= $2
LIMIT 10;
-- Parameters: ["PAID", 500]
```

---

## 6. Tests y build de producción

No hay script `test` en `package.json`, pero hay tests con Vitest:

```bash
# Ejecutar todos los tests
npx vitest run

# Modo watch (desarrollo)
npx vitest

# Un archivo concreto
npx vitest run lib/studio/opoResponseParser.test.ts
```

### Build de producción

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## 7. Estructura del proyecto

```
Open-protocol-ontology/
├── app/                    # Páginas Next.js (studio, entities, docs...)
├── app/api/                # APIs REST (mesh, studio, vault, run...)
├── cli/                    # CLI: init, validate, translate, mcp, studio...
│   └── commands/           # Comandos individuales
├── components/
│   ├── studio/             # UI del Cognitive Mesh (canvas, nodos, panels)
│   └── debugger/           # Timeline player, frame inspector
├── lib/
│   ├── studio/             # Lógica Studio (parser, MCP generator, guidance...)
│   ├── mesh/               # Ejecutor de agentes y adapters ERP
│   ├── engine/             # Swarm worker, blackboard, vault, billing...
│   └── saas/               # Multi-tenant helpers
├── store/                  # Estado global (Zustand)
├── public/
│   ├── schemas/            # JSON Schemas de las 23 entidades OPO
│   ├── opo-registry.json   # Diccionario alias → entidades
│   ├── opo-context.jsonld  # Contexto semántico JSON-LD
│   └── opo-ai-primer.md    # Prompt optimizado para LLMs
├── packages/opo-sdk/       # SDK oficial
├── docs-site/docs/         # Documentación extendida
├── dist/                   # CLI compilada (tras build:cli)
├── README.md               # Visión general del protocolo
├── CONTRIBUTING.md         # Cómo contribuir
├── AUDIT.md                # Auditoría del proyecto
├── GROK_AUDIT.md           # Auditoría adicional
└── .env.example            # Plantilla de variables de entorno
```

### Documentación clave en `docs-site/docs/`

| Archivo | Contenido |
|---------|-----------|
| `01-protocol-specification.md` | Especificación del protocolo |
| `02-opoql-query-language.md` | Lenguaje de consultas OPO-QL |
| `03-usage-guide.md` | Guía de uso paso a paso |
| `04-ai-introspection.md` | Introspección asistida por IA |
| `05-mcp-chat-integration.md` | Integración MCP + chat |
| `06-sdk-reference.md` | Referencia del SDK |
| `07-ai-primer.md` | Primer para agentes IA |
| `08-opo-studio.md` | Documentación de OPO Studio |
| `erps/*.md` | Mappings por ERP (SAP, Odoo, Protheus...) |

---

## 8. Pasarlo a Claude para análisis

### Opción A — Claude Projects (claude.ai)

1. Crear un **Project** en Claude.
2. Subir el repo como ZIP o conectar GitHub si está disponible.
3. Pegar este **prompt inicial**:

```
Analiza el proyecto Open Protocol Ontology (OPO). Es un estándar semántico
para integrar ERPs con agentes de IA, con OPO Studio (canvas visual), CLI,
SDK y servidor MCP.

Lee primero:
- README.md
- public/opo-ai-primer.md
- docs-site/docs/01-protocol-specification.md
- docs-site/docs/08-opo-studio.md
- AUDIT.md y GROK_AUDIT.md

Luego explora:
- lib/mesh/ (ejecución de agentes)
- lib/engine/ (swarm, blackboard, vault)
- components/studio/ (UI)
- cli/ (comandos)
- public/schemas/ (entidades canónicas)

Dame: arquitectura, flujos principales, dependencias críticas,
riesgos técnicos y cómo ejecutarlo localmente.
```

### Opción B — Claude Code (terminal / IDE)

```bash
git clone https://github.com/pablocla/Open-protocol-ontology.git
cd Open-protocol-ontology
claude
```

O abrir el directorio en Cursor/VS Code con la extensión de Claude.

**Prompt sugerido:**

```
Explora todo el codebase de OPO. Empieza por README.md y public/opo-ai-primer.md.
Mapea la arquitectura, los flujos de Studio/Mesh/MCP, y lista qué necesito
para ejecutar cada función localmente.
```

### Opción C — Solo documentación (contexto limitado)

Si el contexto del LLM es limitado, subir solo:

| Archivo / carpeta | Por qué |
|-------------------|---------|
| `README.md` | Visión general |
| `public/opo-ai-primer.md` | Contexto optimizado para LLMs |
| `public/opo-registry.json` | Alias semánticos |
| `public/schemas/*.json` | Entidades canónicas |
| `docs-site/docs/*.md` | Spec y guías |
| `AUDIT.md`, `GROK_AUDIT.md` | Auditorías existentes |
| `package.json` | Dependencias y scripts |
| `TUTORIAL_SETUP_LOCAL.md` | Esta guía |

### Opción D — MCP con OPO (análisis en vivo)

Si ya tienes Claude Desktop configurado:

1. En OPO Studio → **Generar MCP**.
2. Configurar en `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "opo": {
      "command": "node",
      "args": [
        "RUTA_ABSOLUTA/Open-protocol-ontology/dist/index.js",
        "mcp-start",
        "--mappings",
        "./registry"
      ]
    }
  }
}
```

Reemplazar `RUTA_ABSOLUTA` con la ruta real al proyecto clonado.

Así Claude puede consultar la ontología directamente como herramienta MCP.

---

## 9. Checklist rápido

```
[ ] Node 20+ instalado
[ ] git clone del repo
[ ] npm install (sin errores)
[ ] .env creado con GEMINI_API_KEY
[ ] npm run build:cli
[ ] npm run dev → http://localhost:3000/studio
[ ] Settings → API key configurada
[ ] Demo Protheus cargado
[ ] npx vitest run (tests OK)
[ ] (Opcional) Redis + REDIS_URL para swarms en producción
```

### Comandos mínimos (copiar y pegar)

```bash
git clone https://github.com/pablocla/Open-protocol-ontology.git
cd Open-protocol-ontology
npm install
cp .env.example .env
# Editar .env → añadir GEMINI_API_KEY
npm run build:cli
npm run dev
# Abrir http://localhost:3000/studio
```

---

## 10. Problemas frecuentes

| Problema | Solución |
|----------|----------|
| `npm install` falla en `better-sqlite3` | Instalar Visual Studio Build Tools (Windows) o `python3` + `make` (Linux/macOS) |
| Studio no ejecuta agentes | Configurar API key en Settings o `GEMINI_API_KEY` en `.env` |
| Swarm worker sin Redis | Añadir `OPO_USE_MEMORY_BLACKBOARD=true` en `.env` |
| Comando `opo` no encontrado | Usar `npx opo` o ejecutar `npm run build:cli` primero |
| Puerto 3000 ocupado | `npx opo studio --port 3001` |
| Errores de Redis en consola | Normal sin Redis local; usar `OPO_USE_MEMORY_BLACKBOARD=true` |
| `inspect` pide API key | Definir `GEMINI_API_KEY` en `.env` o introducirla al ejecutar el comando |
| Conexión a BD externa bloqueada | Por defecto solo `localhost`; configurar `OPO_ALLOWED_DB_HOSTS` si necesario |

---

## Variables de entorno completas

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `GEMINI_API_KEY` | Sí (para IA) | API key de Google AI Studio |
| `APP_URL` | No | URL base de la app |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | No | Webhook n8n para feedback |
| `OPO_USE_MEMORY_BLACKBOARD` | No | `true` = sin Redis, usa memoria |
| `REDIS_URL` | No | URL de Redis para swarms en producción |
| `OPO_WORKSPACE_DIR` | No | Directorio de workspace (auto en CLI studio) |
| `OPO_DB_PATH` | No | Ruta SQLite (default: `./data/opo.db`) |
| `OPO_VAULT_SECRET` | No | Clave hex de 64 chars para vault |
| `OPO_DEFAULT_TENANT` | No | Tenant por defecto (SaaS) |
| `OPO_ALLOWED_DB_HOSTS` | No | Hosts permitidos para discovery de BD |
| `OPO_SWARM_WORKER_CONCURRENCY` | No | Concurrencia del worker (default: 5) |
| `DISABLE_HMR` | No | `true` desactiva Hot Module Replacement en dev |

---

## Qué es OPO (resumen)

**Open Protocol Ontology (OPO)** es una capa semántica universal que permite a agentes de IA, LLMs y orquestadores de workflows descubrir, entender e interoperar con sistemas ERP (SAP, NetSuite, TOTVS Protheus, Odoo, Dynamics, etc.).

**OPO NO es:**
- Un API Gateway
- Un Data Warehouse
- Una plataforma de conectores (iPaaS)

**OPO SÍ es:**
- Un estándar de metadatos semánticos
- Un protocolo de discovery (`/.well-known/opo.json`)
- Un builder visual (OPO Studio) para Cognitive Mesh
- Una CLI para traducir consultas IA → SQL
- Un generador de servidores MCP

---

*Última actualización: junio 2026 — OPO v0.1.0*