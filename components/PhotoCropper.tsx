"use client";
import { useEffect, useRef, useState } from "react";

const VIEW = 280; // size of the round preview, in screen pixels
const OUT = 320; // size of the saved photo, in pixels

// Lets someone drag their photo around and zoom in so their face sits in the
// middle of the circle, then hands back a square JPEG.
export default function PhotoCropper({
  file,
  onCancel,
  onDone,
}: {
  file: File;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);

  // Load the chosen file
  useEffect(() => {
    let cancelled = false; // ignore a load that finishes after we've moved on
    const u = URL.createObjectURL(file);
    setUrl(u);
    setError(false);
    const i = new Image();
    i.onload = () => {
      if (cancelled) return;
      setImg(i);
      const s = VIEW / Math.min(i.naturalWidth, i.naturalHeight);
      const w = i.naturalWidth * s;
      const h = i.naturalHeight * s;
      // Start centred across, and towards the top on tall photos - that's
      // usually where the face is.
      setPos({ x: (VIEW - w) / 2, y: h > VIEW ? (VIEW - h) * 0.2 : (VIEW - h) / 2 });
    };
    i.onerror = () => {
      if (!cancelled) setError(true);
    };
    i.src = u;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(u);
    };
  }, [file]);

  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const scale = base * zoom;
  const w = img ? img.naturalWidth * scale : VIEW;
  const h = img ? img.naturalHeight * scale : VIEW;

  // Keep the photo covering the whole circle
  const clamp = (p: { x: number; y: number }, ww = w, hh = h) => ({
    x: Math.min(0, Math.max(VIEW - ww, p.x)),
    y: Math.min(0, Math.max(VIEW - hh, p.y)),
  });

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, x: pos.x, y: pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos(clamp({ x: drag.current.x + e.clientX - drag.current.startX, y: drag.current.y + e.clientY - drag.current.startY }));
  }
  function onPointerUp() {
    drag.current = null;
  }

  // Zoom around the middle of the circle
  function changeZoom(next: number) {
    if (!img) return;
    const cx = (VIEW / 2 - pos.x) / scale;
    const cy = (VIEW / 2 - pos.y) / scale;
    const ns = base * next;
    const nw = img.naturalWidth * ns;
    const nh = img.naturalHeight * ns;
    setZoom(next);
    setPos(clamp({ x: VIEW / 2 - cx * ns, y: VIEW / 2 - cy * ns }, nw, nh));
  }

  function nudge(dx: number, dy: number) {
    setPos(clamp({ x: pos.x + dx, y: pos.y + dy }));
  }

  function save() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, -pos.x / scale, -pos.y / scale, VIEW / scale, VIEW / scale, 0, 0, OUT, OUT);
    onDone(canvas.toDataURL("image/jpeg", 0.88));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <h2 className="text-base font-semibold">Position your photo</h2>
        <p className="mt-0.5 text-xs text-gray-500">Drag to move it, and use the slider to zoom in.</p>

        {error ? (
          <p className="mt-4 rounded-lg bg-[#FFF5F8] p-4 text-sm text-[#BE0044]">That file couldn&apos;t be opened - try a JPG or PNG photo.</p>
        ) : (
          <div className="mt-4 flex justify-center">
            <div
              className="relative touch-none select-none overflow-hidden rounded-full bg-gray-100 ring-4 ring-yellow"
              style={{ width: VIEW, height: VIEW, cursor: drag.current ? "grabbing" : "grab" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 20 : 5;
                if (e.key === "ArrowLeft") nudge(step, 0);
                if (e.key === "ArrowRight") nudge(-step, 0);
                if (e.key === "ArrowUp") nudge(0, step);
                if (e.key === "ArrowDown") nudge(0, -step);
              }}
              tabIndex={0}
              aria-label="Photo preview - drag or use the arrow keys to move it"
            >
              {img && url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-0 top-0 max-w-none"
                  style={{ width: w, height: h, transform: `translate(${pos.x}px, ${pos.y}px)` }}
                />
              )}
            </div>
          </div>
        )}

        {!error && (
          <label className="mt-4 flex items-center gap-3 text-xs text-gray-500">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => changeZoom(Number(e.target.value))}
              className="flex-1 accent-black"
              aria-label="Zoom"
            />
          </label>
        )}

        <div className="mt-5 flex justify-end gap-2 text-sm">
          <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 hover:border-black">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={!img} className="rounded-md bg-navy px-4 py-2 font-semibold text-white disabled:opacity-40">
            Save photo
          </button>
        </div>
      </div>
    </div>
  );
}
