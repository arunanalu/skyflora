import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NationalTable } from './NationalTable';

describe('NationalTable', () => {
  it('deve renderizar mensagem de dados vazios quando nao ha dados', () => {
    render(<NationalTable data={[]} category="climate" activeFilter="temperatura" />);
    expect(screen.getByText('Nenhum dado encontrado para o periodo.')).toBeInTheDocument();
  });

  it('deve renderizar nome do estado e tres colunas de temperatura', () => {
    const mockData = [
      {
        stateId: 'SP',
        stateName: 'Sao Paulo',
        temperature: 23.58,
        temperatureMin: 12.3,
        temperatureMax: 36.8,
        atmosphereQuality: 80,
        soilMoisture: 30,
        month: 12,
        year: 2024,
      },
    ];

    render(<NationalTable data={mockData} category="climate" activeFilter="temperatura" />);

    expect(screen.getByText('Sao Paulo')).toBeInTheDocument();
    expect(screen.getByText('Máxima (°C)')).toBeInTheDocument();
    expect(screen.getByText('Média (°C)')).toBeInTheDocument();
    expect(screen.getByText('Mínima (°C)')).toBeInTheDocument();
    expect(screen.getByText('36,80')).toBeInTheDocument();
    expect(screen.getByText('23,58')).toBeInTheDocument();
    expect(screen.getByText('12,30')).toBeInTheDocument();
  });

  it('deve renderizar quatro colunas de atmosfera com valores corretos', () => {
    const mockData = [
      {
        stateId: 'AC',
        stateName: 'Acre',
        temperature: 25.63,
        atmosphereQuality: 67.5,
        pm25Mean: 8.15,
        pm10Mean: 8.34,
        carbonMonoxideMean: 196.69,
        cloudCoverageMean: 75.26,
        soilMoisture: 51,
        month: 12,
        year: 2024,
      },
    ];

    render(<NationalTable data={mockData} category="climate" activeFilter="atmosfera" />);

    expect(screen.getByText('PM2.5 (μg/m³)')).toBeInTheDocument();
    expect(screen.getByText('PM10 (μg/m³)')).toBeInTheDocument();
    expect(screen.getByText('CO (μg/m³)')).toBeInTheDocument();
    expect(screen.getByText('Nuvens (%)')).toBeInTheDocument();
    expect(screen.getByText('8,15')).toBeInTheDocument();
    expect(screen.getByText('8,34')).toBeInTheDocument();
  });

  it('deve renderizar quatro colunas de solo com valores corretos', () => {
    const mockData = [
      {
        stateId: 'PA',
        stateName: 'Para',
        temperature: 26.33,
        atmosphereQuality: 50,
        soilMoisture: 20,
        vegetationWaterLossMean: 3.9,
        vegetationWaterStressMean: 1.92,
        vegetationCoverIndexMean: 0.19,
        fireSpotsTotal: 8700,
        month: 12,
        year: 2024,
      },
    ];

    render(<NationalTable data={mockData} category="climate" activeFilter="solo" />);

    expect(screen.getByText('Perda água (mm/d)')).toBeInTheDocument();
    expect(screen.getByText('Estresse hídr.')).toBeInTheDocument();
    expect(screen.getByText('Cobertura veg.')).toBeInTheDocument();
    expect(screen.getByText('Focos NASA')).toBeInTheDocument();
    expect(screen.getByText('8.700,00')).toBeInTheDocument();
  });
});
