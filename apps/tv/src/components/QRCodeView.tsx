/**
 * Pure-view QR code renderer for React Native (no native modules, no SVG).
 *
 * `qrcode.create()` (browser build) produces the module matrix; we render it
 * as a flat grid of <View> cells. A payment URL yields a version-4/5 QR
 * (29–37 modules per side), so ~1,400 lightweight views — trivial for a TV.
 *
 * Scanning: payment-provider URLs (Paystack/Flutterwave checkout links) are
 * scanned with the phone camera, which decodes up to ~v10 at typical
 * distances — this stays far inside that envelope. Guard rails throw in dev
 * if the payload ever exceeds the scanner-friendly range.
 */
import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'qrcode';
import { colors } from '../theme';
// The `qrcode` type helper targets the Node entry (toFile/toCanvas); the
// browser build's `create` is a strict subset, so a narrow structural
// declaration keeps the browser-safe import honest without pulling the Node
// surface into the TV type graph.
type QRMatrix = {
  size: number;
  data: Uint8Array | number[];
};

interface QRCodeViewProps {
  value: string;
  /** Rendered size of the whole code in px. */
  size: number;
  /** Dark modules (brand foreground — the app's near-black). */
  color?: string;
  /** Light modules (the white plate the camera keys against). */
  backgroundColor?: string;
}

export function QRCodeView({
  value,
  size,
  color = colors.bg.primary,
  backgroundColor = colors.text.primary,
}: QRCodeViewProps) {
  const matrix = useMemo(() => {
    // `create` is synchronous and CPU-cheap at these payload sizes. The
    // module matrix lives on `qr.modules` ({ size, data }).
    const qr = (
      QRCode as unknown as {
        create: (text: string) => { modules: QRMatrix; version: number };
      }
    ).create(value);
    if (qr.modules.size > 45) {
      throw new Error(
        `QR payload too large (${qr.modules.size} modules) for reliable phone-camera scanning`
      );
    }
    return qr.modules;
  }, [value]);

  const cell = size / matrix.size;

  const cells: React.JSX.Element[] = [];
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      // Bit packing is row-major, LSB-first (per the qrcode lib's data layout).
      const isDark = (matrix.data[row * matrix.size + col] & 1) === 1;
      if (!isDark) continue; // skip light cells — the plate shows through
      cells.push(
        <View
          // Deterministic grid — row/col uniquely identify each cell.
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            left: col * cell,
            top: row * cell,
            width: cell,
            height: cell,
            backgroundColor: color,
          }}
        />
      );
    }
  }

  return (
    <View
      accessibilityLabel="Payment QR code"
      style={[styles.plate, { width: size, height: size, backgroundColor }]}
    >
      {cells}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    // 4-module quiet zone is built into qrcode.create's output margin; the
    // plate background doubles as the scanner's contrast surface.
    overflow: 'hidden',
  },
});
