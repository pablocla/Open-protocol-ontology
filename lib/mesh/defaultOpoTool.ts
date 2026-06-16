import { ToolDefinition } from './meshTypes';

export const OPO_STUDIO_QUERY_TOOL_ID = 'opo-studio-query';

export const DEFAULT_OPO_QUERY_TOOL: ToolDefinition = {
  id: OPO_STUDIO_QUERY_TOOL_ID,
  name: 'OPO Studio Query Engine',
  type: 'opo_internal',
  endpoint: 'internal://opo-studio/execute-query',
  entities: [
    'Customer',
    'Supplier',
    'Product',
    'SalesOrderHeader',
    'SalesOrderItem',
    'SalesInvoiceHeader',
    'PurchaseInvoiceHeader',
  ],
  operations: [
    {
      name: 'execute_query',
      description:
        'Execute an OPO-QL query against the connected ERP. Pass { query: { entity, select, filter, ... } } or { queryId, params }.',
      entityTarget: '*',
      inputSchema: {
        query: { type: 'object', description: 'OPO-QL query object with entity field' },
        queryId: { type: 'string', description: 'Recurring query catalog id' },
        params: { type: 'object', description: 'Parameter values for recurring query templates' },
      },
    },
  ],
};