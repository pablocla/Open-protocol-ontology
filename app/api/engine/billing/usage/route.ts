import { NextResponse } from 'next/server';
import { getMeteringService } from '@/lib/engine/billing/metering';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'demo-tenant';
  
  const service = getMeteringService();
  const records = service.getUsageForTenant(tenantId);
  return NextResponse.json({ success: true, records });
}
