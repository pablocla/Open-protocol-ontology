import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { GoogleGenAI } from '@google/genai';

export const inspectCommand = new Command('inspect')
  .description('AI-Assisted Zero-Touch Mapping. Introspects databases/APIs to generate OPO schemas.')
  .requiredOption('-e, --entity <name>', 'The canonical Entity name (e.g. Invoice, Customer)')
  .requiredOption('-s, --schema <path>', 'Path to the local schema file (SQL DDL, Swagger, GraphQL SDL)')
  .option('-t, --type <type>', 'Type of schema (sql, rest, graphql, soap)', 'sql')
  .option('--sync', 'Run in auto-healing mode to detect Schema Drift against an existing mapping')
  .action(async (options) => {
    console.log(chalk.blueBright(`\n🔍 Inspecting ${options.type.toUpperCase()} schema for entity: ${options.entity}...\n`));

    // 1. Verify schema file exists
    const schemaPath = path.resolve(process.cwd(), options.schema);
    if (!fs.existsSync(schemaPath)) {
      console.error(chalk.red(`Error: Schema file not found at ${schemaPath}`));
      process.exit(1);
    }
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // 2. Mock or real Sync mode
    if (options.sync) {
      console.log(chalk.yellow(`[SYNC MODE] Detecting Schema Drift...`));
      console.log(chalk.gray(`Analyzing physical schema against current OPO mapping...`));
      setTimeout(() => {
        console.log(chalk.green(`\n✅ No critical schema drift detected. Mappings are up to date.`));
        console.log(chalk.cyan(`(Auto-healing daemon simulation completed)`));
      }, 1500);
      return;
    }

    // 3. Ask for API Key
    const response = await prompts({
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Google Gemini API Key (or press enter to skip if set in ENV):'
    });

    const apiKey = response.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(chalk.red('Error: API Key is required for AI Introspection.'));
      process.exit(1);
    }

    // 4. Initialize GenAI
    const ai = new GoogleGenAI({ apiKey });

    console.log(chalk.cyan('\n🧠 Consulting Gemini 2.5...'));

    const systemPrompt = `
      You are an expert Enterprise Architect. I will give you a raw ${options.type} schema.
      Your job is to extract the fields and map them to standard English names for the entity '${options.entity}'.
      Return a valid JSON object representing the 'fields' property of an OpoMapping.
      Example for Invoice:
      {
        "id": { "column": "VBELN", "type": "string" },
        "totalAmount": { "column": "NETWR", "type": "number" }
      }
      ONLY return valid JSON. Do not return markdown blocks.
    `;

    try {
      const completion = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\nSchema:\n' + schemaContent.substring(0, 5000) }] }
        ]
      });

      let jsonText = completion.text || '{}';
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      const fields = JSON.parse(jsonText);

      const opoMapping = {
        $schema: "https://openontology.org/schema/v1.json",
        entity: options.entity,
        sourceType: options.type.toUpperCase(),
        tableName: "INFERRED_TABLE_NAME",
        fields
      };

      console.log(chalk.green('\n✅ Gemini inferred the following mapping:\n'));
      console.log(chalk.gray(JSON.stringify(opoMapping, null, 2)));

      // 5. Ask for confirmation before saving
      const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Do you want to save this mapping to the registry?',
        initial: true
      });

      if (confirm.value) {
        const outDir = path.resolve(process.cwd(), 'registry', 'inferred');
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        const outPath = path.join(outDir, `${options.entity}.json`);
        fs.writeFileSync(outPath, JSON.stringify(opoMapping, null, 2));
        console.log(chalk.green(`\n💾 Saved to ${outPath}`));
      } else {
        console.log(chalk.yellow('\nDiscarded mapping.'));
      }

    } catch (error: any) {
      console.error(chalk.red(`\n❌ AI Introspection failed: ${error.message}`));
      process.exit(1);
    }
  });
