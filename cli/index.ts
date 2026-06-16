#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';
import { generateCommand } from './commands/generate';
import { translateCommand } from './commands/translate';
import { mutateCommand } from './commands/mutate';
import { mcpStartCommand } from './commands/mcp';
import { inspectCommand } from './commands/inspect';
import { studioCommand } from './commands/studio';
import { discoverCommand } from './commands/discover';

const program = new Command();

program
  .name('opo')
  .description('Open Protocol Ontology (OPO) CLI')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(generateCommand);
program.addCommand(translateCommand);
program.addCommand(mutateCommand);
program.addCommand(mcpStartCommand);
program.addCommand(inspectCommand);
program.addCommand(studioCommand);
program.addCommand(discoverCommand);

program.parse(process.argv);
