import { OpoMapping, OpoField } from '../index';

export class OpoGraphQLAdapter {
  
  /**
   * Converts an OpoMapping (JSON) into a GraphQL Type Definition string.
   */
  static generateTypeDefs(mapping: OpoMapping): string {
    const entityName = mapping.entity;
    
    let typeDef = `type ${entityName} {\n`;
    
    for (const [fieldName, fieldMeta] of Object.entries(mapping.fields)) {
      const type = typeof fieldMeta === 'string' ? fieldMeta : fieldMeta.type;
      const gqlType = this.mapToGraphQLType(type);
      typeDef += `  ${fieldName}: ${gqlType}\n`;
    }
    
    typeDef += `}\n\n`;

    // Generate input type for mutations
    typeDef += `input ${entityName}Input {\n`;
    for (const [fieldName, fieldMeta] of Object.entries(mapping.fields)) {
      const type = typeof fieldMeta === 'string' ? fieldMeta : fieldMeta.type;
      const gqlType = this.mapToGraphQLType(type);
      typeDef += `  ${fieldName}: ${gqlType}\n`;
    }
    typeDef += `}\n\n`;

    // Generate queries
    typeDef += `extend type Query {\n`;
    typeDef += `  get${entityName}(id: ID!): ${entityName}\n`;
    typeDef += `  list${entityName}s(limit: Int): [${entityName}]\n`;
    typeDef += `}\n`;

    return typeDef;
  }

  private static mapToGraphQLType(opoType: string): string {
    const lowerType = opoType.toLowerCase();
    switch (lowerType) {
      case 'string':
      case 'varchar':
      case 'text':
        return 'String';
      case 'number':
      case 'integer':
      case 'int':
        return 'Int';
      case 'float':
      case 'decimal':
        return 'Float';
      case 'boolean':
      case 'bool':
        return 'Boolean';
      case 'date':
      case 'timestamp':
        return 'String'; // GraphQL lacks native Date without custom scalars
      default:
        return 'String';
    }
  }
}
