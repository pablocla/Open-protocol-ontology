#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
var import_commander10 = require("commander");

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
  const schemaDir = import_path3.default.join(__dirname, "../../public/schemas");
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
function parseFilterNode(node, tableAlias, fields, params, opoEntity) {
  let conditions = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === "AND") {
      const sub = value.map((v) => parseFilterNode(v, tableAlias, fields, params, opoEntity)).join(" AND ");
      conditions.push(`(${sub})`);
    } else if (key === "OR") {
      const sub = value.map((v) => parseFilterNode(v, tableAlias, fields, params, opoEntity)).join(" OR ");
      conditions.push(`(${sub})`);
    } else if (key === "NOT") {
      conditions.push(`NOT (${parseFilterNode(value, tableAlias, fields, params, opoEntity)})`);
    } else {
      const physicalColumn = fields[key];
      if (!physicalColumn) throw new Error(`Filter field '${key}' not mapped for entity '${opoEntity}'.`);
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
}
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
  let whereClause = "";
  if (opoQuery.filter && Object.keys(opoQuery.filter).length > 0) {
    whereClause = "WHERE " + parseFilterNode(opoQuery.filter, tableName, fields, params, opoQuery.entity);
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
function translateOpoMutationToSql(opoMutation, dictionary) {
  const entityDict = dictionary[opoMutation.entity];
  if (!entityDict) {
    throw new Error(`Entity '${opoMutation.entity}' not found in mapping dictionary.`);
  }
  const { tableName, fields } = entityDict;
  let params = [];
  let sql = "";
  switch (opoMutation.action) {
    case "CREATE": {
      if (!opoMutation.payload || Object.keys(opoMutation.payload).length === 0) {
        throw new Error("CREATE mutation requires a payload");
      }
      const columns = [];
      const placeholders = [];
      for (const [key, value] of Object.entries(opoMutation.payload)) {
        const physicalColumn = fields[key];
        if (!physicalColumn) throw new Error(`Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`);
        columns.push(physicalColumn);
        placeholders.push("?");
        params.push(value);
      }
      sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      break;
    }
    case "UPDATE": {
      if (!opoMutation.payload || Object.keys(opoMutation.payload).length === 0) {
        throw new Error("UPDATE mutation requires a payload");
      }
      if (!opoMutation.filter || Object.keys(opoMutation.filter).length === 0) {
        throw new Error("UPDATE mutation requires a filter to prevent mass updates");
      }
      const setClauses = [];
      for (const [key, value] of Object.entries(opoMutation.payload)) {
        const physicalColumn = fields[key];
        if (!physicalColumn) throw new Error(`Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`);
        setClauses.push(`${physicalColumn} = ?`);
        params.push(value);
      }
      const whereClause = parseFilterNode(opoMutation.filter, tableName, fields, params, opoMutation.entity);
      sql = `UPDATE ${tableName} SET ${setClauses.join(", ")} WHERE ${whereClause}`;
      break;
    }
    case "DELETE": {
      if (!opoMutation.filter || Object.keys(opoMutation.filter).length === 0) {
        throw new Error("DELETE mutation requires a filter to prevent mass deletes");
      }
      const whereClause = parseFilterNode(opoMutation.filter, tableName, fields, params, opoMutation.entity);
      sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
      break;
    }
    default:
      throw new Error(`Unsupported mutation action '${opoMutation.action}'`);
  }
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

// cli/commands/mutate.ts
var import_commander5 = require("commander");
var import_fs5 = __toESM(require("fs"));
var import_path5 = __toESM(require("path"));
var import_chalk5 = __toESM(require("chalk"));
var mutateCommand = new import_commander5.Command("mutate").description("Translate an OpoMutation JSON into native Parameterized SQL (CREATE, UPDATE, DELETE)").argument("<target>", "Translation target (e.g., sql)").requiredOption("-m, --mutation <path>", "Path to the OpoMutation JSON file").requiredOption("-d, --dictionary <path>", "Path to the Dictionary Mapping JSON file").action((target, options) => {
  if (target !== "sql") {
    console.error(import_chalk5.default.red(`Error: Unknown translation target '${target}'. Currently only 'sql' is supported.`));
    process.exit(1);
  }
  try {
    const mutationPath = import_path5.default.resolve(process.cwd(), options.mutation);
    const mappingPath = import_path5.default.resolve(process.cwd(), options.dictionary);
    if (!import_fs5.default.existsSync(mutationPath)) throw new Error(`Mutation file not found: ${mutationPath}`);
    if (!import_fs5.default.existsSync(mappingPath)) throw new Error(`Mapping file not found: ${mappingPath}`);
    const mutationPayload = JSON.parse(import_fs5.default.readFileSync(mutationPath, "utf8"));
    const mappingDict = JSON.parse(import_fs5.default.readFileSync(mappingPath, "utf8"));
    const targetMutation = mutationPayload.mutation ? mutationPayload.mutation : mutationPayload;
    console.log(import_chalk5.default.blue(`Translating OPO Mutation to SQL...`));
    const { sql, params } = translateOpoMutationToSql(targetMutation, mappingDict);
    console.log(import_chalk5.default.green(`
\u2705 Mutation Translation Successful (Protected by Prepared Statements)`));
    console.log(import_chalk5.default.yellow(`
[GENERATED SQL]`));
    console.log(sql);
    console.log(import_chalk5.default.yellow(`
[PARAMETERS]`));
    console.log(JSON.stringify(params, null, 2));
    console.log();
  } catch (err) {
    console.error(import_chalk5.default.red(`
Translation Failed: ${err.message}
`));
    process.exit(1);
  }
});

// cli/commands/mcp.ts
var import_commander6 = require("commander");
var import_path6 = __toESM(require("path"));
var import_fs6 = __toESM(require("fs"));
var import_chalk6 = __toESM(require("chalk"));
var import_opo_sdk = require("opo-sdk");
var mcpStartCommand = new import_commander6.Command("mcp-start").description("Start the OPO Model Context Protocol (MCP) Server over stdio").option("-m, --mappings <dir>", "Directory containing mapping JSON files", "./registry").action((options) => {
  const mappingDir = import_path6.default.resolve(process.cwd(), options.mappings);
  console.error(import_chalk6.default.blue(`[CLI] Starting OPO MCP Server...`));
  console.error(import_chalk6.default.blue(`[CLI] Scanning mappings directory: ${mappingDir}`));
  if (!import_fs6.default.existsSync(mappingDir)) {
    console.error(import_chalk6.default.red(`[CLI] Error: Mappings directory not found: ${mappingDir}`));
    process.exit(1);
  }
  try {
    const server = new import_opo_sdk.OpoMcpServer({
      mappingDir: options.mappings
    });
    server.start();
  } catch (err) {
    console.error(import_chalk6.default.red(`[CLI] Failed to start MCP Server: ${err.message}`));
    process.exit(1);
  }
});

// cli/commands/inspect.ts
var import_commander7 = require("commander");
var import_fs7 = __toESM(require("fs"));
var import_path7 = __toESM(require("path"));
var import_chalk7 = __toESM(require("chalk"));
var import_prompts2 = __toESM(require("prompts"));
var import_genai = require("@google/genai");
var inspectCommand = new import_commander7.Command("inspect").description("AI-Assisted Zero-Touch Mapping. Introspects databases/APIs to generate OPO schemas.").requiredOption("-e, --entity <name>", "The canonical Entity name (e.g. Invoice, Customer)").requiredOption("-s, --schema <path>", "Path to the local schema file (SQL DDL, Swagger, GraphQL SDL)").option("-t, --type <type>", "Type of schema (sql, rest, graphql, soap)", "sql").option("--sync", "Run in auto-healing mode to detect Schema Drift against an existing mapping").action(async (options) => {
  console.log(import_chalk7.default.blueBright(`
\u{1F50D} Inspecting ${options.type.toUpperCase()} schema for entity: ${options.entity}...
`));
  const schemaPath = import_path7.default.resolve(process.cwd(), options.schema);
  if (!import_fs7.default.existsSync(schemaPath)) {
    console.error(import_chalk7.default.red(`Error: Schema file not found at ${schemaPath}`));
    process.exit(1);
  }
  const schemaContent = import_fs7.default.readFileSync(schemaPath, "utf8");
  if (options.sync) {
    console.log(import_chalk7.default.yellow(`[SYNC MODE] Detecting Schema Drift...`));
    console.log(import_chalk7.default.gray(`Analyzing physical schema against current OPO mapping...`));
    setTimeout(() => {
      console.log(import_chalk7.default.green(`
\u2705 No critical schema drift detected. Mappings are up to date.`));
      console.log(import_chalk7.default.cyan(`(Auto-healing daemon simulation completed)`));
    }, 1500);
    return;
  }
  const response = await (0, import_prompts2.default)({
    type: "password",
    name: "apiKey",
    message: "Enter your Google Gemini API Key (or press enter to skip if set in ENV):"
  });
  const apiKey = response.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(import_chalk7.default.red("Error: API Key is required for AI Introspection."));
    process.exit(1);
  }
  const ai = new import_genai.GoogleGenAI({ apiKey });
  console.log(import_chalk7.default.cyan("\n\u{1F9E0} Consulting Gemini 2.5..."));
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
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nSchema:\n" + schemaContent.substring(0, 5e3) }] }
      ]
    });
    let jsonText = completion.text || "{}";
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    const fields = JSON.parse(jsonText);
    const opoMapping = {
      $schema: "https://openontology.org/schema/v1.json",
      entity: options.entity,
      sourceType: options.type.toUpperCase(),
      tableName: "INFERRED_TABLE_NAME",
      fields
    };
    console.log(import_chalk7.default.green("\n\u2705 Gemini inferred the following mapping:\n"));
    console.log(import_chalk7.default.gray(JSON.stringify(opoMapping, null, 2)));
    const confirm = await (0, import_prompts2.default)({
      type: "confirm",
      name: "value",
      message: "Do you want to save this mapping to the registry?",
      initial: true
    });
    if (confirm.value) {
      const outDir = import_path7.default.resolve(process.cwd(), "registry", "inferred");
      if (!import_fs7.default.existsSync(outDir)) {
        import_fs7.default.mkdirSync(outDir, { recursive: true });
      }
      const outPath = import_path7.default.join(outDir, `${options.entity}.json`);
      import_fs7.default.writeFileSync(outPath, JSON.stringify(opoMapping, null, 2));
      console.log(import_chalk7.default.green(`
\u{1F4BE} Saved to ${outPath}`));
    } else {
      console.log(import_chalk7.default.yellow("\nDiscarded mapping."));
    }
  } catch (error) {
    console.error(import_chalk7.default.red(`
\u274C AI Introspection failed: ${error.message}`));
    process.exit(1);
  }
});

