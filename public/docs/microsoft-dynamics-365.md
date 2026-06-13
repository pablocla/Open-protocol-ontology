# OPO Adapter Guide: Microsoft Dynamics 365

**API:** Dataverse Web API (OData v4) | **Auth:** Azure AD OAuth 2.0 (Service Principal) | **Difficulty:** Medium | **Setup:** ~25 min

---

The Open Protocol Ontology (OPO) adapter for Microsoft Dynamics 365 maps MS Dataverse and Dynamics 365 Finance & Operations entities. It standardizes corporate Dataverse schema structures into direct, OPO-compliant JSON elements.

## Prerequisites
- Administration access to Microsoft Power Platform Admin Center.
- An Azure Active Directory (Azure AD / Entra ID) tenant with permissions to register applications.
- S2S (Server-to-Server) Application User role in Dynamics 365.

---

## Step 1 — Enable API access

Dynamics 365 exposes its data via Microsoft Dataverse Web API. Enable access by registering your client:

1. Open the [Azure Portal](https://portal.azure.com) and navigate to **App Registrations** under Microsoft Entra ID.
2. Click **New Registration**. Name the app `OPO-Adapter-D365`.
3. Set Supported Account Types to **Single tenant only** and click **Register**.
4. Record the **Application (client) ID** and **Directory (tenant) ID** from the overview panel.

---

## Step 2 — Obtain credentials

Register a client credential and configure Dynamics 365 Application User privileges:

1. In Azure Portal, select the registered application, navigate to **Certificates & Secrets** > **New Client Secret**.
2. Name it `OPO-D365-Secret`, set expiry, and click **Add**. Copy the secret **Value** immediately.
3. Open Power Platform Admin Center, navigate to your environment, go to **Settings** > **Users + permissions** > **Application Users** > **New**.
4. Select the registered Azure AD application name `OPO-Adapter-D365`, select business unit, and assign the security role `Service Reader` or target system tables READ/WRITE roles.
5. Click **Save**.

---

## Step 3 — Configure OPO adapter

Set the tenant identifiers in your local `opo-adapter.config.json` folder setup:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "Dynamics365",
  "connection": {
    "authType": "Azure_AD",
    "tenantId": "microsoft-tenant-id-here-948a",
    "clientId": "d365-client-guid-940a0",
    "clientSecret": "d365-secret-val-x9910f",
    "resource": "https://my-org-instance.crm.dynamics.com"
  },
  "cachingMinutes": 10,
  "jurisdiction": "Global"
}
```

---

## Step 4 — Expose discovery endpoint

Publish standard entity translations inside your `/.well-known/opo.json` file directory to map standard Dataverse tables to canonical schemas:

```json
{
  "$schema": "https://openprotocol.dev/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "DYNAMICS365-CORP-FIN",
  "jurisdiction": "Global",
  "adapter_endpoints": {
    "base_url": "https://d365-opo.myenterprise.com/api/v1",
    "discovery": "https://d365-opo.myenterprise.com/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Party",
      "native_reference": "accounts / contacts",
      "matching_confidence": 0.90
    },
    {
      "canonical": "opo:Customer",
      "native_reference": "accounts (RelationshipType Customer)",
      "matching_confidence": 0.95
    },
    {
      "canonical": "opo:Order",
      "native_reference": "SalesTable",
      "matching_confidence": 0.95
    }
  ]
}
```

---

## Step 5 — Test

Launch simple terminal verification calls to extract OData records through the OPO Adapter proxy wrapper:

```bash
# Obtain Azure Active Directory token for Dataverse API
curl -X POST "https://login.microsoftonline.com/<tenantId>/oauth2/v2.0/token" \
  -d "client_id=<clientId>" \
  -d "scope=https://my-org-instance.crm.dynamics.com/.default" \
  -d "client_secret=<clientSecret>" \
  -d "grant_type=client_credentials"

# Retrieve OPO translated Customer profile
curl -X GET "https://d365-opo.myenterprise.com/api/v1/entities/Customer/A59102" \
  -H "Authorization: Bearer <opo_token>"
```

---

## Entity mapping reference

| Canonical OPO Entity | Dynamics 365 / Dataverse Table | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `accounts` / `contacts` | Maps account ID, name, corporate taxonomy records. | 0.90 |
| `opo:Customer` | `accounts (relationship=cust)` | Maps outstanding balances, credit guidelines, and limit records. | 0.95 |
| `opo:Supplier` | `accounts (relationship=vend)` | Maps supplier trade indicators, payment schedules. | 0.95 |
| `opo:Invoice` | `msdyn_projectinvoice` | Maps transaction id to serial legal reference variables. | 0.92 |
| `opo:Order` | `SalesTable` / `SalesLine` | Maps transactional rows, gross volumes, items. | 0.95 |

---

## Known limitations
- MS Dataverse represents similar fields as different logical column names based on module activation (e.g., Finance vs Retail).
- S2S (Server-to-Server) API requests are throttled at 120,000 queries per 24 hours per licensed user principal.

---

## Troubleshooting

### Error: `OPO-ERR-003: Azure AD Authentication Fail`
- **Cause**: Directory tenant ID, service principal credentials, or API secret are out of date.
- **Fix**: Re-allocate client secret in Azure Entra Portal and verify client-to-azure registration mappings.

### Error: `Dynamics Access Denied: User not authorized for database lookup`
- **Cause**: Azure AD principal assigned in Dynamics Admin console has missing Dataverse environment system roles.
- **Fix**: Open Power Platform Admin setting tools, go to Application Users, select `OPO-Adapter-D365`, and confirm it has active Business Lead roles.
