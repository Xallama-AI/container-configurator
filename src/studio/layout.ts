export type ItemKind =
  | "bathroom"
  | "kitchenette"
  | "sofa"
  | "coffee-table"
  | "dining-table"
  | "chair"
  | "bed"
  | "desk"
  | "storage"
  | "partition";
export interface EntryClearance { side: "left" | "right"; width: number; containerWidth: number; }
export const entryClearance = (doorStyle: string, doorSide: "left" | "right", length: number, containerWidth = 2.438): EntryClearance | undefined =>
  doorStyle === "none" ? undefined : {
    side: doorSide,
    width: doorStyle === "personnel" ? 0.914 : Math.min(doorStyle === "vinyl" ? 2.438 : 1.83, length * 0.33),
    containerWidth,
  };

export interface LayoutItem {
  id: string;
  kind: ItemKind;
  x: number;
  z: number;
  rotation: 0 | 90 | 180 | 270;
  wallLength?: number;
  onTopOf?: string;
}

export const ITEM_CATALOG: { kind: ItemKind; label: string; width: number; depth: number; group: string }[] = [
  { kind: "bathroom", label: "Bathroom pod", width: 1.55, depth: 2.18, group: "Built-in" },
  { kind: "kitchenette", label: "Kitchenette", width: 1.55, depth: 0.56, group: "Built-in" },
  { kind: "partition", label: "Interior wall", width: 0.09, depth: 2.12, group: "Built-in" },
  { kind: "sofa", label: "Compact sofa", width: 1.62, depth: 0.78, group: "Furniture" },
  { kind: "coffee-table", label: "Coffee table", width: 0.72, depth: 0.48, group: "Furniture" },
  { kind: "dining-table", label: "Dining table", width: 1.05, depth: 0.68, group: "Furniture" },
  { kind: "chair", label: "Chair", width: 0.52, depth: 0.52, group: "Furniture" },
  { kind: "bed", label: "Double bed", width: 1.9, depth: 1.38, group: "Furniture" },
  { kind: "desk", label: "Work desk", width: 1.2, depth: 0.58, group: "Furniture" },
  { kind: "storage", label: "Storage cabinet", width: 0.95, depth: 0.45, group: "Furniture" },
];

export const catalogItem = (kind: ItemKind) => ITEM_CATALOG.find((item) => item.kind === kind)!;
export const footprint = (item: LayoutItem) => {
  const { width, depth: catalogDepth } = catalogItem(item.kind);
  const depth = item.kind === "partition" ? Math.max(0.8, item.wallLength ?? catalogDepth) : catalogDepth;
  return item.rotation % 180 === 90 ? { width: depth, depth: width } : { width, depth };
};
export const snap = (value: number) => Math.round(value * 10) / 10;
const overlaps = (item: LayoutItem, other: LayoutItem, gap = 0.035) => {
  const a = footprint(item), b = footprint(other);
  return Math.abs(item.x - other.x) < (a.width + b.width) / 2 + gap &&
    Math.abs(item.z - other.z) < (a.depth + b.depth) / 2 + gap;
};
export function resolvePlacement(item: LayoutItem, others: LayoutItem[], length: number, entry?: EntryClearance, containerWidth = 2.438): LayoutItem | null {
  const candidate = { ...item, onTopOf: undefined };
  const { width, depth } = footprint(candidate);
  if (Math.abs(candidate.x) + width / 2 > length / 2 - 0.099 || Math.abs(candidate.z) + depth / 2 > containerWidth / 2 - 0.099) return null;
  if (entry && blocksEntry(candidate, length, entry)) return null;
  if (others.some((other) => other.id !== candidate.id && overlaps(candidate, other))) return null;
  return candidate;
}
export function nearestFreePlacement(item: LayoutItem, others: LayoutItem[], length: number, entry?: EntryClearance, containerWidth = 2.438): LayoutItem | null {
  const wanted = { ...item, x: snap(item.x), z: snap(item.z), onTopOf: undefined };
  const exact = resolvePlacement(wanted, others, length, entry, containerWidth);
  if (exact) return exact;
  const size = footprint(wanted);
  const maxX = Math.floor((length / 2 - 0.1 - size.width / 2) * 10);
  const maxZ = Math.floor((containerWidth / 2 - 0.1 - size.depth / 2) * 10);
  const positions: { x: number; z: number; distance: number }[] = [];
  for (let ix = -maxX; ix <= maxX; ix++) for (let iz = -maxZ; iz <= maxZ; iz++) {
    const x = ix / 10, z = iz / 10;
    positions.push({ x, z, distance: (x - wanted.x) ** 2 + (z - wanted.z) ** 2 });
  }
  positions.sort((a, b) => a.distance - b.distance);
  for (const position of positions) {
    const placed = resolvePlacement({ ...wanted, x: position.x, z: position.z }, others, length, entry, containerWidth);
    if (placed) return placed;
  }
  return null;
}
export function correctOverlaps(layout: LayoutItem[], length: number, entry?: EntryClearance, containerWidth = 2.438) {
  const corrected: LayoutItem[] = [];
  for (const item of layout) {
    const placed = resolvePlacement(item, corrected, length, entry, containerWidth) ?? nearestFreePlacement(item, corrected, length, entry, containerWidth);
    corrected.push(placed ?? { ...item, onTopOf: undefined });
  }
  return corrected;
}
export const windowPosition = (length: number, layout: LayoutItem[]) =>
  length < 7 && layout.some((item) => item.kind === "bathroom" && item.x < 0)
    ? -0.45
    : -length * 0.26;

