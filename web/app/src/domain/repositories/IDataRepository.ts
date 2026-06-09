import { ClimateData } from '../entities/ClimateData';
import { CO2Emission } from '../entities/CO2Emission';
import { PoliticsStateData } from '../entities/PoliticsStateData';

export interface IDataRepository {
  getClimateData(month: number, year: number): Promise<ClimateData[]>;
  getPoliticsStateData(periodoReferencia: string): Promise<PoliticsStateData[]>;
  getCO2Emissions(year: number): Promise<CO2Emission[]>;
}
