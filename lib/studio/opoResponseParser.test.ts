import { describe, it, expect } from 'vitest';
import { parseOpoResponseFromContent } from './opoResponseParser';

describe('opoResponseParser', () => {
  it('parses standard OpoQueryResponse JSON', () => {
    const content = JSON.stringify({
      data: [{ id: '1' }],
      pagination: {
        hasNextPage: true,
        endCursor: 'abc',
        limit: 50,
        offset: 0,
        returnedCount: 1,
      },
    });
    const parsed = parseOpoResponseFromContent(content);
    expect(parsed?.data).toHaveLength(1);
    expect(parsed?.pagination.hasNextPage).toBe(true);
  });

  it('parses tool result wrapper text', () => {
    const content =
      'Tool execute_query returned: {"data":[{"id":"x"}],"pagination":{"hasNextPage":false,"endCursor":null,"limit":50,"offset":0,"returnedCount":1}}';
    const parsed = parseOpoResponseFromContent(content);
    expect(parsed?.data[0].id).toBe('x');
  });
});