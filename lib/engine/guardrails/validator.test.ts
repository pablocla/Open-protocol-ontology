import { describe, it, expect, vi } from 'vitest';
import { OntologyValidator } from './validator';
import { GuardrailMiddleware } from './middleware';

describe('Ontology Guardrails', () => {
  const userSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      age: { type: 'number' },
      isActive: { type: 'boolean' }
    },
    required: ['id', 'age']
  };

  it('should compile schema and validate correct payload', () => {
    const payload = { id: 'usr_123', age: 30, isActive: true };
    const result = OntologyValidator.validatePayload(payload, userSchema);
    expect(result).toEqual(payload);
  });

  it('should throw on missing required fields', () => {
    const payload = { age: 30 }; // missing id
    expect(() => OntologyValidator.validatePayload(payload, userSchema)).toThrow();
  });

  it('should retry via middleware on failure and succeed if LLM corrects it', async () => {
    let callCount = 0;
    
    // Mock an LLM caller that fails the first time but returns correct JSON the second time
    const mockLlm = vi.fn().mockImplementation(async (retryContext?: string) => {
      callCount++;
      if (callCount === 1) {
        return '{"age": 25}'; // Missing id
      }
      return '{"id": "usr_999", "age": 25}'; // Correct
    });

    const result = await GuardrailMiddleware.executeWithGuardrails({
      schema: userSchema,
      llmCaller: mockLlm,
      maxRetries: 3
    });

    expect(callCount).toBe(2);
    expect(result).toEqual({ id: 'usr_999', age: 25 });
  });

  it('should throw if max retries exceeded', async () => {
    const mockLlm = vi.fn().mockResolvedValue('{"invalid": "data"}');

    await expect(GuardrailMiddleware.executeWithGuardrails({
      schema: userSchema,
      llmCaller: mockLlm,
      maxRetries: 2
    })).rejects.toThrow('Guardrail failed after 2 attempts');
  });
});
