import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { translateOpoMutationToSql, Dictionary } from '../utils/sqlTranslator';

export const mutateCommand = new Command('mutate')
  .description('Translate an OpoMutation JSON into native Parameterized SQL (CREATE, UPDATE, DELETE)')
  .argument('<target>', 'Translation target (e.g., sql)')
  .requiredOption('-m, --mutation <path>', 'Path to the OpoMutation JSON file')
  .requiredOption('-d, --dictionary <path>', 'Path to the Dictionary Mapping JSON file')
  .action((target, options) => {
    if (target !== 'sql') {
      console.error(chalk.red(`Error: Unknown translation target '${target}'. Currently only 'sql' is supported.`));
      process.exit(1);
    }

    try {
      const mutationPath = path.resolve(process.cwd(), options.mutation);
      const mappingPath = path.resolve(process.cwd(), options.dictionary);

      if (!fs.existsSync(mutationPath)) throw new Error(`Mutation file not found: ${mutationPath}`);
      if (!fs.existsSync(mappingPath)) throw new Error(`Mapping file not found: ${mappingPath}`);

      const mutationPayload = JSON.parse(fs.readFileSync(mutationPath, 'utf8'));
      const mappingDict: Dictionary = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

      // Validate envelope structure if nested inside "mutation" property
      const targetMutation = mutationPayload.mutation ? mutationPayload.mutation : mutationPayload;

      console.log(chalk.blue(`Translating OPO Mutation to SQL...`));

      const { sql, params } = translateOpoMutationToSql(targetMutation, mappingDict);

      console.log(chalk.green(`\n✅ Mutation Translation Successful (Protected by Prepared Statements)`));
      console.log(chalk.yellow(`\n[GENERATED SQL]`));
      console.log(sql);
      
      console.log(chalk.yellow(`\n[PARAMETERS]`));
      console.log(JSON.stringify(params, null, 2));
      console.log();

    } catch (err: any) {
      console.error(chalk.red(`\nTranslation Failed: ${err.message}\n`));
      process.exit(1);
    }
  });
