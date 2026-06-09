import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NationalTable } from './NationalTable';

describe('NationalTable', () => {
  it('deve renderizar mensagem de dados vazios quando nao ha dados', () => {
    render(<NationalTable data={[]} category="climate" activeFilter="temperatura" />);
    expect(screen.getByText('Nenhum dado encontrado para o periodo.')).toBeInTheDocument();
  });

  it('deve renderizar temperatura climatica real por estado', () => {
    const mockData = [
      {
        stateId: 'SP',
        stateName: 'Sao Paulo',
        temperature: 28.4,
        atmosphereQuality: 80,
        soilMoisture: 30,
        month: 12,
        year: 2024,
      },
    ];

    render(<NationalTable data={mockData} category="climate" activeFilter="temperatura" />);

    expect(screen.getByText('Sao Paulo')).toBeInTheDocument();
    expect(screen.getByText('SP')).toBeInTheDocument();
    expect(screen.getByText('28,4 C')).toBeInTheDocument();
  });

  it('deve renderizar metricas atmosfericas quando o filtro esta ativo', () => {
    const mockData = [
      {
        stateId: 'AC',
        stateName: 'Acre',
        temperature: 25.63,
        atmosphereQuality: 67.5,
        pm25Mean: 8.43,
        pm10Mean: 8.63,
        soilMoisture: 51,
        month: 12,
        year: 2024,
      },
    ];

    render(<NationalTable data={mockData} category="climate" activeFilter="atmosfera" />);

    expect(screen.getByText('PM2.5 / PM10')).toBeInTheDocument();
    expect(screen.getByText('8,4 / 8,6')).toBeInTheDocument();
  });
});
