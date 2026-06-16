import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { pingOllama, pingErp, runDiscovery, persistWorkspace } from '../../lib/studio/onboarding/onboardingOrchestrator';
import { buildMssqlConnectionString } from '../../lib/studio/onboarding/connectionBuilder';
import { OnboardingConfig } from '../../lib/studio/onboarding/onboardingTypes';

export const onboardCommand = new Command('onboard')
  .description('Wizard interactivo o comando no interactivo para configurar Ollama + Protheus (MSSQL)')
  .option('--erp <name>', 'Identificador de ERP (protheus | sap | odoo)', 'protheus')
  .option('--mode <mode>', 'Modo de ejecución (demo | live)', 'demo')
  .option('--server <server>', 'Servidor SQL (requerido para modo live)')
  .option('--port <port>', 'Puerto SQL Server (default 1433)', '1433')
  .option('--database <db>', 'Base de datos SQL (requerido para modo live)')
  .option('--user <user>', 'Usuario SQL')
  .option('--password <pass>', 'Contraseña SQL')
  .option('--filial <filial>', 'Filial de Protheus (default 01)', '01')
  .option('--company-suffix <suffix>', 'Sufijo de empresa (default 010)', '010')
  .option('--ollama <url>', 'URL del servidor de Ollama')
  .option('--model <model>', 'Modelo de Ollama a utilizar')
  .option('--api-key <key>', 'API key para proveedor cloud (Gemini/OpenAI)')
  .option('--config <path>', 'Configuración cargada desde archivo JSON')
  .option('-o, --output <file>', 'Ruta de salida para el manifiesto', '.well-known/opo.json')
  .action(async (options) => {
    let config: OnboardingConfig;

    const isNonInteractive =
      options.config ||
      options.server ||
      options.database ||
      options.ollama ||
      options.model ||
      options.apiKey ||
      options.mode === 'live' ||
      process.env.CI;

    if (options.config) {
      const configPath = path.resolve(process.cwd(), options.config);
      if (!fs.existsSync(configPath)) {
        console.error(chalk.red(`\n❌ Error: El archivo de configuración no existe en ${configPath}`));
        process.exit(1);
      }
      try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(fileContent);
        console.log(chalk.green(`\n✓ Configuración cargada desde ${options.config}`));
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Error al leer el archivo JSON: ${err.message}`));
        process.exit(1);
      }
    } else if (isNonInteractive) {
      const mode = options.mode || 'demo';
      const erpId = options.erp || 'protheus';
      const filial = options.filial || '01';
      const companySuffix = options.companySuffix || '010';
      const provider = options.apiKey ? 'gemini' : 'ollama';
      const ollamaBaseUrl = options.ollama || 'http://localhost:11434';
      const ollamaModel = options.model || 'llama3.1';
      const cloudApiKey = options.apiKey || '';

      const mssql = mode === 'live' ? {
        server: options.server || 'localhost',
        port: Number(options.port) || 1433,
        database: options.database || '',
        user: options.user,
        password: options.password,
        encrypt: false,
        trustServerCertificate: true,
      } : undefined;

      const connectionString = mssql ? buildMssqlConnectionString(mssql) : undefined;

      config = {
        ai: {
          provider: provider as any,
          ollamaBaseUrl,
          ollamaModel,
          cloudApiKey,
        },
        erp: {
          erpId: erpId as any,
          dataMode: mode as any,
          mssql,
          connectionString,
          filial,
          companySuffix,
        }
      };

      if (mode === 'live') {
        if (!options.server || !options.database) {
          console.error(chalk.red('\n❌ Error: --server y --database son obligatorios en modo live no interactivo.'));
          process.exit(1);
        }
        console.log(chalk.gray('Probando conexión SQL Server (no interactivo)...'));
        const erpPing = await pingErp(connectionString!, 'mssql');
        if (!erpPing.ok) {
          console.error(chalk.red(`\n❌ Conexión fallida: ${erpPing.error}`));
          process.exit(1);
        }
        console.log(chalk.green(`✓ Conexión SQL OK (${erpPing.latencyMs}ms)`));
      }
    } else {
      // Flow interactivo con prompts
      console.log(chalk.blue('\n--- OPO Studio Onboarding Wizard ---\n'));

      // Paso 1/5 - Asistente IA
      const aiProviderPrompt = await prompts({
        type: 'select',
        name: 'provider',
        message: 'Paso 1/5 — Asistente IA - Seleccioná tu proveedor:',
        choices: [
          { title: 'Ollama (Local)', value: 'ollama' },
          { title: 'Google Gemini (Nube)', value: 'gemini' },
          { title: 'OpenAI (Nube)', value: 'openai' },
        ],
        initial: 0
      });
      if (!aiProviderPrompt.provider) {
        console.log(chalk.yellow('\nOnboarding cancelado.'));
        process.exit(0);
      }

      let provider = aiProviderPrompt.provider;
      let ollamaBaseUrl = 'http://localhost:11434';
      let ollamaModel = 'llama3.1';
      let cloudApiKey = '';

      if (provider === 'ollama') {
        const ollamaUrlPrompt = await prompts({
          type: 'text',
          name: 'url',
          message: 'URL de Ollama:',
          initial: 'http://localhost:11434'
        });
        if (!ollamaUrlPrompt.url) {
          console.log(chalk.yellow('\nOnboarding cancelado.'));
          process.exit(0);
        }
        ollamaBaseUrl = ollamaUrlPrompt.url;

        console.log(chalk.gray('Comprobando conexión a Ollama...'));
        const ollamaRes = await pingOllama(ollamaBaseUrl);
        if (ollamaRes.ok && ollamaRes.models.length > 0) {
          console.log(chalk.green(`✓ Ollama OK — ${ollamaRes.models.length} modelos detectados`));
          const modelPrompt = await prompts({
            type: 'select',
            name: 'model',
            message: 'Seleccioná el modelo a usar:',
            choices: ollamaRes.models.map(m => ({ title: m, value: m })),
            initial: 0
          });
          if (modelPrompt.model) {
            ollamaModel = modelPrompt.model;
          }
        } else {
          console.log(chalk.yellow(`⚠️  No se pudo conectar a Ollama o no tiene modelos instalados: ${ollamaRes.error || 'Sin modelos'}`));
          const modelPrompt = await prompts({
            type: 'text',
            name: 'model',
            message: 'Ingresá el nombre del modelo manualmente:',
            initial: 'llama3.1'
          });
          if (!modelPrompt.model) {
            console.log(chalk.yellow('\nOnboarding cancelado.'));
            process.exit(0);
          }
          ollamaModel = modelPrompt.model;
        }
      } else {
        const apiKeyPrompt = await prompts({
          type: 'password',
          name: 'apiKey',
          message: `API Key de ${provider === 'gemini' ? 'Gemini' : 'OpenAI'}:`,
        });
        if (!apiKeyPrompt.apiKey) {
          console.log(chalk.yellow('\nOnboarding cancelado.'));
          process.exit(0);
        }
        cloudApiKey = apiKeyPrompt.apiKey;

        const defaultModel = provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o';
        const modelPrompt = await prompts({
          type: 'text',
          name: 'model',
          message: `Modelo a usar (default: ${defaultModel}):`,
          initial: defaultModel
        });
        ollamaModel = modelPrompt.model || defaultModel;
      }

      // Paso 2/5 - ERP
      const erpPrompt = await prompts({
        type: 'select',
        name: 'erpId',
        message: 'Paso 2/5 — Proveedor de ERP:',
        choices: [
          { title: 'TOTVS Protheus (MSSQL)', value: 'protheus' },
          { title: 'SAP (Stub)', value: 'sap' },
          { title: 'Odoo (Stub)', value: 'odoo' },
        ],
        initial: 0
      });
      if (!erpPrompt.erpId) {
        console.log(chalk.yellow('\nOnboarding cancelado.'));
        process.exit(0);
      }

      const modePrompt = await prompts({
        type: 'select',
        name: 'dataMode',
        message: 'Modo (demo / live):',
        choices: [
          { title: 'Demostración (Mock local)', value: 'demo' },
          { title: 'En Vivo (Conexión real SQL Server)', value: 'live' },
        ],
        initial: 0
      });
      if (!modePrompt.dataMode) {
        console.log(chalk.yellow('\nOnboarding cancelado.'));
        process.exit(0);
      }

      const erpId = erpPrompt.erpId;
      const mode = modePrompt.dataMode;
      let mssql: any;
      let connectionString: string | undefined;
      let filial = '01';
      let companySuffix = '010';

      if (mode === 'live') {
        const serverPrompt = await prompts({
          type: 'text',
          name: 'server',
          message: 'Servidor SQL:',
          initial: 'localhost'
        });
        if (!serverPrompt.server) process.exit(0);

        const portPrompt = await prompts({
          type: 'number',
          name: 'port',
          message: 'Puerto SQL:',
          initial: 1433
        });
        if (portPrompt.port === undefined) process.exit(0);

        const databasePrompt = await prompts({
          type: 'text',
          name: 'database',
          message: 'Base de datos:',
        });
        if (!databasePrompt.database) process.exit(0);

        const userPrompt = await prompts({
          type: 'text',
          name: 'user',
          message: 'Usuario SQL:',
          initial: 'sa'
        });
        if (!userPrompt.user) process.exit(0);

        const passwordPrompt = await prompts({
          type: 'password',
          name: 'password',
          message: 'Contraseña SQL:',
        });
        if (passwordPrompt.password === undefined) process.exit(0);

        const filialPrompt = await prompts({
          type: 'text',
          name: 'filial',
          message: 'Filial Protheus:',
          initial: '01'
        });
        if (!filialPrompt.filial) process.exit(0);
        filial = filialPrompt.filial;

        const suffixPrompt = await prompts({
          type: 'text',
          name: 'companySuffix',
          message: 'Sufijo empresa:',
          initial: '010'
        });
        if (!suffixPrompt.companySuffix) process.exit(0);
        companySuffix = suffixPrompt.companySuffix;

        mssql = {
          server: serverPrompt.server,
          port: portPrompt.port,
          database: databasePrompt.database,
          user: userPrompt.user,
          password: passwordPrompt.password,
          encrypt: false,
          trustServerCertificate: true,
        };
        connectionString = buildMssqlConnectionString(mssql);

        console.log(chalk.gray('Probando conexión SQL Server...'));
        const erpPing = await pingErp(connectionString, 'mssql');
        if (!erpPing.ok) {
          console.error(chalk.red(`❌ No llegamos al servidor SQL: ${erpPing.error || 'Error desconocido'}`));
          console.error(chalk.yellow('¿VPN activa? ¿Puerto 1433 abierto? ¿Credenciales correctas?'));
          console.log(chalk.red('Onboarding cancelado por fallo de conexión en base real.'));
          process.exit(1);
        }
        console.log(chalk.green(`✓ Conexión SQL OK (${erpPing.latencyMs}ms)`));
      } else {
        const filialPrompt = await prompts({
          type: 'text',
          name: 'filial',
          message: 'Filial Protheus (Demo):',
          initial: '01'
        });
        if (!filialPrompt.filial) process.exit(0);
        filial = filialPrompt.filial;

        const suffixPrompt = await prompts({
          type: 'text',
          name: 'companySuffix',
          message: 'Sufijo empresa (Demo):',
          initial: '010'
        });
        if (!suffixPrompt.companySuffix) process.exit(0);
        companySuffix = suffixPrompt.companySuffix;
      }

      config = {
        ai: {
          provider,
          ollamaBaseUrl,
          ollamaModel,
          cloudApiKey,
        },
        erp: {
          erpId,
          dataMode: mode,
          mssql,
          connectionString,
          filial,
          companySuffix,
        }
      };
    }

    // Paso 3/5 - Introspección
    console.log(chalk.blue('\nPaso 3/5 — Introspección'));
    console.log(chalk.gray('⠋ Leyendo diccionario SX2/SX3/SX9...'));
    try {
      const { manifest, graph } = await runDiscovery(config);
      const entitiesCount = graph.nodes?.length || 0;
      const relsCount = graph.edges?.length || 0;
      console.log(chalk.green(`✓ Mapeo exitoso: ${entitiesCount} entidades, ${relsCount} relaciones detectadas`));

      // Paso 4/5 - Guardando workspace
      console.log(chalk.blue('\nPaso 4/5 — Guardando workspace'));
      const outputOverride = options.output !== '.well-known/opo.json' ? path.dirname(path.resolve(process.cwd(), options.output)) : undefined;
      const { manifestPath, workspacePath } = await persistWorkspace(config, manifest, graph, outputOverride);
      console.log(chalk.green(`✓ Manifiesto guardado en: ${manifestPath}`));
      console.log(chalk.green(`✓ Workspace guardado en: ${workspacePath}`));

      // Paso 5/5 - Listo
      console.log(chalk.blue('\nPaso 5/5 — ¡Listo!'));
      console.log(chalk.gray('\nConsultá con:'));
      console.log(chalk.cyan(`  opo query "¿Cuánto debe el cliente 000219?"`));
      console.log(chalk.gray('\nO abrí UI Studio:'));
      console.log(chalk.cyan(`  opo studio`));
      console.log(chalk.gray('  Accedé en: http://localhost:3000/consultas\n'));
    } catch (err: any) {
      console.error(chalk.red(`❌ Fallo en introspección: ${err.message}`));
      process.exit(1);
    }
  });
