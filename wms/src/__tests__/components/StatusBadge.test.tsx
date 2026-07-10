import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
  it('renders with status text', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('pending')).toBeDefined();
  });

  it('renders with custom label', () => {
    render(<StatusBadge status="pending" label="Pendiente" />);
    expect(screen.getByText('Pendiente')).toBeDefined();
  });

  it('applies correct color class for pending', () => {
    const { container } = render(<StatusBadge status="pending" />);
    expect(container.firstChild).toHaveClass('bg-yellow-500/20');
  });

  it('applies correct color class for active', () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container.firstChild).toHaveClass('bg-green-500/20');
  });

  it('applies correct color class for cancelled', () => {
    const { container } = render(<StatusBadge status="cancelled" />);
    expect(container.firstChild).toHaveClass('bg-red-500/20');
  });

  it('replaces underscores with spaces', () => {
    render(<StatusBadge status="in_transit" />);
    expect(screen.getByText('in transit')).toBeDefined();
  });
});
