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

// src/cli.ts
var import_prompts = __toESM(require("prompts"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));

// src/builder.ts
var OpoOntologyBuilder = class {
  mapping;
  constructor() {
    this.mapping = {
      $schema: "https://openontology.vercel.app/schema/v1/mapping-schema.json",
      fields: {}
    };
  }
  setEntity(entityName) {
    this.mapping.entity = entityName;
    return this;
  }
  setSource(sourceType, tableNameOrEndpoint) {
    this.mapping.sourceType = sourceType;
    this.mapping.tableName = tableNameOrEndpoint;
    return this;
  }
  setDescription(desc) {
    this.mapping.description = desc;
    return this;
  }
  addField(canonicalName, physicalColumn, type = "string") {
    if (!this.mapping.fields) {
      this.mapping.fields = {};
    }
    this.mapping.fields[canonicalName] = { column: physicalColumn, type };
    return this;
  }
  build() {
    if (!this.mapping.entity || !this.mapping.sourceType || !this.mapping.tableName) {
      throw new Error("Incomplete OPO Mapping. Missing entity, sourceType, or tableName.");
    }
    return this.mapping;
  }
};

// src/cli.ts
async function main() {
  console.log("\u{1F916} Bienvenue al Generador de Ontolog\xEDas de OPO (Open Protocol Ontology)\n");
  const response = await (0, import_prompts.default)([
    {
      type: "text",
      name: "entity",
      message: "\xBFCual es el nombre de la Entidad Can\xF3nica? (Ej. Invoice, Customer)",
      validate: (value) => value.length > 0 ? true : "Debe ingresar una entidad"
    },
    {
      type: "select",
      name: "sourceType",
      message: "\xBFQu\xE9 tipo de origen de datos utilizar\xE1s?",
      choices: [
        { title: "SQL (Base de datos relacional)", value: "SQL" },
        { title: "REST (API Endpoint)", value: "REST" },
        { title: "GraphQL (Mutaci\xF3n o Query)", value: "GraphQL" }
      ],
      initial: 0
    },
    {
      type: "text",
      name: "tableName",
      message: "\xBFCu\xE1l es el nombre de la tabla o endpoint f\xEDsico en tu infraestructura? (Ej. VBRK, account_move)",
      validate: (value) => value.length > 0 ? true : "Requerido"
    },
    {
      type: "text",
      name: "description",
      message: "Escribe una breve descripci\xF3n para este mapeo (Opcional):"
    }
  ]);
  if (!response.entity || !response.sourceType || !response.tableName) {
    console.log("Operaci\xF3n cancelada.");
    process.exit(1);
  }
  const builder = new OpoOntologyBuilder().setEntity(response.entity).setSource(response.sourceType, response.tableName);
  if (response.description) {
    builder.setDescription(response.description);
  }
  console.log(`
Vamos a mapear los campos de la entidad ${response.entity}.`);
  let addMore = true;
  while (addMore) {
    const fieldRes = await (0, import_prompts.default)([
      {
        type: "text",
        name: "canonicalName",
        message: "Nombre del campo en OPO (Ej. id, totalAmount):"
      },
      {
        type: "text",
        name: "physicalColumn",
        message: "Columna f\xEDsica en tu base de datos (Ej. VBELN):"
      },
      {
        type: "select",
        name: "type",
        message: "Tipo de dato:",
        choices: [
          { title: "string", value: "string" },
          { title: "number", value: "number" },
          { title: "boolean", value: "boolean" }
        ]
      },
      {
        type: "confirm",
        name: "addAnother",
        message: "\xBFAgregar otro campo?",
        initial: true
      }
    ]);
    if (!fieldRes.canonicalName) break;
    builder.addField(fieldRes.canonicalName, fieldRes.physicalColumn, fieldRes.type);
    addMore = fieldRes.addAnother;
  }
  const resultJSON = builder.build();
  const outputPath = path.join(process.cwd(), `${response.entity}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(resultJSON, null, 2), "utf8");
  console.log(`
\u2728 \xA1\xC9xito! Tu archivo OPO Mapping ha sido generado en:`);
  console.log(`\u{1F4C2} ${outputPath}`);
  console.log(`S\xFAbelo a tu registro o publ\xEDcalo en /.well-known/opo.json`);
}
main().catch((err) => {
  console.error("Error in CLI:", err);
});
