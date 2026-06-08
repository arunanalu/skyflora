// Mock dataset for Skyflora visualizations
export type StateRow = {
  uf: string;
  name: string;
  tempMax: number;
  tempAvg: number;
  pm25: number;
  co2: number; // Mt/year
  vegetation: number; // %
  fires: number;
  insalubrity: number; // 0-100
  propsBenefit: number;
  propsHarm: number;
  approved: number;
  rejected: number;
};

export const STATES: StateRow[] = [
  { uf: "AC", name: "Acre", tempMax: 33, tempAvg: 26, pm25: 38, co2: 12, vegetation: 78, fires: 1240, insalubrity: 62, propsBenefit: 14, propsHarm: 9, approved: 8, rejected: 15 },
  { uf: "AL", name: "Alagoas", tempMax: 32, tempAvg: 26, pm25: 22, co2: 8, vegetation: 22, fires: 180, insalubrity: 48, propsBenefit: 9, propsHarm: 7, approved: 6, rejected: 10 },
  { uf: "AP", name: "Amapá", tempMax: 33, tempAvg: 27, pm25: 30, co2: 5, vegetation: 92, fires: 620, insalubrity: 41, propsBenefit: 12, propsHarm: 4, approved: 9, rejected: 7 },
  { uf: "AM", name: "Amazonas", tempMax: 34, tempAvg: 27, pm25: 48, co2: 24, vegetation: 95, fires: 4820, insalubrity: 71, propsBenefit: 22, propsHarm: 18, approved: 14, rejected: 26 },
  { uf: "BA", name: "Bahia", tempMax: 35, tempAvg: 27, pm25: 28, co2: 32, vegetation: 38, fires: 1980, insalubrity: 58, propsBenefit: 28, propsHarm: 19, approved: 18, rejected: 29 },
  { uf: "CE", name: "Ceará", tempMax: 34, tempAvg: 28, pm25: 30, co2: 18, vegetation: 24, fires: 720, insalubrity: 56, propsBenefit: 16, propsHarm: 11, approved: 12, rejected: 15 },
  { uf: "DF", name: "Distrito Federal", tempMax: 30, tempAvg: 22, pm25: 26, co2: 6, vegetation: 35, fires: 320, insalubrity: 44, propsBenefit: 31, propsHarm: 22, approved: 24, rejected: 29 },
  { uf: "ES", name: "Espírito Santo", tempMax: 32, tempAvg: 25, pm25: 24, co2: 14, vegetation: 41, fires: 280, insalubrity: 46, propsBenefit: 11, propsHarm: 8, approved: 8, rejected: 11 },
  { uf: "GO", name: "Goiás", tempMax: 33, tempAvg: 25, pm25: 35, co2: 22, vegetation: 28, fires: 2140, insalubrity: 64, propsBenefit: 18, propsHarm: 21, approved: 14, rejected: 25 },
  { uf: "MA", name: "Maranhão", tempMax: 35, tempAvg: 28, pm25: 42, co2: 19, vegetation: 52, fires: 3210, insalubrity: 68, propsBenefit: 13, propsHarm: 16, approved: 9, rejected: 20 },
  { uf: "MT", name: "Mato Grosso", tempMax: 36, tempAvg: 27, pm25: 56, co2: 41, vegetation: 58, fires: 6820, insalubrity: 82, propsBenefit: 19, propsHarm: 28, approved: 12, rejected: 35 },
  { uf: "MS", name: "Mato Grosso do Sul", tempMax: 34, tempAvg: 26, pm25: 38, co2: 28, vegetation: 44, fires: 1820, insalubrity: 60, propsBenefit: 12, propsHarm: 17, approved: 9, rejected: 20 },
  { uf: "MG", name: "Minas Gerais", tempMax: 31, tempAvg: 23, pm25: 32, co2: 46, vegetation: 36, fires: 1240, insalubrity: 55, propsBenefit: 34, propsHarm: 24, approved: 28, rejected: 30 },
  { uf: "PA", name: "Pará", tempMax: 34, tempAvg: 27, pm25: 52, co2: 38, vegetation: 71, fires: 5640, insalubrity: 78, propsBenefit: 21, propsHarm: 26, approved: 14, rejected: 33 },
  { uf: "PB", name: "Paraíba", tempMax: 33, tempAvg: 27, pm25: 21, co2: 7, vegetation: 21, fires: 140, insalubrity: 43, propsBenefit: 10, propsHarm: 6, approved: 8, rejected: 8 },
  { uf: "PR", name: "Paraná", tempMax: 29, tempAvg: 21, pm25: 26, co2: 24, vegetation: 32, fires: 410, insalubrity: 48, propsBenefit: 22, propsHarm: 14, approved: 18, rejected: 18 },
  { uf: "PE", name: "Pernambuco", tempMax: 32, tempAvg: 26, pm25: 28, co2: 16, vegetation: 26, fires: 320, insalubrity: 51, propsBenefit: 19, propsHarm: 12, approved: 14, rejected: 17 },
  { uf: "PI", name: "Piauí", tempMax: 36, tempAvg: 28, pm25: 36, co2: 11, vegetation: 30, fires: 2240, insalubrity: 66, propsBenefit: 11, propsHarm: 10, approved: 8, rejected: 13 },
  { uf: "RJ", name: "Rio de Janeiro", tempMax: 33, tempAvg: 24, pm25: 41, co2: 36, vegetation: 28, fires: 220, insalubrity: 59, propsBenefit: 26, propsHarm: 18, approved: 22, rejected: 22 },
  { uf: "RN", name: "Rio Grande do Norte", tempMax: 32, tempAvg: 27, pm25: 22, co2: 9, vegetation: 22, fires: 180, insalubrity: 44, propsBenefit: 12, propsHarm: 7, approved: 10, rejected: 9 },
  { uf: "RS", name: "Rio Grande do Sul", tempMax: 30, tempAvg: 20, pm25: 24, co2: 26, vegetation: 30, fires: 320, insalubrity: 47, propsBenefit: 24, propsHarm: 15, approved: 20, rejected: 19 },
  { uf: "RO", name: "Rondônia", tempMax: 34, tempAvg: 26, pm25: 46, co2: 18, vegetation: 64, fires: 3120, insalubrity: 72, propsBenefit: 10, propsHarm: 14, approved: 6, rejected: 18 },
  { uf: "RR", name: "Roraima", tempMax: 33, tempAvg: 27, pm25: 40, co2: 7, vegetation: 86, fires: 1820, insalubrity: 58, propsBenefit: 8, propsHarm: 6, approved: 5, rejected: 9 },
  { uf: "SC", name: "Santa Catarina", tempMax: 29, tempAvg: 20, pm25: 22, co2: 18, vegetation: 38, fires: 220, insalubrity: 42, propsBenefit: 20, propsHarm: 11, approved: 16, rejected: 15 },
  { uf: "SP", name: "São Paulo", tempMax: 31, tempAvg: 22, pm25: 44, co2: 64, vegetation: 22, fires: 680, insalubrity: 67, propsBenefit: 42, propsHarm: 28, approved: 34, rejected: 36 },
  { uf: "SE", name: "Sergipe", tempMax: 32, tempAvg: 26, pm25: 23, co2: 6, vegetation: 24, fires: 110, insalubrity: 45, propsBenefit: 8, propsHarm: 5, approved: 6, rejected: 7 },
  { uf: "TO", name: "Tocantins", tempMax: 35, tempAvg: 27, pm25: 38, co2: 12, vegetation: 48, fires: 2640, insalubrity: 65, propsBenefit: 10, propsHarm: 11, approved: 7, rejected: 14 },
];

