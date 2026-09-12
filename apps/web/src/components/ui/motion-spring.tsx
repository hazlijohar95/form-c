import { useEffect, useRef, useState } from "react";

export interface SpringOptions {
  visualDuration?: number;
  bounce?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

type Opt = Partial<Pick<SpringOptions, "visualDuration" | "bounce" | "stiffness" | "damping" | "mass" | "velocity">>;

function sameOpt(a: Opt | undefined, b: Opt | undefined): boolean {
  return (
    a?.visualDuration === b?.visualDuration &&
    a?.bounce === b?.bounce &&
    a?.stiffness === b?.stiffness &&
    a?.damping === b?.damping &&
    a?.mass === b?.mass &&
    a?.velocity === b?.velocity
  );
}

function resolveParams(opt: Opt | undefined): { stiffness: number; damping: number } {
  if (opt?.stiffness !== undefined || opt?.damping !== undefined) {
    return { stiffness: opt.stiffness ?? 170, damping: opt.damping ?? 26 };
  }
  const duration = opt?.visualDuration ?? 0.35;
  const bounce = opt?.bounce ?? 0;
  const stiffness = Math.max(20, 260 / Math.max(duration, 0.05));
  const dampingRatio = Math.max(0.05, 1 - Math.min(Math.max(bounce, 0), 1) * 0.85);
  const damping = 2 * dampingRatio * Math.sqrt(stiffness);
  return { stiffness, damping };
}

/**
 * React port of opencode's `useSpring` (motion `attachSpring`).
 * No `motion` dependency here — integrates a damped spring on rAF.
 * Returns the current animated value. `snapKey` jumps without animating
 * when its identity changes (state boundaries).
 */
export function useSpring(target: () => number, options?: Opt | (() => Opt), snapKey?: () => unknown): number {
  const read = (): Opt | undefined => (typeof options === "function" ? options() : options);
  const [value, setValue] = useState(() => target());
  const state = useRef({ x: target(), v: options !== undefined ? (read()?.velocity ?? 0) : 0 });
  const targetRef = useRef(target());
  const optRef = useRef<Opt | undefined>(read());
  const snapRef = useRef<unknown>(snapKey?.());
  targetRef.current = target();

  if (options !== undefined) {
    const next = read();
    if (!sameOpt(optRef.current, next)) optRef.current = next;
  }

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const nextTarget = targetRef.current;
      if (snapKey !== undefined) {
        const nextSnap = snapKey();
        if (!Object.is(nextSnap, snapRef.current)) {
          snapRef.current = nextSnap;
          state.current = { x: nextTarget, v: 0 };
          setValue(nextTarget);
          raf = requestAnimationFrame(tick);
          return;
        }
      }

      const s = state.current;
      const { stiffness, damping } = resolveParams(optRef.current);
      const mass = optRef.current?.mass ?? 1;
      const accel = (-stiffness * (s.x - nextTarget) - damping * s.v) / mass;
      s.v += accel * dt;
      s.x += s.v * dt;
      if (Math.abs(s.x - nextTarget) < 0.0005 && Math.abs(s.v) < 0.0005) {
        if (s.x !== nextTarget) {
          s.x = nextTarget;
          s.v = 0;
          setValue(nextTarget);
        }
        raf = requestAnimationFrame(tick);
        return;
      }
      setValue(s.x);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}
