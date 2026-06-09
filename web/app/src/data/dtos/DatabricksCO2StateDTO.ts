export interface DatabricksCO2StateDTO {
  estado: string;
  uf: string;
  setor_emissor: string;
  emissao_total_setor: number;
  categoria_emissora: string;
  emissao_total_categoria: number;
  percentual_setor_estado: number;
  percentual_categoria_setor: number;
  quantidade_registros: number | null;
  data_processamento: string;
  timestamp_processamento: string;
}

// Test fixtures — 5 rows for Pará (real values from CSV)
export const FIXTURE_PA: DatabricksCO2StateDTO[] = [
  { estado: 'Pará', uf: 'PA', setor_emissor: 'Mudança de Uso da Terra e Floresta', emissao_total_setor: 205535488.31597525, categoria_emissora: 'Alterações de uso da terra', emissao_total_categoria: 194101765, percentual_setor_estado: 74.0073, percentual_categoria_setor: 94.4371, quantidade_registros: 400, data_processamento: '2026-06-08', timestamp_processamento: '2026-06-08 02:18:16.503970000' },
  { estado: 'Pará', uf: 'PA', setor_emissor: 'Agropecuária', emissao_total_setor: 55114468.30828382, categoria_emissora: 'Fermentação entérica', emissao_total_categoria: 42876474.50043997, percentual_setor_estado: 19.8451, percentual_categoria_setor: 77.7953, quantidade_registros: 18, data_processamento: '2026-06-08', timestamp_processamento: '2026-06-08 02:18:16.503970000' },
  { estado: 'Pará', uf: 'PA', setor_emissor: 'Agropecuária', emissao_total_setor: 55114468.30828382, categoria_emissora: 'Solos manejados', emissao_total_categoria: 10669452.21523231, percentual_setor_estado: 19.8451, percentual_categoria_setor: 19.3587, quantidade_registros: 140, data_processamento: '2026-06-08', timestamp_processamento: '2026-06-08 02:18:16.503970000' },
  { estado: 'Pará', uf: 'PA', setor_emissor: 'Mudança de Uso da Terra e Floresta', emissao_total_setor: 205535488.31597525, categoria_emissora: 'Resíduos florestais', emissao_total_categoria: 10009988, percentual_setor_estado: 74.0073, percentual_categoria_setor: 4.8702, quantidade_registros: 177, data_processamento: '2026-06-08', timestamp_processamento: '2026-06-08 02:18:16.503970000' },
  { estado: 'Pará', uf: 'PA', setor_emissor: 'Energia', emissao_total_setor: 12306844.449426929, categoria_emissora: 'Transportes', emissao_total_categoria: 8270661.270526601, percentual_setor_estado: 4.4313, percentual_categoria_setor: 67.2038, quantidade_registros: 65, data_processamento: '2026-06-08', timestamp_processamento: '2026-06-08 02:18:16.503970000' },
];
