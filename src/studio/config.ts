import { LayoutItem, presetLayout } from "./layout";

export type Side = "left" | "right";
export type WindowStyle =
  | "none"
  | "small"
  | "medium"
  | "picture"
  | "horizontal"
  | "full-height"
  | "glass";
export type DoorStyle = "none" | "personnel" | "sliding" | "vinyl" | "roll-up";
export type WallFinish =
  | "steel"
  | "white-steel"
  | "white"
  | "concrete"
  | "wood"
  | "dark";
export type FloorFinish =
  | "light-oak"
  | "natural-oak"
  | "dark-walnut"
  | "warm-wood";
export type Category =
  | "container"
  | "layout"
  | "exterior"
  | "windows"
  | "doors"
  | "interior"
  | "flooring"
  | "walls"
  | "climate"
  | "accessories";
export type CameraFocus =
  | "exterior"
  | "layout"
  | "front"
  | "left"
  | "right"
  | "interior"
  | "floor"
  | "walls"
  | "indoor-ac"
  | "outdoor-ac"
  | "rear"
  | "window-left"
  | "window-right"
  | "door-left"
  | "door-right";
export interface StudioConfig {
  size: 20 | 40;
  highCube: boolean;
  color: string;
  windowStyle: WindowStyle;
  windowSide: Side | "both";
  doorStyle: DoorStyle;
  doorSide: Side;
  rearRollup: boolean;
  cargoOpen: boolean;
  cutaway: boolean;
  floor: FloorFinish;
  walls: WallFinish;
  ac: boolean;
  vents: boolean;
  steps: boolean;
  lights: boolean;
  layout: LayoutItem[];
}
export const DEFAULT_CONFIG: StudioConfig = {
  size: 20,
  highCube: true,
  color: "#373d42",
  windowStyle: "medium",
  windowSide: "left",
  doorStyle: "sliding",
  doorSide: "left",
  rearRollup: false,
  cargoOpen: false,
  cutaway: false,
  floor: "natural-oak",
  walls: "white",
  ac: false,
  vents: false,
  steps: true,
  lights: true,
  layout: presetLayout("studio", 6.058),
};
export const FINISHES = [
  ["Carbon black", "#1c2021"],
  ["Charcoal", "#373d42"],
  ["Anthracite", "#485158"],
  ["Pure white", "#eceeea"],
  ["Warm white", "#dad7cc"],
  ["Light grey", "#b5b8b4"],
  ["Slate grey", "#687276"],
  ["Marine blue", "#1a4155"],
  ["Forest green", "#354c3e"],
  ["Oxide red", "#8c4438"],
] as const;
export const WINDOWS: {
  id: WindowStyle;
  name: string;
  dimensions: string;
  w: number;
  h: number;
}[] = [
  {
    id: "none",
    name: "Unmodified wall",
    dimensions: "Original steel",
    w: 0,
    h: 0,
  },
  {
    id: "small",
    name: "Small window",
    dimensions: "2 × 2 ft",
    w: 0.61,
    h: 0.61,
  },
  {
    id: "medium",
    name: "Classic window",
    dimensions: "4 × 3 ft",
    w: 1.22,
    h: 0.914,
  },
  {
    id: "picture",
    name: "Picture window",
    dimensions: "6 × 4 ft",
    w: 1.83,
    h: 1.22,
  },
  {
    id: "horizontal",
    name: "Ribbon window",
    dimensions: "6 × 2 ft",
    w: 1.83,
    h: 0.61,
  },
  {
    id: "full-height",
    name: "Full-height window",
    dimensions: "3 × 7 ft",
    w: 0.914,
    h: 2.134,
  },
  {
    id: "glass",
    name: "Panoramic glazing",
    dimensions: "8 × 7 ft",
    w: 2.438,
    h: 2.134,
  },
];
export const FLOORS: { id: FloorFinish; name: string; note: string }[] = [
  { id: "light-oak", name: "Light oak", note: "Pale, matte timber" },
  { id: "natural-oak", name: "Natural oak", note: "Balanced grain & warmth" },
  { id: "dark-walnut", name: "Dark walnut", note: "Deep, warm boards" },
  {
    id: "warm-wood",
    name: "Warm reclaimed wood",
    note: "Subtle patina & character",
  },
];
export function dimensions(config: StudioConfig) {
  return {
    length: config.size === 20 ? 6.058 : 12.192,
    width: 2.438,
    height: config.highCube ? 2.896 : 2.591,
    base: 0.18,
    floor: 0.32,
  };
}
export function configReducer(
  config: StudioConfig,
  patch: Partial<StudioConfig>,
) {
  return { ...config, ...patch };
}
export interface CameraRequest {
  focus: CameraFocus;
  sequence: number;
}
