import { ClimateData } from '../entities/ClimateData';
import { PoliticalProposal } from '../entities/PoliticalProposal';
import { CO2Emission } from '../entities/CO2Emission';

export interface IDataRepository {
  getClimateData(month: number, year: number): Promise<ClimateData[]>;
  getPoliticalProposals(stateId?: string): Promise<PoliticalProposal[]>;
  getCO2Emissions(year: number): Promise<CO2Emission[]>;
}
