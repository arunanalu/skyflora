export interface MunicipalClimateData {
  ibgeCode: string;
  municipalityName: string;
  uf: string;
  date: string;                 // ISO: "2024-12-10"
  latitude: number | null;
  longitude: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  temperatureMean: number | null;
  precipitationMm: number | null;
  pm10: number | null;
  pm25: number | null;
  carbonMonoxide: number | null;
  cloudCoverage: number | null; // null frequente — satélite bloqueado por nuvens
  waterLoss: number | null;
  waterStress: number | null;
  vegetationIndex: number | null; // null frequente — idem
  fireSpots: number | null;
}