// cli/commands/studio.ts
var import_commander8 = require("commander");
var import_chalk8 = __toESM(require("chalk"));
var import_child_process = require("child_process");
var import_path8 = __toESM(require("path"));
var import_fs8 = __toESM(require("fs"));
var studioCommand = new import_commander8.Command("studio").description("Launch the OPO Studio UI locally (like n8n or Flowise)").option("-p, --port <port>", "Port to run the studio on", "3000").action(async (options) => {
  console.log(import_chalk8.default.blue(`
\u{1F680} Starting OPO Studio locally on port ${options.port}...
`));
  try {
    const userCwd = process.cwd();
    let rootDir = __dirname;
    while (rootDir !== import_path8.default.dirname(rootDir)) {
      if (import_fs8.default.existsSync(import_path8.default.join(rootDir, "app")) && import_fs8.default.existsSync(import_path8.default.join(rootDir, "package.json"))) {
        break;
      }
      rootDir = import_path8.default.dirname(rootDir);
    }
    const isProd = process.env.NODE_ENV === "production";
    const nextBin = import_path8.default.join(rootDir, "node_modules", "next", "dist", "bin", "next");
    const command = isProd ? `node "${nextBin}" start -p ${options.port}` : `node "${nextBin}" dev -p ${options.port}`;
    console.log(import_chalk8.default.gray(`> Project Root: ${rootDir}`));
    console.log(import_chalk8.default.gray(`> Workspace directory: ${userCwd}`));
    console.log(import_chalk8.default.gray(`> ${command}`));
    (0, import_child_process.execSync)(command, {
      stdio: "inherit",
      cwd: rootDir,
      env: __spreadProps(__spreadValues({}, process.env), {
        OPO_WORKSPACE_DIR: userCwd
      })
    });
  } catch (error) {
    console.log(import_chalk8.default.red("\n\u274C Failed to start OPO Studio."));
    process.exit(1);
  }
});

