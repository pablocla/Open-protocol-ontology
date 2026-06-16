/**
 * Generador determinista de filas mock para consultas Protheus en Studio (sin BD live).
 * Produce suficientes filas para demostrar paginación (hasNextPage).
 */

const CUSTOMER_NAMES: Record<string, string> = {
  '000219': 'Distribuidora Sol S.A.',
  '000220': 'Comercial Norte Ltda.',
  '000221': 'Industrias Delta',
};

function padOrder(n: number): string {
  return String(n).padStart(6, '0');
}

export function generateMockRowsForQuery(
  opoQuery: Record<string, unknown>,
  offset: number,
  fetchLimit: number
): Record<string, unknown>[] {
  const entity = String(opoQuery.entity || '');
  const filter = (opoQuery.filter || {}) as Record<string, unknown>;
  const customerId =
    (filter.customerId as { eq?: string })?.eq ||
    (filter.id as { eq?: string })?.eq ||
    '000219';
  const orderId = (filter.orderId as { eq?: string })?.eq || '000001';

  const totalPool = entity === 'Customer' ? 1 : 73;

  const rows: Record<string, unknown>[] = [];

  for (let i = 0; i < fetchLimit; i++) {
    const globalIdx = offset + i;
    if (globalIdx >= totalPool) break;

    switch (entity) {
      case 'Customer':
        rows.push({
          id: customerId,
          legalName: CUSTOMER_NAMES[customerId] || `Cliente ${customerId}`,
          tradeName: `CLI ${customerId}`,
          partyId: '30123456789012',
          outstandingBalance: 45230.5 + globalIdx * 100,
          creditLimit: 120000,
          active: true,
        });
        break;

      case 'SalesOrderHeader':
        rows.push({
          id: padOrder(1000 + globalIdx),
          customerId,
          issueDate: `2026-0${(globalIdx % 6) + 1}-15`,
          totalAmount: 1500 + globalIdx * 250.75,
          paymentTerms: '030',
        });
        break;

      case 'SalesOrderItem':
        rows.push({
          orderId,
          lineNumber: String((globalIdx % 20) + 1).padStart(2, '0'),
          productId: `PROD${String(globalIdx % 50).padStart(4, '0')}`,
          quantity: (globalIdx % 10) + 1,
          unitPrice: 99.9 + globalIdx,
        });
        break;

      case 'SalesInvoiceHeader':
        rows.push({
          number: String(900000 + globalIdx),
          customerId,
          issueDate: `2026-0${(globalIdx % 6) + 1}-20`,
          grandTotal: 3200 + globalIdx * 180,
        });
        break;

      default:
        rows.push({
          id: `row-${globalIdx}`,
          entity,
          index: globalIdx,
        });
    }
  }

  return rows;
}