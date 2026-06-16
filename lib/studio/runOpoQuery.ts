import {
  buildOpoQueryFromTemplate,
  buildProtheusQueryDictionary,
  getRecurringQueriesForContext,
  isProtheusOntology,
} from '@/lib/studio/recurringQueries';
import { generateMockRowsForQuery } from '@/lib/studio/protheusMockRows';
import { executeParameterizedSql } from '@/lib/studio/sqlExecutor';
import { isConnectionAllowed } from '@/lib/studio/connectionGuard';
import { detectDriverFromUrl } from '@/lib/mesh/adapters/totvs/protheusDbClient';
import { translateOpoToSql, buildPaginatedResponse, OpoSystemContext } from 'opo-sdk';

export interface ErpExecutionContext {
  mode?: 'mock' | 'live';
  connectionString?: string;
  filial?: string;
  companySuffix?: string;
  dialect?: string;
  context?: {
    erp?: string;
    filial?: string;
    companySuffix?: string;
    dialect?: string;
  };
}

export interface RunOpoQueryInput {
  opoQuery: Record<string, unknown>;
  ontology?: { entities?: Array<{ name?: string; originalTable?: string }> };
  projectName?: string | null;
  queryId?: string | null;
  erpExecution?: ErpExecutionContext;
}

export interface RunOpoQueryResult {
  data: Record<string, unknown>[];
  pagination: {
    hasNextPage: boolean;
    endCursor: string | null;
    limit: number;
    offset: number;
    returnedCount: number;
  };
  meta: {
    mode: 'mock' | 'live' | 'translate-only';
    sql?: string;
    queryId?: string | null;
    driver?: string;
    message?: string;
  };
}

export async function runOpoQuery(input: RunOpoQueryInput): Promise<RunOpoQueryResult> {
  const {
    opoQuery: rawOpoQuery,
    ontology,
    projectName,
    queryId = null,
    erpExecution = {},
  } = input;

  const opoQuery = { ...rawOpoQuery };
  const mode = erpExecution.mode ?? 'mock';
  const connectionString = erpExecution.connectionString?.trim();

  const mergedContext: Record<string, unknown> = {
    ...(opoQuery.context as object),
    ...(erpExecution.context && typeof erpExecution.context === 'object' ? erpExecution.context : {}),
  };

  if (erpExecution.filial && !mergedContext.filial) {
    mergedContext.filial = erpExecution.filial;
    mergedContext.erp = mergedContext.erp ?? 'protheus';
  }
  if (erpExecution.companySuffix && !mergedContext.companySuffix) {
    mergedContext.companySuffix = erpExecution.companySuffix;
  }
  if (erpExecution.dialect && !mergedContext.dialect) {
    mergedContext.dialect = erpExecution.dialect;
  }

  if (Object.keys(mergedContext).length > 0) {
    opoQuery.context = mergedContext;
  }

  const useProtheus = isProtheusOntology(ontology, projectName);
  const dictionary = useProtheus ? buildProtheusQueryDictionary() : {};

  if (useProtheus && mode === 'live' && !mergedContext.filial) {
    throw new Error(
      'Filial requerida para consultas Protheus en vivo. Configurala en el onboarding o en Ajustes del workspace.'
    );
  }

  if (useProtheus && !mergedContext.dialect) {
    mergedContext.dialect = 'mssql';
    opoQuery.context = mergedContext;
  }

  let sql: string | undefined;
  let sqlParams: unknown[] = [];
  let translatedPagination;

  const translated = translateOpoToSql(opoQuery, dictionary, {
    context: mergedContext as OpoSystemContext,
  });
  sql = translated.sql;
  sqlParams = translated.params ?? [];
  translatedPagination = translated.pagination;

  const resolved = translatedPagination || {
    limit: 50,
    offset: 0,
    fetchLimit: 51,
    appliedDefault: true,
  };

  if (mode === 'mock' || !sql) {
    const rows = generateMockRowsForQuery(opoQuery, resolved.offset, resolved.fetchLimit);
    const response = buildPaginatedResponse(rows, resolved);
    return {
      data: response.data as Record<string, unknown>[],
      pagination: response.pagination,
      meta: {
        mode: 'mock',
        sql,
        queryId,
      },
    };
  }

  if (!connectionString) {
    throw new Error(
      'Modo en vivo requiere connectionString. Conectá tu ERP en el onboarding o configurá la conexión del workspace.'
    );
  }

  const driver = detectDriverFromUrl(connectionString);
  if (!isConnectionAllowed(connectionString, driver)) {
    throw new Error(
      'Destino de conexión no permitido. Configurá OPO_ALLOWED_DB_HOSTS o usá localhost/servidores aprobados.'
    );
  }

  const { rows } = await executeParameterizedSql({
    connectionString,
    sql,
    params: sqlParams,
    driver,
  });

  const response = buildPaginatedResponse(rows, resolved);
  return {
    data: response.data as Record<string, unknown>[],
    pagination: response.pagination,
    meta: {
      mode: 'live',
      sql,
      queryId,
      driver,
    },
  };
}

export async function runOpoQueryById(
  queryId: string,
  paramValues: Record<string, string> | undefined,
  ontology: RunOpoQueryInput['ontology'],
  projectName: string | null | undefined,
  erpExecution?: ErpExecutionContext,
  pagination?: { cursor?: string | null; limit?: number }
): Promise<RunOpoQueryResult> {
  const catalog = getRecurringQueriesForContext(ontology, projectName);
  const template = catalog.find((q) => q.id === queryId);
  if (!template) {
    throw new Error(`Recurring query '${queryId}' not found`);
  }
  const opoQuery = buildOpoQueryFromTemplate(template, paramValues, pagination);
  return runOpoQuery({
    opoQuery,
    ontology,
    projectName,
    queryId,
    erpExecution,
  });
}