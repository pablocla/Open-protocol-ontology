import { CredentialVault } from '../engine/vault/credential-vault';

export function resolveApiKey(provider: string): string {
  // 1. Check env variable
  const envKey = getEnvKey(provider);
  if (envKey) return envKey;

  // 2. Check SQLite Vault
  let vault: CredentialVault | null = null;
  try {
    vault = new CredentialVault();
    const keys = vault.listKeys();
    const matchingKeys = keys.filter(k => k.provider.toLowerCase() === provider.toLowerCase());
    if (matchingKeys.length > 0) {
      // Sort desc by createdAt to get the latest
      matchingKeys.sort((a, b) => b.createdAt - a.createdAt);
      return vault.getKey(matchingKeys[0].id);
    }
  } catch (error) {
    console.error(`[VaultResolver] Failed to resolve key for ${provider} from vault:`, error);
  } finally {
    if (vault) {
      try {
        vault.close();
      } catch (e) {}
    }
  }

  return '';
}

export function resolveAllApiKeys(): Record<string, string> {
  const providers = ['gemini', 'openai', 'anthropic', 'grok', 'openrouter'];
  const keys: Record<string, string> = {};
  for (const prov of providers) {
    const key = resolveApiKey(prov);
    if (key) {
      keys[prov] = key;
    }
  }
  return keys;
}

function getEnvKey(provider: string): string | undefined {
  const p = provider.toLowerCase();
  if (p === 'gemini') return process.env.GEMINI_API_KEY;
  if (p === 'openai') return process.env.OPENAI_API_KEY;
  if (p === 'anthropic') return process.env.ANTHROPIC_API_KEY;
  if (p === 'grok') return process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (p === 'openrouter') return process.env.OPENROUTER_API_KEY;
  return undefined;
}
