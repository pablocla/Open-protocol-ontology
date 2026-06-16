import { BASELINE_SEMANTIC_MAPPINGS } from '../mesh/adapters/totvs/protheusBaselineSeed';

export type RecurringQueryCategory =
  | 'ventas'
  | 'cobranzas'
  | 'clientes'
  | 'compras'
  | 'reportes';

export interface RecurringQueryParam {
  key: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}

export interface RecurringQuery {
  id: string;
  category: RecurringQueryCategory;
  /** Etiqueta humana en español para la UI */
  humanLabel: string;
  /** Descripción breve del reporte */
  description: string;
  /** Prompt natural para el chat Mesh / Ollama */
  meshPrompt: string;
  /** Plantilla OPO-QL (placeholders `{paramKey}`) */
  opoQueryTemplate: Record<string, unknown>;
  /** Entidades OPO involucradas — ayuda al semantic router */
  entities: string[];
  /** Parámetros editables por el usuario */
  params: RecurringQueryParam[];
  /** Ejemplos de frases que el usuario podría decir */
  utteranceExamples: string[];
}

const PROTHEUS_TABLE_HINTS = ['SC5', 'SA1', 'SF2', 'SE1', 'SC6', 'SB1', 'SC7', 'SA2'];

export const PROTHEUS_RECURRING_QUERIES: RecurringQuery[] = [
  {
    id: 'orders-count-by-customer',
    category: 'ventas',
    humanLabel: 'Pedidos por cliente',
    description: 'Cuenta cuántos pedidos de venta tiene un cliente (SC5).',
    meshPrompt:
      '¿Cuántos pedidos de venta tiene el cliente {customerId}? Usá la entidad SalesOrderHeader y filtrá por customerId. Respondé con el total y un resumen breve.',
    opoQueryTemplate: {
      entity: 'SalesOrderHeader',
      action: 'READ',
      select: { id: true, customerId: true, issueDate: true, totalAmount: true },
      filter: { customerId: { eq: '{customerId}' } },
      limit: 50,
    },
    entities: ['SalesOrderHeader', 'Customer'],
    params: [
      { key: 'customerId', label: 'Código cliente', placeholder: '000219', defaultValue: '000219' },
    ],
    utteranceExamples: [
      '¿Cuántos pedidos tiene el cliente 000219?',
      'Listame los pedidos del cliente Acme',
      'Pedidos de venta para el cliente X',
    ],
  },
  {
    id: 'customer-debt-summary',
    category: 'cobranzas',
    humanLabel: 'Deuda del cliente',
    description: 'Saldo deudor y límite de crédito del maestro de clientes (SA1).',
    meshPrompt:
      '¿Cuál es la deuda o saldo deudor del cliente {customerId}? Consultá Customer (outstandingBalance, creditLimit, legalName) y explicá el riesgo crediticio en lenguaje claro.',
    opoQueryTemplate: {
      entity: 'Customer',
      action: 'READ',
      select: {
        id: true,
        legalName: true,
        outstandingBalance: true,
        creditLimit: true,
        active: true,
      },
      filter: { id: { eq: '{customerId}' } },
      limit: 1,
    },
    entities: ['Customer'],
    params: [
      { key: 'customerId', label: 'Código cliente', placeholder: '000219', defaultValue: '000219' },
    ],
    utteranceExamples: [
      '¿Cuánto debe el cliente 000219?',
      'Saldo deudor del cliente X',
      'Reporte de deuda por cliente',
    ],
  },
  {
    id: 'recent-sales-orders',
    category: 'ventas',
    humanLabel: 'Últimos pedidos',
    description: 'Listado paginado de pedidos de venta recientes (SC5).',
    meshPrompt:
      'Mostrá los últimos pedidos de venta del sistema. Entidad SalesOrderHeader, ordená por fecha de emisión descendente. Formato tabla con número, cliente, fecha y total.',
    opoQueryTemplate: {
      entity: 'SalesOrderHeader',
      action: 'READ',
      select: {
        id: true,
        customerId: true,
        issueDate: true,
        totalAmount: true,
        paymentTerms: true,
      },
      filter: {},
      limit: 50,
    },
    entities: ['SalesOrderHeader'],
    params: [],
    utteranceExamples: [
      'Últimos pedidos de venta',
      'Reporte de pedidos del mes',
      'Listado de SC5',
    ],
  },
  {
    id: 'customer-profile',
    category: 'clientes',
    humanLabel: 'Ficha del cliente',
    description: 'Datos maestros del cliente (SA1).',
    meshPrompt:
      'Dame la ficha completa del cliente {customerId}: razón social, CNPJ/CPF, límite de crédito y si está bloqueado.',
    opoQueryTemplate: {
      entity: 'Customer',
      action: 'READ',
      select: {
        id: true,
        legalName: true,
        tradeName: true,
        partyId: true,
        creditLimit: true,
        outstandingBalance: true,
        active: true,
      },
      filter: { id: { eq: '{customerId}' } },
      limit: 1,
    },
    entities: ['Customer'],
    params: [
      { key: 'customerId', label: 'Código cliente', placeholder: '000219', defaultValue: '000219' },
    ],
    utteranceExamples: [
      'Ficha del cliente 000219',
      'Datos del cliente X',
      '¿Quién es el cliente 000219?',
    ],
  },
  {
    id: 'invoices-by-customer',
    category: 'ventas',
    humanLabel: 'Facturas del cliente',
    description: 'Notas fiscales de salida (SF2) asociadas a un cliente.',
    meshPrompt:
      'Listá las facturas de salida del cliente {customerId}. Usá SalesInvoiceHeader con filtro customerId. Incluí número, fecha y valor bruto.',
    opoQueryTemplate: {
      entity: 'SalesInvoiceHeader',
      action: 'READ',
      select: {
        number: true,
        customerId: true,
        issueDate: true,
        grandTotal: true,
      },
      filter: { customerId: { eq: '{customerId}' } },
      limit: 50,
    },
    entities: ['SalesInvoiceHeader', 'Customer'],
    params: [
      { key: 'customerId', label: 'Código cliente', placeholder: '000219', defaultValue: '000219' },
    ],
    utteranceExamples: [
      'Facturas del cliente 000219',
      'NF de salida del cliente X',
      '¿Qué facturó el cliente?',
    ],
  },
  {
    id: 'order-lines-detail',
    category: 'reportes',
    humanLabel: 'Ítems de un pedido',
    description: 'Detalle de líneas SC6 para un pedido SC5.',
    meshPrompt:
      'Mostrá los ítems del pedido {orderId}: producto, cantidad y precio. Entidad SalesOrderItem filtrando por orderId.',
    opoQueryTemplate: {
      entity: 'SalesOrderItem',
      action: 'READ',
      select: {
        orderId: true,
        lineNumber: true,
        productId: true,
        quantity: true,
        unitPrice: true,
      },
      filter: { orderId: { eq: '{orderId}' } },
      limit: 50,
    },
    entities: ['SalesOrderItem', 'SalesOrderHeader', 'Product'],
    params: [
      { key: 'orderId', label: 'Nº pedido', placeholder: '000001', defaultValue: '000001' },
    ],
    utteranceExamples: [
      'Ítems del pedido 000001',
      'Detalle del pedido X',
      'Qué productos tiene el pedido',
    ],
  },
];

