import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { errorTextStyle } from '@/lib/ui';

/**
 * QR share modal for a challenge board: renders the board's public URL as a
 * scannable QR so creators can put it on slides, flyers, or a screen at an
 * event — no app install or login required on the scanning side.
 *
 * - The URL is the ABSOLUTE public board link (window.location.origin based),
 *   so scanning from any phone lands on /boards/:id (works logged-out).
 * - Actions: copy link, download PNG (canvas rendered at high res for print),
 *   and print via the browser's native dialog.
 * - QR is rendered to canvas locally (qrcode npm pkg, same one auth-service
 *   uses) — no external image API, nothing user-identifying leaves the app.
 */

const QR_SIZE = 512; // px at render time — crisp for print, downscaled in UI

export default function BoardQrModal({
  challengeId,
  challengeTitle,
  onClose,
}: {
  challengeId: string;
  challengeTitle?: string;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const boardUrl = useMemo(
    () => `${window.location.origin}/boards/${encodeURIComponent(challengeId)}`,
    [challengeId]
  );

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(boardUrl, {
      width: QR_SIZE,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1a0a0a', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrError('Could not generate the QR code');
      });
    return () => {
      cancelled = true;
    };
  }, [boardUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(boardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — user can still scan/download.
    }
  };

  const downloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `azeebo-board-${challengeId}.png`;
    a.click();
  };

  const printQr = () => {
    if (!dataUrl) return;
    const w = window.open('', '_blank', 'width=520,height=680');
    if (!w) return;
    // challengeTitle is creator-controlled; entity-escape every interpolation
    // (notably the <title> element) so a crafted title can't break out.
    const esc = (s: string) =>
      s.replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
      );
    const title = esc(challengeTitle ?? 'Challenge');
    const url = esc(boardUrl);
    w.document.write(
      `<!DOCTYPE html><html><head><title>${title} — board QR</title>` +
        `<style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;padding:40px;gap:12px}` +
        `img{width:420px;height:420px}h2{margin:0}p{color:#555;margin:0;font-size:14px}</style></head><body>` +
        `<h2>${esc(challengeTitle ?? 'Challenge board')}</h2>` +
        `<p>Scan to view the live leaderboard</p>` +
        `<img src="${dataUrl}" alt="Board QR" />` +
        `<p style="word-break:break-all">${url}</p>` +
        `</body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 380,
          maxWidth: '90%',
          backgroundColor: 'var(--creator-bg)',
          border: '1px solid var(--creator-border)',
          borderRadius: 16,
          padding: 24,
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Share board QR code"
      >
        <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 4px' }}>Share board QR</h3>
        <p style={{ fontSize: 12, color: 'var(--creator-text-muted)', margin: '0 0 16px' }}>
          Scan to view the live leaderboard — works without an account
        </p>

        <div
          style={{
            display: 'inline-block',
            padding: 12,
            borderRadius: 12,
            backgroundColor: '#ffffff',
            border: '1px solid var(--creator-border)',
          }}
        >
          {qrError ? (
            <p style={errorTextStyle()}>{qrError}</p>
          ) : dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code linking to ${boardUrl}`}
              width={240}
              height={240}
              style={{ display: 'block' }}
            />
          ) : (
            <div style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--creator-text-muted)', fontSize: 13 }}>Generating…</span>
            </div>
          )}
        </div>

        <p
          style={{
            fontSize: 11,
            color: 'var(--creator-text-muted)',
            margin: '10px 0 16px',
            wordBreak: 'break-all',
            lineHeight: 1.5,
          }}
        >
          {boardUrl}
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={copyLink}
            style={btnStyle}
            title="Copy the board link"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button onClick={downloadPng} disabled={!dataUrl} style={btnStyle} title="Download as PNG for flyers">
            Download PNG
          </button>
          <button onClick={printQr} disabled={!dataUrl} style={btnStyle} title="Print the QR code">
            Print
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={onClose} style={{ ...btnStyle, border: 'none', background: 'transparent', color: 'var(--creator-text-muted)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--creator-border)',
  background: 'transparent',
  color: 'var(--creator-text)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};
