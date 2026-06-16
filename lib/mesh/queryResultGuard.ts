const DEFAULT_QUERY_LIMIT = 50;
const MAX_QUERY_LIMIT = 100;
const MAX_LLM_PAYLOAD_CHARS = 12000;

function truncateRows(rows: unknown[], maxRows: number = MAX_QUERY_LIMIT) {
  if (!Array.isArray(rows)) return { data: [] as unknown[], truncated: false, totalFetched: 0 };
  if (rows.length <= maxRows) return { data: rows, truncated: false, totalFetched: rows.length };
  return { data: rows.slice(0, maxRows), truncated: true, totalFetched: rows.length };
}

/** Shrink tool/MCP payloads before they enter LLM prompts */
export function sanitizeMeshToolResult(result: unknown): string {
  const normalized = normalizeToolResult(result);
  const text = JSON.stringify(normalized);
  if (text.length <= MAX_LLM_PAYLOAD_CHARS) return text;
  return `${text.slice(0, MAX_LLM_PAYLOAD_CHARS)}\n...[truncated ${text.length - MAX_LLM_PAYLOAD_CHARS} chars for LLM context]`;
}

function normalizeToolResult(result: unknown): unknown {
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;

    if (Array.isArray(obj.data) && obj.pagination) {
      return obj;
    }

    if (obj.status === 'success' && obj.data !== undefined) {
      return normalizeToolResult(obj.data);
    }

    if (Array.isArray(obj.rows)) {
      const { data, truncated, totalFetched } = truncateRows(obj.rows);
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
    const { data, truncated, totalFetched } = truncateRows(result);
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

export { DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT };