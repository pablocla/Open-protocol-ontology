# OPO Adapter Guide: QuickBooks Online

**API:** REST API (Intuit Developer Portal) | **Auth:** OAuth 2.0 (Intuit Client Credentials) | **Difficulty:** Low | **Setup:** ~15 min

---

The Open Protocol Ontology (OPO) adapter for QuickBooks Online links client tools with the Intuit Developer Platform. It translates standard QuickBooks schema entities (like Invoice, Customer, and Payment) into streamlined OPO-compliant JSON representations.

## Prerequisites
- An active Intuit Developer Account and sandbox environment.
- A registered App on the Intuit Developer Portal.
- Administration privileges for the target QuickBooks company files.

---

## Step 1 — Enable API access

1. Log in to the [Intuit Developer Portal](https://developer.intuit.com).
2. Click on **Dashboard** and select **Create an App**.
3. Name your app `OPO-Adapter` and select the scope **QuickBooks Online API**.
4. Inside your App's dashboard, go to **Development Settings** > **Keys & OAuth**.
5. Record your development **Client ID** and **Client Secret**.

---

## Step 2 — Obtain credentials

QuickBooks Online uses standard OAuth 2.0. To link your enterprise account:

1. Obtain your target **Company ID** (also called Realms ID) under QuickBooks settings > Account and Settings > Company.
2. In the Developer Portal, configure Redirect URIs to point to your adapter gateway URL (e.g., `https://qb-opo.myenterprise.com/auth/callback`).
3. Complete the standard Intuit authorization consent flow to retrieve initial access and refresh tokens.

---

## Step 3 — Configure OPO adapter

Install your Intuit OAuth parameters inside `opo-adapter.config.json` folder root directory:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "QuickBooks",
  "connection": {
    "authType": "OAuth2",
    "companyId": "94191028301",
    "clientId": "qb_client_id_x1920",
    "clientSecret": "qb_client_secret_z7711",
    "accessToken": "qb_access_token_token_here",
    "refreshToken": "qb_refresh_token_token_here",
    "baseUrl": "https://quickbooks.api.intuit.com/v3/company"
  },
  "cachingMinutes": 5,
  "jurisdiction": "Global"
}
```

---

## Step 4 — Expose discovery endpoint

Expose QBO supported entities inside your standard `/.well-known/opo.json` file directory:

```json
{
  "$schema": "https://openontology.vercel.app/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "QUICKBOOKS-ONLINE-GLB",
  "jurisdiction": "Global",
  "adapter_endpoints": {
    "base_url": "https://qb-opo.myenterprise.com/api/v1",
    "discovery": "https://qb-opo.myenterprise.com/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Customer",
      "native_reference": "Customer Entity",
      "matching_confidence": 0.98
    },
    {
      "canonical": "opo:Invoice",
      "native_reference": "Invoice Entity",
      "matching_confidence": 1.00
    },
    {
      "canonical": "opo:Supplier",
      "native_reference": "Vendor Entity",
      "matching_confidence": 0.98
    }
  ]
}
```

---

## Step 5 — Test

Launch cURL requests to ensure the QuickBooks API handles records translation:

```bash
# Obtain authentic Customer file outputs from OPO proxy endpoint
curl -X GET "https://qb-opo.myenterprise.com/api/v1/entities/Customer/12" \
  -H "Authorization: Bearer <opo_token>"
```

---

## Entity mapping reference

| Canonical OPO Entity | QuickBooks Native Object | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `Customer` / `Vendor` | Maps legal names, business contact directories, tax profiles. | 0.90 |
| `opo:Customer` | `Customer` | Maps `Id` to `id`, `Balance` to `outstandingBalance`, `CreditLimit` to `creditLimit`. | 0.98 |
| `opo:Supplier` | `Vendor` | Maps supplier profile records, account balances. | 0.98 |
| `opo:Invoice` | `Invoice` | Maps `DocNumber` to `number`, `TxnDate` to `issueDate`, `TotalAmt` to `grandTotal`. | 1.00 |
| `opo:Order` | `Estimate` / `SalesOrder` | Maps transactional lines, amounts, estimates. | 0.94 |

---

## Known limitations
- Intuit limits API access to 500 requests per minute per company file.
- Batch transactions should be limited to 30 items per payload to stay within response size constraints.

---

## Troubleshooting

### Error: `OPO-ERR-003: QuickBooks Token Expiry`
- **Cause**: Access token expired, or refresh token became invalid as refresh limits have been exceeded.
- **Fix**: Launch QBO authorization loop to re-authenticate and refresh credentials.

### Error: `Intuit API Error: 401 Unauthorized`
- **Cause**: Inaccurate authorization headers or mismatched Company ID (Realm ID).
- **Fix**: Verify your Realm ID configuration matches the credentials set in `opo-adapter.config.json` exactly.
