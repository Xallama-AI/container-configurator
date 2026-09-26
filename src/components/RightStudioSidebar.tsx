import React, { useState } from 'react';
import { 
  Building, 
  Sofa,
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  Sparkles, 
  Home, 
  DoorOpen, 
  DoorClosed, 
  Palette, 
  Maximize2, 
  ShieldCheck, 
  Sun, 
  Compass, 
  Sliders, 
  SlidersHorizontal,
  Flame, 
  Waves, 
  TreePine, 
  Check, 
  Plus, 
  Trash2,
  Tv,
  Bath,
  BedDouble,
  Coffee,
  CheckCircle2,
  Lock,
  Unlock,
  Eye
} from 'lucide-react';
import { 
  ContainerModelConfig, 
  SitePlanningConfig,
  ExteriorMaterial, 
  FlooringMaterial, 
  GlassTint, 
  RoofOption, 
  FoundationType, 
  LoungeType, 
  KitchenType, 
  BathroomType, 
  BedroomType,
  KitchenColor,
  KitchenCountertop,
  BedroomPalette,
  SittingPalette,
  WashroomToiletType,
  WashroomWetType,
  WashroomTileStyle,
  ContainerOpening
} from '../types';
import { 
  PRESET_MODELS, 
  FACADE_MATERIALS, 
  FLOORING_OPTIONS, 
  GLASS_TINTS, 
  CONTAINER_COLOR_PALETTE 
} from '../data/presets';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';

interface RightStudioSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: 'houses' | 'edit';
  onTabChange: (tab: 'houses' | 'edit') => void;
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  onUpdateModel: (partial: Partial<ContainerModelConfig>) => void;
  onSelectHouse: (model: ContainerModelConfig) => void;
}

