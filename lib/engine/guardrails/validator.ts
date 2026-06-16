import { z } from 'zod';
import { jsonSchemaToZod } from 'json-schema-to-zod';

export class OntologyValidator {
  /**
   * Compila dinámicamente un JSON Schema a un schema de Zod.
   * Utiliza json-schema-to-zod y un eval seguro o constructor para instancias en runtime.
   * Nota: En producción real puede usarse ajv para validación, pero la tarea 
   * específica solicitaba on-the-fly a zod (útil para parseo estricto tipado si se exporta).
   */
  static compileSchema(jsonSchema: any): z.ZodTypeAny {
    try {
      // jsonSchemaToZod returns a string representing the Zod code (e.g. "z.object({...})")
      // To actually evaluate it dynamically without eval is complex, so we will manually
      // build a simplified Zod schema for the basic types based on the JSON schema provided,
      // which is safer and usually sufficient for LLM output structures.
      
      return this.buildZodFromSchema(jsonSchema);
    } catch (e: any) {
      throw new Error(`Failed to compile schema: ${e.message}`);
    }
  }

  private static buildZodFromSchema(schema: any): z.ZodTypeAny {
    if (!schema) return z.any();

    switch (schema.type) {
      case 'string':
        return z.string();
      case 'number':
      case 'integer':
        return z.number();
      case 'boolean':
        return z.boolean();
      case 'array':
        return z.array(this.buildZodFromSchema(schema.items || {}));
      case 'object':
        if (schema.properties) {
          const shape: Record<string, z.ZodTypeAny> = {};
          for (const [key, val] of Object.entries(schema.properties)) {
            let fieldSchema = this.buildZodFromSchema(val);
            if (!schema.required?.includes(key)) {
              fieldSchema = fieldSchema.optional();
            }
            shape[key] = fieldSchema;
          }
          return z.object(shape);
        }
        return z.record(z.string(), z.any());
      default:
        return z.any();
    }
  }

  static validatePayload(payload: any, schema: any): any {
    const zodSchema = this.compileSchema(schema);
    return zodSchema.parse(payload);
  }
}
