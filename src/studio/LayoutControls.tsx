import { Plus, Trash2 } from "lucide-react";
import { ITEM_CATALOG, LayoutItem, ItemKind, catalogItem } from "./layout";

interface Props {
  layout: LayoutItem[];
  selectedId: string | null;
  notice: string;
  onPreset: (preset: "studio" | "work" | "stay" | "empty") => void;
  onAdd: (kind: ItemKind) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function LayoutControls({ layout, selectedId, notice, onPreset, onAdd, onSelect, onRemove }: Props) {
  const presets = [
    ["studio", "Open studio", "Seating, kitchen and bathroom"],
    ["work", "Work office", "Desk, meeting area and bathroom"],
    ["stay", "Weekend stay", "Bed, kitchenette and bathroom"],
    ["empty", "Empty shell", "Start from the clear floor"],
  ] as const;
  return <div className="layout-controls">
    <p className="studio-label">Start with a practical layout</p>
    <div className="layout-presets">{presets.map(([id, name, description]) => <button key={id} type="button" onClick={() => onPreset(id)}><strong>{name}</strong><small>{description}</small></button>)}</div>
    <p className="studio-label">Add to the floor plan</p>
    <div className="layout-catalog">{ITEM_CATALOG.map(({ kind, label, width, depth, group }) => <button key={kind} type="button" onClick={() => onAdd(kind)}><span><strong>{label}</strong><small>{group} · {width.toFixed(2)} × {depth.toFixed(2)} m</small></span><Plus size={15}/></button>)}</div>
    <p className="layout-control-notice" role="status">{notice}</p>
    <p className="studio-label">Placed items · {layout.length}</p>
    <div className="layout-placed">{layout.length ? layout.map((item) => <div key={item.id} className={item.id === selectedId ? "selected" : ""}><button type="button" onClick={() => onSelect(item.id)}>{catalogItem(item.kind).label}<small>{item.x.toFixed(1)} m · {item.z.toFixed(1)} m</small></button><button type="button" aria-label={`Remove ${catalogItem(item.kind).label}`} onClick={() => onRemove(item.id)}><Trash2 size={14}/></button></div>) : <p>The floor is clear. Add a piece above.</p>}</div>
    <p className="studio-note">Drag freely over other pieces. On release, furniture settles into the nearest clear floor space. Arrow keys move by 10 cm; R rotates.</p>
  </div>;
}
