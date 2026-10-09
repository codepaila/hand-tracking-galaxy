import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export interface HandState {
  present: boolean;
  // Palm centre, normalised & mirrored to match what the user sees (0..1)
  x: number;
  y: number;
  // Pinch amount: 0 = fingers apart, 1 = fully pinched
  pinch: number;
  // Whether a pinch is currently held
  pinching: boolean;
  // Raw normalised landmarks for the overlay (mirrored)
  landmarks: { x: number; y: number }[];
}

export const handState: HandState = {
  present: false,
  x: 0.5,
  y: 0.5,
  pinch: 0,
  pinching: false,
  landmarks: [],
};

type Status = "idle" | "loading" | "running" | "error";

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const lastVideoTime = useRef(-1);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    const video = videoRef.current;
    if (video && video.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    handState.present = false;
    handState.pinching = false;
    handState.landmarks = [];
    setStatus("idle");
  }, [videoRef]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    setError(null);
    setStatus("loading");
    try {
      if (!landmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      const video = videoRef.current;
      if (!video) throw new Error("No video element");
      video.srcObject = stream;
      await video.play();

      runningRef.current = true;
      setStatus("running");

      const loop = () => {
        if (!runningRef.current) return;
        const v = videoRef.current;
        const lm = landmarkerRef.current;
        if (v && lm && v.readyState >= 2) {
          const now = performance.now();
          if (v.currentTime !== lastVideoTime.current) {
            lastVideoTime.current = v.currentTime;
            const res = lm.detectForVideo(v, now);
            if (res.landmarks && res.landmarks.length > 0) {
              const pts = res.landmarks[0];
              // Mirror x so it feels like a mirror
              const mirrored = pts.map((p) => ({ x: 1 - p.x, y: p.y }));
              const thumb = mirrored[4];
              const index = mirrored[8];
              const wrist = mirrored[0];
              const middleMcp = mirrored[9];

              // Palm centre between wrist and middle-finger base
              const cx = (wrist.x + middleMcp.x) / 2;
              const cy = (wrist.y + middleMcp.y) / 2;

              // Hand scale for normalising pinch distance
              const handSize = dist(wrist, middleMcp) || 0.15;
              const pinchDist = dist(thumb, index) / handSize;
              // Map: pinchDist ~0.2 (closed) .. ~1.4 (open)
              const pinch = 1 - Math.min(Math.max((pinchDist - 0.25) / 1.0, 0), 1);

              handState.present = true;
              handState.x = cx;
              handState.y = cy;
              handState.pinch = pinch;
              handState.pinching = pinch > 0.6;
              handState.landmarks = mirrored;
            } else {
              handState.present = false;
              handState.pinching = false;
              handState.landmarks = [];
            }
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Failed to start hand tracking"
      );
      setStatus("error");
      runningRef.current = false;
    }
  }, [videoRef]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { status, error, start, stop };
}
