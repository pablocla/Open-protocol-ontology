# OPO Adapter Guide: Tango Gestión

**API:** ODBC SQL Connection / Local DB Export | **Auth:** SQL Server Auth / OS Credentials | **Difficulty:** High | **Setup:** ~40 min

---

The Open Protocol Ontology (OPO) adapter for Tango Gestión is designed specifically for Tango's desktop SQL environment. Because Tango lacks a standard public cloud REST API, the OPO adapter acts as an on-premise SQL gateway. It establishes safe ODBC/ADODB connections directly with the SQL Server database (typically `cabFactura` or `clientes`), translates schemas, and exposes OPO-compliant endpoints locally.

***Community Invitation:*** *Tango is historically an offline, desktop-first ERP. If you have developed local REST wrapper scripts or automated file export models, consider contributing your design to the OPO Community Registry!*

## Prerequisites
- Tango Delta v23 or higher running over Microsoft SQL Server on-premise.
- SQL Server Management Studio (SSMS) access and DB Owner credentials for standard Tango databases.
- An on-premise gateway server (Windows Server) capable of hosting the Node.js OPO translation service.

---

## Step 1 — Enable API access

Tango does not expose transactional public cloud HTTP endpoints. To make Tango OPO-compliant, we establish direct read-only query channels to its underlying database:

1. Open **SQL Server Management Studio (SSMS)** and connect to your SQL Server instance hosting Tango.
2. Go to **Security** > **Logins** > **New Login**.
3. Name the login `opo_reader_user`. Match authentication style to SQL Server Authentication and set a strong password.
4. Go to **User Mapping**, select all your active Tango company databases (e.g., `TANGO_EMP01`), and assign the security role `db_datareader`.
5. Click **OK**.

---

## Step 2 — Obtain credentials

1. Record your SQL Server network host IP and instance port details (typically `1433`).
2. Verify connectivity with Tango tables: GVA14 (Clientes), GVA12 (Facturas), and CPA01 (Proveedores).
3. Identify the main localized Argentinian tax identification registration keys (**CUIT**) associated with client data files.

---

## Step 3 — Configure OPO adapter

Set the native database connection string parameters inside the `opo-adapter.config.json` folder root directory:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "Tango",
  "connection": {
    "authType": "SQL_Server",
    "host": "192.168.10.15\\MSSQLSERVER,1433",
    "user": "opo_reader_user",
    "password": "tango_db_pwd_z88210",
    "database": "TANGO_EMP01",
    "driver": "ODBC Driver 17 for SQL Server"
  },
  "cachingMinutes": 30,
  "jurisdiction": "Argentina"
}
```

---

## Step 4 — Expose discovery endpoint

Expose supported local maps through standard `/.well-known/opo.json` configurations so client services recognize Argentine fiscal structures:

```json
{
  "$schema": "https://openontology.vercel.app/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "TANGO-LOCAL-SQL-ARG",
  "jurisdiction": "Argentina",
  "adapter_endpoints": {
    "base_url": "http://localhost:3000/api/v1",
    "discovery": "http://localhost:3000/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Customer",
      "native_reference": "Clientes (GVA14)",
      "matching_confidence": 0.92
    },
    {
      "canonical": "opo:Invoice",
      "native_reference": "Facturas (GVA12)",
      "matching_confidence": 0.95
    },
    {
      "canonical": "opo:Supplier",
      "native_reference": "Proveedores (CPA01)",
      "matching_confidence": 0.92
    }
  ]
}
```

---

## Step 5 — Test

Submit locally mapped queries or invoke SQL script utilities to evaluate standard GVA14 files connectivity:

```bash
# Verify direct database translation through local Node.js loopback proxy
curl -X GET "http://localhost:3000/api/v1/entities/Customer/CUST0041" \
  -H "Authorization: Bearer <opo_local_token>"
```

---

## Entity mapping reference

| Canonical OPO Entity | Tango Native SQL Table | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `Clientes` (GVA14) / `Prov` (CPA01) | Maps table references, names, and fiscal CUIT keys. | 0.85 |
| `opo:Customer` | `Clientes` (`GVA14`) | Maps `COD_CLIENT` to `id`, `SALDO_CORR` to `outstandingBalance`. | 0.92 |
| `opo:Supplier` | `Proveedores` (`CPA01`) | Maps `COD_PROV` to `id`, `SALDO_CORR` to `purchaseBalance`. | 0.92 |
| `opo:Invoice` | `Facturas` (`GVA12`) | Maps `NRO_COMP` to `id` / `number`, `FECHA_EMIS` to `issueDate`, `IMP_TOTAL` to `grandTotal`. | 0.95 |
| `opo:Order` | `Pedidos de Venta` (`GVA03`) | Maps order reference indexes and totals. | 0.90 |

---

## Known limitations
- Standard REST API calls do not exist; SQL queries are compiled directly via ADODB context drivers on-premise.
- Real-time performance requires rigorous caching due to SQL indexing configurations over legacy GVA structures.

---

## Troubleshooting

### Error: `OPO-ERR-003: SQL Database Login Failed`
- **Cause**: Outdated password, SQL Authentication disabled, or user has insufficient mapping rights for GVA tables.
- **Fix**: Open SSMS security preferences, confirm the target user possesses read-level permissions, and ensure 'Server Authentication Mode' is set to SQL & Windows.

### Error: `Connection Error: SQL Server instance not found or port blocked`
- **Cause**: MS SQL Server instance does not allow TCP/IP traffic, or network firewall is blocking port 1433.
- **Fix**: Open SQL Server Configuration Manager, enable TCP/IP, set standard port to 1433, and authorize connection rules inside Windows Defender firewall.
