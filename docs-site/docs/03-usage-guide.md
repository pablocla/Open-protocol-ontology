---
id: usage-guide
title: Usage Guide
sidebar_position: 3
---

# Guía de Uso: Empezando con OPO

¡Bienvenido a OPO (Open Protocol Ontology)! Esta guía está diseñada para llevarte desde cero hasta tener tu primer puente semántico funcionando. Aprenderás a instalar la CLI, mapear una tabla de tu base de datos legacy a la ontología estándar, y procesar tu primera consulta de Inteligencia Artificial (OpoQuery).

---

## 1. Instalación

El ecosistema OPO está construido alrededor de un conjunto de herramientas de línea de comandos (CLI) y librerías para Node.js. 

Para instalar la CLI de manera global, ejecuta:

```bash
npm install -g @opo/cli
```

Verifica que la instalación fue exitosa:

```bash
opo --version
# Debería mostrar: OPO CLI v1.0.0
```

---

## 2. Inicialización del Proyecto

Crea un nuevo directorio para tu Sidecar OPO y ejecuta el comando de inicialización. Esto creará la estructura básica de archivos requerida por el protocolo.

```bash
mkdir mi-erp-sidecar
cd mi-erp-sidecar
opo init
```

Esto generará la siguiente estructura:
```text
/mi-erp-sidecar
 ├── .well-known/
 │    └── opo.json        <-- El manifiesto público para la IA
 ├── mappings/
 │    └── invoice.json    <-- Tu diccionario físico para Facturas
 ├── package.json
 └── index.ts
```

---

## 3. Configurando tu Diccionario Físico (Mapping)

Supongamos que tienes una tabla antigua en Oracle llamada `FACTURAS_HISTORICAS`. Los LLMs no saben qué es esto, pero OPO sí sabe qué es una `Invoice`. Vamos a conectarlos.

Abre el archivo `mappings/invoice.json` y define cómo la ontología oficial de OPO se mapea a tu base de datos real:

```json
{
  "$schema": "https://openontology.vercel.app/schema/v1/mapping-schema.json",
  "entity": "Invoice",
  "tableName": "FACTURAS_HISTORICAS",
  "fields": {
    "id": { "column": "ID_FACT", "type": "string" },
    "totalAmount": { "column": "MONTO_FINAL", "type": "number" },
    "status": { "column": "ESTADO_DOC", "type": "string" }
  }
}
```
*Con este simple archivo, le acabas de enseñar al motor de OPO cómo traducir semántica universal al esquema físico de tu empresa.*

---

## 4. Probando la Traducción OPO-QL a SQL

Ahora, simularemos que un Agente IA (vía MCP) nos envía una petición para buscar las facturas pagadas mayores a $500.

Crea un archivo llamado `mock-query.json` con la estructura de OPO-QL:

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

Usa la CLI para compilar esta petición de IA en código SQL nativo y seguro:

```bash
opo translate --mapping ./mappings/invoice.json --query ./mock-query.json
```

**Salida esperada (SQL Seguro Generado):**
```sql
SELECT ID_FACT AS "id", MONTO_FINAL AS "totalAmount", ESTADO_DOC AS "status" 
FROM FACTURAS_HISTORICAS 
WHERE ESTADO_DOC = $1 AND MONTO_FINAL >= $2 
LIMIT 10;
-- Parameters: ["PAID", 500]
```
¡Felicidades! Has traducido una petición de IA en un comando SQL estrictamente tipado y protegido contra inyecciones.

---

## 5. Generación de Tipos (Type Safety)

Para que puedas escribir el código de tu servidor Sidecar con total seguridad, OPO te permite generar los tipos de TypeScript automáticamente desde tus mappings.

Ejecuta:

```bash
opo generate types --source ./mappings/invoice.json --output ./src/types/opo.d.ts
```

Ahora, en tu código TypeScript, tendrás acceso a las interfaces autogeneradas, asegurando que tu lógica de negocio esté siempre alineada con el protocolo público.

---

## Siguientes Pasos

- **Despliegue del Sidecar:** Lee la guía sobre [Cómo montar el servidor Express/Fastify con @opo/server].
- **Relaciones Complejas (N+1):** Aprende a mapear uniones (JOINs) entre entidades en la guía de [Mapeos Relacionales Avanzados].
- **Validación Web:** Sube tu `.well-known/opo.json` a nuestro [Web Validator] para certificar tu manifiesto.
