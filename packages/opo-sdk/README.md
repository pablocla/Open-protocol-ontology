# Open Protocol Ontology (OPO) SDK

The official JavaScript/TypeScript SDK for the Open Protocol Ontology (OPO).

OPO acts as a universal semantic adapter that bridges modern AI Agents and LLMs with legacy ERPs, databases, and enterprise systems (SAP, Oracle, Odoo, etc.).

## Installation

```bash
npm install opo-sdk
```

## Usage

Instantiate the `OpoClient` to dynamically fetch ERP mappings from the global OPO registry.

```typescript
import { OpoClient } from 'opo-sdk';

async function main() {
  const opo = new OpoClient();

  // Fetch the official OPO mapping for SAP S/4HANA Invoices
  const sapInvoice = await opo.getMapping('sap-s4hana', 'Invoice');
  
  console.log(`Table Name: ${sapInvoice.tableName}`); // VBRK
  
  // Generate a System Prompt to inject into an LLM context
  const prompt = opo.generateSystemPrompt(sapInvoice);
  console.log(prompt);
}

main();
```

## Community Mappings
The SDK automatically pulls from the public community registry at `https://openontology.vercel.app/registry/`.

Currently supported out of the box:
- `sap-s4hana`
- `odoo-17`
- `totvs-protheus`

## License
MIT
