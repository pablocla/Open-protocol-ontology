---
id: protocol-specification
title: Protocol Specification
sidebar_position: 1
---

# OPO (Open Protocol Ontology) - Protocol Specification v1.0

## 1. Introducción a OPO (Visión y Problema que resuelve)

En la era de la adopción masiva de Agentes de Inteligencia Artificial y arquitecturas basadas en Model Context Protocol (MCP), la integración con sistemas transaccionales heredados (ERPs como SAP, Oracle, Protheus) y APIs modernas presenta un desafío fundamental: la fricción semántica y las alucinaciones de la IA. Los LLMs carecen del contexto determinista necesario para interpretar esquemas de bases de datos esotéricos, nombres de columnas crípticos y topologías de red no estandarizadas.

**OPO (Open Protocol Ontology)** nace como la solución definitiva a este problema. Actuando como una capa semántica estandarizada y Open Source, OPO permite que los agentes de IA descubran, comprendan e interactúen con la infraestructura empresarial de manera predecible, segura y sin fricción. Al proporcionar una ontología uniforme y un protocolo de descubrimiento universal, OPO erradica la deriva semántica ("Schema Drift") y garantiza operaciones deterministas entre la IA y los sistemas de registro.

---

## 2. Especificación del Protocolo (Discovery y Endpoints)

### Protocol Discovery (El Manifiesto)

Para que un Agente IA interactúe con un sistema corporativo, primero debe comprender su topología y capacidades. OPO introduce el concepto de **Protocol Discovery** mediante un manifiesto estático estandarizado, alojado en una ruta universalmente predecible: `.well-known/opo.json`.

Este manifiesto actúa como un contrato vinculante entre el servidor y el Agente IA, declarando explícitamente qué entidades de negocio están disponibles y los endpoints precisos para su consumo.

**Ejemplo de `.well-known/opo.json`:**

```json
{
  "opo_version": "1.0",
  "server_name": "Acme Corp ERP Gateway",
  "base_url": "https://api.acme.corp/v1",
  "entities": {
    "Invoice": {
      "endpoint": "/opo/invoices",
      "schema_url": "https://openontology.vercel.app/schema/v1/Invoice.json",
      "supported_methods": ["GET", "POST"]
    },
    "Customer": {
      "endpoint": "/opo/customers",
      "schema_url": "https://openontology.vercel.app/schema/v1/Customer.json",
      "supported_methods": ["GET"]
    },
    "Product": {
      "endpoint": "/opo/products",
      "schema_url": "https://openontology.vercel.app/schema/v1/Product.json",
      "supported_methods": ["GET"]
    }
  }
}
```

---

## 3. Modelos de Datos (Ontología Semántica JSON Schema)

OPO rechaza formalmente el uso de esquemas propietarios cerrados. Para garantizar la máxima interoperabilidad y comprensión nativa por parte de los LLMs, la ontología y los modelos de datos se definen estrictamente utilizando **JSON Schema Draft 2020-12**, complementado con anotaciones semánticas estructuradas derivadas de **schema.org**.

### Erradicación del "Schema Drift"

La especificación OPO v1.0 incluye más de 20 entidades estandarizadas pre-aprobadas (por ejemplo, `Invoice`, `Customer`, `Order`, `Product`). Al forzar la adherencia a estos esquemas canónicos empresariales, el protocolo elimina el "Schema Drift". Un Agente IA que sabe cómo procesar y leer una `Invoice` en un ecosistema Oracle, sabrá instintivamente cómo hacerlo en SAP, independientemente de las disparidades en la tecnología subyacente.

---

## 4. OPO-QL: Interacciones Seguras para IA (El dialecto, Paginación y Filtros)

Los protocolos tradicionales como OData o el diseño REST estático son intrínsecamente riesgosos e ineficientes para el consumo automatizado por LLMs. Su excesiva verbosidad amenaza el "Context Window", y su flexibilidad aumenta el riesgo de alucinaciones. **OPO-QL (OPO Query Language)** es un dialecto JSON puramente semántico, declarativo y altamente restringido, diseñado exclusivamente para salvaguardar la IA.

### Protección del "Context Window" y Paginación

Para prevenir colapsos de memoria e incidentes de "Payload Exhaustion" durante el procesamiento de respuestas de gran escala, OPO-QL dicta reglas rigurosas de paginación. El protocolo requiere obligatoriamente el uso de **paginación por cursor opaco** (codificado en Base64) e impone un límite máximo arquitectónico innegociable (`limit: 100`).

### Selección Recursiva y Mitigación del Problema N+1

Adoptando la eficiencia de GraphQL pero implementado sobre REST puro, OPO-QL provee el nodo recursivo `select`. Esto otorga al Agente IA la precisión quirúrgica para solicitar exactamente las propiedades y relaciones anidadas necesarias en una sola llamada. Esta estructura mitiga estructuralmente el clásico problema de consultas N+1 que azota a los sistemas relacionales.

