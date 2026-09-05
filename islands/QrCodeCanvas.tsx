import { useEffect, useRef } from "preact/hooks";

interface QrOptions {
  width: number;
  margin: number;
  color: { dark: string; light: string };
}

type QrModule = {
  toCanvas: (
    canvas: HTMLCanvasElement,
    text: string,
    options: QrOptions,
  ) => Promise<unknown>;
};

export interface QrCodeCanvasProps {
  value: string;
  size?: number;
}

export default function QrCodeCanvas({ value, size = 260 }: QrCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mounted = true;

    async function draw() {
      const mod = await import("qrcode") as unknown as { default: QrModule };
      if (cancelled || !mounted || !canvasRef.current) return;
      await mod.default.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    }

    draw().catch(() => undefined);
    return () => {
      cancelled = true;
      mounted = false;
    };
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      aria-label={`Kode QR presensi ${value}`}
      class="mx-auto rounded-lg bg-white p-2 shadow-sm"
    />
  );
}
