/**
 * Open Protocol ONTOLOGY (OPO) - Entities Data Module
 * Licensed under the Apache License, version 2.0
 */

export interface OPOEntity {
  name: string;
  tier: 1 | 2 | 3;
  description: string;
  aliases: string[];
  erpMappings: Record<string, string>;
  aiHints: string[];
  distinguishableFrom: string[];
  properties: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  rawSchema: string;
}

const ENTITIES_MAPPING: Record<string, OPOEntity> = {
  Party: {
    name: 'Party',
    tier: 1,
    description: 'A legal entity, natural person, or organizational division capable of entering into agreements, incurring obligations, or participating in transactions.',
    aliases: ["Party", "Tercero", "Parceiro", "Entidad", "BUT000", "res.partner", "SA1", "SA2", "Legal Entity", "Contraparte", "Ente"],
    erpMappings: {
      SAP_S4: "BUT000 (Business Partner Master Data)",
      Odoo: "res.partner",
      Protheus: "SA1 (Clientes) / SA2 (Fornecedores)",
      Tango: "Clientes / Proveedores databases",
      Dynamics_365: "Account / Contact entities",
      NetSuite: "Customer / Vendor / Entity records",
      QuickBooks: "Customer / Vendor lists",
      Salesforce: "Account / Contact"
    },
    aiHints: [
      "Who is the counterparty of this transaction?",
      "Find the base entity detail for this legal record.",
      "Show me the business partner information.",
      "Lookup third-party registries.",
      "Identify corporate or individual legal counterparties."
    ],
    distinguishableFrom: ["Customer", "Supplier", "Employee"],
    properties: [
      { name: 'id', type: 'string', description: 'Unique identifier for the party', required: true },
      { name: 'legalName', type: 'string', description: 'Registered standard corporate or personal legal name', required: true },
      { name: 'tradeName', type: 'string', description: 'Commercial brand or DBA name', required: false },
      { name: 'taxId', type: 'object', description: 'Tax identity registration structure', required: true },
      { name: 'address', type: 'object', description: 'Primary physical post coordinates', required: false },
      { name: 'email', type: 'string', description: 'Primary contact email address', required: false },
      { name: 'phone', type: 'string', description: 'Primary telephone number', required: false },
      { name: 'type', type: 'string (INDIVIDUAL | ORGANIZATION)', description: 'Legal class of entity', required: false }
    ],
    rawSchema: `{
  "$id": "https://openontology.vercel.app/ontology/schemas/Party.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Party",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "legalName": { "type": "string" },
    "tradeName": { "type": "string" },
    "email": { "type": "string" }
  },
  "required": ["id", "legalName"]
}`
  },
  Customer: {
    name: 'Customer',
    tier: 1,
    description: 'An entity representing a buyer, client, or consumer that purchases goods, services, or contracts from the business.',
    aliases: ["Customer", "Cliente", "KNA1", "res.partner", "SA1", "Client", "Account Receivable", "Deudor", "Comprador", "Fregues"],
    erpMappings: {
      SAP_S4: "KNA1 (General Data) / KNVV (Sales Data)",
      Odoo: "res.partner where customer_rank > 0",
      Protheus: "SA1 (Cadastro de Clientes)",
      Tango: "Clientes (GVA14)",
      Dynamics_365: "Account with RelationshipType Customer",
      NetSuite: "Customer Record (customer)",
      QuickBooks: "Customer Entity",
      Salesforce: "Account (RecordType Customer)"
    },
    aiHints: [
      "Who owes us money?",
      "Find customer billing information.",
      "Lookup client contact details.",
      "Retrieve KNA1 record for a specific business.",
      "Get buyer profile for the sales team."
    ],
    distinguishableFrom: ["Party", "Supplier"],
    properties: [
      { name: 'id', type: 'string', description: 'Unique customer identifier', required: true },
      { name: 'partyId', type: 'string', description: 'Reference ID pointing to core Party records', required: true },
      { name: 'creditLimit', type: 'Money', description: 'Maximum approved outstanding credit allowance', required: false },
      { name: 'outstandingBalance', type: 'Money', description: 'Current due accounts receivable balance', required: true },
      { name: 'paymentTerms', type: 'string', description: 'Standard billing duration agreement details', required: false },
      { name: 'active', type: 'boolean', description: 'Account status state indicators', required: false }
    ],
    rawSchema: `{
  "$id": "https://openontology.vercel.app/ontology/schemas/Customer.json",
  "title": "Customer",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "partyId": { "type": "string" },
    "outstandingBalance": { "$ref": "#/$defs/Money" }
  },
  "required": ["id", "partyId", "outstandingBalance"]
}`
  },
  Supplier: {
    name: 'Supplier',
    tier: 1,
    description: 'An entity representing a vendor, merchant, or service provider that supplies materials or services to the enterprise.',
    aliases: ["Supplier", "Vendor", "Proveedor", "Fornecedor", "LFA1", "Acreedor", "Credor", "SA2", "res.partner", "Abastecedor"],
    erpMappings: {
      SAP_S4: "LFA1 (General Vendor) / LFM1 (Purchasing Org)",
      Odoo: "res.partner where supplier_rank > 0",
      Protheus: "SA2 (Cadastro de Fornecedores)",
      Tango: "Proveedores (CP01)",
      Dynamics_365: "Account with RelationshipType Vendor",
      NetSuite: "Vendor Record (vendor)",
      QuickBooks: "Vendor Entity",
      Salesforce: "Account (RecordType Partner or Supplier)"
    },
    aiHints: [
      "Who is the vendor supplying raw materials?",
      "Show me our accounts payable records for suppliers.",
      "Lookup supplier payment terms.",
      "Find LFA1 database records.",
      "Which supplier provides this electronic part?"
    ],
    distinguishableFrom: ["Party", "Customer"],
    properties: [
      { name: 'id', type: 'string', description: 'Vendor accounts primary index', required: true },
      { name: 'partyId', type: 'string', description: 'Reference to core Party identifiers', required: true },
      { name: 'paymentTerms', type: 'string', description: 'Agreed settlement period parameters', required: false },
      { name: 'purchaseBalance', type: 'Money', description: 'Current outstanding debt values payable', required: true }
    ],
    rawSchema: `{
  "$id": "https://openontology.vercel.app/ontology/schemas/Supplier.json",
  "title": "Supplier",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "partyId": { "type": "string" },
    "purchaseBalance": { "$ref": "#/$defs/Money" }
  },
  "required": ["id", "partyId", "purchaseBalance"]
}`
  },
  Employee: {
    name: 'Employee',
    tier: 1,
    description: 'An individual hired by the organization to perform services in exchange for salary or hourly compensation.',
    aliases: ["Employee", "Empleado", "Empregado", "SRA", "PA0002", "hr.employee", "Colaborador", "Staff", "Funcionario", "Personal"],
    erpMappings: {
      SAP_S4: "PA0002 / PA0008 (HCM Infotypes)",
      Odoo: "hr.employee",
      Protheus: "SRA (Cadastro de Funcionarios)",
      Tango: "Sueldos / Legajos database",
      Dynamics_365: "mserp_hcmworker",
      NetSuite: "Employee Record (employee)",
      QuickBooks: "Employee Entity",
      Salesforce: "User / Contact HR fields"
    },
    aiHints: [
      "List the employees in our system.",
      "Lookup worker compensation status.",
      "Get full employee record for payroll calculation.",
      "Verify SRA database parameters.",
      "Find hr.employee record associated with this team member."
    ],
    distinguishableFrom: ["Party"],
    properties: [
      { name: 'id', type: 'string', description: 'Internal payroll registration code', required: true },
      { name: 'partyId', type: 'string', description: 'Core party record identifier reference', required: true },
      { name: 'role', type: 'string', description: 'Hired position or job description title', required: true },
      { name: 'status', type: 'string', description: 'Active work classification state details', required: true }
    ],
    rawSchema: `{}`
  },
  Product: {
    name: 'Product',
    tier: 1,
    description: 'A physical or digital tangible item produced, stocked, transacted, or sold by the organization.',
    aliases: ["Product", "Producto", "Produto", "SKU", "MARA", "product.template", "SB1", "Item", "Mercaderia", "Peca"],
    erpMappings: {
      SAP_S4: "MARA (General Material Data) / MAKT (Material Description)",
      Odoo: "product.product / product.template",
      Protheus: "SB1 (Cadastro de Produtos)",
      Tango: "Articulos / Productos (STA11)",
      Dynamics_365: "EcoResProduct / InventTable",
      NetSuite: "Inventory Item Record (inventoryitem)",
      QuickBooks: "Item (Inventory type)",
      Salesforce: "Product2"
    },
    aiHints: [
      "Check product catalogs.",
      "Lookup item SKU details.",
      "Show me item dimensions or UPC/EAN.",
      "Verify product list or MARA table rows.",
      "Get description for SB1 item."
    ],
    distinguishableFrom: ["Service"],
    properties: [
      { name: 'id', type: 'string', description: 'Primary catalog ID index', required: true },
      { name: 'sku', type: 'string', description: 'Unique Stock Keeping Unit barcode code', required: true },
      { name: 'name', type: 'string', description: 'Commercial product title', required: true },
      { name: 'unitOfMeasure', type: 'string', description: 'Standard sales unit metric', required: true }
    ],
    rawSchema: `{}`
  },
  Service: {
    name: 'Service',
    tier: 1,
    description: 'An intangible task, professional consultation, or labor-based action rendered to a customer or acquired from a supplier.',
    aliases: ["Service", "Servicio", "Servico", "ASMD", "product.template (Service type)", "SB1 (Tipo SV)", "Task", "Prestacion", "Labor"],
    erpMappings: {
      SAP_S4: "ASMD (Service Master Data)",
      Odoo: "product.template with type='service'",
      Protheus: "SB1 (Cadastro de Produtos with B1_TIPO='SV')",
      Tango: "Articulos / Servicios (STA11 with type SV)",
      Dynamics_365: "Product with ProductType Service",
      NetSuite: "Service Item Record (serviceitem)",
      QuickBooks: "Item (Service type)",
      Salesforce: "Product2 with IsService=true"
    },
    aiHints: [
      "Identify intangible services rendered.",
      "Show me the service code list.",
      "Check service fee profiles.",
      "Lookup ASMD service master database entries.",
      "Is this transaction a material product or a service dispatch?"
    ],
    distinguishableFrom: ["Product"],
    properties: [
      { name: 'id', type: 'string', description: 'System service identifier', required: true },
      { name: 'code', type: 'string', description: 'Internal billing ledger code', required: true },
      { name: 'name', type: 'string', description: 'Commercial title for the professional service', required: true }
    ],
    rawSchema: `{}`
  },
  Invoice: {
    name: 'Invoice',
    tier: 1,
    description: 'A legal accounting invoice documenting supplied assets, tax breakdowns, currencies, and due payments.',
    aliases: ["Invoice", "Factura", "Nota Fiscal", "NF-e", "VBRK", "account.move", "SF2", "SF1", "Billing Document", "Fatura", "Comprobante"],
    erpMappings: {
      SAP_S4: "VBRK (Billing Document Header) / VBRP (Items), BKPF (Financial Header) / BSEG (Items)",
      Odoo: "account.move (type in 'out_invoice', 'in_invoice')",
      Protheus: "SF2 (Notas Fiscais de Saída) / SFT (Livros Fiscais)",
      Tango: "Facturas (GVA12)",
      Dynamics_365: "CustInvoiceJour / CustInvoiceTrans",
      NetSuite: "Invoice Record (invoice) / Vendor Bill (vendorbill)",
      QuickBooks: "Invoice Entity",
      Salesforce: "Invoice (Sales Cloud)"
    },
    aiHints: [
      "Find sales invoices.",
      "Lookup due date and pending amount for bills.",
      "Show me line items for invoice SF2.",
      "Query account.move for unpaid values.",
      "Verify tax values for this NF-e."
    ],
    distinguishableFrom: ["Order", "TaxDocument"],
    properties: [
      { name: 'id', type: 'string', description: 'Unique digital ledger invoice reference', required: true },
      { name: 'number', type: 'string', description: 'Legal document sequential prefix number', required: true },
      { name: 'issueDate', type: 'string', description: 'Date the invoice was printed and registered', required: true },
      { name: 'dueDate', type: 'string', description: 'Mandatory final financial payment date limit', required: true },
      { name: 'grandTotal', type: 'Money', description: 'Total outstanding monetary invoice value', required: true }
    ],
    rawSchema: `{}`
  },
  Order: {
    name: 'Order',
    tier: 1,
    description: 'An agreement for purchasing or sales delivery describing requested products, quantities, prices, and expected delivery dates.',
    aliases: ["Order", "Pedido", "Ordem", "VBAK", "sale.order", "purchase.order", "SC5", "SC6", "Sales Order", "Purchase Order", "Peticion"],
    erpMappings: {
      SAP_S4: "VBAK (Sales Order Header) / VBAP (Items), EKKO (Purchase Order) / EKPO (Items)",
      Odoo: "sale.order / purchase.order with sale.order.line / purchase.order.line",
      Protheus: "SC5 (Pedidos de Venda) / SC7 (Pedidos de Compra)",
      Tango: "Pedidos de Venta (GVA03) / Compras (CPA03)",
      Dynamics_365: "SalesTable / SalesLine, PurchTable / PurchLine",
      NetSuite: "Sales Order (salesorder) / Purchase Order (purchaseorder)",
      QuickBooks: "Estimate / SalesOrder / PurchaseOrder Entities",
      Salesforce: "Order / OrderItem"
    },
    aiHints: [
      "Lookup pending order summaries.",
      "Verify order line items and purchase requests.",
      "Show me sale.order status in Odoo.",
      "Retrieve client request details from VBAK.",
      "Check SC5 order quantities."
    ],
    distinguishableFrom: ["Invoice", "Contract"],
    properties: [
      { name: 'id', type: 'string', description: 'Internal deal identification record', required: true },
      { name: 'number', type: 'string', description: 'Commercial order serial number', required: true },
      { name: 'totalAmount', type: 'Money', description: 'Gross estimated purchase volume total value', required: true }
    ],
    rawSchema: `{}`
  },
  Contract: {
    name: 'Contract',
    tier: 1,
    description: 'A binding legal agreement between the organization and a counterparty specifying operational conditions, timelines, and financial clauses.',
    aliases: ["Contract", "Contrato", "Convenio", "Acuerdo", "VEDA", "contract.contract", "SE8", "Lease", "Legal Agreement", "Pacto", "Termo"],
    erpMappings: {
      SAP_S4: "VEDK (Contract Header) / VEDA (Contract Data Detail)",
      Odoo: "account.analytic.account / hr.contract",
      Protheus: "SE8 (Contratos de Parceria) / CN8 (Medição de Contratos)",
      Tango: "Contratos / Abonos database",
      Dynamics_365: "SalesContract / PurchaseContract",
      NetSuite: "Contract Record (contract)",
      QuickBooks: "Contract Entity",
      Salesforce: "Contract"
    },
    aiHints: [
      "Lookup active supplier contracts.",
      "Show me the contractual duration or expiration date.",
      "Check rental or service agreements.",
      "Is there a signed agreement in the SE8 table?",
      "Show me contract.contract terms."
    ],
    distinguishableFrom: ["Order", "Guarantee"],
    properties: [
      { name: 'id', type: 'string', description: 'Legal document identifier index', required: true },
      { name: 'title', type: 'string', description: 'Descriptive title of agreement', required: true },
      { name: 'startDate', type: 'string', description: 'Effective activation date', required: true },
      { name: 'status', type: 'string', description: 'Status state of the contract', required: true }
    ],
    rawSchema: `{}`
  },
  Payment: {
    name: 'Payment',
    tier: 1,
    description: 'An execution of a monetary transaction, representing funds cleared for an invoice or external account balance.',
    aliases: ["Payment", "Pago", "Pagamento", "Recibo", "Cobro", "PAYR", "account.payment", "SE1", "SE5", "Transaction", "Liquidador", "Giro"],
    erpMappings: {
      SAP_S4: "PAYR (Payment Medium File) / REGUP (Processed items)",
      Odoo: "account.payment",
      Protheus: "SE5 (Movimentação Bancária) / SE1 (Contas a Receber recs) / SE2 (Contas a Pagar recs)",
      Tango: "Cobros (GVA12) / Pagos (CPA04)",
      Dynamics_365: "CustTransOpen / LedgerJournalTrans",
      NetSuite: "Customer Payment (customerpayment) / Vendor Payment (vendorpayment)",
      QuickBooks: "Payment / BillPayment Entities",
      Salesforce: "Payment (Salesplace)"
    },
    aiHints: [
      "Check paid invoices matching.",
      "Lookup bank transaction identifiers.",
      "List payment collections for this partner.",
      "Find account.payment records in Odoo.",
      "Verify receipt SE5 transaction dates."
    ],
    distinguishableFrom: ["Invoice"],
    properties: [
      { name: 'id', type: 'string', description: 'Unique payment receipt reference', required: true },
      { name: 'paymentDate', type: 'string', description: 'Bank clearance date', required: true },
      { name: 'amount', type: 'Money', description: 'Total cash values posted', required: true }
    ],
    rawSchema: `{}`
  },
  CreditAccount: {
    name: 'CreditAccount',
    tier: 1,
    description: 'An administrative ledger tracking credit lines, current utilization, and credit availability for customers and counterparties.',
    aliases: ["CreditAccount", "Cuenta de Credito", "Conta de Credito", "Línea de Crédito", "UKMBP_CMS", "credit.account", "SE1 (Credit)", "Credit Line", "Subcuenta", "Limite"],
    erpMappings: {
      SAP_S4: "UKMBP_CMS_SGM (Credit Segment Partner Data)",
      Odoo: "res.partner credit limit properties",
      Protheus: "SE1 (Contas a Receber, credit limits properties)",
      Tango: "Cuentas Corrientes (GVA14)",
      Dynamics_365: "CustCreditLimitTable",
      NetSuite: "Customer Finance settings / credit limits",
      QuickBooks: "Customer Credit Profile",
      Salesforce: "Billing Account Credit fields"
    },
    aiHints: [
      "Find how much credit is available for this client.",
      "Show me the credit account utilization level.",
      "Lookup credit limits and billing records.",
      "Is the client account flagged for credit freeze?",
      "Verify UKMBP_CMS financial segments."
    ],
    distinguishableFrom: ["Customer", "CreditRisk"],
    properties: [
      { name: 'id', type: 'string', description: 'Internal credit card or folio reference', required: true },
      { name: 'partyId', type: 'string', description: 'Core party record identifier reference', required: true },
      { name: 'authorizedLimit', type: 'Money', description: 'Maximum approved credit boundary limit', required: true },
      { name: 'utilizedBalance', type: 'Money', description: 'Used credit balance currently due', required: true }
    ],
    rawSchema: `{}`
  },
  Inventory: {
    name: 'Inventory',
    tier: 1,
    description: 'Stock inventory records capturing item quantities, reserved segments, and location warehouses.',
    aliases: ["Inventory", "Inventario", "Estoques", "Stock", "MARD", "stock.quant", "SB2", "Existencia", "Fisico", "Saldo"],
    erpMappings: {
      SAP_S4: "MARD (Material Storage Location Data) / MBEW (Material Valuation)",
      Odoo: "stock.quant / stock.inventory",
      Protheus: "SB2 (Saldo Físico e Financeiro)",
      Tango: "Articulos / Saldos (STA19)",
      Dynamics_365: "InventSum",
      NetSuite: "Inventory Balance (inventorybalance)",
      QuickBooks: "ItemInventory Entity",
      Salesforce: "ProductItem"
    },
    aiHints: [
      "What is the stock level for this SKU?",
      "Lookup item reserves and physical quantities on hand.",
      "Verify product storage details or MARD data.",
      "Query stock.quant records in Odoo.",
      "Find available product stock in SB2."
    ],
    distinguishableFrom: ["Warehouse", "Product"],
    properties: [
      { name: 'id', type: 'string', description: 'Unique stock balance row index', required: true },
      { name: 'productId', type: 'string', description: 'Associated product item record reference', required: true },
      { name: 'quantityOnHand', type: 'number', description: 'Physical items stored at warehouses', required: true }
    ],
    rawSchema: `{}`
  },
  PriceList: {
    name: 'PriceList',
    tier: 1,
    description: 'Standard list or matrix of product prices, applicable client groups, discount factors, and activation dates.',
    aliases: ["PriceList", "Lista de Precios", "Lista de Precos", "Price Book", "A018", "product.pricelist", "DA0", "Preciario", "Price Matrix", "Tarifario"],
    erpMappings: {
      SAP_S4: "A018 (Material Price Records) / KONP (Pricing Conditions)",
      Odoo: "product.pricelist / product.pricelist.item",
      Protheus: "DA0 (Tabela de Preços) / DA1 (Itens da Tabela de Preço)",
      Tango: "Listas de Precios (GVA17)",
      Dynamics_365: "PriceDiscTable",
      NetSuite: "Price Level (pricelevel) / Price Book",
      QuickBooks: "PriceLevel Entity",
      Salesforce: "Pricebook2 / PricebookEntry"
    },
    aiHints: [
      "What is the price of this product on the wholesale list?",
      "Lookup active price levels or discounts.",
      "Show me product prices in DA0 Protheus database.",
      "Verify product.pricelist parameters.",
      "Find prices mapped to this client segment."
    ],
    distinguishableFrom: ["Product"],
    properties: [
      { name: 'id', type: 'string', description: 'Price book master index', required: true },
      { name: 'name', type: 'string', description: 'Descriptive title of price matrix', required: true },
      { name: 'currency', type: 'string', description: 'Monetary standard currency code used', required: true }
    ],
    rawSchema: `{}`
  },
  CreditRisk: {
    name: 'CreditRisk',
    tier: 2,
    description: 'Financial credit risk assessment indexes registering profile ratings, default metrics, and score categories.',
    aliases: ["CreditRisk", "Riesgo de Credito", "Risco de Credito", "Scoring", "UKM_SGM", "credit.risk", "SA1 (Risk Assessment)", "FICO Score", "Calificacion", "Score"],
    erpMappings: {
      SAP_S4: "UKM_SGM (Credit Management Account Data)",
      Odoo: "res.partner credit risk indicators",
      Protheus: "SA1 (A1_CONTA / credit rating profiles)",
      Tango: "Clientes risk metrics",
      Dynamics_365: "CustCreditMaxLimit",
      NetSuite: "Entity Risk assessment profile fields",
      QuickBooks: "Customer financial flags",
      Salesforce: "Account Credit rating attributes"
    },
    aiHints: [
      "What is the credit risk class for this company?",
      "Lookup credit risk indicators.",
      "Verify corporate risk rating levels.",
      "Query UKM_SGM credit segments.",
      "Show me payment defaults or risk trends for this partner."
    ],
    distinguishableFrom: ["CreditAccount", "PaymentBehavior"],
    properties: [
      { name: 'id', type: 'string', description: 'Unique credit rating profile ID', required: true },
      { name: 'partyId', type: 'string', description: 'Target business partner record reference', required: true },
      { name: 'riskLevel', type: 'string', description: 'Assessed categorization (LOW | MEDIUM | HIGH | CRITICAL)', required: true }
    ],
    rawSchema: `{}`
  },
  DebtObligation: {
    name: 'DebtObligation',
    tier: 2,
    description: 'Debt obligations, financial loans, or security liabilities held by the enterprise or counterparties.',
    aliases: ["DebtObligation", "Obligacion de Deuda", "Obrigacao de Divida", "Debenture", "BSEG (Loans)", "account.loan", "SE2 (Debt)", "Prestamo", "Emprestimo", "Debito", "Mutuo"],
    erpMappings: {
      SAP_S4: "BKPF (Financial Header) / BSEG (with posting keys for liabilities or loans), T001 (Company code parameters)",
      Odoo: "account.loan / account.move for long-term liabilities",
      Protheus: "SE2 (Contas a Pagar with loan indicator B2_TIPO)",
      Tango: "Prestamos / Pasivos database",
      Dynamics_365: "LedgerJournalTrans",
      NetSuite: "Term Loan Records / Liability accounts",
      QuickBooks: "Loan / LongTermLiability accounts",
      Salesforce: "Financial Deal / Asset Liability fields"
    },
    aiHints: [
      "What loans are outstanding?",
      "Lookup long-term debt liabilities.",
      "Verify repayment rates or financial leverage.",
      "Find debt commitments or BSEG postings.",
      "Check accounts payable loans in SE2."
    ],
    distinguishableFrom: ["Invoice", "FinancialExposure"],
    properties: [
      { name: 'id', type: 'string', description: 'Liability tracking ledger ID', required: true },
      { name: 'partyId', type: 'string', description: 'Debtor or lender party reference', required: true },
      { name: 'principal', type: 'Money', description: 'Initial loaned debt capital principal value', required: true }
    ],
    rawSchema: `{}`
  },
  Guarantee: {
    name: 'Guarantee',
    tier: 2,
    description: 'Financial warrants, third-party guarantors, or collaterals backing transactions and invoices.',
    aliases: ["Guarantee", "Garantia", "Fianza", "Aval", "Warrant", "Collateral", "BSEG (Guarantees)", "account.guarantee", "SE1 (Avals)", "Fiel", "Caucion", "Duplicata"],
    erpMappings: {
      SAP_S4: "BKPF / BSEG (with special G/L indicators for guarantees)",
      Odoo: "account.guarantee / res.partner bank.guarantees",
      Protheus: "SE1 (Contas a Receber, collateral records) / CN8 (Contracts collateral)",
      Tango: "Garantias / Avales database",
      Dynamics_365: "BankGuaranteeTable",
      NetSuite: "Security Deposit / Collateral attributes",
      QuickBooks: "Guarantor Record",
      Salesforce: "Financial Guarantee / Asset Collateral"
    },
    aiHints: [
      "Does this contract have a bank guarantee?",
      "Lookup collateral warrants.",
      "Verify guarantor information or aval status.",
      "Find commercial guarantees.",
      "Check contract CN8 collateral records."
    ],
    distinguishableFrom: ["Contract"],
    properties: [
      { name: 'id', type: 'string', description: 'Guarantee folder serial index', required: true },
      { name: 'partyId', type: 'string', description: 'Responsible partner guarantor reference', required: true },
      { name: 'value', type: 'Money', description: 'Total financial amount collateral values backed', required: true }
    ],
    rawSchema: `{}`
  },
  FinancialExposure: {
    name: 'FinancialExposure',
    tier: 2,
    description: 'Aggregate financial metrics representing active, credit-weighted exposures, open orders and bill statuses for a counterparty.',
    aliases: ["FinancialExposure", "Exposicion Financiera", "Exposicao Financeira", "Exposure", "UKM_TOTALS", "res.partner exposure", "SE1/SE2 totals", "Riesgo comercial", "Outstanding Credit", "Risco"],
    erpMappings: {
      SAP_S4: "UKM_SGM (Credit Management exposure sum)",
      Odoo: "res.partner risk exposure metrics",
      Protheus: "SE1 / SE2 credit-outstanding formulas",
      Tango: "Clientes balance (GVA14 totals)",
      Dynamics_365: "CustCreditLimitTotals",
      NetSuite: "Customer Balance + Open Orders tally",
      QuickBooks: "Customer Outstanding balance totals",
      Salesforce: "Account Billing Exposure Rollups"
    },
    aiHints: [
      "What is our total financial exposure to this client?",
      "Lookup credit exposure or total liability bounds.",
      "Verify open sales order tallies or outstanding debts.",
      "Compare total balances and credit risks.",
      "Find commercial exposure from UKM_TOTALS."
    ],
    distinguishableFrom: ["CreditAccount", "DebtObligation"],
    properties: [
      { name: 'id', type: 'string', description: 'Exposure calculation ledger ID', required: true },
      { name: 'partyId', type: 'string', description: 'Associated counterparty reference', required: true },
      { name: 'totalExposure', type: 'Money', description: 'Aggregated live outstanding risk sum values', required: true }
    ],
    rawSchema: `{}`
  },
  PaymentBehavior: {
    name: 'PaymentBehavior',
    tier: 2,
    description: 'Historical metrics capturing a partner\'s credit-payment behavior, average delays, dunning stages, and collection histories.',
    aliases: ["PaymentBehavior", "Comportamiento de Pago", "Comportamento de Pagamento", "Dunning", "UKM_DSO", "credit.history", "SA1 (Dunning Index)", "Days Late", "Atrasos", "Mora", "Prazo medio"],
    erpMappings: {
      SAP_S4: "KNB5 (Dunning Data per Customer) / UKM_SGM (repayment records)",
      Odoo: "account.followup / res.partner payment score",
      Protheus: "SA1 (A1_MSEG repayment tracking, A1_MATR average delays)",
      Tango: "Clientes payment stats",
      Dynamics_365: "CustCollectionLetterJour",
      NetSuite: "Customer payment performance history / days overdue",
      QuickBooks: "Customer payment record notes",
      Salesforce: "Billing Credit payment timeline metrics"
    },
    aiHints: [
      "Look up average payment delay for this client.",
      "Verify dunning status or days sales outstanding.",
      "Show me payment reliability indices.",
      "Has the customer received collection warnings?",
      "Find collection letter history in CustCollectionLetterJour."
    ],
    distinguishableFrom: ["CreditRisk", "Payment"],
    properties: [
      { name: 'id', type: 'string', description: 'Analytical metrics index row', required: true },
      { name: 'partyId', type: 'string', description: 'Associated customer reference ID', required: true },
      { name: 'averageDaysLate', type: 'number', description: 'Mean delay metric for overdue invoice settlements', required: true }
    ],
    rawSchema: `{}`
  },
  Warehouse: {
    name: 'Warehouse',
    tier: 2,
    description: 'Stock warehouse or storage depot housing inventory, physical assets, and shipment routes.',
    aliases: ["Warehouse", "Almacen", "Almoxarifado", "Deposito", "T001L", "stock.warehouse", "NNR", "Site", "Centro", "Barracao", "Galpao"],
    erpMappings: {
      SAP_S4: "T001L (Storage Locations) / WRF1 (Plant Master Data)",
      Odoo: "stock.warehouse / stock.location",
      Protheus: "NNR (Locais de Estoque) / SB2 (Warehouse segments)",
      Tango: "Depositos (STA22)",
      Dynamics_365: "InventLocation / InventSite",
      NetSuite: "Location Record (location)",
      QuickBooks: "Inventory Site Entity",
      Salesforce: "Location (Service Cloud)"
    },
    aiHints: [
      "Which warehouse belongs to this code?",
      "Find storage location details.",
      "Verify botanical or material plants from T001L.",
      "Query stock.warehouse records in Odoo.",
      "Retrieve NNR warehouse address."
    ],
    distinguishableFrom: ["Inventory"],
    properties: [
      { name: 'id', type: 'string', description: 'Unique depot registry key', required: true },
      { name: 'code', type: 'string', description: 'Vendor standard code abbreviation', required: true },
      { name: 'name', type: 'string', description: 'Formal commercial name of store plant', required: true }
    ],
    rawSchema: `{}`
  },
  ShipmentEvent: {
    name: 'ShipmentEvent',
    tier: 2,
    description: 'Logistics events and tracing records representing shipment dispatch, carrier Handover, and destination deliveries.',
    aliases: ["ShipmentEvent", "Evento de Embarque", "Evento de Envio", "Despacho", "VTTK", "stock.picking", "GW1", "Tracking", "Entrega", "Remito", "Minuta"],
    erpMappings: {
      SAP_S4: "VTTK (Shipment Header) / VTTP (Shipment Item), LIKP (SD Document Delivery)",
      Odoo: "stock.picking / stock.move.line",
      Protheus: "GW1 (Documentos de Carga) / SC9 (Liberação de Pedidos)",
      Tango: "Guias / Despachos database",
      Dynamics_365: "WHSShipmentTable",
      NetSuite: "Item Fulfillment (itemfulfillment)",
      QuickBooks: "Shipping details profile",
      Salesforce: "Shipment / ShipmentProduct"
    },
    aiHints: [
      "Check shipping status.",
      "Lookup carrier package tracking numbers.",
      "Show me delivery timestamps from VTTK.",
      "Query stock.picking records in Odoo.",
      "Find shipment load information in GW1."
    ],
    distinguishableFrom: ["Order", "Warehouse"],
    properties: [
      { name: 'id', type: 'string', description: 'Logistics trace tag ID', required: true },
      { name: 'orderId', type: 'string', description: 'Source sales or purchase contract order reference', required: true },
      { name: 'status', type: 'string', description: 'Milestone shipping state indicators', required: true }
    ],
    rawSchema: `{}`
  },
  TaxDocument: {
    name: 'TaxDocument',
    tier: 2,
    description: 'Withholding certificates, tax declarations, fiscal vouchers, and regulatory filings matching corporate transactions.',
    aliases: ["TaxDocument", "Documento Fiscal", "Certificado Retencion", "Retencion", "WITH_ITEM", "account.tax", "SF3", "Comprobante Retención", "Certificado", "Aliquota"],
    erpMappings: {
      SAP_S4: "WITH_ITEM (Withholding Tax Table per FI Document)",
      Odoo: "account.tax / account.fiscal.position",
      Protheus: "SF3 (Livros Fiscais - Impostos de Notas Fiscais)",
      Tango: "Retenciones (CPA05)",
      Dynamics_365: "TaxTrans / TaxTable",
      NetSuite: "Tax Item Record (taxitem) / Tax Group",
      QuickBooks: "TaxRate / TaxCode Entities",
      Salesforce: "TaxTreatment (Revenue Cloud)"
    },
    aiHints: [
      "Verify tax withholding certificates.",
      "Lookup localized tax rates or fiscal regimes.",
      "Show me tax calculations in WITH_ITEM.",
      "Query account.tax configurations.",
      "Find tax values for SF3 records."
    ],
    distinguishableFrom: ["Invoice"],
    properties: [
      { name: 'id', type: 'string', description: 'Tax transaction record ID folder', required: true },
      { name: 'documentType', type: 'string', description: 'Fiscal form type (WITHHOLDING_CERTIFICATE | VAT_DECLARATION)', required: true },
      { name: 'fiscalIdentifier', type: 'string', description: 'Withheld taxation identification sequential code', required: true }
    ],
    rawSchema: `{}`
  },
  CostCenter: {
    name: 'CostCenter',
    tier: 3,
    description: 'An organizational unit or segment that collects, tracks, and audits operational costs, budgets, and departmental expenses.',
    aliases: ["CostCenter", "Centro de Costo", "Centro de Custo", "CC", "CSKS", "account.analytic.account (Cost Center)", "SI3", "Department Expense Unit", "CeCo", "Conta Analitica"],
    erpMappings: {
      SAP_S4: "CSKS (Cost Center Master Record) / CSKT (Cost Center Texts)",
      Odoo: "account.analytic.account with group indicators",
      Protheus: "SI3 (Centro de Custos) / CTH (Classes de Valores)",
      Tango: "Contabilidad / Centros de Costo database",
      Dynamics_365: "DimensionAttributeValue (Financial Dimensions)",
      NetSuite: "Department Record (department) / Cost Center",
      QuickBooks: "Class / Department Entity",
      Salesforce: "CostCenter (Revenue Cloud)"
    },
    aiHints: [
      "What cost center was charged for this travel?",
      "Show me the list of operational departments.",
      "Verify departmental budget targets on the CSKS master table.",
      "Lookup analytical account allocations in Odoo.",
      "Retrieve SI3 centro de custo information."
    ],
    distinguishableFrom: ["Project"],
    properties: [
      { name: 'id', type: 'string', description: 'Analytical cost node index', required: true },
      { name: 'code', type: 'string', description: 'Standard billing node code key', required: true },
      { name: 'name', type: 'string', description: 'Corporate division segment moniker title', required: true }
    ],
    rawSchema: `{}`
  },
  Project: {
    name: 'Project',
    tier: 3,
    description: 'An organized project planning structure recording milestones, timelines, expenses context, and team leaders.',
    aliases: ["Project", "Proyecto", "Projeto", "PROJ", "project.project", "CN9", "WBS Element", "Pep", "Tarefa", "Hito"],
    erpMappings: {
      SAP_S4: "PROJ (Project Definition Master) / PRPS (WBS Element Master Data)",
      Odoo: "project.project / project.task",
      Protheus: "CN9 (Cadastro de Projetos) / CNE (Cronograma Financeiro do Projeto)",
      Tango: "Proyectos database",
      Dynamics_365: "ProjTable / ProjTransBudget",
      NetSuite: "Project Record (job / project)",
      QuickBooks: "Customer (Job type) Entity",
      Salesforce: "Project (Professional Services)"
    },
    aiHints: [
      "Lookup active enterprise project timelines.",
      "Verify project planning milestones and WBS elements.",
      "Show me project.project tasks for Odoo.",
      "Retrieve project definitions from PROJ table.",
      "Check CN9 project progress."
    ],
    distinguishableFrom: ["CostCenter"],
    properties: [
      { name: 'id', type: 'string', description: 'Unique planning project identifier', required: true },
      { name: 'code', type: 'string', description: 'Unique ledger identification WBS code', required: true },
      { name: 'name', type: 'string', description: 'Descriptive operational initiative title', required: true },
      { name: 'progressPercentage', type: 'number', description: 'Completion metric progression (0-100%)', required: true }
    ],
    rawSchema: `{}`
  }
};

export function getAllEntities(): OPOEntity[] {
  return Object.values(ENTITIES_MAPPING);
}

export function getEntity(name: string): OPOEntity | undefined {
  const normName = name.trim().toLowerCase();
  const canonicalKey = Object.keys(ENTITIES_MAPPING).find(
    (k) => k.toLowerCase() === normName
  );
  return canonicalKey ? ENTITIES_MAPPING[canonicalKey] : undefined;
}

export function getEntitiesByTier(tier: 1 | 2 | 3): OPOEntity[] {
  return getAllEntities().filter((e) => e.tier === tier);
}

