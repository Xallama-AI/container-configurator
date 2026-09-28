import { useReducer, useRef, useState } from "react";
import Controls from "./Controls";
import Viewport, { ViewerHandle } from "./Viewport";
import FloorPlan from "./FloorPlan";
import { addLayoutItem, canPlace, entryClearance, ItemKind, LayoutItem, presetLayout } from "./layout";
import {
  CameraFocus,
  CameraRequest,
  configReducer,
  DEFAULT_CONFIG,
  StudioConfig,
} from "./config";
import { isInteriorFocus } from "./camera";
import "./studio.css";

export default function Studio() {
  const [config, dispatch] = useReducer(configReducer, DEFAULT_CONFIG, (initial) => {
    try {
      const saved = JSON.parse(localStorage.getItem("grid-logic-studio-design") || "null");
      return saved && (saved.size === 20 || saved.size === 40) && Array.isArray(saved.layout)
        ? { ...initial, ...saved }
        : initial;
    } catch { return initial; }
  });
  const [mode, setMode] = useState<"plan" | "3d">("plan");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [layoutNotice, setLayoutNotice] = useState("Choose a template or add a piece, then drag it in the plan.");
  const [request, setRequest] = useState<CameraRequest>({
    focus: "exterior",
    sequence: 0,
  });
  const viewer = useRef<ViewerHandle>(null);
  const focus = (view: CameraFocus) => {
    setMode("3d");
    if (isInteriorFocus(view)) dispatch({ cargoOpen: true });
    setRequest((previous) => ({
      focus: view,
      sequence: previous.sequence + 1,
    }));
  };
  const change = (patch: Partial<StudioConfig>, view: CameraFocus) => {
    setMode("3d");
    if (patch.size && patch.size !== config.size) {
      const length = patch.size === 20 ? 6.058 : 12.192;
      const shifted = config.layout.map((item) => item.kind === "bathroom" ? { ...item, x: -(length / 2 - 0.88) } : item);
      const kept: LayoutItem[] = [];
      const entry = entryClearance(config.doorStyle, config.doorSide, length);
      for (const item of shifted) if (canPlace(item, kept, length, entry)) kept.push(item);
      patch = { ...patch, layout: kept };
      setLayoutNotice(kept.length < config.layout.length ? "Some pieces were removed because they did not fit the new size." : "Layout adapted to the new container length.");
    }
    dispatch({
      ...patch,
      ...(isInteriorFocus(view) ? { cargoOpen: true } : {}),
    });
    setRequest((previous) => ({
      focus: view,
      sequence: previous.sequence + 1,
    }));
  };
  const updateLayout = (layout: LayoutItem[]) => dispatch({ layout });
  const preset = (name: "studio" | "work" | "stay" | "empty") => {
    updateLayout(presetLayout(name, config.size === 20 ? 6.058 : 12.192));
    setSelectedItemId(null);
    setMode("plan");
    setLayoutNotice(`${name === "empty" ? "Empty shell" : name === "studio" ? "Open studio" : name === "work" ? "Work office" : "Weekend stay"} layout loaded.`);
  };
  const add = (kind: ItemKind) => {
    const length = config.size === 20 ? 6.058 : 12.192;
    const next = addLayoutItem(config.layout, kind, length, entryClearance(config.doorStyle, config.doorSide, length));
    setMode("plan");
    if (next === config.layout) setLayoutNotice("No clear space for that item. Move or remove another piece first.");
    else { updateLayout(next); setSelectedItemId(next[next.length - 1].id); setLayoutNotice("Item added. Drag it to the position you want."); }
  };
  const viewLayout3D = () => {
    dispatch({ cutaway: true });
    setMode("3d");
    setRequest((previous) => ({ focus: "layout", sequence: previous.sequence + 1 }));
  };
  return (
    <div className="container-studio">
      <Controls
        config={config}
        onChange={change}
        onFocus={focus}
        onOpenPlan={() => setMode("plan")}
        selectedItemId={selectedItemId}
        layoutNotice={layoutNotice}
        onLayoutPreset={preset}
        onAddLayoutItem={add}
        onSelectLayoutItem={(id) => { setSelectedItemId(id); setMode("plan"); }}
        onRemoveLayoutItem={(id) => { updateLayout(config.layout.filter((item) => item.id !== id)); if (selectedItemId === id) setSelectedItemId(null); }}
        onSave={() => {
          localStorage.setItem(
            "grid-logic-studio-design",
            JSON.stringify(config),
          );
          const blob = new Blob(
            [JSON.stringify({ version: 3, config }, null, 2)],
            { type: "application/json" },
          );
          const url = URL.createObjectURL(blob),
            link = document.createElement("a");
          link.href = url;
          link.download = "container-studio-design.json";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      />
      {mode === "plan" ? <FloorPlan config={config} selectedId={selectedItemId} onSelect={setSelectedItemId} onLayoutChange={updateLayout} onView3D={viewLayout3D}/> : <Viewport ref={viewer} config={config} request={request} onFocus={focus} onOpenPlan={() => setMode("plan")}/>}
    </div>
  );
}
