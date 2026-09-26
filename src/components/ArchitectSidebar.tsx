import { useEffect, useState } from 'react';
import { Box, ChevronDown, Layers3, Map, Menu, RotateCcw, Save, Ruler, Sun, SwatchBook, X } from 'lucide-react';
import { ContainerModelConfig, SitePlanningConfig, ViewMode } from '../types';
import { PRESET_MODELS, FACADE_MATERIALS, FLOORING_OPTIONS } from '../data/presets';

type Section = 'model' | 'materials' | 'site' | 'view';

interface Props {
  model: ContainerModelConfig;
  site: SitePlanningConfig;
  viewMode: ViewMode;
  estimatedCost: number;
  onUpdateModel: (config: Partial<ContainerModelConfig>) => void;
  onUpdateSite: (config: Partial<SitePlanningConfig>) => void;
  onSelectPreset: (id: string) => void;
  onViewMode: (mode: ViewMode) => void;
  onSave: () => void;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ArchitectSidebar({ model, site, viewMode, estimatedCost, onUpdateModel, onUpdateSite, onSelectPreset, onViewMode, onSave }: Props) {
  const [open, setOpen] = useState<Section | null>('model');
  const [mobileOpen, setMobileOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 700px)');
    const syncPanelToViewport = (event: MediaQueryListEvent) => setMobileOpen(event.matches);
    mobileViewport.addEventListener('change', syncPanelToViewport);
    return () => mobileViewport.removeEventListener('change', syncPanelToViewport);
  }, []);
  const toggle = (section: Section) => setOpen((current) => current === section ? null : section);
  const sectionButton = (id: Section, title: string, subtitle: string, Icon: typeof Box) => (
    <button type="button" aria-expanded={open === id} onClick={() => toggle(id)} className="rail-section-trigger">
      <span className="rail-icon"><Icon size={17} /></span>
      <span className="rail-section-copy"><strong>{title}</strong><small>{subtitle}</small></span>
      <ChevronDown size={16} className={`rail-chevron ${open === id ? 'is-open' : ''}`} />
    </button>
  );
  const fieldLabel = (text: string, value: string) => <div className="rail-field-label"><span>{text}</span><b>{value}</b></div>;

  return (
    <>
    <button type="button" className={`rail-mobile-toggle ${mobileOpen ? 'is-open' : ''}`} aria-label={mobileOpen ? 'Close design controls' : 'Open design controls'} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
    <aside className={`architect-rail ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Container design controls">
      <div className="rail-brand">
        <span className="rail-brand-mark"><Box size={19} strokeWidth={2.2} /></span>
        <span><b>GRID <i>&amp;</i> LOGIC</b><small>CONTAINER DESIGN</small></span>
      </div>
      <div className="rail-project">
        <span className="rail-eyebrow">CURRENT DESIGN</span>
        <strong>{model.name}</strong>
        <span>{model.lengthFt} × {model.widthFt} ft <i>·</i> {model.layoutType.replaceAll('-', ' ')}</span>
      </div>

      <div className="rail-sections">
        <section className="rail-section">
          {sectionButton('model', 'Model', 'Preset & dimensions', Box)}
          {open === 'model' && <div className="rail-section-content">
            <label className="rail-label" htmlFor="rail-preset">START FROM A PRESET</label>
            <select id="rail-preset" className="rail-select" value={model.presetId} onChange={(e) => onSelectPreset(e.target.value)}>
              {PRESET_MODELS.map((preset) => <option key={preset.presetId} value={preset.presetId}>{preset.name}</option>)}
            </select>
            <div className="rail-slider-row">{fieldLabel('Length', `${model.lengthFt} ft`)}<input aria-label="Container length" type="range" min="20" max="100" step="5" value={model.lengthFt} onChange={(e) => onUpdateModel({ lengthFt: Number(e.target.value) })} /></div>
            <div className="rail-slider-row">{fieldLabel('Width', `${model.widthFt} ft`)}<input aria-label="Container width" type="range" min="8" max="50" step="2" value={model.widthFt} onChange={(e) => onUpdateModel({ widthFt: Number(e.target.value) })} /></div>
            <div className="rail-slider-row">{fieldLabel('Height', `${model.heightFt} ft`)}<input aria-label="Container height" type="range" min="8" max="16" step="0.5" value={model.heightFt} onChange={(e) => onUpdateModel({ heightFt: Number(e.target.value) })} /></div>
            <div className="rail-inline-toggle"><span><Ruler size={15} /> Interior cutaway</span><input aria-label="Show interior cutaway" type="checkbox" checked={model.cutawayRoof} onChange={(e) => onUpdateModel({ cutawayRoof: e.target.checked })} /></div>
          </div>}
        </section>

        <section className="rail-section">
          {sectionButton('materials', 'Materials', 'Exterior & flooring', SwatchBook)}
          {open === 'materials' && <div className="rail-section-content">
            <span className="rail-label">EXTERIOR FINISH</span>
            <div className="rail-material-list">{FACADE_MATERIALS.map((material) => <button type="button" key={material.id} onClick={() => onUpdateModel({ exteriorMaterial: material.id, exteriorColor: material.colorHex, colorName: material.name })} className={`rail-material ${model.exteriorMaterial === material.id ? 'selected' : ''}`}><span style={{ backgroundColor: material.colorHex }} /><span>{material.name.replace(/^(Industrial |Charred |Swiss Alpine |Obsidian Architectural |Brutalist |Alpine Nordic )/, '')}</span></button>)}</div>
            <label className="rail-label" htmlFor="rail-floor">FLOORING</label>
            <select id="rail-floor" className="rail-select" value={model.flooringMaterial} onChange={(e) => onUpdateModel({ flooringMaterial: e.target.value as ContainerModelConfig['flooringMaterial'] })}>{FLOORING_OPTIONS.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}</select>
          </div>}
        </section>

        <section className="rail-section">
          {sectionButton('site', 'Site', 'Lot & lighting', Map)}
          {open === 'site' && <div className="rail-section-content">
            <div className="rail-slider-row">{fieldLabel('Lot width', `${site.lotWidthFt} ft`)}<input aria-label="Lot width" type="range" min="40" max="200" step="10" value={site.lotWidthFt} onChange={(e) => onUpdateSite({ lotWidthFt: Number(e.target.value) })} /></div>
            <div className="rail-slider-row">{fieldLabel('Lot depth', `${site.lotDepthFt} ft`)}<input aria-label="Lot depth" type="range" min="50" max="300" step="10" value={site.lotDepthFt} onChange={(e) => onUpdateSite({ lotDepthFt: Number(e.target.value) })} /></div>
            <div className="rail-slider-row"><div className="rail-field-label"><span><Sun size={14} /> Daylight</span><b>{site.timeOfDayHours}:00</b></div><input aria-label="Daylight time" type="range" min="6" max="18" step="1" value={site.timeOfDayHours} onChange={(e) => onUpdateSite({ timeOfDayHours: Number(e.target.value) })} /></div>
            <div className="rail-inline-toggle"><span><Layers3 size={15} /> Show site grid</span><input aria-label="Show site grid" type="checkbox" checked={site.show1ftGrid} onChange={(e) => onUpdateSite({ show1ftGrid: e.target.checked })} /></div>
            <div className="rail-inline-toggle"><span>Show dimensions</span><input aria-label="Show dimensions" type="checkbox" checked={site.showDimensions} onChange={(e) => onUpdateSite({ showDimensions: e.target.checked })} /></div>
          </div>}
        </section>

        <section className="rail-section">
          {sectionButton('view', 'View', 'Canvas mode', RotateCcw)}
          {open === 'view' && <div className="rail-section-content rail-view-options">
            {[['3d-orbit', '3D model'], ['floorplan-2d', 'Floor plan'], ['walkthrough-vr', 'Walkthrough']].map(([mode, label]) => <button type="button" key={mode} aria-pressed={viewMode === mode} className={viewMode === mode ? 'active' : ''} onClick={() => onViewMode(mode as ViewMode)}>{label}</button>)}
          </div>}
        </section>
      </div>

      <div className="rail-footer">
        <div><span>ESTIMATED BUILD</span><strong>{money.format(estimatedCost)}</strong></div>
        <button type="button" className="rail-save" onClick={onSave}><Save size={16} /> Save design</button>
      </div>
    </aside>
    </>
  );
}
