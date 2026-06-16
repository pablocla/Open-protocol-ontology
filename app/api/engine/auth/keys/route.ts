import { NextResponse } from 'next/server';
import { getApiKeyManager } from '@/lib/engine/auth/api-keys';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'demo-tenant';
  
  const manager = getApiKeyManager();
  const keys = manager.listKeysForTenant(tenantId);
  return NextResponse.json({ success: true, keys });
}

export async function POST(request: Request) {
  const { tenantId, name } = await request.json();
  const manager = getApiKeyManager();
  const key = manager.createApiKey(tenantId || 'demo-tenant', name || 'New Key');
  return NextResponse.json({ success: true, key });
}
