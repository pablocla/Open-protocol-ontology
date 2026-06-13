import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

export const validateCommand = new Command('validate')
  .description('Validate a local JSON file against an OPO entity schema')
  .argument('<file>', 'Path to the JSON file to validate')
  .argument('<schema>', 'Name of the OPO schema (e.g. Invoice, Customer, Product)')
  .action(async (file, schemaName) => {
    const filePath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found at ${filePath}`));
      process.exit(1);
    }

    // Attempt to load the schema from public/schemas
    // In a real CLI published to npm, schemas would be packaged with the CLI
    const schemaDir = path.join(__dirname, '../public/schemas');
    const schemaPath = path.join(schemaDir, `${schemaName}.json`);

    if (!fs.existsSync(schemaPath)) {
      console.error(chalk.red(`Error: OPO Schema '${schemaName}' not found. Check if the name is correct (case-sensitive).`));
      console.error(chalk.gray(`Path checked: ${schemaPath}`));
      process.exit(1);
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

      const ajv = new Ajv({ strict: false, allErrors: true });
      addFormats(ajv);

      const validate = ajv.compile(schema);
      const valid = validate(data);

      if (valid) {
        console.log(chalk.green(`\n✅ Success! The file strictly conforms to the OPO ${schemaName} schema.\n`));
      } else {
        console.log(chalk.red(`\n❌ Validation Failed: The file does not conform to the ${schemaName} schema.\n`));
        validate.errors?.forEach(err => {
          console.log(chalk.yellow(`- Property '${err.instancePath}' ${err.message}`));
        });
        console.log('');
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`\nAn error occurred during validation: ${err.message}\n`));
      process.exit(1);
    }
  });
