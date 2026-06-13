# OPO Adapter Guide: Sage X3 Syracuse

**API:** Syracuse REST Web Services | **Auth:** Basic Auth / OAuth 2.0 | **Difficulty:** Medium | **Setup:** ~30 min

---

The Open Protocol Ontology (OPO) adapter for Sage X3 links client services to Sage’s native Syracuse Web Server layer. It translates Sage X3's classic business tables (like `BPCUSTOMER` or `SINVOICE`) into deterministic, OPO-compliant schemas.

*Note: This adapter is designed specifically for Sage X3 Syracuse. It is structurally distinct from Sage 300 APIs.*

## Prerequisites
- Sage X3 v12 or higher running modern Syracuse Server.
- Safe X3 Console administrative privileges.
- API and Web Service developer role permissions.

---

## Step 1 — Enable API access

Web Services must be authorized and published within Sage Syracuse:

1. Log in to Sage Syracuse console as an Administrator.
2. Go to **Administration** > **Authoring** > **Pages** or **Web Services**.
3. Select the target business entity program (e.g. `BPC` for Customers, `SIV` for Invoices).
4. Click **Publish** to expose the web service resource endpoints to external HTTP channels.

---

## Step 2 — Obtain credentials

Syracuse requests require basic authentication or OAuth2 security:

1. Navigate to **Administration** > **Security** > **Users** inside Syracuse.
2. Create or select your OPO integration system user (e.g. `opo_service`).
3. Set password, copy user key, and verify that the user profile has proper read permissions for the target published database objects under Sage X3 Role Security.

---

## Step 3 — Configure OPO adapter

Register server details inside `opo-adapter.config.json` folder root directory:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "SageX3",
  "connection": {
    "authType": "BasicAuth",
    "user": "opo_service",
    "password": "sage_profile_pass_x922",
    "syracuseBaseUrl": "https://sage-syracuse.myenterprise.com/api1/x3/erp/MYCLASSIC"
  },
  "cachingMinutes": 10,
  "jurisdiction": "Global"
}
```

---

## Step 4 — Expose discovery endpoint

Publish standard endpoint mappings using `/.well-known/opo.json` configurations:

```json
{
  "$schema": "https://openontology.vercel.app/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "SAGEX3-SYRACUSE-V12",
  "jurisdiction": "Global",
  "adapter_endpoints": {
    "base_url": "https://sage-opo.myenterprise.com/api/v1",
    "discovery": "https://sage-opo.myenterprise.com/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Party",
      "native_reference": "BPCUST / BPVEND",
      "matching_confidence": 0.88
    },
    {
      "canonical": "opo:Customer",
      "native_reference": "BPCUSTOMER (BPCUST)",
      "matching_confidence": 0.96
    },
    {
      "canonical": "opo:Invoice",
      "native_reference": "SINVOICE",
      "matching_confidence": 0.94
    }
  ]
}
```

---

## Step 5 — Test

Launch simple cURL commands to verify that Syracuse translates Sage X3 business tables correctly:

```bash
# Query mapped Customer record through Sage Syracuse OPO wrapper
curl -X GET "https://sage-opo.myenterprise.com/api/v1/entities/Customer/CUST00018" \
  -H "Authorization: Bearer <opo_api_key>"
```

---

## Entity mapping reference

| Canonical OPO Entity | Sage X3 Native Object Table | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `BPCUST` / `BPVEND` | Maps third party business profiles to Party objects. | 0.88 |
| `opo:Customer` | `BPCUSTOMER` (table `BPCUST`) | Maps customer ledger profiles, balances and limits. | 0.96 |
| `opo:Supplier` | `BPSUPPLIER` (table `BPVEND`) | Maps supplier credentials, payment schedules. | 0.96 |
| `opo:Invoice` | `SINVOICE` / `PINVOICE` | Maps accounting invoice dates, taxes, and values. | 0.94 |
| `opo:Order` | `SORDER` / `PORDER` | Maps purchase and sales order documents. | 0.95 |

---

## Known limitations
- Syracuse REST services do not natively expose custom SQL script views without manual wrapper declarations.
- No native support for CORS headers (requires reverse proxy hosting).

---

## Troubleshooting

### Error: `OPO-ERR-003: Sage Syracuse Authentication Failed`
- **Cause**: Outdated password, or integration user profile deactivated in Syracuse console.
- **Fix**: Open Syracuse security center, confirm `opo_service` user status, and update connection passwords.

### Error: `Sage WebService Error: Web Service not published (404)`
- **Cause**: The web service resource has been created but not published for the target endpoint namespace.
- **Fix**: Go to Authoring > Web Services, query program, and click the **Publish** button to activate the routing paths.
