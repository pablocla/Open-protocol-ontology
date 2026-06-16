export interface CredentialKey {
  id: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  name: string;
  createdAt: number;
}

export interface VaultEntry extends CredentialKey {
  encryptedValue: string; // The encrypted API key
  iv: string;             // Initialization vector used for encryption
}

export interface RateLimitConfig {
  maxConcurrent: number;
  requestsPerMinute: number;
}

export interface ConsumptionReport {
  keys: {
    [keyId: string]: {
      provider: string;
      tokensUsed: number;
      requestCount: number;
      rateLimitHits: number;
    }
  };
  agents: {
    [agentId: string]: {
      tokensUsed: number;
      requestCount: number;
    }
  };
}