export const GENERIC_RECURRING_QUERIES: RecurringQuery[] = [
  {
    id: 'entity-list',
    category: 'reportes',
    humanLabel: 'Listar entidad',
    description: 'Consulta genérica paginada sobre cualquier entidad del canvas.',
    meshPrompt:
      'Listá los primeros registros de la entidad {entityName} del ontology. Usá paginación por defecto (50 filas).',
    opoQueryTemplate: {
      entity: '{entityName}',
      action: 'READ',
      filter: {},
      limit: 50,
    },
    entities: [],
    params: [
      { key: 'entityName', label: 'Entidad OPO', placeholder: 'Customer', defaultValue: 'Customer' },
    ],
    utteranceExamples: ['Listar clientes', 'Mostrar entidad X'],
  },
];

export function isProtheusOntology(
  ontology?: { entities?: Array<{ name?: string; originalTable?: string }> },
  projectName?: string | null
): boolean {
  const name = (projectName || '').toLowerCase();
  if (name.includes('protheus') || name.includes('totvs')) return true;

  const entities = ontology?.entities || [];
  const tables = entities.map((e) => (e.originalTable || e.name || '').toUpperCase());
  const hits = tables.filter((t) => PROTHEUS_TABLE_HINTS.some((h) => t.includes(h))).length;
  if (hits >= 2) return true;

  const canonical = entities.map((e) => e.name || '');
  return canonical.includes('SalesOrderHeader') && canonical.includes('Customer');
}

