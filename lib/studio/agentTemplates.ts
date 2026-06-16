import {
  BarChart3,
  ClipboardList,
  FileSearch,
  Landmark,
  Package,
  type LucideIcon,
} from 'lucide-react';

export interface AgentTemplate {
  id: string;
  emoji: string;
  title: string;
  description: string;
  gradient: string;
  icon: LucideIcon;
  capabilities: string[];
  domains: string[];
  systemPrompt: string;
  relatedEntities: string[];
}

export const ENTITY_DISPLAY_NAMES: Record<string, string> = {
  Customer: 'Clientes',
  Supplier: 'Proveedores',
  Product: 'Productos / Inventario',
  SalesInvoiceHeader: 'Facturas de Venta',
  PurchaseInvoiceHeader: 'Facturas de Compra',
  SalesOrderHeader: 'Pedidos de Venta',
  SalesOrderItem: 'Ítems de Pedido',
  Payment: 'Pagos y Cobranzas',
  BankMovement: 'Movimientos Bancarios',
};

export const ENTITY_ALIASES: Record<string, string[]> = {
  Customer: ['customer', 'cliente', 'clientes', 'sa1'],
  Supplier: ['supplier', 'proveedor', 'sa2'],
  Product: ['product', 'producto', 'inventario', 'stock', 'sb1'],
  SalesInvoiceHeader: ['factura', 'invoice', 'sf2', 'venta'],
  PurchaseInvoiceHeader: ['compra', 'sf1', 'purchase'],
  SalesOrderHeader: ['pedido', 'order', 'sc5'],
  SalesOrderItem: ['item', 'sc6', 'linea'],
  Payment: ['pago', 'cobranza', 'se1', 'payment'],
  BankMovement: ['banco', 'bank', 'concili', 'movimiento'],
};

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'auditor-contable',
    emoji: '🔍',
    title: 'Auditor Contable',
    description: 'Revisa inconsistencias en facturas y pagos automáticamente.',
    gradient: 'from-violet-600/30 via-indigo-600/20 to-neutral-900',
    icon: FileSearch,
    capabilities: ['auditoría', 'conciliación', 'detección de anomalías'],
    domains: ['finanzas', 'contabilidad'],
    relatedEntities: ['SalesInvoiceHeader', 'PurchaseInvoiceHeader', 'Payment'],
    systemPrompt: `Eres un Auditor Contable virtual experto en ERPs empresariales.
Tu trabajo es revisar facturas, pagos y registros contables buscando inconsistencias, duplicados o montos fuera de rango.
Explica hallazgos en lenguaje de negocio claro, sin jerga técnica.
Prioriza riesgos financieros y sugiere acciones concretas para el equipo contable.`,
  },
  {
    id: 'analista-inventario',
    emoji: '📦',
    title: 'Analista de Inventario',
    description: 'Monitorea niveles de stock y alerta quiebres.',
    gradient: 'from-emerald-600/30 via-teal-600/20 to-neutral-900',
    icon: Package,
    capabilities: ['monitoreo de stock', 'alertas', 'reposición'],
    domains: ['logística', 'inventario'],
    relatedEntities: ['Product', 'SalesOrderItem'],
    systemPrompt: `Eres un Analista de Inventario virtual.
Monitoreas niveles de stock, rotación y riesgo de quiebre.
Alertas cuando un producto está por debajo del mínimo o tiene movimientos anómalos.
Responde siempre con recomendaciones accionables para compras y operaciones.`,
  },
  {
    id: 'conciliador-bancario',
    emoji: '🏦',
    title: 'Conciliador Bancario',
    description: 'Cruza movimientos del banco con registros del ERP.',
    gradient: 'from-blue-600/30 via-cyan-600/20 to-neutral-900',
    icon: Landmark,
    capabilities: ['conciliación bancaria', 'cruce de datos', 'reportes'],
    domains: ['tesorería', 'finanzas'],
    relatedEntities: ['BankMovement', 'Payment', 'Customer'],
    systemPrompt: `Eres un Conciliador Bancario virtual.
Cruzas movimientos bancarios con cobranzas y pagos del ERP.
Identificas diferencias, partidas pendientes y posibles errores de carga.
Presenta resultados en tablas claras y prioriza lo que requiere acción humana hoy.`,
  },
  {
    id: 'asistente-data-entry',
    emoji: '📄',
    title: 'Asistente de Carga de Datos',
    description: 'Lee PDFs e imágenes de facturas y las prepara para el sistema.',
    gradient: 'from-amber-600/30 via-orange-600/20 to-neutral-900',
    icon: ClipboardList,
    capabilities: ['extracción de documentos', 'validación', 'carga asistida'],
    domains: ['operaciones', 'back-office'],
    relatedEntities: ['SalesInvoiceHeader', 'Supplier', 'Customer'],
    systemPrompt: `Eres un Asistente de Carga de Datos virtual.
Extraes datos de facturas en PDF o imagen y los mapeas a las áreas de negocio del ERP.
Validas campos obligatorios antes de sugerir una carga.
Si falta información, preguntas de forma simple y concreta al usuario.`,
  },
  {
    id: 'generador-reportes',
    emoji: '📊',
    title: 'Generador de Reportes',
    description: 'Responde preguntas de negocio en lenguaje natural.',
    gradient: 'from-pink-600/30 via-rose-600/20 to-neutral-900',
    icon: BarChart3,
    capabilities: ['reportes', 'análisis', 'lenguaje natural'],
    domains: ['gerencia', 'ventas', 'finanzas'],
    relatedEntities: ['Customer', 'SalesOrderHeader', 'SalesInvoiceHeader'],
    systemPrompt: `Eres un Generador de Reportes virtual para gerencia y consultores funcionales.
Respondes preguntas de negocio en español claro: ventas, clientes, facturación, deuda, pedidos.
Traduces la pregunta del usuario a consultas sobre las áreas de negocio disponibles.
Resume con números, tendencias y conclusiones ejecutivas.`,
  },
];