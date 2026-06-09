import { IDataRepository } from '../../domain/repositories/IDataRepository';
import { ClimateData } from '../../domain/entities/ClimateData';
import { PoliticalProposal } from '../../domain/entities/PoliticalProposal';
import { CO2Emission } from '../../domain/entities/CO2Emission';
import { MunicipalClimateData } from '../../domain/entities/MunicipalClimateData';
import { MunicipalQueryParams } from './DatabricksClimateMunicipalRepository';

const MOCK_MUNICIPAL: MunicipalClimateData[] = [
  // RO — Alta Floresta D'oeste
  { ibgeCode: '1100015', municipalityName: "Alta Floresta D'oeste", uf: 'RO', date: '2024-12-01', latitude: -12.47, longitude: -62.27, temperatureMax: 30.8, temperatureMin: 24.2, temperatureMean: 26.8, precipitationMm: 5.4, pm10: 15.8, pm25: 15.37, carbonMonoxide: 261.71, waterLoss: 3.94, waterStress: 1.47, vegetationIndex: null, cloudCoverage: null, fireSpots: 11 },
  { ibgeCode: '1100015', municipalityName: "Alta Floresta D'oeste", uf: 'RO', date: '2024-12-02', latitude: -12.47, longitude: -62.27, temperatureMax: 34.4, temperatureMin: 25, temperatureMean: 28.4, precipitationMm: 1.8, pm10: 17.91, pm25: 17.52, carbonMonoxide: 252.25, waterLoss: 5.42, waterStress: 2.9, vegetationIndex: 0.64, cloudCoverage: 47.29, fireSpots: 0 },
  { ibgeCode: '1100015', municipalityName: "Alta Floresta D'oeste", uf: 'RO', date: '2024-12-10', latitude: -12.47, longitude: -62.27, temperatureMax: 33.1, temperatureMin: 22.9, temperatureMean: 26.7, precipitationMm: 0.4, pm10: 6.38, pm25: 6.35, carbonMonoxide: 244.75, waterLoss: 4.96, waterStress: 2.54, vegetationIndex: 0.39, cloudCoverage: 78.07, fireSpots: 5 },
  // RO — Porto Velho
  { ibgeCode: '1100205', municipalityName: 'Porto Velho', uf: 'RO', date: '2024-12-01', latitude: -8.76, longitude: -63.9, temperatureMax: 32.5, temperatureMin: 24.0, temperatureMean: 27.2, precipitationMm: 8.1, pm10: 12.4, pm25: 11.9, carbonMonoxide: 230.5, waterLoss: 4.1, waterStress: 1.8, vegetationIndex: null, cloudCoverage: null, fireSpots: 3 },
  { ibgeCode: '1100205', municipalityName: 'Porto Velho', uf: 'RO', date: '2024-12-10', latitude: -8.76, longitude: -63.9, temperatureMax: 31.9, temperatureMin: 23.5, temperatureMean: 26.5, precipitationMm: 12.3, pm10: 10.2, pm25: 9.8, carbonMonoxide: 215.0, waterLoss: 3.8, waterStress: 1.5, vegetationIndex: 0.42, cloudCoverage: 62.1, fireSpots: 0 },
  // SP — São Paulo
  { ibgeCode: '3550308', municipalityName: 'São Paulo', uf: 'SP', date: '2024-12-01', latitude: -23.55, longitude: -46.63, temperatureMax: 32.1, temperatureMin: 18.4, temperatureMean: 24.2, precipitationMm: 14.2, pm10: 22.1, pm25: 19.8, carbonMonoxide: 312.4, waterLoss: 4.8, waterStress: 1.9, vegetationIndex: 0.21, cloudCoverage: 55.0, fireSpots: 0 },
  { ibgeCode: '3550308', municipalityName: 'São Paulo', uf: 'SP', date: '2024-12-10', latitude: -23.55, longitude: -46.63, temperatureMax: 34.8, temperatureMin: 20.1, temperatureMean: 26.7, precipitationMm: 0.0, pm10: 25.3, pm25: 22.1, carbonMonoxide: 330.8, waterLoss: 5.1, waterStress: 2.1, vegetationIndex: null, cloudCoverage: null, fireSpots: 0 },
  // SP — Campinas
  { ibgeCode: '3509502', municipalityName: 'Campinas', uf: 'SP', date: '2024-12-01', latitude: -22.9, longitude: -47.06, temperatureMax: 33.5, temperatureMin: 17.8, temperatureMean: 24.8, precipitationMm: 9.5, pm10: 18.4, pm25: 16.2, carbonMonoxide: 295.1, waterLoss: 4.5, waterStress: 1.75, vegetationIndex: 0.28, cloudCoverage: 48.3, fireSpots: 0 },
  { ibgeCode: '3509502', municipalityName: 'Campinas', uf: 'SP', date: '2024-12-10', latitude: -22.9, longitude: -47.06, temperatureMax: 36.2, temperatureMin: 19.3, temperatureMean: 26.9, precipitationMm: 0.0, pm10: 21.7, pm25: 18.9, carbonMonoxide: 307.5, waterLoss: 5.3, waterStress: 2.2, vegetationIndex: null, cloudCoverage: null, fireSpots: 0 },
  // SP — Ribeirão Preto
  { ibgeCode: '3543402', municipalityName: 'Ribeirão Preto', uf: 'SP', date: '2024-12-01', latitude: -21.17, longitude: -47.81, temperatureMax: 35.1, temperatureMin: 20.2, temperatureMean: 26.5, precipitationMm: 3.2, pm10: 14.5, pm25: 13.1, carbonMonoxide: 278.3, waterLoss: 4.9, waterStress: 2.0, vegetationIndex: 0.31, cloudCoverage: 30.5, fireSpots: 1 },
  // PA — Belém
  { ibgeCode: '1501402', municipalityName: 'Belém', uf: 'PA', date: '2024-12-01', latitude: -1.46, longitude: -48.5, temperatureMax: 33.2, temperatureMin: 24.5, temperatureMean: 28.1, precipitationMm: 22.4, pm10: 16.8, pm25: 14.9, carbonMonoxide: 245.6, waterLoss: 3.7, waterStress: 1.6, vegetationIndex: 0.35, cloudCoverage: 80.2, fireSpots: 42 },
  { ibgeCode: '1501402', municipalityName: 'Belém', uf: 'PA', date: '2024-12-10', latitude: -1.46, longitude: -48.5, temperatureMax: 32.8, temperatureMin: 24.0, temperatureMean: 27.6, precipitationMm: 18.7, pm10: 14.2, pm25: 12.8, carbonMonoxide: 231.4, waterLoss: 3.5, waterStress: 1.4, vegetationIndex: null, cloudCoverage: null, fireSpots: 28 },
  // PA — Santarém
  { ibgeCode: '1507003', municipalityName: 'Santarém', uf: 'PA', date: '2024-12-01', latitude: -2.44, longitude: -54.71, temperatureMax: 34.6, temperatureMin: 23.8, temperatureMean: 27.9, precipitationMm: 6.8, pm10: 19.3, pm25: 17.1, carbonMonoxide: 268.9, waterLoss: 4.2, waterStress: 1.9, vegetationIndex: 0.22, cloudCoverage: 65.4, fireSpots: 87 },
  // MG — Belo Horizonte
  { ibgeCode: '3106200', municipalityName: 'Belo Horizonte', uf: 'MG', date: '2024-12-01', latitude: -19.92, longitude: -43.94, temperatureMax: 33.8, temperatureMin: 17.5, temperatureMean: 24.3, precipitationMm: 18.9, pm10: 15.2, pm25: 13.7, carbonMonoxide: 265.8, waterLoss: 4.3, waterStress: 1.65, vegetationIndex: 0.25, cloudCoverage: 71.3, fireSpots: 2 },
  { ibgeCode: '3106200', municipalityName: 'Belo Horizonte', uf: 'MG', date: '2024-12-10', latitude: -19.92, longitude: -43.94, temperatureMax: 36.4, temperatureMin: 19.1, temperatureMean: 26.8, precipitationMm: 0.2, pm10: 18.6, pm25: 16.4, carbonMonoxide: 282.1, waterLoss: 5.0, waterStress: 2.0, vegetationIndex: null, cloudCoverage: null, fireSpots: 0 },
];

