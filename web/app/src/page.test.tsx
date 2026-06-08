import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Topbar } from './presentation/components/navigation/Topbar';
import HomePage from './app/page';

describe('Skyflora App Tests', () => {
  it('should render Topbar and have clickable buttons', () => {
    render(<Topbar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render HomePage with Explorar button', () => {
    // Mock the IntersectionObserver
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockImplementation(() => ({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null
    }));
    window.IntersectionObserver = mockIntersectionObserver;

    render(<HomePage />);
    const button = screen.getByText(/Explorar os dados/i);
    expect(button).toBeDefined();
    fireEvent.click(button);
  });
});
