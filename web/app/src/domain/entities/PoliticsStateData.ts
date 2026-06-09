export interface DeputadoScore {
  nome: string;
  partido: string;
  score: number;
  totalVotos: number;
  scoreRate: number;
}

export interface PoliticsStateData {
  uf: string;

  totalPropostas: number;
  propostasPositivas: number;
  propostasNegativas: number;
  propostasNeutras: number;

  totalDeputados: number;

  totalVotos: number;
  votosDecisivos: number;
  votosNaoConclusivos: number;

  simEmPositivas: number;
  naoEmPositivas: number;
  inconclusivosEmPositivas: number;

  simEmNegativas: number;
  naoEmNegativas: number;
  inconclusivosEmNegativas: number;

  scoreTotal: number;
  scoreRate: number;

  topDeputados: DeputadoScore[];
  bottomDeputados: DeputadoScore[];

  periodoReferencia: string;
  processedAt: string | null;
}
