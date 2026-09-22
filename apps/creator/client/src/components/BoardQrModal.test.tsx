// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import BoardQrModal from './BoardQrModal';

// The qrcode module's toDataURL is the QR contract: whatever URL goes in is
// what phones will resolve after scanning. Mock at the module boundary.
const toDataURL = vi.fn();
vi.mock('qrcode', () => ({
  default: { toDataURL: (...args: unknown[]) => toDataURL(...args) },
}));

describe('BoardQrModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toDataURL.mockResolvedValue('data:image/png;base64,FAKE');
  });
  afterEach(cleanup);

  it('generates the QR from the absolute public board URL', async () => {
    render(
      <BoardQrModal challengeId="ch-123" challengeTitle="Dance Marathon" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(toDataURL).toHaveBeenCalledTimes(1);
    });
    const [url, opts] = toDataURL.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe(`${window.location.origin}/boards/ch-123`);
    // Print-friendly: decent resolution, quiet zone, dark-on-light.
    expect(opts.width).toBeGreaterThanOrEqual(400);
    expect(opts.margin).toBeGreaterThanOrEqual(2);
    expect(opts.errorCorrectionLevel).toBe('M');
  });

  it('URL-encodes challenge ids with special characters', async () => {
    render(
      <BoardQrModal challengeId="ch space/amp" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(toDataURL).toHaveBeenCalled();
    });
    const [url] = toDataURL.mock.calls[0] as [string];
    expect(url).toBe(`${window.location.origin}/boards/ch%20space%2Famp`);
  });

  it('shows the board URL and action buttons once generated', async () => {
    render(
      <BoardQrModal challengeId="ch-1" challengeTitle="T" onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByAltText(/QR code linking to/)).toBeTruthy();
    });
    expect(screen.getByText(`${window.location.origin}/boards/ch-1`)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Print' })).toBeTruthy();
  });

  it('surfaces a friendly error when generation fails', async () => {
    toDataURL.mockRejectedValue(new Error('canvas unavailable'));

    render(<BoardQrModal challengeId="ch-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Could not generate the QR code')).toBeTruthy();
    });
    expect(screen.queryByAltText(/QR code linking to/)).toBeNull();
  });

  it('regenerates when the challenge changes (modal reused across boards)', async () => {
    const { rerender } = render(
      <BoardQrModal challengeId="ch-1" onClose={() => {}} />
    );
    await waitFor(() => expect(toDataURL).toHaveBeenCalledTimes(1));

    rerender(<BoardQrModal challengeId="ch-2" onClose={() => {}} />);
    await waitFor(() => expect(toDataURL).toHaveBeenCalledTimes(2));
    expect((toDataURL.mock.calls[1] as unknown[])[0]).toBe(
      `${window.location.origin}/boards/ch-2`
    );
  });
});
