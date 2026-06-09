import { NextResponse } from 'next/server';
import { createDataRepository } from '../../../data/repositories/createDataRepository';
import { withCache } from '../../../infrastructure/config/cache';

const VALID_PERIODO = /^\d{4}-\d{2}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get('periodo') ?? '2024-12';

  if (!VALID_PERIODO.test(periodo)) {
    return NextResponse.json({ error: 'Parametro periodo invalido. Use o formato YYYY-MM.' }, { status: 400 });
  }

  try {
    const repository = createDataRepository();
    const data = await withCache(
      () => repository.getPoliticsStateData(periodo),
      ['politics', periodo],
      ['politics'],
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados politicos' }, { status: 500 });
  }
}
