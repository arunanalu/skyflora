import { NextRequest, NextResponse } from 'next/server';
import { getClimateDataSource } from '../../../../infrastructure/config/env';
import { DatabricksClimateMunicipalRepository } from '../../../../data/repositories/DatabricksClimateMunicipalRepository';
import { getMunicipalClimateDataMock } from '../../../../data/repositories/MockRepository';
import { withCache } from '../../../../infrastructure/config/cache';

const UF_RE = /^[A-Z]{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MIN = '2024-12-01';
const DATE_MAX = '2024-12-31';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const uf = searchParams.get('uf') ?? '';
  const date = searchParams.get('date') ?? '';
  const search = (searchParams.get('search') ?? '').slice(0, 100);
  const limitRaw = Number(searchParams.get('limit') ?? '20');
  const offsetRaw = Number(searchParams.get('offset') ?? '0');

  if (!UF_RE.test(uf)) {
    return NextResponse.json({ error: 'Parâmetro "uf" inválido. Use a sigla de 2 letras maiúsculas (ex: SP).' }, { status: 400 });
  }

  if (!DATE_RE.test(date) || date < DATE_MIN || date > DATE_MAX) {
    return NextResponse.json(
      { error: `Parâmetro "date" inválido. Use o formato YYYY-MM-DD entre ${DATE_MIN} e ${DATE_MAX}.` },
      { status: 400 },
    );
  }

  const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 20));
  const offset = Math.max(0, Number.isFinite(offsetRaw) ? Math.floor(offsetRaw) : 0);

  const cacheKeys = ['climate-municipal', uf, date, search, String(limit), String(offset)];

  try {
    const data = await withCache(
      () => getClimateDataSource() === 'databricks'
        ? new DatabricksClimateMunicipalRepository().getMunicipalClimateData({ uf, date, search, limit, offset })
        : Promise.resolve(getMunicipalClimateDataMock({ uf, date, search, limit, offset })),
      cacheKeys,
      ['climate-municipal', `climate-municipal-${uf}`],
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error('[/api/climate/municipal]', err);
    return NextResponse.json({ error: 'Erro interno ao buscar dados municipais.' }, { status: 500 });
  }
}
