# OPO Adapter Guide: Infor CloudSuite

**API:** ION API Gateway / REST Web Services | **Auth:** OAuth 2.0 (ION Client Keys) | **Difficulty:** High | **Setup:** ~40 min

---

The Open Protocol Ontology (OPO) adapter for Infor CloudSuite links client systems to Infor OS (Operating Service) via the ION API Gateway. It unifies schemas from multiple underlying Infor platforms (M3, LN, SyteLine) into OPO-compliant JSON.

## Prerequisites
- Administrative access to Infor OS and Infor ION API Gateway registry.
- Signed-off OAuth registration role in Infor OS.
- Knowledge of specific ERP core sub-platform (LN vs M3 vs Syteline schema targets).

---

## Step 1 — Enable API access

Infor services publish transactional operations through the centralized Infor OS ION Gateway:

1. Log in to the **Infor OS portal** and open the **ION API application**.
2. Go to **Authorized Apps** and click **Plus (`+`)** to add your integration client.
3. Configure App Type to **Backend Service** or **Web Application**.
4. Set Name to `OPO-OS-Gateway`, choose permissions, and save.

---

## Step 2 — Obtain credentials

1. Locate the registered `OPO-OS-Gateway` application profile inside the ION API screen.
2. Click **Download Credentials** to fetch the system configuration bundle `oAuth.json` file.
3. The credential file provides `saUrl`, `puUrl`, `tiUrl`, `ci` (Client ID) and `cs` (Client Secret) values.

---

## Step 3 — Configure OPO adapter

Install the CloudSuite ION credentials in `opo-adapter.config.json` folder root directory:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "InforCloud",
  "connection": {
    "authType": "OAuth2",
    "ionBaseUrl": "https://mingle-ionapi.inforcloudsuite.com/mytenant_PRD/IONAPI",
    "clientId": "infor_ci_value_x940",
    "clientSecret": "infor_cs_value_z721",
    "puUrl": "https://mingle-sso.inforcloudsuite.com/mytenant_PRD/as/token.oauth2"
  },
  "cachingMinutes": 10,
  "jurisdiction": "Global"
}
```

---

## Step 4 — Expose discovery endpoint

Expose supported endpoints using standard `/.well-known/opo.json` configurations:

```json
{
  "$schema": "https://openontology.vercel.app/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "INFOR-ION-OS-PRD",
  "jurisdiction": "Global",
  "adapter_endpoints": {
    "base_url": "https://infor-opo.myenterprise.com/api/v1",
    "discovery": "https://infor-opo.myenterprise.com/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Party",
      "native_reference": "ION Document (TradingPartner)",
      "matching_confidence": 0.85
    },
    {
      "canonical": "opo:Customer",
      "native_reference": "CustomerRecord (LN-tccom110)",
      "matching_confidence": 0.90
    }
  ]
}
```

---

## Step 5 — Test

Perform simple endpoint queries through the OPO Adapter to verify standard business schemas translation:

```bash
# Probe mapped Customer record through Infor OPO wrapper
curl -X GET "https://infor-opo.myenterprise.com/api/v1/entities/Customer/C000109" \
  -H "Authorization: Bearer <opo_api_key>"
```

---

## Entity mapping reference

| Canonical OPO Entity | Infor LN / M3 Table Target | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `TradingPartner` Document | Maps trading partner profiles to OPO Party models. | 0.85 |
| `opo:Customer` | `CustomerRecord` (`tccom110`) | Maps business partner customer balance files. | 0.90 |
| `opo:Supplier` | `VendorRecord` (`tccom120`) | Maps accounts payable vendor metrics. | 0.90 |
| `opo:Invoice` | `SalesInvoice` (`tfacr200`) | Maps legal outstanding billing documents. | 0.85 |
| `opo:Order` | `SalesOrder` (`tdsls400`) | Maps standard commercial procurement documents. | 0.92 |

---

## Known limitations
- Underneath target fields differ significantly depending on the CloudSuite edition (M3 vs LN).
- ION API REST payload routing may introduce slight latency overhead.

---

## Troubleshooting

### Error: `OPO-ERR-003: Infor ION Authorization Failed`
- **Cause**: Outdated signature credentials, or client expired in ION Gateway dashboard.
- **Fix**: Re-register `Backend Service` app under ION Authorized Apps and download updated credentials.

### Error: `Infor OS Error: Routing path or endpoint target unreachable`
- **Cause**: Underlying business ERP endpoint lacks proper subscription in ION OS.
- **Fix**: Open ION routing dashboard, go to Connection Points, and verify target application subscription status.

