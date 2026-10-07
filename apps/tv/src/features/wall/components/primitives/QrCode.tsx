import qrcode from "qrcode-generator";
import React, { useMemo } from "react";
import { View } from "react-native";

import { color } from "@/theme/tokens";

export type QrCodeProps = {
  value: string;
  size: number;
  errorCorrection?: "L" | "M";
};

// Characters QR alphanumeric mode can encode (denser than byte mode).
const ALPHANUMERIC = /^[0-9A-Z $%*+\-./:]*$/;

/** QR rendered from plain Views: one row per module line, dark runs merged. */
export function QrCode({ value, size, errorCorrection = "M" }: QrCodeProps) {
  const rows = useMemo(() => {
    const qr = qrcode(0, errorCorrection);
    qr.addData(value, ALPHANUMERIC.test(value) ? "Alphanumeric" : "Byte");
    qr.make();
    const count = qr.getModuleCount();
    return Array.from({ length: count }, (_, row) => {
      const runs: { start: number; length: number }[] = [];
      for (let col = 0; col < count; col++) {
        if (!qr.isDark(row, col)) continue;
        const last = runs[runs.length - 1];
        if (last && last.start + last.length === col) last.length++;
        else runs.push({ start: col, length: 1 });
      }
      return { runs, count };
    });
  }, [errorCorrection, value]);

  const cell = size / (rows[0]?.count ?? 1);

  return (
    <View
      style={{ width: size, height: size, backgroundColor: color.paper }}
      accessibilityLabel={value}
    >
      {rows.map(({ runs }, row) =>
        runs.map(({ start, length }) => (
          <View
            key={`${row}-${start}`}
            style={{
              position: "absolute",
              top: row * cell,
              left: start * cell,
              width: length * cell + 0.5,
              height: cell + 0.5,
              backgroundColor: color.paperInk,
            }}
          />
        )),
      )}
    </View>
  );
}
