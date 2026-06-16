---
title: "Workday"
---

# OPO Adapter Guide: Workday

**API:** REST / RaaS (Report-as-a-Service) | **Auth:** OAuth 2.0 (Bearer) | **Difficulty:** High | **Setup:** ~35 min

---

The Open Protocol Ontology (OPO) adapter for Workday maps human resource, payroll, and expense indicators. Due to Workday's highly protective schema APIs, the adapter relies on custom **RAAS (Report-as-a-Service)** JSON schemas to extract and model OPO-compliant profiles.

## Prerequisites
- Workday Administrative access to create custom reports.
- Integrations Security Group (ISG) or Service User configured.
- Modern Workday Tenant URL.

---

## Step 1 — Enable API access

1. Log in to Workday Tenant with administrative privileges.
2. In the search box, enter **Create Custom Report** and select the task.
3. Configure settings:
   - Report Name: `OPO_Party_Integration_Report`
   - Report Type: **Advanced**
   - Data Source: **All Workers** or **All Supplier Invoices** (corresponding to OPO entity targets).
4. Click **OK**.

---

## Step 2 — Obtain credentials

1. On the report layout screen, select required fields to map to OPO (e.g., Legal Name, Tax Identification, Status, Role).
2. Go to the **Share** tab, check **Share with specific integration users** and specify your OPO service Integration user profile.
3. Navigate to **Advanced** > **Web Service API** and copy the **JSON Web Service URL**.
4. Create an Integration System User (ISU) in Workday with OAuth 2.0 client credentials, downloading the `Client ID` and `Client Secret`.

---

## Step 3 — Configure OPO adapter

Install your Workday RaaS endpoints in `opo-adapter.config.json` folder directory:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "Workday",
  "connection": {
    "authType": "OAuth2",
    "tokenUrl": "https://impl.workday.com/ccx/oauth2/mytenant/token",
    "clientId": "workday_client_guid_958",
    "clientSecret": "workday_client_secret_z772",
    "raasUrl": "https://services1.workday.com/ccx/service/customreport2/mytenant/opo_party_report?format=json"
  },
  "cachingMinutes": 15,
  "jurisdiction": "Global"
}
```

---

## Step 4 — Expose discovery endpoint

Provide directory structures for workers and cost centers inside `/.well-known/opo.json` file:

```json
{
  "$schema": "https://openontology.vercel.app/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "WORKDAY-CLOUD-ENT",
  "jurisdiction": "Global",
  "adapter_endpoints": {
    "base_url": "https://workday-opo.myenterprise.com/api/v1",
    "discovery": "https://workday-opo.myenterprise.com/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Employee",
      "native_reference": "Worker Object (Worker)",
      "matching_confidence": 0.99
    },
    {
      "canonical": "opo:CostCenter",
      "native_reference": "Cost Center Reference",
      "matching_confidence": 0.95
    }
  ]
}
```

---

## Step 5 — Test

Launch quick automated cURL test scripts to verify worker extraction through the OPO RaaS Adapter proxy translation:

```bash
# Query mapped Employee record through Workday OPO wrapper
curl -X GET "https://workday-opo.myenterprise.com/api/v1/entities/Employee/EMP4491" \
  -H "Authorization: Bearer <opo_session_key>"
```

---

## Entity mapping reference

| Canonical OPO Entity | Workday Native Object / RaaS Data Source | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `Legal Entity` | Maps organization hierarchies and corporate tax units. | 0.88 |
| `opo:Employee` | `Worker` (All Workers) | Maps `Employee_ID` to `id`, `Primary_Business_Title` to `role`, `Work_Status` to `status`. | 0.99 |
| `opo:Supplier` | `Supplier Object` | Maps supplier contact names, accounts, and tax identifications. | 0.90 |
| `opo:Invoice` | `Supplier Invoice` | Maps invoice dates, amounts and item listings. | 0.82 |
| `opo:CostCenter`| `Cost Center Reference` | Maps organizational cost parameters, departments. | 0.95 |

---

## Known limitations
- Writing transactional data back into Workday via SOAP APIs requires heavy administrative and security clearance.
- Large volume RaaS reports can take up to 30 seconds to parse at run-time if caching configs are disabled.

---

## Troubleshooting

### Error: `OPO-ERR-003: Workday OAuth Handshake Failed`
- **Cause**: Inaccurate endpoint path, client secret expiry, or ISU missing integration credentials.
- **Fix**: Re-allocate client secret credentials in the Tenant and set proper token expiration dates.

### Error: `RaaS Access Denied: 403 Forbidden`
- **Cause**: The report has not been shared with the specific Integration System User (ISU) profile.
- **Fix**: Open Custom Report settings, head to **Share** and add your OPO system integration user.

