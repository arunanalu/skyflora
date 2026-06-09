import { NextResponse } from 'next/server';
import { createDataRepository } from '../../../data/repositories/createDataRepository';
import { withCache } from '../../../infrastructure/config/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const repository = createDataRepository();

function parseClimateParams(request: Request): { month: number; year: number } | { error: string } {
  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get('month') || '12');
  const year = Number(searchParams.get('year') || '2024');

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: 'Parametro month invalido' };
  }

  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    return { error: 'Parametro year invalido' };
  }

  return { month, year };
}

export async function GET(request: Request) {
  const params = parseClimateParams(request);

  if ('error' in params) {
    return NextResponse.json({ error: params.error }, { status: 400 });
  }

  try {
    const data = await withCache(
      () => repository.getClimateData(params.month, params.year),
      ['climate-state', String(params.month), String(params.year)],
      ['climate-state'],
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados climaticos' }, { status: 500 });
  }
}
