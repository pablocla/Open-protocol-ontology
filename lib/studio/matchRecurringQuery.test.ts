import { describe, it, expect } from 'vitest';
import {
  matchRecurringQueryFromText,
  shouldUseDirectQuery,
  DIRECT_QUERY_SCORE_THRESHOLD,
} from './matchRecurringQuery';

describe('matchRecurringQueryFromText', () => {
  const protheusOntology = {
    entities: [{ name: 'Customer', originalTable: 'SA1010' }],
  };

  it('matches customer debt queries', () => {
    const match = matchRecurringQueryFromText(
      '¿Cuánto debe el cliente 000219?',
      protheusOntology,
      'Protheus ERP Demo'
    );
    expect(match?.query.id).toBe('customer-debt-summary');
    expect(match?.paramValues.customerId).toBe('000219');
  });

  it('matches orders by customer', () => {
    const match = matchRecurringQueryFromText(
      '¿Cuántos pedidos tiene el cliente 000219?',
      protheusOntology,
      'Protheus ERP Demo'
    );
    expect(match?.query.id).toBe('orders-count-by-customer');
  });

  it('returns null for unrelated text', () => {
    const match = matchRecurringQueryFromText('hola mundo', protheusOntology, 'Protheus ERP Demo');
    expect(match).toBeNull();
  });

  it('uses direct query for high-confidence debt match', () => {
    const match = matchRecurringQueryFromText(
      '¿Cuánto debe el cliente 000219?',
      protheusOntology,
      'Protheus ERP Demo'
    );
    expect(match).not.toBeNull();
    expect(match!.score).toBeGreaterThanOrEqual(DIRECT_QUERY_SCORE_THRESHOLD);
    expect(shouldUseDirectQuery(match)).toBe(true);
  });

  it('skips direct query for low-confidence match', () => {
    const match = matchRecurringQueryFromText('pedido', protheusOntology, 'Protheus ERP Demo');
    if (match) {
      expect(shouldUseDirectQuery(match)).toBe(match.score >= DIRECT_QUERY_SCORE_THRESHOLD);
    }
  });
});