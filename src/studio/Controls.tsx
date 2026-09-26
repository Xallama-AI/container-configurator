import {
  Check,
  ChevronDown,
  Box,
  Paintbrush,
  PanelsTopLeft,
  DoorOpen,
  Layers,
  Snowflake,
  SlidersHorizontal,
  Home,
  Wallpaper,
} from "lucide-react";
import {
  CameraFocus,
  Category,
  DEFAULT_CONFIG,
  DoorStyle,
  FINISHES,
  FLOORS,
  FloorFinish,
  Side,
  StudioConfig,
  WallFinish,
  WINDOWS,
  dimensions,
} from "./config";
import { useState } from "react";

const CATEGORIES: {
  id: Category;
  label: string;
  icon: typeof Box;
  focus: CameraFocus;
}[] = [
  { id: "container", label: "Container", icon: Box, focus: "exterior" },
  {
    id: "exterior",
    label: "Exterior finish",
    icon: Paintbrush,
    focus: "exterior",
  },
  { id: "windows", label: "Windows", icon: PanelsTopLeft, focus: "left" },
  { id: "doors", label: "Doors", icon: DoorOpen, focus: "left" },
  { id: "interior", label: "Interior", icon: Home, focus: "interior" },
  { id: "flooring", label: "Flooring", icon: Layers, focus: "floor" },
  { id: "walls", label: "Wall finish", icon: Wallpaper, focus: "walls" },
  { id: "climate", label: "Climate / AC", icon: Snowflake, focus: "indoor-ac" },
  {
    id: "accessories",
    label: "Accessories",
    icon: SlidersHorizontal,
    focus: "exterior",
  },
];
interface Props {
  config: StudioConfig;
  onChange: (patch: Partial<StudioConfig>, focus: CameraFocus) => void;
  onFocus: (focus: CameraFocus) => void;
  onSave: () => void;
}
export default function Controls({ config, onChange, onFocus, onSave }: Props) {
  const [open, setOpen] = useState<Category | null>("container");
  const [saved, setSaved] = useState(false);
  const dim = dimensions(config);
  const choice = (
    label: string,
    selected: boolean,
    action: () => void,
    note?: string,
  ) => (
    <button
      key={label}
      type="button"
      className={`studio-choice ${selected ? "selected" : ""}`}
      aria-pressed={selected}
      onClick={action}
    >
      <span>
        {label}
        {note && <small>{note}</small>}
      </span>
      {selected && <Check size={14} />}
    </button>
  );
  const toggle = (
    label: string,
    key:
      | "cargoOpen"
      | "cutaway"
      | "rearRollup"
      | "ac"
      | "vents"
      | "steps"
      | "lights",
    focus: CameraFocus,
    note?: string,
  ) => (
    <label className="studio-toggle">
      <span>
        {label}
        {note && <small>{note}</small>}
      </span>
      <input
        type="checkbox"
        checked={config[key]}
        onChange={(e) => onChange({ [key]: e.target.checked }, focus)}
      />
    </label>
  );
  const openingFocus = (
    kind: "window" | "door",
    side: Side | "both",
  ): CameraFocus => `${kind}-${side === "right" ? "right" : "left"}`;
  const sides = (key: "windowSide" | "doorSide") => (
    <div className="studio-segment" aria-label="Opening position">
      {(
        ["left", "right", ...(key === "windowSide" ? ["both"] : [])] as const
      ).map((side) =>
        choice(
          side === "both"
            ? "Both sides"
            : `${side[0].toUpperCase()}${side.slice(1)} side`,
          config[key] === side,
          () =>
            onChange(
              { [key]: side },
              openingFocus(
                key === "windowSide" ? "window" : "door",
                side as Side | "both",
              ),
            ),
        ),
      )}
    </div>
  );
  return (
    <aside className="studio-control-panel" aria-label="Studio configuration">
      <div className="studio-intro">
        <div className="studio-identity">
          <img
            className="studio-brand-logo"
            src="/logos/xallama-logo-black-transparent.png"
            alt="Xallama"
          />
          <span className="studio-kicker">CONTAINER STUDIO</span>
        </div>
        <h1>
          Container
          <br />
          <em>Studio.</em>
        </h1>
        <p>A steel shell. Your possibilities.</p>
      </div>
      <div className="studio-options">
        {CATEGORIES.map((category, index) => (
          <section key={category.id} className="studio-section">
            <button
              type="button"
              className="studio-section-heading"
              aria-expanded={open === category.id}
              onClick={() => {
                setOpen((previous) =>
                  previous === category.id ? null : category.id,
                );
                onFocus(
                  category.id === "windows"
                    ? openingFocus("window", config.windowSide)
                    : category.id === "doors"
                      ? openingFocus("door", config.doorSide)
                      : category.focus,
                );
              }}
            >
              <span className="studio-number">0{index + 1}</span>
              <category.icon size={17} />
              <strong>{category.label}</strong>
              <ChevronDown
                size={16}
                className={open === category.id ? "expanded" : ""}
              />
            </button>
            {open === category.id && (
              <div className="studio-section-body">
                {category.id === "container" && (
                  <>
                    <p className="studio-label">Choose your foundation</p>
                    <div className="studio-two">
                      {choice(
                        "20 foot",
                        config.size === 20,
                        () => onChange({ size: 20 }, "exterior"),
                        "6.06 m · versatile footprint",
                      )}
                      {choice(
                        "40 foot",
                        config.size === 40,
                        () => onChange({ size: 40 }, "exterior"),
                        "12.19 m · generous space",
                      )}
                    </div>
                    <p className="studio-label">Height</p>
                    <div className="studio-two">
                      {choice(
                        "Standard",
                        !config.highCube,
                        () => onChange({ highCube: false }, "exterior"),
                        "2.59 m exterior",
                      )}
                      {choice(
                        "High cube",
                        config.highCube,
                        () => onChange({ highCube: true }, "exterior"),
                        "2.90 m exterior",
                      )}
                    </div>
                    <div className="studio-specs">
                      <div>
                        <span>Length</span>
                        <b>{dim.length.toFixed(3)} m</b>
                      </div>
                      <div>
                        <span>Width</span>
                        <b>{dim.width.toFixed(3)} m</b>
                      </div>
                      <div>
                        <span>Height</span>
                        <b>{dim.height.toFixed(3)} m</b>
                      </div>
                    </div>
                    <p className="studio-note">
                      ISO container proportions. Modifications shown are a
                      design visualization, subject to structural review.
                    </p>
                  </>
                )}
                {category.id === "exterior" && (
                  <>
                    <p className="studio-label">Painted steel / satin finish</p>
                    <div className="studio-swatches">
                      {FINISHES.map(([name, color]) => (
                        <button
                          type="button"
                          className={config.color === color ? "selected" : ""}
                          aria-label={name}
                          aria-pressed={config.color === color}
                          key={color}
                          onClick={() => onChange({ color }, "exterior")}
                        >
                          <span style={{ background: color }}>
                            {config.color === color && (
                              <Check
                                size={18}
                                color={
                                  ["#eceeea", "#dad7cc", "#b5b8b4"].includes(
                                    color,
                                  )
                                    ? "#111"
                                    : "#fff"
                                }
                              />
                            )}
                          </span>
                          <small>{name}</small>
                        </button>
                      ))}
                    </div>
                    <p className="studio-note">
                      Subtle paint texture, steel reflections and corrugation
                      remain visible in every finish.
                    </p>
                  </>
                )}
                {category.id === "windows" && (
                  <>
                    <p className="studio-label">Position</p>
                    {sides("windowSide")}
                    <div className="studio-window-grid">
                      {WINDOWS.map((window) => (
                        <button
                          type="button"
                          className={`studio-window-option ${config.windowStyle === window.id ? "selected" : ""}`}
                          key={window.id}
                          aria-pressed={config.windowStyle === window.id}
                          onClick={() =>
                            onChange(
                              { windowStyle: window.id },
                              openingFocus("window", config.windowSide),
                            )
                          }
                        >
                          <div className={`window-drawing ${window.id}`}>
                            <span />
                          </div>
                          <strong>{window.name}</strong>
                          <small>{window.dimensions}</small>
                        </button>
                      ))}
                    </div>
                    <p className="studio-note">
                      Welded opening frames, insulated glass and recessed
                      interior reveals. Oversized options fit within the
                      selected shell.
                    </p>
                  </>
                )}
                {category.id === "doors" && (
                  <>
                    <p className="studio-label">Long-wall position</p>
                    {sides("doorSide")}
                    <div className="studio-door-list">
                      {(
                        [
                          ["none", "Original steel", "No added door"],
                          [
                            "personnel",
                            "Steel personnel door",
                            "36 in × 80 in",
                          ],
                          [
                            "sliding",
                            "Aluminium sliding glass",
                            "6 ft × 7 ft · black frame",
                          ],
                          [
                            "vinyl",
                            "Vinyl sliding glass",
                            "White frame · two panels",
                          ],
                          [
                            "roll-up",
                            "Roll-up shutter",
                            "Steel curtain, tracks & hood",
                          ],
                        ] as [DoorStyle, string, string][]
                      ).map(([id, name, note]) =>
                        choice(
                          name,
                          config.doorStyle === id,
                          () =>
                            onChange(
                              { doorStyle: id },
                              openingFocus("door", config.doorSide),
                            ),
                          note,
                        ),
                      )}
                    </div>
                    {toggle(
                      "Rear roll-up door",
                      "rearRollup",
                      "rear",
                      "An additional shutter in the end wall",
                    )}
                    {toggle(
                      "Open original cargo doors",
                      "cargoOpen",
                      "front",
                      "Twin doors with locking bars & hinges",
                    )}
                  </>
                )}
                {category.id === "interior" && (
                  <>
                    <p className="studio-label">Inspect the space</p>
                    <div className="studio-two">
                      {choice(
                        "Enter container",
                        false,
                        () => onFocus("interior"),
                        "Camera passes through open cargo doors",
                      )}
                      {choice(
                        "Return outside",
                        false,
                        () => onFocus("exterior"),
                        "Three-quarter exterior view",
                      )}
                    </div>
                    {toggle(
                      "Roof cutaway",
                      "cutaway",
                      "exterior",
                      "Remove the roof for an overview",
                    )}
                    {toggle("Open cargo doors", "cargoOpen", "front")}
                    {toggle("Interior downlights", "lights", "interior")}
                  </>
                )}
                {category.id === "flooring" && (
                  <>
                    <p className="studio-label">Real wood / PBR materials</p>
                    <div className="studio-texture-grid">
                      {FLOORS.map((floor) => (
                        <button
                          type="button"
                          className={
                            config.floor === floor.id ? "selected" : ""
                          }
                          aria-pressed={config.floor === floor.id}
                          key={floor.id}
                          onClick={() =>
                            onChange(
                              { floor: floor.id as FloorFinish },
                              "floor",
                            )
                          }
                        >
                          <img
                            src={`/container-configurator/textures/wood/${floor.id}/preview.webp`}
                            alt=""
                            loading="lazy"
                          />
                          <strong>{floor.name}</strong>
                          <small>{floor.note}</small>
                        </button>
                      ))}
                    </div>
                    <p className="studio-note">
                      Four separate CC0 scanned surfaces. The grain is mapped to
                      physical floor dimensions.
                    </p>
                  </>
                )}
                {category.id === "walls" && (
                  <>
                    <p className="studio-label">Interior lining</p>
                    <div className="studio-door-list">
                      {(
                        [
                          [
                            "steel",
                            "Original corrugated steel",
                            "Bare container structure",
                          ],
                          [
                            "white-steel",
                            "White painted steel",
                            "Original corrugation, lighter finish",
                          ],
                          [
                            "white",
                            "Smooth white lining",
                            "Insulated plasterboard",
                          ],
                          [
                            "concrete",
                            "Architectural concrete",
                            "Fine mineral surface",
                          ],
                          ["wood", "Natural timber lining", "Vertical panels"],
                          [
                            "dark",
                            "Dark interior panels",
                            "Deep charcoal, matte finish",
                          ],
                        ] as [WallFinish, string, string][]
                      ).map(([id, name, note]) =>
                        choice(
                          name,
                          config.walls === id,
                          () => onChange({ walls: id }, "walls"),
                          note,
                        ),
                      )}
                    </div>
                  </>
                )}
                {category.id === "climate" && (
                  <>
                    {toggle(
                      "Split air conditioning",
                      "ac",
                      "indoor-ac",
                      "Indoor head + matching outdoor condenser",
                    )}
                    <div className="studio-two">
                      {choice(
                        "Indoor unit",
                        false,
                        () => onFocus("indoor-ac"),
                        "High wall mounting",
                      )}
                      {choice(
                        "Outdoor condenser",
                        false,
                        () => onFocus("outdoor-ac"),
                        "Brackets & service connection",
                      )}
                    </div>
                    <p className="studio-note">
                      Both units align on the right wall, with the service line
                      between them. Equipment loads only when installed.
                    </p>
                  </>
                )}
                {category.id === "accessories" && (
                  <>
                    {toggle(
                      "Wall ventilation",
                      "vents",
                      "rear",
                      "Two louvered vents in the rear wall",
                    )}
                    {toggle(
                      "Entry steps",
                      "steps",
                      config.doorSide,
                      "Galvanized steel landing and tread",
                    )}
                    {toggle(
                      "Interior lighting",
                      "lights",
                      "interior",
                      "Warm recessed fixtures",
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
      <div className="studio-panel-footer">
        <div>
          <span>
            {config.size}′ {config.highCube ? "HIGH CUBE" : "STANDARD"}
          </span>
          <small>
            {config.windowStyle === "none"
              ? "Original shell"
              : "Custom openings"}{" "}
            / {config.ac ? "Climate ready" : "Steel architecture"}
          </small>
        </div>
        <button
          type="button"
          onClick={() => {
            onSave();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          {saved ? "Saved" : "Save design"} <Check size={14} />
        </button>
        <button
          type="button"
          className="studio-reset"
          aria-label="Reset design"
          onClick={() => onChange(DEFAULT_CONFIG, "exterior")}
        >
          Reset
        </button>
      </div>
    </aside>
  );
}
