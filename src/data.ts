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
  title: string;
  description: string;
  tone: string;
};

export type Control = {
  label: string;
  value: string;
  icon: Icon;
};

export const recordings: FieldRecording[] = [
  {
    title: "Obsidian Wake",
    description: "A black mass pulls haze upward as the camera drops below it.",
    tone: "Near field",
  },
  {
    title: "Mercury Gate",
    description: "Reflective fragments pass the lens before folding into a ring.",
    tone: "Cold pass",
  },
  {
    title: "Afterimage",
    description: "Light lingers in the fog, then collapses into a narrow scan.",
    tone: "Long burn",
  },
];

export const controls: Control[] = [
  { label: "Aperture", value: "f/1.2", icon: Aperture },
  { label: "Focus", value: "2.8m", icon: CubeFocus },
  { label: "Vector", value: "cursor", icon: Crosshair },
  { label: "Signal", value: "47.2", icon: Radio },
];

export const phases = [
  { label: "Approach", icon: Spiral },
  { label: "Expose", icon: Gauge },
  { label: "Lock", icon: Crosshair },
];
