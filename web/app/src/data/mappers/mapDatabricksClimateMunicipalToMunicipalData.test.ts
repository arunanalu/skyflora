import { describe, it, expect } from 'vitest';
import { mapDatabricksClimateMunicipalToMunicipalData } from './mapDatabricksClimateMunicipalToMunicipalData';
import { DatabricksClimateMunicipalDTO } from '../dtos/DatabricksClimateMunicipalDTO';

const baseDTO: DatabricksClimateMunicipalDTO = {
  data_medicao: '2024-12-02',
  temperatura_maxima_c: 34.4,
  temperatura_minima_c: 25,
  temperatura_media_c: 28.4,
  precipitacao_total_mm: 1.8,
  latitude: -12.47,
  longitude: -62.27,
  poluicao_particulas_inalaveis: 17.91,
  poluicao_particulas_finas: 17.52,
  poluicao_monoxido_carbono: 252.25,
  perda_agua_solo_vegetacao: 5.42,
  estresse_hidrico_vegetacao: 2.9,
  cod_ibge: 1100015,
  nome_municipio: "Alta Floresta D'oeste",
  uf: 'RO',
  indice_cobertura_vegetal: 0.6356,
  percentual_nuvens: 47.29,
  focos_queimadas_nasa: 0,
};

describe('mapDatabricksClimateMunicipalToMunicipalData', () => {
  it('mapeia dia com dados completos corretamente', () => {
    const result = mapDatabricksClimateMunicipalToMunicipalData(baseDTO);

    expect(result.ibgeCode).toBe('1100015');
    expect(result.municipalityName).toBe("Alta Floresta D'oeste");
    expect(result.uf).toBe('RO');
    expect(result.date).toBe('2024-12-02');
    expect(result.temperatureMax).toBe(34.4);
    expect(result.temperatureMean).toBe(28.4);
    expect(result.temperatureMin).toBe(25);
    expect(result.precipitationMm).toBe(1.8);
    expect(result.pm10).toBe(17.91);
    expect(result.pm25).toBe(17.52);
    expect(result.carbonMonoxide).toBe(252.25);
    expect(result.waterLoss).toBe(5.42);
    expect(result.waterStress).toBe(2.9);
    expect(result.vegetationIndex).toBe(0.64);
    expect(result.cloudCoverage).toBe(47.29);
    expect(result.fireSpots).toBe(0);
  });

  it('mapeia campos esparsos como null quando ausentes', () => {
    const dto: DatabricksClimateMunicipalDTO = {
      ...baseDTO,
      indice_cobertura_vegetal: null,
      percentual_nuvens: null,
    };

    const result = mapDatabricksClimateMunicipalToMunicipalData(dto);

    expect(result.vegetationIndex).toBeNull();
    expect(result.cloudCoverage).toBeNull();
  });

  it('converte NaN e string vazia para null sem vazar para a UI', () => {
    const dto: DatabricksClimateMunicipalDTO = {
      ...baseDTO,
      temperatura_maxima_c: 'NaN',
      precipitacao_total_mm: '',
      focos_queimadas_nasa: null,
    };

    const result = mapDatabricksClimateMunicipalToMunicipalData(dto);

    expect(result.temperatureMax).toBeNull();
    expect(result.precipitationMm).toBeNull();
    expect(result.fireSpots).toBeNull();
  });
});
