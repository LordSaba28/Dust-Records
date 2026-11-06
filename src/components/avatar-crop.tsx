import { useEffect, useRef, useState } from "react";

const FRAME = 280;
const OUT = 800;

export function AvatarCrop({ file, onCrop }: { file: File; onCrop: (blob: Blob) => void }) {
  const [url, setUrl] = useState("");
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    setZoom(1);
    setPos({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(next);
  }, [file]);

  function metrics(z = zoom, offset = pos) {
    const base = natural.w && natural.h ? Math.max(FRAME / natural.w, FRAME / natural.h) : 1;
    const s = base * z;
    const w = natural.w * s;
    const h = natural.h * s;
    const maxX = Math.max(0, (w - FRAME) / 2);
    const maxY = Math.max(0, (h - FRAME) / 2);
    const x = Math.min(maxX, Math.max(-maxX, offset.x));
    const y = Math.min(maxY, Math.max(-maxY, offset.y));
    return { x, y, w, h, s };
  }

  useEffect(() => {
    const image = imageRef.current;
    if (!image || !natural.w) return;
    let cancel = false;
    const { x, y, w, h } = metrics();
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = OUT / FRAME;
    ctx.drawImage(image, x * ratio, y * ratio, w * ratio, h * ratio);
    canvas.toBlob((blob) => {
      if (!cancel && blob) onCrop(blob);
    }, "image/jpeg", 0.9);
    return () => {
      cancel = true;
    };
    // metrics() reads zoom, pos, and natural
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, natural, zoom, pos, onCrop]);

  const view = metrics();

  return (
    <div>
      <div
        className="relative mx-auto overflow-hidden rounded-card border border-line bg-bg"
        style={{ width: FRAME, height: FRAME, touchAction: "none" }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const next = metrics(zoom, {
            x: drag.current.x + (e.clientX - drag.current.px),
            y: drag.current.y + (e.clientY - drag.current.py),
          });
          setPos({ x: next.x, y: next.y });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        {url && (
          <img
            ref={imageRef}
            src={url}
            alt=""
            draggable={false}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="absolute max-w-none select-none"
            style={{ width: view.w, height: view.h, left: (FRAME - view.w) / 2 + view.x, top: (FRAME - view.h) / 2 + view.y }}
          />
        )}
      </div>
      <label className="mt-4 block text-sm">
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          aria-label="Zoom photo"
          onChange={(e) => {
            const z = Number(e.target.value);
            const next = metrics(z, pos);
            setZoom(z);
            setPos({ x: next.x, y: next.y });
          }}
          className="seek mt-2 h-8 w-full"
        />
      </label>
      <p className="mt-2 text-sm text-muted">Drag the photo to choose the part that shows. The square is what the roster uses.</p>
    </div>
  );
}
