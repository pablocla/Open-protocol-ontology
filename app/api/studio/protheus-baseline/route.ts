import { NextResponse } from 'next/server';
import {
  getProtheusBaselineManifest,
  getProtheusBaselineVersion,
  manifestToCanvasGraph,
  buildProtheusSemanticAccessPlan,
} from '@/lib/mesh/adapters/totvs';

export async function GET() {
  try {
    const manifest = getProtheusBaselineManifest();
    const graph = manifestToCanvasGraph(manifest);

    return NextResponse.json({
      success: true,
      baselineVersion: getProtheusBaselineVersion(),
      manifest,
      project: graph.project,
      nodes: graph.nodes,
      edges: graph.edges,
      accessPlan: buildProtheusSemanticAccessPlan(manifest),
      summary: {
        entities: manifest.supported_entities.length,
        relationships: manifest.relationships.length,
        fields: manifest.dictionary_meta.fields_count,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}