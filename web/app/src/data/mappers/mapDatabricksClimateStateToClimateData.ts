import { ClimateData } from '../../domain/entities/ClimateData';
import { DatabricksClimateStateDTO } from '../dtos/DatabricksClimateStateDTO';
import { toNumber, round, roundedNumber } from './mapperUtils';

const MONTHS_BY_REFERENCE: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function parseReferencePeriod(period: string | null | undefined): { month?: number; year?: number } {
  if (!period) return {};

  const [monthName, yearText] = period.trim().toLocaleLowerCase('pt-BR').split(/\s+/);
  const month = MONTHS_BY_REFERENCE[monthName];
  const year = Number(yearText);

  return {
    month,
    year: Number.isInteger(year) ? year : undefined,
  };
}

function normalizeAtmosphereQuality(dto: DatabricksClimateStateDTO): number {
  const pm25 = toNumber(dto.poluicao_particulas_finas_media) ?? 0;
  const pm10 = toNumber(dto.poluicao_particulas_inalaveis_media) ?? 0;
  const co = toNumber(dto.poluicao_monoxido_carbono_media) ?? 0;

  // Temporary UI compatibility index: lower PM2.5/PM10/CO means better atmosphere.
  const penalty = (pm25 / 25) * 45 + (pm10 / 50) * 35 + (co / 1000) * 20;
  return round(clamp(100 - penalty));
}

function normalizeSoilMoisture(dto: DatabricksClimateStateDTO): number {
  const waterLoss = toNumber(dto.perda_agua_solo_vegetacao_media) ?? 0;
  const waterStress = toNumber(dto.estresse_hidrico_vegetacao_medio) ?? 0;

  // Temporary UI compatibility index: lower water loss and hydric stress means healthier soil/vegetation.
  const penalty = (waterLoss / 10) * 55 + (waterStress / 6) * 45;
  return round(clamp(100 - penalty));
}

export function mapDatabricksClimateStateToClimateData(
  dto: DatabricksClimateStateDTO,
  fallbackMonth: number,
  fallbackYear: number,
): ClimateData {
  const parsedPeriod = parseReferencePeriod(dto.periodo_referencia);
  const temperature = roundedNumber(dto.temperatura_media_c) ?? 0;

  return {
    stateId: dto.uf ?? '',
    stateName: dto.estado ?? undefined,
    temperature,
    temperatureMin: roundedNumber(dto.temperatura_minima_c),
    temperatureMax: roundedNumber(dto.temperatura_maxima_c),
    temperatureStdDev: roundedNumber(dto.temperatura_desvio_padrao_c),
    atmosphereQuality: normalizeAtmosphereQuality(dto),
    pm10Mean: roundedNumber(dto.poluicao_particulas_inalaveis_media),
    pm25Mean: roundedNumber(dto.poluicao_particulas_finas_media),
    carbonMonoxideMean: roundedNumber(dto.poluicao_monoxido_carbono_media),
    cloudCoverageMean: roundedNumber(dto.percentual_nuvens_medio),
    soilMoisture: normalizeSoilMoisture(dto),
    vegetationWaterLossMean: roundedNumber(dto.perda_agua_solo_vegetacao_media),
    vegetationWaterLossMax: roundedNumber(dto.perda_agua_solo_vegetacao_maxima),
    vegetationWaterLossMin: roundedNumber(dto.perda_agua_solo_vegetacao_minima),
    vegetationWaterStressMean: roundedNumber(dto.estresse_hidrico_vegetacao_medio),
    vegetationWaterStressMax: roundedNumber(dto.estresse_hidrico_vegetacao_maximo),
    vegetationWaterStressMin: roundedNumber(dto.estresse_hidrico_vegetacao_minimo),
    vegetationCoverIndexMean: roundedNumber(dto.indice_cobertura_vegetal_medio),
    vegetationCoverIndexMin: roundedNumber(dto.indice_cobertura_vegetal_minimo),
    vegetationCoverIndexMax: roundedNumber(dto.indice_cobertura_vegetal_maximo),
    vegetationCoverIndexStdDev: roundedNumber(dto.indice_cobertura_vegetal_desvio_padrao),
    precipitationTotalMm: roundedNumber(dto.precipitacao_total_mm),
    precipitationMeanMm: roundedNumber(dto.precipitacao_media_mm),
    precipitationMaxMm: roundedNumber(dto.precipitacao_maxima_mm),
    precipitationMinMm: roundedNumber(dto.precipitacao_minima_mm),
    fireSpotsTotal: roundedNumber(dto.focos_queimadas_nasa_total),
    fireSpotsMean: roundedNumber(dto.focos_queimadas_nasa_medio),
    fireSpotsMax: roundedNumber(dto.focos_queimadas_nasa_maximo),
    cloudCoverageMin: roundedNumber(dto.percentual_nuvens_minimo),
    cloudCoverageMax: roundedNumber(dto.percentual_nuvens_maximo),
    highReliabilityRecordCount: roundedNumber(dto.registros_alta_confiabilidade),
    highReliabilityPercent: roundedNumber(dto.percentual_alta_confiabilidade),
    municipalityCount: roundedNumber(dto.quantidade_municipios),
    sourceRecordCount: roundedNumber(dto.quantidade_registros_origem),
    referencePeriod: dto.periodo_referencia,
    processedAt: dto.timestamp_processamento,
    month: parsedPeriod.month ?? fallbackMonth,
    year: parsedPeriod.year ?? fallbackYear,
  };
}
