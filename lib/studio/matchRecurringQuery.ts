import {
  RecurringQuery,
  getRecurringQueriesForContext,
} from '@/lib/studio/recurringQueries';

/** Score mínimo para ejecutar consulta directa (sin Swarm completo). */
export const DIRECT_QUERY_SCORE_THRESHOLD = 8;

export interface MatchedRecurringQuery {
  query: RecurringQuery;
  paramValues: Record<string, string>;
  score: number;
}

export function shouldUseDirectQuery(match: MatchedRecurringQuery | null): match is MatchedRecurringQuery {
  return match !== null && match.score >= DIRECT_QUERY_SCORE_THRESHOLD;
}

function extractParamValues(
  rawQuery: string,
  query: RecurringQuery
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const p of query.params) {
    values[p.key] = p.defaultValue;
  }

  const normalized = rawQuery.toLowerCase();

  if (query.params.some((p) => p.key === 'customerId')) {
    const patterns = [
      /cliente\s+([0-9]{4,12})/i,
      /customer\s+([0-9]{4,12})/i,
      /\b([0-9]{6})\b/,
    ];
    for (const re of patterns) {
      const m = rawQuery.match(re);
      if (m?.[1]) {
        values.customerId = m[1];
        break;
      }
    }
  }

  if (normalized.includes('últim') || normalized.includes('ultim') || normalized.includes('recient')) {
    if (query.id === 'recent-sales-orders') {
      return values;
    }
  }

  return values;
}

function scoreQuery(rawQuery: string, query: RecurringQuery): number {
  const normalized = rawQuery.toLowerCase();
  let score = 0;

  if (normalized.includes(query.humanLabel.toLowerCase())) score += 8;
  if (normalized.includes(query.id.replace(/-/g, ' '))) score += 4;

  for (const example of query.utteranceExamples) {
    const ex = example.toLowerCase();
    const tokens = ex.split(/\s+/).filter((t) => t.length > 3);
    const hits = tokens.filter((t) => normalized.includes(t)).length;
    if (hits >= Math.min(3, tokens.length)) score += 6;
    if (normalized.includes(ex)) score += 10;
  }

  const keywordMap: Record<string, string[]> = {
    'customer-debt-summary': ['deuda', 'debe', 'saldo', 'deudor', 'cobranza', 'crédito', 'credito'],
    'orders-count-by-customer': ['pedido', 'pedidos', 'orden', 'órdenes', 'ordenes'],
    'recent-sales-orders': ['últimos', 'ultimos', 'recientes', 'listado'],
    'open-invoices-by-customer': ['factura', 'facturas', 'invoice'],
    'top-products-by-sales': ['producto', 'productos', 'más vendido', 'mas vendido'],
  };

  const keywords = keywordMap[query.id] || [];
  for (const kw of keywords) {
    if (normalized.includes(kw)) score += 3;
  }

  return score;
}

export function matchRecurringQueryFromText(
  rawQuery: string,
  ontology?: { entities?: Array<{ name?: string; originalTable?: string }> },
  projectName?: string | null
): MatchedRecurringQuery | null {
  const catalog = getRecurringQueriesForContext(ontology, projectName);
  let best: MatchedRecurringQuery | null = null;

  for (const query of catalog) {
    const score = scoreQuery(rawQuery, query);
    if (score < 4) continue;
    const candidate: MatchedRecurringQuery = {
      query,
      paramValues: extractParamValues(rawQuery, query),
      score,
    };
    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }

  return best;
}