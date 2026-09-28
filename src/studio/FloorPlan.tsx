import { useRef, useState, type PointerEvent } from "react";
import { ArrowDownToLine, Box, RotateCw, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { dimensions, StudioConfig, WINDOWS } from "./config";
import { blocksEntry, canPlace, catalogItem, entryClearance, footprint, LayoutItem, snap, windowPosition } from "./layout";

interface Props {
  config: StudioConfig;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayoutChange: (layout: LayoutItem[]) => void;
  onView3D: () => void;
}

const scale = 100;
const insetX = 76;
const insetY = 78;
const labels: Record<string, string> = {
  bathroom: "BATHROOM", kitchenette: "KITCHEN", partition: "DIVIDER",
  sofa: "SOFA", "coffee-table": "TABLE", "dining-table": "DINING",
  chair: "CHAIR", bed: "BED", desk: "DESK", storage: "STORAGE",
};

export default function FloorPlan({ config, selectedId, onSelect, onLayoutChange, onView3D }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; offsetX: number; offsetZ: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [notice, setNotice] = useState("Drag an item to reposition it. Select one for more options.");
  const { length: L, width: W } = dimensions(config);
  const entry = entryClearance(config.doorStyle, config.doorSide, L);
  const blockedEntry = entry && config.layout.some((item) => blocksEntry(item, L, entry));
  const viewWidth = (L + 1.52) * scale;
  const viewHeight = (W + 1.72) * scale;
  const selected = config.layout.find((item) => item.id === selectedId);
  const px = (x: number) => insetX + (x + L / 2) * scale;
  const py = (z: number) => insetY + (z + W / 2) * scale;

  function pointerWorld(event: PointerEvent<SVGGElement>) {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: (point.x - insetX) / scale - L / 2, z: (point.y - insetY) / scale - W / 2 };
  }
  function move(item: LayoutItem, x: number, z: number) {
    const next = { ...item, x: snap(x), z: snap(z) };
    if (canPlace(next, config.layout, L, entry)) {
      onLayoutChange(config.layout.map((entry) => entry.id === item.id ? next : entry));
      setNotice(`${catalogItem(item.kind).label} placed at ${next.x.toFixed(1)} m × ${next.z.toFixed(1)} m.`);
    } else setNotice("That position is outside the container or overlaps another item.");
  }
  function rotateSelected() {
    if (!selected || selected.kind === "bathroom" || selected.kind === "partition") return;
    const next: LayoutItem = { ...selected, rotation: selected.rotation === 0 ? 90 : 0 };
    if (canPlace(next, config.layout, L, entry)) onLayoutChange(config.layout.map((item) => item.id === selected.id ? next : item));
    else setNotice("Move this item into clear space before rotating it.");
  }
  function removeSelected() {
    if (!selected) return;
    onLayoutChange(config.layout.filter((item) => item.id !== selected.id));
    onSelect(null);
    setNotice("Item removed from the plan.");
  }
  function exportPlan() {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.size}ft-container-floor-plan.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const window = WINDOWS.find((option) => option.id === config.windowStyle)!;
  const windowX = windowPosition(L, config.layout);
  const windowW = Math.min(window.w, L * 0.32);
  const doorX = L * 0.27;
  const doorW = config.doorStyle === "personnel" ? 0.914 : Math.min(config.doorStyle === "vinyl" ? 2.438 : 1.83, L * 0.33);

  return <main className="floorplan-view" aria-label="Editable container floor plan">
    <div className="floorplan-toolbar">
      <div><span className="floorplan-eyebrow">YOUR CONTAINER / SPACE PLANNER</span><h2>Floor plan</h2><p>{(L - 0.2).toFixed(2)} × {(W - 0.15).toFixed(2)} m usable floor · {config.layout.length} placed {config.layout.length === 1 ? "item" : "items"}</p></div>
      <div className="floorplan-toolbar-actions"><button type="button" onClick={exportPlan} title="Download floor plan"><ArrowDownToLine size={16}/> <span>Export plan</span></button><button type="button" className="floorplan-3d-button" onClick={onView3D}><Box size={16}/> View in 3D</button></div>
    </div>
    {blockedEntry && <p className="floorplan-warning" role="alert">An item overlaps the entry clearance. Move it before finalizing the layout.</p>}
    <div className="floorplan-workspace">
      <div className="floorplan-paper" style={{ width: `${zoom * 100}%` }}>
        <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`Editable ${config.size} foot container floor plan`} onPointerDown={() => onSelect(null)}>
          <defs><pattern id="plan-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e4e9e4" strokeWidth="1"/></pattern></defs>
          <rect width={viewWidth} height={viewHeight} fill="#fafcf9"/>
          <line x1={insetX} x2={insetX + L * scale} y1={insetY - 30} y2={insetY - 30} stroke="#708176" strokeWidth="1"/>
          <path d={`M ${insetX} ${insetY - 38} v 16 M ${insetX + L * scale} ${insetY - 38} v 16`} stroke="#708176"/>
          <text x={insetX + L * scale / 2} y={insetY - 38} textAnchor="middle" fontSize="12" fill="#26382b" fontFamily="Arial">{L.toFixed(2)} m exterior</text>
          <line x1={insetX - 30} x2={insetX - 30} y1={insetY} y2={insetY + W * scale} stroke="#708176" strokeWidth="1"/>
          <path d={`M ${insetX - 38} ${insetY} h 16 M ${insetX - 38} ${insetY + W * scale} h 16`} stroke="#708176"/>
          <text x={insetX - 40} y={insetY + W * scale / 2} textAnchor="middle" transform={`rotate(-90 ${insetX - 40} ${insetY + W * scale / 2})`} fontSize="12" fill="#26382b" fontFamily="Arial">{W.toFixed(2)} m</text>
          <rect x={insetX} y={insetY} width={L * scale} height={W * scale} fill="white" stroke="#1d2921" strokeWidth="6"/>
          <rect x={insetX + 3} y={insetY + 3} width={L * scale - 6} height={W * scale - 6} fill="url(#plan-grid)"/>
          {entry && <g pointerEvents="none"><rect x={px(doorX - doorW / 2 - 0.05)} y={py(entry.side === "left" ? W / 2 - 0.76 : -W / 2)} width={(doorW + 0.1) * scale} height="76" fill="#eaf3e9" fillOpacity=".75" stroke="#9db99f" strokeDasharray="5 4"/><text x={px(doorX)} y={py(entry.side === "left" ? W / 2 - 0.38 : -W / 2 + 0.38)} textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#67816a">KEEP CLEAR</text></g>}
          {config.windowStyle !== "none" && (config.windowSide === "left" || config.windowSide === "both") && <g><line x1={px(windowX - windowW / 2)} x2={px(windowX + windowW / 2)} y1={py(W / 2)} y2={py(W / 2)} stroke="white" strokeWidth="9"/><line x1={px(windowX - windowW / 2)} x2={px(windowX + windowW / 2)} y1={py(W / 2)} y2={py(W / 2)} stroke="#8dbac1" strokeWidth="5"/></g>}
          {config.windowStyle !== "none" && (config.windowSide === "right" || config.windowSide === "both") && <g><line x1={px(-windowX - windowW / 2)} x2={px(-windowX + windowW / 2)} y1={py(-W / 2)} y2={py(-W / 2)} stroke="white" strokeWidth="9"/><line x1={px(-windowX - windowW / 2)} x2={px(-windowX + windowW / 2)} y1={py(-W / 2)} y2={py(-W / 2)} stroke="#8dbac1" strokeWidth="5"/></g>}
          {config.doorStyle !== "none" && <g><line x1={px(doorX - doorW / 2)} x2={px(doorX + doorW / 2)} y1={py(config.doorSide === "left" ? W / 2 : -W / 2)} y2={py(config.doorSide === "left" ? W / 2 : -W / 2)} stroke="white" strokeWidth="10"/><line x1={px(doorX - doorW / 2)} x2={px(doorX + doorW / 2)} y1={py(config.doorSide === "left" ? W / 2 : -W / 2)} y2={py(config.doorSide === "left" ? W / 2 : -W / 2)} stroke="#708d7d" strokeWidth="3" strokeDasharray={config.doorStyle === "roll-up" ? "5 4" : undefined}/></g>}
          {config.layout.map((item) => {
            const size = footprint(item);
            const x = px(item.x) - size.width * scale / 2, y = py(item.z) - size.depth * scale / 2;
            const chosen = item.id === selectedId;
            return <g key={item.id} role="button" tabIndex={0} aria-label={`${catalogItem(item.kind).label}, ${size.width.toFixed(2)} by ${size.depth.toFixed(2)} metres`} onFocus={() => onSelect(item.id)} onClick={() => onSelect(item.id)} onPointerDown={(event) => { event.stopPropagation(); onSelect(item.id); const point = pointerWorld(event); if (!point) return; drag.current = { id: item.id, offsetX: item.x - point.x, offsetZ: item.z - point.z }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (drag.current?.id !== item.id) return; const point = pointerWorld(event); if (point) move(item, point.x + drag.current.offsetX, point.z + drag.current.offsetZ); }} onPointerUp={(event) => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }} onKeyDown={(event) => { if (event.key.startsWith("Arrow")) { event.preventDefault(); const dx = event.key === "ArrowLeft" ? -0.1 : event.key === "ArrowRight" ? 0.1 : 0; const dz = event.key === "ArrowUp" ? -0.1 : event.key === "ArrowDown" ? 0.1 : 0; move(item, item.x + dx, item.z + dz); } else if (event.key === "Delete" || event.key === "Backspace") { onLayoutChange(config.layout.filter((entry) => entry.id !== item.id)); onSelect(null); } else if (event.key.toLowerCase() === "r") rotateSelected(); }}>
              <rect x={x} y={y} width={size.width * scale} height={size.depth * scale} rx={item.kind === "bathroom" || item.kind === "partition" ? 0 : 5} fill={item.kind === "bathroom" ? "#e7eee9" : item.kind === "kitchenette" ? "#e8e3d8" : "#f0efe9"} stroke={chosen ? "#1d5f46" : "#5e6f62"} strokeWidth={chosen ? 3 : 1.5}/>
              {item.kind === "bathroom" && <><line x1={item.x < 0 ? x + size.width * scale - 5 : x + 5} x2={item.x < 0 ? x + size.width * scale - 5 : x + 5} y1={y + 4} y2={y + size.depth * scale * .35} stroke="#31493a" strokeWidth="5"/><line x1={item.x < 0 ? x + size.width * scale - 5 : x + 5} x2={item.x < 0 ? x + size.width * scale - 5 : x + 5} y1={y + size.depth * scale * .7} y2={y + size.depth * scale - 4} stroke="#31493a" strokeWidth="5"/><rect x={x + 13} y={y + 12} width="55" height="65" rx="3" fill="#d5e8e9" stroke="#8aa7a6"/><ellipse cx={x + 54} cy={y + 148} rx="20" ry="28" fill="white" stroke="#98a8a0"/></>}
              {item.kind === "sofa" && <><rect x={x + 7} y={y + 6} width={size.width * scale - 14} height="20" rx="4" fill="#d3d7cf" stroke="#9da99b"/><line x1={x + size.width * scale / 2} x2={x + size.width * scale / 2} y1={y + 28} y2={y + size.depth * scale - 6} stroke="#abb7a9"/></>}
              {item.kind === "bed" && <><rect x={x + 8} y={y + 8} width={size.width * scale - 16} height={size.depth * scale - 16} rx="4" fill="#fff" stroke="#aab6aa"/><rect x={x + 14} y={y + 13} width="36" height="23" rx="4" fill="#eceee8"/></>}
              <text x={x + size.width * scale / 2} y={y + size.depth * scale / 2 + 4} textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize={size.width < .65 ? 8 : 10} letterSpacing=".7" fill="#23362a" pointerEvents="none">{labels[item.kind]}</text>
              {chosen && <circle cx={x + size.width * scale} cy={y + size.depth * scale} r="5" fill="#1d5f46"/>}
            </g>;
          })}
          <text x={insetX + L * scale - 7} y={insetY + W * scale + 23} textAnchor="end" fontFamily="Arial" fontSize="10" fill="#69786b">CARGO END →</text>
          <line x1={insetX + 4} x2={insetX + 104} y1={viewHeight - 25} y2={viewHeight - 25} stroke="#304c38" strokeWidth="2"/>
          <path d={`M ${insetX + 4} ${viewHeight - 31} v 12 M ${insetX + 104} ${viewHeight - 31} v 12`} stroke="#304c38"/>
          <text x={insetX + 54} y={viewHeight - 32} textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#304c38">1 m</text>
        </svg>
      </div>
    </div>
    {selected && <div className="floorplan-selection"><div><span>SELECTED ITEM</span><strong>{catalogItem(selected.kind).label}</strong><small>{footprint(selected).width.toFixed(2)} × {footprint(selected).depth.toFixed(2)} m</small></div><button type="button" onClick={rotateSelected} disabled={selected.kind === "bathroom" || selected.kind === "partition"} aria-label="Rotate selected item"><RotateCw size={17}/></button><button type="button" onClick={removeSelected} aria-label="Remove selected item"><Trash2 size={17}/></button></div>}
    <div className="floorplan-bottom"><p role="status">{notice}</p><div className="floorplan-zoom"><button type="button" onClick={() => setZoom((value) => Math.max(0.8, +(value - 0.2).toFixed(1)))} aria-label="Zoom out"><ZoomOut size={16}/></button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom((value) => Math.min(2, +(value + 0.2).toFixed(1)))} aria-label="Zoom in"><ZoomIn size={16}/></button></div></div>
  </main>;
}
