import { IDataRepository } from '../../domain/repositories/IDataRepository';
import { getClimateDataSource, getCO2DataSource, getPoliticsDataSource } from '../../infrastructure/config/env';
import { DatabricksClimateRepository } from './DatabricksClimateRepository';
import { DatabricksCO2Repository } from './DatabricksCO2Repository';
import { DatabricksPoliticsRepository } from './DatabricksPoliticsRepository';
import { MockRepository } from './MockRepository';

export function createDataRepository(): IDataRepository {
  const mockRepository = new MockRepository();

  const climateSource = getClimateDataSource();
  const co2Source = getCO2DataSource();
  const politicsSource = getPoliticsDataSource();

  const databricksClimate = climateSource === 'databricks' ? new DatabricksClimateRepository() : null;
  const databricksCO2 = co2Source === 'databricks' ? new DatabricksCO2Repository() : null;
  const databricksPolitics = politicsSource === 'databricks' ? new DatabricksPoliticsRepository() : null;

  return {
    getClimateData: (month, year) =>
      databricksClimate ? databricksClimate.getClimateData(month, year) : mockRepository.getClimateData(month, year),
    getPoliticsStateData: (periodoReferencia) =>
      databricksPolitics ? databricksPolitics.getPoliticsStateData(periodoReferencia) : mockRepository.getPoliticsStateData(periodoReferencia),
    getCO2Emissions: (year) =>
      databricksCO2 ? databricksCO2.getCO2Emissions(year) : mockRepository.getCO2Emissions(year),
  };
}
