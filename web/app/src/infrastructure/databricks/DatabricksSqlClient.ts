import 'server-only';

import { DBSQLClient } from '@databricks/sql';
import { getDatabricksConfig } from '../config/env';

type DatabricksOperation = {
  fetchAll: () => Promise<object[]>;
  close: () => Promise<unknown>;
};

type DatabricksSession = {
  executeStatement: (statement: string, options?: object) => Promise<DatabricksOperation>;
  close: () => Promise<unknown>;
};

export class DatabricksQueryError extends Error {
  constructor(message = 'Databricks query failed') {
    super(message);
    this.name = 'DatabricksQueryError';
  }
}

export function sanitizeDatabricksError(error: unknown): DatabricksQueryError {
  if (error instanceof Error) {
    return new DatabricksQueryError(error.message.replace(/dapi[a-zA-Z0-9]+/g, '[REDACTED]'));
  }

  return new DatabricksQueryError();
}

export async function withDatabricksSession<T>(
  callback: (session: DatabricksSession) => Promise<T>,
): Promise<T> {
  const config = getDatabricksConfig();
  const client = new DBSQLClient();
  let connectedClient: Awaited<ReturnType<DBSQLClient['connect']>> | null = null;
  let session: DatabricksSession | null = null;

  try {
    connectedClient = await client.connect({
      host: config.serverHostname,
      path: config.httpPath,
      token: config.token,
      telemetryEnabled: false,
    });
    const openedSession = await connectedClient.openSession();
    session = openedSession;

    return await callback(openedSession);
  } catch (error) {
    throw sanitizeDatabricksError(error);
  } finally {
    await session?.close().catch(() => undefined);
    await connectedClient?.close().catch(() => undefined);
  }
}

export async function executeDatabricksQuery<T extends object>(statement: string): Promise<T[]> {
  return withDatabricksSession(async (session) => {
    const operation = await session.executeStatement(statement);

    try {
      return (await operation.fetchAll()) as T[];
    } finally {
      await operation.close().catch(() => undefined);
    }
  });
}
