import 'server-only';

export type ClimateDataSource = 'mock' | 'databricks';

export interface DatabricksConfig {
  serverHostname: string;
  httpPath: string;
  token: string;
  climateStateTable: string;
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

export function getDatabricksConfig(): DatabricksConfig {
  return {
    serverHostname: readRequiredEnv('DATABRICKS_SERVER_HOSTNAME'),
    httpPath: readRequiredEnv('DATABRICKS_HTTP_PATH'),
    token: readRequiredEnv('DATABRICKS_TOKEN'),
    climateStateTable: readRequiredEnv('DATABRICKS_CLIMATE_STATE_TABLE'),
  };
}
