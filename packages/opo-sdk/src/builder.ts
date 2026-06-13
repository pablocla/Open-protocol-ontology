import { OpoMapping, OpoField } from './index';

export class OpoOntologyBuilder {
  private mapping: Partial<OpoMapping>;

  constructor() {
    this.mapping = {
      $schema: 'https://openontology.vercel.app/schema/v1/mapping-schema.json',
      fields: {},
    };
  }

  setEntity(entityName: string): this {
    this.mapping.entity = entityName;
    return this;
  }

  setSource(sourceType: 'SQL' | 'REST' | 'GraphQL', tableNameOrEndpoint: string): this {
    this.mapping.sourceType = sourceType;
    this.mapping.tableName = tableNameOrEndpoint;
    return this;
  }

  setDescription(desc: string): this {
    this.mapping.description = desc;
    return this;
  }

  addField(canonicalName: string, physicalColumn: string, type: string = 'string'): this {
    if (!this.mapping.fields) {
      this.mapping.fields = {};
    }
    this.mapping.fields[canonicalName] = { column: physicalColumn, type };
    return this;
  }

  build(): OpoMapping {
    if (!this.mapping.entity || !this.mapping.sourceType || !this.mapping.tableName) {
      throw new Error('Incomplete OPO Mapping. Missing entity, sourceType, or tableName.');
    }
    return this.mapping as OpoMapping;
  }
}
