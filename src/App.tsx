import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import Galaxy, { defaultParams, type GalaxyParams } from "./Galaxy";
import CoreGlow from "./CoreGlow";
import Planets from "./Planets";
import CinematicCamera from "./CinematicCamera";
import HandCameraController from "./HandCameraController";
import HandOverlay from "./HandOverlay";
import { useHandTracking } from "./useHandTracking";

const PRESETS: { name: string; inside: string; outside: string }[] = [
  { name: "Amber Nebula", inside: "#ffb347", outside: "#4b6cff" },
  { name: "Rose Cluster", inside: "#ff6ec7", outside: "#7b2ff7" },
  { name: "Emerald Drift", inside: "#c6ff6e", outside: "#00b3ff" },
  { name: "Ice Spiral", inside: "#ffffff", outside: "#2b6cff" },
];

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-mono text-white/90">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="galaxy-slider w-full"
      />
    </div>
  );
}

export default function App() {
  const [params, setParams] = useState<GalaxyParams>(defaultParams);
  const [panelOpen, setPanelOpen] = useState(true);
  const [tumble, setTumble] = useState(true);
  const [cinematic, setCinematic] = useState(true);
  const [planetCount, setPlanetCount] = useState(8);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { status, error, start, stop } = useHandTracking(videoRef);
  const handActive = status === "running";

  const update = (patch: Partial<GalaxyParams>) =>
    setParams((p) => ({ ...p, ...patch }));

  const toggleHand = () => {
    if (handActive) {
      stop();
    } else {
      setCinematic(false);
      start();
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Canvas
        camera={{ position: [4, 4, 6], fov: 60 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#05030d"]} />
        <fog attach="fog" args={["#05030d", 14, 26]} />
        <Stars
          radius={80}
          depth={50}
          count={4000}
          factor={4}
          saturation={0}
          fade
          speed={0.6}
        />
        <ambientLight intensity={0.15} />
        <CoreGlow color={params.insideColor} />
        <Galaxy params={params} tumble={tumble} />
        <Planets count={planetCount} />
        <HandCameraController enabled={handActive} />
        <CinematicCamera enabled={cinematic && !handActive} />
        {!cinematic && !handActive && (
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            autoRotate
            autoRotateSpeed={0.35}
            minDistance={3}
            maxDistance={18}
          />
        )}
      </Canvas>

      <HandOverlay videoRef={videoRef} active={handActive} />

      {/* Hand tracking control */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
        {error && (
          <div className="max-w-[220px] rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-2 text-[11px] text-red-100 backdrop-blur-md">
            {error}
          </div>
        )}
        {/* {handActive && (
          <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-[11px] leading-relaxed text-white/70 backdrop-blur-md">
            ✋ Move hand to orbit · 🤏 pinch to zoom
          </div>
        )} */}
        <button
          onClick={toggleHand}
          disabled={status === "loading"}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition disabled:opacity-60 ${
            handActive
              ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-fuchsia-900/40"
              : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-indigo-900/40 hover:brightness-110"
          }`}
        >
          {status === "loading" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Starting camera…
            </>
          ) : handActive ? (
            <>✋ Stop hand control</>
          ) : (
            <>🖐️ Control with your hand</>
          )}
        </button>
      </div>

      {/* Title */}
      <div className="pointer-events-none absolute left-6 top-6 select-none">
        <h1 className="bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Spiral Galaxy
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {handActive
            ? "🖐️ Hand control active"
            : cinematic
            ? "Cinematic mode · auto camera"
            : "Drag to orbit · scroll to zoom"}{" "}
          · {params.count.toLocaleString()} stars · {planetCount} planets
        </p>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setPanelOpen((o) => !o)}
        className="absolute right-6 top-6 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition hover:bg-white/10"
      >
        {panelOpen ? "Hide controls" : "Show controls"}
      </button>

      {/* Control panel */}
      <div
        className={`absolute right-6 top-20 w-72 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all duration-300 ${
          panelOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-8 opacity-0"
        }`}
      >
        <h2 className="mb-4 text-sm font-semibold text-white/90">
          Galaxy Controls
        </h2>

        <div className="space-y-4">
          <Slider
            label="Stars"
            value={params.count}
            min={2000}
            max={200000}
            step={1000}
            onChange={(v) => update({ count: v })}
            format={(v) => v.toLocaleString()}
          />
          <Slider
            label="Radius"
            value={params.radius}
            min={2}
            max={12}
            step={0.1}
            onChange={(v) => update({ radius: v })}
            format={(v) => v.toFixed(1)}
          />
          <Slider
            label="Branches"
            value={params.branches}
            min={2}
            max={10}
            step={1}
            onChange={(v) => update({ branches: v })}
          />
          <Slider
            label="Spin"
            value={params.spin}
            min={-3}
            max={3}
            step={0.05}
            onChange={(v) => update({ spin: v })}
            format={(v) => v.toFixed(2)}
          />
          <Slider
            label="Randomness"
            value={params.randomness}
            min={0}
            max={1.2}
            step={0.01}
            onChange={(v) => update({ randomness: v })}
            format={(v) => v.toFixed(2)}
          />
          <Slider
            label="Star Size"
            value={params.size}
            min={0.005}
            max={0.05}
            step={0.001}
            onChange={(v) => update({ size: v })}
            format={(v) => v.toFixed(3)}
          />

          <button
            onClick={() => setTumble((t) => !t)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition ${
              tumble
                ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-100"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <span>Flip on X (both faces)</span>
            <span
              className={`relative h-4 w-8 rounded-full transition ${
                tumble ? "bg-indigo-400" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                  tumble ? "left-4" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <button
            onClick={() => {
              if (handActive) stop();
              setCinematic((c) => !c);
            }}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition ${
              cinematic
                ? "border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-100"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <span>Cinematic camera</span>
            <span
              className={`relative h-4 w-8 rounded-full transition ${
                cinematic ? "bg-fuchsia-400" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                  cinematic ? "left-4" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <Slider
            label="Planets"
            value={planetCount}
            min={0}
            max={16}
            step={1}
            onChange={(v) => setPlanetCount(v)}
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs text-white/60">Color presets</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() =>
                  update({
                    insideColor: preset.inside,
                    outsideColor: preset.outside,
                  })
                }
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left text-[11px] text-white/80 transition hover:bg-white/10"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${preset.inside}, ${preset.outside})`,
                  }}
                />
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white/70">
            Core
            <input
              type="color"
              value={params.insideColor}
              onChange={(e) => update({ insideColor: e.target.value })}
              className="h-5 w-5 cursor-pointer rounded border-none bg-transparent"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white/70">
            Edge
            <input
              type="color"
              value={params.outsideColor}
              onChange={(e) => update({ outsideColor: e.target.value })}
              className="h-5 w-5 cursor-pointer rounded border-none bg-transparent"
            />
          </label>
        </div>

        <button
          onClick={() => setParams(defaultParams)}
          className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