export function getRecurringQueriesForContext(
  ontology?: { entities?: Array<{ name?: string; originalTable?: string }> },
  projectName?: string | null
): RecurringQuery[] {
  if (isProtheusOntology(ontology, projectName)) {
    return PROTHEUS_RECURRING_QUERIES;
  }
  return GENERIC_RECURRING_QUERIES;
}

/** Sustituye `{param}` en strings y objetos anidados */
export function applyQueryParams(
  template: unknown,
  params: Record<string, string>
): unknown {
  if (typeof template === 'string') {
    return template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
  }
  if (Array.isArray(template)) {
    return template.map((item) => applyQueryParams(item, params));
  }
  if (template && typeof template === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template)) {
      out[k] = applyQueryParams(v, params);
    }
    return out;
  }
  return template;
}

export function buildMeshPromptFromQuery(
  query: RecurringQuery,
  paramValues?: Record<string, string>
): string {
  const values: Record<string, string> = {};
  for (const p of query.params) {
    values[p.key] = paramValues?.[p.key] ?? p.defaultValue;
  }
  return applyQueryParams(query.meshPrompt, values) as string;
}

export function buildOpoQueryFromTemplate(
  query: RecurringQuery,
  paramValues?: Record<string, string>,
  pagination?: { cursor?: string | null; limit?: number }
): Record<string, unknown> {
  const values: Record<string, string> = {};
  for (const p of query.params) {
    values[p.key] = paramValues?.[p.key] ?? p.defaultValue;
  }
  const base = applyQueryParams(query.opoQueryTemplate, values) as Record<string, unknown>;
  if (pagination?.cursor || pagination?.limit) {
    base.pagination = {
      ...(pagination.cursor ? { cursor: pagination.cursor } : {}),
      ...(pagination.limit ? { limit: pagination.limit } : {}),
    };
  }
  return base;
}

