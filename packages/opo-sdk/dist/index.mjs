import {
  OpoOntologyBuilder
} from "./chunk-HJU6DO4J.mjs";

// src/pagination.ts
var DEFAULT_QUERY_LIMIT = 50;
var MAX_QUERY_LIMIT = 100;
function normalizeOpoQueryPayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  const p = payload;
  if (p.query && typeof p.query === "object") {
    const q = { ...p.query };
    if (!q.entity && p.entity) q.entity = p.entity;
    return q;
  }
  return p;
}
function encodeCursor(offset) {
  return Buffer.from(JSON.stringify({ o: offset }), "utf8").toString("base64url");
}
function decodeCursor(cursor) {
  if (!cursor || typeof cursor !== "string") return 0;
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    const o = Number(parsed?.o ?? parsed?.offset ?? 0);
    return Number.isFinite(o) && o >= 0 ? Math.floor(o) : 0;
  } catch {
    return 0;
  }
}
function resolvePagination(opoQuery) {
  const pagination = opoQuery.pagination;
  const rawLimit = opoQuery.limit ?? pagination?.limit;
  const appliedDefault = rawLimit === void 0 || rawLimit === null;
  let limit = appliedDefault ? DEFAULT_QUERY_LIMIT : Number(rawLimit);
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_QUERY_LIMIT;
  limit = Math.min(Math.floor(limit), MAX_QUERY_LIMIT);
  const offset = decodeCursor(pagination?.cursor);
  return {
    limit,
    offset,
    fetchLimit: limit + 1,
    appliedDefault
  };
}
function buildPaginatedResponse(rows, resolved) {
  const hasNextPage = rows.length > resolved.limit;
  const data = hasNextPage ? rows.slice(0, resolved.limit) : rows;
  return {
    data,
    pagination: {
      hasNextPage,
      endCursor: hasNextPage ? encodeCursor(resolved.offset + resolved.limit) : null,
      limit: resolved.limit,
      offset: resolved.offset,
      returnedCount: data.length
    },
    meta: resolved.appliedDefault ? { message: `Default pagination limit ${DEFAULT_QUERY_LIMIT} applied (max ${MAX_QUERY_LIMIT}).` } : void 0
  };
}
function truncateRowsForLLM(rows, maxRows = MAX_QUERY_LIMIT) {
  if (!Array.isArray(rows)) {
    return { data: [], truncated: false, totalFetched: 0 };
  }
  if (rows.length <= maxRows) {
    return { data: rows, truncated: false, totalFetched: rows.length };
  }
  return {
    data: rows.slice(0, maxRows),
    truncated: true,
    totalFetched: rows.length
  };
}
function truncatePayloadForLLM(payload, maxChars = 12e3) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}
...[truncated ${text.length - maxChars} chars for LLM context]`;
}
function sanitizeToolResultForLLM(result) {
  if (result && typeof result === "object") {
    const obj = result;
    if (Array.isArray(obj.data) && obj.pagination && typeof obj.pagination === "object") {
      return obj;
    }
    if (obj.status === "success" && obj.data !== void 0) {
      return sanitizeToolResultForLLM(obj.data);
    }
    if (Array.isArray(obj.rows)) {
      const { data, truncated, totalFetched } = truncateRowsForLLM(obj.rows);
      return truncated ? {
        data,
        pagination: { truncated: true, totalFetched, returnedCount: data.length },
        meta: { message: `Truncated to ${data.length} of ${totalFetched} rows for LLM context.` }
      } : { data };
    }
  }
  if (Array.isArray(result)) {
    const { data, truncated, totalFetched } = truncateRowsForLLM(result);
    return truncated ? {
      data,
      pagination: { truncated: true, totalFetched, returnedCount: data.length },
      meta: { message: `Truncated to ${data.length} of ${totalFetched} rows for LLM context.` }
    } : { data };
  }
  return result;
}

// src/translator.ts
function parseFilterNode(node, tableAlias, fields, params, opoEntity) {
  let conditions = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === "AND") {
      const sub = value.map((v) => parseFilterNode(v, tableAlias, fields, params, opoEntity)).join(" AND ");
      conditions.push(`(${sub})`);
    } else if (key === "OR") {
      const sub = value.map((v) => parseFilterNode(v, tableAlias, fields, params, opoEntity)).join(" OR ");
      conditions.push(`(${sub})`);
    } else if (key === "NOT") {
      conditions.push(`NOT (${parseFilterNode(value, tableAlias, fields, params, opoEntity)})`);
    } else {
      const fieldMeta = fields[key];
      if (!fieldMeta) throw new Error(`Filter field '${key}' not mapped for entity '${opoEntity}'.`);
      const physicalColumn = typeof fieldMeta === "string" ? fieldMeta : fieldMeta.column;
      const columnRef = `${tableAlias}.${physicalColumn}`;
      for (const [op, val] of Object.entries(value)) {
        const placeholder = "?";
        switch (op) {
          case "eq":
            conditions.push(`${columnRef} = ${placeholder}`);
            params.push(val);
            break;
          case "neq":
            conditions.push(`${columnRef} != ${placeholder}`);
            params.push(val);
            break;
          case "gt":
            conditions.push(`${columnRef} > ${placeholder}`);
            params.push(val);
            break;
          case "gte":
            conditions.push(`${columnRef} >= ${placeholder}`);
            params.push(val);
            break;
          case "lt":
            conditions.push(`${columnRef} < ${placeholder}`);
            params.push(val);
            break;
          case "lte":
            conditions.push(`${columnRef} <= ${placeholder}`);
            params.push(val);
            break;
          case "like":
            conditions.push(`${columnRef} LIKE ${placeholder}`);
            params.push(val);
            break;
          case "in":
            const placeholders = val.map(() => placeholder).join(", ");
            conditions.push(`${columnRef} IN (${placeholders})`);
            params.push(...val);
            break;
          default:
            throw new Error(`Unsupported operator '${op}'`);
        }
      }
    }
  }
  return conditions.join(" AND ");
}
function translateOpoToSql(opoQuery, dictionary) {
  opoQuery = normalizeOpoQueryPayload(opoQuery);
  const pagination = resolvePagination(opoQuery);
  const mapping = dictionary[opoQuery.entity];
  if (!mapping) {
    throw new Error(`Entity '${opoQuery.entity}' not found in mapping dictionary.`);
  }
  const tableName = mapping.tableName;
  const fields = mapping.fields;
  const joins = mapping.joins;
  const security = mapping.security;
  let params = [];
  let selectClauses = [];
  let joinClauses = [];
  if (opoQuery.select) {
    for (const [key, value] of Object.entries(opoQuery.select)) {
      if (typeof value === "boolean" && value) {
        const fieldMeta = fields[key];
        if (!fieldMeta) throw new Error(`Field '${key}' not mapped for entity '${opoQuery.entity}'.`);
        const physicalColumn = typeof fieldMeta === "string" ? fieldMeta : fieldMeta.column;
        selectClauses.push(`${tableName}.${physicalColumn} AS "${key}"`);
      } else if (typeof value === "object" && value !== null) {
        if (!joins || !joins[key]) {
          throw new Error(`Join '${key}' not mapped for entity '${opoQuery.entity}'.`);
        }
        const relation = joins[key];
        joinClauses.push(`LEFT JOIN ${relation.tableName} ON ${relation.on}`);
        const nestedSelect = value.select;
        if (nestedSelect) {
          for (const [nKey, nVal] of Object.entries(nestedSelect)) {
            if (nVal) {
              selectClauses.push(`${relation.tableName}.${nKey.toUpperCase()} AS "${key}_${nKey}"`);
            }
          }
        }
      }
    }
  }
  if (selectClauses.length === 0) {
    selectClauses.push(`${tableName}.*`);
  }
  let filterConditions = [];
  if (opoQuery.filter && Object.keys(opoQuery.filter).length > 0) {
    filterConditions.push(parseFilterNode(opoQuery.filter, tableName, fields, params, opoQuery.entity));
  }
  if (security?.rowLevelPolicy && opoQuery.context) {
    const { field, contextKey } = security.rowLevelPolicy;
    const contextValue = opoQuery.context[contextKey];
    if (contextValue !== void 0) {
      filterConditions.push(`${tableName}.${field} = ?`);
      params.push(contextValue);
    } else {
      throw new Error(`Security Exception: Context missing required key '${contextKey}' for Row-Level Security.`);
    }
  } else if (security?.rowLevelPolicy && !opoQuery.context) {
    throw new Error(`Security Exception: RLS Policy exists but no context was provided in the query.`);
  }
  let whereClause = "";
  if (filterConditions.length > 0) {
    whereClause = "WHERE " + filterConditions.join(" AND ");
  }
  const limitClause = `LIMIT ${pagination.fetchLimit}`;
  const offsetClause = pagination.offset > 0 ? `OFFSET ${pagination.offset}` : "";
  const sql = `SELECT ${selectClauses.join(", ")}
