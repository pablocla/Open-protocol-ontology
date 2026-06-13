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

export {
  OpoOntologyBuilder
};
