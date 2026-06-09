import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../../../../infrastructure/config/env', () => ({
  getClimateDataSource: () => 'mock',
}));

vi.mock('../../../../data/repositories/MockRepository', () => ({
  getMunicipalClimateDataMock: ({ uf, date }: { uf: string; date: string }) => {
    if (uf === 'RO' && date === '2024-12-01') {
      return [{ ibgeCode: '1100015', municipalityName: "Alta Floresta D'oeste", uf: 'RO', date: '2024-12-01' }];
    }
    return [];
  },
}));

const { GET } = await import('./route');

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/climate/municipal');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe('GET /api/climate/municipal', () => {
  it('retorna 400 quando uf esta ausente ou invalida', async () => {
    const res = await GET(makeRequest({ uf: 'xx', date: '2024-12-01' }));
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando date esta fora do intervalo permitido', async () => {
    const res = await GET(makeRequest({ uf: 'SP', date: '2025-01-01' }));
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando date tem formato invalido', async () => {
    const res = await GET(makeRequest({ uf: 'SP', date: 'dezembro' }));
    expect(res.status).toBe(400);
  });

  it('retorna 200 com dados para parametros validos', async () => {
    const res = await GET(makeRequest({ uf: 'RO', date: '2024-12-01' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].uf).toBe('RO');
  });

  it('retorna array vazio quando nenhum municipio encontrado', async () => {
    const res = await GET(makeRequest({ uf: 'AC', date: '2024-12-15' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });
});
