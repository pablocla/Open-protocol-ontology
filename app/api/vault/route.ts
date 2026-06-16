import { NextResponse } from 'next/server';
import { CredentialVault } from '@/lib/engine/vault/credential-vault';

export async function GET() {
  try {
    const vault = new CredentialVault();
    const keys = vault.listKeys();
    return NextResponse.json({ success: true, keys });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { provider, name, apiKey } = await request.json();
    
    if (!provider || !name || !apiKey) {
      return NextResponse.json({ success: false, error: 'Missing provider, name or apiKey' }, { status: 400 });
    }

    const vault = new CredentialVault();
    const id = vault.storeKey(provider, name, apiKey);
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing key id' }, { status: 400 });
    }

    const vault = new CredentialVault();
    vault.deleteKey(id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
