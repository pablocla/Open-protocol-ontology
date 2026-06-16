export interface ParsedOpoResponse {
  data: Record<string, unknown>[];
  pagination: {
    hasNextPage: boolean;
    endCursor: string | null;
    limit: number;
    offset: number;
    returnedCount: number;
  };
  /** OPO query original si estaba embebida en meta */
  sourceQuery?: Record<string, unknown>;
}

function tryParseJsonObject(text: string): ParsedOpoResponse | null {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    const lines = clean.split('\n');
    if (lines[0].startsWith('```')) lines.shift();
    if (lines[lines.length - 1] === '```') lines.pop();
    clean = lines.join('\n').trim();
  }

  const candidates: string[] = [clean];

  const toolMatch = clean.match(/Tool \w+ returned:\s*(\{[\s\S]*\})/);
  if (toolMatch) candidates.unshift(toolMatch[1]);

  const jsonStart = clean.indexOf('{"data"');
  if (jsonStart >= 0) candidates.push(clean.slice(jsonStart));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && Array.isArray(parsed.data) && parsed.pagination) {
        return parsed as ParsedOpoResponse;
      }
      if (parsed?.data?.data && Array.isArray(parsed.data.data) && parsed.data.pagination) {
        return {
          data: parsed.data.data,
          pagination: parsed.data.pagination,
          sourceQuery: parsed.sourceQuery,
        } as ParsedOpoResponse;
      }
    } catch {
      // next candidate
    }
  }

  return null;
}

export function parseOpoResponseFromContent(content: string): ParsedOpoResponse | null {
  const direct = tryParseJsonObject(content);
  if (direct) return direct;

  if (content.trim().startsWith('[')) {
    try {
      const arr = JSON.parse(content.trim());
      if (Array.isArray(arr) && arr.length && typeof arr[0] === 'object') {
        return {
          data: arr,
          pagination: {
            hasNextPage: false,
            endCursor: null,
            limit: arr.length,
            offset: 0,
            returnedCount: arr.length,
          },
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function serializeOpoResponse(response: ParsedOpoResponse): string {
  return JSON.stringify(
    {
      data: response.data,
      pagination: response.pagination,
      ...(response.sourceQuery ? { sourceQuery: response.sourceQuery } : {}),
    },
    null,
    2
  );
}