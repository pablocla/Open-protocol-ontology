# OPO Adapter Guide: Oracle NetSuite

**API:** REST Record API / SuiteQL | **Auth:** OAuth 2.0 (Token-Based / TBA) | **Difficulty:** Medium | **Setup:** ~30 min

---

The Open Protocol Ontology (OPO) adapter for NetSuite links client applications with Oracle NetSuite's OneWorld cloud accounting. It translates NetSuite's unified Entity, Transaction, and Item records into lightweight, deterministic, OPO-compliant structures.

## Prerequisites
- A NetSuite Administrator login with permissions for enabling SuiteTalk REST Web Services.
- Integration credentials (Consumer Key and Secret).
- Token-Based Authentication enabled under Setup > Company > Enable Features.

---

## Step 1 — Enable API access

1. Log in to NetSuite as an Administrator and navigate to **Setup** > **Company** > **Enable Features**.
2. Click on the **SuiteCloud** subtab.
3. Scroll down to the **SuiteTalk (Web Services)** section and check:
   - **REST Web Services**
4. Under the **Manage Authentication** section, check:
   - **OAuth 2.0** or **Token-Based Authentication**.
5. Click **Save**.

---

## Step 2 — Obtain credentials

1. Navigate to **Setup** > **Integration** > **Manage Integrations** > **New**.
2. Name the integration `OPO Adapter Integration`.
3. Set the state to **Enabled**.
4. Check **Token-Based Authentication** on the Authentication tab. Do NOT check Client Credentials.
5. Click **Save** and record the generated **Consumer Key** and **Consumer Secret** (they are shown only once).
6. Next, search or navigate to **Setup** > **Users/Roles** > **Access Tokens** > **New**.
7. Select the Integration you just created, select your User, and choose the correct Role with API access limits.
8. Click **Save** and record the product token details: **Token ID** and **Token Secret**.

---

## Step 3 — Configure OPO adapter

Configure your proxy server configuration file `opo-adapter.config.json` with your verified NetSuite account prefix URL:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "NetSuite",
  "connection": {
    "authType": "TBA",
    "account": "1234567-SB",
    "consumerKey": "ns_consumer_key_here_x129",
    "consumerSecret": "ns_consumer_secret_here_f823",
    "tokenId": "ns_token_id_here_z77",
    "tokenSecret": "ns_token_secret_here_c882",
    "baseUrl": "https://1234567-sb.restlets.api.netsuite.com/services/rest/record/v1"
  },
  "cachingMinutes": 5,
  "jurisdiction": "Global"
}
```

---

## Step 4 — Expose discovery endpoint

Provide NetSuite schema profiles within your `/.well-known/opo.json` file so AI agents can query the OPO endpoints with high matching scores:

```json
{
  "$schema": "https://openontology.vercel.app/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "NETSUITE-PROD-GLOBAL",
  "jurisdiction": "Global",
  "adapter_endpoints": {
    "base_url": "https://netsuite-opo.myenterprise.com/api/v1",
    "discovery": "https://netsuite-opo.myenterprise.com/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Customer",
      "native_reference": "Customer Record (customer)",
      "matching_confidence": 0.98
    },
    {
      "canonical": "opo:Invoice",
      "native_reference": "Invoice Transaction (invoice)",
      "matching_confidence": 1.00
    },
    {
      "canonical": "opo:Supplier",
      "native_reference": "Vendor Record (vendor)",
      "matching_confidence": 0.98
    }
  ]
}
```

---

## Step 5 — Test

Submit an authenticated REST request to verify that the SuiteTalk record structure mapping handles correctly:

```bash
# Query mapped Customer record directly from the adaptor proxy
curl -X GET "https://netsuite-opo.myenterprise.com/api/v1/entities/Customer/9482" \
  -H "Authorization: Bearer <opo_session_key>"
```

---

## Entity mapping reference

| Canonical OPO Entity | NetSuite Native Record Segment | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `Entity` (EntityRecord) | Maps internal entity classifications to standard Party models. | 0.92 |
| `opo:Customer` | `Customer` (customer) | Maps `id` to `id`, `balance` to `outstandingBalance`, `creditlimit` to `creditLimit`. | 0.98 |
| `opo:Supplier` | `Vendor` (vendor) | Maps `id`, `payables` to `purchaseBalance`, `terms` to `paymentTerms`. | 0.98 |
| `opo:Invoice` | `Invoice` (invoice transaction) | Maps `tranId` to `number`, `trandate` to `issueDate`, `total` to `grandTotal`. | 1.00 |
| `opo:Order` | `Sales Order` (salesorder) | Maps `id`, `tranId` to `number`, `total` to `totalAmount`. | 0.95 |

---

## Known limitations
- SuiteQL requests are recommended for complex, high-throughput collection fetching instead of calling single records iteratively.
- NetSuite limits concurrent TBA traffic per integration to 50 active channels.

---

## Troubleshooting

### Error: `OPO-ERR-003: NetSuite Token Authentication Failed`
- **Cause**: Outdated Access Token registration or invalid TBA signature parameters.
- **Fix**: Re-allocate Access Token under NetSuite Setup > Users/Roles > Access Tokens, copy to configuration, and check NetSuite account ID capitalization.

### Error: `NetSuite Access Denied: Insufficient permissions for API endpoint`
- **Cause**: The user role associated with your TBA token lacks the required WEB SERVICES integration permissions.
- **Fix**: Go to Users/Roles > Manage Roles, select your API service role, click Permissions > Setup, and add `REST Web Services` privilege.
