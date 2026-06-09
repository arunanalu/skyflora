import { ClimateData } from '../../domain/entities/ClimateData';
import { IDataRepository } from '../../domain/repositories/IDataRepository';
import { DatabricksClimateStateDTO } from '../dtos/DatabricksClimateStateDTO';
import { mapDatabricksClimateStateToClimateData } from '../mappers/mapDatabricksClimateStateToClimateData';
import { executeDatabricksQuery } from '../../infrastructure/databricks/DatabricksSqlClient';
import { getDatabricksConfig } from '../../infrastructure/config/env';

const MONTH_REFERENCES = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

function assertValidTableIdentifier(tableName: string): string {
  if (!/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+){0,2}$/.test(tableName)) {
    throw new Error('Invalid Databricks table identifier');
  }

  return tableName;
}

function buildReferencePeriod(month: number, year: number): string {
  const monthName = MONTH_REFERENCES[month - 1];

  if (!monthName) {
    throw new Error('Invalid month');
  }

  return `${monthName} ${year}`;
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export class DatabricksClimateRepository implements Pick<IDataRepository, 'getClimateData'> {
  async getClimateData(month: number, year: number): Promise<ClimateData[]> {
    const { climateStateTable } = getDatabricksConfig();
    const tableName = assertValidTableIdentifier(climateStateTable);
    const referencePeriod = escapeSqlString(buildReferencePeriod(month, year));

    const rows = await executeDatabricksQuery<DatabricksClimateStateDTO>(`
      SELECT *
      FROM ${tableName}
      WHERE periodo_referencia = '${referencePeriod}'
      ORDER BY uf
    `);

    return rows
      .map((row) => mapDatabricksClimateStateToClimateData(row, month, year))
      .filter((row) => row.stateId);
  }
}
