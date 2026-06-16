# OPO Adapter Guide: TOTVS Protheus

**API:** REST API (AdvPL TLPP) | **Auth:** Basic Auth / TOTVS Fluig Identity Bearer Token | **Difficulty:** Medium | **Setup:** ~30 min

---

The Open Protocol Ontology (OPO) adapter for TOTVS Protheus bridges standardized protocols and TOTVS's proprietary AdvPL TLPP Advanced Framework. It translates legacy relational tables (e.g., SA1, SA2, SF2) into OPO-compliant JSON schemas, including full support for Brazilian tax structures (CNPJ, CPF, NF-e).

## Prerequisites
- TOTVS Protheus v12.1.2310 or higher with an active REST endpoint configured in `appserver.ini`.
- Developer access to configure and compile AdvPL code if custom endpoints are required.
- Access to TOTVS Fluig Identity or Protheus connection credentials.

---

## Step 1 — Enable API access

TOTVS Protheus publishes standard REST APIs through the localized HTTP framework:

1. Locate and open your Protheus server configuration file `appserver.ini`.
2. Ensure the `[HTTPREST]` section is configured with an active port, paths, and matching database configurations:
   ```ini
   [HTTPREST]
   Port=8000
   IPsBind=
   URIs=REST
   Security=0
   ```
3. Restart the Protheus AppServer to initiate the endpoint services.

---

## Step 2 — Obtain credentials

OPO adapter connects to Protheus REST endpoints using Basic authentication or Bearer authorization:

1. Identify an integration user in Protheus (specifically mapped within table `USR`).
2. Verify user privileges using the Protheus Configurator module (`SIGACFG`), and confirm that the user has proper READ access to tables:
   - `SA1` (Clientes)
   - `SA2` (Fornecedores)
   - `SF2` (Cabeçalho de NF de Saída)
   - `SB1` (Descrição Genérica do Produto)

---

## Step 3 — Configure OPO adapter

Configure your Protheus environment connection variables inside `opo-adapter.config.json` folder root directory:

```json
{
  "opoVersion": "0.1.0",
  "erpPlatform": "Protheus",
  "connection": {
    "authType": "BasicAuth",
    "host": "http://192.168.1.50:8000",
    "user": "opo_service_user",
    "password": "protheus_profile_secret_x9102",
    "environment": "protheus_cop_prod",
    "restBaseUrl": "http://192.168.1.50:8000/rest"
  },
  "cachingMinutes": 10,
  "jurisdiction": "Brazil"
}
```

---

## Step 4 — Expose discovery endpoint

Expose supported Brazilian localized structures by maintaining standard `/.well-known/opo.json` path details:

```json
{
  "$schema": "https://openontology.vercel.app/ontology/schemas/opo-manifest.json",
  "opo_version": "0.1.0",
  "system_identifier": "TOTVS-PROTHEUS-PRD-BR",
  "jurisdiction": "Brazil",
  "adapter_endpoints": {
    "base_url": "https://protheus-opo.myenterprise.com.br/api/v1",
    "discovery": "https://protheus-opo.myenterprise.com.br/.well-known/opo.json"
  },
  "supported_entities": [
    {
      "canonical": "opo:Customer",
      "native_reference": "SA1 (Cadastro de Clientes)",
      "matching_confidence": 0.98
    },
    {
      "canonical": "opo:Invoice",
      "native_reference": "SF2 (Notas Fiscais de Saída)",
      "matching_confidence": 0.96
    },
    {
      "canonical": "opo:Product",
      "native_reference": "SB1 (Cadastro de Produtos)",
      "matching_confidence": 0.95
    }
  ]
}
```

---

## Step 5 — Test

Perform authenticated cURL commands to verify that standard Protheus REST/TLPP endpoints parse correctly:

```bash
# Query mapped Customer record through TOTVS Protheus OPO wrapper
curl -X GET "https://protheus-opo.myenterprise.com.br/api/v1/entities/Customer/000219" \
  -H "Authorization: Bearer <opo_api_key>"
```

---

## Entity mapping reference

| Canonical OPO Entity | Protheus Native DB Table | Translation / Field Mapping | Confidence |
| :--- | :--- | :--- | :--- |
| `opo:Party` | `SA1` / `SA2` | Maps `A1_COD` to `id`, `A1_NOME` to `legalName`, `A1_CGC` (CNPJ/CPF) to `taxId`. | 0.94 |
| `opo:Customer` | `SA1` (Cadastro de Clientes) | Maps `A1_COD` to `id`, `A1_SALDUP` to `outstandingBalance`, `A1_LC` to `creditLimit`. | 0.98 |
| `opo:Supplier` | `SA2` (Cadastro de Fornecedores)| Maps `A2_COD` to `id`, `A2_SALDUP` to `purchaseBalance`. | 0.98 |
| `opo:Invoice` | `SF2` (NF Saída) / `SF1` (Entrada) | Maps `F2_DOC` to `id` / `number`, `F2_EMISSÃO` to `issueDate`, `F2_VALBRUT` to `grandTotal`. | 0.96 |
| `opo:Order` | `SC5` (Venda) / `SC7` (Compra) | Maps `C5_NUM` to `id` / `number`, `C5_TOTAL` to `totalAmount`. | 0.95 |

---

## Known limitations
- Standard Protheus REST endpoints might require specific compilation patches to customize custom field outputs.
- Query performance correlates with active database indexes over SA1, SA2, and SF2 tables.

---

## Troubleshooting

### Error: `OPO-ERR-003: Protheus REST Master User Authentication Failed`
- **Cause**: Outdated password, or integration user profile lacks active REST privileges under TOTVS Fluig.
- **Fix**: Open TOTVS Configurator (`SIGACFG`), navigate to User Settings, verify Basic credentials, and unlock connection port access.

### Error: `TOTVS AppServer Error: Connection Refused (8000)`
- **Cause**: The HTTPREST service section has not been configured or isn't active under Protheus `appserver.ini`.
- **Fix**: Open configuration files on the host computer, double-check port bindings, and restart AppServer.

