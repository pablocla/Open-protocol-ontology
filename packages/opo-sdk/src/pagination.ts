/** Defaults aligned with public/schemas/OpoQuery.json */
export const DEFAULT_QUERY_LIMIT = 50;
export const MAX_QUERY_LIMIT = 100;

export interface ResolvedPagination {
  limit: number;
  offset: number;
  /** limit + 1 — used to detect hasNextPage without a second query */
  fetchLimit: number;
  appliedDefault: boolean;
}

export interface OpoQueryResponse<T = Record<string, unknown>> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    endCursor: string | null;
    limit: number;
    offset: number;
    returnedCount: number;
    truncated?: boolean;
    totalFetched?: number;
  };
  meta?: {
    message?: string;
  };
}

/** Unwrap `{ query: { entity, ... } }` envelopes from OpoQuery.json */
export function normalizeOpoQueryPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const p = payload as Record<string, unknown>;
  if (p.query && typeof p.query === 'object') {
    const q = { ...(p.query as Record<string, unknown>) };
    if (!q.entity && p.entity) q.entity = p.entity;
    return q;
  }
  return p;
}

export function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset }), 'utf8').toString('base64url');
}

export function decodeCursor(cursor?: string | null): number {
  if (!cursor || typeof cursor !== 'string') return 0;
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { o?: number; offset?: number };
    const o = Number(parsed?.o ?? parsed?.offset ?? 0);
    return Number.isFinite(o) && o >= 0 ? Math.floor(o) : 0;
  } catch {
    return 0;
  }
}

export function resolvePagination(opoQuery: Record<string, unknown>): ResolvedPagination {
  const pagination = opoQuery.pagination as Record<string, unknown> | undefined;
  const rawLimit = opoQuery.limit ?? pagination?.limit;
  const appliedDefault = rawLimit === undefined || rawLimit === null;

  let limit = appliedDefault ? DEFAULT_QUERY_LIMIT : Number(rawLimit);
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_QUERY_LIMIT;
  limit = Math.min(Math.floor(limit), MAX_QUERY_LIMIT);

  const offset = decodeCursor(pagination?.cursor as string | undefined);

  return {
    limit,
    offset,
    fetchLimit: limit + 1,
    appliedDefault,
  };
}

export function buildPaginatedResponse<T>(
  rows: T[],
  resolved: ResolvedPagination
): OpoQueryResponse<T> {
  const hasNextPage = rows.length > resolved.limit;
  const data = hasNextPage ? rows.slice(0, resolved.limit) : rows;

  return {
    data,
    pagination: {
      hasNextPage,
      endCursor: hasNextPage ? encodeCursor(resolved.offset + resolved.limit) : null,
      limit: resolved.limit,
      offset: resolved.offset,
      returnedCount: data.length,
    },
    meta: resolved.appliedDefault
      ? { message: `Default pagination limit ${DEFAULT_QUERY_LIMIT} applied (max ${MAX_QUERY_LIMIT}).` }
      : undefined,
  };
}

/** Safety net when raw row arrays reach an LLM context */
export function truncateRowsForLLM(
  rows: unknown[],
  maxRows: number = MAX_QUERY_LIMIT
): { data: unknown[]; truncated: boolean; totalFetched: number } {
  if (!Array.isArray(rows)) {
    return { data: [], truncated: false, totalFetched: 0 };
  }
  if (rows.length <= maxRows) {
    return { data: rows, truncated: false, totalFetched: rows.length };
  }
  return {
    data: rows.slice(0, maxRows),
    truncated: true,
    totalFetched: rows.length,
  };
}

export function truncatePayloadForLLM(payload: unknown, maxChars: number = 12000): string {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated ${text.length - maxChars} chars for LLM context]`;
}

/** Normalize MCP/runtime tool payloads before injecting into agent prompts */
export function sanitizeToolResultForLLM(result: unknown): unknown {
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;

    if (Array.isArray(obj.data) && obj.pagination && typeof obj.pagination === 'object') {
      return obj;
    }

    if (obj.status === 'success' && obj.data !== undefined) {
      return sanitizeToolResultForLLM(obj.data);
    }

    if (Array.isArray(obj.rows)) {
      const { data, truncated, totalFetched } = truncateRowsForLLM(obj.rows);
      return truncated
        ? {
            data,
            pagination: { truncated: true, totalFetched, returnedCount: data.length },
            meta: { message: `Truncated to ${data.length} of ${totalFetched} rows for LLM context.` },
          }
        : { data };
    }
  }

  if (Array.isArray(result)) {
    const { data, truncated, totalFetched } = truncateRowsForLLM(result);
    return truncated
      ? {
          data,
          pagination: { truncated: true, totalFetched, returnedCount: data.length },
          meta: { message: `Truncated to ${data.length} of ${totalFetched} rows for LLM context.` },
        }
      : { data };
  }

  return result;
}