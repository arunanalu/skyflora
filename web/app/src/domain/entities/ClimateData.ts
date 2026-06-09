export interface ClimateData {
  stateId: string; // Ex: 'SP', 'RJ'
  stateName?: string;
  temperature: number; // Graus Celsius
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  temperatureStdDev?: number | null;
  atmosphereQuality: number; // Indice temporario normalizado para compatibilidade visual
  pm10Mean?: number | null;
  pm25Mean?: number | null;
  carbonMonoxideMean?: number | null;
  cloudCoverageMean?: number | null;
  soilMoisture: number; // Indice temporario normalizado para compatibilidade visual
  vegetationWaterLossMean?: number | null;
  vegetationWaterLossMax?: number | null;
  vegetationWaterLossMin?: number | null;
  vegetationWaterStressMean?: number | null;
  vegetationWaterStressMax?: number | null;
  vegetationWaterStressMin?: number | null;
  vegetationCoverIndexMean?: number | null;
  precipitationTotalMm?: number | null;
  precipitationMeanMm?: number | null;
  precipitationMaxMm?: number | null;
  precipitationMinMm?: number | null;
  fireSpotsTotal?: number | null;
  fireSpotsMean?: number | null;
  fireSpotsMax?: number | null;
  municipalityCount?: number | null;
  sourceRecordCount?: number | null;
  referencePeriod?: string | null;
  processedAt?: string | null;
  month: number;
  year: number;
}
