import { IDataRepository } from '../../domain/repositories/IDataRepository';
import { getClimateDataSource } from '../../infrastructure/config/env';
import { DatabricksClimateRepository } from './DatabricksClimateRepository';
import { MockRepository } from './MockRepository';

export function createDataRepository(): IDataRepository {
  const mockRepository = new MockRepository();

  if (getClimateDataSource() !== 'databricks') {
    return mockRepository;
  }

  const databricksClimateRepository = new DatabricksClimateRepository();

  return {
    getClimateData: (month, year) => databricksClimateRepository.getClimateData(month, year),
    getPoliticalProposals: (stateId) => mockRepository.getPoliticalProposals(stateId),
    getCO2Emissions: (year) => mockRepository.getCO2Emissions(year),
  };
}
