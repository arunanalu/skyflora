import { PoliticsStateData } from '../../domain/entities/PoliticsStateData';

export const POLITICS_FILTERS = [
  { id: 'atividade',           label: 'Atividade',             emoji: '📜' },
  { id: 'por_deputado',        label: 'Por Deputado',          emoji: '🏛️' },
  { id: 'proporcao_positiva',  label: 'Proporção Positiva',    emoji: '🌿' },
] as const;

export type PoliticsFilter = (typeof POLITICS_FILTERS)[number]['id'];

// ─── Color scale ─────────────────────────────────────────────────────────────

export function getPoliticsAtividadeColor(propostasPositivas: number): string {
  if (propostasPositivas === 0) return '#374151';
  if (propostasPositivas <= 3)  return '#1e3a8a';
  if (propostasPositivas <= 10) return '#1d4ed8';
  if (propostasPositivas <= 30) return '#3b82f6';
  return '#60a5fa';
}

export function getPoliticsRateColor(rate: number): string {
  if (rate >= 0.70) return '#16a34a';
  if (rate >= 0.40) return '#ca8a04';
  if (rate >= 0.10) return '#ea580c';
  return '#991b1b';
}

export function getPoliticsStateColor(state: PoliticsStateData, filter: string): string {
  if (filter === 'por_deputado') {
    if (state.totalDeputados === 0) return '#374151';
    const perDeputy = state.propostasPositivas / state.totalDeputados;
    // max plausível ~60 (AM tem 126 prop / ~3 dep)
    return getPoliticsAtividadeColor(Math.round(perDeputy));
  }

  if (filter === 'proporcao_positiva') {
    const total = state.totalPropostas;
    if (total === 0) return '#374151';
    return getPoliticsRateColor(state.propostasPositivas / total);
  }

  // atividade (default) — volume absoluto de propostas positivas
  return getPoliticsAtividadeColor(state.propostasPositivas);
}

// ─── Formatted values ─────────────────────────────────────────────────────────

export function formatPoliticsRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits);
}

// ─── Summary text for modal ───────────────────────────────────────────────────

export function getPoliticsSummary(
  state: PoliticsStateData,
  filter: string,
): { title: string; description: string } {
  if (filter === 'por_deputado') {
    const perDeputy = state.totalDeputados > 0
      ? (state.propostasPositivas / state.totalDeputados).toFixed(1)
      : '0';
    return {
      title: 'Engajamento por Deputado',
      description: `Os ${state.totalDeputados} deputado${state.totalDeputados !== 1 ? 's' : ''} deste estado apresentaram em média ${perDeputy} proposta${parseFloat(perDeputy) !== 1 ? 's' : ''} benéfica${parseFloat(perDeputy) !== 1 ? 's' : ''} ao meio ambiente no período. Esse índice mostra o quanto cada representante contribui individualmente para a agenda socioambiental.`,
    };
  }

  if (filter === 'proporcao_positiva') {
    const pct = state.totalPropostas > 0
      ? formatPoliticsRate(state.propostasPositivas / state.totalPropostas)
      : 'N/D';
    return {
      title: 'Proporção de Propostas Positivas',
      description: `${pct} das ${state.totalPropostas} proposta${state.totalPropostas !== 1 ? 's' : ''} apresentada${state.totalPropostas !== 1 ? 's' : ''} por deputados deste estado foram classificadas como benéficas ao meio ambiente. Quanto maior essa proporção, mais a bancada prioriza pautas ambientais.`,
    };
  }

  // atividade (default)
  return {
    title: 'Atividade Legislativa Ambiental',
    description: `Deputados deste estado apresentaram ${state.propostasPositivas} proposta${state.propostasPositivas !== 1 ? 's' : ''} classificada${state.propostasPositivas !== 1 ? 's' : ''} como benéfica${state.propostasPositivas !== 1 ? 's' : ''} ao meio ambiente e à sociedade em ${state.periodoReferencia}. Quanto maior a atividade, mais presença do estado na agenda socioambiental.`,
  };
}
