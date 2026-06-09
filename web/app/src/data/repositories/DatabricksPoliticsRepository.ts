import { PoliticsStateData } from '../../domain/entities/PoliticsStateData';
import { DatabricksPoliticsStateRow, DatabricksDeputadoScoreRow } from '../dtos/DatabricksPoliticsStateDTO';
import { mapDatabricksPoliticsStatesToPoliticsStateData } from '../mappers/mapDatabricksPoliticsStateToPoliticsStateData';
import { executeDatabricksQuery } from '../../infrastructure/databricks/DatabricksSqlClient';
import { getPoliticsDatabricksTableName } from '../../infrastructure/config/env';

const VALID_PERIODO = /^\d{4}-\d{2}$/;

function assertValidTableIdentifier(tableName: string): string {
  if (!/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+){0,2}$/.test(tableName)) {
    throw new Error('Invalid Databricks table identifier');
  }
  return tableName;
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export class DatabricksPoliticsRepository {
  async getPoliticsStateData(periodoReferencia: string): Promise<PoliticsStateData[]> {
    if (!VALID_PERIODO.test(periodoReferencia)) {
      throw new Error(`Invalid periodo_referencia format: ${periodoReferencia}`);
    }

    const tableName = assertValidTableIdentifier(getPoliticsDatabricksTableName());
    const safePeriodo = escapeSqlString(periodoReferencia);

    const [stateRows, deputadoRows] = await Promise.all([
      executeDatabricksQuery<DatabricksPoliticsStateRow>(`
        SELECT
          uf,
          COUNT(DISTINCT id_proposta)                                                              AS total_propostas,
          COUNT(DISTINCT CASE WHEN classificacao_pauta = 'positiva' THEN id_proposta END)         AS propostas_positivas,
          COUNT(DISTINCT CASE WHEN classificacao_pauta = 'negativa' THEN id_proposta END)         AS propostas_negativas,
          COUNT(DISTINCT CASE WHEN classificacao_pauta = 'neutra'   THEN id_proposta END)         AS propostas_neutras,
          COUNT(DISTINCT nome_deputado)                                                            AS total_deputados,
          COUNT(*)                                                                                 AS total_votos,
          COUNT(CASE WHEN voto_computado IN ('sim', 'não') THEN 1 END)                           AS votos_decisivos,
          COUNT(CASE WHEN voto_computado = 'não conclusivo' THEN 1 END)                          AS votos_nao_conclusivos,
          COUNT(CASE WHEN voto_computado = 'sim' AND classificacao_pauta = 'positiva' THEN 1 END) AS sim_em_positivas,
          COUNT(CASE WHEN voto_computado = 'não' AND classificacao_pauta = 'positiva' THEN 1 END) AS nao_em_positivas,
          COUNT(CASE WHEN voto_computado = 'não conclusivo' AND classificacao_pauta = 'positiva' THEN 1 END) AS inconclusivos_em_positivas,
          COUNT(CASE WHEN voto_computado = 'sim' AND classificacao_pauta = 'negativa' THEN 1 END) AS sim_em_negativas,
          COUNT(CASE WHEN voto_computado = 'não' AND classificacao_pauta = 'negativa' THEN 1 END) AS nao_em_negativas,
          COUNT(CASE WHEN voto_computado = 'não conclusivo' AND classificacao_pauta = 'negativa' THEN 1 END) AS inconclusivos_em_negativas,
          SUM(score_voto_socioambiental)                                                           AS score_total,
          MAX(periodo_referencia)                                                                  AS periodo_referencia,
          MAX(data_processamento)                                                                  AS data_processamento
        FROM ${tableName}
        WHERE periodo_referencia = '${safePeriodo}'
        GROUP BY uf
        ORDER BY uf
      `),
      executeDatabricksQuery<DatabricksDeputadoScoreRow>(`
        SELECT
          uf,
          nome_deputado,
          partido,
          SUM(score_voto_socioambiental)                                    AS score,
          COUNT(CASE WHEN voto_computado IN ('sim', 'não') THEN 1 END)    AS total_votos
        FROM ${tableName}
        WHERE periodo_referencia = '${safePeriodo}'
        GROUP BY uf, nome_deputado, partido
        ORDER BY uf, score DESC, total_votos DESC
      `),
    ]);

    if (stateRows.length === 0) return [];

    return mapDatabricksPoliticsStatesToPoliticsStateData(stateRows, deputadoRows);
  }
}