FROM ${tableName}
${joinClauses.join("\n")}
${whereClause}
${limitClause}${offsetClause ? ` ${offsetClause}` : ""}`.trim();
  return { sql, params, pagination };
}
function translateOpoMutationToSql(opoMutation, dictionary) {
  const mapping = dictionary[opoMutation.entity];
  if (!mapping) {
    throw new Error(`Entity '${opoMutation.entity}' not found in mapping dictionary.`);
  }
  const tableName = mapping.tableName;
  const fields = mapping.fields;
  let params = [];
  let sql = "";
  if (mapping.security?.rowLevelPolicy && !opoMutation.context) {
    throw new Error(`Security Exception: RLS Policy exists but no context was provided in the mutation.`);
  }
  switch (opoMutation.action) {
    case "CALL": {
      if (!mapping.actions || !mapping.actions[opoMutation.procedure]) {
        throw new Error(`RPC Action '${opoMutation.procedure}' is not defined for entity '${opoMutation.entity}'.`);
      }
      const actionDef = mapping.actions[opoMutation.procedure];
      const placeholders = [];
      for (const paramName of actionDef.params) {
        if (opoMutation.payload && opoMutation.payload[paramName] !== void 0) {
          placeholders.push("?");
          params.push(opoMutation.payload[paramName]);
        } else {
          throw new Error(`RPC CALL missing required param '${paramName}' for procedure '${opoMutation.procedure}'`);
        }
      }
      sql = `CALL ${actionDef.procedure}(${placeholders.join(", ")})`;
      break;
    }
    case "CREATE": {
      if (!opoMutation.payload || Object.keys(opoMutation.payload).length === 0) {
        throw new Error("CREATE mutation requires a payload");
      }
      const columns = [];
      const placeholders = [];
      for (const [key, value] of Object.entries(opoMutation.payload)) {
        const fieldMeta = fields[key];
        if (!fieldMeta) throw new Error(`Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`);
        const physicalColumn = typeof fieldMeta === "string" ? fieldMeta : fieldMeta.column;
        columns.push(physicalColumn);
        placeholders.push("?");
        params.push(value);
      }
      sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      break;
    }
    case "UPDATE": {
      if (!opoMutation.payload || Object.keys(opoMutation.payload).length === 0) {
        throw new Error("UPDATE mutation requires a payload");
      }
      if (!opoMutation.filter || Object.keys(opoMutation.filter).length === 0) {
        throw new Error("UPDATE mutation requires a filter to prevent mass updates");
      }
      const setClauses = [];
      for (const [key, value] of Object.entries(opoMutation.payload)) {
        const fieldMeta = fields[key];
        if (!fieldMeta) throw new Error(`Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`);
        const physicalColumn = typeof fieldMeta === "string" ? fieldMeta : fieldMeta.column;
        setClauses.push(`${physicalColumn} = ?`);
        params.push(value);
      }
      const whereClause = parseFilterNode(opoMutation.filter, tableName, fields, params, opoMutation.entity);
      sql = `UPDATE ${tableName} SET ${setClauses.join(", ")} WHERE ${whereClause}`;
      break;
    }
    case "DELETE": {
      if (!opoMutation.filter || Object.keys(opoMutation.filter).length === 0) {
        throw new Error("DELETE mutation requires a filter to prevent mass deletes");
      }
      const whereClause = parseFilterNode(opoMutation.filter, tableName, fields, params, opoMutation.entity);
      sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
      break;
    }
    default:
      throw new Error(`Unsupported mutation action '${opoMutation.action}'`);
  }
  return { sql, params };
}

// src/mcp.ts
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
var OpoMcpServer = class {
  dictionary = {};
  executeCallback;
  initialized = false;
  constructor(options = {}) {
    this.executeCallback = options.executeCallback;
    if (options.mappingDir) {
      this.loadMappingsFromDir(options.mappingDir);
    }
  }
  loadMappingsFromDir(dirPath) {
    const resolvedPath = path.resolve(process.cwd(), dirPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[OPO MCP] Warning: Directory ${resolvedPath} does not exist.`);
      return;
    }
    const scanDir = (dir) => {
      let results = [];
      try {
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat && stat.isDirectory()) {
            results = results.concat(scanDir(filePath));
          } else if (file.endsWith(".json")) {
            results.push(filePath);
          }
        }
      } catch (err) {
        console.error(`[OPO MCP] Error scanning directory ${dir}: ${err.message}`);
      }
      return results;
    };
    const jsonFiles = scanDir(resolvedPath);
    for (const file of jsonFiles) {
      try {
        const content = fs.readFileSync(file, "utf8");
        const mapping = JSON.parse(content);
        if (mapping.entity && mapping.tableName && mapping.fields) {
          this.dictionary[mapping.entity] = mapping;
          console.error(`[OPO MCP] Loaded mapping: ${mapping.entity} (from ${path.basename(file)})`);
        }
      } catch (err) {
        console.error(`[OPO MCP] Failed to load mapping from ${file}: ${err.message}`);
      }
    }
  }
  registerMapping(entity, mapping) {
    this.dictionary[entity] = mapping;
  }
  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    rl.on("line", (line) => {
      if (!line.trim()) return;
      try {
        const request = JSON.parse(line);
        this.handleMessage(request);
      } catch (err) {
        this.sendError(null, -32700, `Parse error: ${err.message}`);
      }
    });
    console.error(`[OPO MCP] Server initialized. Listening on stdin for JSON-RPC messages.`);
  }
  handleMessage(msg) {
    if (msg.jsonrpc !== "2.0") {
      this.sendError(msg.id || null, -32600, "Invalid Request (missing jsonrpc 2.0)");
      return;
    }
    if (msg.id === void 0) {
      if (msg.method === "notifications/initialized") {
        this.initialized = true;
        console.error(`[OPO MCP] Client confirmed initialization.`);
      }
      return;
    }
    const { id, method, params } = msg;
    switch (method) {
      case "initialize":
        this.handleInitialize(id, params);
        break;
      case "tools/list":
        this.handleToolsList(id);
        break;
      case "tools/call":
        this.handleToolsCall(id, params);
        break;
      case "resources/list":
        this.handleResourcesList(id);
        break;
      case "resources/read":
        this.handleResourcesRead(id, params);
        break;
      default:
        this.sendError(id, -32601, `Method not found: ${method}`);
    }
  }
  handleInitialize(id, params) {
    const response = {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: params?.protocolVersion || "2024-11-05",
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: "opo-mcp-server",
          version: "0.3.0"
        }
      }
    };
    this.send(response);
  }
  handleToolsList(id) {
    const tools = [
      {
        name: "translate_query",
        description: "Translates a semantic OPO-QL JSON query into physical, parameterized SQL.",
        inputSchema: {
          type: "object",
          properties: {
            entity: {
              type: "string",
              description: "The OPO Entity name (e.g., Invoice, Customer, Product)."
            },
            query: {
              type: "object",
              description: "The semantic OPO-QL query payload (select, filter, limit)."
            }
          },
          required: ["entity", "query"]
        }
      },
      {
        name: "execute_query",
        description: "Translates and executes a semantic OPO-QL JSON query on the configured database, returning canonical OPO records.",
        inputSchema: {
          type: "object",
          properties: {
            entity: {
              type: "string",
              description: "The OPO Entity name (e.g., Invoice, Customer, Product)."
            },
            query: {
              type: "object",
              description: "The semantic OPO-QL query payload."
            }
          },
          required: ["entity", "query"]
        }
      },
      {
        name: "translate_mutation",
        description: "Translates a semantic OPO Mutation JSON into physical, parameterized SQL.",
        inputSchema: {
          type: "object",
          properties: {
            mutation: {
              type: "object",
              description: "The semantic OPO Mutation payload (entity, action, filter, payload)."
            }
          },
          required: ["mutation"]
        }
      },
      {
        name: "execute_mutation",
        description: "Translates and executes a semantic OPO Mutation JSON on the configured database.",
        inputSchema: {
          type: "object",
          properties: {
            mutation: {
              type: "object",
              description: "The semantic OPO Mutation payload."
            }
          },
          required: ["mutation"]
        }
      }
    ];
    this.send({
      jsonrpc: "2.0",
      id,
      result: { tools }
    });
  }
  async handleToolsCall(id, params) {
    const { name, arguments: args } = params;
    if (!args) {
      this.sendError(id, -32602, "Invalid params: Missing arguments");
      return;
    }
    try {
      if (name === "translate_query" || name === "execute_query") {
        if (!args.entity || !args.query) {
          this.sendError(id, -32602, "Invalid params: Missing entity or query arguments");
          return;
        }
        const { entity, query } = args;
        if (!query.entity) {
          query.entity = entity;
        }
        if (name === "translate_query") {
          const { sql, params: sqlParams, pagination } = translateOpoToSql(query, this.dictionary);
          this.send({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ sql, parameters: sqlParams, pagination }, null, 2)
                }
              ]
            }
          });
        } else if (name === "execute_query") {
          const { sql, params: sqlParams, pagination } = translateOpoToSql(query, this.dictionary);
          if (!this.executeCallback) {
            this.send({
              jsonrpc: "2.0",
              id,
              result: {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: "Database execution not configured on this OPO Sidecar. Running translation only:\n" + JSON.stringify({ sql, parameters: sqlParams, pagination }, null, 2)
                  }
                ]
              }
            });
            return;
          }
          console.error(`[OPO MCP] Executing query: ${sql}`);
          const rows = await this.executeCallback(sql, sqlParams);
          const response = buildPaginatedResponse(
            Array.isArray(rows) ? rows : [rows],
            pagination
          );
          this.send({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(response, null, 2)
                }
              ]
            }
          });
        }
      } else if (name === "translate_mutation") {
        if (!args.mutation) throw new Error("Missing mutation argument");
        const { sql, params: sqlParams } = translateOpoMutationToSql(args.mutation, this.dictionary);
        this.send({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ sql, parameters: sqlParams }, null, 2)
              }
            ]
          }
        });
      } else if (name === "execute_mutation") {
        if (!args.mutation) throw new Error("Missing mutation argument");
        const { sql, params: sqlParams } = translateOpoMutationToSql(args.mutation, this.dictionary);
        if (!this.executeCallback) {
          this.send({
            jsonrpc: "2.0",
            id,
            result: {
              isError: true,
              content: [
                {
                  type: "text",
                  text: "Database execution not configured on this OPO Sidecar. Running translation only:\n" + JSON.stringify({ sql, parameters: sqlParams }, null, 2)
                }
              ]
            }
          });
          return;
        }
        console.error(`[OPO MCP] Executing mutation: ${sql}`);
        const rows = await this.executeCallback(sql, sqlParams);
        this.send({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(rows, null, 2)
              }
            ]
          }
        });
      } else {
        this.sendError(id, -32601, `Tool not found: ${name}`);
      }
    } catch (err) {
      this.send({
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error processing query: ${err.message}`
            }
          ]
        }
      });
    }
  }
  handleResourcesList(id) {
    const resources = Object.entries(this.dictionary).map(([entity, mapping]) => ({
      uri: `opo://mappings/${entity}.json`,
      name: `${entity} Physical Mapping`,
      description: mapping.description || `Mapping specifications for ${entity} ERP integration.`,
      mimeType: "application/json"
    }));
    this.send({
      jsonrpc: "2.0",
      id,
      result: { resources }
    });
  }
  handleResourcesRead(id, params) {
    const { uri } = params;
    if (!uri) {
      this.sendError(id, -32602, "Missing resource URI");
      return;
    }
    const match = uri.match(/^opo:\/\/mappings\/([^/]+)\.json$/);
    if (!match) {
      this.sendError(id, -32602, `Invalid OPO resource URI: ${uri}`);
      return;
    }
    const entityName = match[1];
    const mapping = this.dictionary[entityName];
    if (!mapping) {
      this.sendError(id, -32602, `Mapping resource not found for entity: ${entityName}`);
      return;
    }
    this.send({
      jsonrpc: "2.0",
      id,
      result: {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(mapping, null, 2)
          }
        ]
      }
    });
  }
  send(response) {
    process.stdout.write(JSON.stringify(response) + "\n");
  }
  sendError(id, code, message) {
    const response = {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message
      }
    };
    this.send(response);
  }
};

