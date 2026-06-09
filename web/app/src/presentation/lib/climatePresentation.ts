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

  // Calibrado para o clima brasileiro (referência: dezembro 2024)
  // cold: noites abaixo de 10°C são frias no contexto tropical
  if (avg < 18 || min < 10) return 'cold';
  // good: média confortável + máximas não extremas + noite amena
  if (avg <= 27 && max <= 34 && min >= 12) return 'good';
  // attention: calor moderado ou máximas ainda controladas
  if (avg <= 28 && max <= 36) return 'attention';
  // high: máximas elevadas ou média acima do conforto
  if (avg <= 30 && max <= 38) return 'high';
  return 'severe';
}

export function getAtmosphereStatus(row: ClimatePresentationRow): ClimateStatus {
  const pm25 = row.pm25Mean ?? 0;
  const pm10 = row.pm10Mean ?? 0;
  const co = row.carbonMonoxideMean ?? 0;

  // Calibrado para médias estaduais brasileiras (referência: dezembro 2024)
  // PM2.5 range real: 5.6–15.8 μg/m³; PM10: 7.4–16.2; CO: 112–342 μg/m³
  // Thresholds baseados na distribuição do dataset, não em limites de crise aguda
  if (pm25 > 18 || pm10 > 25 || co > 280) return 'severe';
  if (pm25 > 12 || pm10 > 16 || co > 210) return 'high';
  if (pm25 > 8  || pm10 > 12 || co > 160) return 'attention';
  return 'good';
}

export function getSoilStatus(row: ClimatePresentationRow): ClimateStatus {
  const waterLoss = row.vegetationWaterLossMean ?? 0;
  const waterStress = row.vegetationWaterStressMean ?? 0;
  // Fallback conservador baseado na mediana real dos estados brasileiros
  const vegetation = row.vegetationCoverIndexMean ?? 0.28;
  const fireSpots = row.fireSpotsTotal ?? 0;

  // Thresholds calibrados para o clima tropical brasileiro (referência: dezembro 2024)
  // waterStress: clima tropical tem baseline ~1.3–1.8; acima de 3.0 é sertão/seco severo
  // waterLoss: evapotranspiração tropical normal é 3.5–5 mm/dia; acima de 6 é muito alto
  // vegetation: dados reais variam 0.18–0.38 no Brasil; abaixo de 0.20 indica degradação
  // fireSpots: acima de 1000 focos por estado é crítico
  if (fireSpots >= 1000 || waterStress >= 3.0 || waterLoss >= 6.0) return 'severe';
  if (fireSpots >= 300 || waterStress >= 2.5 || waterLoss >= 5.5 || vegetation < 0.20) return 'high';
  if (fireSpots >= 50 || waterStress >= 2.0 || waterLoss >= 5.0 || vegetation < 0.28) return 'attention';
  return 'good';
}

export function getTemperatureColor(row: ClimatePresentationRow): string {
  const status = getTemperatureStatus(row);

  if (status === 'cold') return '#2563eb';
  if (status === 'good') return '#22c55e';
  if (status === 'attention') return '#eab308';
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
