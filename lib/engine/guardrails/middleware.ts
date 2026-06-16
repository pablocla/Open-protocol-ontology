import { OntologyValidator } from './validator';

export interface GuardrailOptions {
  maxRetries?: number;
  schema: any;
  llmCaller: (retryContext?: string) => Promise<string>;
}

export class GuardrailMiddleware {
  static async executeWithGuardrails<T>(options: GuardrailOptions): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    let attempts = 0;
    let lastError: Error | null = null;
    let retryContext = '';

    while (attempts < maxRetries) {
      attempts++;
      try {
        const rawResponse = await options.llmCaller(retryContext);
        
        // Strip markdown blocks if present (e.g. ```json ... ```)
        const cleanJson = rawResponse.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // Validate strictly using the compiled Ontology schema
        const validated = OntologyValidator.validatePayload(parsed, options.schema);
        return validated as T;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Guardrails] Attempt ${attempts} failed: ${err.message}`);
        
        // Instruct the LLM on what went wrong for the next attempt
        retryContext = `The previous response failed schema validation. Error: ${err.message}. Please return strictly valid JSON matching the schema.`;
      }
    }

    throw new Error(`Guardrail failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}
