import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import { CredentialVault } from '../engine/vault/credential-vault';
import { resolveApiKey, resolveAllApiKeys } from './vaultResolver';

describe('vaultResolver', () => {
  beforeAll(() => {
    process.env.OPO_DB_PATH = './data/test_resolver.db';
    process.env.OPO_VAULT_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    if (fs.existsSync('./data/test_resolver.db')) {
      fs.unlinkSync('./data/test_resolver.db');
    }
  });

  afterAll(() => {
    if (fs.existsSync('./data/test_resolver.db')) {
      fs.unlinkSync('./data/test_resolver.db');
    }
  });

  it('should resolve keys from env variables first', () => {
    process.env.GEMINI_API_KEY = 'env-gemini-key';
    const key = resolveApiKey('gemini');
    expect(key).toBe('env-gemini-key');
    delete process.env.GEMINI_API_KEY;
  });

  it('should resolve keys from CredentialVault if not in env', () => {
    const vault = new CredentialVault();
    vault.storeKey('openai', 'default', 'vault-openai-key');
    vault.close();

    const key = resolveApiKey('openai');
    expect(key).toBe('vault-openai-key');
  });

  it('should resolve all keys', () => {
    process.env.GEMINI_API_KEY = 'env-gemini-key';
    const vault = new CredentialVault();
    vault.storeKey('openai', 'default', 'vault-openai-key');
    vault.close();

    const keys = resolveAllApiKeys();
    expect(keys.gemini).toBe('env-gemini-key');
    expect(keys.openai).toBe('vault-openai-key');

    delete process.env.GEMINI_API_KEY;
  });
});
