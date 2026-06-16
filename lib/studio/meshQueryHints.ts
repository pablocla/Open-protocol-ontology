const BUSINESS_TERMS =
  /cliente|pedido|factura|deuda|saldo|producto|inventario|proveedor|cobranza|stock|erp/i;
const QUERY_INTENT =
  /cuánto|cuantos|cuánta|cuanta|listar|mostrar|consulta|reporte|debe|saldo|últim|ultim|buscar/i;

export function suggestsMeshDataQuery(text: string): boolean {
  const normalized = text.trim();
  if (normalized.length < 8) return false;
  return BUSINESS_TERMS.test(normalized) && QUERY_INTENT.test(normalized);
}