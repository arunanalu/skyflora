import { MunicipalClimateData } from '../../domain/entities/MunicipalClimateData';
import { DatabricksClimateMunicipalDTO } from '../dtos/DatabricksClimateMunicipalDTO';
import { mapDatabricksClimateMunicipalToMunicipalData } from '../mappers/mapDatabricksClimateMunicipalToMunicipalData';
import { executeDatabricksQuery } from '../../infrastructure/databricks/DatabricksSqlClient';
import { getDatabricksConfig } from '../../infrastructure/config/env';

export interface MunicipalQueryParams {
  uf: string;
  date: string;
  search?: string;
  limit?: number;
  offset?: number;
}

const UF_RE = /^[A-Z]{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertValidTableIdentifier(tableName: string): string {
  if (!/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+){0,2}$/.test(tableName)) {
    throw new Error('Invalid Databricks table identifier');
  }
  return tableName;
}

function sanitizeSearch(value: string): string {
  // Escape ILIKE special chars so user input is treated as literal substring
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/'/g, "''");
}

export class DatabricksClimateMunicipalRepository {
  async getMunicipalClimateData(params: MunicipalQueryParams): Promise<MunicipalClimateData[]> {
    const { uf, date, search = '', limit = 20, offset = 0 } = params;

    if (!UF_RE.test(uf)) throw new Error(`Invalid uf: ${uf}`);
    if (!DATE_RE.test(date)) throw new Error(`Invalid date: ${date}`);

    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const safeOffset = Math.max(0, Math.floor(offset));
    const safeSearch = sanitizeSearch(search.slice(0, 100));

    const { climateMunicipalTable } = getDatabricksConfig();
    const tableName = assertValidTableIdentifier(climateMunicipalTable);

    const rows = await executeDatabricksQuery<DatabricksClimateMunicipalDTO>(`
      SELECT *
      FROM ${tableName}
      WHERE uf = '${uf}'
        AND data_medicao = '${date}'
        AND nome_municipio ILIKE '%${safeSearch}%'
      ORDER BY nome_municipio
      LIMIT ${safeLimit}
      OFFSET ${safeOffset}
    `);

    return rows.map(mapDatabricksClimateMunicipalToMunicipalData);
  }
}
