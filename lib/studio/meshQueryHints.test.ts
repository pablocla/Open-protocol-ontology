import { describe, it, expect } from 'vitest';
import { suggestsMeshDataQuery } from './meshQueryHints';

describe('suggestsMeshDataQuery', () => {
  it('detects ERP data questions', () => {
    expect(suggestsMeshDataQuery('¿Cuánto debe el cliente 000219?')).toBe(true);
    expect(suggestsMeshDataQuery('Listar pedidos del cliente')).toBe(true);
  });

  it('ignores generic chat', () => {
    expect(suggestsMeshDataQuery('hola')).toBe(false);
    expect(suggestsMeshDataQuery('explicame qué hace este nodo')).toBe(false);
  });
});