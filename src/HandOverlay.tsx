import { useEffect, useRef } from "react";
import { handState } from "./useHandTracking";

// Hand skeleton connections (MediaPipe hand model)
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export default function HandOverlay({
  videoRef,
  active,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const draw = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          const lm = handState.landmarks;
          if (lm.length > 0) {
            // Connections
            ctx.strokeStyle = handState.pinching
              ? "rgba(244,114,182,0.9)"
              : "rgba(129,140,248,0.85)";
            ctx.lineWidth = 3;
            CONNECTIONS.forEach(([a, b]) => {
              ctx.beginPath();
              ctx.moveTo(lm[a].x * w, lm[a].y * h);
              ctx.lineTo(lm[b].x * w, lm[b].y * h);
              ctx.stroke();
            });
            // Joints
            lm.forEach((p, i) => {
              const isTip = i === 4 || i === 8;
              ctx.beginPath();
              ctx.arc(p.x * w, p.y * h, isTip ? 6 : 3.5, 0, Math.PI * 2);
              ctx.fillStyle = isTip ? "#f472b6" : "#a5b4fc";
              ctx.fill();
            });
            // Pinch line thumb(4) <-> index(8)
            ctx.beginPath();
            ctx.moveTo(lm[4].x * w, lm[4].y * h);
            ctx.lineTo(lm[8].x * w, lm[8].y * h);
            ctx.strokeStyle = "rgba(255,255,255,0.6)";
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <div
      className={`absolute bottom-6 left-6 w-52 overflow-hidden rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md transition-all duration-300 ${
        active
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <div className="relative aspect-[4/3] w-full">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width={208}
          height={156}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-[10px]">
        <span className="flex items-center gap-1.5 text-white/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Hand tracking
        </span>
        <span className="font-mono text-white/50">pinch = zoom</span>
      </div>
    </div>
  );
}
