import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NationalTable } from './NationalTable';

describe('NationalTable', () => {
  it('deve renderizar mensagem de dados vazios quando não há dados', () => {
    render(<NationalTable data={[]} />);
    expect(screen.getByText('Nenhum dado encontrado para o período.')).toBeInTheDocument();
  });

  it('deve renderizar as linhas de dados corretamente', () => {
    const mockData = [
      { stateId: 'SP', temperature: 28, atmosphereQuality: 80, soilMoisture: 30, month: 1, year: 2026 }
    ];
    render(<NationalTable data={mockData} />);
    
    expect(screen.getByText('SP')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });
});
