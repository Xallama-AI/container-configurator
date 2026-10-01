import { useEffect, useReducer, useRef, useState } from "react";
import Controls from "./Controls";
import Viewport, { ViewerHandle } from "./Viewport";
import FloorPlan from "./FloorPlan";
import { addLayoutItem, correctOverlaps, entryClearance, ItemKind, LayoutItem, nearestFreePlacement, presetLayout } from "./layout";
import {
  CameraFocus,
  CameraRequest,
  configReducer,
  DEFAULT_CONFIG,
  StudioConfig,
} from "./config";
import { isInteriorFocus } from "./camera";
import { preloadStudioAssets } from "./assets";
import "./studio.css";

const DESIGN_STORAGE_KEY = "grid-logic-studio-design-v4";

export default function Studio() {
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loading, setLoading] = useState({ ready: false, loaded: 0, total: 25, error: "" });
  useEffect(() => {
    let active = true;
    setLoading({ ready: false, loaded: 0, total: 25, error: "" });
    void preloadStudioAssets((loaded, total) => {
      if (active) setLoading((current) => ({ ...current, loaded, total }));
    }).then(() => {
      if (active) setLoading((current) => ({ ...current, ready: true }));
    }).catch(() => {
      if (active) setLoading((current) => ({ ...current, error: "Furniture or finish textures could not be loaded." }));
    });
    return () => { active = false; };
  }, [loadAttempt]);
  const [config, dispatch] = useReducer(configReducer, DEFAULT_CONFIG, (initial) => {
    try {
      const saved = JSON.parse(localStorage.getItem(DESIGN_STORAGE_KEY) || "null");
      return saved && (saved.size === 20 || saved.size === 40) && Array.isArray(saved.layout)
        ? { ...initial, ...saved, layout: correctOverlaps(saved.layout, saved.size === 20 ? 6.058 : 12.192, entryClearance(saved.doorStyle ?? initial.doorStyle, saved.doorSide ?? initial.doorSide, saved.size === 20 ? 6.058 : 12.192, 2.438 * (saved.containers === 2 ? 2 : 1)), 2.438 * (saved.containers === 2 ? 2 : 1)) }
        : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    const length = config.size === 20 ? 6.058 : 12.192;
    const width = 2.438 * config.containers;
    const corrected = correctOverlaps(config.layout, length, entryClearance(config.doorStyle, config.doorSide, length, width), width);
    if (corrected.some((item, index) => item.x !== config.layout[index].x || item.z !== config.layout[index].z || item.onTopOf !== config.layout[index].onTopOf)) dispatch({ layout: corrected });
  }, [config.layout, config.size, config.containers, config.doorStyle, config.doorSide]);
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
    if ((patch.size && patch.size !== config.size) || (patch.containers && patch.containers !== config.containers)) {
      const length = (patch.size ?? config.size) === 20 ? 6.058 : 12.192;
      const width = 2.438 * (patch.containers ?? config.containers);
      const shifted = config.layout.map((item) => item.kind === "bathroom" ? { ...item, x: -(length / 2 - 0.88) } : item);
      const kept: LayoutItem[] = [];
      const entry = entryClearance(config.doorStyle, config.doorSide, length, width);
      for (const item of shifted) {
        const placed = nearestFreePlacement(item, kept, length, entry, width);
        if (placed) kept.push(placed);
      }
      patch = { ...patch, layout: kept };
      setLayoutNotice(kept.length < config.layout.length ? "Some pieces could not fit the new shell." : "Layout adapted to the new container footprint.");
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
  const updateLayout = (layout: LayoutItem[]) => {
    const length = config.size === 20 ? 6.058 : 12.192, width = 2.438 * config.containers;
    dispatch({ layout: correctOverlaps(layout, length, entryClearance(config.doorStyle, config.doorSide, length, width), width) });
  };
  const preset = (name: "studio" | "work" | "stay" | "empty") => {
    updateLayout(presetLayout(name, config.size === 20 ? 6.058 : 12.192));
    setSelectedItemId(null);
    setMode("plan");
    setLayoutNotice(`${name === "empty" ? "Empty shell" : name === "studio" ? "Open studio" : name === "work" ? "Work office" : "Weekend stay"} layout loaded.`);
  };
  const add = (kind: ItemKind) => {
    const length = config.size === 20 ? 6.058 : 12.192;
    const width = 2.438 * config.containers;
    const next = addLayoutItem(config.layout, kind, length, entryClearance(config.doorStyle, config.doorSide, length, width), width);
    setMode("plan");
    if (next === config.layout) setLayoutNotice("No clear space for that item. Move or remove another piece first.");
    else { updateLayout(next); setSelectedItemId(next[next.length - 1].id); setLayoutNotice("Item added. Drag it to the position you want."); }
  };
  const viewLayout3D = () => {
    dispatch({ cutaway: true });
    setMode("3d");
    setRequest((previous) => ({ focus: "layout", sequence: previous.sequence + 1 }));
  };
  const toggleDoor = (door: "cargo" | "side" | "rear") => {
    const key = door === "cargo" ? "cargoOpen" : door === "side" ? "sideDoorOpen" : "rearRollupOpen";
    dispatch({ [key]: !config[key] });
  };
  if (!loading.ready) return (
    <main className="studio-boot" aria-label="Loading container configurator">
      <div className="studio-boot-card" role="status" aria-live="polite">
        <span className="studio-boot-eyebrow">XALLAMA / CONTAINER STUDIO</span>
        <h1>Preparing your<br/><em>studio.</em></h1>
        <p>{loading.error || `Loading furniture and finish textures · ${loading.loaded} of ${loading.total}`}</p>
        <div className="studio-boot-track" role="progressbar" aria-valuenow={loading.loaded} aria-valuemin={0} aria-valuemax={loading.total} aria-label="Furniture loading progress"><span style={{ width: `${loading.loaded / loading.total * 100}%` }}/></div>
        {loading.error && <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry loading</button>}
      </div>
    </main>
  );
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
            DESIGN_STORAGE_KEY,
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
      {mode === "plan" ? <FloorPlan config={config} selectedId={selectedItemId} onSelect={setSelectedItemId} onLayoutChange={updateLayout} onView3D={viewLayout3D}/> : <Viewport ref={viewer} config={config} request={request} selectedId={selectedItemId} onSelect={setSelectedItemId} onLayoutChange={updateLayout} onFocus={focus} onOpenPlan={() => setMode("plan")} onToggleDoor={toggleDoor}/>}
    </div>
  );
}
