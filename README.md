# Open Protocol ONTOLOGY (OPO) v0.1.0

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Protocol Version: 0.1.0](https://img.shields.io/badge/OPO_Ontology-v0.1.0-emerald)](public/opo-context.jsonld)

The **Open Protocol ONTOLOGY (OPO)** is a universal semantic layer that enables autonomous AI agents, Large Language Models (LLMs), and workflow orchestrators to seamlessly discover, understand, and interoperate with enterprise resource planning (ERP) systems. By mapping complex, vendor-specific system tables (like SAP's `BKPF`, NetSuite's database schemas, or TOTVS's `SF2`) into clean, standardized, machine-readable semantic schema structures, OPO allows developers and AI systems to bypass the complex plumbing of traditional enterprise integration in favor of a declarative, zero-configuration discovery protocol.

---

## Why OPO Exists

Traditional Enterprise Resource Planning (ERP) databases are notorious for using dense, vendor-specific, or localized naming conventions. When an autonomous AI agent needs to perform an inspection or transaction (such as fetching an unpaid balance, confirming an inventory level, or matching a tax document), it is typically forced to handle custom REST APIs, specialized schema mappings, or proprietary databases. 

OPO solves this by defining:
1. **A Shared Vocabulary:** Translating hundreds of localized technical expressions into canonical terms (e.g. `Invoice`, `Customer`, `Guarantee`).
2. **Zero-Config Discovery:** Permitting systems to announce their adapter capabilities at `/.well-known/opo.json`.
3. **High-Confidence Mappings:** Guiding LLMs on what tables represent these entities across SAP S/4HANA, NetSuite, Dynamics 365, Odoo, Protheus, and others.

## What OPO is NOT

*   **NOT an API Gateway:** OPO does not query databases directly, proxy runtime HTTP requests, or store sensitive tokens. It is an open metadata standard.
*   **NOT a Data Warehouse:** OPO does not consolidate, replicate, or synchronize enterprise tables into a single database.
*   **NOT a Connector Platform:** It is not an iPaaS or integration engine. OPO is a semantic standard; actual data transfer occurs via OPO-compliant adapters.

---

## Quickstart for AI Builders (3 Steps to Compliance)

Make your system OPO-compliant to allow immediate discovery and interaction by AI agents:

1.  **Define and Host your OPO Manifest:** Generate an `opo.json` file mapping your native systems, custom tables, or endpoints to OPO's canonical entity schemas.
2.  **Expose the Discovery Endpoint:** Host your completed manifest at `https://your-domain.com/.well-known/opo.json`.
3.  **Implement the Simple Adapter Interface:** Expose structured REST or JSON-RPC endpoints that respond directly in OPO-compliant JSON schemas (e.g. returning `Customer` or `Product` formats).

---

## Quickstart for AI Agents

To consume and act upon OPO-compliant systems:

1.  **Discover:** Query the target host’s universal discovery endpoint:
    ```bash
    curl -H "Accept: application/json" https://your-domain.com/.well-known/opo.json
    ```
2.  **Resolve Aliases:** Consult the local index `/opo-registry.json` or `/opo-context.jsonld` to map the agent's goal (e.g., finding "bills") to OPO’s canonical schema (e.g., `Invoice`).
3.  **Interact:** Invoke the adapter endpoint described in the manifest, requesting properties matching OPO's JSON Schema.

---

## File Map (Public Standards Assets)

All canonical protocol files are served statically from `/public/`:

*   `/public/opo-context.jsonld`: Canonical JSON-LD v1.1 semantic metadata context for linked data interpreters.
*   `/public/opo-registry.json`: Dynamic alias-to-schema dictionary covering 100+ multi-language terms with statistical confidence scores.
*   `/public/opo-ai-primer.md`: Highly dense, token-optimized system prompt injection file to teach LLMs how to communicate in OPO schema.
*   `/public/opo-manifest.example.json`: Reference OPO Manifest configured for a Protheus/TOTVS ERP implementation.
*   `/public/opo-manifest.example2.json`: Reference OPO Manifest configured for an Odoo 17 Community implementation.
*   `/public/.well-known/opo.json`: Reference discovery file describing available entity adapters.
*   `/public/schemas/*.json`: Canonical JSON Schema draft-2020-12 validation schemas for all 23 OPO entity models.

---

## Contributing

We welcome community contributions, particularly new multi-language alias pairs, ERP-specific schema mappings, and adapter examples. Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to understand how to propose aliases and new entity structures.

## License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details. 

Copyright 2025 The OPO Contributors.
