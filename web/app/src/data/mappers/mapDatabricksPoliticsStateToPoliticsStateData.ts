import { PoliticsStateData, DeputadoScore } from '../../domain/entities/PoliticsStateData';
import { DatabricksPoliticsStateRow, DatabricksDeputadoScoreRow } from '../dtos/DatabricksPoliticsStateDTO';
import { toNumber } from './mapperUtils';

function toInt(value: number | string | null | undefined): number {
  return toNumber(value) ?? 0;
}

function buildDeputadoScore(row: DatabricksDeputadoScoreRow): DeputadoScore {
  const score = toInt(row.score);
  const totalVotos = toInt(row.total_votos);
  return {
    nome: row.nome_deputado ?? '',
    partido: row.partido ?? '',
    score,
    totalVotos,
    scoreRate: totalVotos > 0 ? score / totalVotos : 0,
  };
}

export function mapDatabricksPoliticsStatesToPoliticsStateData(
  stateRows: DatabricksPoliticsStateRow[],
  deputadoRows: DatabricksDeputadoScoreRow[],
): PoliticsStateData[] {
  const deputadosByUf = new Map<string, DatabricksDeputadoScoreRow[]>();
  for (const row of deputadoRows) {
    if (!row.uf) continue;
    const list = deputadosByUf.get(row.uf) ?? [];
    list.push(row);
    deputadosByUf.set(row.uf, list);
  }

  return stateRows
    .filter((row) => !!row.uf)
    .map((row): PoliticsStateData => {
      const uf = row.uf!;
      const votosDecisivos = toInt(row.votos_decisivos);
      const scoreTotal = toInt(row.score_total);
      const scoreRate = votosDecisivos > 0 ? scoreTotal / votosDecisivos : 0;

      const deputies = (deputadosByUf.get(uf) ?? [])
        .map(buildDeputadoScore)
        .filter((d) => d.totalVotos > 0);

      const sorted = [...deputies].sort((a, b) => b.scoreRate - a.scoreRate || b.score - a.score);

      return {
        uf,
        totalPropostas: toInt(row.total_propostas),
        propostasPositivas: toInt(row.propostas_positivas),
        propostasNegativas: toInt(row.propostas_negativas),
        propostasNeutras: toInt(row.propostas_neutras),
        totalDeputados: toInt(row.total_deputados),
        totalVotos: toInt(row.total_votos),
        votosDecisivos,
        votosNaoConclusivos: toInt(row.votos_nao_conclusivos),
        simEmPositivas: toInt(row.sim_em_positivas),
        naoEmPositivas: toInt(row.nao_em_positivas),
        inconclusivosEmPositivas: toInt(row.inconclusivos_em_positivas),
        simEmNegativas: toInt(row.sim_em_negativas),
        naoEmNegativas: toInt(row.nao_em_negativas),
        inconclusivosEmNegativas: toInt(row.inconclusivos_em_negativas),
        scoreTotal,
        scoreRate,
        topDeputados: sorted.slice(0, 5),
        bottomDeputados: [...sorted].reverse().slice(0, 5),
        periodoReferencia: row.periodo_referencia ?? '',
        processedAt: row.data_processamento ?? null,
      };
    });
}