### Filtrado y Aislamiento Semántico (Zero Injection)

El nodo `filter` requiere una construcción de árbol de expresiones lógicas apoyándose en operadores tipados y estrictos (`eq`, `gte`, `in`, `AND`, `OR`). Esta sintaxis parametrizada prohíbe completamente cualquier abstracción ambigua, eliminando de raíz la posibilidad de ataques de inyección SQL o alucinaciones semánticas de la IA.

**Ejemplo de Payload `OpoQuery`:**

```json
{
  "select": {
    "id": true,
    "totalAmount": true,
    "customer": {
      "select": {
        "name": true,
        "email": true
      }
    }
  },
  "filter": {
    "AND": [
      { "field": "status", "operator": "eq", "value": "PAID" },
      { "field": "totalAmount", "operator": "gte", "value": 1500 }
    ]
  },
  "limit": 50,
  "cursor": "ZXlKMGFXMWxjM1JoYlhB"
}
```

---

## 5. Adopción en Entornos Legacy: El Patrón Sidecar y Traducción SQL

Incorporar tecnología IA en infraestructuras legacy (sistemas monolíticos o ERPs altamente acoplados) exige un vector de adopción no intrusivo. Para lograr esto, OPO arquitectura la implementación mediante el **Patrón Sidecar**.

### El OPO Sidecar

El Sidecar es un microservicio ágil y sin estado (comúnmente orquestado en Node.js) que se sitúa frente a la base de datos relacional del ERP. Ejerce la función de puente semántico: capta las peticiones estructuradas en OPO-QL de los Agentes IA y las transfiere a un formato transaccional comprensible por la infraestructura on-premise.

### El Motor `@opo/sql-translator`

Incrustado en la base del Sidecar (y disponible en la suite CLI de OPO) opera el motor compilador `@opo/sql-translator`. Esta herramienta determinista recibe el `OpoQuery`, lo valida, y cruza los campos de la ontología contra un **"Diccionario Físico"** (un mapa de resolución de relaciones proporcionado por los DBAs de la empresa que enlaza el estándar OPO con el laberinto de tablas legacy).

El resultado final es una transpilación a sentencias SQL 100% nativas y blindadas mediante el uso universal de **Prepared Statements**.

**Ejemplo de Compilación OPO-QL a SQL:**

*Diccionario Físico (Extracto del Mapping):*
- Entidad OPO `Invoice` -> Tabla Legacy `ERP_FACT_V2`
- OPO `status` -> Columna `ESTADO_DOC`
- OPO `totalAmount` -> Columna `MONTO_TOTAL`

*Sentencia SQL Autogenerada y Segura:*
```sql
SELECT 
  t1.ID_FACTURA as "id",
  t1.MONTO_TOTAL as "totalAmount",
  t2.NOMBRE_CLI as "customer.name",
  t2.CORREO_CLI as "customer.email"
FROM ERP_FACT_V2 t1
LEFT JOIN ERP_CLIENTES t2 ON t1.ID_CLIENTE = t2.ID_CLIENTE
WHERE t1.ESTADO_DOC = $1 
  AND t1.MONTO_TOTAL >= $2
ORDER BY t1.ID_FACTURA ASC
LIMIT 50;
-- Bind Parameters: [$1 = 'PAID', $2 = 1500]
```

---

## 6. Herramientas del Desarrollador (CLI Types y Validator Web)

La experiencia del desarrollador (DX) es crítica para facilitar la integración en ecosistemas corporativos. El conjunto de herramientas oficiales de OPO empodera a los equipos de ingeniería con utilidades de calidad Enterprise:

1. **Generación de Tipos Estáticos (OPO CLI):**
   A través del CLI nativo, los desarrolladores pueden autogenerar sus tipos TypeScript desde los mapas de ontología con un solo comando:
   ```bash
   opo generate types --source ./mapping.json --output ./types.ts
   ```
   Esta funcionalidad inyecta "Type Safety" end-to-end, garantizando que el código del Sidecar o de los clientes mantenga sincronía total con la especificación declarada y evitando errores de runtime.

2. **OPO Web Validator:**
   Alojado en el portal oficial del protocolo, el Web Validator es un IDE embebido impulsado por **Monaco Editor** (la misma tecnología detrás de VS Code). Los arquitectos pueden arrastrar sus manifiestos `.well-known/opo.json` o mappings del diccionario físico para su análisis. El validador procesa el cumplimiento contra el JSON Schema Draft 2020-12, emitiendo diagnósticos en tiempo real, alertas de linter sobre desviaciones semánticas y provee autocompletado avanzado del protocolo OPO.
