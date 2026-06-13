/**
 * Open Protocol ONTOLOGY (OPO) - ERP Documentation Registry Loader
 * Licensed under the Apache License, version 2.0
 * Copyright 2025 The OPO Contributors
 */

export interface ERPGuide {
  slug: string;
  name: string;
  vendor: string;
  version: string;
  apiType: 'REST' | 'JSON-RPC' | 'OData' | 'SOAP' | 'ODBC' | 'ION';
  authMethod: 'OAuth2' | 'APIKey' | 'BasicAuth' | 'NTLM' | 'SAMLToken';
  opoCompatibility: 'full' | 'partial' | 'community';
  tier1Coverage: number; // percentage (0 - 100)
  tier2Coverage: number; // percentage (0 - 100)
  docsUrl: string;
  region: string[];
  deploymentModel: 'cloud' | 'onpremise' | 'hybrid';
  difficulty: 'low' | 'medium' | 'high';
  estimatedSetupMinutes: number;
  knownLimitations: string[];
  guideFile: string;
  nativeMappings: { entity: string; erpTable: string; score: number }[];
}

export const ERP_GUIDES: ERPGuide[] = [
  {
    slug: 'sap-s4hana',
    name: 'SAP S/4HANA',
    vendor: 'SAP SE',
    version: '2023 Enterprise / Cloud BTP',
    apiType: 'REST',
    authMethod: 'OAuth2',
    opoCompatibility: 'full',
    tier1Coverage: 95,
    tier2Coverage: 80,
    docsUrl: 'https://api.sap.com',
    region: ['Global', 'EU', 'US', 'LATAM'],
    deploymentModel: 'hybrid',
    difficulty: 'high',
    estimatedSetupMinutes: 45,
    knownLimitations: [
      'Complex custom field mapping requires ABAP Dictionary registration',
      'Standard Gateway caches can take up to 10 minutes to refresh metadata'
    ],
    guideFile: 'sap-s4hana.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'BUT000', score: 0.95 },
      { entity: 'opo:Customer', erpTable: 'KNA1 / KNVV', score: 0.95 },
      { entity: 'opo:Supplier', erpTable: 'LFA1 / LFM1', score: 0.95 },
      { entity: 'opo:Invoice', erpTable: 'VBRK / VBRP', score: 0.98 },
      { entity: 'opo:Order', erpTable: 'VBAK / VBAP', score: 0.95 },
      { entity: 'opo:Payment', erpTable: 'PAYR / REGUP', score: 0.90 }
    ]
  },
  {
    slug: 'oracle-netsuite',
    name: 'Oracle NetSuite',
    vendor: 'Oracle Corporation',
    version: '2024.1 Cloud Native',
    apiType: 'REST',
    authMethod: 'OAuth2',
    opoCompatibility: 'full',
    tier1Coverage: 100,
    tier2Coverage: 85,
    docsUrl: 'https://docs.oracle.com/en/cloud/saas/netsuite',
    region: ['US', 'EU', 'LATAM', 'APAC'],
    deploymentModel: 'cloud',
    difficulty: 'medium',
    estimatedSetupMinutes: 30,
    knownLimitations: [
      'Sub-record access requires exact join declarations in SuiteQL queries',
      'Rate limiting of 50 concurrent requests per API session'
    ],
    guideFile: 'oracle-netsuite.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'Entity (EntityRecord)', score: 0.92 },
      { entity: 'opo:Customer', erpTable: 'Customer (customer)', score: 0.98 },
      { entity: 'opo:Supplier', erpTable: 'Vendor (vendor)', score: 0.98 },
      { entity: 'opo:Invoice', erpTable: 'Invoice (invoice)', score: 1.00 },
      { entity: 'opo:Order', erpTable: 'Sales Order (salesorder)', score: 0.95 },
      { entity: 'opo:Payment', erpTable: 'Customer Payment', score: 0.90 }
    ]
  },
  {
    slug: 'microsoft-dynamics-365',
    name: 'Microsoft Dynamics 365',
    vendor: 'Microsoft Corp',
    version: 'Finance & Operations (OData v4)',
    apiType: 'OData',
    authMethod: 'OAuth2',
    opoCompatibility: 'full',
    tier1Coverage: 90,
    tier2Coverage: 75,
    docsUrl: 'https://learn.microsoft.com/en-us/dynamics365/',
    region: ['US', 'EU', 'APAC'],
    deploymentModel: 'cloud',
    difficulty: 'medium',
    estimatedSetupMinutes: 25,
    knownLimitations: [
      'Dataverse OAuth tokens must be periodically refreshed via Azure AD app certificates',
      'Pagination thresholds capped at 5000 records per page'
    ],
    guideFile: 'microsoft-dynamics-365.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'accounts / contacts', score: 0.90 },
      { entity: 'opo:Customer', erpTable: 'accounts (reltype=cust)', score: 0.95 },
      { entity: 'opo:Supplier', erpTable: 'accounts (reltype=vend)', score: 0.95 },
      { entity: 'opo:Invoice', erpTable: 'msdyn_projectinvoice', score: 0.92 },
      { entity: 'opo:Order', erpTable: 'SalesTable / SalesLine', score: 0.95 },
      { entity: 'opo:Payment', erpTable: 'LedgerJournalTrans', score: 0.88 }
    ]
  },
  {
    slug: 'odoo-17',
    name: 'Odoo 17',
    vendor: 'Odoo S.A.',
    version: '17.0 Community & Enterprise',
    apiType: 'JSON-RPC',
    authMethod: 'APIKey',
    opoCompatibility: 'full',
    tier1Coverage: 100,
    tier2Coverage: 90,
    docsUrl: 'https://www.odoo.com/documentation/17.0/',
    region: ['EU', 'US', 'LATAM', 'AFRICA'],
    deploymentModel: 'hybrid',
    difficulty: 'low',
    estimatedSetupMinutes: 15,
    knownLimitations: [
      'JSON-RPC call parameters must use exact position parameters for XML-RPC core compatibility',
      'API Key must belong to a user with full write access in multi-company environments'
    ],
    guideFile: 'odoo-17.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'res.partner', score: 0.96 },
      { entity: 'opo:Customer', erpTable: 'res.partner (customer_rank > 0)', score: 0.98 },
      { entity: 'opo:Supplier', erpTable: 'res.partner (supplier_rank > 0)', score: 0.98 },
      { entity: 'opo:Invoice', erpTable: 'account.move (type=out/in_invoice)', score: 1.00 },
      { entity: 'opo:Order', erpTable: 'sale.order / purchase.order', score: 0.95 },
      { entity: 'opo:Payment', erpTable: 'account.payment', score: 0.92 }
    ]
  },
  {
    slug: 'infor-cloudsuite',
    name: 'Infor CloudSuite',
    vendor: 'Infor Inc.',
    version: 'ION API Gateway 2024',
    apiType: 'ION',
    authMethod: 'OAuth2',
    opoCompatibility: 'partial',
    tier1Coverage: 80,
    tier2Coverage: 60,
    docsUrl: 'https://docs.infor.com',
    region: ['US', 'EU', 'APAC'],
    deploymentModel: 'cloud',
    difficulty: 'high',
    estimatedSetupMinutes: 40,
    knownLimitations: [
      'Highly fragmented schemas across Infor product lines (M3, LN, SyteLine)',
      'ION API Gateway requires a client-side config registry bundle download'
    ],
    guideFile: 'infor-cloudsuite.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'ION Document (TradingPartner)', score: 0.85 },
      { entity: 'opo:Customer', erpTable: 'CustomerRecord / LN-tccom110', score: 0.90 },
      { entity: 'opo:Supplier', erpTable: 'VendorRecord / LN-tccom120', score: 0.90 },
      { entity: 'opo:Invoice', erpTable: 'SalesInvoice / LN-tfacr200', score: 0.85 },
      { entity: 'opo:Order', erpTable: 'SalesOrder / LN-tdsls400', score: 0.92 },
      { entity: 'opo:Payment', erpTable: 'FinanceReceipt', score: 0.80 }
    ]
  },
  {
    slug: 'workday',
    name: 'Workday',
    vendor: 'Workday, Inc.',
    version: 'v42 Enterprise Reports',
    apiType: 'REST',
    authMethod: 'OAuth2',
    opoCompatibility: 'partial',
    tier1Coverage: 75,
    tier2Coverage: 85,
    docsUrl: 'https://community.workday.com',
    region: ['Global', 'US', 'EU'],
    deploymentModel: 'cloud',
    difficulty: 'high',
    estimatedSetupMinutes: 35,
    knownLimitations: [
      'Write APIs are highly restricted; optimal approach uses custom RAAS (Report-as-a-Service)',
      'Multi-factor authentication mandatory on all service accounts'
    ],
    guideFile: 'workday.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'Legal Entity', score: 0.88 },
      { entity: 'opo:Employee', erpTable: 'Worker / Employee Object', score: 0.99 },
      { entity: 'opo:Supplier', erpTable: 'Supplier Object', score: 0.90 },
      { entity: 'opo:Invoice', erpTable: 'Supplier Invoice Object', score: 0.82 },
      { entity: 'opo:CostCenter', erpTable: 'Cost Center Reference', score: 0.95 }
    ]
  },
  {
    slug: 'sage-x3',
    name: 'Sage X3',
    vendor: 'Sage Group plc',
    version: 'Syracuse Server v12',
    apiType: 'REST',
    authMethod: 'BasicAuth',
    opoCompatibility: 'partial',
    tier1Coverage: 85,
    tier2Coverage: 70,
    docsUrl: 'https://developer.sage.com',
    region: ['EU', 'UK', 'LATAM', 'AFRICA'],
    deploymentModel: 'onpremise',
    difficulty: 'medium',
    estimatedSetupMinutes: 30,
    knownLimitations: [
      'Classic interface tables differ significantly from the modern Syracuse web service APIs',
      'No native support for automated CORS headers'
    ],
    guideFile: 'sage-x3.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'BPCUST / BPVEND', score: 0.88 },
      { entity: 'opo:Customer', erpTable: 'BPCUSTOMER (BPCUST)', score: 0.96 },
      { entity: 'opo:Supplier', erpTable: 'BPSUPPLIER (BPVEND)', score: 0.96 },
      { entity: 'opo:Invoice', erpTable: 'SINVOICE / PINVOICE', score: 0.94 },
      { entity: 'opo:Order', erpTable: 'SORDER / PORDER', score: 0.95 },
      { entity: 'opo:Payment', erpTable: 'PAYMENT_RECEIPT', score: 0.85 }
    ]
  },
  {
    slug: 'totvs-protheus',
    name: 'TOTVS Protheus',
    vendor: 'TOTVS S.A.',
    version: 'v12.1.2310 Advanced Framework',
    apiType: 'REST',
    authMethod: 'BasicAuth',
    opoCompatibility: 'full',
    tier1Coverage: 95,
    tier2Coverage: 80,
    docsUrl: 'https://tdn.totvs.com',
    region: ['Brazil', 'LATAM'],
    deploymentModel: 'hybrid',
    difficulty: 'medium',
    estimatedSetupMinutes: 30,
    knownLimitations: [
      'Requires NF-e localized billing layout compliance for Brazil/LATAM electronic taxes',
      'AdvPL code compiles required for custom standard endpoint alterations'
    ],
    guideFile: 'totvs-protheus.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'SA1 (Clientes) / SA2 (Fornecedores)', score: 0.94 },
      { entity: 'opo:Customer', erpTable: 'SA1 (Cadastro de Clientes)', score: 0.98 },
      { entity: 'opo:Supplier', erpTable: 'SA2 (Cadastro de Fornecedores)', score: 0.98 },
      { entity: 'opo:Invoice', erpTable: 'SF2 (NF Saída) / SF1 (NF Entrada)', score: 0.96 },
      { entity: 'opo:Order', erpTable: 'SC5 (Pedidos Venda) / SC7 (Compras)', score: 0.95 },
      { entity: 'opo:Payment', erpTable: 'SE5 (Movimentação Bancária)', score: 0.90 }
    ]
  },
  {
    slug: 'tango-gestion',
    name: 'Tango Gestión',
    vendor: 'Axoft Argentina',
    version: 'Delta v23 Desktop SQL',
    apiType: 'ODBC',
    authMethod: 'BasicAuth',
    opoCompatibility: 'community',
    tier1Coverage: 70,
    tier2Coverage: 50,
    docsUrl: 'https://vimeo.com/tango',
    region: ['Argentina', 'LATAM'],
    deploymentModel: 'onpremise',
    difficulty: 'high',
    estimatedSetupMinutes: 40,
    knownLimitations: [
      'No default cloud-hosted public REST API exists. Mappings bypass gateway and query SQL server via OBDC',
      'Heavy reliant on local server installations and CUIT taxes in Argentina'
    ],
    guideFile: 'tango-gestion.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'Clientes / Proveedores databases', score: 0.85 },
      { entity: 'opo:Customer', erpTable: 'Clientes General (GVA14)', score: 0.92 },
      { entity: 'opo:Supplier', erpTable: 'Proveedores General (CPA01)', score: 0.92 },
      { entity: 'opo:Invoice', erpTable: 'Facturas cabecera (GVA12)', score: 0.95 },
      { entity: 'opo:Order', erpTable: 'Pedidos de Venta (GVA03)', score: 0.90 },
      { entity: 'opo:Payment', erpTable: 'Cobros / Recibos directos', score: 0.80 }
    ]
  },
  {
    slug: 'quickbooks-online',
    name: 'QuickBooks Online',
    vendor: 'Intuit Inc.',
    version: 'v3 Developer Platform REST',
    apiType: 'REST',
    authMethod: 'OAuth2',
    opoCompatibility: 'full',
    tier1Coverage: 100,
    tier2Coverage: 90,
    docsUrl: 'https://developer.intuit.com',
    region: ['US', 'EU', 'Global'],
    deploymentModel: 'cloud',
    difficulty: 'low',
    estimatedSetupMinutes: 15,
    knownLimitations: [
      'API is highly throttled at 500 requests per minute per company',
      'Must use distinct sandbox organization accounts for developer playground testing'
    ],
    guideFile: 'quickbooks-online.md',
    nativeMappings: [
      { entity: 'opo:Party', erpTable: 'Customer / Vendor entities', score: 0.90 },
      { entity: 'opo:Customer', erpTable: 'Customer Entity', score: 0.98 },
      { entity: 'opo:Supplier', erpTable: 'Vendor Entity', score: 0.98 },
      { entity: 'opo:Invoice', erpTable: 'Invoice Entity', score: 1.00 },
      { entity: 'opo:Order', erpTable: 'Estimate / SalesOrder / PurchaseOrder', score: 0.94 },
      { entity: 'opo:Payment', erpTable: 'Payment / BillPayment Entities', score: 0.95 }
    ]
  }
];

export function getAllGuides(): ERPGuide[] {
  return ERP_GUIDES;
}

export function getGuideBySlug(slug: string): ERPGuide | undefined {
  return ERP_GUIDES.find((g) => g.slug === slug);
}
