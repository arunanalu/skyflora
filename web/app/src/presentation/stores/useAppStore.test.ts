import { describe, it, expect } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  it('deve ter valores iniciais corretos', () => {
    const state = useAppStore.getState();
    expect(state.month).toBe(1);
    expect(state.year).toBe(2026);
    expect(state.category).toBe('climate');
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
