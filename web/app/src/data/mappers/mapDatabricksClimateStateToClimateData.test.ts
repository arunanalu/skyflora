import { describe, expect, it } from 'vitest';
import { DatabricksClimateStateDTO } from '../dtos/DatabricksClimateStateDTO';
import { mapDatabricksClimateStateToClimateData } from './mapDatabricksClimateStateToClimateData';

describe('mapDatabricksClimateStateToClimateData', () => {
  it('mapeia uma linha estadual do Databricks para ClimateData', () => {
    const dto: DatabricksClimateStateDTO = {
      uf: 'AC',
      estado: 'Acre',
      quantidade_municipios: 22,
      quantidade_registros_origem: 682,
      temperatura_media_c: 25.63,
      temperatura_minima_c: 19.2,
      temperatura_maxima_c: 34.2,
      temperatura_desvio_padrao_c: 1.19,
      precipitacao_total_mm: 5815.6,
      precipitacao_media_mm: 8.53,
      precipitacao_maxima_mm: 46,
      precipitacao_minima_mm: 0,
      perda_agua_solo_vegetacao_media: 3.98,
      perda_agua_solo_vegetacao_maxima: 5.73,
      perda_agua_solo_vegetacao_minima: 1.23,
      perda_agua_desvio_padrao: 1.02,
      estresse_hidrico_vegetacao_medio: 1.65,
      estresse_hidrico_vegetacao_maximo: 2.98,
      estresse_hidrico_vegetacao_minimo: 0.08,
      estresse_hidrico_desvio_padrao: 0.64,
      poluicao_particulas_inalaveis_media: 8.63,
      poluicao_particulas_inalaveis_maxima: 25.1,
      poluicao_particulas_inalaveis_minima: 2.95,
      poluicao_particulas_inalaveis_desvio: 2.9,
      poluicao_particulas_finas_media: 8.43,
      poluicao_particulas_finas_maxima: 24.82,
      poluicao_particulas_finas_minima: 2.94,
      poluicao_particulas_finas_desvio: 2.81,
      poluicao_monoxido_carbono_media: 199.46,
      poluicao_monoxido_carbono_maxima: 550.04,
      poluicao_monoxido_carbono_minima: 145.17,
      poluicao_monoxido_carbono_desvio: 27.66,
      focos_queimadas_nasa_total: 244,
      focos_queimadas_nasa_medio: 0.36,
      focos_queimadas_nasa_maximo: 23,
      indice_cobertura_vegetal_medio: 0.36,
      indice_cobertura_vegetal_registros_validos: 143,
      percentual_nuvens_medio: 1187.17,
      percentual_nuvens_registros_validos: 143,
      periodo_referencia: 'Dezembro 2024',
      data_processamento: '2026-06-08',
      timestamp_processamento: '2026-06-08 01:31:00.057308000',
    };

    const result = mapDatabricksClimateStateToClimateData(dto, 12, 2024);

    expect(result.stateId).toBe('AC');
    expect(result.stateName).toBe('Acre');
    expect(result.temperature).toBe(25.63);
    expect(result.temperatureMin).toBe(19.2);
    expect(result.temperatureMax).toBe(34.2);
    expect(result.pm25Mean).toBe(8.43);
    expect(result.pm10Mean).toBe(8.63);
    expect(result.soilMoisture).toBeGreaterThan(0);
    expect(result.atmosphereQuality).toBeGreaterThan(0);
    expect(result.month).toBe(12);
    expect(result.year).toBe(2024);
  });

  it('converte NaN textual para null em campos opcionais', () => {
    const result = mapDatabricksClimateStateToClimateData({
      uf: 'BA',
      estado: 'Bahia',
      quantidade_municipios: 417,
      quantidade_registros_origem: 12927,
      temperatura_media_c: 26.1,
      temperatura_minima_c: 12.1,
      temperatura_maxima_c: 38.5,
      temperatura_desvio_padrao_c: 1.87,
      precipitacao_total_mm: 15320.4,
      precipitacao_media_mm: 1.19,
      precipitacao_maxima_mm: 54.9,
      precipitacao_minima_mm: 0,
      perda_agua_solo_vegetacao_media: 5.77,
      perda_agua_solo_vegetacao_maxima: 9.49,
      perda_agua_solo_vegetacao_minima: 1.44,
      perda_agua_desvio_padrao: 0.96,
      estresse_hidrico_vegetacao_medio: 2.84,
      estresse_hidrico_vegetacao_maximo: 5.71,
      estresse_hidrico_vegetacao_minimo: 0.28,
      estresse_hidrico_desvio_padrao: 0.87,
      poluicao_particulas_inalaveis_media: 6.84,
      poluicao_particulas_inalaveis_maxima: 22.27,
      poluicao_particulas_inalaveis_minima: 1.71,
      poluicao_particulas_inalaveis_desvio: 2.17,
      poluicao_particulas_finas_media: 5.36,
      poluicao_particulas_finas_maxima: 21.88,
      poluicao_particulas_finas_minima: 1.5,
      poluicao_particulas_finas_desvio: 1.83,
      poluicao_monoxido_carbono_media: 124.73,
      poluicao_monoxido_carbono_maxima: 353.71,
      poluicao_monoxido_carbono_minima: 82.33,
      poluicao_monoxido_carbono_desvio: 19.37,
      focos_queimadas_nasa_total: 7113,
      focos_queimadas_nasa_medio: 0.55,
      focos_queimadas_nasa_maximo: 30,
      indice_cobertura_vegetal_medio: 'NaN',
      indice_cobertura_vegetal_registros_validos: 3058,
      percentual_nuvens_medio: 380.86,
      percentual_nuvens_registros_validos: 3055,
      periodo_referencia: 'Dezembro 2024',
      data_processamento: '2026-06-08',
      timestamp_processamento: '2026-06-08 01:31:00.057308000',
    }, 12, 2024);

    expect(result.vegetationCoverIndexMean).toBeNull();
  });
});
