import 'server-only';

export type ClimateDataSource = 'mock' | 'databricks';
export type CO2DataSource = 'mock' | 'databricks';

export interface DatabricksConfig {
  serverHostname: string;
  httpPath: string;
  token: string;
  climateStateTable: string;
  climateMunicipalTable: string;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getClimateDataSource(): ClimateDataSource {
  return process.env.CLIMATE_DATA_SOURCE === 'databricks' ? 'databricks' : 'mock';
}

export function getCO2DataSource(): CO2DataSource {
  return process.env.CO2_DATA_SOURCE === 'databricks' ? 'databricks' : 'mock';
}

export function getCO2DatabricksTableName(): string {
  return readRequiredEnv('DATABRICKS_CO2_STATE_TABLE');
}

export function getDatabricksConfig(): DatabricksConfig {
  return {
    serverHostname: readRequiredEnv('DATABRICKS_SERVER_HOSTNAME'),
    httpPath: readRequiredEnv('DATABRICKS_HTTP_PATH'),
    token: readRequiredEnv('DATABRICKS_TOKEN'),
    climateStateTable: readRequiredEnv('DATABRICKS_CLIMATE_STATE_TABLE'),
    climateMunicipalTable: readRequiredEnv('DATABRICKS_CLIMATE_MUNICIPAL_TABLE'),
  };
}
