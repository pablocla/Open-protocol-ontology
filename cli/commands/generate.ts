import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { compileFromFile } from 'json-schema-to-typescript';

export const generateCommand = new Command('generate')
  .description('Generate code or types from OPO schemas')
  .argument('<target>', 'Target to generate (e.g. types)')
  .option('-o, --out <path>', 'Output file path', 'opo-types.d.ts')
  .action(async (target, options) => {
    if (target !== 'types') {
      console.error(chalk.red(`Error: Unknown target '${target}'. Currently only 'types' is supported.`));
      process.exit(1);
    }

    const schemaDir = path.join(__dirname, '../../public/schemas');
    const outPath = path.resolve(process.cwd(), options.out);

    if (!fs.existsSync(schemaDir)) {
      console.error(chalk.red(`Error: Schema directory not found at ${schemaDir}`));
      process.exit(1);
    }

    console.log(chalk.blue(`Generating TypeScript definitions from OPO Schemas...`));

    try {
      const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.json'));
      let combinedTypes = `// Auto-generated TypeScript definitions for OPO Protocol\n// Do not edit manually.\n\n`;

      for (const file of files) {
        const filePath = path.join(schemaDir, file);
        // Compile the schema to a TypeScript interface
        const ts = await compileFromFile(filePath, {
          bannerComment: '',
          style: { singleQuote: true }
        });
        combinedTypes += ts + '\n';
      }

      fs.writeFileSync(outPath, combinedTypes);
      console.log(chalk.green(`✅ Successfully generated types at: ${outPath}`));

    } catch (err: any) {
      console.error(chalk.red(`\nAn error occurred during generation: ${err.message}\n`));
      process.exit(1);
    }
  });
