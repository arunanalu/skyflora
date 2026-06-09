import { ClimateData } from '../../domain/entities/ClimateData';
import { DatabricksClimateStateDTO } from '../dtos/DatabricksClimateStateDTO';

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

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
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
  const temperature = toNumber(dto.temperatura_media_c) ?? 0;

  return {
    stateId: dto.uf ?? '',
    stateName: dto.estado ?? undefined,
    temperature,
    temperatureMin: toNumber(dto.temperatura_minima_c),
    temperatureMax: toNumber(dto.temperatura_maxima_c),
    temperatureStdDev: toNumber(dto.temperatura_desvio_padrao_c),
    atmosphereQuality: normalizeAtmosphereQuality(dto),
    pm10Mean: toNumber(dto.poluicao_particulas_inalaveis_media),
    pm25Mean: toNumber(dto.poluicao_particulas_finas_media),
    carbonMonoxideMean: toNumber(dto.poluicao_monoxido_carbono_media),
    cloudCoverageMean: toNumber(dto.percentual_nuvens_medio),
    soilMoisture: normalizeSoilMoisture(dto),
    vegetationWaterLossMean: toNumber(dto.perda_agua_solo_vegetacao_media),
    vegetationWaterLossMax: toNumber(dto.perda_agua_solo_vegetacao_maxima),
    vegetationWaterLossMin: toNumber(dto.perda_agua_solo_vegetacao_minima),
    vegetationWaterStressMean: toNumber(dto.estresse_hidrico_vegetacao_medio),
    vegetationWaterStressMax: toNumber(dto.estresse_hidrico_vegetacao_maximo),
    vegetationWaterStressMin: toNumber(dto.estresse_hidrico_vegetacao_minimo),
    vegetationCoverIndexMean: toNumber(dto.indice_cobertura_vegetal_medio),
    precipitationTotalMm: toNumber(dto.precipitacao_total_mm),
    precipitationMeanMm: toNumber(dto.precipitacao_media_mm),
    precipitationMaxMm: toNumber(dto.precipitacao_maxima_mm),
    precipitationMinMm: toNumber(dto.precipitacao_minima_mm),
    fireSpotsTotal: toNumber(dto.focos_queimadas_nasa_total),
    fireSpotsMean: toNumber(dto.focos_queimadas_nasa_medio),
    fireSpotsMax: toNumber(dto.focos_queimadas_nasa_maximo),
    municipalityCount: toNumber(dto.quantidade_municipios),
    sourceRecordCount: toNumber(dto.quantidade_registros_origem),
    referencePeriod: dto.periodo_referencia,
    processedAt: dto.timestamp_processamento,
    month: parsedPeriod.month ?? fallbackMonth,
    year: parsedPeriod.year ?? fallbackYear,
  };
}
