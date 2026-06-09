import { NextResponse } from 'next/server';
import { MockRepository } from '../../../data/repositories/MockRepository';
import { withCache } from '../../../infrastructure/config/cache';

const repository = new MockRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || '2026', 10);

  try {
    const data = await withCache(
      () => repository.getCO2Emissions(year),
      ['co2', String(year)],
      ['co2'],
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados de emissao de CO2' }, { status: 500 });
  }
}
