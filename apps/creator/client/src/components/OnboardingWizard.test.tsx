// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingWizard } from './OnboardingWizard';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

function renderWizard(contentCount: number) {
  return render(
    <MemoryRouter>
      <OnboardingWizard contentCount={contentCount} />
    </MemoryRouter>
  );
}

describe('OnboardingWizard', () => {
  beforeEach(() => navigateMock.mockReset());
  afterEach(cleanup);

  it('renders when contentCount is 0', () => {
    renderWizard(0);
    expect(screen.getByText(/Welcome to your creator studio/)).toBeTruthy();
  });

  it('does not render when contentCount > 0', () => {
    const { container } = renderWizard(5);
    expect(container.textContent).toBe('');
  });

  it('shows all three onboarding steps', () => {
    renderWizard(0);
    expect(screen.getByText('Complete your creator profile')).toBeTruthy();
    expect(screen.getByText('Upload your first content')).toBeTruthy();
    expect(screen.getByText('Set up payout details')).toBeTruthy();
  });

  it('shows step numbers 1, 2, 3', () => {
    renderWizard(0);
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('navigates to /settings when profile step is clicked', () => {
    renderWizard(0);
    const profileBtn = screen.getByText('Complete your creator profile').closest('button');
    fireEvent.click(profileBtn!);
    expect(navigateMock).toHaveBeenCalledWith('/settings');
  });

  it('navigates to /upload when upload step is clicked', () => {
    renderWizard(0);
    const uploadBtn = screen.getByText('Upload your first content').closest('button');
    fireEvent.click(uploadBtn!);
    expect(navigateMock).toHaveBeenCalledWith('/upload');
  });

  it('dismisses when Dismiss button is clicked', () => {
    renderWizard(0);
    expect(screen.getByText(/Welcome to your creator studio/)).toBeTruthy();
    const dismissBtn = screen.getByText('Dismiss');
    fireEvent.click(dismissBtn);
    expect(screen.queryByText(/Welcome to your creator studio/)).toBeNull();
  });

  it('shows "Start →" links for each step', () => {
    renderWizard(0);
    const startLinks = screen.getAllByText('Start →');
    expect(startLinks).toHaveLength(3);
  });
});