export function getMunicipalClimateDataMock(params: MunicipalQueryParams): MunicipalClimateData[] {
  const { uf, date, search = '', limit = 20, offset = 0 } = params;
  const searchLower = search.toLowerCase();

  const filtered = MOCK_MUNICIPAL.filter(
    (r) =>
      r.uf === uf &&
      r.date === date &&
      (searchLower === '' || r.municipalityName.toLowerCase().includes(searchLower)),
  );

  return filtered.slice(offset, offset + limit);
}

export class MockRepository implements IDataRepository {
  async getClimateData(month: number, year: number): Promise<ClimateData[]> {
    return [
      { stateId: 'SP', temperature: 28, atmosphereQuality: 45, soilMoisture: 30, month, year },
      { stateId: 'RJ', temperature: 32, atmosphereQuality: 60, soilMoisture: 40, month, year },
      { stateId: 'AM', temperature: 25, atmosphereQuality: 90, soilMoisture: 80, month, year },
      { stateId: 'MT', temperature: 30, atmosphereQuality: 50, soilMoisture: 20, month, year },
      { stateId: 'BA', temperature: 29, atmosphereQuality: 70, soilMoisture: 50, month, year }
    ];
  }

  async getPoliticalProposals(stateId?: string): Promise<PoliticalProposal[]> {
    const proposals: PoliticalProposal[] = [
      {
        id: '1',
        title: 'PL Preservação da Amazônia',
        description: 'Projeto de lei para aumentar a área de preservação.',
        author: 'Deputado A',
        stateId: 'AM',
        isBeneficial: true,
        status: 'Aprovada',
        date: '2026-01-15T00:00:00.000Z'
      },
      {
        id: '2',
        title: 'PL Expansão Agrícola',
        description: 'Projeto que flexibiliza desmatamento para agricultura.',
        author: 'Deputado B',
        stateId: 'MT',
        isBeneficial: false,
        status: 'Em Tramitação',
        date: '2026-03-10T00:00:00.000Z'
      },
      {
        id: '3',
        title: 'PL Incentivo à Energia Solar',
        description: 'Subsídios para instalação de painéis solares.',
        author: 'Deputado C',
        stateId: 'SP',
        isBeneficial: true,
        status: 'Aprovada',
        date: '2026-04-20T00:00:00.000Z'
      }
    ];

    if (stateId) {
      return proposals.filter(p => p.stateId === stateId);
    }
    return proposals;
  }

  async getCO2Emissions(year: number): Promise<CO2Emission[]> {
    return [
      { stateId: 'SP', emissionAmount: 150000, year, topPolluter: 'Indústria', polluterEmission: 80000 },
      { stateId: 'RJ', emissionAmount: 90000, year, topPolluter: 'Transporte', polluterEmission: 45000 },
      { stateId: 'MT', emissionAmount: 300000, year, topPolluter: 'Desmatamento', polluterEmission: 210000 },
      { stateId: 'AM', emissionAmount: 20000, year, topPolluter: 'Desmatamento', polluterEmission: 12000 },
      { stateId: 'BA', emissionAmount: 70000, year, topPolluter: 'Agropecuária', polluterEmission: 35000 },
      { stateId: 'RS', emissionAmount: 85000, year, topPolluter: 'Agropecuária', polluterEmission: 42000 },
      { stateId: 'MG', emissionAmount: 120000, year, topPolluter: 'Indústria', polluterEmission: 65000 }
    ];
  }
}