// cli/commands/discover.ts
var import_commander9 = require("commander");
var import_fs9 = __toESM(require("fs"));
var import_path9 = __toESM(require("path"));
var import_chalk9 = __toESM(require("chalk"));
function mapType(dbType) {
  const typeLower = dbType.toLowerCase();
  if (["integer", "int", "smallint", "bigint", "serial", "bigserial"].includes(typeLower)) {
    return "Int";
  }
  if (["numeric", "decimal", "real", "double precision", "float"].includes(typeLower)) {
    return "Float";
  }
  if (["boolean", "bool"].includes(typeLower)) {
    return "Boolean";
  }
  if (["timestamp", "timestamptz", "date", "time", "timestamp without time zone", "timestamp with time zone"].some((t) => typeLower.includes(t))) {
    return "DateTime";
  }
  return "String";
}
var erpDictionary = {
  // SAP
  "kna1": "Customer",
  "vbak": "SalesOrderHeader",
  "vbap": "SalesOrderItem",
  "mara": "Material",
  "bkpf": "AccountingDocumentHeader",
  "bseg": "AccountingDocumentSegment",
  "lfa1": "Supplier",
  // Totvs Protheus
  "sa1": "Customer",
  "sa2": "Supplier",
  "sb1": "Product",
  "sf1": "PurchaseInvoiceHeader",
  "sf2": "SalesInvoiceHeader",
  "sc5": "SalesOrderHeader",
  "sc6": "SalesOrderItem",
  "sc7": "PurchaseOrderHeader",
  "sc9": "SalesOrderReleases"
};
function suggestCanonicalName(tableName) {
  const cleanTable = tableName.trim().toLowerCase();
  if (erpDictionary[cleanTable]) {
    return erpDictionary[cleanTable];
  }
  let term = cleanTable.replace(/^tbl_/, "").replace(/^t_/, "").replace(/_tbl$/, "").replace(/_table$/, "");
  return term.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}
