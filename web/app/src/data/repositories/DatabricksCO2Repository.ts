import { CO2Emission } from '../../domain/entities/CO2Emission';
import { IDataRepository } from '../../domain/repositories/IDataRepository';
import { DatabricksCO2StateDTO } from '../dtos/DatabricksCO2StateDTO';
import { mapDatabricksCO2StatesToCO2Emissions } from '../mappers/mapDatabricksCO2StateToCO2Emission';
import { executeDatabricksQuery } from '../../infrastructure/databricks/DatabricksSqlClient';
import { getCO2DatabricksTableName } from '../../infrastructure/config/env';

const VALID_YEARS = new Set([2024]);

function assertValidYear(year: number): number {
  if (!VALID_YEARS.has(year)) {
    throw new Error(`Year ${year} is not available for CO2 data`);
  }
  return year;
}

function assertValidTableIdentifier(tableName: string): string {
  if (!/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+){0,2}$/.test(tableName)) {
    throw new Error('Invalid Databricks table identifier');
  }
  return tableName;
}

export class DatabricksCO2Repository implements Pick<IDataRepository, 'getCO2Emissions'> {
  async getCO2Emissions(year: number): Promise<CO2Emission[]> {
    assertValidYear(year);
    const tableName = assertValidTableIdentifier(getCO2DatabricksTableName());

    // The table name already encodes the reference year (_2024).
    // data_processamento is the ETL run date (2026), not the emissions year.
    const rows = await executeDatabricksQuery<DatabricksCO2StateDTO>(`
      SELECT *
      FROM ${tableName}
      ORDER BY uf, emissao_total_categoria DESC
    `);

    if (rows.length === 0) return [];

    return mapDatabricksCO2StatesToCO2Emissions(rows);
  }
}
