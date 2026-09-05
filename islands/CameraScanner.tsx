import { useEffect, useRef, useState } from "preact/hooks";
import jsQRModule from "jsqr";

type QrFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: { inversionAttempts?: "dontInvert" },
) => { data?: string } | null;

const jsQR = jsQRModule as unknown as QrFn;

export interface CameraScannerProps {
  /** Arah kamera: depan (selfie) atau belakang (lingkungan). */
  facingMode?: "environment" | "user";
}

export default function CameraScanner({
  facingMode = "environment",
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const runningRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);

  function stopStream() {
    if (timerRef.current !== undefined) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    runningRef.current = false;
    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    streamRef.current = null;
    setScanning(false);
  }

  function submitCode(code: string) {
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/kehadiran";
    const action = document.createElement("input");
    action.type = "hidden";
    action.name = "action";
    action.value = "scan";
    const codeInput = document.createElement("input");
    codeInput.type = "hidden";
    codeInput.name = "code";
    codeInput.value = code;
    form.appendChild(action);
    form.appendChild(codeInput);
    document.body.appendChild(form);
    form.submit();
  }

  useEffect(() => {
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setStarting(true);
    setError(null);
    setDetected(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stopStream();
        throw new Error("Elemen video tidak tersedia");
      }
      video.srcObject = stream;
      video.setAttribute("playsinline", "");
      await video.play();

      runningRef.current = true;
      setScanning(true);
      timerRef.current = setInterval(() => {
        if (!runningRef.current) return;
        const code = detectFromVideo(video);
        if (code) {
          runningRef.current = false;
          stopStream();
          setDetected(code);
          submitCode(code);
        }
      }, 250);
    } catch {
      setError(
        "Kamera tidak dapat diakses (izin ditolak / tidak tersedia). Gunakan opsi masukkan kode manual di bawah.",
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <div>
      <div
        class="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface-muted"
        aria-live="polite"
      >
        <video ref={videoRef} class="h-full w-full object-cover" muted />
        {!scanning && (
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            {error
              ? <p class="text-xs text-status-sakit">{error}</p>
              : detected
              ? (
                <p class="text-sm font-semibold text-status-hadir">
                  Kode terdeteksi: {detected} — mencatat kehadiran…
                </p>
              )
              : (
                <p class="text-xs text-content-muted">
                  Arahkan kamera ke kode presensi yang ditampilkan guru
                </p>
              )}
          </div>
        )}
        {scanning && (
          <>
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div class="h-40 w-40 rounded-2xl border-4 border-primary/70" />
            </div>
            <p class="absolute inset-x-0 bottom-2 text-center text-xs font-medium text-white drop-shadow">
              Memindai kode…
            </p>
          </>
        )}
      </div>

      <div class="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={scanning ? stopStream : startCamera}
          disabled={starting}
          class="inline-flex flex-1 items-center justify-center rounded-md bg-role-murid px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-role-murid/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? "Mengaktifkan…" : scanning ? "Hentikan" : "Mulai kamera"}
        </button>
      </div>
    </div>
  );
}

function detectFromVideo(video: HTMLVideoElement): string | null {
  if (video.readyState < 2) return null;
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  const result = jsQR(image.data, width, height, {
    inversionAttempts: "dontInvert",
  });
  const data = result?.data?.trim();
  return data && data.length > 0 ? data : null;
}
