---
title: "SAP S/4HANA"
sidebar_position: 2
---

# Guía del Adaptador: SAP S/4HANA

**API:** OData Services (REST) / RFC (Remote Function Call) | **Dificultad:** Alta | **Setup:** ~2 hs

El adaptador OPO para **SAP S/4HANA** traduce las estructuras de las tablas principales de la base de datos central de SAP (HANA DB) a las especificaciones semánticas estandarizadas de OPO.

---

## Particularidades de la Arquitectura SAP

SAP utiliza abreviaturas en alemán para nombrar a sus tablas principales del núcleo de negocio:

| Tabla SAP | Concepto Alemán | Entidad OPO | Descripción |
| :--- | :--- | :--- | :--- |
| `KNA1` | Kundennamensliste (General Client) | `Customer` | Registro maestro de clientes. |
| `LFA1` | Lieferantenliste (Vendor Master) | `Supplier` | Registro maestro de proveedores. |
| `MARA` | Materialstamm (Material Master) | `Product` | Registro maestro de materiales/artículos. |
| `VBAK` | Verkaufsbeleg Kopfdaten (Sales Header) | `SalesOrder` | Encabezado de documentos de venta. |
| `VBAP` | Verkaufsbeleg Positionsdaten (Sales Item) | `SalesOrderItem` | Posiciones de documentos de venta. |

---

## Estrategia de Conexión y Seguridad

Dado el nivel de criticidad de una instalación SAP en producción, el adaptador de OPO opera bajo estas reglas:

1. **Lectura Semántica vía OData:** En lugar de realizar consultas SQL directas a la base de datos HANA (lo cual puede violar licenciamientos de SAP e ignorar el gobierno de datos), OPO se conecta principalmente a los servicios **SAP Gateway (OData APIs)** oficiales.
2. **Consultas SQL Directas en HANA (Modo Auditoría):** Si se habilita el acceso directo por SQL (a través de vistas CDS expuestas en HANA), la conexión se restringe estrictamente a **solo-lectura**.
3. **Escritura vía BAPIs / OData:** Cualquier inserción (ej: crear un pedido) se realiza llamando a las **BAPIs (Business Application Programming Interfaces)** estándar de SAP para garantizar la consistencia transaccional del sistema.
