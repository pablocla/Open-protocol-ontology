#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { validateCommand } from './commands/validate';

const program = new Command();

program
  .name('opo')
  .description('CLI tool for the Open Protocol Ontology (OPO)')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(validateCommand);

program.parse(process.argv);
