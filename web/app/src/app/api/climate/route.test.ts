import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('Climate API Route', () => {
  it('deve retornar dados climaticos com status 200', async () => {
    const request = new Request('http://localhost:3000/api/climate?month=12&year=2024');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('stateId');
    expect(data[0]).toHaveProperty('temperature');
  });

  it('deve rejeitar month invalido', async () => {
    const request = new Request('http://localhost:3000/api/climate?month=13&year=2024');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Parametro month invalido');
  });

  it('deve rejeitar year invalido', async () => {
    const request = new Request('http://localhost:3000/api/climate?month=12&year=abc');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Parametro year invalido');
  });
});