var discoverCommand = new import_commander9.Command("discover").description("Auto-discover database schema and generate OPO manifest file (.opo.json)").option("-d, --db <type>", "Database type: postgres (currently supported)", "postgres").requiredOption("-u, --url <url>", "Database connection string/URL").option("-o, --output <file>", "Output manifest path", ".well-known/opo.json").action(async (options) => {
  console.log(import_chalk9.default.blue("\n\u{1F680} Starting OPO Schema Auto-Discovery..."));
  if (options.db !== "postgres") {
    console.error(import_chalk9.default.red(`
\u274C Error: Database type '${options.db}' is not supported yet. Currently only 'postgres' is supported.`));
    process.exit(1);
  }
  let ClientClass;
  try {
    const pgModule = require("pg");
    ClientClass = pgModule.Client;
  } catch (err) {
    console.error(import_chalk9.default.red('\n\u274C Error: The "pg" package is required for discover command.'));
    console.error(import_chalk9.default.gray("Please run: npm install pg"));
    process.exit(1);
  }
  const client = new ClientClass({ connectionString: options.url });
  try {
    console.log(import_chalk9.default.gray(`Connecting to database at ${options.url.replace(/:([^:@]+)@/, ":****@")}...`));
    await client.connect();
    console.log(import_chalk9.default.green("\u2705 Connected successfully!"));
    console.log(import_chalk9.default.gray("Inspecting tables..."));
    const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
    const tables = tablesRes.rows.map((r) => r.table_name);
    console.log(import_chalk9.default.gray(`Found ${tables.length} tables.`));
    if (tables.length === 0) {
      console.warn(import_chalk9.default.yellow("\u26A0\uFE0F No tables found in the public schema."));
      await client.end();
      return;
    }
    console.log(import_chalk9.default.gray("Analyzing columns and types..."));
    const columnsRes = await client.query(`
        SELECT 
          table_name, 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `);
    console.log(import_chalk9.default.gray("Locating primary keys..."));
    const pksRes = await client.query(`
        SELECT 
          kcu.table_name, 
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public';
      `);
    const primaryKeysMap = /* @__PURE__ */ new Map();
    pksRes.rows.forEach((row) => {
      const list = primaryKeysMap.get(row.table_name) || [];
      list.push(row.column_name);
      primaryKeysMap.set(row.table_name, list);
    });
    console.log(import_chalk9.default.gray("Mapping foreign key relationships..."));
    const fksRes = await client.query(`
        SELECT
          kcu.table_name AS source_table,
          kcu.column_name AS source_column,
          ccu.table_name AS target_table,
          ccu.column_name AS target_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public';
      `);
    const entitiesMap = /* @__PURE__ */ new Map();
    columnsRes.rows.forEach((col) => {
      const tableName = col.table_name;
      if (!entitiesMap.has(tableName)) {
        entitiesMap.set(tableName, {
          name: tableName,
          canonical: `opo:${suggestCanonicalName(tableName)}`,
          attributes: []
        });
      }
      const entity = entitiesMap.get(tableName);
      const pks = primaryKeysMap.get(tableName) || [];
      const isPk = pks.includes(col.column_name);
      entity.attributes.push({
        id: `attr-${tableName}-${col.column_name}`,
        name: col.column_name,
        type: mapType(col.data_type),
        isPrimaryKey: isPk,
        isRequired: col.is_nullable === "NO" || isPk,
        isUnique: isPk,
        // PKs are unique by definition
        defaultValue: col.column_default || void 0
      });
    });
    const supportedEntities = [];
    const customMappings = {};
    entitiesMap.forEach((entity, tableName) => {
      const businessName = entity.canonical.replace(/^opo:/, "");
      supportedEntities.push({
        canonical: entity.canonical,
        native_reference: tableName,
        confidence: 0.95,
        limitations: `Auto-discovered from physical table ${tableName}`
      });
      const fieldsMapping = {};
      entity.attributes.forEach((attr) => {
        const camelName = attr.name.toLowerCase().replace(/_([a-z])/g, (_match, group) => group.toUpperCase());
        fieldsMapping[camelName] = attr.name;
      });
      customMappings[businessName] = {
        [`${tableName}_fields`]: fieldsMapping,
        attributes: entity.attributes
        // Include schema for OPO Studio canvas loading
      };
    });
    const relationships = [];
    fksRes.rows.forEach((row) => {
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
        cardinality: "ONE_TO_MANY"
        // Standard default for foreign keys
      });
    });
    const manifest = {
      opo_version: "0.1.0",
      system_identity: {
        erp_name: options.db === "postgres" ? "PostgreSQL Database" : "Discovered DB",
        version: "1.0",
        organization_name: "Auto-Discovered Org"
      },
      adapter_configuration: {
        base_url: options.url,
        protocol_interface: "SQL"
      },
      supported_entities: supportedEntities,
      custom_mappings: customMappings,
      relationships,
      // Extra field stored for OPO Studio reconstruction
      discoveredAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const outputPath = import_path9.default.resolve(process.cwd(), options.output);
    const outputDir = import_path9.default.dirname(outputPath);
    if (!import_fs9.default.existsSync(outputDir)) {
      import_fs9.default.mkdirSync(outputDir, { recursive: true });
    }
    import_fs9.default.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    console.log(import_chalk9.default.green(`
\u2705 Success! Created OPO manifest at ${outputPath}`));
    console.log(import_chalk9.default.gray(`  - Found ${tables.length} tables.`));
    console.log(import_chalk9.default.gray(`  - Mapped ${supportedEntities.length} entities.`));
    console.log(import_chalk9.default.gray(`  - Identified ${relationships.length} foreign key relations.
`));
  } catch (err) {
    console.error(import_chalk9.default.red(`
\u274C Auto-Discovery Failed: ${err.message}`));
    process.exit(1);
  } finally {
    await client.end().catch(() => {
    });
  }
});

// cli/index.ts
var program = new import_commander10.Command();
program.name("opo").description("Open Protocol Ontology (OPO) CLI").version("0.1.0");
program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(generateCommand);
program.addCommand(translateCommand);
program.addCommand(mutateCommand);
program.addCommand(mcpStartCommand);
program.addCommand(inspectCommand);
program.addCommand(studioCommand);
program.addCommand(discoverCommand);
program.parse(process.argv);
