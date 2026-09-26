import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Maximize2,
  Palette,
  Home,
  Sun,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  BookmarkCheck,
  Camera,
  Compass,
  DollarSign,
  Grid,
  Eye,
  Sliders,
  Check,
  Flame,
  Waves,
  Building,
  TreePine,
  PanelTop,
  Bot,
  Download,
  Sofa,
  DoorOpen,
  DoorClosed,
  Smartphone,
  MousePointer,
  Tv,
  Coffee,
  Bath,
  BedDouble,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  ContainerModelConfig,
  SitePlanningConfig,
  FoundationType,
  RoofOption,
  InteriorStyle,
  LayoutType,
  ExteriorMaterial,
  FlooringMaterial,
  GlassTint,
  ContainerOpening,
  RoomPartition,
  LoungeType,
  KitchenType,
  BathroomType,
  BedroomType,
} from '../types';
import {
  PRESET_MODELS,
  ARCHITECTURAL_PRESETS,
  ROOM_STYLE_OPTIONS,
  FACADE_MATERIALS,
  FLOORING_OPTIONS,
  GLASS_TINTS,
  LAYOUT_MODULES,
  CONTAINER_COLOR_PALETTE,
} from '../data/presets';
import { calculateConfigurationCost } from '../utils/calculator';
import { soundFx } from '../utils/audio';
import { generateArchitecturalPdf } from '../utils/pdfGenerator';

interface ConfiguratorControlsProps {
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  currentUser?: { name: string; email: string; role: string } | null;
  onUpdateModel: (partial: Partial<ContainerModelConfig>) => void;
  onUpdateSite: (partial: Partial<SitePlanningConfig>) => void;
  onSelectPreset: (preset: ContainerModelConfig) => void;
  onOpenSpecSheet: () => void;
  onOpenARCamera: () => void;
  onSaveConfig: () => void;
  onRequireAuth: () => void;
  onOpenAiArchitect?: () => void;
}

export type ConfigStepId = 'model' | 'shell' | 'facade' | 'interior' | 'outdoor' | 'quote';

interface StepInfo {
  id: ConfigStepId;
  stepNumber: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const STEPS: StepInfo[] = [
  {
    id: 'model',
    stepNumber: '01',
    title: 'Model & Layout',
    subtitle: 'Signature residences & architectural footprint',
    icon: Layers,
  },
  {
    id: 'shell',
    stepNumber: '02',
    title: 'Dimensions & Shell',
    subtitle: 'ISO container scale, insulation & foundation',
    icon: Maximize2,
  },
  {
    id: 'facade',
    stepNumber: '03',
    title: 'Exterior & Facade',
    subtitle: 'Rainscreen cladding, patina & glazing',
    icon: Palette,
  },
  {
    id: 'interior',
    stepNumber: '04',
    title: 'Interior & Living',
    subtitle: 'Design archetype, luxury flooring & partitions',
    icon: Home,
  },
  {
    id: 'outdoor',
    stepNumber: '05',
    title: 'Roof & Outdoor',
    subtitle: 'Rooftop solar, terraces & leisure amenities',
    icon: Sun,
  },
  {
    id: 'quote',
    stepNumber: '06',
    title: 'Summary & Quote',
    subtitle: 'Investment breakdown, lead time & blueprints',
    icon: DollarSign,
  },
];

export const ConfiguratorControls: React.FC<ConfiguratorControlsProps> = ({
  modelConfig,
  siteConfig,
  currentUser,
  onUpdateModel,
  onUpdateSite,
  onSelectPreset,
  onOpenSpecSheet,
  onOpenARCamera,
  onSaveConfig,
  onRequireAuth,
  onOpenAiArchitect,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [presetSizeFilter, setPresetSizeFilter] = useState<'all' | '20ft' | '30ft' | '40ft' | 'double-wide' | 'multi-story'>('all');
  const [stillCreateConfirmed, setStillCreateConfirmed] = useState<boolean>(false);
  const costBreakdown = calculateConfigurationCost(modelConfig);

  const handleAddRoom = (roomType: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'office') => {
    soundFx.playClick();
    const current = modelConfig.partitions || [];
    const maxOffset = Math.max(modelConfig.lengthFt - 4, 6);
    const stepCount = current.length + 2;
    const nextOffset = Math.min(
      Math.max(Math.round(((current.length + 1) * modelConfig.lengthFt) / stepCount), 4),
      maxOffset
    );
    const roomNames = {
      bedroom: current.some((r) => r.roomType === 'bedroom') ? 'Guest Bedroom' : 'Master Bedroom',
      bathroom: current.some((r) => r.roomType === 'bathroom') ? 'Powder Room' : 'Spa Bathroom',
      kitchen: "Chef's Kitchen",
      living: 'Great Room Lounge',
      office: 'Executive Office',
    };
    const newPartition: RoomPartition = {
      id: `room-${Date.now().toString().slice(-4)}`,
      name: roomNames[roomType] || 'New Room',
      roomType,
      positionFt: nextOffset,
      furnishings: true,
    };
    onUpdateModel({
      partitions: [...current, newPartition],
      cutawayRoof: true, // automatically open cutaway roof so client sees the new room in 3D!
    });
  };

  const handleUpdateRoom = (id: string, partial: Partial<RoomPartition>) => {
    const updated = (modelConfig.partitions || []).map((p) => (p.id === id ? { ...p, ...partial } : p));
    onUpdateModel({ partitions: updated });
  };

  const handleRemoveRoom = (id: string) => {
    soundFx.playClick();
    const updated = (modelConfig.partitions || []).filter((p) => p.id !== id);
    onUpdateModel({ partitions: updated });
  };

  // Undo / Redo History Stack
  const [history, setHistory] = useState<ContainerModelConfig[]>([modelConfig]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isInternalUpdate = useRef(false);

  // Synchronize history when modelConfig changes externally
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      if (JSON.stringify(sliced[sliced.length - 1]) === JSON.stringify(modelConfig)) {
        return prev;
      }
      return [...sliced, modelConfig];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [modelConfig]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      soundFx.playClick();
      isInternalUpdate.current = true;
      const targetState = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      onUpdateModel(targetState);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      soundFx.playClick();
      isInternalUpdate.current = true;
      const targetState = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      onUpdateModel(targetState);
    }
  };

  const activeStep = STEPS[currentStepIndex];

  const handleNextStep = () => {
    soundFx.playClick();
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      if (!currentUser) {
        onRequireAuth();
      } else {
        onSaveConfig();
      }
    }
  };

