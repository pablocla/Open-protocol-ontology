# Protocol Governance Model

The Open Protocol ONTOLOGY (OPO) operates under a lightweight, consensus-driven open-source governance model designed to keep the specification neutral, high-quality, and robust for enterprise adoption.

---

## 1. Project Roles

### Protocol Steward (Founding Maintainer)
The **Protocol Steward** is responsible for the overall vision, technical integrity, and stewardship of the OPO protocol. The Steward holds conflict-resolution power and acts as the final arbiter for disputable changes.
*   **Initial Steward:** The OPO Founding Committee
*   **Responsibilities:** Repository maintenance, final signature on schema changes, security review, and release coordinate.

### Core Contributors (Commit Rights)
**Core Contributors** are trusted community members who have demonstrated high expertise, deep protocol understanding, and ongoing commitment to OPO.
*   **Access:** Direct write/merge access to standard branches.
*   **Elevation:** Nominated by any existing Core Contributor and approved by simple consensus (majority) of existing Core Contributors.

### Community Contributors (PR Only)
**Community Contributors** are developers, AI researchers, and ERP architects who propose improvements by submitting pull requests, opening issues, or translating ontology concepts.

---

## 2. Decision Making & The RFC Process

To maintain stability, all changes to entity schemas (`public/schemas/*.json`), the core ontological context (`public/opo-context.jsonld`), or the protocol invariants MUST go through the RFC (Request for Comments) process:

```
[Proposal Issue] ➔ [Draft PR] ➔ [14-Day Public Audit] ➔ [Core Consensus] ➔ [Merge/Release]
```

1.  **Drafting:** Propose changes via a pull request containing appropriate schema updates and inline documentation.
2.  **Consensus Check:** Core Contributors review issues, suggest modifications, and voice objections.
3.  **Approval:** A change is accepted if it receives at least two approvals from Core Contributors and no sustained objections within 14 calendar days.
4.  **Arbitration:** If an agreement cannot be reached, the Protocol Steward acts as the final decision maker.

---

## 3. Versioning & Backward Compatibility

OPO strictly follows **Semantic Versioning 2.0.0 (SemVer)** relative to its schema and programmatic structural API representations:

*   **PATCH:** Documentation improvements, spelling fixes, and the addition of low-impact, non-breaking multi-language aliases in the registry.
*   **MINOR:** Adding new high-level entities, non-required schema attributes, or supplemental ERP mapping guides.
*   **MAJOR:** Removing existing attributes, renaming schema parameters, adding mandatory fields to schemas, or modifying core protocol invariants.

The Protocol Steward is the final authority on deciding version number increments.

---

## 4. Conflict Resolution

Disagreements concerning standard semantics, naming conventions, or implementation guidelines are settled by:
1.  Objective discussion based on real-world ERP system structures (e.g. comparing how SAP, NetSuite, or Odoo stores structural elements).
2.  Simple vote among active Core Contributors.
3.  Steward veto/arbitration if voting ends in an unresolved tie.
