import { NextResponse } from 'next/server';
import { MockRepository } from '../../../data/repositories/MockRepository';
import { DatabricksCO2Repository } from '../../../data/repositories/DatabricksCO2Repository';
import { getCO2DataSource } from '../../../infrastructure/config/env';
import { withCache } from '../../../infrastructure/config/cache';

const AVAILABLE_YEAR = 2024;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawYear = parseInt(searchParams.get('year') || String(AVAILABLE_YEAR), 10);

  if (isNaN(rawYear)) {
    return NextResponse.json({ error: 'Parametro year invalido' }, { status: 400 });
  }

  // Only 2024 is available; silently clamp to keep the UI working
  const year = rawYear === AVAILABLE_YEAR ? AVAILABLE_YEAR : AVAILABLE_YEAR;

  try {
    const source = getCO2DataSource();
    const repository = source === 'databricks' ? new DatabricksCO2Repository() : new MockRepository();

    const data = await withCache(
      () => repository.getCO2Emissions(year),
      ['co2', String(year), source],
      ['co2'],
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados de emissao de CO2' }, { status: 500 });
  }
}
