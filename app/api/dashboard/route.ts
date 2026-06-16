import { NextResponse } from 'next/server';
import { ResourceBroker } from '@/lib/engine/broker/resource-broker';

export async function GET() {
  try {
    const report = await ResourceBroker.getConsumptionReport();
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
