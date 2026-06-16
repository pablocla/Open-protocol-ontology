import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { OpoMcpServer } from 'opo-sdk';

export const mcpStartCommand = new Command('mcp-start')
  .description('Start the OPO Model Context Protocol (MCP) Server over stdio')
  .option('-m, --mappings <dir>', 'Directory containing mapping JSON files', './registry')
  .action((options) => {
    const mappingDir = path.resolve(process.cwd(), options.mappings);

    console.error(chalk.blue(`[CLI] Starting OPO MCP Server...`));
    console.error(chalk.blue(`[CLI] Scanning mappings directory: ${mappingDir}`));

    if (!fs.existsSync(mappingDir)) {
      console.error(chalk.red(`[CLI] Error: Mappings directory not found: ${mappingDir}`));
      process.exit(1);
    }

    try {
      const server = new OpoMcpServer({
        mappingDir: options.mappings
      });

      // Start the stdio JSON-RPC server
      server.start();
    } catch (err: any) {
      console.error(chalk.red(`[CLI] Failed to start MCP Server: ${err.message}`));
      process.exit(1);
    }
  });