// src/adapters/graphql.ts
var OpoGraphQLAdapter = class {
  /**
   * Converts an OpoMapping (JSON) into a GraphQL Type Definition string.
   */
  static generateTypeDefs(mapping) {
    const entityName = mapping.entity;
    let typeDef = `type ${entityName} {
`;
    for (const [fieldName, fieldMeta] of Object.entries(mapping.fields)) {
      const type = typeof fieldMeta === "string" ? fieldMeta : fieldMeta.type;
      const gqlType = this.mapToGraphQLType(type);
      typeDef += `  ${fieldName}: ${gqlType}
`;
    }
    typeDef += `}

`;
    typeDef += `input ${entityName}Input {
`;
    for (const [fieldName, fieldMeta] of Object.entries(mapping.fields)) {
      const type = typeof fieldMeta === "string" ? fieldMeta : fieldMeta.type;
      const gqlType = this.mapToGraphQLType(type);
      typeDef += `  ${fieldName}: ${gqlType}
`;
    }
    typeDef += `}

`;
    typeDef += `extend type Query {
`;
    typeDef += `  get${entityName}(id: ID!): ${entityName}
`;
    typeDef += `  list${entityName}s(limit: Int): [${entityName}]
`;
    typeDef += `}
`;
    return typeDef;
  }
  static mapToGraphQLType(opoType) {
    const lowerType = opoType.toLowerCase();
    switch (lowerType) {
      case "string":
      case "varchar":
      case "text":
        return "String";
      case "number":
      case "integer":
      case "int":
        return "Int";
      case "float":
      case "decimal":
        return "Float";
      case "boolean":
      case "bool":
        return "Boolean";
      case "date":
      case "timestamp":
        return "String";
      // GraphQL lacks native Date without custom scalars
      default:
        return "String";
    }
  }
};

