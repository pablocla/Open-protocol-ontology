import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { createProtheusDbClient, detectDriverFromUrl } from '../../lib/mesh/adapters/totvs/protheusDbClient';
import { buildMssqlConnectionString } from '../../lib/studio/onboarding/connectionBuilder';

// Dynamic mapping of database types to OPO field types
function mapType(dbType: string): 'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime' {
  const typeLower = dbType.toLowerCase();
  
  if (['integer', 'int', 'smallint', 'bigint', 'serial', 'bigserial'].includes(typeLower)) {
    return 'Int';
  }
  if (['numeric', 'decimal', 'real', 'double precision', 'float'].includes(typeLower)) {
    return 'Float';
  }
  if (['boolean', 'bool'].includes(typeLower)) {
    return 'Boolean';
  }
  if (['timestamp', 'timestamptz', 'date', 'time', 'timestamp without time zone', 'timestamp with time zone'].some(t => typeLower.includes(t))) {
    return 'DateTime';
  }
  return 'String';
}

// Translate known ERP table abbreviations to business terms (SAP / Totvs Protheus)
const erpDictionary: Record<string, string> = {
  // SAP
  'kna1': 'Customer',
  'vbak': 'SalesOrderHeader',
  'vbap': 'SalesOrderItem',
  'mara': 'Material',
  'bkpf': 'AccountingDocumentHeader',
  'bseg': 'AccountingDocumentSegment',
  'lfa1': 'Supplier',
  // Totvs Protheus
  'sa1': 'Customer',
  'sa2': 'Supplier',
  'sb1': 'Product',
  'sf1': 'PurchaseInvoiceHeader',
  'sf2': 'SalesInvoiceHeader',
  'sc5': 'SalesOrderHeader',
  'sc6': 'SalesOrderItem',
  'sc7': 'PurchaseOrderHeader',
  'sc9': 'SalesOrderReleases'
};

function suggestCanonicalName(tableName: string): string {
  const cleanTable = tableName.trim().toLowerCase();
  
  // 1. Check dictionary first
  if (erpDictionary[cleanTable]) {
    return erpDictionary[cleanTable];
  }
  
  // 2. Remove common prefixes/suffixes
  let term = cleanTable
    .replace(/^tbl_/, '')
    .replace(/^t_/, '')
    .replace(/_tbl$/, '')
    .replace(/_table$/, '');
    
  // 3. Convert snake_case to PascalCase
  return term
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export const discoverCommand = new Command('discover')
  .description('Auto-discover database schema and generate OPO manifest file (.opo.json)')
  .option('-d, --db <type>', 'Database type: postgres | mssql | oracle (auto-detected from --url if omitted)', 'auto')
  .option('-e, --erp <name>', 'ERP adapter: totvs-protheus (uses SX2/SX3/SX9 dictionary)')
  .option('--mock', 'Use embedded mock dictionary (Protheus SX tables)')
  .option('--company-suffix <suffix>', 'Protheus company table suffix, e.g. 010 → SX2010', '010')
  .option('--filial <code>', 'Protheus filial code (default "01")', '01')
  .option('--server <server>', 'SQL Server server/host')
  .option('--port <port>', 'SQL Server port', '1433')
  .option('--database <database>', 'SQL Server database name')
  .option('--user <user>', 'SQL Server username')
  .option('--password <password>', 'SQL Server password')
  .option('--encrypt', 'Encrypt connection (default false)', false)
  .option('--trust-server-certificate', 'Trust server certificate (default true)', true)
  .option('--table-filter <glob>', 'Table glob filter, e.g. "SC*,SA*,SF*"')
  .option('-u, --url <url>', 'Database connection string/URL')
  .option('-o, --output <file>', 'Output manifest path', '.well-known/opo.json')
  .action(async (options) => {
    console.log(chalk.yellow('\n⚠️  [Deprecado] El comando "opo discover" directo ha sido deprecado. Usá "opo onboard" para un setup completo e interactivo.\n'));
    console.log(chalk.blue('🚀 Starting OPO Schema Auto-Discovery...'));

    // Build connection string if individual MSSQL connection fields are provided
    if (options.server && options.database) {
      options.url = buildMssqlConnectionString({
        server: options.server,
        port: Number(options.port) || 1433,
        database: options.database,
        user: options.user,
        password: options.password,
        encrypt: options.encrypt,
        trustServerCertificate: options.trustServerCertificate,
      });
    }

    // TOTVS Protheus: DER desde diccionario SX (no hay FKs SQL)
    if (options.erp === 'totvs-protheus') {
      const { discoverProtheusOntology } = require('../../lib/mesh/adapters/totvs');
      const mode = options.mock ? 'mock' : 'database';

      if (mode === 'database' && !options.url) {
        console.error(chalk.red('\n❌ Error: --url is required for totvs-protheus unless --mock is set.'));
        process.exit(1);
      }

      try {
        console.log(chalk.gray(`Protheus dictionary mode: ${mode}${options.tableFilter ? ` (filter: ${options.tableFilter})` : ''}`));
        const { manifest, snapshot } = await discoverProtheusOntology(
          {
            mode,
            connectionString: options.url,
            companySuffix: options.companySuffix,
            tableFilter: options.tableFilter,
          },
          {
            baseUrl: options.url || '',
            organizationName: 'Auto-Discovered Org',
          }
        );

        const outputPath = path.resolve(process.cwd(), options.output);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

        console.log(chalk.green(`\n✅ Success! Created Protheus OPO manifest at ${outputPath}`));
        console.log(chalk.gray(`  - Tables (SX2): ${snapshot.tables.length}`));
        console.log(chalk.gray(`  - Fields (SX3): ${snapshot.fields.length}`));
        console.log(chalk.gray(`  - Relationships (SX9): ${manifest.relationships.length}\n`));
        return;
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Protheus Auto-Discovery Failed: ${err.message}`));
        process.exit(1);
      }
    }

    if (!options.url) {
      console.error(chalk.red('\n❌ Error: --url is required for generic database discovery.'));
      process.exit(1);
    }
    
    const resolvedDb =
      options.db === 'auto' ? detectDriverFromUrl(options.url) : options.db;

    if (!['postgres', 'postgresql', 'mssql', 'oracle'].includes(resolvedDb)) {
      console.error(
        chalk.red(`\n❌ Error: Database type '${resolvedDb}' is not supported. Use postgres, mssql, or oracle.`)
      );
      process.exit(1);
    }

    const dbDriver = resolvedDb === 'postgresql' ? 'postgres' : resolvedDb;
    const client = await createProtheusDbClient(options.url);

    try {
      console.log(chalk.gray(`Connecting to ${dbDriver} at ${options.url.replace(/:([^:@]+)@/, ':****@')}...`));
      console.log(chalk.green('✅ Connected successfully!'));

      let tables: string[] = [];
      let columnsRows: any[] = [];
      let pkRows: any[] = [];
      let fkRows: any[] = [];

      if (dbDriver === 'postgres') {
        console.log(chalk.gray('Inspecting tables...'));
        const tablesRes = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `);
        tables = tablesRes.rows.map((r: any) => r.table_name);

        const columnsRes = await client.query(`
          SELECT table_name, column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `);
        columnsRows = columnsRes.rows;

        const pksRes = await client.query(`
          SELECT kcu.table_name, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public';
        `);
        pkRows = pksRes.rows;

        const fksRes = await client.query(`
          SELECT
            kcu.table_name AS source_table,
            kcu.column_name AS source_column,
            ccu.table_name AS target_table,
            ccu.column_name AS target_column
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
        `);
        fkRows = fksRes.rows;
      } else if (dbDriver === 'mssql') {
        const tablesRes = await client.query(`
          SELECT t.name AS table_name
          FROM sys.tables t
          ORDER BY t.name;
        `);
        tables = tablesRes.rows.map((r: any) => r.table_name);

        const columnsRes = await client.query(`
          SELECT t.name AS table_name, c.name AS column_name, ty.name AS data_type,
                 CASE WHEN c.is_nullable = 1 THEN 'YES' ELSE 'NO' END AS is_nullable,
                 NULL AS column_default
          FROM sys.tables t
          JOIN sys.columns c ON t.object_id = c.object_id
          JOIN sys.types ty ON c.user_type_id = ty.user_type_id
          ORDER BY t.name, c.column_id;
        `);
        columnsRows = columnsRes.rows;

        const pksRes = await client.query(`
          SELECT t.name AS table_name, c.name AS column_name
          FROM sys.tables t
          JOIN sys.indexes i ON t.object_id = i.object_id AND i.is_primary_key = 1
          JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id;
        `);
        pkRows = pksRes.rows;

        fkRows = [];
      } else {
        const tablesRes = await client.query(`
          SELECT table_name FROM user_tables ORDER BY table_name
        `);
        tables = tablesRes.rows.map((r: any) => r.TABLE_NAME ?? r.table_name);

        const columnsRes = await client.query(`
          SELECT utc.TABLE_NAME AS table_name, utc.COLUMN_NAME AS column_name,
                 utc.DATA_TYPE AS data_type, utc.NULLABLE AS is_nullable, NULL AS column_default
          FROM USER_TAB_COLUMNS utc
          ORDER BY utc.TABLE_NAME, utc.COLUMN_ID
        `);
        columnsRows = columnsRes.rows;

        const pksRes = await client.query(`
          SELECT ucc.TABLE_NAME AS table_name, ucc.COLUMN_NAME AS column_name
          FROM USER_CONS_COLUMNS ucc
          JOIN USER_CONSTRAINTS uc ON ucc.CONSTRAINT_NAME = uc.CONSTRAINT_NAME
          WHERE uc.CONSTRAINT_TYPE = 'P'
        `);
        pkRows = pksRes.rows;
        fkRows = [];
      }

      console.log(chalk.gray(`Found ${tables.length} tables.`));
      if (tables.length === 0) {
        console.warn(chalk.yellow('⚠️ No tables found.'));
        await client.close();
        return;
      }

      const primaryKeysMap = new Map<string, string[]>();
      pkRows.forEach((row: any) => {
        const tableName = row.table_name ?? row.TABLE_NAME;
        const columnName = row.column_name ?? row.COLUMN_NAME;
        const list = primaryKeysMap.get(tableName) || [];
        list.push(columnName);
        primaryKeysMap.set(tableName, list);
      });

      const entitiesMap = new Map<string, any>();
      columnsRows.forEach((col: any) => {
        const tableName = col.table_name ?? col.TABLE_NAME;
        const columnName = col.column_name ?? col.COLUMN_NAME;
        const dataType = col.data_type ?? col.DATA_TYPE;
        const isNullable = col.is_nullable ?? col.IS_NULLABLE;
        if (!entitiesMap.has(tableName)) {
          entitiesMap.set(tableName, {
            name: tableName,
            canonical: `opo:${suggestCanonicalName(tableName)}`,
            attributes: []
          });
        }
        
        const entity = entitiesMap.get(tableName);
        const pks = primaryKeysMap.get(tableName) || [];
        const isPk = pks.includes(columnName);

        entity.attributes.push({
          id: `attr-${tableName}-${columnName}`,
          name: columnName,
          type: mapType(dataType),
          isPrimaryKey: isPk,
          isRequired: isNullable === 'NO' || isNullable === 'N' || isPk,
          isUnique: isPk,
          defaultValue: col.column_default || undefined
        });
      });

      const supportedEntities: any[] = [];
      const customMappings: Record<string, any> = {};

      entitiesMap.forEach((entity, tableName) => {
        const businessName = entity.canonical.replace(/^opo:/, '');
        supportedEntities.push({
          canonical: entity.canonical,
          native_reference: tableName,
          confidence: 0.95,
          limitations: `Auto-discovered from physical table ${tableName}`
        });

        // Add mapping for properties
        const fieldsMapping: Record<string, string> = {};
        entity.attributes.forEach((attr: any) => {
          // Standard camelCase suggestion for canonical fields
          const camelName = attr.name.toLowerCase().replace(/_([a-z])/g, (_match: any, group: string) => group.toUpperCase());
          fieldsMapping[camelName] = attr.name;
        });

        customMappings[businessName] = {
          [`${tableName}_fields`]: fieldsMapping,
          attributes: entity.attributes // Include schema for OPO Studio canvas loading
        };
      });

      // Construct relationship connections
      const relationships: any[] = [];
      fkRows.forEach((row: any) => {
        const sourceCanonical = `opo:${suggestCanonicalName(row.source_table)}`;
        const targetCanonical = `opo:${suggestCanonicalName(row.target_table)}`;
        relationships.push({
          id: `rel-${row.source_table}-${row.target_table}`,
          source: row.source_table,
          target: row.target_table,
          sourceCanonical,
          targetCanonical,
          sourceColumn: row.source_column,
          targetColumn: row.target_column,
          cardinality: 'ONE_TO_MANY' // Standard default for foreign keys
        });
      });

      const manifest = {
        opo_version: '0.1.0',
        system_identity: {
          erp_name: `${dbDriver.toUpperCase()} Database`,
          version: '1.0',
          organization_name: 'Auto-Discovered Org'
        },
        adapter_configuration: {
          base_url: options.url,
          protocol_interface: 'SQL'
        },
        supported_entities: supportedEntities,
        custom_mappings: customMappings,
        relationships: relationships, // Extra field stored for OPO Studio reconstruction
        discoveredAt: new Date().toISOString()
      };

      const outputPath = path.resolve(process.cwd(), options.output);
      const outputDir = path.dirname(outputPath);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

      console.log(chalk.green(`\n✅ Success! Created OPO manifest at ${outputPath}`));
      console.log(chalk.gray(`  - Found ${tables.length} tables.`));
      console.log(chalk.gray(`  - Mapped ${supportedEntities.length} entities.`));
      console.log(chalk.gray(`  - Identified ${relationships.length} foreign key relations.\n`));

    } catch (err: any) {
      console.error(chalk.red(`\n❌ Auto-Discovery Failed: ${err.message}`));
      process.exit(1);
    } finally {
      await client.close().catch(() => {});
    }
  });
