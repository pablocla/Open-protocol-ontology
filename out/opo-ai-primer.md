# OPO v0.1.0 — AI Integration Primer

This document serves as the high-density system prompt injection guide for LLMs, autonomous agents, and orchestrators executing transactions or reading metrics on Open Protocol ONTOLOGY (OPO)-compliant Enterprise Resource Planning (ERP) systems.

---

## 1. Protocol Purpose & Discovery Loop

OPO provides a standard semantic abstraction layer over highly fragmented ERP databases. Rather than addressing specific vendor schemas (e.g., SAP `VBRK`, Totvs `SF2`), AI agents interact with OPO canonical types (e.g., `Invoice`).

### Discovery Phase
When initialized on a target domain, the agent MUST fetch the discovery manifest located at its HTTP endpoint root:
```http
GET https://<api-host.com>/.well-known/opo.json
Accept: application/json
```

The returned discovery payload declares active entities, relative query endpoints, and their direct native systems.

---

## 2. Alias Resolution & Confidence Thresholds

To translate external or user terms into canonical OPO schemas, consult the local `opo-registry.json` or inline metadata properties inside entity definitions:

1.  **Exact Maps:** If the resolved word exists in the registry with a `confidence >= 0.9`, map the term directly to its canonical counterpart (e.g. `KNA1` ➔ `opo:Customer`).
2.  **Weak Maps:** For confidence ratings between `0.7 and 0.89`, execute a multi-language synonym check matching the language code (e.g. `cliente` ➔ `opo:Customer` with `1.0` confidence).
3.  **Low Confidence (< 0.7):** If no matching alias resides with a confidence `>= 0.7`, the agent MUST NOT attempt transactional operations. Instead:
    *   Halt automatic query execution.
    *   Query the discovery endpoint's `/opo-registry.json` for fuzzy matches.
    *   Respond by requesting human clarification of system tables.

---

## 3. Query Format & Execution

Queries to OPO adapters MUST leverage structured REST endpoints defined in the discovery manifest, respecting schema specifications for filtering parameters:

### Header Constraints
-   `Content-Type: application/json`
-   `X-OPO-Version: 0.1.0`

### Parameter Structures
Filter filters (such as `id`, `taxId`, status flags, or date blocks) MUST correspond strictly with the property types inside the respective `/schemas/<Entity>.json` file.

---

## 4. Standard Error Codes Reference

When an OPO adapter fails, it returns standard semantic error payloads. Agents MUST recognize and parse these blocks:

-   **OPO-ERR-001 (Unauthorized):** Access credentials missing or invalidated.
-   **OPO-ERR-002 (Entity Not Configured):** Standard entity requested is absent in the adapter.
-   **OPO-ERR-003 (Validation Failure):** Field mappings failed target JSON-Schema compliance.
-   **OPO-ERR-004 (Query Timeout):** The underlying ERP took >30s to respond.
-   **OPO-ERR-005 (Schema Conflict):** Database model differs from standard OPO structure.

---

## 5. Canonical OPO Entity Types (v0.1.0)

Agents MUST map all transactional directives into one of the following 23 canonical names:

### Tier 1 (Core Foundations)
- `Party`: Base legal or organization entity.
- `Customer`: Downstream sales client.
- `Supplier`: Upstream supply chain vendor.
- `Employee`: HR hiring legajo.
- `Product`: Standard inventory product item.
- `Service`: Intangible billable tasks.
- `Invoice`: Standard legal tax invoice document.
- `Order`: Sales or procurement purchase agreement.
- `Contract`: Binding corporate lease or service agreement.
- `Payment`: Financial cash clearance trans.
- `CreditAccount`: Account line limits ledger.
- `Inventory`: Warehousing stocks balance levels.
- `PriceList`: Base matrix of item prices.

### Tier 2 (Financial Risk & Logistics)
- `CreditRisk`: Financial scoring risk parameters.
- `DebtObligation`: Liability loan obligations ledger.
- `Guarantee`: Collaterals and guarantor warrants.
- `FinancialExposure`: Aggregate credit/outstanding balances.
- `PaymentBehavior`: Historical dunning and delay metrics.
- `Warehouse`: Storage depot configurations.
- `ShipmentEvent`: Courier dispatch transit events.
- `TaxDocument`: Withholding certificates and VAT details.

### Tier 3 (Management Controls)
- `CostCenter`: Analytical organizational cost units.
- `Project`: Project tracking milestones and progressions.
