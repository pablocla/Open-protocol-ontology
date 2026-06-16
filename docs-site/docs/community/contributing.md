---
title: "Contributing"
sidebar_position: 1
---

# Contributing to Open Protocol ONTOLOGY (OPO)

Thank you for your interest in contributing to the Open Protocol ONTOLOGY (OPO)! This project aims to build a universally accessible, machine-manageable semantic layer for ERP integration.

By contributing to OPO, you help make traditional enterprise data universally understandable to modern Artificial Intelligence.

---

## 1. Adding New Aliases to `opo-registry.json`

The alias registry maintains common synonyms, translations, and ERP tables mapped to canonical OPO terms. To add page aliases, prepare a pull request updating `public/opo-registry.json` using the following scoring framework:

### Confidence Scoring Guidelines

When proposing an alias, assign a `confidence` floating-point value reflecting how strictly the alias corresponds to the OPO target definition:

*   **1.0 (Exact, Standard Synonym):** A perfect, exact dictionary match with zero ambiguity (e.g., `Cliente` Spanish → `opo:Customer`).
*   **0.9 (Very Strong Match):** Strong industry-specific standard term or standard localized system name (e.g., `SAP S/4 KNA1` → `opo:Customer`).
*   **0.8 (Minor Context/Structural Shift):** Synonymous in 90% of business settings but might have minor functional shifts (e.g., `Vendor` matching `opo:Supplier`).
*   **0.7 (General Concept):** Higher-level generalizations where reasoning is needed (e.g., `Contraparte` Spanish -> `opo:Party`).
*   **< 0.7 (Broad or Low Match):** Avoid mapping unless clarifying notes are provided inside the `"notes"` attribute. 

---

## 2. Proposing New Entities (The RFC Process)

New entities must follow an Request for Comments (RFC) process to maintain high cohesion across the protocol:

1.  **Open a GitHub Issue:** Title your issue `RFC: Add <EntityName>`.
2.  **Describe Use Case:** Explain why existing entities cannot model this structure, with concrete AI agent use cases.
3.  **Provide Sample Schema & ERP Mappings:** Document how this entity is represented in at least two top-market ERPs (e.g., SAP, Odoo, or Dynamics).
4.  **Community Review:** Maintainers and community members will audit the schema draft for 14 days before merging.

---

## 3. Submitting ERP Mappings

When submitting mapping directories, ensure inclusion of these parameters under the entity's `x-opo-erp-mappings` schema block:
*   `table_name`: The original system table reference (e.g. `MARA`).
*   `field_mappings`: A key-value dictionary matching ERP fields to OPO parameters.
*   `notes`: Specific contextual information regarding localized versions, modules, or configurations.

---

## 4. Submitting Adapter Examples

We invite implementation examples across multiple languages (TypeScript, Python, Go, C#) showing how standard connectors can implement the `OPOAdapter` interface. Place your additions under `/app/adopt/` or the code directories so they can be exposed on the static documentation site.

---

## Governance & Code of Conduct

*   For technical governance, including voting models and core roles, see [GOVERNANCE.md](GOVERNANCE.md).
*   Please interact constructively. We expect all contributors to adhere to a professional Code of Conduct, ensuring a welcoming environment free from harassment or hostility.
