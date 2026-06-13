#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// cli/index.ts
var import_commander5 = require("commander");

// cli/commands/init.ts
var import_commander = require("commander");
var import_prompts = __toESM(require("prompts"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_chalk = __toESM(require("chalk"));
var initCommand = new import_commander.Command("init").description("Initialize OPO manifest in the current project").argument("[erp]", "Optional ERP template to use (e.g., sap, odoo, protheus)").action(async (erp) => {
  let selectedErp = erp;
  if (!selectedErp) {
    const response = await (0, import_prompts.default)({
      type: "select",
      name: "erp",
      message: "Which ERP/System template do you want to initialize?",
      choices: [
        { title: "Blank (Empty Template)", value: "blank" },
        { title: "Odoo 17 Community", value: "odoo" },
        { title: "TOTVS Protheus", value: "protheus" },
        { title: "SAP S/4HANA (Basic)", value: "sap" }
      ]
    });
    selectedErp = response.erp;
  }
  if (!selectedErp) {
    console.log(import_chalk.default.yellow("Initialization cancelled."));
    return;
  }
  const wellKnownDir = import_path.default.join(process.cwd(), ".well-known");
  const targetPath = import_path.default.join(wellKnownDir, "opo.json");
  if (!import_fs.default.existsSync(wellKnownDir)) {
    import_fs.default.mkdirSync(wellKnownDir, { recursive: true });
  }
  if (import_fs.default.existsSync(targetPath)) {
    const { overwrite } = await (0, import_prompts.default)({
      type: "confirm",
      name: "overwrite",
      message: ".well-known/opo.json already exists. Overwrite?",
      initial: false
    });
    if (!overwrite) {
      console.log(import_chalk.default.yellow("Initialization cancelled."));
      return;
    }
  }
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
    let templateContent = "";
    const sourcePublicDir = import_path.default.join(__dirname, "../public");
    if (selectedErp === "protheus") {
      const filePath = import_path.default.join(sourcePublicDir, "opo-manifest.example.json");
      if (import_fs.default.existsSync(filePath)) templateContent = import_fs.default.readFileSync(filePath, "utf8");
    } else if (selectedErp === "odoo") {
      const filePath = import_path.default.join(sourcePublicDir, "opo-manifest.example2.json");
      if (import_fs.default.existsSync(filePath)) templateContent = import_fs.default.readFileSync(filePath, "utf8");
    }
    if (templateContent) {
      template = JSON.parse(templateContent);
    }
  } catch (err) {
    console.warn(import_chalk.default.yellow("Could not load detailed template, using default blank."));
  }
  import_fs.default.writeFileSync(targetPath, JSON.stringify(template, null, 2));
  console.log(import_chalk.default.green(`
Success! Created OPO manifest at ${targetPath}`));
  console.log(import_chalk.default.gray(`Next steps:
1. Open .well-known/opo.json
2. Configure your endpoints mapping.
`));
});

// cli/commands/validate.ts
var import_commander2 = require("commander");
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_chalk2 = __toESM(require("chalk"));
var import__ = __toESM(require("ajv/dist/2020"));
var import_ajv_formats = __toESM(require("ajv-formats"));
var validateCommand = new import_commander2.Command("validate").description("Validate a local JSON file against an OPO entity schema").argument("<file>", "Path to the JSON file to validate").argument("<schema>", "Name of the OPO schema (e.g. Invoice, Customer, Product)").action(async (file, schemaName) => {
  var _a;
  const filePath = import_path2.default.resolve(process.cwd(), file);
  if (!import_fs2.default.existsSync(filePath)) {
    console.error(import_chalk2.default.red(`Error: File not found at ${filePath}`));
    process.exit(1);
  }
  const schemaDir = import_path2.default.join(__dirname, "../public/schemas");
  const schemaPath = import_path2.default.join(schemaDir, `${schemaName}.json`);
  if (!import_fs2.default.existsSync(schemaPath)) {
    console.error(import_chalk2.default.red(`Error: OPO Schema '${schemaName}' not found. Check if the name is correct (case-sensitive).`));
    console.error(import_chalk2.default.gray(`Path checked: ${schemaPath}`));
    process.exit(1);
  }
  try {
    const data = JSON.parse(import_fs2.default.readFileSync(filePath, "utf8"));
    const schema = JSON.parse(import_fs2.default.readFileSync(schemaPath, "utf8"));
    const ajv = new import__.default({ strict: false, allErrors: true });
    (0, import_ajv_formats.default)(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (valid) {
      console.log(import_chalk2.default.green(`
\u2705 Success! The file strictly conforms to the OPO ${schemaName} schema.
`));
    } else {
      console.log(import_chalk2.default.red(`
\u274C Validation Failed: The file does not conform to the ${schemaName} schema.
`));
      (_a = validate.errors) == null ? void 0 : _a.forEach((err) => {
        console.log(import_chalk2.default.yellow(`- Property '${err.instancePath}' ${err.message}`));
      });
      console.log("");
      process.exit(1);
    }
  } catch (err) {
    console.error(import_chalk2.default.red(`
An error occurred during validation: ${err.message}
`));
    process.exit(1);
  }
});

// cli/commands/generate.ts
var import_commander3 = require("commander");
var import_fs3 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var import_chalk3 = __toESM(require("chalk"));
var import_json_schema_to_typescript = require("json-schema-to-typescript");
var generateCommand = new import_commander3.Command("generate").description("Generate code or types from OPO schemas").argument("<target>", "Target to generate (e.g. types)").option("-o, --out <path>", "Output file path", "opo-types.d.ts").action(async (target, options) => {
  if (target !== "types") {
    console.error(import_chalk3.default.red(`Error: Unknown target '${target}'. Currently only 'types' is supported.`));
    process.exit(1);
  }
  const schemaDir = import_path3.default.join(__dirname, "../public/schemas");
  const outPath = import_path3.default.resolve(process.cwd(), options.out);
  if (!import_fs3.default.existsSync(schemaDir)) {
    console.error(import_chalk3.default.red(`Error: Schema directory not found at ${schemaDir}`));
    process.exit(1);
  }
  console.log(import_chalk3.default.blue(`Generating TypeScript definitions from OPO Schemas...`));
  try {
    const files = import_fs3.default.readdirSync(schemaDir).filter((f) => f.endsWith(".json"));
    let combinedTypes = `// Auto-generated TypeScript definitions for OPO Protocol
// Do not edit manually.

`;
    for (const file of files) {
      const filePath = import_path3.default.join(schemaDir, file);
      const ts = await (0, import_json_schema_to_typescript.compileFromFile)(filePath, {
        bannerComment: "",
        style: { singleQuote: true }
      });
      combinedTypes += ts + "\n";
    }
    import_fs3.default.writeFileSync(outPath, combinedTypes);
    console.log(import_chalk3.default.green(`\u2705 Successfully generated types at: ${outPath}`));
  } catch (err) {
    console.error(import_chalk3.default.red(`
An error occurred during generation: ${err.message}
`));
    process.exit(1);
  }
});

// cli/commands/translate.ts
var import_commander4 = require("commander");
var import_fs4 = __toESM(require("fs"));
var import_path4 = __toESM(require("path"));
var import_chalk4 = __toESM(require("chalk"));

// cli/utils/sqlTranslator.ts
function translateOpoToSql(opoQuery, dictionary) {
  var _a;
  const entityDict = dictionary[opoQuery.entity];
  if (!entityDict) {
    throw new Error(`Entity '${opoQuery.entity}' not found in mapping dictionary.`);
  }
  const { tableName, fields, joins } = entityDict;
  let params = [];
  let selectClauses = [];
  let joinClauses = [];
  if (opoQuery.select) {
    for (const [key, value] of Object.entries(opoQuery.select)) {
      if (typeof value === "boolean" && value) {
        const physicalColumn = fields[key];
        if (!physicalColumn) throw new Error(`Field '${key}' not mapped for entity '${opoQuery.entity}'.`);
        selectClauses.push(`${tableName}.${physicalColumn} AS "${key}"`);
      } else if (typeof value === "object" && value !== null) {
        if (!joins || !joins[key]) {
          throw new Error(`Join '${key}' not mapped for entity '${opoQuery.entity}'.`);
        }
        const relation = joins[key];
        joinClauses.push(`LEFT JOIN ${relation.tableName} ON ${relation.on}`);
        const nestedSelect = value.select;
        if (nestedSelect) {
          for (const [nKey, nVal] of Object.entries(nestedSelect)) {
            if (nVal) {
              selectClauses.push(`${relation.tableName}.${nKey.toUpperCase()} AS "${key}_${nKey}"`);
            }
          }
        }
      }
    }
  }
  if (selectClauses.length === 0) {
    selectClauses.push(`${tableName}.*`);
  }
  const parseFilterNode = (node, tableAlias) => {
    let conditions = [];
    for (const [key, value] of Object.entries(node)) {
      if (key === "AND") {
        const sub = value.map((v) => parseFilterNode(v, tableAlias)).join(" AND ");
        conditions.push(`(${sub})`);
      } else if (key === "OR") {
        const sub = value.map((v) => parseFilterNode(v, tableAlias)).join(" OR ");
        conditions.push(`(${sub})`);
      } else if (key === "NOT") {
        conditions.push(`NOT (${parseFilterNode(value, tableAlias)})`);
      } else {
        const physicalColumn = fields[key];
        if (!physicalColumn) throw new Error(`Filter field '${key}' not mapped for entity '${opoQuery.entity}'.`);
        const columnRef = `${tableAlias}.${physicalColumn}`;
        for (const [op, val] of Object.entries(value)) {
          switch (op) {
            case "eq":
              conditions.push(`${columnRef} = ?`);
              params.push(val);
              break;
            case "neq":
              conditions.push(`${columnRef} != ?`);
              params.push(val);
              break;
            case "gt":
              conditions.push(`${columnRef} > ?`);
              params.push(val);
              break;
            case "gte":
              conditions.push(`${columnRef} >= ?`);
              params.push(val);
              break;
            case "lt":
              conditions.push(`${columnRef} < ?`);
              params.push(val);
              break;
            case "lte":
              conditions.push(`${columnRef} <= ?`);
              params.push(val);
              break;
            case "like":
              conditions.push(`${columnRef} LIKE ?`);
              params.push(val);
              break;
            case "in":
              const placeholders = val.map(() => "?").join(", ");
              conditions.push(`${columnRef} IN (${placeholders})`);
              params.push(...val);
              break;
            default:
              throw new Error(`Unsupported operator '${op}'`);
          }
        }
      }
    }
    return conditions.join(" AND ");
  };
  let whereClause = "";
  if (opoQuery.filter && Object.keys(opoQuery.filter).length > 0) {
    whereClause = "WHERE " + parseFilterNode(opoQuery.filter, tableName);
  }
  let limitClause = "";
  if ((_a = opoQuery.pagination) == null ? void 0 : _a.limit) {
    limitClause = `LIMIT ${opoQuery.pagination.limit}`;
  }
  const sql = `SELECT ${selectClauses.join(", ")}
FROM ${tableName}
${joinClauses.join("\n")}
${whereClause}
${limitClause}`.trim();
  return { sql, params };
}

// cli/commands/translate.ts
var translateCommand = new import_commander4.Command("translate").description("Translate an OpoQuery JSON into native Parameterized SQL").argument("<target>", "Translation target (e.g., sql)").requiredOption("-q, --query <path>", "Path to the OpoQuery JSON file").requiredOption("-m, --mapping <path>", "Path to the Dictionary Mapping JSON file").action((target, options) => {
  if (target !== "sql") {
    console.error(import_chalk4.default.red(`Error: Unknown translation target '${target}'. Currently only 'sql' is supported.`));
    process.exit(1);
  }
  try {
    const queryPath = import_path4.default.resolve(process.cwd(), options.query);
    const mappingPath = import_path4.default.resolve(process.cwd(), options.mapping);
    if (!import_fs4.default.existsSync(queryPath)) throw new Error(`Query file not found: ${queryPath}`);
    if (!import_fs4.default.existsSync(mappingPath)) throw new Error(`Mapping file not found: ${mappingPath}`);
    const queryPayload = JSON.parse(import_fs4.default.readFileSync(queryPath, "utf8"));
    const mappingDict = JSON.parse(import_fs4.default.readFileSync(mappingPath, "utf8"));
    const targetQuery = queryPayload.query ? queryPayload.query : queryPayload;
    console.log(import_chalk4.default.blue(`Translating OPO-QL to SQL...`));
    const { sql, params } = translateOpoToSql(targetQuery, mappingDict);
    console.log(import_chalk4.default.green(`
\u2705 Translation Successful (Protected by Prepared Statements)`));
    console.log(import_chalk4.default.yellow(`
[GENERATED SQL]`));
    console.log(sql);
    console.log(import_chalk4.default.yellow(`
[PARAMETERS]`));
    console.log(JSON.stringify(params, null, 2));
    console.log();
  } catch (err) {
    console.error(import_chalk4.default.red(`
Translation Failed: ${err.message}
`));
    process.exit(1);
  }
});

// cli/index.ts
var program = new import_commander5.Command();
program.name("opo").description("CLI tool for the Open Protocol Ontology (OPO)").version("0.1.0");
program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(generateCommand);
program.addCommand(translateCommand);
program.parse(process.argv);
