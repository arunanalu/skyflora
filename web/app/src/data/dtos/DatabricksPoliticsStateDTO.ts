export interface DatabricksPoliticsStateRow {
  uf: string | null;
  total_propostas: number | string | null;
  propostas_positivas: number | string | null;
  propostas_negativas: number | string | null;
  propostas_neutras: number | string | null;
  total_deputados: number | string | null;
  total_votos: number | string | null;
  votos_decisivos: number | string | null;
  votos_nao_conclusivos: number | string | null;
  sim_em_positivas: number | string | null;
  nao_em_positivas: number | string | null;
  inconclusivos_em_positivas: number | string | null;
  sim_em_negativas: number | string | null;
  nao_em_negativas: number | string | null;
  inconclusivos_em_negativas: number | string | null;
  score_total: number | string | null;
  periodo_referencia: string | null;
  data_processamento: string | null;
}

export interface DatabricksDeputadoScoreRow {
  uf: string | null;
  nome_deputado: string | null;
  partido: string | null;
  score: number | string | null;
  total_votos: number | string | null;
}
