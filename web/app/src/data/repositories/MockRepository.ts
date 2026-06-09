import { IDataRepository } from '../../domain/repositories/IDataRepository';
import { ClimateData } from '../../domain/entities/ClimateData';
import { CO2Emission } from '../../domain/entities/CO2Emission';
import { PoliticsStateData } from '../../domain/entities/PoliticsStateData';
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPoliticsStateData(_periodoReferencia: string): Promise<PoliticsStateData[]> {
    return [
      { uf: 'AM', totalPropostas: 82, propostasPositivas: 70, propostasNegativas: 0, propostasNeutras: 12, totalDeputados: 4, totalVotos: 320, votosDecisivos: 12, votosNaoConclusivos: 308, simEmPositivas: 10, naoEmPositivas: 2, inconclusivosEmPositivas: 280, simEmNegativas: 0, naoEmNegativas: 0, inconclusivosEmNegativas: 0, scoreTotal: 10, scoreRate: 0.83, topDeputados: [{ nome: 'Amom Mandel', partido: 'REPUBLICANOS', score: 0, totalVotos: 0, scoreRate: 0 }], bottomDeputados: [], periodoReferencia: '2024-12', processedAt: null },
      { uf: 'SP', totalPropostas: 8, propostasPositivas: 6, propostasNegativas: 0, propostasNeutras: 2, totalDeputados: 3, totalVotos: 24, votosDecisivos: 3, votosNaoConclusivos: 21, simEmPositivas: 1, naoEmPositivas: 2, inconclusivosEmPositivas: 18, simEmNegativas: 0, naoEmNegativas: 0, inconclusivosEmNegativas: 0, scoreTotal: 1, scoreRate: 0.33, topDeputados: [], bottomDeputados: [], periodoReferencia: '2024-12', processedAt: null },
      { uf: 'MG', totalPropostas: 4, propostasPositivas: 3, propostasNegativas: 0, propostasNeutras: 1, totalDeputados: 2, totalVotos: 8, votosDecisivos: 2, votosNaoConclusivos: 6, simEmPositivas: 2, naoEmPositivas: 0, inconclusivosEmPositivas: 6, simEmNegativas: 0, naoEmNegativas: 0, inconclusivosEmNegativas: 0, scoreTotal: 2, scoreRate: 1, topDeputados: [], bottomDeputados: [], periodoReferencia: '2024-12', processedAt: null },
      { uf: 'RS', totalPropostas: 3, propostasPositivas: 2, propostasNegativas: 0, propostasNeutras: 1, totalDeputados: 2, totalVotos: 6, votosDecisivos: 1, votosNaoConclusivos: 5, simEmPositivas: 0, naoEmPositivas: 1, inconclusivosEmPositivas: 5, simEmNegativas: 0, naoEmNegativas: 0, inconclusivosEmNegativas: 0, scoreTotal: 0, scoreRate: 0, topDeputados: [], bottomDeputados: [], periodoReferencia: '2024-12', processedAt: null },
    ];
  }

  async getCO2Emissions(year: number): Promise<CO2Emission[]> {
    return [
      {
        stateId: 'PA', stateName: 'Pará', year, totalEmission: 272956801,
        dominantSector: 'Mudança de Uso da Terra e Floresta',
        top5: [
          { sector: 'Mudança de Uso da Terra e Floresta', sectorTotalEmission: 205535488, sectorShareOfState: 74.0, category: 'Alterações de uso da terra', categoryEmission: 194101765, categoryShareOfSector: 94.4, recordCount: 400 },
          { sector: 'Agropecuária', sectorTotalEmission: 55114468, sectorShareOfState: 19.8, category: 'Fermentação entérica', categoryEmission: 42876474, categoryShareOfSector: 77.8, recordCount: 18 },
          { sector: 'Agropecuária', sectorTotalEmission: 55114468, sectorShareOfState: 19.8, category: 'Solos manejados', categoryEmission: 10669452, categoryShareOfSector: 19.4, recordCount: 140 },
          { sector: 'Mudança de Uso da Terra e Floresta', sectorTotalEmission: 205535488, sectorShareOfState: 74.0, category: 'Resíduos florestais', categoryEmission: 10009988, categoryShareOfSector: 4.9, recordCount: 177 },
          { sector: 'Energia', sectorTotalEmission: 12306844, sectorShareOfState: 4.4, category: 'Transportes', categoryEmission: 8270661, categoryShareOfSector: 67.2, recordCount: 65 },
        ],
        processedAt: '2026-06-08 02:18:16',
      },
      {
        stateId: 'MT', stateName: 'Mato Grosso', year, totalEmission: 228721393,
        dominantSector: 'Mudança de Uso da Terra e Floresta',
        top5: [
          { sector: 'Mudança de Uso da Terra e Floresta', sectorTotalEmission: 125813449, sectorShareOfState: 54.4, category: 'Alterações de uso da terra', categoryEmission: 118262763, categoryShareOfSector: 94.0, recordCount: 556 },
          { sector: 'Agropecuária', sectorTotalEmission: 88866389, sectorShareOfState: 38.4, category: 'Fermentação entérica', categoryEmission: 55539158, categoryShareOfSector: 62.5, recordCount: 27 },
          { sector: 'Agropecuária', sectorTotalEmission: 88866389, sectorShareOfState: 38.4, category: 'Solos manejados', categoryEmission: 30698410, categoryShareOfSector: 34.5, recordCount: 210 },
          { sector: 'Energia', sectorTotalEmission: 14041554, sectorShareOfState: 6.1, category: 'Transportes', categoryEmission: 8709021, categoryShareOfSector: 62.0, recordCount: 88 },
          { sector: 'Mudança de Uso da Terra e Floresta', sectorTotalEmission: 125813449, sectorShareOfState: 54.4, category: 'Resíduos florestais', categoryEmission: 5836325, categoryShareOfSector: 4.6, recordCount: 226 },
        ],
        processedAt: '2026-06-08 02:18:16',
      },
      {
        stateId: 'SP', stateName: 'São Paulo', year, totalEmission: 138381438,
        dominantSector: 'Energia',
        top5: [
          { sector: 'Energia', sectorTotalEmission: 85830929, sectorShareOfState: 59.1, category: 'Transportes', categoryEmission: 48155071, categoryShareOfSector: 56.1, recordCount: 70 },
          { sector: 'Agropecuária', sectorTotalEmission: 34583796, sectorShareOfState: 23.8, category: 'Fermentação entérica', categoryEmission: 18017381, categoryShareOfSector: 52.1, recordCount: 18 },
          { sector: 'Agropecuária', sectorTotalEmission: 34583796, sectorShareOfState: 23.8, category: 'Solos manejados', categoryEmission: 15049749, categoryShareOfSector: 43.5, recordCount: 140 },
          { sector: 'Energia', sectorTotalEmission: 85830929, sectorShareOfState: 59.1, category: 'Industrial', categoryEmission: 13207210, categoryShareOfSector: 15.4, recordCount: 225 },
          { sector: 'Resíduos', sectorTotalEmission: 17966712, sectorShareOfState: 12.4, category: 'Disposição final', categoryEmission: 12416709, categoryShareOfSector: 69.1, recordCount: 4 },
        ],
        processedAt: '2026-06-08 02:18:16',
      },
      {
        stateId: 'GO', stateName: 'Goiás', year, totalEmission: 96747989,
        dominantSector: 'Agropecuária',
        top5: [
          { sector: 'Agropecuária', sectorTotalEmission: 59610510, sectorShareOfState: 61.1, category: 'Fermentação entérica', categoryEmission: 39468583, categoryShareOfSector: 66.2, recordCount: 18 },
          { sector: 'Agropecuária', sectorTotalEmission: 59610510, sectorShareOfState: 61.1, category: 'Solos manejados', categoryEmission: 18164054, categoryShareOfSector: 30.5, recordCount: 140 },
          { sector: 'Mudança de Uso da Terra e Floresta', sectorTotalEmission: 18581777, sectorShareOfState: 19.0, category: 'Alterações de uso da terra', categoryEmission: 16643473, categoryShareOfSector: 89.6, recordCount: 338 },
          { sector: 'Energia', sectorTotalEmission: 14541690, sectorShareOfState: 14.9, category: 'Transportes', categoryEmission: 9350484, categoryShareOfSector: 64.3, recordCount: 66 },
          { sector: 'Resíduos', sectorTotalEmission: 4013010, sectorShareOfState: 4.1, category: 'Disposição final', categoryEmission: 2633165, categoryShareOfSector: 65.6, recordCount: 4 },
        ],
        processedAt: '2026-06-08 02:18:16',
      },
      {
        stateId: 'RJ', stateName: 'Rio de Janeiro', year, totalEmission: 71680916,
        dominantSector: 'Energia',
        top5: [
          { sector: 'Energia', sectorTotalEmission: 44548985, sectorShareOfState: 62.2, category: 'Produção de combustíveis', categoryEmission: 21699394, categoryShareOfSector: 48.7, recordCount: 21 },
          { sector: 'Energia', sectorTotalEmission: 44548985, sectorShareOfState: 62.2, category: 'Transportes', categoryEmission: 13020976, categoryShareOfSector: 29.2, recordCount: 24 },
          { sector: 'Resíduos', sectorTotalEmission: 11471123, sectorShareOfState: 16.0, category: 'Disposição final', categoryEmission: 9443658, categoryShareOfSector: 82.3, recordCount: 2 },
          { sector: 'Processos Industriais', sectorTotalEmission: 7509686, sectorShareOfState: 10.5, category: 'Produção de metais', categoryEmission: 5862177, categoryShareOfSector: 78.1, recordCount: 4 },
          { sector: 'Energia', sectorTotalEmission: 44548985, sectorShareOfState: 62.2, category: 'Geração de eletricidade (serviço público)', categoryEmission: 5121315, categoryShareOfSector: 11.5, recordCount: 4 },
        ],
        processedAt: '2026-06-08 02:18:16',
      },
      {
        stateId: 'AC', stateName: 'Acre', year, totalEmission: 44920284,
        dominantSector: 'Mudança de Uso da Terra e Floresta',
        top5: [
          { sector: 'Mudança de Uso da Terra e Floresta', sectorTotalEmission: 33871827, sectorShareOfState: 74.8, category: 'Alterações de uso da terra', categoryEmission: 32063899, categoryShareOfSector: 94.7, recordCount: 83 },
          { sector: 'Agropecuária', sectorTotalEmission: 10205462, sectorShareOfState: 22.5, category: 'Fermentação entérica', categoryEmission: 8348757, categoryShareOfSector: 81.8, recordCount: 9 },
          { sector: 'Mudança de Uso da Terra e Floresta', sectorTotalEmission: 33871827, sectorShareOfState: 74.8, category: 'Resíduos florestais', categoryEmission: 1609213, categoryShareOfSector: 4.8, recordCount: 40 },
          { sector: 'Agropecuária', sectorTotalEmission: 10205462, sectorShareOfState: 22.5, category: 'Solos manejados', categoryEmission: 1549676, categoryShareOfSector: 15.2, recordCount: 70 },
          { sector: 'Energia', sectorTotalEmission: 843994, sectorShareOfState: 1.9, category: 'Transportes', categoryEmission: 482812, categoryShareOfSector: 57.2, recordCount: 22 },
        ],
        processedAt: '2026-06-08 02:18:16',
      },
    ];
  }
}
