---
sidebar_position: 10
sidebar_label: 🌐 Explorador REST
---

# Explorador de APIs REST (RestExplorer)

Aunque OPO destaca por su capacidad de mapear bases de datos directas mediante SQL e inyectar ontologías, en los entornos corporativos reales los ERPs exponen muchas de sus funciones principales (especialmente las escrituras y modificaciones) a través de **APIs REST**.

OPO Studio incorpora el **RestExplorer (Explorador REST)**, un panel visual para mapear, testear e inspeccionar los endpoints oficiales expuestos por tus sistemas de gestión.

---

## Por qué es vital para las Mutaciones (Escritura)

Como se describe en el apartado de seguridad, permitir que una Inteligencia Artificial inserte o modifique registros en la base de datos SQL de un ERP de forma directa es sumamente arriesgado. Podría saltarse validaciones complejas de impuestos, triggers de actualización de stock, o lógica interna del ERP.

Por este motivo, OPO Studio adopta la siguiente política:
- **Lectura:** Consultas masivas rápidas directas a la base de datos SQL.
- **Escritura:** Ruteado obligatorio hacia las APIs REST del sistema de gestión (ej. endpoints TLPP en TOTVS Protheus, o Web Services en SAP).

El **RestExplorer** es la herramienta dentro de OPO Studio que te permite registrar estas rutas web de forma visual y probarlas antes de habilitárselas a tus Empleados Virtuales.

---

## Funcionalidades del Explorador REST

Al ingresar al panel, puedes realizar las siguientes acciones:

1. **Registrar un Endpoint:** Asigna una URL a una habilidad de OPO (ej: la acción de negocio `CrearPedido` apunta a `https://erp.empresa.com/api/v1/orders`).
2. **Definir Parámetros del Body/Headers:** Mapea las variables que espera la API del ERP. OPO traducirá las intenciones de la IA a las variables exactas esperadas (ej: transformar la propiedad semántica `customer` en el parámetro del body `C5_CLIENTE`).
3. **Ejecutar Pruebas Manuales (Test Connection):** Realiza llamadas de prueba simuladas directamente desde el Studio para verificar que el ERP responde correctamente con un código HTTP `200 OK` y procesa los datos sin errores de autorización.
