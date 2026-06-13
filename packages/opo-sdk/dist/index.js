"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  OpoClient: () => OpoClient,
  OpoOntologyBuilder: () => OpoOntologyBuilder
});
module.exports = __toCommonJS(index_exports);

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

// src/index.ts
var OpoClient = class {
  registryUrl;
  constructor(options) {
    this.registryUrl = options?.registryUrl || "https://openontology.vercel.app";
  }
  async getMapping(provider, entity) {
    const url = `${this.registryUrl}/registry/${provider}/${entity}.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch OPO mapping for ${provider}/${entity} (Status: ${response.status})`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[OpoClient] Error fetching mapping from ${url}:`, error);
      throw error;
    }
  }
  generateSystemPrompt(mapping) {
    const fieldNames = Object.keys(mapping.fields).join(", ");
    return `You are an intelligent agent connecting to ${mapping.sourceType} table "${mapping.tableName}".
When querying or mutating the ${mapping.entity} entity, use the following canonical fields: ${fieldNames}.
The OPO Sidecar will automatically translate these to the underlying columns.`;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OpoClient,
  OpoOntologyBuilder
});
