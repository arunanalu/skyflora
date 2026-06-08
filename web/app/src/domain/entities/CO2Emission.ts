export interface CO2Emission {
  stateId: string;
  emissionAmount: number; // Quantidade de emissão em toneladas
  year: number;
  topPolluter?: string;
  polluterEmission?: number;
}
