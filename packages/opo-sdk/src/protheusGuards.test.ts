import { describe, it, expect } from 'vitest';
import {
  buildProtheusTableGuards,
  isProtheusTableExclusive,
  resolvePhysicalTableName,
} from './protheusGuards';
import { translateOpoToSql, translateOpoMutationToSql } from './translator';

const protheusCustomerDict = {
  Customer: {
    entity: 'Customer',
    sourceType: 'SQL',
    tableName: 'SA1010',
    protheus: {
      x2Modo: 'E',
      filialField: 'A1_FILIAL',
      companySuffix: '010',
      physicalTableName: 'SA1010',
    },
    mutationPolicy: { readOnly: true, strategy: 'rest' as const },
    fields: {
      customerCode: { column: 'A1_COD', type: 'string' },
      legalName: { column: 'A1_NOME', type: 'string' },
    },
  },
};

describe('protheusGuards', () => {
  it('treats X2_MODO C/2 as shared (no filial required)', () => {
    expect(isProtheusTableExclusive('C')).toBe(false);
    expect(isProtheusTableExclusive('2')).toBe(false);
    expect(isProtheusTableExclusive('E')).toBe(true);
  });

  it('appends company suffix to logical table names', () => {
    expect(resolvePhysicalTableName('SA1', '010')).toBe('SA1010');
    expect(resolvePhysicalTableName('SA1010', '010')).toBe('SA1010');
  });

  it('requires filial for exclusive Protheus tables', () => {
    expect(() =>
      buildProtheusTableGuards('SA1010', { x2Modo: 'E', filialField: 'A1_FILIAL' }, { erp: 'protheus' })
    ).toThrow(/filial is required/);
  });
});

describe('translateOpoToSql Protheus', () => {
  it('injects D_E_L_E_T_ and filial for exclusive tables', () => {
    const { sql, params } = translateOpoToSql(
      {
        entity: 'Customer',
        context: { erp: 'protheus', filial: '01' },
        filter: { customerCode: { eq: '000219' } },
      },
      protheusCustomerDict
    );

    expect(sql).toContain('SA1010.D_E_L_E_T_ = ?');
    expect(sql).toContain('SA1010.A1_FILIAL = ?');
    expect(sql).toContain('A1_COD = ?');
    expect(params).toContain(' ');
    expect(params).toContain('01');
    expect(params).toContain('000219');
  });

  it('blocks SQL mutations when readOnly', () => {
    expect(() =>
      translateOpoMutationToSql(
        {
          entity: 'Customer',
          action: 'CREATE',
          payload: { customerCode: 'X' },
          context: { erp: 'protheus', filial: '01' },
        },
        protheusCustomerDict
      )
    ).toThrow(/read-only/i);
  });

  it('uses soft-delete UPDATE instead of DELETE for Protheus', () => {
    const dict = {
      Customer: {
        ...protheusCustomerDict.Customer,
        mutationPolicy: { readOnly: false, strategy: 'sql' as const },
      },
    };
    const { sql, params } = translateOpoMutationToSql(
      {
        entity: 'Customer',
        action: 'DELETE',
        filter: { customerCode: { eq: '000219' } },
        context: { erp: 'protheus', filial: '01' },
      },
      dict
    );
    expect(sql).toContain("SET D_E_L_E_T_ = ?");
    expect(sql).not.toContain('DELETE FROM');
    expect(params).toContain('*');
  });
});