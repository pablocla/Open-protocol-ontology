import { describe, it, expect } from 'vitest';
import { sanitizeMeshToolResult } from './queryResultGuard';

describe('sanitizeMeshToolResult', () => {
  it('passes through OpoQueryResponse shape unchanged in size', () => {
    const payload = {
      data: [{ id: '1' }],
      pagination: { hasNextPage: false, endCursor: null, limit: 50, offset: 0, returnedCount: 1 },
    };
    const out = sanitizeMeshToolResult(payload);
    expect(out).toContain('"hasNextPage":false');
  });

  it('truncates huge runtime arrays', () => {
    const payload = {
      status: 'success',
      data: Array.from({ length: 250 }, (_, i) => ({ n: i })),
    };
    const out = sanitizeMeshToolResult(payload);
    const parsed = JSON.parse(out);
    expect(parsed.data.length).toBe(100);
    expect(parsed.meta.message).toContain('Truncated');
  });
});