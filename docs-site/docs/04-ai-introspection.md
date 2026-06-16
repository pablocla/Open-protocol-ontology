---
sidebar_position: 4
---

# Introspección con IA (Zero-Touch Mapping)

Mapear sistemas Legacy manualmente puede ser un proceso tedioso. Para resolver esto, OPO incluye la función **Zero-Touch Mapping**: una herramienta de introspección impulsada por **Google Gemini** que lee los metadatos físicos de tu sistema y genera los esquemas de OPO de forma autónoma.

## Comando Inspect

El comando `opo inspect` lee un esquema de base de datos o API (SQL DDL, OpenAPI, GraphQL SDL, WSDL) y usa IA para inferir cómo esos campos oscuros se mapean a nombres legibles en inglés y cuáles son sus tipos primitivos.

### Soporte Multi-Protocolo

El CLI es lo suficientemente inteligente como para analizar distintos tipos de esquemas:

```bash
# Para Bases de Datos Relacionales (SQL DDL o Prisma)
npx opo inspect --type sql --entity Invoice --schema ./dump.sql

# Para APIs REST (Swagger / OpenAPI JSON)
npx opo inspect --type rest --entity Customer --schema ./swagger.json

# Para APIs GraphQL (Archivos SDL)
npx opo inspect --type graphql --entity Product --schema ./schema.graphql

# Para sistemas legacy SOAP (WSDL XML)
npx opo inspect --type soap --entity Order --schema ./service.wsdl
```

## Requisitos

Para utilizar la introspección impulsada por Inteligencia Artificial, necesitas una llave de API de **Google Gemini** (Gemini 2.5 Flash o Pro).

El CLI te pedirá interactivamente la API Key la primera vez que ejecutes el comando. OPO enviará el esquema a la IA con un System Prompt estricto y el resultado será validado en tu máquina local antes de guardarse.

### Ejemplo de Flujo

1. Tienes un archivo `dump.sql` con una tabla `VBRK` (Facturas en SAP) llena de campos en alemán.
2. Ejecutas `npx opo inspect --type sql --entity Invoice --schema ./dump.sql`.
3. Gemini analiza la tabla, reconoce que `VBELN` significa ID de documento, `NETWR` significa monto total, etc.
4. El CLI genera automáticamente `Invoice.json` listo para ser usado por tu agente.
