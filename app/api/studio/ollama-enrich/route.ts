import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, payload, ollamaUrl = 'http://localhost:11434', model = 'llama3' } = body;

    let prompt = '';

    if (mode === 'infer-rest') {
      // payload is the raw JSON response from a REST API
      prompt = `
Analiza este JSON response de una API REST y extrae las entidades de negocio que contiene.
Para cada entidad, devuelve: nombre (PascalCase), descripción, y lista de atributos con nombre y tipo (String, Int, Float, Boolean, DateTime).
Responde SOLO en JSON válido con este formato:
{"entities": [{"name": "...", "description": "...", "attributes": [{"name": "...", "type": "..."}]}]}

JSON a analizar:
${JSON.stringify(payload, null, 2)}
      `;
    } else if (mode === 'enrich-sql') {
      // payload is a list of OPO entities
      prompt = `
Sos un experto en bases de datos empresariales y ERPs (SAP, Totvs Protheus, Oracle EBS, Microsoft Dynamics).
   
Te doy una lista de entidades descubiertas automáticamente de una base de datos.
Tu tarea es:
1. Renombrar tablas crípticas a nombres de negocio legibles en PascalCase (ej: SA1010 → Customer, SC5010 → SalesOrder)
2. Para cada entidad, escribir una descripción corta en español de qué representa
3. Identificar relaciones entre entidades basándote en nombres de columnas que terminen en _id, _code, o que tengan FKs
4. Sugerir tipos de relación: ONE_TO_ONE, ONE_TO_MANY, MANY_TO_MANY

Responde SOLO en JSON válido:
{
  "enrichedEntities": [
    { "originalName": "SA1010", "suggestedName": "Customer", "description": "...", "attributes": [...] }
  ],
  "suggestedRelations": [
    { "from": "SalesOrder", "to": "Customer", "type": "MANY_TO_ONE", "via": "customer_id" }
  ]
}

Entidades a analizar:
${JSON.stringify(payload)}
      `;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid mode.' }, { status: 400 });
    }

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      let result;
      try {
        result = JSON.parse(data.response);
      } catch (parseError) {
        throw new Error('Ollama no devolvió un JSON válido.');
      }

      return NextResponse.json({ success: true, data: result });
    } catch (ollamaErr: any) {
      return NextResponse.json({ 
        success: false, 
        error: `Error contactando a Ollama en ${ollamaUrl}. ¿Está corriendo localmente? Detalle: ${ollamaErr.message}` 
      }, { status: 502 });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: `Error interno: ${error.message}` 
    }, { status: 500 });
  }
}
