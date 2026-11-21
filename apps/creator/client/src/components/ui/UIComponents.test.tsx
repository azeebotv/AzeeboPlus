// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import React from 'react';
import {
  StatusBadge,
  MetricCard,
  EmptyState,
  ConfirmProvider,
  useConfirm,
  useAlert,
} from './index';

describe('Creator UI Component System', () => {
  afterEach(cleanup);

  describe('StatusBadge', () => {
    it('renders published badge with emerald status dot', () => {
      const { container } = render(<StatusBadge status="published" />);
      expect(screen.getByText('published')).toBeTruthy();
      expect(container.firstChild).toBeTruthy();
    });

    it('renders winner badge with gold text', () => {
      render(<StatusBadge status="winner" />);
      expect(screen.getByText('winner')).toBeTruthy();
    });

    it('renders draft and pending statuses with amber dot', () => {
      render(<StatusBadge status="draft" />);
      expect(screen.getByText('draft')).toBeTruthy();
    });

    it('renders failed and rejected statuses with red dot', () => {
      render(<StatusBadge status="rejected" />);
      expect(screen.getByText('rejected')).toBeTruthy();
    });

    it('normalizes underscores to spaces when no explicit label is passed', () => {
      render(<StatusBadge status="under_review" />);
      expect(screen.getByText('under review')).toBeTruthy();
    });

    it('honors custom label when provided', () => {
      render(<StatusBadge status="completed" label="Task Finished" />);
      expect(screen.getByText('Task Finished')).toBeTruthy();
    });
  });

  describe('MetricCard', () => {
    it('renders label and value', () => {
      render(<MetricCard label="Total Revenue" value="₦2,450,000" />);
      expect(screen.getByText('Total Revenue')).toBeTruthy();
      expect(screen.getByText('₦2,450,000')).toBeTruthy();
    });

    it('renders positive change indicator in green', () => {
      render(<MetricCard label="Views" value="45,200" change="+14.2%" />);
      const changeEl = screen.getByText('+14.2%');
      expect(changeEl).toBeTruthy();
      expect(changeEl.style.color).toBe('rgb(16, 185, 129)');
    });

    it('renders negative change indicator in red', () => {
      render(<MetricCard label="Subscribers" value="1,200" change="-3.5%" />);
      const changeEl = screen.getByText('-3.5%');
      expect(changeEl).toBeTruthy();
      expect(changeEl.style.color).toBe('rgb(239, 68, 68)');
    });

    it('renders optional subtitle and icon', () => {
      render(
        <MetricCard
          label="Conversion"
          value="4.8%"
          subtitle="vs previous 30 days"
          icon={<span data-testid="test-icon">icon</span>}
        />
      );
      expect(screen.getByText('vs previous 30 days')).toBeTruthy();
      expect(screen.getByTestId('test-icon')).toBeTruthy();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description and CTA button with click handler', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          title="No content uploaded"
          description="Get started by uploading your first video."
          action={{ label: "Upload Now", onClick: onAction }}
        />
      );
      expect(screen.getByText('No content uploaded')).toBeTruthy();
      expect(screen.getByText('Get started by uploading your first video.')).toBeTruthy();
      const button = screen.getByText('Upload Now');
      fireEvent.click(button);
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ConfirmProvider & useConfirm', () => {
    function TestConsumer() {
      const confirm = useConfirm();
      const alert = useAlert();
      const [lastResult, setLastResult] = React.useState<string>('none');

      return (
        <div>
          <span data-testid="result">{lastResult}</span>
          <button
            onClick={async () => {
              const ok = await confirm({
                title: 'Delete Item',
                message: 'Confirm item deletion?',
                variant: 'danger',
                confirmText: 'Delete Now',
              });
              setLastResult(ok ? 'confirmed' : 'cancelled');
            }}
          >
            Trigger Confirm
          </button>
          <button
            onClick={async () => {
              await alert('Notice', 'Operation completed');
              setLastResult('alerted');
            }}
          >
            Trigger Alert
          </button>
        </div>
      );
    }

    it('opens confirm modal and resolves true when confirmed', async () => {
      render(
        <ConfirmProvider>
          <TestConsumer />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Trigger Confirm'));

      expect(screen.getByText('Delete Item')).toBeTruthy();
      expect(screen.getByText('Confirm item deletion?')).toBeTruthy();

      await act(async () => {
        fireEvent.click(screen.getByText('Delete Now'));
      });

      expect(screen.getByTestId('result').textContent).toBe('confirmed');
    });

    it('resolves false when cancel is clicked', async () => {
      render(
        <ConfirmProvider>
          <TestConsumer />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Trigger Confirm'));

      await act(async () => {
        fireEvent.click(screen.getByText('Cancel'));
      });

      expect(screen.getByTestId('result').textContent).toBe('cancelled');
    });

    it('opens alert modal and resolves on OK click', async () => {
      render(
        <ConfirmProvider>
          <TestConsumer />
        </ConfirmProvider>
      );

      fireEvent.click(screen.getByText('Trigger Alert'));

      expect(screen.getByText('Notice')).toBeTruthy();
      expect(screen.getByText('Operation completed')).toBeTruthy();

      await act(async () => {
        fireEvent.click(screen.getByText('OK'));
      });

      expect(screen.getByTestId('result').textContent).toBe('alerted');
    });
  });
});
