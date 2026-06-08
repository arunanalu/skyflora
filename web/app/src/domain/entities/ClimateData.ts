export interface ClimateData {
  stateId: string; // Ex: 'SP', 'RJ'
  temperature: number; // Graus Celsius
  atmosphereQuality: number; // Índice de qualidade
  soilMoisture: number; // Porcentagem
  month: number;
  year: number;
}
