export interface DatabricksClimateMunicipalDTO {
  data_medicao: string | null;
  temperatura_maxima_c: number | string | null;
  temperatura_minima_c: number | string | null;
  temperatura_media_c: number | string | null;
  precipitacao_total_mm: number | string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  poluicao_particulas_inalaveis: number | string | null;
  poluicao_particulas_finas: number | string | null;
  poluicao_monoxido_carbono: number | string | null;
  perda_agua_solo_vegetacao: number | string | null;
  estresse_hidrico_vegetacao: number | string | null;
  cod_ibge: number | string | null;
  nome_municipio: string | null;
  uf: string | null;
  indice_cobertura_vegetal: number | string | null;   // esparso — null em muitos dias
  percentual_nuvens: number | string | null;          // esparso — idem
  focos_queimadas_nasa: number | string | null;
}
