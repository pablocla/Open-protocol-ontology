import { describe, it, expect } from 'vitest';
import {
  resolvePagination,
  encodeCursor,
  decodeCursor,
  buildPaginatedResponse,
  normalizeOpoQueryPayload,
  sanitizeToolResultForLLM,
  DEFAULT_QUERY_LIMIT,
  MAX_QUERY_LIMIT,
} from './pagination';
import { translateOpoToSql } from './translator';

const dictionary = {
  Customer: {
    entity: 'Customer',
    sourceType: 'SQL',
    tableName: 'SA1',
    fields: {
      id: { column: 'A1_COD', type: 'string' },
      legalName: { column: 'A1_NOME', type: 'string' },
    },
  },
};

describe('OPO pagination', () => {
  it('applies default LIMIT 50 when query has no pagination', () => {
    const p = resolvePagination({ entity: 'Customer' });
    expect(p.limit).toBe(DEFAULT_QUERY_LIMIT);
    expect(p.appliedDefault).toBe(true);
    expect(p.fetchLimit).toBe(DEFAULT_QUERY_LIMIT + 1);
  });

  it('caps explicit limit at MAX_QUERY_LIMIT', () => {
    const p = resolvePagination({ entity: 'Customer', pagination: { limit: 500 } });
    expect(p.limit).toBe(MAX_QUERY_LIMIT);
    expect(p.fetchLimit).toBe(MAX_QUERY_LIMIT + 1);
  });

  it('decodes cursor offset for OFFSET clause', () => {
    const cursor = encodeCursor(50);
    expect(decodeCursor(cursor)).toBe(50);
    const { sql, pagination } = translateOpoToSql(
      { entity: 'Customer', pagination: { limit: 25, cursor } },
      dictionary
    );
    expect(sql).toContain('LIMIT 26');
    expect(sql).toContain('OFFSET 50');
    expect(pagination.offset).toBe(50);
  });

  it('buildPaginatedResponse trims extra probe row and sets hasNextPage', () => {
    const resolved = resolvePagination({ entity: 'Customer', pagination: { limit: 2 } });
    const rows = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const response = buildPaginatedResponse(rows, resolved);
    expect(response.data).toHaveLength(2);
    expect(response.pagination.hasNextPage).toBe(true);
    expect(response.pagination.endCursor).toBeTruthy();
  });

  it('unwraps nested OpoQuery envelope', () => {
    const q = normalizeOpoQueryPayload({
      query: { entity: 'Customer', filter: { id: { eq: '1' } } },
    });
    expect(q.entity).toBe('Customer');
  });

  it('sanitizeToolResultForLLM truncates raw arrays', () => {
    const big = Array.from({ length: 200 }, (_, i) => ({ id: i }));
    const sanitized = sanitizeToolResultForLLM(big) as { data: unknown[]; meta?: { message?: string } };
    expect(sanitized.data).toHaveLength(MAX_QUERY_LIMIT);
    expect(sanitized.meta?.message).toContain('Truncated');
  });
});