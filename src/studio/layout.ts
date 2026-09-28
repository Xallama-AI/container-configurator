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
export interface EntryClearance { side: "left" | "right"; width: number; }
export const entryClearance = (doorStyle: string, doorSide: "left" | "right", length: number): EntryClearance | undefined =>
  doorStyle === "none" ? undefined : {
    side: doorSide,
    width: doorStyle === "personnel" ? 0.914 : Math.min(doorStyle === "vinyl" ? 2.438 : 1.83, length * 0.33),
  };

export interface LayoutItem {
  id: string;
  kind: ItemKind;
  x: number;
  z: number;
  rotation: 0 | 90;
}

export const ITEM_CATALOG: { kind: ItemKind; label: string; width: number; depth: number; group: string }[] = [
  { kind: "bathroom", label: "Bathroom pod", width: 1.55, depth: 2.18, group: "Built-in" },
  { kind: "kitchenette", label: "Kitchenette", width: 1.55, depth: 0.56, group: "Built-in" },
  { kind: "partition", label: "Room divider", width: 0.09, depth: 2.12, group: "Built-in" },
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
  const { width, depth } = catalogItem(item.kind);
  return item.rotation === 90 ? { width: depth, depth: width } : { width, depth };
};
export const snap = (value: number) => Math.round(value * 10) / 10;
export const windowPosition = (length: number, layout: LayoutItem[]) =>
  length < 7 && layout.some((item) => item.kind === "bathroom" && item.x < 0)
    ? -0.45
    : -length * 0.26;

export function blocksEntry(item: LayoutItem, length: number, entry: EntryClearance) {
  const { width, depth } = footprint(item);
  const doorX = length * 0.27;
  const doorZ = entry.side === "left" ? 2.438 / 2 - 0.38 : -2.438 / 2 + 0.38;
  return Math.abs(item.x - doorX) < (width + entry.width + 0.1) / 2 &&
    Math.abs(item.z - doorZ) < (depth + 0.76) / 2;
}
export function canPlace(item: LayoutItem, others: LayoutItem[], length: number, entry?: EntryClearance) {
  const { width, depth } = footprint(item);
  const halfLength = length / 2 - 0.1;
  const halfWidth = 2.438 / 2 - 0.1;
  if (Math.abs(item.x) + width / 2 > halfLength + 0.001 || Math.abs(item.z) + depth / 2 > halfWidth + 0.001) return false;
  if (entry && blocksEntry(item, length, entry)) return false;
  return others.every((other) => {
    if (other.id === item.id) return true;
    const otherSize = footprint(other);
    return Math.abs(item.x - other.x) >= (width + otherSize.width) / 2 + 0.035 ||
      Math.abs(item.z - other.z) >= (depth + otherSize.depth) / 2 + 0.035;
  });
}

export function addLayoutItem(layout: LayoutItem[], kind: ItemKind, length: number, entry?: EntryClearance) {
  if (kind === "bathroom" && layout.some((item) => item.kind === "bathroom")) return layout;
  const item: LayoutItem = { id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, x: 0, z: 0, rotation: 0 };
  const { width, depth } = footprint(item);
  const xs = kind === "bathroom" ? [snap(-length / 2 + 0.2 + width / 2), snap(length / 2 - 0.2 - width / 2)] : Array.from({ length: Math.floor((length - width - 0.2) / 0.1) + 1 }, (_, index) => snap(-length / 2 + 0.1 + width / 2 + index * 0.1));
  const zs = kind === "bathroom" || kind === "partition" ? [0] : [0, -0.6, 0.6, -0.3, 0.3];
  for (const x of xs) for (const z of zs) {
    const candidate = { ...item, x: snap(x), z: snap(z) };
    if (canPlace(candidate, layout, length, entry)) return [...layout, candidate];
  }
  return layout;
}

export function presetLayout(preset: "studio" | "work" | "stay" | "empty", length: number): LayoutItem[] {
  if (preset === "empty") return [];
  const edge = -length / 2 + 0.88;
  const anchor = 0;
  const make = (kind: ItemKind, x: number, z: number, rotation: 0 | 90 = 0): LayoutItem => ({ id: `${preset}-${kind}-${x}-${z}`, kind, x: snap(x), z, rotation });
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