export const RightStudioSidebar: React.FC<RightStudioSidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  modelConfig,
  siteConfig,
  onUpdateModel,
  onSelectHouse,
}) => {
  const [editCategory, setEditCategory] = useState<
    'interior' | 'doors-windows' | 'facade' | 'roof-ground' | 'outdoor'
  >('interior');

  const [interiorSubcategory, setInteriorSubcategory] = useState<
    'kitchen' | 'bedroom' | 'sitting' | 'washroom'
  >('kitchen');

  const handleSelectPreset = (preset: ContainerModelConfig) => {
    if (preset.presetId === modelConfig.presetId) return;
    soundFx.playModeSwitch();
    onSelectHouse(preset);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.85, y: 0.6 },
    });
  };

  // Master Doors & Openings Toggle
  const allOpenings = modelConfig.openings || [];
  const anyDoorOpen = 
    !!modelConfig.frontDoorOpen || 
    !!modelConfig.cargoDoorsOpen || 
    !!modelConfig.bedroomDoorOpen || 
    !!modelConfig.bathroomDoorOpen || 
    allOpenings.some((o) => o.isOpen);

  const handleToggleAllDoors = () => {
    const nextState = !anyDoorOpen;
    if (nextState) {
      soundFx.playDoorOpen();
    } else {
      soundFx.playDoorClose();
    }
    onUpdateModel({
      frontDoorOpen: nextState,
      cargoDoorsOpen: nextState,
      bedroomDoorOpen: nextState,
      bathroomDoorOpen: nextState,
      interiorDoorsOpen: nextState,
      doorStates: {
        'interior-bath-door': nextState,
        'interior-bed-door': nextState,
      },
      openings: allOpenings.map((op) => ({ ...op, isOpen: nextState })),
    });
  };

  const handleToggleSingleOpening = (opId: string) => {
    const target = allOpenings.find((o) => o.id === opId);
    if (!target) return;
    const next = !target.isOpen;
    if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
    const updated = allOpenings.map((op) => {
      if (op.id === opId) {
        return { ...op, isOpen: next };
      }
      return op;
    });
    const isFrontDoor = target.wall === 'front' && (target.type.includes('door') || target.type.includes('bifold'));
    onUpdateModel({
      openings: updated,
      ...(isFrontDoor ? { frontDoorOpen: next } : {}),
    });
  };

  const handleAddOpening = (type: ContainerOpening['type'], wall: ContainerOpening['wall'] = 'front') => {
    soundFx.playClick();
    const isDoor = type.includes('door') || type.includes('bifold');
    const widthFt = type.includes('16ft') ? 16 : type.includes('12ft') ? 12 : type.includes('8ft') ? 8 : type.includes('6x3') ? 6 : 4;
    const heightFt = isDoor ? 8.2 : 4.0;
    const elevationFt = isDoor ? 0 : 2.5;

    // Place safely along wall
    const wallSpan = (wall === 'front' || wall === 'back') ? modelConfig.lengthFt : modelConfig.widthFt;
    const positionFt = Math.max(1.0, Math.min(10, wallSpan - widthFt - 1.0));

    const newOpening: ContainerOpening = {
      id: `op-${Date.now()}`,
      type,
      wall,
      positionFt,
      widthFt,
      heightFt,
      elevationFt,
      isOpen: false,
    };

    onUpdateModel({
      openings: [...allOpenings, newOpening],
    });
  };

  const handleDeleteOpening = (id: string) => {
    soundFx.playClick();
    onUpdateModel({
      openings: allOpenings.filter((op) => op.id !== id),
    });
  };

  return (
    <>
      {/* Floating Toggle Tab when right sidebar is closed */}
      {!isOpen && (
        <div className="studio-shortcuts absolute top-20 right-3 z-30 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => {
              onTabChange('edit');
              onToggle();
              soundFx.playClick();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0b101c]/95 hover:bg-[#121b30] border border-[#00f0ff]/50 text-[#00f0ff] backdrop-blur-xl shadow-[0_4px_25px_rgba(0,240,255,0.25)] transition hover:scale-105 select-none"
            title="Open Live Architectural Edit Bar"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#00f0ff]" />
            <SlidersHorizontal className="w-4 h-4 text-[#00f0ff]" />
            <span className="font-mono text-xs font-bold tracking-wider">EDIT BAR</span>
          </button>

          <button
            onClick={() => {
              onTabChange('houses');
              onToggle();
              soundFx.playClick();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#090c10]/95 hover:bg-[#101419] border border-[#00f0ff]/30 text-[#00f0ff] backdrop-blur-md shadow-[0_4px_18px_rgba(0,240,255,0.12)] transition hover:scale-105 select-none"
            title="Open Houses & Architecture Models Gallery"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#00f0ff]" />
            <Home className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-mono text-[11px] font-bold tracking-wider">HOUSES</span>
          </button>
        </div>
      )}

      {/* Docked Right Sidebar */}
      <aside
        className={`studio-panel absolute top-0 bottom-0 right-0 z-30 w-80 sm:w-[410px] flex flex-col bg-[#070b14]/96 backdrop-blur-2xl border-l border-slate-800/90 shadow-[-8px_0_40px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Switcher Tabs: HOUSES vs EDIT BAR */}
        <div className="px-3 pt-3 pb-2 border-b border-slate-800/80 bg-[#0a0f1d]/90">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-slate-800 w-full">
              <button
                onClick={() => {
                  onTabChange('edit');
                  soundFx.playClick();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-heading text-xs font-bold transition tracking-wider ${
                  activeTab === 'edit'
                    ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>EDIT BAR</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('houses');
                  soundFx.playClick();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-heading text-xs font-bold transition tracking-wider ${
                  activeTab === 'houses'
                    ? 'bg-[#00f0ff] text-black shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>CHANGE HOUSES</span>
              </button>
            </div>

            <button
              onClick={onToggle}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition flex-shrink-0"
              title="Close Right Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Door Master Control Strip */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-slate-800/90 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${anyDoorOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-slate-300 font-semibold text-[11px]">
                {anyDoorOpen ? 'DOORS & WINDOWS: OPEN' : 'DOORS & WINDOWS: CLOSED'}
              </span>
            </div>
            <button
              onClick={handleToggleAllDoors}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider transition ${
                anyDoorOpen
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {anyDoorOpen ? 'CLOSE ALL' : 'OPEN ALL'}
            </button>
          </div>
        </div>

        {/* TAB 1: EDIT BAR CONTENT */}
        {activeTab === 'edit' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Category Navigation Bar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800/80 bg-[#090e1b]/70 overflow-x-auto text-[11px] font-mono scrollbar-none">
              <button
                onClick={() => { setEditCategory('interior'); soundFx.playClick(); }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition ${
                  editCategory === 'interior'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Sofa className="h-3.5 w-3.5" aria-hidden="true" /> INTERIOR
              </button>
              <button
                onClick={() => { setEditCategory('doors-windows'); soundFx.playClick(); }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition ${
                  editCategory === 'doors-windows'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" /> DOORS &amp; WINDOWS
              </button>
              <button
                onClick={() => { setEditCategory('facade'); soundFx.playClick(); }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition ${
                  editCategory === 'facade'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Palette className="h-3.5 w-3.5" aria-hidden="true" /> FACADE
              </button>
              <button
                onClick={() => { setEditCategory('roof-ground'); soundFx.playClick(); }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition ${
                  editCategory === 'roof-ground'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Building className="h-3.5 w-3.5" aria-hidden="true" /> ROOF &amp; GROUND
              </button>
              <button
                onClick={() => { setEditCategory('outdoor'); soundFx.playClick(); }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition ${
                  editCategory === 'outdoor'
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <TreePine className="h-3.5 w-3.5" aria-hidden="true" /> OUTDOOR
              </button>
            </div>

            {/* Subcategory View: INTERIOR ROOMS */}
            {editCategory === 'interior' && (
              <div className="p-3.5 space-y-4 flex-1">
                {/* Room Tabs: Kitchen, Bedroom, Sitting, Washroom */}
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/40 border border-slate-800">
                  <button
                    onClick={() => { setInteriorSubcategory('kitchen'); soundFx.playClick(); }}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-[10px] font-bold transition ${
                      interiorSubcategory === 'kitchen'
                        ? 'bg-[#00f0ff]/12 text-[#00f0ff] border border-[#00f0ff]/30 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Coffee className="mx-auto mb-1 h-3.5 w-3.5" aria-hidden="true" /> KITCHEN
                  </button>
                  <button
                    onClick={() => { setInteriorSubcategory('bedroom'); soundFx.playClick(); }}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-[10px] font-bold transition ${
                      interiorSubcategory === 'bedroom'
                        ? 'bg-[#00f0ff]/12 text-[#00f0ff] border border-[#00f0ff]/30 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BedDouble className="mx-auto mb-1 h-3.5 w-3.5" aria-hidden="true" /> BEDROOM
                  </button>
                  <button
                    onClick={() => { setInteriorSubcategory('sitting'); soundFx.playClick(); }}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-[10px] font-bold transition ${
                      interiorSubcategory === 'sitting'
                        ? 'bg-[#00f0ff]/12 text-[#00f0ff] border border-[#00f0ff]/30 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sofa className="mx-auto mb-1 h-3.5 w-3.5" aria-hidden="true" /> SITTING
                  </button>
                  <button
                    onClick={() => { setInteriorSubcategory('washroom'); soundFx.playClick(); }}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-[10px] font-bold transition ${
                      interiorSubcategory === 'washroom'
                        ? 'bg-[#00f0ff]/12 text-[#00f0ff] border border-[#00f0ff]/30 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bath className="mx-auto mb-1 h-3.5 w-3.5" aria-hidden="true" /> WASHROOM
                  </button>
                </div>

                {/* 1. KITCHEN STYLING */}
                {interiorSubcategory === 'kitchen' && (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Cabinet Finish & Color
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'matte-obsidian', name: 'Matte Obsidian', bg: '#171717', border: '#404040' },
                          { id: 'scandinavian-oak', name: 'Nordic Oak', bg: '#b58b57', border: '#d4af37' },
                          { id: 'navy-blue', name: 'Navy Blue', bg: '#0f2744', border: '#1e40af' },
                          { id: 'marble-white', name: 'Marble White', bg: '#f1f5f9', border: '#cbd5e1', textDark: true },
                          { id: 'forest-green', name: 'Forest Green', bg: '#1c3829', border: '#15803d' },
                          { id: 'smoked-charcoal', name: 'Charcoal', bg: '#334155', border: '#64748b' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              onUpdateModel({ kitchenColor: c.id as KitchenColor });
                              soundFx.playClick();
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-mono transition ${
                              (modelConfig.kitchenColor || 'matte-obsidian') === c.id
                                ? 'border-[#00f0ff] ring-1 ring-[#00f0ff] bg-black/60 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border shadow-inner"
                              style={{ backgroundColor: c.bg, borderColor: c.border }}
                            />
                            <span className="text-slate-300 truncate w-full text-center">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Countertop Surface Material
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'calacatta-quartz', name: 'Calacatta Quartz', desc: 'Italian veined marble' },
                          { id: 'black-granite', name: 'Honed Black Granite', desc: 'Matte architectural' },
                          { id: 'butcherblock-oak', name: 'Solid Oak Wood', desc: 'Natural oil sealed' },
                          { id: 'brushed-stainless', name: 'Brushed Stainless', desc: 'Commercial chef grade' },
                        ].map((ct) => (
                          <button
                            key={ct.id}
                            onClick={() => {
                              onUpdateModel({ kitchenCountertop: ct.id as KitchenCountertop });
                              soundFx.playClick();
                            }}
                            className={`p-2.5 rounded-xl border text-left font-mono transition ${
                              (modelConfig.kitchenCountertop || 'calacatta-quartz') === ct.id
                                ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{ct.name}</span>
                              {(modelConfig.kitchenCountertop || 'calacatta-quartz') === ct.id && (
                                <Check className="w-3.5 h-3.5 text-[#00f0ff]" />
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{ct.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Kitchen Layout Type
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                        {[
                          { id: 'chef-island', name: 'Chef Marble Island' },
                          { id: 'galley', name: 'Parallel Galley' },
                          { id: 'breakfast-bar', name: 'Breakfast Bar' },
                          { id: 'linear-minimal', name: 'Linear Wall Bar' },
                        ].map((k) => (
                          <button
                            key={k.id}
                            onClick={() => {
                              onUpdateModel({ kitchenType: k.id as KitchenType });
                              soundFx.playClick();
                            }}
                            className={`p-2 rounded-xl border text-left font-semibold transition ${
                              (modelConfig.kitchenType || 'chef-island') === k.id
                                ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {k.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BEDROOM STYLING */}
                {interiorSubcategory === 'bedroom' && (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Bed Textiles & Linen Palette
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'warm-linen', name: 'Warm Linen', bg: '#d7c4b7', border: '#a89284' },
                          { id: 'charcoal-grey', name: 'Charcoal Wool', bg: '#334155', border: '#475569' },
                          { id: 'sage-green', name: 'Sage Green', bg: '#5c7a68', border: '#7e9a8a' },
                          { id: 'terracotta-clay', name: 'Terracotta', bg: '#a35038', border: '#c86b50' },
                          { id: 'midnight-navy', name: 'Midnight Navy', bg: '#172554', border: '#1e40af' },
                        ].map((b) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              onUpdateModel({ bedroomPalette: b.id as BedroomPalette });
                              soundFx.playClick();
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-mono transition ${
                              (modelConfig.bedroomPalette || 'warm-linen') === b.id
                                ? 'border-[#00f0ff] ring-1 ring-[#00f0ff] bg-black/60'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border shadow-inner"
                              style={{ backgroundColor: b.bg, borderColor: b.border }}
                            />
                            <span className="text-slate-300 truncate w-full text-center">{b.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Bedroom Suite Architecture
                      </label>
                      <div className="space-y-1.5">
                        {[
                          { id: 'master-suite', name: 'Master King Suite', desc: 'King bed, twin sconces, acoustic slatted headboard' },
                          { id: 'japandi-platform', name: 'Japandi Low Tatami', desc: 'Low oak platform bed, washi lanterns, bonsai bench' },
                          { id: 'executive-study', name: 'Studio & Work Suite', desc: 'Queen bed with integrated walnut study desk' },
                          { id: 'dual-bunk', name: 'Dual Architectural Bunks', desc: 'Built-in double bunks with steel ladders' },
                        ].map((suite) => (
                          <button
                            key={suite.id}
                            onClick={() => {
                              onUpdateModel({ bedroomType: suite.id as BedroomType });
                              soundFx.playClick();
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left font-mono transition ${
                              (modelConfig.bedroomType || 'master-suite') === suite.id
                                ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{suite.name}</span>
                              {(modelConfig.bedroomType || 'master-suite') === suite.id && (
                                <Check className="w-3.5 h-3.5 text-[#00f0ff]" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{suite.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SITTING / LOUNGE STYLING */}
                {interiorSubcategory === 'sitting' && (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Sofa Upholstery & Finish
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'warm-cognac', name: 'Cognac Leather', bg: '#8a4b22', border: '#b86632' },
                          { id: 'charcoal-boucle', name: 'Charcoal Bouclé', bg: '#2b2f38', border: '#4b5563' },
                          { id: 'sand-beige', name: 'Sand Beige', bg: '#d4c5b3', border: '#9ca3af' },
                          { id: 'emerald-velvet', name: 'Emerald Velvet', bg: '#064e3b', border: '#059669' },
                          { id: 'slate-grey', name: 'Slate Grey', bg: '#475569', border: '#64748b' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              onUpdateModel({ sittingPalette: s.id as SittingPalette });
                              soundFx.playClick();
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-mono transition ${
                              (modelConfig.sittingPalette || 'warm-cognac') === s.id
                                ? 'border-[#00f0ff] ring-1 ring-[#00f0ff] bg-black/60'
                                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border shadow-inner"
                              style={{ backgroundColor: s.bg, borderColor: s.border }}
                            />
                            <span className="text-slate-300 truncate w-full text-center">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Lounge Centerpiece Feature
                      </label>
                      <div className="space-y-1.5">
                        {[
                          { id: 'tv-media', name: '75" 4K OLED Cinematic Wall', desc: 'Integrated surround soundbar & acoustic wood paneling' },
                          { id: 'great-room', name: 'Architectural Fireplace Suite', desc: 'Suspended vapor fireplace & marble coffee table' },
                          { id: 'sunroom-reading', name: 'Panoramic Sunroom Lounge', desc: 'Eames style lounge chair with full-height glazing' },
                          { id: 'social-conversational', name: 'Conversational Seating Area', desc: 'Dual swivel armchairs and low walnut credenza' },
                        ].map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              onUpdateModel({ loungeType: l.id as LoungeType });
                              soundFx.playClick();
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left font-mono transition ${
                              (modelConfig.loungeType || 'tv-media') === l.id
                                ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{l.name}</span>
                              {(modelConfig.loungeType || 'tv-media') === l.id && (
                                <Check className="w-3.5 h-3.5 text-[#00f0ff]" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{l.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. WASHROOM (WC / COMMODE & BATH/SHOWER) */}
                {interiorSubcategory === 'washroom' && (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Toilet / Commode (WC) Fixture
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                        {[
                          { id: 'western-commode', name: 'Western Commode', desc: 'Floor mounted classic' },
                          { id: 'wall-hung-rimless', name: 'Wall-Hung WC', desc: 'Concealed cistern' },
                          { id: 'smart-bidet-wc', name: 'Smart Bidet WC', desc: 'Heated seat & light' },
                        ].map((wc) => (
                          <button
                            key={wc.id}
                            onClick={() => {
                              onUpdateModel({ washroomToiletType: wc.id as WashroomToiletType });
                              soundFx.playClick();
                            }}
                            className={`p-2 rounded-xl border text-center transition ${
                              (modelConfig.washroomToiletType || 'wall-hung-rimless') === wc.id
                                ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white font-bold'
                                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-white text-[11px]">{wc.name}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{wc.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Bathing Area Fixture
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                        {[
                          { id: 'bathtub', name: 'Freestanding Tub', desc: 'Deep soaking oval' },
                          { id: 'walk-in-shower', name: 'Rain Shower', desc: 'Frameless glass walk-in' },
                          { id: 'shower-tub-combo', name: 'Spa Combo', desc: 'Bathtub + rainfall' },
                        ].map((bath) => (
                          <button
                            key={bath.id}
                            onClick={() => {
                              onUpdateModel({ washroomWetType: bath.id as WashroomWetType });
                              soundFx.playClick();
                            }}
                            className={`p-2 rounded-xl border text-center transition ${
                              (modelConfig.washroomWetType || 'walk-in-shower') === bath.id
                                ? 'border-cyan-400 bg-cyan-400/10 text-white font-bold'
                                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-white text-[11px]">{bath.name}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{bath.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                        Tile Finish & Cladding
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                        {[
                          { id: 'carrara-marble', name: 'Carrara White Marble', desc: 'Large format Italian slabs' },
                          { id: 'black-slate', name: 'Midnight Matte Slate', desc: 'Dark textural stone' },
                          { id: 'white-terrazzo', name: 'Venetian Terrazzo', desc: 'Speckled quartz blend' },
                          { id: 'sandstone', name: 'Warm Sandstone', desc: 'Natural desert limestone' },
                        ].map((tile) => (
                          <button
                            key={tile.id}
                            onClick={() => {
                              onUpdateModel({ washroomTileStyle: tile.id as WashroomTileStyle });
                              soundFx.playClick();
                            }}
                            className={`p-2.5 rounded-xl border text-left transition ${
                              (modelConfig.washroomTileStyle || 'carrara-marble') === tile.id
                                ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white font-bold'
                                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{tile.name}</span>
                              {(modelConfig.washroomTileStyle || 'carrara-marble') === tile.id && (
                                <Check className="w-3.5 h-3.5 text-[#00f0ff]" />
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{tile.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. DOORS & WINDOWS STUDIO */}
            {editCategory === 'doors-windows' && (
              <div className="p-3.5 space-y-4 flex-1">
                {/* Master Door Switchers */}
                <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xs font-bold text-white tracking-wider">DOOR CONTROLS</span>
                    <button
                      onClick={handleToggleAllDoors}
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                        anyDoorOpen ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {anyDoorOpen ? 'CLOSE ALL' : 'OPEN ALL'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <button
                      onClick={() => {
                        const next = !modelConfig.frontDoorOpen;
                        if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                        const updatedOpenings = (modelConfig.openings || []).map((op) => {
                          if (op.wall === 'front' && (op.type.includes('door') || op.type.includes('bifold'))) {
                            return { ...op, isOpen: next };
                          }
                          return op;
                        });
                        onUpdateModel({
                          frontDoorOpen: next,
                          openings: updatedOpenings,
                        });
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between transition ${
                        modelConfig.frontDoorOpen
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Front Door</span>
                      <span className="font-bold">{modelConfig.frontDoorOpen ? 'OPEN' : 'CLOSED'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const next = !modelConfig.cargoDoorsOpen;
                        if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                        onUpdateModel({ cargoDoorsOpen: next });
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between transition ${
                        modelConfig.cargoDoorsOpen
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Cargo End Doors</span>
                      <span className="font-bold">{modelConfig.cargoDoorsOpen ? 'OPEN' : 'CLOSED'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const next = !modelConfig.bedroomDoorOpen;
                        if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                        onUpdateModel({
                          bedroomDoorOpen: next,
                          doorStates: { ...(modelConfig.doorStates || {}), 'interior-bed-door': next },
                        });
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between transition ${
                        modelConfig.bedroomDoorOpen
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Master Bed Door</span>
                      <span className="font-bold">{modelConfig.bedroomDoorOpen ? 'OPEN' : 'CLOSED'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const next = !modelConfig.bathroomDoorOpen;
                        if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                        onUpdateModel({
                          bathroomDoorOpen: next,
                          doorStates: { ...(modelConfig.doorStates || {}), 'interior-bath-door': next },
                        });
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between transition ${
                        modelConfig.bathroomDoorOpen
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Bath Pocket Door</span>
                      <span className="font-bold">{modelConfig.bathroomDoorOpen ? 'OPEN' : 'CLOSED'}</span>
                    </button>
                  </div>
                </div>

                {/* Exterior Windows & Glass Openings List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      Configured Openings ({allOpenings.length})
                    </span>
                    <span className="text-[9px] font-mono text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/30">
                      SAFETY FRAME CLAMPED
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {allOpenings.map((op) => (
                      <div
                        key={op.id}
                        className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 flex items-center justify-between gap-2 font-mono text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white uppercase text-[11px] truncate">
                              {op.type.replace(/-/g, ' ')}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                              {op.wall} wall
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {op.widthFt}&apos; × {op.heightFt}&apos; • Offset: {op.positionFt}&apos;
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleToggleSingleOpening(op.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              op.isOpen
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {op.isOpen ? 'OPEN' : 'SHUT'}
                          </button>
                          <button
                            onClick={() => handleDeleteOpening(op.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Remove Opening"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Quick Openings */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-[10px] font-mono text-slate-400 block mb-1.5">
                      + Add New Aperture (Safely Fitted)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <button
                        onClick={() => handleAddOpening('sliding-door-12ft', 'front')}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Plus className="w-3 h-3 text-[#00f0ff]" />
                        <span>12ft Glass Slider</span>
                      </button>
                      <button
                        onClick={() => handleAddOpening('picture-window', 'front')}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Plus className="w-3 h-3 text-[#00f0ff]" />
                        <span>Picture Window</span>
                      </button>
                      <button
                        onClick={() => handleAddOpening('sliding-window', 'back')}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Plus className="w-3 h-3 text-[#00f0ff]" />
                        <span>Sliding Window</span>
                      </button>
                      <button
                        onClick={() => handleAddOpening('entry-door', 'front')}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Plus className="w-3 h-3 text-[#00f0ff]" />
                        <span>Entry Door</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. FACADE & MATERIALS */}
            {editCategory === 'facade' && (
              <div className="p-3.5 space-y-4 flex-1">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                    Exterior Cladding Material
                  </label>
                  <div className="space-y-1.5">
                    {FACADE_MATERIALS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onUpdateModel({
                            exteriorMaterial: m.id as ExteriorMaterial,
                            exteriorColor: m.colorHex,
                            colorName: m.name,
                          });
                          soundFx.playClick();
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left font-mono transition ${
                          modelConfig.exteriorMaterial === m.id
                            ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{m.name}</span>
                          {modelConfig.exteriorMaterial === m.id && (
                            <Check className="w-3.5 h-3.5 text-[#00f0ff]" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.subtitle}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                    Architectural Glazing Tint
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {GLASS_TINTS.map((gt) => (
                      <button
                        key={gt.id}
                        onClick={() => {
                          onUpdateModel({ glassTint: gt.id as GlassTint });
                          soundFx.playClick();
                        }}
                        className={`p-2 rounded-xl border text-left font-mono transition ${
                          modelConfig.glassTint === gt.id
                            ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{gt.name}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {Math.round(gt.opacity * 100)}% UV Opacity
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. ROOF & GROUND */}
            {editCategory === 'roof-ground' && (
              <div className="p-3.5 space-y-4 flex-1">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                    Roof Architecture Option
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                    {[
                      { id: 'flat', name: 'Industrial Flat Roof', desc: 'Standing seam steel' },
                      { id: 'deck-wood', name: 'Rooftop Teak Deck', desc: 'Sun terrace + stairs' },
                      { id: 'solar-panels', name: 'Solar Array System', desc: '14 panels (6.2 kW)' },
                      { id: 'green-roof', name: 'Living Green Roof', desc: 'Sedum flora insulation' },
                    ].map((rf) => (
                      <button
                        key={rf.id}
                        onClick={() => {
                          onUpdateModel({ roofOption: rf.id as RoofOption });
                          soundFx.playClick();
                        }}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          modelConfig.roofOption === rf.id
                            ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-white text-[11px]">{rf.name}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{rf.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-1.5">
                    Foundation Engineering System
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                    {[
                      { id: 'concrete-slab', name: 'Reinforced Slab', desc: 'Sealed concrete grade' },
                      { id: 'concrete-piers', name: 'Elevated Piers', desc: 'Engineered height' },
                      { id: 'helical-piles', name: 'Helical Steel Piles', desc: 'Low site disturbance' },
                      { id: 'gravel-pad', name: 'Compacted Gravel', desc: 'Permeable drainage' },
                    ].map((fn) => (
                      <button
                        key={fn.id}
                        onClick={() => {
                          onUpdateModel({ foundationType: fn.id as FoundationType });
                          soundFx.playClick();
                        }}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          modelConfig.foundationType === fn.id
                            ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-white text-[11px]">{fn.name}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{fn.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. OUTDOOR AMENITIES */}
            {editCategory === 'outdoor' && (
              <div className="p-3.5 space-y-4 flex-1 font-mono text-xs">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 font-semibold block mb-2">
                    Luxury Outdoor Site Amenities
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        key: 'plungePool',
                        name: 'Outdoor Plunge Pool',
                        desc: 'Heated concrete cocktail pool with aquatic LED glow',
                      },
                      {
                        key: 'firePitLounge',
                        name: 'Sunken Fire Pit Lounge',
                        desc: 'Linear gas flame with perimeter teak benching',
                      },
                      {
                        key: 'pergolaCanopy',
                        name: 'Architectural Pergola',
                        desc: 'Louvered aluminum canopy providing sun shade',
                      },
                    ].map((amenity) => {
                      const isEnabled = !!modelConfig.outdoorAmenities?.[amenity.key as keyof typeof modelConfig.outdoorAmenities];
                      return (
                        <div
                          key={amenity.key}
                          onClick={() => {
                            soundFx.playClick();
                            onUpdateModel({
                              outdoorAmenities: {
                                plungePool: modelConfig.outdoorAmenities?.plungePool ?? false,
                                firePitLounge: modelConfig.outdoorAmenities?.firePitLounge ?? false,
                                pergolaCanopy: modelConfig.outdoorAmenities?.pergolaCanopy ?? false,
                                cantileverBalcony: modelConfig.outdoorAmenities?.cantileverBalcony ?? false,
                                [amenity.key]: !isEnabled,
                              },
                            });
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                            isEnabled
                              ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                              : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-white text-xs">{amenity.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{amenity.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isEnabled ? 'bg-[#00f0ff] border-[#00f0ff] text-black' : 'border-slate-700 bg-slate-800'
                          }`}>
                            {isEnabled && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHANGE HOUSES GALLERY */}
        {activeTab === 'houses' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {PRESET_MODELS.map((preset) => {
              const isSelected = preset.presetId === modelConfig.presetId || preset.name === modelConfig.name;
              const isTwoStory = preset.layoutType === 'stacked-2story' || preset.layoutType === 'cantilever-offset';
              const areaSqFt = preset.lengthFt * preset.widthFt * (isTwoStory ? 2 : 1);

              return (
                <div
                  key={preset.presetId || preset.name}
                  onClick={() => handleSelectPreset(preset)}
                  className={`relative p-3.5 rounded-2xl border transition cursor-pointer select-none group ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#111a2e] to-[#0d1424] border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                      : 'bg-[#0a0f1d]/80 hover:bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Active Indicator Strip */}
                  {isSelected && (
                    <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent" />
                  )}

                  {/* Top Row: Luxury Tier & Area */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#0a0d12] text-[#00f0ff] border border-[#00f0ff]/25">
                      {preset.luxuryTier || 'MODULAR VILLA'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                      <Layers className="w-3 h-3 text-[#00f0ff]" />
                      <span>{areaSqFt} SQ. FT.</span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mb-2">
                    <h4 className={`font-heading text-sm font-bold transition ${
                      isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                    }`}>
                      {preset.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                      {preset.subtitle}
                    </p>
                  </div>

                  {/* Dimension & Spec Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[9px] font-mono text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-black/40 border border-slate-800">
                      {preset.lengthFt}&apos; × {preset.widthFt}&apos; × {preset.heightFt}&apos;
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/40 border border-slate-800 uppercase">
                      {preset.exteriorMaterial?.replace(/-/g, ' ')}
                    </span>
                    {isTwoStory && (
                      <span className="px-2 py-0.5 rounded-md bg-[#0a0d12] border border-[#26323d] text-slate-300">
                        2-STORY TOWER
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </>
  );
};
