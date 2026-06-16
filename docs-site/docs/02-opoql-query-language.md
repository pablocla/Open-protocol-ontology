---
sidebar_position: 2
---

# OPO-QL: El Lenguaje de Consultas

**OPO-QL** (Open Protocol Ontology Query Language) es el corazón transaccional del protocolo. Es una representación intermedia basada estrictamente en JSON que permite a los Modelos de Lenguaje Grandes (LLMs) expresar intenciones de consulta sobre datos corporativos sin tener que adivinar el dialecto SQL físico de la base de datos subyacente.

## La Historia: El Problema de las Alucinaciones

Cuando la era de la IA generativa explotó, las empresas intentaron usar herramientas como "Text-to-SQL" para que la IA pudiera consultar sus bases de datos (SAP, Oracle, Odoo). Sin embargo, se encontraron con un problema crítico: **Las Alucinaciones SQL**.

Los LLMs no conocen las excentricidades físicas de una base de datos legacy. Frecuentemente generaban consultas con nombres de tablas incorrectos, olvidaban los JOINs necesarios o inventaban columnas. Peor aún, exponer la base de datos a sentencias SQL generadas por una IA implicaba un riesgo masivo de seguridad (*SQL Injection*).

**OPO-QL nace como la solución definitiva a este problema.**
En lugar de pedirle a la IA que escriba código SQL, le pedimos que genere un objeto JSON altamente estructurado y validado.

## Beneficios de OPO-QL

1. **Cero Alucinaciones (Validación Estricta):** Al ser un JSON Schema, la aplicación puede validar matemáticamente que la consulta de la IA es correcta antes de siquiera intentar enviarla a la base de datos.
2. **Agnosticismo Físico:** La IA escribe OPO-QL basándose en el esquema lógico (ej. `Invoice`). Luego, el Motor de Traducción de OPO toma ese JSON y lo compila al dialecto físico correcto (PostgreSQL, MS SQL Server, OData, etc.) de forma determinista y sin margen de error.
3. **Seguridad Total:** Como OPO-QL solo permite filtros, selecciones lógicas y paginaciones, es imposible que la IA genere un comando destructivo como `DROP TABLE` o inyecte código malicioso.

## ¿Cómo Funciona? Reunir Info de Sistemas

Cuando un agente de IA necesita información (ej. *"¿Cuáles son las facturas impagas del cliente 123?"*), construye un documento OPO-QL como el siguiente:

```json
{
  "entity": "Invoice",
  "action": "READ",
  "fields": ["id", "totalAmount", "status", "createdAt"],
  "filters": [
    {
      "field": "customerId",
      "operator": "EQUALS",
      "value": "CUST-123"
    },
    {
      "field": "status",
      "operator": "EQUALS",
      "value": "UNPAID"
    }
  ],
  "limit": 10
}
```

### El Flujo de Ejecución:
1. **La IA genera el OPO-QL:** Basándose en los registros canónicos que inspeccionó, la IA sabe perfectamente que existen los campos `customerId` y `status`.
2. **El SDK compila:** La librería `opo-sdk` (vía `translate_query`) lee este JSON, lee el archivo de mapeo físico (ej. `sap-s4hana/Invoice.json`) y transpila la consulta.
3. **Ejecución Segura:** El JSON anterior se convierte instantáneamente en: `SELECT VBELN, NETWR, STAT, ERDAT FROM VBRK WHERE KUNAG = 'CUST-123' AND STAT = 'UNPAID' LIMIT 10;`.

Este puente asegura que la Inteligencia Artificial razone en el mundo de las ideas puras (OPO), mientras que la infraestructura de tu empresa sigue funcionando con sus bases de datos físicas intactas.
