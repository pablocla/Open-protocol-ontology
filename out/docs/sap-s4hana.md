# OPO Adapter Guide: SAP S/4HANA Enterprise Cloud

**API:** REST / Web OData | **Auth:** OAuth 2.0 (BTP) / Basic Auth on-premise | **Difficulty:** High | **Setup:** ~45 min

---

The Open Protocol Ontology (OPO) adapter for SAP S/4HANA acts as an abstraction gateway. It translates SAP's relational structures and legacy table schemas into lightweight, standardized JSON representations.

## Prerequisites
- S4HANA 1909 or higher (on-premise or Private Cloud), or SAP S/4HANA Public Cloud.
- Administration access with credentials in SAP Business Technology Platform (BTP) or SAP Gateway service coordinator.
- Role permissions for SAP Gateway service management (`/IWFND/MAINT_SERVICE`).

---

## Step 1 — Enable API access

To connect the adapter, we expose SAP S/4HANA's standard business APIs. We use the OData service coordinator:

1. Log in to SAP GUI and enter transaction code `/n/IWFND/MAINT_SERVICE`.
2. Click **Add Service** (`+` button).
3. Set your System Alias (e.g., `LOCAL_PGW`) and search for Technical Service Name: `API_SUPPLIER_INVOICE_PROCESS_SRV` (for Supplier Invoices) or `API_BUSINESS_PARTNER` (for Customers/Vendors).
4. Select the service and click **Add Selected Services**.
5. Assign package `$TMP` (or a transport request for production) and click **Confirm**.

---

## Step 2 — Obtain credentials

OPO adapters connect via standard securely registered OAuth 2.0 clients on the SAP BTP (Business Technology Platform) layer, or local client certificates.

### For SAP BTP Cloud Service Key:
1. Open the SAP BTP Cockpit.
2. Navigate to your **Subaccount** > **Spaces** > Select space.
3. Under **Services** > **Instances**, create a new instance of the service `s4-hana-cloud-api`.
4. Click **Create Service Key** and name it `OPO-Adapter-Key`.
5. Download the JSON credential containing `clientid`, `clientsecret`, and `tokenurl`.

---

## Step 3 — Configure OPO adapter

Create a file named `opo-adapter.config.json` in your local adapter server workspace root containing standard connection details:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "SAP_S4",
  "connection": {
    "authType": "OAuth2",
    "btpTokenUrl": "https://identity-service.authentication.sap.com/oauth/token",
    "clientId": "sb-opo-client!t94025",
    "clientSecret": "jX910a-Fso9L-0K92vL-M91a92",
    "s4BaseUrl": "https://myS4Svc.s4hana.ondemand.com/sap/opu/odata/sap"
  },
  "cachingMinutes": 10,
  "jurisdiction": "Global"
}
```

---

## Step 4 — Expose discovery endpoint

Configure your reverse proxy or gateway to respond on standard `/.well-known/opo.json` path. This file exposes S/4HANA supported entities and maps their canonical OPO IRIs:

```json
{
  "$schema": "https://openprotocol.dev/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "SAP-S4HANA-PRD-CLD",
  "jurisdiction": "Global",
  "adapter_endpoints": {
    "base_url": "https://opo-adapter.myenterprise.com/api/v1",
    "discovery": "https://opo-adapter.myenterprise.com/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Party",
      "native_reference": "BUT000",
      "matching_confidence": 0.95
    },
    {
      "canonical": "opo:Customer",
      "native_reference": "KNA1",
      "matching_confidence": 0.95
    },
    {
      "canonical": "opo:Invoice",
      "native_reference": "VBRK",
      "matching_confidence": 0.98
    }
  ]
}
```

---

## Step 5 — Test

Perform this simple cURL command from your developer server terminal to test OData connectivity of the OPO adapter:

```bash
# Request OAuth Token
curl -X POST "https://identity-service.authentication.sap.com/oauth/token" \
  -u "sb-opo-client!t94025:jX910a-Fso9L-0K92vL-M91a92" \
  -d "grant_type=client_credentials"

# Query the adapter translated Party profile
curl -X GET "https://opo-adapter.myenterprise.com/api/v1/entities/Party/10002" \
  -H "Authorization: Bearer <btp_auth_token>"
```

---

## Entity mapping reference

| Canonical OPO Entity | SAP S/4HANA Native Table / CDS View | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `BUT000` (Business Partner Master) | Maps `PARTNER` to `id`, `NAME_ORG1` to `legalName`, `TAXTYPE` to `taxId`. | 0.95 |
| `opo:Customer` | `KNA1` (General) + `KNVV` (Sales) | Maps `KUNNR` to `id`, `KOBAND` to `outstandingBalance`. | 0.95 |
| `opo:Supplier` | `LFA1` (General) + `LFM1` (Purchase) | Maps `LIFNR` to `id`, `ZTERM` to `paymentTerms`. | 0.95 |
| `opo:Invoice` | `VBRK` (Billing Header) / `VBRP` (Items) | Maps `VBELN` to `id` / `number`, `FKDAT` to `issueDate`, `NETWR` to `grandTotal`. | 0.98 |
| `opo:Order` | `VBAK` (Sales Head) / `VBAP` (Items) | Maps `VBELN` to `id`, `NETWR` to `totalAmount`. | 0.95 |

---

## Known limitations
- Custom Z-fields mapped via S/4 EXTENSION ledger require custom coding in the adapter.
- Concurrent heavy analytics queries may trigger database locks inside standard SAP Gateway service thresholds.

---

## Troubleshooting

### Error: `OPO-ERR-003: SAP BTP Client Authentication Failed`
- **Cause**: Outdated client key or misaligned service instance settings.
- **Fix**: Re-generate service key in S/4 space on BTP Cockpit and copy new values to `opo-adapter.config.json`.

### Error: `SAP Gateway Error: /IWFND/CM_BEC/026 (Service not active)`
- **Cause**: S/4 OData service has been registered but not activated inside Gateway transaction `/IWFND/MAINT_SERVICE`.
- **Fix**: Enter `/IWFND/MAINT_SERVICE`, lookup your service, click `Active` button under S/4 Gateway, and select system alias.

### Error: `OPO-ERR-005: Destination SAP System Unreachable`
- **Cause**: S/4 instance on-premise firewall blocking BTP cloud connector.
- **Fix**: Open SAP Cloud Connector management interface, verify connection tunnel status, and confirm resource accessibility rules.
