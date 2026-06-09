import { render, screen } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Topbar } from './presentation/components/navigation/Topbar';
import { useAppStore } from './presentation/stores/useAppStore';
import HomePage from './app/page';

describe('Skyflora App Tests', () => {
  beforeEach(() => {
    useAppStore.setState({
      category: 'hero',
      selectedStateId: null,
      climateDate: { month: 12, year: 2024 },
      politicsDate: { month: 12, year: 2024 },
      co2Date: { year: 2024 },
      climateFilter: 'temperatura',
      politicsFilter: 'atividade',
      co2Filter: 'media_emissao',
    });

    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes('brazil-states.geojson') ? { features: [] } : [];

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
      } as Response);
    }));
  });

  it('should render Topbar and have clickable buttons', () => {
    render(<Topbar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render HomePage hero', () => {
    render(<HomePage />);
    expect(screen.getByText(/Skyflora conecta dados/i)).toBeInTheDocument();
  });
});