/** Bloque compacto para inyectar en system prompts de Ollama / agentes */
export function formatRecurringQueriesForLLM(queries: RecurringQuery[]): string {
  if (!queries.length) return '';

  const lines = [
    '## Consultas recurrentes (catálogo OPO)',
    'Cuando el usuario haga preguntas similares a los ejemplos, mapeá la intención a la plantilla OPO-QL indicada.',
    'Usá paginación por defecto (limit 50, max 100). Si hay más resultados, indicá hasNextPage y endCursor.',
    '',
  ];

  for (const q of queries) {
    lines.push(`### ${q.humanLabel} (id: ${q.id})`);
    lines.push(`- Categoría: ${q.category}`);
    lines.push(`- Entidades: ${q.entities.join(', ') || 'cualquiera del ontology'}`);
    lines.push(`- Ejemplos usuario: ${q.utteranceExamples.map((u) => `"${u}"`).join(' | ')}`);
    lines.push(`- Plantilla OPO-QL: ${JSON.stringify(q.opoQueryTemplate)}`);
    if (q.params.length) {
      lines.push(
        `- Parámetros: ${q.params.map((p) => `${p.key} (default: ${p.defaultValue})`).join(', ')}`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** Diccionario opo-sdk para demo/mock a partir del baseline Protheus */
export function buildProtheusQueryDictionary(): Record<
  string,
  {
    entity: string;
    sourceType: string;
    tableName: string;
    fields: Record<string, { column: string; type: string }>;
    joins?: Record<string, { tableName: string; on: string }>;
  }
> {
  const companySuffix = '010';
  const logicalTableByEntity: Record<string, string> = {
    Customer: 'SA1',
    Supplier: 'SA2',
    Product: 'SB1',
    SalesOrderHeader: 'SC5',
    SalesOrderItem: 'SC6',
    SalesInvoiceHeader: 'SF2',
    PurchaseInvoiceHeader: 'SF1',
  };
  const tableByEntity: Record<string, string> = Object.fromEntries(
    Object.entries(logicalTableByEntity).map(([entity, logical]) => [
      entity,
      `${logical}${companySuffix}`,
    ])
  );

  const protheusMeta = (logicalTable: string, filialField: string) => ({
    x2Modo: 'E',
    filialField,
    companySuffix,
    physicalTableName: `${logicalTable}${companySuffix}`,
  });

  const joins: Record<
    string,
    Record<
      string,
      {
        tableName: string;
        on: string;
        protheus?: ReturnType<typeof protheusMeta>;
      }
    >
  > = {
    SalesOrderHeader: {
      Customer: {
        tableName: `SA1${companySuffix}`,
        on: `SC5${companySuffix}.C5_CLIENTE = SA1${companySuffix}.A1_COD AND SC5${companySuffix}.C5_LOJACLI = SA1${companySuffix}.A1_LOJA`,
        protheus: protheusMeta('SA1', 'A1_FILIAL'),
      },
    },
    SalesOrderItem: {
      SalesOrderHeader: {
        tableName: `SC5${companySuffix}`,
        on: `SC6${companySuffix}.C6_NUM = SC5${companySuffix}.C5_NUM`,
        protheus: protheusMeta('SC5', 'C5_FILIAL'),
      },
      Product: {
        tableName: `SB1${companySuffix}`,
        on: `SC6${companySuffix}.C6_PRODUTO = SB1${companySuffix}.B1_COD`,
        protheus: protheusMeta('SB1', 'B1_FILIAL'),
      },
    },
    SalesInvoiceHeader: {
      Customer: {
        tableName: `SA1${companySuffix}`,
        on: `SF2${companySuffix}.F2_CLIENTE = SA1${companySuffix}.A1_COD AND SF2${companySuffix}.F2_LOJA = SA1${companySuffix}.A1_LOJA`,
        protheus: protheusMeta('SA1', 'A1_FILIAL'),
      },
    },
  };

  const filialByLogical: Record<string, string> = {
    SA1: 'A1_FILIAL',
    SA2: 'A2_FILIAL',
    SB1: 'B1_FILIAL',
    SC5: 'C5_FILIAL',
    SC6: 'C6_FILIAL',
    SF1: 'F1_FILIAL',
    SF2: 'F2_FILIAL',
  };

  const dict: Record<
    string,
    {
      entity: string;
      sourceType: string;
      tableName: string;
      fields: Record<string, { column: string; type: string }>;
      protheus?: ReturnType<typeof protheusMeta>;
      mutationPolicy?: { readOnly: boolean; strategy: string };
      joins?: Record<string, { tableName: string; on: string; protheus?: ReturnType<typeof protheusMeta> }>;
    }
  > = {};

  for (const [entity, mapping] of Object.entries(BASELINE_SEMANTIC_MAPPINGS)) {
    const fields: Record<string, { column: string; type: string }> = {};
    for (const [semantic, physical] of Object.entries(mapping)) {
      if (physical.includes('+')) continue;
      if (physical.includes('!=')) continue;
      const isNumber =
        physical.includes('VAL') ||
        physical.includes('SALD') ||
        physical.includes('TOTAL') ||
        physical.includes('QTD') ||
        physical.includes('PRC');
      fields[semantic] = { column: physical, type: isNumber ? 'number' : 'string' };
    }
    const logicalTable = logicalTableByEntity[entity] ?? entity;
    dict[entity] = {
      entity,
      sourceType: 'SQL',
      tableName: tableByEntity[entity] || entity,
      fields,
      protheus: protheusMeta(logicalTable, filialByLogical[logicalTable] ?? 'A1_FILIAL'),
      mutationPolicy: { readOnly: true, strategy: 'rest' },
      ...(joins[entity] ? { joins: joins[entity] } : {}),
    };
  }

  return dict;
}