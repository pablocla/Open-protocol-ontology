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
var import_commander3 = require("commander");

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

// cli/index.ts
var program = new import_commander3.Command();
program.name("opo").description("CLI tool for the Open Protocol Ontology (OPO)").version("0.1.0");
program.addCommand(initCommand);
program.addCommand(validateCommand);
program.parse(process.argv);
