import { IDataRepository } from '../../domain/repositories/IDataRepository';
import { ClimateData } from '../../domain/entities/ClimateData';
import { PoliticalProposal } from '../../domain/entities/PoliticalProposal';
import { CO2Emission } from '../../domain/entities/CO2Emission';

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
