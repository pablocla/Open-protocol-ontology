import { describe, it, expect } from 'vitest';
import { translateOpoToSql } from 'opo-sdk';
import {
  applyQueryParams,
  buildMeshPromptFromQuery,
  buildOpoQueryFromTemplate,
  buildProtheusQueryDictionary,
  formatRecurringQueriesForLLM,
  getRecurringQueriesForContext,
  isProtheusOntology,
  PROTHEUS_RECURRING_QUERIES,
} from './recurringQueries';

describe('recurringQueries', () => {
  it('detects Protheus ontology from entity names', () => {
    expect(
      isProtheusOntology({
        entities: [{ name: 'Customer' }, { name: 'SalesOrderHeader' }],
      })
    ).toBe(true);
  });

  it('returns Protheus catalog for Protheus projects', () => {
    const queries = getRecurringQueriesForContext(
      { entities: [{ name: 'SalesOrderHeader' }, { name: 'Customer' }] },
      'totvs-protheus-demo'
    );
    expect(queries.length).toBeGreaterThan(3);
    expect(queries[0].id).toBe(PROTHEUS_RECURRING_QUERIES[0].id);
  });

  it('substitutes params in mesh prompt and OPO template', () => {
    const q = PROTHEUS_RECURRING_QUERIES[0];
    const prompt = buildMeshPromptFromQuery(q, { customerId: '000999' });
    expect(prompt).toContain('000999');

    const opo = buildOpoQueryFromTemplate(q, { customerId: '000999' }) as Record<string, unknown>;
    const filter = opo.filter as Record<string, { eq: string }>;
    expect(filter.customerId.eq).toBe('000999');
  });

  it('applyQueryParams handles nested objects', () => {
    const out = applyQueryParams(
      { filter: { customerId: { eq: '{customerId}' } } },
      { customerId: 'ABC' }
    ) as Record<string, { customerId: { eq: string } }>;
    expect(out.filter.customerId.eq).toBe('ABC');
  });

  it('formatRecurringQueriesForLLM includes human labels and templates', () => {
    const text = formatRecurringQueriesForLLM(PROTHEUS_RECURRING_QUERIES.slice(0, 2));
    expect(text).toContain('Consultas recurrentes');
    expect(text).toContain('Pedidos por cliente');
    expect(text).toContain('SalesOrderHeader');
  });

  it('buildProtheusQueryDictionary injects D_E_L_E_T_ and filial in SQL', () => {
    const dict = buildProtheusQueryDictionary();
    const { sql, params } = translateOpoToSql(
      {
        entity: 'Customer',
        context: { erp: 'protheus', filial: '01' },
        filter: { legalName: { like: '%ACME%' } },
      },
      dict
    );
    expect(sql).toContain('SA1010.D_E_L_E_T_ = ?');
    expect(sql).toContain('SA1010.A1_FILIAL = ?');
    expect(params).toContain(' ');
    expect(params).toContain('01');
    expect(params).toContain('%ACME%');
  });
});