import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { translateOpoToSql, translateOpoMutationToSql, Dictionary } from './translator';
import { buildPaginatedResponse } from './pagination';

export interface OpoMcpServerOptions {
  mappingDir?: string;
  executeCallback?: (sql: string, params: any[]) => Promise<any[]>;
}

export class OpoMcpServer {
  private dictionary: Dictionary = {};
  private executeCallback?: (sql: string, params: any[]) => Promise<any[]>;
  private initialized: boolean = false;

  constructor(options: OpoMcpServerOptions = {}) {
    this.executeCallback = options.executeCallback;
    if (options.mappingDir) {
      this.loadMappingsFromDir(options.mappingDir);
    }
  }

  private loadMappingsFromDir(dirPath: string) {
    const resolvedPath = path.resolve(process.cwd(), dirPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[OPO MCP] Warning: Directory ${resolvedPath} does not exist.`);
      return;
    }

    const scanDir = (dir: string): string[] => {
      let results: string[] = [];
      try {
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat && stat.isDirectory()) {
            results = results.concat(scanDir(filePath));
          } else if (file.endsWith('.json')) {
            results.push(filePath);
          }
        }
      } catch (err: any) {
        console.error(`[OPO MCP] Error scanning directory ${dir}: ${err.message}`);
      }
      return results;
    };

    const jsonFiles = scanDir(resolvedPath);
    for (const file of jsonFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const mapping = JSON.parse(content);
        if (mapping.entity && mapping.tableName && mapping.fields) {
          this.dictionary[mapping.entity] = mapping;
          console.error(`[OPO MCP] Loaded mapping: ${mapping.entity} (from ${path.basename(file)})`);
        }
      } catch (err: any) {
        console.error(`[OPO MCP] Failed to load mapping from ${file}: ${err.message}`);
      }
    }
  }

  public registerMapping(entity: string, mapping: any) {
    this.dictionary[entity] = mapping;
  }

  public start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const request = JSON.parse(line);
        this.handleMessage(request);
      } catch (err: any) {
        this.sendError(null, -32700, `Parse error: ${err.message}`);
      }
    });

    console.error(`[OPO MCP] Server initialized. Listening on stdin for JSON-RPC messages.`);
  }

  private handleMessage(msg: any) {
    if (msg.jsonrpc !== '2.0') {
      this.sendError(msg.id || null, -32600, 'Invalid Request (missing jsonrpc 2.0)');
      return;
    }

    // Handles notifications
    if (msg.id === undefined) {
      if (msg.method === 'notifications/initialized') {
        this.initialized = true;
        console.error(`[OPO MCP] Client confirmed initialization.`);
      }
      return;
    }

    const { id, method, params } = msg;

    switch (method) {
      case 'initialize':
        this.handleInitialize(id, params);
        break;
      case 'tools/list':
        this.handleToolsList(id);
        break;
      case 'tools/call':
        this.handleToolsCall(id, params);
        break;
      case 'resources/list':
        this.handleResourcesList(id);
        break;
      case 'resources/read':
        this.handleResourcesRead(id, params);
        break;
      default:
        this.sendError(id, -32601, `Method not found: ${method}`);
    }
  }

  private handleInitialize(id: any, params: any) {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: params?.protocolVersion || '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: 'opo-mcp-server',
          version: '0.3.0'
        }
      }
    };
    this.send(response);
  }

  private handleToolsList(id: any) {
    const tools = [
      {
        name: 'translate_query',
        description: 'Translates a semantic OPO-QL JSON query into physical, parameterized SQL.',
        inputSchema: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              description: 'The OPO Entity name (e.g., Invoice, Customer, Product).'
            },
            query: {
              type: 'object',
              description: 'The semantic OPO-QL query payload (select, filter, limit).'
            }
          },
          required: ['entity', 'query']
        }
      },
      {
        name: 'execute_query',
        description: 'Translates and executes a semantic OPO-QL JSON query on the configured database, returning canonical OPO records.',
        inputSchema: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              description: 'The OPO Entity name (e.g., Invoice, Customer, Product).'
            },
            query: {
              type: 'object',
              description: 'The semantic OPO-QL query payload.'
            }
          },
          required: ['entity', 'query']
        }
      },
      {
        name: 'translate_mutation',
        description: 'Translates a semantic OPO Mutation JSON into physical, parameterized SQL.',
        inputSchema: {
          type: 'object',
          properties: {
            mutation: {
              type: 'object',
              description: 'The semantic OPO Mutation payload (entity, action, filter, payload).'
            }
          },
          required: ['mutation']
        }
      },
      {
        name: 'execute_mutation',
        description: 'Translates and executes a semantic OPO Mutation JSON on the configured database.',
        inputSchema: {
          type: 'object',
          properties: {
            mutation: {
              type: 'object',
              description: 'The semantic OPO Mutation payload.'
            }
          },
          required: ['mutation']
        }
      }
    ];

    this.send({
      jsonrpc: '2.0',
      id,
      result: { tools }
    });
  }

  private async handleToolsCall(id: any, params: any) {
    const { name, arguments: args } = params;

    if (!args) {
      this.sendError(id, -32602, 'Invalid params: Missing arguments');
      return;
    }

    try {
      if (name === 'translate_query' || name === 'execute_query') {
        if (!args.entity || !args.query) {
          this.sendError(id, -32602, 'Invalid params: Missing entity or query arguments');
          return;
        }
        
        const { entity, query } = args;

        // Make sure query payload has entity set
        if (!query.entity) {
          query.entity = entity;
        }
        
        if (name === 'translate_query') {
        const { sql, params: sqlParams, pagination } = translateOpoToSql(query, this.dictionary);
        this.send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ sql, parameters: sqlParams, pagination }, null, 2)
              }
            ]
          }
        });
      } else if (name === 'execute_query') {
        const { sql, params: sqlParams, pagination } = translateOpoToSql(query, this.dictionary);
        
        if (!this.executeCallback) {
          this.send({
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Database execution not configured on this OPO Sidecar. Running translation only:\n' +
                        JSON.stringify({ sql, parameters: sqlParams, pagination }, null, 2)
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
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2)
              }
            ]
          }
        });
      }
      } else if (name === 'translate_mutation') {
        if (!args.mutation) throw new Error('Missing mutation argument');
        const { sql, params: sqlParams } = translateOpoMutationToSql(args.mutation, this.dictionary);
        this.send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ sql, parameters: sqlParams }, null, 2)
              }
            ]
          }
        });
      } else if (name === 'execute_mutation') {
        if (!args.mutation) throw new Error('Missing mutation argument');
        const { sql, params: sqlParams } = translateOpoMutationToSql(args.mutation, this.dictionary);
        
        if (!this.executeCallback) {
          this.send({
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Database execution not configured on this OPO Sidecar. Running translation only:\n' +
                        JSON.stringify({ sql, parameters: sqlParams }, null, 2)
                }
              ]
            }
          });
          return;
        }

        console.error(`[OPO MCP] Executing mutation: ${sql}`);
        const rows = await this.executeCallback(sql, sqlParams);
        
        this.send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(rows, null, 2)
              }
            ]
          }
        });
      } else {
        this.sendError(id, -32601, `Tool not found: ${name}`);
      }
    } catch (err: any) {
      this.send({
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error processing query: ${err.message}`
            }
          ]
        }
      });
    }
  }

  private handleResourcesList(id: any) {
    const resources = Object.entries(this.dictionary).map(([entity, mapping]) => ({
      uri: `opo://mappings/${entity}.json`,
      name: `${entity} Physical Mapping`,
      description: mapping.description || `Mapping specifications for ${entity} ERP integration.`,
      mimeType: 'application/json'
    }));

    this.send({
      jsonrpc: '2.0',
      id,
      result: { resources }
    });
  }

  private handleResourcesRead(id: any, params: any) {
    const { uri } = params;
    if (!uri) {
      this.sendError(id, -32602, 'Missing resource URI');
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
      jsonrpc: '2.0',
      id,
      result: {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(mapping, null, 2)
          }
        ]
      }
    });
  }

  private send(response: any) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  private sendError(id: any, code: number, message: string) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
    this.send(response);
  }
}