  const handlePrevStep = () => {
    soundFx.playClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleStepClick = (index: number) => {
    soundFx.playClick();
    setCurrentStepIndex(index);
  };

  // Add Wall Opening Helper
  const handleAddOpening = (type: ContainerOpening['type']) => {
    soundFx.playSuccess();
    const newOpening: ContainerOpening = {
      id: `op-${Date.now().toString().slice(-4)}`,
      type,
      wall: 'front',
      positionFt: Math.round(modelConfig.lengthFt / 2),
      widthFt: type.includes('16ft') ? 16 : type.includes('12ft') ? 12 : type.includes('8ft') ? 8 : 4,
      heightFt: type.includes('door') ? 8 : 4.5,
      elevationFt: type.includes('door') ? 0 : 2.5,
    };
    onUpdateModel({
      openings: [...modelConfig.openings, newOpening],
    });
  };

  const handleRemoveOpening = (id: string) => {
    soundFx.playClick();
    onUpdateModel({
      openings: modelConfig.openings.filter((op) => op.id !== id),
    });
  };

  return (
    <div
      id="beast-configurator-sidebar"
      className="flex flex-col h-full bg-white border-l border-slate-200 text-slate-900 select-none overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & INTERACTIVE STEP TRACKER                                  */}
      {/* ========================================================================= */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-black" />
            <span className="text-[10px] font-mono tracking-widest text-slate-900 uppercase font-bold">
              ARCHITECTURAL CONFIGURATOR
            </span>
          </div>

          {/* Undo / Redo Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-lg border transition ${
                historyIndex > 0
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-black hover:border-black'
                  : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Undo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-lg border transition ${
                historyIndex < history.length - 1
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-black hover:border-black'
                  : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Redo"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clickable Step Pills Progression Bar */}
        <div className="grid grid-cols-6 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          {STEPS.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(idx)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-black text-white font-bold'
                    : isCompleted
                    ? 'bg-slate-200 text-slate-800'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={`Jump to Step ${step.stepNumber}: ${step.title}`}
              >
                <span className="text-[10px] font-mono leading-none">{step.stepNumber}</span>
                <span className="text-[9px] font-medium tracking-tight mt-0.5 truncate max-w-[50px] hidden sm:inline">
                  {step.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Step Banner */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              STEP {activeStep.stepNumber} OF 06
            </div>
            <h3 className="font-heading text-base font-bold text-slate-900 tracking-wide">
              {activeStep.title}
            </h3>
            <p className="text-xs text-slate-500 font-sans">{activeStep.subtitle}</p>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400">ESTIMATE</div>
            <div className="font-heading text-base font-bold text-black">
              ${costBreakdown.totalUsd.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SCROLLABLE STEP CONTENT BODY                                           */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-white">
        {/* ======================================================================= */}
        {/* SPACE FEASIBILITY & SMART SIZE ADVISOR (IF HOUSE IS SMALL FOR SPECS)    */}
        {/* ======================================================================= */}
        {(() => {
          const isCompact = modelConfig.lengthFt <= 24 && modelConfig.layoutType === 'single';
          const currentSqFt = modelConfig.lengthFt * (modelConfig.layoutType === 'double-wide' ? 16 : modelConfig.layoutType === 'triple-wide' ? 24 : 8);
          const hasMultiplePartitions = (modelConfig.partitions?.length || 0) >= 2;
          const isHighRequirement = modelConfig.bedroomType === 'master-suite' || modelConfig.kitchenType === 'chef-island' || hasMultiplePartitions;
          const isSizeConstrained = isCompact && (isHighRequirement || modelConfig.lengthFt <= 20);

          if (!isSizeConstrained) return null;

          if (stillCreateConfirmed) {
            return (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200 font-mono shadow-md">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>
                    Building in <strong>{modelConfig.lengthFt}ft Micro Studio Mode</strong> ({currentSqFt} sq ft). Built-in space optimization active.
                  </span>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setStillCreateConfirmed(false);
                  }}
                  className="px-2 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 hover:text-white text-[10px] font-bold border border-amber-600 transition"
                >
                  View Sizes
                </button>
              </div>
            );
          }

          return (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1c1810] via-[#0d1522] to-[#080d16] border-2 border-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.25)] space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-heading font-bold text-white tracking-wider flex items-center gap-2">
                      SPACE FEASIBILITY &amp; SIZE ADVISORY
                    </h4>
                    <p className="text-[11px] text-amber-300 font-mono">
                      {modelConfig.lengthFt}ft Container ({currentSqFt} sq ft) is Compact for Complete Home Layout
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-700/80 font-bold uppercase">
                  ADVISORY
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Your selected layout features a full <strong>Washroom</strong>, <strong>Kitchen</strong>, and <strong>Living Lounge</strong>. In a 20ft container (160 sq ft), interior space is compact. You can <strong>Still Create</strong> with this size, or <strong>Click a Recommended Size</strong> below according to your house requirements:
              </p>

              {/* Clickable Size Options According to House */}
              <div className="space-y-1.5 pt-0.5">
                <span className="text-[10px] font-mono uppercase text-[#00f0ff] font-bold tracking-wider block">
                  CLICK RECOMMENDED SIZE ACCORDING TO HOUSE:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundFx.playSuccess();
                      onUpdateModel({ lengthFt: 40, layoutType: 'single' });
                    }}
                    className="p-2.5 rounded-xl border border-emerald-500/50 bg-emerald-950/30 hover:bg-emerald-900/40 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 font-mono">40FT LUXURY (320 SQ FT)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition" />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Standard full 1-bed residence</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playSuccess();
                      onUpdateModel({ lengthFt: 40, widthFt: 16, layoutType: 'double-wide' });
                    }}
                    className="p-2.5 rounded-xl border border-[#00f0ff]/50 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00f0ff] font-mono">DOUBLE-WIDE (640 SQ FT)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#00f0ff] group-hover:translate-x-0.5 transition" />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Spacious 2-bed &amp; chef island</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playSuccess();
                      onUpdateModel({ lengthFt: 40, widthFt: 24, layoutType: 'triple-wide' });
                    }}
                    className="p-2.5 rounded-xl border border-purple-500/50 bg-purple-950/30 hover:bg-purple-900/40 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 font-mono">TRIPLE-WIDE (960 SQ FT)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition" />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Luxury multi-wing villa estate</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playSuccess();
                      onUpdateModel({ lengthFt: 40, stories: 2, layoutType: 'stacked-2story' });
                    }}
                    className="p-2.5 rounded-xl border border-blue-500/50 bg-blue-950/30 hover:bg-blue-900/40 text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300 font-mono">2-STORY RESIDENCE (640 SQ FT)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition" />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Two levels with rooftop terrace</span>
                  </button>
                </div>
              </div>

              {/* Free Option: Still Create */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Prefer compact micro-living?
                </span>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setStillCreateConfirmed(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 hover:text-amber-100 text-xs font-mono font-bold border border-amber-500/40 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>STILL CREATE WITH {modelConfig.lengthFt}FT (FREE)</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* ======================================================================= */}
        {/* QUICK ACCESS: THEMES OF HOUSES, PDF BLUEPRINT & GAME DOORS/WINDOWS       */}
        {/* ======================================================================= */}
        <div className="p-3.5 rounded-2xl bg-[#0d1522] border border-slate-700/80 shadow-lg space-y-3.5">
          {/* 1. PDF DOWNLOAD DIRECT ACCESS */}
          <div>
            <button
              onClick={() => {
                soundFx.playSuccess();
                generateArchitecturalPdf(modelConfig, siteConfig);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00a6ff] hover:brightness-110 text-black font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] transition active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD ARCHITECTURAL BLUEPRINT (PDF)</span>
            </button>
          </div>

          {/* 2. THEMES OF HOUSES QUICK SELECT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#00f0ff] font-bold flex items-center gap-1.5">
                <Home className="w-3 h-3" />
                THEMES OF HOUSES
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                5 SIGNATURE DESIGNS
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PRESET_MODELS.map((preset) => {
                const isSelected = modelConfig.presetId === preset.presetId;
                return (
                  <button
                    key={preset.presetId}
                    onClick={() => {
                      soundFx.playChime();
                      onSelectPreset(preset);
                    }}
                    className={`p-2 rounded-xl text-left border transition ${
                      isSelected
                        ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                        : 'bg-[#080d16] hover:bg-[#111928] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-[8px] font-mono uppercase text-[#00f0ff] font-bold">
                      {preset.luxuryTier}
                    </div>
                    <div className="text-[11px] font-heading font-bold text-white truncate">
                      {preset.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      {preset.lengthFt}ft &bull; {preset.layoutType}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. GAME-LIKE OPERABLE DOORS & WINDOWS */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5" />
                GAME DOORS &amp; WINDOWS
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                CLICK TO OPEN / SHUT
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Front Exterior Door */}
              <button
                onClick={() => {
                  const next = !modelConfig.frontDoorOpen;
                  if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                  onUpdateModel({
                    frontDoorOpen: next,
                    openings: (modelConfig.openings || []).map((o) =>
                      o.wall === 'front' && o.type.includes('door') ? { ...o, isOpen: next } : o
                    ),
                  });
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  modelConfig.frontDoorOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                    : 'bg-[#080d16] text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                {modelConfig.frontDoorOpen ? <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> : <DoorClosed className="w-3.5 h-3.5 text-slate-400" />}
                <span>Front Door ({modelConfig.frontDoorOpen ? 'Open' : 'Shut'})</span>
              </button>

              {/* Cargo Doors */}
              <button
                onClick={() => {
                  const next = !modelConfig.cargoDoorsOpen;
                  if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                  onUpdateModel({ cargoDoorsOpen: next });
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  modelConfig.cargoDoorsOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                    : 'bg-[#080d16] text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                {modelConfig.cargoDoorsOpen ? <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> : <DoorClosed className="w-3.5 h-3.5 text-slate-400" />}
                <span>Cargo Doors ({modelConfig.cargoDoorsOpen ? 'Open' : 'Shut'})</span>
              </button>

              {/* Private Bathroom Door (Pocket/Sliding) */}
              {(() => {
                const isBathOpen = modelConfig.doorStates?.['interior-bath-door'] !== undefined
                  ? modelConfig.doorStates['interior-bath-door']
                  : !!modelConfig.interiorDoorsOpen;
                return (
                  <button
                    onClick={() => {
                      const next = !isBathOpen;
                      if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                      onUpdateModel({
                        doorStates: { ...(modelConfig.doorStates || {}), 'interior-bath-door': next },
                        interiorDoorsOpen: next,
                      });
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                      isBathOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                        : 'bg-[#080d16] text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    {isBathOpen ? <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> : <DoorClosed className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Bath Door ({isBathOpen ? 'Open' : 'Shut'})</span>
                  </button>
                );
              })()}

              {/* Master Bedroom Privacy Door */}
              {(() => {
                const isBedOpen = modelConfig.doorStates?.['interior-bed-door'] !== undefined
                  ? modelConfig.doorStates['interior-bed-door']
                  : !!modelConfig.interiorDoorsOpen;
                return (
                  <button
                    onClick={() => {
                      const next = !isBedOpen;
                      if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                      onUpdateModel({
                        doorStates: { ...(modelConfig.doorStates || {}), 'interior-bed-door': next },
                      });
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                      isBedOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                        : 'bg-[#080d16] text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    {isBedOpen ? <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> : <DoorClosed className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Bed Door ({isBedOpen ? 'Open' : 'Shut'})</span>
                  </button>
                );
              })()}
            </div>
            <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <MousePointer className="w-3 h-3 text-[#00f0ff]" />
              <span>In 3D view, click any door or window directly to interact!</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* STEP 1: MODEL & ARCHITECTURE                                            */}
        {/* ----------------------------------------------------------------------- */}
        {activeStep.id === 'model' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* AI Architect Generative Prompt Banner */}
            {onOpenAiArchitect && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00f0ff]/15 via-[#0d1627] to-[#080d16] border border-[#00f0ff]/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="font-heading text-xs font-bold text-white tracking-wide">
                      AI ARCHITECTURAL BOT
                    </span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-[#00f0ff] text-black font-bold px-2 py-0.5 rounded">
                    PROMPT TO BUILD
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Want the bot to design your house? Prompt what you want in natural language (e.g. <em>"2-story villa with 3 bedrooms, spa bath, floor-to-ceiling glass &amp; plunge pool"</em>) and it creates it instantly!
                </p>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onOpenAiArchitect();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#00f0ff] hover:bg-[#00d2df] text-black font-heading text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.35)] transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prompt AI Architect Now</span>
                </button>
              </div>
            )}

            {/* Signature Presets Collection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Signature Residences &amp; Floor Plans ({ARCHITECTURAL_PRESETS.length})
                </label>
                <span className="text-[11px] text-[#00f0ff] font-mono">5+ Unique Variations Per Size</span>
              </div>

              {/* Size Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-none text-[11px] font-mono">
                {[
                  { id: 'all', label: 'All (20)' },
                  { id: '20ft', label: '20ft (5)' },
                  { id: '30ft', label: '30ft (5)' },
                  { id: '40ft', label: '40/45ft (5)' },
                  { id: 'double-wide', label: '16ft Double (5)' },
                  { id: 'multi-story', label: 'Multi-Story (2)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundFx.playClick(600);
                      setPresetSizeFilter(tab.id as any);
                    }}
                    className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition ${
                      presetSizeFilter === tab.id
                        ? 'bg-[#00f0ff] text-black font-bold border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-[#0c121e] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {ARCHITECTURAL_PRESETS.filter((p) => {
                  if (presetSizeFilter === 'all') return true;
                  if (presetSizeFilter === '20ft') return p.lengthFt === 20;
                  if (presetSizeFilter === '30ft') return p.lengthFt === 30;
                  if (presetSizeFilter === '40ft') return (p.lengthFt === 40 || p.lengthFt === 45) && p.layoutType !== 'double-wide';
                  if (presetSizeFilter === 'double-wide') return p.layoutType === 'double-wide' || p.widthFt >= 14;
                  if (presetSizeFilter === 'multi-story') return p.layoutType === 'stacked-2story' || p.layoutType === 'l-shape';
                  return true;
                }).map((preset) => {
                  const isSelected = modelConfig.floorPlanPresetId === preset.floorPlanPresetId || modelConfig.name === preset.name;
                  return (
                    <button
                      key={preset.floorPlanPresetId || preset.presetId}
                      onClick={() => onSelectPreset(preset)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                        isSelected
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'border-slate-800/90 bg-[#0c121e] hover:border-slate-700 hover:bg-[#111927]'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-mono font-bold text-black bg-[#00f0ff] px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#00f0ff] font-bold">
                          {preset.luxuryTier}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase bg-slate-800/80 px-1.5 py-0.5 rounded">
                          {preset.lengthFt}ft • {preset.widthFt}ft
                        </span>
                      </div>
                      <div className="font-heading text-sm font-bold text-white">{preset.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{preset.subtitle}</div>

                      {/* Floor Plan Room Configuration Badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-mono">
                        {preset.loungeType && (
                          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300">
                            Lounge: {preset.loungeType.replace(/-/g, ' ')}
                          </span>
                        )}
                        {preset.kitchenType && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
                            Kitchen: {preset.kitchenType.replace(/-/g, ' ')}
                          </span>
                        )}
                        {preset.bathroomType && (
                          <span className="px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800/60 text-teal-300">
                            Bath: {preset.bathroomType.replace(/-/g, ' ')}
                          </span>
                        )}
                        {preset.bedroomType && (
                          <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300">
                            Bed: {preset.bedroomType.replace(/-/g, ' ')}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
                        <span>
                          {preset.layoutType === 'double-wide' ? 'Unified 16ft Double-Wide' : `${preset.lengthFt}ft ${preset.layoutType.toUpperCase()}`}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {preset.solarCapacityKw > 0 && `${preset.solarCapacityKw}kW Solar`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Architectural Layout Archetype */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                Architectural Layout Footprint
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LAYOUT_MODULES.map((layout) => {
                  const isCurrent = modelConfig.layoutType === layout.id;
                  return (
                    <button
                      key={layout.id}
                      onClick={() => onUpdateModel({ layoutType: layout.id as LayoutType })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                          : 'border-slate-800 bg-[#0c121e] hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-heading text-xs font-bold ${
                            isCurrent ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {layout.name.split('(')[0]}
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                        {layout.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-Story Floor Inspector View Level */}
            {modelConfig.layoutType === 'stacked-2story' && (
              <div className="p-4 rounded-xl bg-[#0c121e] border border-[#00f0ff]/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                    <Building className="w-4 h-4 text-[#00f0ff]" />
                    <span>2-Story Floor Inspector</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00f0ff] bg-[#00f0ff]/15 px-2 py-0.5 rounded font-bold border border-[#00f0ff]/30">
                    MULTI-FLOOR
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Toggle between viewing the complete 2-story residence or isolate the ground or upper stories:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', title: 'Complete', desc: 'Both Stories' },
                    { id: 'ground', title: 'Ground Floor', desc: 'Lounge & Kitchen' },
                    { id: 'upper', title: 'Upper Story', desc: 'Master & Balcony' },
                  ].map((level) => {
                    const isSelected =
                      (!modelConfig.activeStoryView && level.id === 'all') ||
                      modelConfig.activeStoryView === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => {
                          soundFx.playClick();
                          onUpdateModel({ activeStoryView: level.id as 'all' | 'ground' | 'upper' });
                        }}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          isSelected
                            ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                            : 'border-slate-800 bg-[#080d16] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className={`font-mono text-xs font-bold ${isSelected ? 'text-[#00f0ff]' : 'text-slate-200'}`}>
                          {level.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{level.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STEP 2: DIMENSIONS & SHELL                                              */}
        {/* ----------------------------------------------------------------------- */}
        {activeStep.id === 'shell' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Container Standard ISO Length */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-white uppercase">
                  Container Length (ISO Steel Spec)
                </label>
                <span className="font-mono text-xs font-bold text-[#00f0ff]">
                  {modelConfig.lengthFt} FT ({Math.round(modelConfig.lengthFt * 0.3048 * 10) / 10}m)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { len: 20, label: '20ft Standard', desc: 'Compact Studio' },
                  { len: 40, label: '40ft High-Cube', desc: 'Standard Residence' },
                  { len: 45, label: '45ft Extended', desc: 'Grand Compound' },
                ].map((item) => (
                  <button
                    key={item.len}
                    onClick={() => onUpdateModel({ lengthFt: item.len })}
                    className={`py-2 px-2.5 rounded-lg border text-center transition ${
                      modelConfig.lengthFt === item.len
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold'
                        : 'border-slate-800 bg-[#080d16] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ceiling Height */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-white uppercase">
                  Ceiling & Interior Volume
                </label>
                <span className="font-mono text-xs font-bold text-[#00f0ff]">
                  {modelConfig.heightFt >= 9.5 ? '9’6” HIGH-CUBE (+1ft Headroom)' : '8’6” STANDARD ISO'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateModel({ heightFt: 8.5 })}
                  className={`p-3 rounded-lg border text-left transition ${
                    modelConfig.heightFt <= 8.8
                      ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold'
                      : 'border-slate-800 bg-[#080d16] text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold text-white">8’6” Standard Container</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Classic ISO marine shipping height</div>
                </button>
                <button
                  onClick={() => onUpdateModel({ heightFt: 9.5 })}
                  className={`p-3 rounded-lg border text-left transition ${
                    modelConfig.heightFt >= 9.2
                      ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold'
                      : 'border-slate-800 bg-[#080d16] text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold text-white">9’6” High-Cube (HQ)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Architect-preferred high volume ceiling</div>
                </button>
              </div>
            </div>

            {/* Continuous Thermal Envelope & Insulation */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-white uppercase">
                  Closed-Cell Thermal Envelope
                </label>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  R-{modelConfig.insulationRValue || 28} High Efficiency
                </span>
              </div>
              <input
                type="range"
                min="21"
                max="30"
                step="1"
                value={modelConfig.insulationRValue || 28}
                onChange={(e) => onUpdateModel({ insulationRValue: parseInt(e.target.value, 10) })}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>R-21 (Temperate Climate)</span>
                <span>R-30 (Alpine Extreme Cold / Desert)</span>
              </div>
            </div>

            {/* Foundation Engineering */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <label className="text-xs font-mono font-bold text-white uppercase block">
                Foundation Engineering Footing
              </label>
              <div className="grid grid-cols-2 gap-2 font-mono">
                {[
                  { id: 'concrete-piers', label: 'Concrete Piers', desc: 'Sloped & hillside terrain' },
                  { id: 'concrete-slab', label: 'Engineered Slab', desc: 'Level rock solid foundation' },
                  { id: 'helical-piles', label: 'Helical Steel Piles', desc: 'Eco zero-excavation' },
                  { id: 'gravel-pad', label: 'Compacted Gravel', desc: 'Temporary / ADU placement' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onUpdateModel({ foundationType: f.id as FoundationType })}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      modelConfig.foundationType === f.id
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold'
                        : 'border-slate-800 bg-[#080d16] text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{f.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STEP 3: EXTERIOR & FACADE                                               */}
        {/* ----------------------------------------------------------------------- */}
        {activeStep.id === 'facade' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Luxury Facade Cladding Materials */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                Architectural Facade Cladding
              </label>
              <div className="space-y-2">
                {FACADE_MATERIALS.map((mat) => {
                  const isSelected = modelConfig.exteriorMaterial === mat.id;
                  return (
                    <button
                      key={mat.id}
                      onClick={() => onUpdateModel({ exteriorMaterial: mat.id })}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                          : 'border-slate-800 bg-[#0c121e] hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 rounded-lg shadow-inner border border-white/20 shrink-0"
                          style={{ backgroundColor: mat.colorHex }}
                        />
                        <div>
                          <div
                            className={`font-heading text-xs font-bold ${
                              isSelected ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {mat.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {mat.subtitle}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#00f0ff] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Container Exterior Marine Patina Colors */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-white uppercase">
                  Marine Industrial Patina Color
                </label>
                <span className="text-xs font-mono text-[#00f0ff] font-bold">
                  {modelConfig.colorName || 'Custom'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {CONTAINER_COLOR_PALETTE.map((c) => {
                  const isCurrent = modelConfig.exteriorColor === c.hex;
                  return (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateModel({ exteriorColor: c.hex, colorName: c.name })}
                      className={`h-10 rounded-xl transition-all border flex items-center justify-center relative ${
                        isCurrent
                          ? 'border-[#00f0ff] ring-2 ring-[#00f0ff]/50 scale-105 shadow-md'
                          : 'border-slate-800 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {isCurrent && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Architectural Glass Tint */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <label className="text-xs font-mono font-bold text-white uppercase block">
                Glazing Spec &amp; Thermal Tint
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GLASS_TINTS.map((tint) => {
                  const isCurrent = modelConfig.glassTint === tint.id;
                  return (
                    <button
                      key={tint.id}
                      onClick={() => onUpdateModel({ glassTint: tint.id })}
                      className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 ${
                        isCurrent
                          ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold'
                          : 'border-slate-800 bg-[#080d16] text-slate-400'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: tint.tintHex }}
                      />
                      <span className="text-xs font-medium text-white truncate">{tint.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Operable Doors & Architectural Apertures */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-[#00f0ff]/40 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <DoorOpen className="w-4 h-4 text-[#00f0ff]" />
                  <span>Operable Doors &amp; Openings</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  REAL-TIME 3D
                </span>
              </div>

              {/* Direct 3D Interaction Guideline Tip */}
              <div className="p-3 rounded-lg bg-[#070c14] border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1 text-[#00f0ff] shrink-0 mt-0.5">
                  <MousePointer className="w-3.5 h-3.5" />
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <p className="leading-relaxed">
                  <strong className="text-white">Direct 3D Interaction:</strong> Click any door or window directly on PC with your mouse cursor, or tap once on your mobile phone to open and close it in real-time.
                </p>
              </div>

              {/* Front Main Entrance Door Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#080d16] border border-slate-800">
                <div>
                  <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span>Front Entrance Porch Door</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Architectural wooden front door swinging 90°
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onUpdateModel({ frontDoorOpen: !modelConfig.frontDoorOpen });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                    modelConfig.frontDoorOpen
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {modelConfig.frontDoorOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
                  <span>{modelConfig.frontDoorOpen ? 'OPEN' : 'CLOSED'}</span>
                </button>
              </div>

              {/* Industrial End Cargo Doors Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#080d16] border border-slate-800">
                <div>
                  <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span>Dual End Cargo Doors</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Original heavy container double doors with lock bars
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onUpdateModel({ cargoDoorsOpen: !modelConfig.cargoDoorsOpen });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                    modelConfig.cargoDoorsOpen
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {modelConfig.cargoDoorsOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
                  <span>{modelConfig.cargoDoorsOpen ? 'OPEN' : 'CLOSED'}</span>
                </button>
              </div>
            </div>

            {/* Panoramic Openings & Glazing Management */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-white uppercase">
                  Glazing &amp; Sliding Doors ({(modelConfig.openings || []).length})
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAddOpening('sliding-door-12ft')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 text-[#00f0ff] text-xs font-mono font-bold transition"
                  >
                    <Plus className="w-3 h-3" /> +12ft Slider
                  </button>
                  <button
                    onClick={() => handleAddOpening('picture-window')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition"
                  >
                    <Plus className="w-3 h-3" /> +Window
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(modelConfig.openings || []).map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#080d16] border border-slate-800/80 text-xs font-mono"
                  >
                    <div>
                      <span className="text-white font-bold block capitalize">
                        {op.type.replace(/-/g, ' ')}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        Wall: {op.wall.toUpperCase()} &bull; Offset: {op.positionFt}ft &bull; Size:{' '}
                        {op.widthFt}×{op.heightFt}ft
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const nextState = !op.isOpen;
                          const updated = (modelConfig.openings || []).map((o) =>
                            o.id === op.id ? { ...o, isOpen: nextState } : o
                          );
                          onUpdateModel({ openings: updated });
                          soundFx.playClick(720);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                          op.isOpen
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Toggle Open/Close in 3D"
                      >
                        {op.isOpen ? <DoorOpen className="w-3 h-3" /> : <DoorClosed className="w-3 h-3" />}
                        <span>{op.isOpen ? 'OPEN' : 'CLOSED'}</span>
                      </button>
                      <button
                        onClick={() => handleRemoveOpening(op.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Remove Opening"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STEP 4: INTERIOR & LIVING                                               */}
        {/* ----------------------------------------------------------------------- */}
        {activeStep.id === 'interior' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 3D Cutaway Roof Inspector Toggle */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#00f0ff]/15 to-[#0080ff]/10 border border-[#00f0ff]/40 flex items-center justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-1.5 text-[#00f0ff] font-bold text-xs font-mono uppercase">
                  <Eye className="w-4 h-4" />
                  <span>3D Cutaway Roof Inspector</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Reveal internal floor plan, partitions &amp; designer furnishings
                </p>
              </div>
              <button
                onClick={() => onUpdateModel({ cutawayRoof: !modelConfig.cutawayRoof })}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition shadow ${
                  modelConfig.cutawayRoof
                    ? 'bg-[#00f0ff] text-black shadow-[0_0_12px_#00f0ff]'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {modelConfig.cutawayRoof ? 'Roof Cutaway ON' : 'Show Roof'}
              </button>
            </div>

            {/* Architectural Circulation & Ensuite Bath Configuration */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-[#00f0ff]" />
                  <label className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Architectural Flow &amp; Washroom Access
                  </label>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                  CORRIDOR FLOW
                </span>
              </div>

              {/* Ensuite vs Corridor Access Switch */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block font-mono">
                  Washroom Entry Placement:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundFx.playClick(650);
                      onUpdateModel({ attachedBath: false });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      !modelConfig.attachedBath
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]'
                        : 'border-slate-800 bg-[#080d16] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-heading text-xs font-bold text-white flex items-center justify-between">
                      <span>Corridor Access</span>
                      {!modelConfig.attachedBath && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                      Access from central hallway. Zero walk-through to bedroom.
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick(650);
                      onUpdateModel({ attachedBath: true });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      modelConfig.attachedBath
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]'
                        : 'border-slate-800 bg-[#080d16] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-heading text-xs font-bold text-white flex items-center justify-between">
                      <span>Attached Ensuite</span>
                      {modelConfig.attachedBath && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                      Private entrance directly inside the master suite.
                    </div>
                  </button>
                </div>
              </div>

              {/* Bathroom Door Type Switch */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 block font-mono">
                  Bathroom Door Style:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundFx.playClick(600);
                      onUpdateModel({ bathroomDoorType: 'sliding' });
                    }}
                    className={`p-2 rounded-lg border text-left text-xs font-mono transition flex items-center justify-between ${
                      (modelConfig.bathroomDoorType || 'sliding') === 'sliding'
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-white font-bold'
                        : 'border-slate-800 bg-[#080d16] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Sliding Pocket Door</span>
                    {(modelConfig.bathroomDoorType || 'sliding') === 'sliding' && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick(600);
                      onUpdateModel({ bathroomDoorType: 'hinged' });
                    }}
                    className={`p-2 rounded-lg border text-left text-xs font-mono transition flex items-center justify-between ${
                      modelConfig.bathroomDoorType === 'hinged'
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-white font-bold'
                        : 'border-slate-800 bg-[#080d16] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Hinged Swivel Door</span>
                    {modelConfig.bathroomDoorType === 'hinged' && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Room Dimensions in Feet & Square Footage Summary */}
            {(() => {
              const unitL = modelConfig.lengthFt;
              const unitW = modelConfig.layoutType === 'double-wide' ? 16 : modelConfig.widthFt;
              const is20 = unitL <= 24;
              const bedL = is20 ? 7.5 : (unitL >= 36 ? 12.0 : 9.8);
              const bathL = is20 ? 5.5 : 7.5;
              const kitchenL = is20 ? 5.5 : 9.5;
              const livingL = unitL - (bedL + bathL + (is20 ? 0 : kitchenL));
              const totalSqFt = Math.round(unitL * unitW * (modelConfig.layoutType === 'stacked-2story' ? 2 : 1));

              return (
                <div className="p-4 rounded-xl bg-[#0d1524] border border-[#00f0ff]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-[#00f0ff]" />
                      Room Sizes &amp; Footprint in Feet
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00f0ff]">
                      {totalSqFt} SQ FT TOTAL
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-[#080d16] border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">MASTER SUITE</span>
                      <span className="text-white font-bold">{bedL.toFixed(1)}' × {unitW.toFixed(1)}'</span>
                      <span className="text-slate-400 text-[10px] block">({Math.round(bedL * unitW)} sq ft)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#080d16] border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">SPA BATHROOM</span>
                      <span className="text-white font-bold">{bathL.toFixed(1)}' × 5.2'</span>
                      <span className="text-slate-400 text-[10px] block">({Math.round(bathL * 5.2)} sq ft)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#080d16] border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">CIRCULATION CORRIDOR</span>
                      <span className="text-white font-bold">{bathL.toFixed(1)}' × 2.8'</span>
                      <span className="text-emerald-400 text-[10px] block font-bold">(Unobstructed)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#080d16] border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">CHEF KITCHEN</span>
                      <span className="text-white font-bold">{kitchenL.toFixed(1)}' × {unitW.toFixed(1)}'</span>
                      <span className="text-slate-400 text-[10px] block">({Math.round(kitchenL * unitW)} sq ft)</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Interior Design Archetype */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                Interior Design Aesthetic
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'nordic-white', label: 'Nordic Clean', desc: 'White shiplap & bleached pine' },
                  { id: 'dark-loft', label: 'Modern Dark Loft', desc: 'Charcoal oak & matte black' },
                  { id: 'minimalist-oak', label: 'Minimalist Birch', desc: 'Blonde Scandinavian oak' },
                  { id: 'industrial-concrete', label: 'Industrial Studio', desc: 'Polished concrete & raw steel' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onUpdateModel({ interiorStyle: s.id as InteriorStyle })}
                    className={`p-3 rounded-xl border text-left transition ${
                      modelConfig.interiorStyle === s.id
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]'
                        : 'border-slate-800 bg-[#0c121e] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-heading text-xs font-bold text-white">{s.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Luxury Flooring Materials */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <label className="text-xs font-mono font-bold text-white uppercase block">
                Luxury Architectural Flooring
              </label>
              <div className="space-y-1.5">
                {FLOORING_OPTIONS.map((floor) => {
                  const isSelected = modelConfig.flooringMaterial === floor.id;
                  return (
                    <button
                      key={floor.id}
                      onClick={() => onUpdateModel({ flooringMaterial: floor.id })}
                      className={`w-full p-2.5 rounded-lg border flex items-center justify-between text-left transition ${
                        isSelected
                          ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold'
                          : 'border-slate-800 bg-[#080d16] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded shadow-sm border border-white/20"
                          style={{ backgroundColor: floor.colorHex }}
                        />
                        <span className="text-xs font-medium text-white">{floor.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#00f0ff]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dedicated Room Architectural Styles (Lounge, Kitchen, Bathroom, Bedroom) */}
            <div className="space-y-4">
              {/* 1. Lounge / Living Room Style */}
              <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-[#00f0ff]" />
                    <label className="text-xs font-mono font-bold text-white uppercase">
                      Lounge &amp; Living Room Architecture
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-[#00f0ff]">5 Styles</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {ROOM_STYLE_OPTIONS.lounges.map((opt) => {
                    const isSelected = (modelConfig.loungeType || 'great-room') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          soundFx.playClick(650);
                          onUpdateModel({ loungeType: opt.id as LoungeType, cutawayRoof: true });
                        }}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]'
                            : 'border-slate-800/80 bg-[#080d16] text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-heading text-xs font-bold text-white">{opt.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{opt.subtitle}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#00f0ff] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Kitchen & Dining Style */}
              <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <label className="text-xs font-mono font-bold text-white uppercase">
                      Chef Kitchen &amp; Dining Architecture
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">5 Styles</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {ROOM_STYLE_OPTIONS.kitchens.map((opt) => {
                    const isSelected = (modelConfig.kitchenType || 'chef-island') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          soundFx.playClick(650);
                          onUpdateModel({ kitchenType: opt.id as KitchenType, cutawayRoof: true });
                        }}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                            : 'border-slate-800/80 bg-[#080d16] text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-heading text-xs font-bold text-white">{opt.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{opt.subtitle}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Bathroom & Spa Style */}
              <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bath className="w-4 h-4 text-teal-400" />
                    <label className="text-xs font-mono font-bold text-white uppercase">
                      Bathroom &amp; Spa Sanctuary
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-teal-400">5 Styles</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {ROOM_STYLE_OPTIONS.bathrooms.map((opt) => {
                    const isSelected = (modelConfig.bathroomType || 'luxury-spa') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          soundFx.playClick(650);
                          onUpdateModel({ bathroomType: opt.id as BathroomType, cutawayRoof: true });
                        }}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-teal-400 bg-teal-400/15 text-teal-300'
                            : 'border-slate-800/80 bg-[#080d16] text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-heading text-xs font-bold text-white">{opt.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{opt.subtitle}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-teal-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Bedroom Suite Style */}
              <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-purple-400" />
                    <label className="text-xs font-mono font-bold text-white uppercase">
                      Bedroom Suite &amp; Accommodations
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400">5 Styles</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {ROOM_STYLE_OPTIONS.bedrooms.map((opt) => {
                    const isSelected = (modelConfig.bedroomType || 'master-suite') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          soundFx.playClick(650);
                          onUpdateModel({ bedroomType: opt.id as BedroomType, cutawayRoof: true });
                        }}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                            : 'border-slate-800/80 bg-[#080d16] text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-heading text-xs font-bold text-white">{opt.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{opt.subtitle}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Room Layout & Living Zones */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-mono font-bold text-white uppercase block">
                    Room Layout &amp; Living Zones ({(modelConfig.partitions || []).length} Rooms)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Add, reposition, customize, and furnish each room inside the house.
                  </p>
                </div>

                {/* Quick Cutaway Roof Toggle */}
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onUpdateModel({ cutawayRoof: !modelConfig.cutawayRoof });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                    modelConfig.cutawayRoof
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : 'bg-[#162032] text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Toggle roof cutaway to see and inspect inside the rooms in 3D"
                >
                  <Eye className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span>{modelConfig.cutawayRoof ? 'Roof Cutaway (ON)' : 'See Inside Rooms'}</span>
                </button>
              </div>

              {/* Visual Container Room Distribution Strip */}
              <div className="space-y-1.5 bg-[#080d16] p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>0 ft (Rear)</span>
                  <span className="text-[#00f0ff] font-bold">1:1 Floorplan Distribution</span>
                  <span>{modelConfig.lengthFt} ft (Front)</span>
                </div>
                <div className="relative w-full h-8 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex">
                  {(modelConfig.partitions || []).map((part, idx) => {
                    const roomColors: Record<string, string> = {
                      bedroom: 'bg-blue-600/70 border-blue-400/50 text-blue-200',
                      bathroom: 'bg-teal-600/70 border-teal-400/50 text-teal-200',
                      kitchen: 'bg-amber-600/70 border-amber-400/50 text-amber-200',
                      living: 'bg-emerald-600/70 border-emerald-400/50 text-emerald-200',
                      office: 'bg-purple-600/70 border-purple-400/50 text-purple-200',
                    };
                    const badgeClass = roomColors[part.roomType] || 'bg-slate-700 border-slate-500 text-white';
                    return (
                      <div
                        key={part.id || idx}
                        className={`flex-1 flex items-center justify-center border-r last:border-r-0 text-[10px] font-mono font-bold truncate px-1 transition ${badgeClass}`}
                        title={`${part.name} (${part.roomType.toUpperCase()}) @ ${part.positionFt}ft`}
                      >
                        {part.name}
                      </div>
                    );
                  })}
                  {(modelConfig.partitions || []).length === 0 && (
                    <div className="w-full flex items-center justify-center text-[10px] font-mono text-slate-500 italic">
                      Open Studio (No Partitions)
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Add Room Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  + Add Room to Layout:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleAddRoom('bedroom')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#111927] hover:bg-blue-950/50 hover:border-blue-500/50 border border-slate-800 text-[11px] font-mono text-slate-200 hover:text-white transition"
                  >
                    <Plus className="w-3 h-3 text-blue-400" />
                    <span>+ Bedroom</span>
                  </button>
                  <button
                    onClick={() => handleAddRoom('bathroom')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#111927] hover:bg-teal-950/50 hover:border-teal-500/50 border border-slate-800 text-[11px] font-mono text-slate-200 hover:text-white transition"
                  >
                    <Plus className="w-3 h-3 text-teal-400" />
                    <span>+ Bathroom</span>
                  </button>
                  <button
                    onClick={() => handleAddRoom('kitchen')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#111927] hover:bg-amber-950/50 hover:border-amber-500/50 border border-slate-800 text-[11px] font-mono text-slate-200 hover:text-white transition"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>+ Kitchen</span>
                  </button>
                  <button
                    onClick={() => handleAddRoom('living')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#111927] hover:bg-emerald-950/50 hover:border-emerald-500/50 border border-slate-800 text-[11px] font-mono text-slate-200 hover:text-white transition"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>+ Living Room</span>
                  </button>
                  <button
                    onClick={() => handleAddRoom('office')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#111927] hover:bg-purple-950/50 hover:border-purple-500/50 border border-slate-800 text-[11px] font-mono text-slate-200 hover:text-white transition"
                  >
                    <Plus className="w-3 h-3 text-purple-400" />
                    <span>+ Office Studio</span>
                  </button>
                </div>
              </div>

              {/* Editable Room Cards List */}
              <div className="space-y-3 pt-1">
                {(modelConfig.partitions || []).map((part) => (
                  <div
                    key={part.id}
                    className="p-3 rounded-xl bg-[#080d16] border border-slate-800 hover:border-slate-700 space-y-2.5 transition"
                  >
                    {/* Header: Type, Name & Delete */}
                    <div className="flex items-center gap-2">
                      <select
                        value={part.roomType}
                        onChange={(e) =>
                          handleUpdateRoom(part.id, {
                            roomType: e.target.value as any,
                          })
                        }
                        className="bg-[#111827] border border-slate-700 text-xs font-mono text-[#00f0ff] rounded-lg px-2 py-1 outline-none focus:border-[#00f0ff]"
                      >
                        <option value="bedroom">Bedroom</option>
                        <option value="bathroom">Bathroom</option>
                        <option value="kitchen">Kitchen</option>
                        <option value="living">Living Room</option>
                        <option value="office">Home Office</option>
                      </select>

                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) =>
                          handleUpdateRoom(part.id, { name: e.target.value })
                        }
                        placeholder="Room Label"
                        className="flex-1 bg-[#111827] border border-slate-700 text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-[#00f0ff]"
                      />

                      <button
                        onClick={() => handleRemoveRoom(part.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Remove room partition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Position Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Partition Position:</span>
                        <span className="text-[#00f0ff] font-bold">{part.positionFt} ft</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={Math.max(modelConfig.lengthFt - 2, 4)}
                        step={1}
                        value={part.positionFt}
                        onChange={(e) =>
                          handleUpdateRoom(part.id, {
                            positionFt: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-[#00f0ff] cursor-pointer"
                      />
                    </div>

                    {/* Furnishing Checkbox */}
                    <label className="flex items-center gap-2 text-[11px] font-mono text-slate-300 cursor-pointer pt-1 border-t border-slate-800/80">
                      <input
                        type="checkbox"
                        checked={part.furnishings}
                        onChange={(e) =>
                          handleUpdateRoom(part.id, {
                            furnishings: e.target.checked,
                          })
                        }
                        className="rounded accent-[#00f0ff]"
                      />
                      <span>3D Designer Furnishings (bed, island, sofa, fixtures)</span>
                    </label>
                  </div>
                ))}

                {(modelConfig.partitions || []).length === 0 && (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 font-mono">
                    No interior room partitions yet. Click one of the buttons above to add a bedroom, bathroom, kitchen, or living room!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STEP 5: ROOF & OUTDOOR LIVING                                           */}
        {/* ----------------------------------------------------------------------- */}
        {activeStep.id === 'outdoor' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Rooftop Architectural System */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                Rooftop Architectural System
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'flat-standard', label: 'Flat Corrugated', desc: 'Standard industrial steel roof' },
                  { id: 'deck-wood', label: 'Cedar Rooftop Deck', desc: 'Entertainer deck with glass balustrade' },
                  { id: 'solar-panels', label: 'Solar PV Array', desc: 'High-efficiency clean energy roof' },
                  { id: 'green-roof', label: 'Sedum Green Meadow', desc: 'Vegetative eco living roof' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onUpdateModel({ roofOption: r.id as RoofOption })}
                    className={`p-3 rounded-xl border text-left transition ${
                      modelConfig.roofOption === r.id
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]'
                        : 'border-slate-800 bg-[#0c121e] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-heading text-xs font-bold text-white">{r.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Solar PV Array Capacity Slider if Solar selected */}
            {modelConfig.roofOption === 'solar-panels' && (
              <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-white uppercase">
                    Solar Generation Array
                  </label>
                  <span className="font-mono text-xs font-bold text-[#00f0ff]">
                    {modelConfig.solarCapacityKw || 6.2} kW (
                    {modelConfig.solarPanelsCount || 14} Bifacial Panels)
                  </span>
                </div>
                <input
                  type="range"
                  min="2.4"
                  max="12.0"
                  step="0.6"
                  value={modelConfig.solarCapacityKw || 6.2}
                  onChange={(e) => {
                    const kw = parseFloat(e.target.value);
                    onUpdateModel({
                      solarCapacityKw: kw,
                      solarPanelsCount: Math.round(kw * 2.2),
                    });
                  }}
                  className="w-full accent-[#00f0ff] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>2.4 kW Essential</span>
                  <span>12.0 kW 100% Off-Grid Net-Zero</span>
                </div>
              </div>
            )}

            {/* Outdoor Luxury Living Amenities */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-3">
              <label className="text-xs font-mono font-bold text-white uppercase block">
                Outdoor Leisure Amenities
              </label>
              <div className="space-y-2">
                {[
                  {
                    key: 'plungePool',
                    label: 'Integrated Plunge Pool / Onsen Spa',
                    desc: 'Deep cedar or stone plunge pool on terrace',
                    icon: Waves,
                  },
                  {
                    key: 'firePitLounge',
                    label: 'Sunken Modern Fire Pit Lounge',
                    desc: 'Linear gas fire pit surrounded by teak seating',
                    icon: Flame,
                  },
                  {
                    key: 'pergolaCanopy',
                    label: 'Architectural Pergola Canopy',
                    desc: 'Powder-coated steel louvered pergola for sun shading',
                    icon: PanelTop,
                  },
                  {
                    key: 'cantileverBalcony',
                    label: 'Cantilever Upper Sunset Balcony',
                    desc: 'Floating 2nd-story panoramic sunset deck',
                    icon: Building,
                  },
                ].map((item) => {
                  const isChecked = Boolean(
                    modelConfig.outdoorAmenities?.[
                      item.key as keyof typeof modelConfig.outdoorAmenities
                    ]
                  );
                  return (
                    <button
                      key={item.key}
                      onClick={() =>
                        onUpdateModel({
                          outdoorAmenities: {
                            ...modelConfig.outdoorAmenities,
                            [item.key]: !isChecked,
                          },
                        })
                      }
                      className={`w-full p-2.5 rounded-lg border flex items-center justify-between text-left transition ${
                        isChecked
                          ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]'
                          : 'border-slate-800 bg-[#080d16] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-[#00f0ff]" />
                        <div>
                          <div className="text-xs font-bold text-white">{item.label}</div>
                          <div className="text-[10px] text-slate-400">{item.desc}</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-4 h-4 accent-[#00f0ff] pointer-events-none"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exterior Steel Staircase */}
            <div className="p-3.5 rounded-xl bg-[#0c121e] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-heading text-xs font-bold text-white block">
                  Exterior Matte Black Steel Staircase
                </span>
                <span className="text-[11px] text-slate-400">
                  Architectural spiral / straight flight staircase to roof deck
                </span>
              </div>
              <input
                type="checkbox"
                checked={modelConfig.staircase}
                onChange={(e) => onUpdateModel({ staircase: e.target.checked })}
                className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STEP 6: SUMMARY & QUOTE                                                 */}
        {/* ----------------------------------------------------------------------- */}
        {activeStep.id === 'quote' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Turnkey Investment Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#111e33] to-[#0a101b] border border-[#00f0ff]/50 shadow-xl space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00f0ff] font-bold">
                ESTIMATED TURNKEY INVESTMENT
              </span>
              <div className="flex items-baseline justify-between">
                <div className="font-heading text-3xl font-bold text-white tracking-tight">
                  ${costBreakdown.totalUsd.toLocaleString()}
                </div>
                <div className="font-mono text-xs text-[#00f0ff] font-semibold">
                  ${costBreakdown.costPerSqFt}/sq.ft &bull; {costBreakdown.sqFtTotal} sq.ft
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Estimated Financing:</span>
                <span className="text-white font-bold">
                  ${costBreakdown.monthlyFinancingUsd}/mo (15-yr at 6.5%)
                </span>
              </div>
            </div>

            {/* Factory Line-Item Bill of Materials */}
            <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-2.5 text-xs font-mono">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Itemized Production Breakdown
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cor-Ten Steel Shell &amp; Header Fab:</span>
                <span className="text-white font-semibold">
                  ${costBreakdown.containerShell.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Glazing &amp; Thermal Bifold Doors:</span>
                <span className="text-white font-semibold">
                  ${costBreakdown.openingsGlazing.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Continuous Spray Foam (R-28):</span>
                <span className="text-white font-semibold">
                  ${costBreakdown.insulationThermal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Architectural Interior &amp; Millwork:</span>
                <span className="text-white font-semibold">
                  ${costBreakdown.interiorFinishes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Off-Grid MEP &amp; Heat Pump:</span>
                <span className="text-white font-semibold">
                  ${costBreakdown.mepSystems.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rooftop Deck &amp; Solar PV Array:</span>
                <span className="text-white font-semibold">
                  ${costBreakdown.roofSystem.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Structural Foundation Footings:</span>
                <span className="text-white font-semibold">
                  ${costBreakdown.foundationEstimate.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-[#00f0ff] font-bold">
                <span>Factory Production Lead Time:</span>
                <span>{costBreakdown.constructionWeeks} Weeks Turnkey</span>
              </div>
            </div>

            {/* Instant Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  soundFx.playSuccess();
                  generateArchitecturalPdf(modelConfig, siteConfig, currentUser?.name);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00b4d8] hover:brightness-110 text-black font-heading text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition"
                title="Download certified architectural engineering PDF"
              >
                <Download className="w-4 h-4" />
                <span>Download Architectural PDF Blueprint</span>
              </button>

              <button
                onClick={onOpenSpecSheet}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <FileText className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>View Full CAD Specification Sheet</span>
              </button>

              <button
                onClick={onOpenARCamera}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0c121e] hover:bg-slate-800 text-slate-200 font-mono text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition"
              >
                <Camera className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>Preview in Augmented Reality on Your Property</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. FIXED BOTTOM NAVIGATION BAR WITH EXPLICIT BACK BUTTON                  */}
      {/* ========================================================================= */}
      <div className="p-4 bg-[#0a101b] border-t border-slate-800/90 shrink-0 space-y-3">
        {/* Navigation Buttons: [ < BACK ]  and  [ NEXT > ] */}
        <div className="flex items-center gap-2">
          {/* EXPLICIT BACK BUTTON */}
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-heading text-xs font-bold uppercase tracking-wider transition ${
              currentStepIndex > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm active:scale-[0.99]'
                : 'bg-slate-900/50 text-slate-600 border border-slate-800/50 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              {currentStepIndex > 0
                ? `Back: ${STEPS[currentStepIndex - 1].title.split('&')[0]}`
                : 'Back'}
            </span>
          </button>

          {/* NEXT / SAVE BUTTON */}
          <button
            onClick={handleNextStep}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00b4d8] text-black font-heading text-xs font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,240,255,0.35)] hover:opacity-95 active:scale-[0.99]"
          >
            {currentStepIndex < STEPS.length - 1 ? (
              <>
                <span>Next: {STEPS[currentStepIndex + 1].title.split('&')[0]}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>Save Project ✓</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
