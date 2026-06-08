import { NextResponse } from 'next/server';
import { MockRepository } from '../../../data/repositories/MockRepository';

const repository = new MockRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '1', 10);
  const year = parseInt(searchParams.get('year') || '2026', 10);

  try {
    const data = await repository.getClimateData(month, year);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar dados climáticos' }, { status: 500 });
  }
}
