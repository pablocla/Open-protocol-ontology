import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { runOpoQueryById } from '../../lib/studio/runOpoQuery';
import { matchRecurringQueryFromText } from '../../lib/studio/matchRecurringQuery';
import { buildConsultaSummary } from '../../lib/studio/consultasSummary';
import { getRecurringQueriesForContext } from '../../lib/studio/recurringQueries';
import { CredentialVault } from '../../lib/engine/vault/credential-vault';
import { buildMssqlConnectionString } from '../../lib/studio/onboarding/connectionBuilder';

export const queryCommand = new Command('query')
  .description('Ejecutar consultas en lenguaje natural o por ID de consulta recurrente')
  .argument('[text]', 'Texto de la consulta en lenguaje natural')
  .option('-r, --recurring <id>', 'ID de consulta recurrente directa')
  .option('-p, --param <param>', 'Parámetros para la consulta recurrente en formato clave=valor (puede repetirse)', (val, memo: string[]) => {
    memo.push(val);
    return memo;
  }, [])
  .option('-f, --format <format>', 'Formato de salida: table | json | csv', 'table')
  .action(async (text, options) => {
    const workspaceDir = process.env.OPO_WORKSPACE_DIR || process.cwd();
    const workspacePath = path.join(workspaceDir, '.opo', 'workspace.json');
    const manifestPath = path.join(workspaceDir, '.well-known', 'opo.json');

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

    const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
    const erpWorkspace = wsData.erpWorkspace || {};
    const projectName = wsData.project?.name || manifest.system_identity?.erp_name || 'Protheus';

    // Parse parameters from command line flags
    const cliParams: Record<string, string> = {};
    if (options.param && options.param.length > 0) {
      for (const p of options.param) {
        const eqIdx = p.indexOf('=');
        if (eqIdx !== -1) {
          const key = p.substring(0, eqIdx).trim();
          const value = p.substring(eqIdx + 1).trim();
          cliParams[key] = value;
        }
      }
    }

    let query: any;
    let paramValues: Record<string, string> = {};

    if (options.recurring) {
      const catalog = getRecurringQueriesForContext(manifest, projectName);
      query = catalog.find((q: any) => q.id === options.recurring);
      if (!query) {
        console.error(chalk.red(`\n❌ No se encontró la consulta recurrente "${options.recurring}"`));
        console.log(chalk.gray(`Consultas disponibles: ${catalog.map((c: any) => c.id).join(', ')}`));
        process.exit(1);
      }
      paramValues = { ...cliParams };
    } else {
      if (!text) {
        console.error(chalk.red('\n❌ Error: Debés ingresar una consulta en lenguaje natural o especificar --recurring.'));
        process.exit(1);
      }
      const matched = matchRecurringQueryFromText(text, manifest, projectName);
      if (!matched || matched.score < 8) {
        console.error(chalk.red(`\n❌ No se encontró una consulta recurrente que coincida con: "${text}"`));
        console.log(chalk.gray(`Score obtenido: ${matched?.score || 0}. Probá refrasear o usar --recurring.`));
        process.exit(1);
      }
      query = matched.query;
      paramValues = { ...matched.paramValues, ...cliParams };
    }

    // Resolve defaults for missing parameters
    for (const p of query.params) {
      if (paramValues[p.key] === undefined) {
        paramValues[p.key] = p.defaultValue;
      }
    }

    // Resolve DB Password
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

    // Rebuild full connectionString if needed
    let connectionString = erpWorkspace.connectionString;
    if (!connectionString && erpWorkspace.mssqlMasked) {
      const fullMssql = { ...erpWorkspace.mssqlMasked, password: dbPassword };
      connectionString = buildMssqlConnectionString(fullMssql);
    }

    const erpExecution = {
      mode: erpWorkspace.dataMode,
      connectionString,
      filial: erpWorkspace.filial,
      companySuffix: erpWorkspace.companySuffix,
      dialect: erpWorkspace.dialect,
      context: {
        erp: erpWorkspace.erpId,
        filial: erpWorkspace.filial,
        companySuffix: erpWorkspace.companySuffix,
        dialect: erpWorkspace.dialect
      }
    };

    try {
      const result = await runOpoQueryById(
        query.id,
        paramValues,
        manifest,
        projectName,
        erpExecution
      );

      const format = options.format.toLowerCase();

      if (format === 'json') {
        console.log(JSON.stringify(result.data, null, 2));
      } else if (format === 'csv') {
        if (result.data.length > 0) {
          const headers = Object.keys(result.data[0]);
          console.log(headers.join(','));
          for (const row of result.data) {
            console.log(
              headers
                .map((h) => {
                  const val = row[h];
                  if (val === null || val === undefined) return '';
                  const str = String(val);
                  return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
                })
                .join(',')
            );
          }
        }
      } else {
        // Table format
        const summary = buildConsultaSummary(query, result.data, result.pagination);
        console.log(chalk.cyan(`\nResumen: ${summary}\n`));
        if (result.data.length > 0) {
          console.table(result.data);
        } else {
          console.log(chalk.yellow('No se encontraron registros.'));
        }
        console.log('');
      }
    } catch (err: any) {
      console.error(chalk.red(`❌ Error al ejecutar consulta: ${err.message}`));
      process.exit(1);
    }
  });
