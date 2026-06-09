import { beforeEach, describe, it, expect } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      category: 'hero',
      selectedStateId: null,
      climateDate: { month: 12, year: 2024 },
      politicsDate: { month: 12, year: 2024 },
      co2Date: { year: 2024 },
      climateFilter: 'temperatura',
      politicsFilter: 'prop_beneficas',
      co2Filter: 'media_emissao',
    });
  });

  it('deve ter valores iniciais corretos', () => {
    const state = useAppStore.getState();
    expect(state.climateDate).toEqual({ month: 12, year: 2024 });
    expect(state.politicsDate).toEqual({ month: 12, year: 2024 });
    expect(state.co2Date).toEqual({ year: 2024 });
    expect(state.category).toBe('hero');
    expect(state.selectedStateId).toBeNull();
  });

  it('deve atualizar a categoria corretamente', () => {
    const { setCategory } = useAppStore.getState();
    setCategory('politics');
    expect(useAppStore.getState().category).toBe('politics');
  });

  it('deve atualizar o estado selecionado', () => {
    const { setSelectedStateId } = useAppStore.getState();
    setSelectedStateId('SP');
    expect(useAppStore.getState().selectedStateId).toBe('SP');
  });
});
