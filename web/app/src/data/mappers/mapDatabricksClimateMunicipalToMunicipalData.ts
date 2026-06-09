import { MunicipalClimateData } from '../../domain/entities/MunicipalClimateData';
import { DatabricksClimateMunicipalDTO } from '../dtos/DatabricksClimateMunicipalDTO';
import { roundedNumber, toNumber } from './mapperUtils';

export function mapDatabricksClimateMunicipalToMunicipalData(
  dto: DatabricksClimateMunicipalDTO,
): MunicipalClimateData {
  return {
    ibgeCode: String(dto.cod_ibge ?? ''),
    municipalityName: dto.nome_municipio ?? '',
    uf: dto.uf ?? '',
    date: dto.data_medicao ?? '',
    latitude: toNumber(dto.latitude),
    longitude: toNumber(dto.longitude),
    temperatureMax: roundedNumber(dto.temperatura_maxima_c),
    temperatureMin: roundedNumber(dto.temperatura_minima_c),
    temperatureMean: roundedNumber(dto.temperatura_media_c),
    precipitationMm: roundedNumber(dto.precipitacao_total_mm),
    pm10: roundedNumber(dto.poluicao_particulas_inalaveis),
    pm25: roundedNumber(dto.poluicao_particulas_finas),
    carbonMonoxide: roundedNumber(dto.poluicao_monoxido_carbono),
    cloudCoverage: roundedNumber(dto.percentual_nuvens),
    waterLoss: roundedNumber(dto.perda_agua_solo_vegetacao),
    waterStress: roundedNumber(dto.estresse_hidrico_vegetacao),
    vegetationIndex: roundedNumber(dto.indice_cobertura_vegetal),
    fireSpots: roundedNumber(dto.focos_queimadas_nasa),
  };
}
