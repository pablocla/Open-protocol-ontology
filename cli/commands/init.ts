import { Command } from 'commander';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export const initCommand = new Command('init')
  .description('Initialize OPO manifest in the current project')
  .argument('[erp]', 'Optional ERP template to use (e.g., sap, odoo, protheus)')
  .action(async (erp) => {
    let selectedErp = erp;

    if (!selectedErp) {
      const response = await prompts({
        type: 'select',
        name: 'erp',
        message: 'Which ERP/System template do you want to initialize?',
        choices: [
          { title: 'Blank (Empty Template)', value: 'blank' },
          { title: 'Odoo 17 Community', value: 'odoo' },
          { title: 'TOTVS Protheus', value: 'protheus' },
          { title: 'SAP S/4HANA (Basic)', value: 'sap' },
        ],
      });
      selectedErp = response.erp;
    }

    if (!selectedErp) {
      console.log(chalk.yellow('Initialization cancelled.'));
      return;
    }

    const wellKnownDir = path.join(process.cwd(), '.well-known');
    const targetPath = path.join(wellKnownDir, 'opo.json');

    if (!fs.existsSync(wellKnownDir)) {
      fs.mkdirSync(wellKnownDir, { recursive: true });
    }

    if (fs.existsSync(targetPath)) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: '.well-known/opo.json already exists. Overwrite?',
        initial: false
      });
      if (!overwrite) {
        console.log(chalk.yellow('Initialization cancelled.'));
        return;
      }
    }

    // Try to load a template if we are in the opo repo, otherwise provide a fallback
    // In a real CLI published to npm, templates would be packaged in the dist folder
    let template = {
      $schema: "https://opo.example.com/schemas/OpoManifest.json",
      version: "0.1.0",
      system: {
        vendor: "Custom",
        product: "My ERP",
        version: "1.0"
      },
      entities: []
    };

    try {
      // Logic specifically tailored for demo purposes
      let templateContent = '';
      const sourcePublicDir = path.join(__dirname, '../public');
      
      if (selectedErp === 'protheus') {
        const filePath = path.join(sourcePublicDir, 'opo-manifest.example.json');
        if (fs.existsSync(filePath)) templateContent = fs.readFileSync(filePath, 'utf8');
      } else if (selectedErp === 'odoo') {
        const filePath = path.join(sourcePublicDir, 'opo-manifest.example2.json');
        if (fs.existsSync(filePath)) templateContent = fs.readFileSync(filePath, 'utf8');
      }
      
      if (templateContent) {
        template = JSON.parse(templateContent);
      }
    } catch (err) {
      console.warn(chalk.yellow('Could not load detailed template, using default blank.'));
    }

    fs.writeFileSync(targetPath, JSON.stringify(template, null, 2));
    console.log(chalk.green(`\nSuccess! Created OPO manifest at ${targetPath}`));
    console.log(chalk.gray(`Next steps:\n1. Open .well-known/opo.json\n2. Configure your endpoints mapping.\n`));
  });
