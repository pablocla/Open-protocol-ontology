import { ToolDefinition } from './meshTypes';
import { callMCPTool } from './mcpClient';
import { runOpoQuery, runOpoQueryById, type ErpExecutionContext } from '@/lib/studio/runOpoQuery';
import { OPO_STUDIO_QUERY_TOOL_ID } from './defaultOpoTool';

export interface OpoRuntimeContext {
  erpExecution?: ErpExecutionContext;
  ontology?: { entities?: Array<{ name?: string; originalTable?: string }>; name?: string };
  projectName?: string | null;
}

export class OPORuntime {
  private context: OpoRuntimeContext = {};

  setContext(ctx: OpoRuntimeContext): void {
    this.context = ctx;
  }

  clearContext(): void {
    this.context = {};
  }

  async executeTool(
    toolDef: ToolDefinition,
    operationName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    switch (toolDef.type) {
      case 'opo_internal':
        return this.executeOpoInternal(toolDef, operationName, args);
      case 'mcp':
        return this.executeMCPTool(toolDef, operationName, args);
      case 'n8n_webhook':
        return this.executeN8nWebhook(toolDef, args);
      case 'rest_api':
        return this.executeRestApi(toolDef, args);
      case 'sql_direct':
        return this.executeDirectSQL(toolDef, args);
      default:
        throw new Error(`Unsupported tool type: ${toolDef.type}`);
    }
  }

  private async executeOpoInternal(
    toolDef: ToolDefinition,
    operationName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    if (toolDef.id !== OPO_STUDIO_QUERY_TOOL_ID || operationName !== 'execute_query') {
      throw new Error(`Unknown OPO internal operation: ${operationName}`);
    }

    const erpExecution = this.context.erpExecution ?? { mode: 'mock' as const };
    const ontology = this.context.ontology;
    const projectName = this.context.projectName ?? this.context.ontology?.name ?? null;

    if (typeof args.queryId === 'string') {
      const result = await runOpoQueryById(
        args.queryId,
        (args.params as Record<string, string>) || {},
        ontology,
        projectName,
        erpExecution
      );
      return { status: 'success', provider: 'opo_internal', data: result };
    }

    const query = args.query as Record<string, unknown> | undefined;
    if (!query?.entity) {
      throw new Error('execute_query requires { query: { entity, ... } } or { queryId, params }');
    }

    const result = await runOpoQuery({
      opoQuery: query,
      ontology,
      projectName,
      erpExecution,
    });
    return { status: 'success', provider: 'opo_internal', data: result };
  }

  private async executeMCPTool(
    toolDef: ToolDefinition,
    operationName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    console.log(`[OPORuntime] Executing MCP Tool ${operationName} on ${toolDef.endpoint}`);
    try {
      const result = await callMCPTool(toolDef.endpoint, operationName, args);
      return {
        status: 'success',
        provider: 'mcp',
        operation: operationName,
        data: result,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'MCP tool failed';
      return {
        status: 'error',
        provider: 'mcp',
        message,
      };
    }
  }

  private async executeN8nWebhook(
    toolDef: ToolDefinition,
    args: Record<string, unknown>
  ): Promise<unknown> {
    console.log(`[OPORuntime] Triggering n8n webhook on ${toolDef.endpoint}`);
    try {
      const response = await fetch(toolDef.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await response.json().catch(() => ({}));
      return { status: 'success', provider: 'n8n_webhook', data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'n8n webhook failed';
      return { status: 'error', provider: 'n8n_webhook', message };
    }
  }

  private async executeRestApi(
    toolDef: ToolDefinition,
    args: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const response = await fetch(toolDef.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await response.json().catch(() => ({}));
      return { status: 'success', provider: 'rest_api', data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'REST API failed';
      return { status: 'error', provider: 'rest_api', message };
    }
  }

  private async executeDirectSQL(
    toolDef: ToolDefinition,
    args: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const response = await fetch(toolDef.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: args.query || args, erpExecution: this.context.erpExecution }),
      });
      const data = await response.json().catch(() => ({}));
      return { status: 'success', provider: 'sql_direct', data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'SQL direct failed';
      return { status: 'error', provider: 'sql_direct', message };
    }
  }
}

export const opoRuntime = new OPORuntime();