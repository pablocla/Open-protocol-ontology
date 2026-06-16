import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, endpoint, url } = body;

    const connectionString = url || endpoint;

    if (!type) {
      return NextResponse.json({ success: false, error: 'Missing connection type' }, { status: 400 });
    }

    if (!connectionString) {
      return NextResponse.json({ success: false, error: 'Missing connection URL or endpoint' }, { status: 400 });
    }

    if (type === 'sql_direct') {
      // Test PostgreSQL
      try {
        const { Client } = require('pg');
        const client = new Client({
          connectionString,
          connectionTimeoutMillis: 5000 // 5 seconds timeout
        });
        
        await client.connect();
        const res = await client.query('SELECT 1 as ping');
        await client.end();
        
        if (res.rows[0]?.ping === 1) {
          return NextResponse.json({ success: true, message: 'Database connection successful!' });
        } else {
          return NextResponse.json({ success: false, error: 'Unexpected response from database query' });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Database error: ${err.message}` });
      }
    } else if (type === 'rest_api' || type === 'n8n_webhook' || type === 'mcp') {
      // Test REST / Endpoint
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

        // Try a basic GET or HEAD. If it returns any response, it exists.
        const res = await fetch(connectionString, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }).catch(async () => {
          // If GET fails, try HEAD
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
          return fetch(connectionString, {
            method: 'HEAD',
            signal: controller2.signal
          });
        });

        clearTimeout(timeoutId);

        if (res && res.status > 0) {
          return NextResponse.json({ 
            success: true, 
            message: `Endpoint connection successful! (HTTP Status: ${res.status} ${res.statusText})` 
          });
        } else {
          return NextResponse.json({ success: false, error: 'Empty or invalid response from endpoint.' });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return NextResponse.json({ success: false, error: 'Connection timed out after 5 seconds.' });
        }
        return NextResponse.json({ success: false, error: `Endpoint error: ${err.message}` });
      }
    }

    return NextResponse.json({ success: false, error: `Unsupported connection type: ${type}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