export const MUNICIPALITIES: Record<string, { name: string; temp: number; pm25: number; vegetation: number; risk: number }[]> = {
  AM: [
    { name: "Manaus", temp: 33, pm25: 52, vegetation: 88, risk: 74 },
    { name: "Parintins", temp: 32, pm25: 38, vegetation: 92, risk: 58 },
    { name: "Itacoatiara", temp: 33, pm25: 44, vegetation: 91, risk: 62 },
    { name: "Manacapuru", temp: 33, pm25: 41, vegetation: 90, risk: 60 },
    { name: "Tefé", temp: 32, pm25: 36, vegetation: 94, risk: 55 },
    { name: "Tabatinga", temp: 31, pm25: 30, vegetation: 96, risk: 48 },
    { name: "Coari", temp: 33, pm25: 42, vegetation: 89, risk: 63 },
    { name: "Humaitá", temp: 34, pm25: 58, vegetation: 82, risk: 78 },
  ],
};

export const DEPUTIES: Record<string, { name: string; party: string; impact: "benéfico" | "maléfico"; proposals: number }[]> = {
  AM: [
    { name: "M. Andrade", party: "PSB", impact: "benéfico", proposals: 14 },
    { name: "R. Lima", party: "PL", impact: "maléfico", proposals: 11 },
    { name: "C. Souza", party: "REDE", impact: "benéfico", proposals: 9 },
    { name: "J. Vieira", party: "PP", impact: "maléfico", proposals: 7 },
  ],
};
