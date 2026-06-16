// Auto-generated TypeScript definitions for OPO Protocol
// Do not edit manually.

/**
 * A binding legal agreement between the organization and a counterparty specifying operational conditions, timelines, and financial clauses.
 */
export interface Contract {
  id: string;
  title: string;
  partyId: string;
  startDate: string;
  endDate?: string;
  value?: Money;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * An organizational unit or segment that collects, tracks, and audits operational costs, budgets, and departmental expenses.
 */
export interface CostCenter {
  id: string;
  code: string;
  name: string;
  department?: string;
  budgetLimit?: Money;
  expensesYtd?: Money;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * An administrative ledger tracking credit lines, current utilization, and credit availability for customers and counterparties.
 */
export interface CreditAccount {
  id: string;
  partyId: string;
  authorizedLimit: Money;
  utilizedBalance: Money;
  availableCredit: Money;
  creditStatus: 'ACTIVE' | 'SUSPENDED' | 'REVIEW_REQUIRED';
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Financial credit risk assessment indexes registering profile ratings, default metrics, and score categories.
 */
export interface CreditRisk {
  id: string;
  partyId: string;
  creditRating: string;
  scoreValue?: number;
  probabilityOfDefault: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  updatedDate?: string;
  [k: string]: unknown;
}

/**
 * An entity representing a buyer, client, or consumer that purchases goods, services, or contracts from the business.
 */
export interface Customer {
  id: string;
  partyId: string;
  creditLimit?: Money;
  outstandingBalance: Money;
  paymentTerms?: string;
  active?: boolean;
  salesRepresentative?: string;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Debt obligations, financial loans, or security liabilities held by the enterprise or counterparties.
 */
export interface DebtObligation {
  id: string;
  partyId: string;
  principal: Money;
  remainingBalance: Money;
  interestRate: number;
  maturityDate: string;
  status: 'ACTIVE' | 'PAID' | 'DEFAULTED';
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * An individual hired by the organization to perform services in exchange for salary or hourly compensation.
 */
export interface Employee {
  id: string;
  partyId: string;
  role: string;
  department?: string;
  status: 'ACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  hireDate?: string;
  salary?: Money;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Aggregate financial metrics representing active, credit-weighted exposures, open orders and bill statuses for a counterparty.
 */
export interface FinancialExposure {
  id: string;
  partyId: string;
  outstandingReceivables: Money;
  openOrdersAmount: Money;
  totalExposure: Money;
  updatedDate: string;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Financial warrants, third-party guarantors, or collaterals backing transactions and invoices.
 */
export interface Guarantee {
  id: string;
  partyId: string;
  contractId?: string;
  value: Money;
  guaranteeType: 'BANK_GUARANTEE' | 'SURETY_BOND' | 'COLLATERAL' | 'PERSONAL';
  expiryDate?: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'RELEASED';
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Stock inventory records capturing item quantities, reserved segments, and location warehouses.
 */
export interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved?: number;
  quantityAvailable: number;
  valuationPrice?: Money;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * A legal accounting invoice documenting supplied assets, tax breakdowns, currencies, and due payments.
 */
export interface Invoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  partyId: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  lineItems: InvoiceItem[];
  subTotal?: Money;
  taxTotal?: Money;
  grandTotal: Money;
  [k: string]: unknown;
}
export interface InvoiceItem {
  productId?: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  taxRate?: number;
  lineTotal: Money;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Standardized OPO Mutation Language for deterministically writing data to ERPs
 */
export interface OpoMutation {
  mutation: {
    /**
     * The target OPO entity type, e.g. 'Customer', 'Invoice'
     */
    entity: string;
    /**
     * The CRUD action to perform on the entity
     */
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    filter?: FilterNode;
    /**
     * The data to be inserted (CREATE) or modified (UPDATE). Required for CREATE and UPDATE.
     */
    payload?: {
      [k: string]: unknown;
    };
  };
}
/**
 * Filter to select which records to UPDATE or DELETE. Required for UPDATE and DELETE.
 */
export interface FilterNode {
  AND?: FilterNode1[];
  OR?: FilterNode1[];
  NOT?: FilterNode1;
  /**
   * This interface was referenced by `FilterNode1`'s JSON-Schema definition
   * via the `patternProperty` "^(?!(AND|OR|NOT)$)[a-zA-Z0-9_]+$".
   *
   * This interface was referenced by `FilterNode`'s JSON-Schema definition
   * via the `patternProperty` "^(?!(AND|OR|NOT)$)[a-zA-Z0-9_]+$".
   */
  [k: string]: {
    eq?: unknown;
    neq?: unknown;
    gt?: unknown;
    gte?: unknown;
    lt?: unknown;
    lte?: unknown;
    like?: string;
    in?: unknown[];
  };
}
export interface FilterNode1 {
  AND?: FilterNode1[];
  OR?: FilterNode1[];
  NOT?: FilterNode1;
  /**
   * This interface was referenced by `FilterNode1`'s JSON-Schema definition
   * via the `patternProperty` "^(?!(AND|OR|NOT)$)[a-zA-Z0-9_]+$".
   *
   * This interface was referenced by `FilterNode`'s JSON-Schema definition
   * via the `patternProperty` "^(?!(AND|OR|NOT)$)[a-zA-Z0-9_]+$".
   */
  [k: string]: {
    eq?: unknown;
    neq?: unknown;
    gt?: unknown;
    gte?: unknown;
    lt?: unknown;
    lte?: unknown;
    like?: string;
    in?: unknown[];
  };
}

/**
 * Standardized response for an OPO Mutation
 */
export interface OpoMutationResponse {
  /**
   * Whether the mutation was successful
   */
  success: boolean;
  /**
   * Number of rows affected by the mutation
   */
  affectedRows?: number;
  /**
   * Error message if the mutation failed
   */
  error?: string;
}

/**
 * Standardized OPO Query Language (OPO-QL) for deterministic AI fetching with strict boundaries
 */
export interface OpoQuery {
  query: {
    /**
     * The target OPO entity type, e.g. 'Invoice', 'Customer'
     */
    entity: string;
    pagination: {
      /**
       * Maximum number of records to return. Hardcapped at 100 to prevent context window asphyxiation.
       */
      limit: number;
      /**
       * Opaque base64 cursor from the previous response for pagination.
       */
      cursor?: string;
    };
    filter?: FilterNode;
    select?: SelectNode;
  };
}
/**
 * Semantic query filters that must be mapped to prepared statements by the adapter.
 */
export interface FilterNode {
  AND?: FilterNode1[];
  OR?: FilterNode1[];
  NOT?: FilterNode1;
  /**
   * This interface was referenced by `FilterNode1`'s JSON-Schema definition
   * via the `patternProperty` "^(?!(AND|OR|NOT)$)[a-zA-Z0-9_]+$".
   *
   * This interface was referenced by `FilterNode`'s JSON-Schema definition
   * via the `patternProperty` "^(?!(AND|OR|NOT)$)[a-zA-Z0-9_]+$".
   */
  [k: string]: {
    eq?: unknown;
    neq?: unknown;
    gt?: unknown;
    gte?: unknown;
    lt?: unknown;
    lte?: unknown;
    like?: string;
    in?: unknown[];
  };
}
export interface FilterNode1 {
  AND?: FilterNode1[];
  OR?: FilterNode1[];
  NOT?: FilterNode1;
  /**
   * This interface was referenced by `FilterNode1`'s JSON-Schema definition
   * via the `patternProperty` "^(?!(AND|OR|NOT)$)[a-zA-Z0-9_]+$".
   *
   * This interface was referenced by `FilterNode`'s JSON-Schema definition
   * via the `patternProperty` "^(?!(AND|OR|NOT)$)[a-zA-Z0-9_]+$".
   */
  [k: string]: {
    eq?: unknown;
    neq?: unknown;
    gt?: unknown;
    gte?: unknown;
    lt?: unknown;
    lte?: unknown;
    like?: string;
    in?: unknown[];
  };
}
/**
 * Hierarchical field projection to mitigate N+1 request problems.
 */
export interface SelectNode {
  /**
   * This interface was referenced by `SelectNode`'s JSON-Schema definition
   * via the `patternProperty` "^.*$".
   */
  [k: string]:
    | boolean
    | {
        select: SelectNode1;
      };
}
export interface SelectNode1 {
  /**
   * This interface was referenced by `SelectNode`'s JSON-Schema definition
   * via the `patternProperty` "^.*$".
   */
  [k: string]:
    | boolean
    | {
        select: SelectNode1;
      };
}

/**
 * Standardized enveloped response for OPO queries with cursor pagination metadata
 */
export interface OpoQueryResponse {
  /**
   * Array of returned entities mapped to OPO JSON-LD format
   */
  data: {
    [k: string]: unknown;
  }[];
  pagination: {
    /**
     * Indicates if there are more records beyond the current page.
     */
    hasNextPage: boolean;
    /**
     * Opaque base64 cursor to be used in the next request's pagination.cursor field.
     */
    endCursor: string | null;
  };
}

/**
 * An agreement for purchasing or sales delivery describing requested products, quantities, prices, and expected delivery dates.
 */
export interface Order {
  id: string;
  number: string;
  partyId: string;
  orderType: 'SALES' | 'PURCHASE';
  orderDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  items: OrderItem[];
  totalAmount: Money;
  [k: string]: unknown;
}
export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: Money;
  status?: string;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * A legal entity, natural person, or organizational division capable of entering into agreements, incurring obligations, or participating in transactions.
 */
export interface Party {
  /**
   * Unique identifier for the party
   */
  id: string;
  /**
   * Registered standard corporate or personal legal name
   */
  legalName: string;
  /**
   * Commercial brand or DBA name
   */
  tradeName?: string;
  taxId: TaxId;
  address?: Address;
  email?: string;
  phone?: string;
  type?: 'INDIVIDUAL' | 'ORGANIZATION' | 'GOVERNMENT';
  [k: string]: unknown;
}
export interface TaxId {
  value: string;
  country: string;
  type: 'CUIT' | 'CNPJ' | 'CPF' | 'RFC' | 'SSN' | 'EIN' | 'VAT' | 'OTHER';
  [k: string]: unknown;
}
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  [k: string]: unknown;
}

/**
 * An execution of a monetary transaction, representing funds cleared for an invoice or external account balance.
 */
export interface Payment {
  id: string;
  invoiceId?: string;
  partyId: string;
  paymentDate: string;
  amount: Money;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHECK' | 'ELECTRONIC' | 'OTHER';
  reference?: string;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Historical metrics capturing a partner's credit-payment behavior, average delays, dunning stages, and collection histories.
 */
export interface PaymentBehavior {
  id: string;
  partyId: string;
  averageDaysLate: number;
  dunningLevel?: number;
  lastDunningDate?: string;
  onTimePaymentRatio: number;
  [k: string]: unknown;
}

/**
 * Standard list or matrix of product prices, applicable client groups, discount factors, and activation dates.
 */
export interface PriceList {
  id: string;
  name: string;
  currency: string;
  items: PriceListItem[];
  startDate?: string;
  endDate?: string;
  [k: string]: unknown;
}
export interface PriceListItem {
  productId: string;
  price: Money;
  minimumQuantity?: number;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * A physical or digital tangible item produced, stocked, transacted, or sold by the organization.
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  barcode?: string;
  unitOfMeasure: string;
  weight?: number;
  [k: string]: unknown;
}

/**
 * An organized project planning structure recording milestones, timelines, expenses context, and team leaders.
 */
export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  progressPercentage: number;
  startDate?: string;
  endDate?: string;
  projectLeaderId?: string;
  [k: string]: unknown;
}

/**
 * An intangible task, professional consultation, or labor-based action rendered to a customer or acquired from a supplier.
 */
export interface Service {
  id: string;
  code: string;
  name: string;
  description?: string;
  billingType: 'HOURLY' | 'FIXED' | 'MILESTONE';
  rate?: Money;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Logistics events and tracing records representing shipment dispatch, carrier Handover, and destination deliveries.
 */
export interface ShipmentEvent {
  id: string;
  orderId: string;
  trackingNumber?: string;
  carrierName?: string;
  currentLocation?: string;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELAYED';
  eventTimestamp: string;
  estimatedDelivery?: string;
  [k: string]: unknown;
}

/**
 * An entity representing a vendor, merchant, or service provider that supplies materials or services to the enterprise.
 */
export interface Supplier {
  id: string;
  partyId: string;
  paymentTerms?: string;
  purchaseBalance: Money;
  active?: boolean;
  rating?: number;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Withholding certificates, tax declarations, fiscal vouchers, and regulatory filings matching corporate transactions.
 */
export interface TaxDocument {
  id: string;
  relatedInvoiceId?: string;
  documentType: 'WITHHOLDING_CERTIFICATE' | 'VAT_DECLARATION' | 'CUSTOMS_ENTRY' | 'REGULATORY_STATEMENT';
  fiscalIdentifier: string;
  taxAuthorityName?: string;
  withholdingAmount: Money;
  taxRateApplied?: number;
  issueDate: string;
  [k: string]: unknown;
}
export interface Money {
  amount: number;
  currency: string;
  [k: string]: unknown;
}

/**
 * Stock warehouse or storage depot housing inventory, physical assets, and shipment routes.
 */
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: Address;
  managerId?: string;
  [k: string]: unknown;
}
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  [k: string]: unknown;
}