export function blocksEntry(item: LayoutItem, length: number, entry: EntryClearance) {
  const { width, depth } = footprint(item);
  const doorX = length * 0.27;
  const doorZ = entry.side === "left" ? entry.containerWidth / 2 - 0.38 : -entry.containerWidth / 2 + 0.38;
  return Math.abs(item.x - doorX) < (width + entry.width + 0.1) / 2 &&
    Math.abs(item.z - doorZ) < (depth + 0.76) / 2;
}
export function canPlace(item: LayoutItem, others: LayoutItem[], length: number, entry?: EntryClearance, containerWidth = 2.438) {
  return resolvePlacement(item, others, length, entry, containerWidth) !== null;
}

export function addLayoutItem(layout: LayoutItem[], kind: ItemKind, length: number, entry?: EntryClearance, containerWidth = 2.438) {
  if (kind === "bathroom" && layout.some((item) => item.kind === "bathroom")) return layout;
  const item: LayoutItem = { id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, x: 0, z: 0, rotation: 0, ...(kind === "partition" ? { wallLength: 2.12 } : {}) };
  const { width, depth } = footprint(item);
  const xs = kind === "bathroom" ? [snap(-length / 2 + 0.2 + width / 2), snap(length / 2 - 0.2 - width / 2)] : kind === "partition" ? Array.from({ length: Math.floor((length - width - 0.2) / 0.1) + 1 }, (_, index) => snap(-length / 2 + 0.1 + width / 2 + index * 0.1)).sort((a, b) => Math.abs(a) - Math.abs(b)) : Array.from({ length: Math.floor((length - width - 0.2) / 0.1) + 1 }, (_, index) => snap(-length / 2 + 0.1 + width / 2 + index * 0.1));
  const zs = kind === "bathroom" ? [0] : kind === "partition" ? [0, -0.6, 0.6, -1.2, 1.2] : [0, -0.6, 0.6, -0.3, 0.3, ...(containerWidth > 2.438 ? [-1.5, 1.5] : [])];
  for (const x of xs) for (const z of zs) {
    const candidate = { ...item, x: snap(x), z: snap(z) };
    const placed = resolvePlacement(candidate, layout, length, entry, containerWidth);
    if (placed) return [...layout, placed];
  }
  return layout;
}

export function presetLayout(preset: "studio" | "work" | "stay" | "empty", length: number): LayoutItem[] {
  if (preset === "empty") return [];
  const edge = -length / 2 + 0.88;
  const anchor = 0;
  const make = (kind: ItemKind, x: number, z: number, rotation: LayoutItem["rotation"] = 0): LayoutItem => ({ id: `${preset}-${kind}-${x}-${z}`, kind, x: snap(x), z, rotation });
  const bathroom = make("bathroom", edge, 0);
  if (preset === "work") return [
    bathroom,
    make("storage", edge + 1.45, -0.82),
    make("desk", anchor + 0.6, -0.75),
    make("chair", anchor + 0.5, 0.15),
    make("dining-table", anchor + 1.85, -0.5),
  ];
  if (preset === "stay") return [
    bathroom,
    make("kitchenette", edge + 1.73, -0.82),
    make("bed", anchor + 1.5, -0.42),
    make("storage", anchor - 0.55, 0.82),
  ];
  return [
    bathroom,
    make("kitchenette", edge + 1.9, -0.82),
    make("coffee-table", anchor + 0.25, 0.3),
    make("sofa", anchor + 1.75, -0.65),
  ];
}
