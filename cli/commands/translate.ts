import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { translateOpoToSql, Dictionary } from '../utils/sqlTranslator';

export const translateCommand = new Command('translate')
  .description('Translate an OpoQuery JSON into native Parameterized SQL')
  .argument('<target>', 'Translation target (e.g., sql)')
  .requiredOption('-q, --query <path>', 'Path to the OpoQuery JSON file')
  .requiredOption('-m, --mapping <path>', 'Path to the Dictionary Mapping JSON file')
  .action((target, options) => {
    if (target !== 'sql') {
      console.error(chalk.red(`Error: Unknown translation target '${target}'. Currently only 'sql' is supported.`));
      process.exit(1);
    }

    try {
      const queryPath = path.resolve(process.cwd(), options.query);
      const mappingPath = path.resolve(process.cwd(), options.mapping);

      if (!fs.existsSync(queryPath)) throw new Error(`Query file not found: ${queryPath}`);
      if (!fs.existsSync(mappingPath)) throw new Error(`Mapping file not found: ${mappingPath}`);

      const queryPayload = JSON.parse(fs.readFileSync(queryPath, 'utf8'));
      const mappingDict: Dictionary = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

      // Validate envelope structure if nested inside "query" property
      const targetQuery = queryPayload.query ? queryPayload.query : queryPayload;

      console.log(chalk.blue(`Translating OPO-QL to SQL...`));

      const { sql, params, pagination } = translateOpoToSql(targetQuery, mappingDict);

      console.log(chalk.green(`\n✅ Translation Successful (Protected by Prepared Statements)`));
      if (pagination?.appliedDefault) {
        console.log(chalk.gray(`  Default LIMIT ${pagination.limit} applied (max 100 per OPO-QL spec).`));
      }
      console.log(chalk.yellow(`\n[GENERATED SQL]`));
      console.log(sql);
      
      console.log(chalk.yellow(`\n[PARAMETERS]`));
      console.log(JSON.stringify(params, null, 2));
      if (pagination) {
        console.log(chalk.yellow(`\n[PAGINATION]`));
        console.log(JSON.stringify(pagination, null, 2));
      }
      console.log();

    } catch (err: any) {
      console.error(chalk.red(`\nTranslation Failed: ${err.message}\n`));
      process.exit(1);
    }
  });
