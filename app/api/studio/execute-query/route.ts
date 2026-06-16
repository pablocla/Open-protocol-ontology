import { NextResponse } from 'next/server';
import { buildOpoQueryFromTemplate, getRecurringQueriesForContext } from '@/lib/studio/recurringQueries';
import { runOpoQuery, type ErpExecutionContext } from '@/lib/studio/runOpoQuery';

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
      context,
      filial,
      companySuffix,
      connectionString,
      dialect,
    } = body;

    const erpExecution: ErpExecutionContext = {
      mode: mode === 'live' ? 'live' : 'mock',
      connectionString: connectionString?.trim() || undefined,
      filial,
      companySuffix,
      dialect,
      context: context && typeof context === 'object' ? context : undefined,
    };

    if (queryId) {
      const catalog = getRecurringQueriesForContext(ontology, projectName);
      const template = catalog.find((q) => q.id === queryId);
      if (!template) {
        return NextResponse.json({ error: `Recurring query '${queryId}' not found` }, { status: 404 });
      }
      const opoQuery = buildOpoQueryFromTemplate(template, paramValues, pagination);
      const result = await runOpoQuery({
        opoQuery,
        ontology,
        projectName,
        queryId,
        erpExecution,
      });
      return NextResponse.json({
        data: result.data,
        pagination: result.pagination,
        meta: result.meta,
      });
    }

    if (!rawQuery || typeof rawQuery !== 'object') {
      return NextResponse.json({ error: 'Provide query (OPO-QL object) or queryId' }, { status: 400 });
    }

    const opoQuery = { ...rawQuery } as Record<string, unknown>;
    if (pagination?.cursor) {
      opoQuery.pagination = {
        ...(opoQuery.pagination as object),
        cursor: pagination.cursor,
      };
    }

    if (!opoQuery.entity) {
      return NextResponse.json({ error: 'OPO query must include entity' }, { status: 400 });
    }

    const result = await runOpoQuery({
      opoQuery,
      ontology,
      projectName,
      erpExecution,
    });

    return NextResponse.json({
      data: result.data,
      pagination: result.pagination,
      meta: result.meta,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Execute query failed';
    const status =
      message.includes('Filial requerida') ||
      message.includes('connectionString') ||
      message.includes('not found in mapping')
        ? 422
        : message.includes('no permitido')
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}