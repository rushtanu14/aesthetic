import {
  Aperture,
  CubeFocus,
  Crosshair,
  Gauge,
  Radio,
  Spiral,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export type FieldRecording = {
  id: string;
  title: string;
  description: string;
  tone: string;
  telemetry: Record<ControlKey, string>;
  scene: {
    transform: string;
    filter: string;
    lightTransform: string;
    lightOpacity: string;
    fogTransform: string;
    fogOpacity: string;
  };
};

export type ControlKey = "aperture" | "focus" | "vector" | "signal";

export type Control = {
  key: ControlKey;
  label: string;
  icon: Icon;
};

export const recordings: FieldRecording[] = [
  {
    id: "obsidian-wake",
    title: "Obsidian Wake",
    description: "A black mass pulls haze upward as the camera drops below it.",
    tone: "Near field",
    telemetry: {
      aperture: "f/1.2",
      focus: "2.8m",
      vector: "cursor",
      signal: "47.2",
    },
    scene: {
      transform: "translate3d(0%, 0%, 0) scale(1)",
      filter: "contrast(1.08) saturate(0.82) brightness(1)",
      lightTransform: "translate3d(0rem, 0rem, 0) scale(1)",
      lightOpacity: "0.6",
      fogTransform: "translate3d(0rem, 0rem, 0)",
      fogOpacity: "0.78",
    },
  },
  {
    id: "mercury-gate",
    title: "Mercury Gate",
    description: "Reflective fragments pass the lens before folding into a ring.",
    tone: "Cold pass",
    telemetry: {
      aperture: "f/2.0",
      focus: "6.4m",
      vector: "orbital",
      signal: "62.8",
    },
    scene: {
      transform: "translate3d(-4%, -1%, 0) scale(1.08)",
      filter: "contrast(1.16) saturate(0.64) brightness(1.08)",
      lightTransform: "translate3d(-11rem, 1.5rem, 0) scale(1.24)",
      lightOpacity: "0.48",
      fogTransform: "translate3d(3rem, 1rem, 0)",
      fogOpacity: "0.62",
    },
  },
  {
    id: "afterimage",
    title: "Afterimage",
    description: "Light lingers in the fog, then collapses into a narrow scan.",
    tone: "Long burn",
    telemetry: {
      aperture: "f/0.95",
      focus: "1.6m",
      vector: "scanline",
      signal: "31.4",
    },
    scene: {
      transform: "translate3d(3%, -2%, 0) scale(1.14)",
      filter: "contrast(1.2) saturate(0.46) brightness(0.9)",
      lightTransform: "translate3d(-21rem, -2.5rem, 0) scale(0.82)",
      lightOpacity: "0.72",
      fogTransform: "translate3d(-4rem, -1rem, 0)",
      fogOpacity: "0.9",
    },
  },
];

export const controls: Control[] = [
  { key: "aperture", label: "Aperture", icon: Aperture },
  { key: "focus", label: "Focus", icon: CubeFocus },
  { key: "vector", label: "Vector", icon: Crosshair },
  { key: "signal", label: "Signal", icon: Radio },
];

export const phases = [
  { label: "Approach", icon: Spiral },
  { label: "Expose", icon: Gauge },
  { label: "Lock", icon: Crosshair },
];
