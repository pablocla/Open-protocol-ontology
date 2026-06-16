import { NextResponse } from 'next/server';
import { packageCanvasToDigitalEmployee, validateDigitalEmployee } from '@/lib/studio/digitalEmployee';

// Simple in-memory registry for ALPHA (in production this would be a proper DB table)
const marketplaceRegistry: Record<string, any> = {};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nodes, edges, project, options } = body;

    if (!nodes || !edges || !project) {
      return NextResponse.json({ success: false, error: 'Missing canvas data' }, { status: 400 });
    }

    // Package using the new standard
    const digitalEmployee = packageCanvasToDigitalEmployee(nodes, edges, project, options);

    // Validate
    const validated = validateDigitalEmployee(digitalEmployee);

    // Save to registry (ALPHA - simple object)
    marketplaceRegistry[validated.id] = validated;

    console.log(`[Marketplace] Published new DigitalEmployee: ${validated.name} (${validated.id})`);

    return NextResponse.json({
      success: true,
      digitalEmployee: {
        id: validated.id,
        name: validated.name,
        description: validated.description,
        pricePerExecution: validated.pricePerExecution,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Return all published (public) DigitalEmployees
  const list = Object.values(marketplaceRegistry).filter((de: any) => de.isPublic);
  return NextResponse.json({ success: true, digitalEmployees: list });
}
