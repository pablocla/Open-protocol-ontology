---
title: "SDK Reference"
sidebar_position: 6
---


The official JavaScript/TypeScript SDK for the Open Protocol Ontology (OPO).

OPO acts as a universal semantic adapter that bridges modern AI Agents and LLMs with legacy ERPs, databases, and enterprise systems (SAP, Oracle, Odoo, etc.).

## Installation

```bash
npm install opo-sdk
```

## Features

### 1. Interactive CLI Generator (No-Code)
Instantly generate OPO JSON schemas right from your terminal without writing a single line of code:

```bash
npx opo
```
*The CLI will ask you for your Entity Name, ERP, and let you map fields step-by-step.*

### 2. Programmatic Ontology Builder
Build schemas gracefully using our Fluent API:

```typescript
import { OpoOntologyBuilder } from 'opo-sdk';

const builder = new OpoOntologyBuilder()
  .setEntity('Invoice')
  .setSource('SQL', 'BKPF')
  .addField('id', 'VBELN', 'string')
  .addField('totalAmount', 'NETWR', 'number');

const mySchema = builder.build();
console.log(mySchema);
```

### 3. Dynamic Registry Client
Instantiate the `OpoClient` to dynamically fetch global community mappings from the OPO registry.

```typescript
import { OpoClient } from 'opo-sdk';

async function main() {
  const opo = new OpoClient();

  // Fetch the official OPO mapping for SAP S/4HANA Invoices
  const sapInvoice = await opo.getMapping('sap-s4hana', 'Invoice');
  
  // Generate a System Prompt to inject into an LLM context
  const prompt = opo.generateSystemPrompt(sapInvoice);
  console.log(prompt);
}

main();
```

## AI Native Roadmap
We are actively building capabilities to directly pass an API Key (e.g. OpenAI, Anthropic) into the SDK to dynamically translate Natural Language queries into exact SQL/OData statements using the mapped schemas.

## License
MIT
