import React from 'react';
import { 
  Home, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Layers, 
  Sparkles, 
  Maximize2,
  Tag,
  Building,
  CheckCircle2
} from 'lucide-react';
import { ContainerModelConfig } from '../types';
import { PRESET_MODELS } from '../data/presets';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';

interface HousesGallerySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentModel: ContainerModelConfig;
  onSelectHouse: (model: ContainerModelConfig) => void;
}

export const HousesGallerySidebar: React.FC<HousesGallerySidebarProps> = ({
  isOpen,
  onToggle,
  currentModel,
  onSelectHouse,
}) => {
  const handleSelect = (preset: ContainerModelConfig) => {
    if (preset.presetId === currentModel.presetId) return;
    soundFx.playModeSwitch();
    onSelectHouse(preset);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.85, y: 0.6 },
    });
  };

  return (
    <>
      {/* Floating Toggle Tab when right sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute top-20 right-3 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0b101c]/90 hover:bg-[#111a2e] border border-amber-400/40 text-amber-300 backdrop-blur-md shadow-[0_4px_25px_rgba(251,191,36,0.25)] transition hover:scale-105 select-none"
          title="Open Houses & Architecture Models Gallery"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <Home className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-bold tracking-wider">CHANGE HOUSES</span>
        </button>
      )}

      {/* Docked Right Sidebar */}
      <aside
        className={`absolute top-0 bottom-0 right-0 z-30 w-80 sm:w-96 flex flex-col bg-[#080d18]/95 backdrop-blur-2xl border-l border-slate-800/90 shadow-[-4px_0_35px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-[#0c1222]/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold text-white tracking-wider">CHANGE HOUSES</span>
                <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-mono rounded font-bold">
                  {PRESET_MODELS.length} DESIGNS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Select Real-time Architectural Architecture</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Collapse Houses Gallery"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Gallery List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {PRESET_MODELS.map((preset) => {
            const isSelected = preset.presetId === currentModel.presetId || preset.name === currentModel.name;
            const isTwoStory = preset.layoutType === 'stacked-2story' || preset.layoutType === 'cantilever-offset';
            const areaSqFt = preset.lengthFt * preset.widthFt * (isTwoStory ? 2 : 1);

            return (
              <div
                key={preset.presetId || preset.name}
                onClick={() => handleSelect(preset)}
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
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-slate-800/90 text-amber-300 border border-amber-400/30">
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
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/40 text-indigo-300">
                      2-STORY TOWER
                    </span>
                  )}
                  {preset.deckPorch && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                      TERRACE DECK
                    </span>
                  )}
                </div>

                {/* Selection Status Badge */}
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/50">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400">Interior:</span>
                    <span className="text-slate-200 font-medium capitalize">
                      {preset.loungeType?.replace(/-/g, ' ')}
                    </span>
                  </div>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#00f0ff]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ACTIVE IN 3D
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-amber-400 transition">
                      CLICK TO LOAD →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};
