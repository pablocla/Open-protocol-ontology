import type { RecurringQuery } from '@/lib/studio/recurringQueries';

export interface SummaryPagination {
  returnedCount: number;
  hasNextPage: boolean;
  limit: number;
  offset: number;
}

export function buildConsultaSummary(
  query: RecurringQuery,
  data: Record<string, unknown>[],
  pagination?: SummaryPagination
): string {
  const count = pagination?.returnedCount ?? data.length;
  const moreHint = pagination?.hasNextPage ? ' Podés cargar más resultados abajo.' : '';

  if (query.id === 'customer-debt-summary' && data[0]) {
    const row = data[0];
    const name = row.legalName ?? row.name ?? 'Cliente';
    const balance = row.outstandingBalance ?? row.balance;
    const limit = row.creditLimit;
    return `📋 Deuda de ${name}: saldo ${formatMoney(balance)}, límite de crédito ${formatMoney(limit)}.${moreHint}`;
  }

  if (query.id === 'orders-count-by-customer') {
    return `📋 Pedidos encontrados: ${count}.${moreHint}`;
  }

  if (query.id === 'open-invoices-by-customer') {
    return `📋 Facturas pendientes: ${count}.${moreHint}`;
  }

  if (query.id === 'recent-sales-orders') {
    return `📋 Últimos pedidos de venta: ${count} registro(s).${moreHint}`;
  }

  if (query.id === 'top-products-by-sales') {
    return `📋 Ranking de productos: ${count} ítem(s).${moreHint}`;
  }

  return `📋 ${query.humanLabel}: ${count} registro(s).${moreHint}`;
}

function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'sin dato';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}