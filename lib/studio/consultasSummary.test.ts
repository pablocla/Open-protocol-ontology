import { describe, it, expect } from 'vitest';
import { buildConsultaSummary } from './consultasSummary';
import type { RecurringQuery } from './recurringQueries';

const debtQuery = {
  id: 'customer-debt-summary',
  humanLabel: 'Deuda del cliente',
} as RecurringQuery;

describe('buildConsultaSummary', () => {
  it('formats customer debt row', () => {
    const summary = buildConsultaSummary(
      debtQuery,
      [{ legalName: 'Acme SA', outstandingBalance: 15000, creditLimit: 50000 }],
      { returnedCount: 1, hasNextPage: false, limit: 50, offset: 0 }
    );
    expect(summary).toContain('Acme SA');
    expect(summary).toContain('Deuda');
  });

  it('mentions more results when paginated', () => {
    const summary = buildConsultaSummary(
      { id: 'orders-count-by-customer', humanLabel: 'Pedidos' } as RecurringQuery,
      [{ id: '1' }],
      { returnedCount: 50, hasNextPage: true, limit: 50, offset: 0 }
    );
    expect(summary).toContain('cargar más');
  });
});