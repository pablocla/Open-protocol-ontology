import { NextResponse } from 'next/server';
import {
  buildOpoQueryFromTemplate,
  buildProtheusQueryDictionary,
  getRecurringQueriesForContext,
  isProtheusOntology,
} from '@/lib/studio/recurringQueries';
import { generateMockRowsForQuery } from '@/lib/studio/protheusMockRows';
import { translateOpoToSql, buildPaginatedResponse } from 'opo-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      query: rawQuery,
      queryId,
      params: paramValues,
      pagination,
      ontology,
      projectName,
      mode = 'mock',
    } = body;

    let opoQuery: Record<string, unknown> | null = null;

    if (queryId) {
      const catalog = getRecurringQueriesForContext(ontology, projectName);
      const template = catalog.find((q) => q.id === queryId);
      if (!template) {
        return NextResponse.json({ error: `Recurring query '${queryId}' not found` }, { status: 404 });
      }
      opoQuery = buildOpoQueryFromTemplate(template, paramValues, pagination);
    } else if (rawQuery && typeof rawQuery === 'object') {
      opoQuery = { ...rawQuery };
      if (pagination?.cursor) {
        opoQuery.pagination = {
          ...(opoQuery.pagination as object),
          cursor: pagination.cursor,
        };
      }
    } else {
      return NextResponse.json({ error: 'Provide query (OPO-QL object) or queryId' }, { status: 400 });
    }

    if (!opoQuery?.entity) {
      return NextResponse.json({ error: 'OPO query must include entity' }, { status: 400 });
    }

    const useProtheus = isProtheusOntology(ontology, projectName);
    const dictionary = useProtheus ? buildProtheusQueryDictionary() : {};

    let sql: string | undefined;
    let translatedPagination;

    try {
      const translated = translateOpoToSql(opoQuery, dictionary);
      sql = translated.sql;
      translatedPagination = translated.pagination;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Translation failed';
      if (mode !== 'mock') {
        return NextResponse.json({ error: message }, { status: 422 });
      }
    }

    if (mode === 'mock' || !sql) {
      const resolved = translatedPagination || {
        limit: 50,
        offset: 0,
        fetchLimit: 51,
        appliedDefault: true,
      };
      const rows = generateMockRowsForQuery(opoQuery, resolved.offset, resolved.fetchLimit);
      const response = buildPaginatedResponse(rows, resolved);

      return NextResponse.json({
        ...response,
        meta: {
          ...(response.meta || {}),
          mode: 'mock',
          sql,
          queryId: queryId || null,
        },
      });
    }

    return NextResponse.json({
      data: [],
      pagination: {
        hasNextPage: false,
        endCursor: null,
        limit: translatedPagination?.limit || 50,
        offset: translatedPagination?.offset || 0,
        returnedCount: 0,
      },
      meta: {
        message: 'SQL generated. Connect a database executor to run live queries.',
        sql,
        mode: 'translate-only',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Execute query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}