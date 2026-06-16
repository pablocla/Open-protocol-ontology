import {
  translateOpoToSql as sdkTranslateOpoToSql,
  translateOpoMutationToSql as sdkTranslateOpoMutationToSql,
  type Dictionary as SdkDictionary,
  type OpoMapping,
  type OpoField,
  type OpoSystemContext,
  type TranslateOpoToSqlOptions,
} from 'opo-sdk';

export interface Dictionary {
  [entityName: string]: {
    tableName: string;
    fields: { [semanticField: string]: string | OpoField };
    joins?: {
      [relationName: string]: {
        tableName: string;
        on: string;
        conditionSql?: string;
        protheus?: OpoMapping['protheus'];
      };
    };
    protheus?: OpoMapping['protheus'];
    mutationPolicy?: OpoMapping['mutationPolicy'];
    entity?: string;
    sourceType?: string;
    security?: OpoMapping['security'];
  };
}

function normalizeDictionary(dict: Dictionary): SdkDictionary {
  const normalized: SdkDictionary = {};

  for (const [entityName, entry] of Object.entries(dict)) {
    const fields: Record<string, OpoField> = {};
    for (const [key, value] of Object.entries(entry.fields)) {
      fields[key] =
        typeof value === 'string' ? { column: value, type: 'string' } : value;
    }

    normalized[entityName] = {
      entity: entry.entity ?? entityName,
      sourceType: entry.sourceType ?? 'SQL',
      tableName: entry.tableName,
      fields,
      joins: entry.joins,
      protheus: entry.protheus,
      mutationPolicy: entry.mutationPolicy,
      security: entry.security,
    };
  }

  return normalized;
}

export function translateOpoToSql(
  opoQuery: any,
  dictionary: Dictionary,
  options?: TranslateOpoToSqlOptions
) {
  return sdkTranslateOpoToSql(opoQuery, normalizeDictionary(dictionary), options);
}

export function translateOpoMutationToSql(
  opoMutation: any,
  dictionary: Dictionary,
  options?: TranslateOpoToSqlOptions
) {
  return sdkTranslateOpoMutationToSql(
    opoMutation,
    normalizeDictionary(dictionary),
    options
  );
}

export type { OpoSystemContext, TranslateOpoToSqlOptions };