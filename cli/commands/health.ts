import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { checkStudioHealth } from '../../lib/studio/studioHealth';
import { CredentialVault } from '../../lib/engine/vault/credential-vault';
import { buildMssqlConnectionString } from '../../lib/studio/onboarding/connectionBuilder';

export const healthCommand = new Command('health')
  .description('Verificar el estado de conexión del ERP y de la Inteligencia Artificial')
  .option('--ollama-only', 'Solo verificar el estado de la IA')
  .option('--erp-only', 'Solo verificar el estado del ERP')
  .action(async (options) => {
    const workspaceDir = process.env.OPO_WORKSPACE_DIR || process.cwd();
    const workspacePath = path.join(workspaceDir, '.opo', 'workspace.json');

    if (!fs.existsSync(workspacePath)) {
      console.error(chalk.red('\n❌ No se encontró la configuración del workspace. Corré "opo onboard" primero.\n'));
      process.exit(1);
    }

    let wsData: any;
    try {
      wsData = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
    } catch (err: any) {
      console.error(chalk.red(`\n❌ Error al leer workspace.json: ${err.message}\n`));
      process.exit(1);
    }

    const erpWorkspace = wsData.erpWorkspace || {};
    const ai = wsData.ai || {};

    // 1. Resolve DB Password
    let dbPassword = '';
    if (erpWorkspace.connectionRef && erpWorkspace.connectionRef.startsWith('vault:')) {
      try {
        const vault = new CredentialVault();
        const keyId = erpWorkspace.connectionRef.replace('vault:', '');
        dbPassword = vault.getKey(keyId);
        vault.close();
      } catch (e) {
        // ignore
      }
    }
    if (!dbPassword) {
      const secretPath = path.join(workspaceDir, '.opo', '.db_secret');
      if (fs.existsSync(secretPath)) {
        dbPassword = fs.readFileSync(secretPath, 'utf8').trim();
      }
    }

    // 2. Resolve Cloud API Key
    let cloudApiKey = '';
    if (ai.cloudApiKeyRef && ai.cloudApiKeyRef.startsWith('vault:')) {
      try {
        const vault = new CredentialVault();
        const keyId = ai.cloudApiKeyRef.replace('vault:', '');
        cloudApiKey = vault.getKey(keyId);
        vault.close();
      } catch (e) {
        // ignore
      }
    }

    // Assign solved key to env so resolveApiKey can pick it up
    if (cloudApiKey && ai.currentProvider) {
      const providerKey = ai.currentProvider.toLowerCase();
      if (providerKey === 'gemini') process.env.GEMINI_API_KEY = cloudApiKey;
      if (providerKey === 'openai') process.env.OPENAI_API_KEY = cloudApiKey;
      if (providerKey === 'grok') process.env.GROK_API_KEY = cloudApiKey;
      if (providerKey === 'anthropic') process.env.ANTHROPIC_API_KEY = cloudApiKey;
      if (providerKey === 'openrouter') process.env.OPENROUTER_API_KEY = cloudApiKey;
    }

    // 3. Rebuild full connectionString if needed
    let connectionString = erpWorkspace.connectionString;
    if (!connectionString && erpWorkspace.mssqlMasked) {
      const fullMssql = { ...erpWorkspace.mssqlMasked, password: dbPassword };
      connectionString = buildMssqlConnectionString(fullMssql);
    }

    const healthInput = {
      dataMode: erpWorkspace.dataMode,
      connectionString,
      filial: erpWorkspace.filial,
      erpId: erpWorkspace.erpId,
      dialect: erpWorkspace.dialect,
      currentProvider: ai.currentProvider,
      ollamaBaseUrl: ai.ollamaBaseUrl,
    };

    try {
      const result = await checkStudioHealth(healthInput);

      console.log('\n--- Estado de OPO Studio ---\n');

      if (!options.ollamaOnly) {
        const erpDot = result.erp.status === 'ok' ? chalk.green('●') : result.erp.status === 'warn' ? chalk.yellow('●') : chalk.red('●');
        console.log(`ERP   ${erpDot} ${result.erp.label} ${result.erp.latencyMs ? `(${result.erp.latencyMs}ms)` : ''}`);
        if (result.erp.error) {
          console.log(chalk.red(`      ${result.erp.error}`));
        }
      }

      if (!options.erpOnly) {
        const aiDot = result.ai.status === 'ok' ? chalk.green('●') : result.ai.status === 'warn' ? chalk.yellow('●') : chalk.red('●');
        console.log(`IA    ${aiDot} ${result.ai.label} ${result.ai.latencyMs ? `(${result.ai.latencyMs}ms)` : ''}`);
        if (result.ai.error) {
          console.log(chalk.red(`      ${result.ai.error}`));
        }
      }

      const modeDot = result.dataMode === 'live' ? chalk.green('●') : chalk.yellow('●');
      console.log(`Modo  ${modeDot} ${result.dataMode === 'live' ? 'Datos en vivo' : 'Demostración'}\n`);

      process.exit(result.canQuery ? 0 : 1);
    } catch (err: any) {
      console.error(chalk.red(`❌ Error al ejecutar el control de salud: ${err.message}`));
      process.exit(1);
    }
  });
