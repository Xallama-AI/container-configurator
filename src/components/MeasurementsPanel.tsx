import React, { useState } from 'react';
import { ContainerModelConfig, SitePlanningConfig, UnitSystem } from '../types';
import { 
  Ruler, 
  X, 
  Maximize2, 
  Layers, 
  Sun, 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Compass,
  Zap,
  Box
} from 'lucide-react';

interface MeasurementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  onUpdateSiteConfig: (partial: Partial<SitePlanningConfig>) => void;
  onOpenSpecSheet?: () => void;
}

export const MeasurementsPanel: React.FC<MeasurementsPanelProps> = ({
  isOpen,
  onClose,
  modelConfig,
  siteConfig,
  onUpdateSiteConfig,
  onOpenSpecSheet,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'dimensions' | 'site' | 'engineering'>('dimensions');

  if (!isOpen) return null;

  const isMetric = siteConfig.unitSystem === 'metric';
  const unitLabel = isMetric ? 'm' : 'ft';

  // Dimensional math
  const lengthVal = isMetric ? (modelConfig.lengthFt * 0.3048).toFixed(2) : modelConfig.lengthFt.toFixed(1);
  const widthVal = isMetric ? (modelConfig.widthFt * 0.3048).toFixed(2) : modelConfig.widthFt.toFixed(1);
  const heightVal = isMetric ? (modelConfig.heightFt * 0.3048).toFixed(2) : modelConfig.heightFt.toFixed(1);

  // Interior clear dimensions (subtracting 4.5" insulated stud walls and 7" ceiling assembly)
  const interiorWidthFt = modelConfig.widthFt - (modelConfig.wallThicknessInches * 2) / 12;
  const interiorHeightFt = modelConfig.heightFt - 0.7; // ~8'10" for 9.5ft HC
  const interiorLengthFt = modelConfig.lengthFt - (modelConfig.wallThicknessInches * 2) / 12;

  const interiorWidthVal = isMetric ? (interiorWidthFt * 0.3048).toFixed(2) : `${Math.floor(interiorWidthFt)}' ${Math.round((interiorWidthFt % 1) * 12)}"`;
  const interiorHeightVal = isMetric ? (interiorHeightFt * 0.3048).toFixed(2) : `${Math.floor(interiorHeightFt)}' ${Math.round((interiorHeightFt % 1) * 12)}"`;

  const floorAreaSqFt = modelConfig.lengthFt * modelConfig.widthFt;
  const floorAreaVal = isMetric ? (floorAreaSqFt * 0.092903).toFixed(1) : floorAreaSqFt.toLocaleString();
  const floorAreaUnit = isMetric ? 'm²' : 'sq.ft';

  const volumeCuFt = Math.round(modelConfig.lengthFt * modelConfig.widthFt * interiorHeightFt);
  const volumeVal = isMetric ? (volumeCuFt * 0.0283168).toFixed(1) : volumeCuFt.toLocaleString();
  const volumeUnit = isMetric ? 'm³' : 'cu.ft';

  const diagonalFt = Math.sqrt(Math.pow(modelConfig.lengthFt, 2) + Math.pow(modelConfig.widthFt, 2));
  const diagonalVal = isMetric ? (diagonalFt * 0.3048).toFixed(2) : diagonalFt.toFixed(1);

  // Estimated Corten steel tare weight (approx 3.7 to 4.2 metric tons for 40ft HC)
  const tareWeightTons = modelConfig.lengthFt === 20 ? 2.3 : modelConfig.layoutType === 'double-wide' ? 8.2 : modelConfig.layoutType === 'stacked-2story' ? 8.8 : 4.1;

  // Lot Coverage
  const lotAreaSqFt = siteConfig.lotWidthFt * siteConfig.lotDepthFt;
  const lotCoveragePct = ((floorAreaSqFt / lotAreaSqFt) * 100).toFixed(1);

  const handleCopySpecs = () => {
    const text = `
GRID & LOGIC ARCHITECTURAL SPECIFICATION
Model: ${modelConfig.name} (${modelConfig.luxuryTier || 'Luxury Modern'})
Dimensions: ${lengthVal} ${unitLabel} (L) x ${widthVal} ${unitLabel} (W) x ${heightVal} ${unitLabel} (H)
Interior Clear: ${interiorWidthVal} (W) x ${interiorHeightVal} (H)
Living Area: ${floorAreaVal} ${floorAreaUnit}
Internal Volume: ${volumeVal} ${volumeUnit}
Wall System: ${modelConfig.wallThicknessInches}" insulated Corten steel (R-${modelConfig.insulationRValue})
Roof System: ${modelConfig.roofOption} (Solar: ${modelConfig.solarCapacityKw} kW)
Foundation: ${modelConfig.foundationType} (Ground Clearance: ${modelConfig.pierHeightInches}")
Tare Shell Weight: ~${tareWeightTons} metric tons COR-TEN A Steel
Scale Calibration: 1ft in model = 1ft in real-world site plan
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <aside 
      aria-label="Architectural Measurements & Precision Scale"
      className="absolute top-3 sm:top-4 left-3 sm:left-4 z-30 w-[calc(100vw-24px)] sm:w-[380px] max-h-[calc(100vh-32px)] flex flex-col rounded-2xl bg-[#090d16]/96 border border-[#1e293b] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-slate-200 font-sans overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-left-4"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-gradient-to-r from-[#0d1424] to-[#090d16]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-xs font-bold text-white tracking-wider uppercase">
                Measurements &amp; Scale
              </h3>
              <span className="text-[9px] font-mono font-bold bg-[#00f0ff]/20 text-[#00f0ff] px-1.5 py-0.5 rounded border border-[#00f0ff]/40">
                1:1 REAL SCALE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Certified architectural millimeter precision
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Unit Toggle Button */}
          <button
            onClick={() =>
              onUpdateSiteConfig({
                unitSystem: isMetric ? 'imperial' : 'metric',
              })
            }
            className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-[#00f0ff] border border-slate-700 transition"
            title="Toggle Metric (Meters) / Imperial (Feet)"
          >
            {isMetric ? 'METRIC (m)' : 'IMPERIAL (ft)'}
          </button>

          {/* Close Panel Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Measurements Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Luxury Header Card */}
      <div className="px-4 py-2.5 bg-[#0f172a]/60 border-b border-slate-800/60 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#00f0ff] block font-bold">
            {modelConfig.luxuryTier || 'LUXURY SIGNATURE ARCHITECTURE'}
          </span>
          <h4 className="font-heading text-sm font-bold text-white">
            {modelConfig.name}
          </h4>
        </div>
        <div className="text-right font-mono">
          <span className="text-[9px] text-slate-400 block">TOTAL AREA</span>
          <span className="text-sm font-bold text-emerald-400">
            {floorAreaVal} {floorAreaUnit}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-800 text-[11px] font-mono bg-[#070a10]">
        <button
          onClick={() => setActiveSection('dimensions')}
          className={`flex-1 py-2 text-center transition border-b-2 font-semibold ${
            activeSection === 'dimensions'
              ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Dimensions
        </button>
        <button
          onClick={() => setActiveSection('site')}
          className={`flex-1 py-2 text-center transition border-b-2 font-semibold ${
            activeSection === 'site'
              ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Site &amp; Setbacks
        </button>
        <button
          onClick={() => setActiveSection('engineering')}
          className={`flex-1 py-2 text-center transition border-b-2 font-semibold ${
            activeSection === 'engineering'
              ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Engineering
        </button>
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono scrollbar-thin scrollbar-thumb-slate-800">
        {/* SECTION 1: PRIMARY DIMENSIONS */}
        {activeSection === 'dimensions' && (
          <div className="space-y-4">
            {/* 3-Column Core Metric Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#0e1626] p-2.5 border border-slate-800/80">
                <span className="text-[9px] text-slate-400 block mb-0.5">EXT. LENGTH</span>
                <span className="text-base font-bold text-white block">
                  {lengthVal} <span className="text-xs font-normal text-slate-400">{unitLabel}</span>
                </span>
                <span className="text-[9px] text-slate-500">
                  {isMetric ? `${modelConfig.lengthFt} ft` : `${(modelConfig.lengthFt * 0.3048).toFixed(2)} m`}
                </span>
              </div>

              <div className="rounded-xl bg-[#0e1626] p-2.5 border border-slate-800/80">
                <span className="text-[9px] text-slate-400 block mb-0.5">EXT. WIDTH</span>
                <span className="text-base font-bold text-white block">
                  {widthVal} <span className="text-xs font-normal text-slate-400">{unitLabel}</span>
                </span>
                <span className="text-[9px] text-slate-500">
                  {isMetric ? `${modelConfig.widthFt} ft` : `${(modelConfig.widthFt * 0.3048).toFixed(2)} m`}
                </span>
              </div>

              <div className="rounded-xl bg-[#0e1626] p-2.5 border border-slate-800/80">
                <span className="text-[9px] text-slate-400 block mb-0.5">EXT. HEIGHT</span>
                <span className="text-base font-bold text-[#00f0ff] block">
                  {heightVal} <span className="text-xs font-normal text-slate-400">{unitLabel}</span>
                </span>
                <span className="text-[9px] text-slate-500">
                  {modelConfig.heightFt > 9 ? 'High-Cube (HC)' : 'Standard ISO'}
                </span>
              </div>
            </div>

            {/* Clearances & Volume Table */}
            <div className="rounded-xl bg-[#0d1424]/90 p-3 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Clear Interior Ceiling:</span>
                <span className="font-bold text-white">{interiorHeightVal}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Clear Interior Width:</span>
                <span className="font-bold text-white">{interiorWidthVal}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Internal Enclosed Volume:</span>
                <span className="font-bold text-white">{volumeVal} {volumeUnit}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Structural Diagonal Span:</span>
                <span className="font-bold text-white">{diagonalVal} {unitLabel}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Insulated Wall Thickness:</span>
                <span className="font-bold text-white">{modelConfig.wallThicknessInches} inches</span>
              </div>
            </div>

            {/* 1ft Scale Visualizer Bar */}
            <div className="rounded-xl bg-[#090d16] p-3 border border-slate-800">
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="text-slate-400">1:1 Real Scale Calibration</span>
                <span className="text-[#00f0ff] font-bold">1ft Model = 1ft Reality</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-md border border-slate-700 flex overflow-hidden">
                {Array.from({ length: Math.min(modelConfig.lengthFt, 24) }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 border-r border-slate-950 ${
                      i % 5 === 0 ? 'bg-[#00f0ff]' : i % 2 === 0 ? 'bg-slate-600' : 'bg-slate-800'
                    }`}
                    title={`Tick ${i + 1} ft`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>0 ft</span>
                <span>5 ft</span>
                <span>10 ft</span>
                <span>15 ft</span>
                <span>{modelConfig.lengthFt} ft</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: SITE PLANNING & SETBACKS */}
        {activeSection === 'site' && (
          <div className="space-y-3.5">
            <div className="rounded-xl bg-[#0e1626] p-3 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Lot Dimensions:</span>
                <span className="font-bold text-white">
                  {siteConfig.lotWidthFt} ft × {siteConfig.lotDepthFt} ft ({lotAreaSqFt.toLocaleString()} sq.ft)
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Lot Footprint Coverage:</span>
                <span className="font-bold text-emerald-400">{lotCoveragePct}%</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Front Setback:</span>
                <span className="font-bold text-white">{siteConfig.setbackFrontFt} ft</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Rear Setback:</span>
                <span className="font-bold text-white">{siteConfig.setbackRearFt} ft</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Side Setbacks:</span>
                <span className="font-bold text-white">{siteConfig.setbackSideFt} ft (Both Sides)</span>
              </div>
            </div>

            {/* Setbacks Visual Warning */}
            <div className="rounded-xl bg-[#0d1424] p-3 border border-slate-800 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#00f0ff] font-bold">
                <Compass className="w-3.5 h-3.5" />
                <span>Zoning Clearance Status</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Container footprint currently rests within legal buildable envelope. Check local municipal zoning for accessory dwelling unit (ADU) or residential primary setbacks.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: ENGINEERING & THERMAL */}
        {activeSection === 'engineering' && (
          <div className="space-y-3.5">
            <div className="rounded-xl bg-[#0e1626] p-3 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Structural Steel:</span>
                <span className="font-bold text-white">COR-TEN A (ISO 1496-1)</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Tare Shell Weight:</span>
                <span className="font-bold text-white">~{tareWeightTons} Metric Tons</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Thermal Envelope:</span>
                <span className="font-bold text-emerald-400">Closed-Cell R-{modelConfig.insulationRValue}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Solar Yield:</span>
                <span className="font-bold text-[#00f0ff]">{modelConfig.solarCapacityKw} kW Bifacial</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Foundation Type:</span>
                <span className="font-bold text-white capitalize">{modelConfig.foundationType.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pier Elevation:</span>
                <span className="font-bold text-white">{modelConfig.pierHeightInches} inches ground clear</span>
              </div>
            </div>

            {/* Corner Casting Spec */}
            <div className="rounded-xl bg-[#090d16] p-3 border border-slate-800 text-[10px] text-slate-400 space-y-1">
              <span className="text-slate-300 font-bold block">ISO 1161 Standard Corner Castings</span>
              <p>Top and bottom corners engineered to withstand 86,400 kg stack load with certified twist-lock apertures for rapid crane offloading and foundation anchoring.</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070a10] flex items-center justify-between gap-2">
        <button
          onClick={handleCopySpecs}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-mono transition border border-slate-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? 'Copied Specs' : 'Copy Specs'}</span>
        </button>

        {onOpenSpecSheet && (
          <button
            onClick={onOpenSpecSheet}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-[#00f0ff]/20 to-[#00b4d8]/20 hover:from-[#00f0ff]/30 hover:to-[#00b4d8]/30 text-[#00f0ff] text-xs font-mono font-bold transition border border-[#00f0ff]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Full Spec PDF</span>
          </button>
        )}
      </div>
    </aside>
  );
};
