import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  Send, 
  Download, 
  Eye, 
  Home, 
  Sofa, 
  DoorOpen, 
  Layers, 
  FileText,
  Glasses,
  Video,
  Camera,
  X
} from 'lucide-react';
import { ContainerModelConfig, SitePlanningConfig, ViewMode } from '../types';
import { PRESET_MODELS } from '../data/presets';
import { soundFx } from '../utils/audio';

interface MobileDetailPromptSheetProps {
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUpdateModel: (partial: Partial<ContainerModelConfig>) => void;
  onSelectPreset: (preset: ContainerModelConfig) => void;
  onOpenAiArchitect: () => void;
  onDownloadPdf: () => void;
  onToggleDrawer?: () => void;
  onOpenAR?: () => void;
}

const QUICK_INSPIRATIONS = [
  'Modern Scandinavian 40ft villa with black siding & cedar deck',
  '2-story luxury modular with floor-to-ceiling glass & roof terrace',
  'Compact 20ft off-grid studio with solar panels & kitchen',
  'Matte black Corten container with full glass sliding doors'
];

export const MobileDetailPromptSheet: React.FC<MobileDetailPromptSheetProps> = ({
  modelConfig,
  viewMode,
  onViewModeChange,
  onUpdateModel,
  onSelectPreset,
  onOpenAiArchitect,
  onDownloadPdf,
  onOpenAR,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickPromptText, setQuickPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleExpand = () => {
    soundFx.playClick();
    setIsExpanded((prev) => !prev);
  };

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    soundFx.playClick();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/generate-house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          currentConfig: modelConfig,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.config) {
          soundFx.playSuccess();
          onUpdateModel(data.config);
          setQuickPromptText('');
          setIsExpanded(false);
        }
      } else {
        onOpenAiArchitect();
      }
    } catch {
      onOpenAiArchitect();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInterior = !!modelConfig.cutawayRoof;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 pointer-events-auto flex justify-center px-2 sm:px-4 ${
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-52px)]'
      }`}
    >
      <div className="w-full max-w-3xl bg-[#080d16]/98 border-t border-x border-[#00f0ff]/35 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] rounded-t-3xl backdrop-blur-2xl text-slate-100 overflow-hidden flex flex-col max-h-[82vh]">
        {/* Pull Handle Header */}
        <div
          onClick={handleToggleExpand}
          className="w-full py-2.5 px-4 sm:px-6 flex items-center justify-between cursor-pointer select-none bg-gradient-to-b from-[#111a2c]/90 to-transparent border-b border-slate-800/60 hover:bg-[#111a2c]/60 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold font-heading text-white">
                <span>AI ARCHITECT &bull; DETAIL PROMPT &bull; THEMES</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] font-bold">
                  {isExpanded ? 'PULL DOWN TO HIDE' : 'PULL UP / CLICK TO OPEN'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {isExpanded ? 'Tap here to pull down' : 'Prompt AI Architect, switch House Themes & download Blueprint PDF'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-1.5 bg-slate-600 rounded-full mx-auto" />
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-[#00f0ff] animate-bounce" />
            )}
          </div>
        </div>

        {/* Collapsible Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick Action Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {/* Interior / Exterior toggle */}
            <button
              onClick={() => {
                soundFx.playClick();
                onUpdateModel({ cutawayRoof: !isInterior });
              }}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-mono font-bold border transition ${
                isInterior
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'bg-[#0e1626] text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {isInterior ? <Sofa className="w-4 h-4 mb-1 text-amber-300" /> : <Home className="w-4 h-4 mb-1 text-[#00f0ff]" />}
              <span>{isInterior ? 'INTERIOR' : 'EXTERIOR'}</span>
            </button>

            {/* VR Mode (Virtual Reality Walkthrough) */}
            <button
              onClick={() => {
                soundFx.playModeSwitch();
                onViewModeChange(viewMode === 'walkthrough-vr' || viewMode === 'vr-walkthrough' ? '3d-orbit' : 'vr-walkthrough');
                setIsExpanded(false);
              }}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-mono font-bold border transition ${
                viewMode === 'walkthrough-vr' || viewMode === 'vr-walkthrough'
                  ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                  : 'bg-[#0e1626] text-purple-400 border-slate-700 hover:bg-[#162032]'
              }`}
              title="VR Mode: 1:1 Scale Virtual Reality"
            >
              <Glasses className="w-4 h-4 mb-1" />
              <span>VR MODE</span>
            </button>

            {/* House Visit Video Tour */}
            <button
              onClick={() => {
                soundFx.playModeSwitch();
                onViewModeChange(viewMode === 'cinematic-tour' ? '3d-orbit' : 'cinematic-tour');
                setIsExpanded(false);
              }}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-mono font-bold border transition ${
                viewMode === 'cinematic-tour'
                  ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                  : 'bg-[#0e1626] text-cyan-400 border-slate-700 hover:bg-[#162032]'
              }`}
              title="House Visit Video Tour"
            >
              <Video className="w-4 h-4 mb-1" />
              <span>VISIT VIDEO</span>
            </button>

            {/* AR Mode (Augmented Reality) */}
            {onOpenAR && (
              <button
                onClick={() => {
                  soundFx.playChime();
                  onOpenAR();
                  setIsExpanded(false);
                }}
                className="flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-mono font-bold border transition bg-[#0e1626] text-emerald-400 border-slate-700 hover:bg-[#162032]"
                title="AR Mode: Project on Real Site"
              >
                <Camera className="w-4 h-4 mb-1" />
                <span>AR MODE</span>
              </button>
            )}

            {/* Exterior Sliding Doors */}
            <button
              onClick={() => {
                const anyOpen = !!modelConfig.frontDoorOpen || !!modelConfig.cargoDoorsOpen || (modelConfig.openings || []).some((o) => o.isOpen);
                const next = !anyOpen;
                if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                onUpdateModel({
                  frontDoorOpen: next,
                  cargoDoorsOpen: next,
                  openings: (modelConfig.openings || []).map((o) => ({ ...o, isOpen: next })),
                });
              }}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-mono font-bold border transition ${
                (modelConfig.frontDoorOpen || modelConfig.cargoDoorsOpen || (modelConfig.openings || []).some((o) => o.isOpen))
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-[#0e1626] text-slate-300 border-slate-700'
              }`}
            >
              <DoorOpen className="w-4 h-4 mb-1" />
              <span>{(modelConfig.frontDoorOpen || modelConfig.cargoDoorsOpen || (modelConfig.openings || []).some((o) => o.isOpen)) ? 'EXT. DOORS OPEN' : 'EXT. DOORS SHUT'}</span>
            </button>

            {/* Inside House Interior Doors */}
            <button
              onClick={() => {
                const next = !modelConfig.interiorDoorsOpen;
                if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
                onUpdateModel({
                  interiorDoorsOpen: next,
                  doorStates: {
                    'interior-bath-door': next,
                    'interior-bed-door': next,
                  },
                });
              }}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-mono font-bold border transition ${
                modelConfig.interiorDoorsOpen
                  ? 'bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-[#0e1626] text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <DoorOpen className="w-4 h-4 mb-1 text-purple-400" />
              <span>{modelConfig.interiorDoorsOpen ? 'INSIDE DOORS OPEN' : 'INSIDE DOORS CLOSED'}</span>
            </button>
          </div>

          {/* AI Aperture Recommendations (Sliding Doors, Sliding Windows, Inside Doors) */}
          <div className="p-3 rounded-xl bg-[#0c1424] border border-[#00f0ff]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI RECOMMENDED APERTURES (REALISTIC SLIDING)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Click to add to house</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  handleSendPrompt("Add 16ft full glass panoramic sliding door on front facade with smooth gliding track");
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-left border border-slate-700 transition"
              >
                <div className="text-[11px] font-bold text-white flex items-center gap-1">
                  <span>✨ Sliding Patio Door</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">16ft panoramic gliding glass</div>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  handleSendPrompt("Add modern horizontal sliding window with dual gliding sashes");
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-left border border-slate-700 transition"
              >
                <div className="text-[11px] font-bold text-white flex items-center gap-1">
                  <span>✨ Sliding Window</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">Smooth horizontal sash window</div>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  handleSendPrompt("Add interior sliding pocket door inside house separating private bedroom and bathroom");
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-left border border-slate-700 transition"
              >
                <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                  <span>✨ Door Inside House</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans">Sliding interior pocket door</div>
              </button>
            </div>
          </div>

          {/* Prompt AI Architect Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
                PROMPT AI ARCHITECT
              </span>
              <button
                onClick={() => {
                  onOpenAiArchitect();
                  setIsExpanded(false);
                }}
                className="text-[10px] font-mono text-[#00f0ff] hover:underline"
              >
                Advanced AI Assistant &rarr;
              </button>
            </div>

            <div className="relative">
              <textarea
                value={quickPromptText}
                onChange={(e) => setQuickPromptText(e.target.value)}
                placeholder="Describe what to build or modify: e.g., 'Modern black cedar cabin with full glass sliding doors, 12 solar panels, and warm oak flooring'..."
                rows={3}
                className="w-full rounded-xl bg-[#0e1626] border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] resize-none font-sans"
              />
              <button
                onClick={() => handleSendPrompt(quickPromptText)}
                disabled={isSubmitting || !quickPromptText.trim()}
                className="absolute right-2.5 bottom-3 px-3.5 py-1.5 rounded-lg bg-[#00f0ff] hover:bg-[#00d0df] disabled:opacity-40 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition shadow"
              >
                {isSubmitting ? (
                  <span>Generating...</span>
                ) : (
                  <>
                    <span>Build</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_INSPIRATIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuickPromptText(q);
                    handleSendPrompt(q);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition border border-slate-700/60 text-left"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* House Themes Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00f0ff]" />
                THEMES OF HOUSES (PRESETS)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                1-Click Architectural Archetypes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_MODELS.map((preset) => {
                const isSelected = modelConfig.presetId === preset.presetId;
                return (
                  <button
                    key={preset.presetId}
                    onClick={() => {
                      soundFx.playChime();
                      onSelectPreset(preset);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                        : 'bg-[#0e1626] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-[#00f0ff] uppercase">
                        {preset.luxuryTier}
                      </span>
                      {isSelected && (
                        <span className="text-[8px] font-mono bg-[#00f0ff] text-black px-1 rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="font-heading text-xs font-bold text-white mt-1 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {preset.lengthFt}ft &bull; {preset.lengthFt * preset.widthFt} sq.ft
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PDF Download Button */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playSuccess();
                onDownloadPdf();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00f0ff] via-[#00d0e6] to-[#00b4d8] hover:brightness-110 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] transition"
            >
              <Download className="w-4 h-4 text-black" />
              <span>DOWNLOAD CERTIFIED ARCHITECTURAL BLUEPRINT (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
