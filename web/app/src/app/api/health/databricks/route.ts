import { NextResponse } from 'next/server';
import { executeDatabricksQuery } from '../../../../infrastructure/databricks/DatabricksSqlClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await executeDatabricksQuery<{ ok: number }>('SELECT 1 AS ok');
    return NextResponse.json({ ok: rows[0]?.ok === 1 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Databricks indisponivel' }, { status: 503 });
  }
}
