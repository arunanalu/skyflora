import { ClimateData } from '../../domain/entities/ClimateData';

export type ClimateStatus = 'good' | 'attention' | 'high' | 'severe' | 'cold';
type ClimatePresentationRow = Partial<ClimateData>;

export function formatClimateNumber(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${suffix}`;
}

export function getTemperatureStatus(row: ClimatePresentationRow): ClimateStatus {
  const avg = row.temperature ?? 0;
  const max = row.temperatureMax ?? avg;
  const min = row.temperatureMin ?? avg;

  if (avg < 16 || min < 8) return 'cold';
  if (avg < 20) return 'attention';
  if (avg <= 26 && max <= 32 && min >= 12) return 'good';
  if (avg <= 28 && max <= 34) return 'attention';
  if (avg <= 30 && max <= 37) return 'high';
  return 'severe';
}

export function getAtmosphereStatus(row: ClimatePresentationRow): ClimateStatus {
  const pm25 = row.pm25Mean ?? 0;
  const pm10 = row.pm10Mean ?? 0;
  const co = row.carbonMonoxideMean ?? 0;

  if (pm25 > 35 || pm10 > 50 || co > 10000) return 'severe';
  if (pm25 > 25 || pm10 > 35 || co > 4000) return 'high';
  if (pm25 > 15 || pm10 > 20) return 'attention';
  return 'good';
}

export function getSoilStatus(row: ClimatePresentationRow): ClimateStatus {
  const waterLoss = row.vegetationWaterLossMean ?? 0;
  const waterStress = row.vegetationWaterStressMean ?? 0;
  const vegetation = row.vegetationCoverIndexMean ?? 0.5;
  const fireSpots = row.fireSpotsTotal ?? 0;

  if (fireSpots >= 1000 || waterStress >= 1.5 || vegetation < 0.1) return 'severe';
  if (fireSpots >= 300 || waterLoss >= 5 || waterStress >= 1.07 || vegetation < 0.3) return 'high';
  if (fireSpots > 0 || waterLoss >= 4 || waterStress >= 0.86 || vegetation < 0.4) return 'attention';
  return 'good';
}

export function getTemperatureColor(row: ClimatePresentationRow): string {
  const status = getTemperatureStatus(row);

  if (status === 'cold') return '#2563eb';
  if (status === 'good') return '#22c55e';
  if (status === 'attention') return (row.temperature ?? 0) < 20 ? '#38bdf8' : '#eab308';
  if (status === 'high') return '#f97316';
  return '#dc2626';
}

export function getAtmosphereColor(row: ClimatePresentationRow): string {
  const status = getAtmosphereStatus(row);

  if (status === 'good') return '#22c55e';
  if (status === 'attention') return '#eab308';
  if (status === 'high') return '#f97316';
  return '#dc2626';
}

export function getSoilColor(row: ClimatePresentationRow): string {
  const status = getSoilStatus(row);

  if (status === 'good') return '#22c55e';
  if (status === 'attention') return '#eab308';
  if (status === 'high') return '#f97316';
  return '#dc2626';
}

export function getClimateBarPercent(row: ClimatePresentationRow, filter: string): number {
  if (filter === 'atmosfera') {
    const status = getAtmosphereStatus(row);
    if (status === 'good') return 25;
    if (status === 'attention') return 50;
    if (status === 'high') return 75;
    return 100;
  }

  if (filter === 'solo') {
    const status = getSoilStatus(row);
    if (status === 'good') return 25;
    if (status === 'attention') return 50;
    if (status === 'high') return 75;
    return 100;
  }

  const max = row.temperatureMax ?? row.temperature ?? 0;
  return Math.min(100, Math.max(0, ((max - 10) / 30) * 100));
}

export function getClimateBarClass(row: ClimatePresentationRow, filter: string): string {
  const status = filter === 'atmosfera'
    ? getAtmosphereStatus(row)
    : filter === 'solo'
      ? getSoilStatus(row)
      : getTemperatureStatus(row);

  if (status === 'cold') return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]';
  if (status === 'good') return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
  if (status === 'attention') return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]';
  if (status === 'high') return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]';
  return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
}

export function getClimateSummary(row: ClimatePresentationRow, filter: string): { title: string; description: string } {
  if (filter === 'atmosfera') {
    const status = getAtmosphereStatus(row);
    const title = status === 'good'
      ? 'Ar em faixa saudavel'
      : status === 'attention'
        ? 'Ar com atencao respiratoria'
        : status === 'high'
          ? 'Ar com poluicao elevada'
          : 'Ar prejudicial a saude';

    return {
      title,
      description: 'Particulas finas entram fundo nos pulmoes; PM10 irrita vias respiratorias. Nuvens altas tambem reduzem a confiabilidade das leituras de vegetacao por satelite.',
    };
  }

  if (filter === 'solo') {
    const status = getSoilStatus(row);
    const title = status === 'good'
      ? 'Solo e vegetacao com menor pressao'
      : status === 'attention'
        ? 'Solo com sinais de atencao'
        : status === 'high'
          ? 'Secura e vegetacao sob pressao'
          : 'Risco ambiental severo';

    return {
      title,
      description: 'Perda de agua mostra quanto solo e plantas secam por dia. Estresse hidrico alto indica ar sugando agua da vegetacao; queimadas elevam risco e degradam o ar.',
    };
  }

  const status = getTemperatureStatus(row);
  const title = status === 'cold'
    ? 'Temperatura abaixo do conforto'
    : status === 'good'
      ? 'Temperatura em faixa confortavel'
      : status === 'attention'
        ? 'Temperatura pede atencao'
        : status === 'high'
          ? 'Calor alto para bem-estar'
          : 'Calor extremo ou maximas muito altas';

  return {
    title,
    description: 'A leitura considera media, maxima e minima. Medias amenas com extremos controlados tendem a ser mais confortaveis; maximas altas aumentam risco de estresse termico.',
  };
}
