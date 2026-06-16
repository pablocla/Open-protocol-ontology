import { NextResponse } from 'next/server';
import { semanticSwarmController } from '@/lib/engine/swarm';
import { HeadlessRunRequestSchema } from '@/lib/studio/digitalEmployee';
import { getCurrentTenantId, reportUsage, authorizeDigitalEmployeeAccess } from '@/lib/saas/tenant';

/**
 * Headless execution endpoint for DigitalEmployees (packaged swarms).
 * 
 * POST /api/digital-employees/run/{digitalEmployeeId}
 * 
 * This is the "API-as-a-Service" part of the SaaS plan.
 * - Validates input against the published schema (Zod).
 * - Executes via SemanticSwarmController (which delegates to AgentExecutor + Blackboard).
 * - In full SaaS: 
 *   - Tenant isolation via auth header or API key.
 *   - Metering (log tokens/execution for Stripe).
 *   - Revenue split (80% to creator).
 *   - IP protection (buyer never sees internal swarm prompts).
 * 
 * For now: works with swarmId or employee id (demo mode, single tenant).
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = getCurrentTenantId(request.headers);

    // Authz stub (future: check purchase/subscription for this tenant + employee)
    if (!await authorizeDigitalEmployeeAccess(tenantId, id)) {
      return NextResponse.json({ success: false, error: 'Access denied. Purchase the DigitalEmployee first.' }, { status: 403 });
    }

    // Basic schema validation
    const parsed = HeadlessRunRequestSchema.safeParse({ digitalEmployeeId: id, input: body });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { input } = parsed.data;

    // Execute (in real: use tenant-prefixed blackboard keys internally)
    const results = await semanticSwarmController.executeSubTask(id, 
      typeof input === 'string' ? input : (input as any).query || JSON.stringify(input)
    );

    // Metering for billing / revenue split (Fase 3)
    await reportUsage(tenantId, id, Math.max(1, Math.floor(results.length / 2)));

    const finalOutput = results.find(r => r.role === 'assistant')?.content || 
                       results[results.length-1]?.content || 
                       'Task completed by DigitalEmployee swarm.';

    return NextResponse.json({
      success: true,
      digitalEmployeeId: id,
      tenant: tenantId,
      output: {
        result: finalOutput,
        structuredData: {},
        auditLog: results.map(r => `${r.role}: ${r.content?.slice(0,80)}...`),
      },
      usage: { messages: results.length }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
