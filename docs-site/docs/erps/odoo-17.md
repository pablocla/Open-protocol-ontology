---
title: "Odoo 17"
sidebar_position: 3
---

# Guía del Adaptador: Odoo 17

**API:** JSON-RPC / XML-RPC / PostgreSQL Directo | **Dificultad:** Baja | **Setup:** ~15 min

El adaptador OPO para **Odoo 17** traduce el ORM nativo de Odoo a las entidades semánticas estándar de OPO. Al ser un sistema moderno y de código abierto, la integración es una de las más sencillas del catálogo.

---

## Mapeo del Modelo de Datos (PostgreSQL)

Odoo cuenta con nombres de tabla legibles y consistentes en su base de datos PostgreSQL. OPO traduce estas tablas directamente:

| Modelo Odoo | Tabla Física PostgreSQL | Entidad OPO | Descripción |
| :--- | :--- | :--- | :--- |
| `res.partner` | `res_partner` | `Customer` / `Supplier` / `Party` | Entidades de contacto (clientes y proveedores). |
| `product.template` | `product_template` | `Product` | Plantilla base de productos. |
| `sale.order` | `sale_order` | `SalesOrder` | Órdenes de venta. |
| `account.move` | `account_move` | `Invoice` | Asientos contables y facturas (tanto de venta como de compra). |

---

## Métodos de Integración Soportados

OPO Studio admite dos canales de comunicación para Odoo:

1. **JSON-RPC / XML-RPC (Recomendado):** Se conecta a través del puerto de red de Odoo llamando a su ORM interno. Este método garantiza que cualquier escritura respete los flujos de trabajo de Odoo (ej: validar stock, disparar flujos de n8n o enviar correos de confirmación).
2. **Conexión PostgreSQL Directa:** Para consultas masivas de reportería e introspección por IA. La conexión se restringe estrictamente a **solo-lectura** y aplica automáticamente el filtro `active = true` (soft-delete nativo de Odoo).
