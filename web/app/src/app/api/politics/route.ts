import { NextResponse } from 'next/server';
import { MockRepository } from '../../../data/repositories/MockRepository';

const repository = new MockRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateId = searchParams.get('stateId') || undefined;

  try {
    const data = await repository.getPoliticalProposals(stateId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar dados políticos' }, { status: 500 });
  }
}
