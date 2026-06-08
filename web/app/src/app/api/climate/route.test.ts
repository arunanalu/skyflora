import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('Climate API Route', () => {
  it('deve retornar dados climáticos mockados com status 200', async () => {
    const request = new Request('http://localhost:3000/api/climate?month=1&year=2026');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Verifica se os dados voltaram num array e contêm a estrutura esperada
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('stateId');
    expect(data[0]).toHaveProperty('temperature');
  });
});
