# OPO Adapter Guide: Odoo 17

**API:** REST / JSON-RPC | **Auth:** API Key (v17+) / Technical Service User | **Difficulty:** Low | **Setup:** ~15 min

---

The Open Protocol Ontology (OPO) adapter for Odoo 17 wraps Odoo's internal Object-Relational Mapping (ORM) layer. It translates Odoo's pythonic dot-notation database models (like `res.partner` or `account.move`) into consistent, lightweight JSON files.

## Prerequisites
- Odoo v17.0 Community or Enterprise Edition.
- Administration credentials or an active system developer account with database privileges.
- API Keys activation configured under Odoo Preferences.

---

## Step 1 — Enable API access

Odoo natively exposes model endpoints via standard XML-RPC and JSON-RPC APIs. To activate security channels using Odoo v17:

1. Log in to your Odoo 17 server instance.
2. Click on your profile icon in the top right corner and click **My Profile** or **Settings**.
3. Under the **Account Security** tab, locate **API Keys**.
4. Click **New API Key**, enter system description (e.g. `OPO-Adapter-Key`), enter your workspace password, and copy the generated API key.
5. Click **Confirm**.

---

## Step 2 — Obtain credentials

Odoo requires an exact Database name (`db`), User Login (`user`), and the `API Key` in place of standard user passwords for all API calls.

1. Navigate to **Technical Settings** > **Database Management** to verify your active database identifier (e.g., `odoo_prod`).
2. Record your login user name associated with the API key (e.g., `api-service-user@myenterprise.com`).

---

## Step 3 — Configure OPO adapter

Configure your local adapter server environment properties inside `opo-adapter.config.json` with matching credentials:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "Odoo",
  "connection": {
    "authType": "APIKey",
    "dbName": "odoo_prod",
    "userLogin": "api-service-user@myenterprise.com",
    "apiKey": "odo_key_9510a9f0293h72",
    "baseUrl": "https://odoo.myenterprise.com"
  },
  "cachingMinutes": 10,
  "jurisdiction": "Global"
}
```

---

## Step 4 — Expose discovery endpoint

Expose supported Odoo models via the transparent `/.well-known/opo.json` discovery gateway path:

```json
{
  "$schema": "https://openprotocol.dev/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "ODOO17-PROD-EUR",
  "jurisdiction": "Global",
  "adapter_endpoints": {
    "base_url": "https://odoo-opo.myenterprise.com/api/v1",
    "discovery": "https://odoo-opo.myenterprise.com/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Party",
      "native_reference": "res.partner",
      "matching_confidence": 0.96
    },
    {
      "canonical": "opo:Invoice",
      "native_reference": "account.move (type=out/in_invoice)",
      "matching_confidence": 1.00
    },
    {
      "canonical": "opo:Order",
      "native_reference": "sale.order",
      "matching_confidence": 0.95
    }
  ]
}
```

---

## Step 5 — Test

Launch a simple JSON-RPC call configuration using Python or cURL to evaluate model endpoints directly:

```bash
# Query mapped Invoice (account.move) record via OPO Adapter API gateway
curl -X GET "https://odoo-opo.myenterprise.com/api/v1/entities/Invoice/452" \
  -H "Authorization: Bearer <opo_api_token>"
```

---

## Entity mapping reference

| Canonical OPO Entity | Odoo 17 Native Model Name | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `res.partner` | Maps `id` to `id`, `name` to `legalName`, `vat` to `taxId`. | 0.96 |
| `opo:Customer` | `res.partner` (customer_rank > 0) | Maps `id` to `id`, `credit` to `outstandingBalance`. | 0.98 |
| `opo:Supplier` | `res.partner` (supplier_rank > 0) | Maps `id` to `id`, `debit` to `purchaseBalance`. | 0.98 |
| `opo:Invoice` | `account.move` (type='out_invoice') | Maps `id`, `name` to `number`, `invoice_date` to `issueDate`, `amount_total` to `grandTotal`. | 1.00 |
| `opo:Order` | `sale.order` / `purchase.order` | Maps `id`, `name` to `number`, `amount_total` to `totalAmount`. | 0.95 |

---

## Known limitations
- JSON-RPC call body arrays must respect precise positional argument indices during standard technical queries.
- Writing to Odoo analytical fields requires passing localized account configurations.

---

## Troubleshooting

### Error: `OPO-ERR-003: Odoo Database Access Denied (UID=false)`
- **Cause**: Invalid database name parameter, inaccurate email login, or wrong API key registration.
- **Fix**: Open Odoo login dashboard, verify database target name exactly, and generate a new API key from user security panel.

### Error: `Odoo ORM Error: AccessError (Document restriction)`
- **Cause**: The API key User profile lacks sufficient READ/WRITE permissions for some requested tables (e.g., `account.move`).
- **Fix**: Assign user to correct User groups (Invoicing > Accountant or Sales > Manager) in Settings > Users & Companies.