// src/index.ts
var OpoClient = class {
  registryUrl;
  constructor(options) {
    this.registryUrl = options?.registryUrl || "https://openontology.vercel.app";
  }
  async getMapping(provider, entity) {
    const url = `${this.registryUrl}/registry/${provider}/${entity}.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch OPO mapping for ${provider}/${entity} (Status: ${response.status})`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[OpoClient] Error fetching mapping from ${url}:`, error);
      throw error;
    }
  }
  generateSystemPrompt(mapping) {
    const fieldNames = Object.keys(mapping.fields).join(", ");
    return `You are an intelligent agent connecting to ${mapping.sourceType} table "${mapping.tableName}".
When querying or mutating the ${mapping.entity} entity, use the following canonical fields: ${fieldNames}.
The OPO Sidecar will automatically translate these to the underlying columns.`;
  }
};
export {
  DEFAULT_QUERY_LIMIT,
  MAX_QUERY_LIMIT,
  OpoClient,
  OpoGraphQLAdapter,
  OpoMcpServer,
  OpoOntologyBuilder,
  buildPaginatedResponse,
  decodeCursor,
  encodeCursor,
  normalizeOpoQueryPayload,
  resolvePagination,
  sanitizeToolResultForLLM,
  translateOpoMutationToSql,
  translateOpoToSql,
  truncatePayloadForLLM,
  truncateRowsForLLM
};
