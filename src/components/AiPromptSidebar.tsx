import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  DoorOpen, 
  DoorClosed, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  Bath,
  Bed,
  UtensilsCrossed,
  Armchair,
  Layers,
  Check
} from 'lucide-react';
import { 
  ContainerModelConfig, 
  SitePlanningConfig,
  KitchenColor,
  KitchenCountertop,
  BedroomPalette,
  SittingPalette,
  WashroomToiletType,
  WashroomWetType,
  WashroomTileStyle,
  LoungeType,
  KitchenType,
  BathroomType,
  BedroomType
} from '../types';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';

interface AiPromptSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  onUpdateModel: (partial: Partial<ContainerModelConfig>) => void;
  onApplyConfig: (newConfig: ContainerModelConfig) => void;
}

const QUICK_INSPIRATIONS = [
  {
    title: '40ft Scandinavian Villa',
    prompt: '40ft high-cube Nordic villa with master bedroom suite, spa bathroom with freestanding soaking tub and walk-in shower, western commode, warm oak kitchen with calacatta quartz island, and panoramic sliding glass doors.',
  },
  {
    title: 'Obsidian Chef Penthouse',
    prompt: '40ft luxury container with matte obsidian kitchen cabinets, black granite countertops, smart bidet toilet, walk-in rainfall shower, cognac leather lounge, and acoustic slat wall panelling.',
  },
  {
    title: 'Stacked 2-Story Tower',
    prompt: 'Stacked 2-story bi-level container estate with cantilever balcony, ground floor chef kitchen and great room fireplace, upper story master suite with soaking tub and private terrace.',
  },
  {
    title: 'Desert Corten Sanctuary',
    prompt: 'Double-wide Corten steel desert house with wall-hung rimless toilet, walk-in rain shower, terracotta bedroom textiles, and 16ft pocket sliding patio doors.',
  },
  {
    title: '20ft Compact Studio',
    prompt: '20ft high-cube studio with linear kitchen, modern western commode, frameless glass rain shower, japandi platform bed, and floor-to-ceiling glass wall.',
  },
];

export const AiPromptSidebar: React.FC<AiPromptSidebarProps> = ({
  isOpen,
  onToggle,
  modelConfig,
  onUpdateModel,
  onApplyConfig,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'kitchen' | 'bedroom' | 'sitting' | 'washroom' | 'doors'>('ai');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Door states
  const isFrontDoorOpen = !!modelConfig.frontDoorOpen;
  const isCargoDoorsOpen = !!modelConfig.cargoDoorsOpen;
  const isBedDoorOpen = !!modelConfig.doorStates?.['interior-bed-door'];
  const isBathDoorOpen = !!modelConfig.doorStates?.['interior-bath-door'];
  const areAllDoorsOpen = isFrontDoorOpen && isCargoDoorsOpen && isBedDoorOpen && isBathDoorOpen;

  const handleGenerateAi = async (overridePrompt?: string) => {
    const text = (overridePrompt || promptText).trim();
    if (!text) return;

    soundFx.playClick();
    setIsLoading(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const response = await fetch('/api/generate-house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          currentConfig: {
            lengthFt: modelConfig.lengthFt,
            widthFt: modelConfig.widthFt,
            layoutType: modelConfig.layoutType,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI architectural engine failed to respond');
      }

      const data = await response.json();
      if (!data.config) {
        throw new Error('No architectural layout returned');
      }

      const newConfig: ContainerModelConfig = {
        ...modelConfig,
        ...data.config,
        cutawayRoof: true,
        openings: Array.isArray(data.config.openings) ? data.config.openings : [],
        partitions: Array.isArray(data.config.partitions) ? data.config.partitions : [],
      };

      onApplyConfig(newConfig);
      setSuccessNotice(`Architectural plan "${newConfig.name}" synthesized!`);
      soundFx.playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.2, y: 0.6 },
      });
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      console.warn('AI prompt error:', err);
      setErrorNotice(err.message || 'Unable to connect to AI server. Applying procedural design.');
      setTimeout(() => setErrorNotice(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSingleDoor = (key: 'front' | 'cargo' | 'bed' | 'bath') => {
    soundFx.playDoorOpen();
    if (key === 'front') {
      onUpdateModel({ frontDoorOpen: !isFrontDoorOpen });
    } else if (key === 'cargo') {
      onUpdateModel({ cargoDoorsOpen: !isCargoDoorsOpen });
    } else if (key === 'bed') {
      onUpdateModel({
        doorStates: { ...(modelConfig.doorStates || {}), 'interior-bed-door': !isBedDoorOpen },
      });
    } else if (key === 'bath') {
      onUpdateModel({
        doorStates: { ...(modelConfig.doorStates || {}), 'interior-bath-door': !isBathDoorOpen },
      });
    }
  };

  const handleToggleAllDoors = () => {
    const next = !areAllDoorsOpen;
    if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
    onUpdateModel({
      frontDoorOpen: next,
      cargoDoorsOpen: next,
      interiorDoorsOpen: next,
      doorStates: {
        'interior-bed-door': next,
        'interior-bath-door': next,
      },
      openings: (modelConfig.openings || []).map((o) => ({ ...o, isOpen: next })),
    });
  };

  return (
    <>
      {/* Floating Toggle Tab when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="ai-prompt-trigger absolute top-20 left-3 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0b101c]/90 hover:bg-[#111a2e] border border-[#00f0ff]/40 text-[#00f0ff] backdrop-blur-md shadow-[0_4px_25px_rgba(0,240,255,0.25)] transition hover:scale-105 select-none"
          title="Open AI Prompt & Interior Customizer Sidebar"
        >
          <Sparkles className="w-4 h-4 animate-pulse text-[#00f0ff]" />
          <span className="font-mono text-xs font-bold tracking-wider">PROMPT AI &amp; EDIT</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Docked Left Sidebar */}
      <aside
        className={`ai-prompt-panel absolute top-0 bottom-0 left-0 z-30 w-80 sm:w-96 flex flex-col bg-[#080d18]/95 backdrop-blur-2xl border-r border-slate-800/90 shadow-[4px_0_35px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-[#0c1222]/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold text-white tracking-wider">AI PROMPT &amp; STUDIO</span>
                <span className="px-1.5 py-0.2 bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 text-[9px] font-mono rounded font-bold">
                  GEMINI 3.8
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Real-time Generative Interior &amp; Architecture</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 bg-[#060912] border-b border-slate-800/80 overflow-x-auto no-scrollbar font-mono text-[11px]">
          <button
            onClick={() => setActiveSubTab('ai')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition shrink-0 ${
              activeSubTab === 'ai'
                ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI PROMPT</span>
          </button>
          <button
            onClick={() => setActiveSubTab('kitchen')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition shrink-0 ${
              activeSubTab === 'kitchen'
                ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UtensilsCrossed className="w-3 h-3" />
            <span>KITCHEN</span>
          </button>
          <button
            onClick={() => setActiveSubTab('bedroom')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition shrink-0 ${
              activeSubTab === 'bedroom'
                ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Bed className="w-3 h-3" />
            <span>BEDROOM</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sitting')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition shrink-0 ${
              activeSubTab === 'sitting'
                ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Armchair className="w-3 h-3" />
            <span>SITTING</span>
          </button>
          <button
            onClick={() => setActiveSubTab('washroom')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition shrink-0 ${
              activeSubTab === 'washroom'
                ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Bath className="w-3 h-3" />
            <span>WASHROOM</span>
          </button>
          <button
            onClick={() => setActiveSubTab('doors')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg font-bold transition shrink-0 ${
              activeSubTab === 'doors'
                ? 'bg-rose-400 text-black shadow-[0_0_10px_rgba(251,113,133,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <DoorOpen className="w-3 h-3" />
            <span>DOORS</span>
          </button>
        </div>

        {/* Scrollable Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {/* Notifications */}
          {errorNotice && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
              {errorNotice}
            </div>
          )}
          {successNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: AI PROMPT INTERFACE                                */}
          {/* ========================================================= */}
          {activeSubTab === 'ai' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                  Describe Your Dream House
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. 40ft container home with oak kitchen, freestanding soaking tub and shower, western commode, cognac leather sofa, and sliding patio doors..."
                    className="w-full rounded-xl bg-[#0f172a] border border-slate-700/80 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition resize-none font-sans leading-relaxed"
                  />
                </div>
              </div>

              <button
                disabled={isLoading || !promptText.trim()}
                onClick={() => handleGenerateAi()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00a8ff] text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.55)] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>SYNTHESIZING HOUSE ARCHITECTURE...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>GENERATE WITH AI</span>
                  </>
                )}
              </button>

              {/* Quick Inspiration Chips */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
                  Instant Prompt Inspirations
                </span>
                <div className="space-y-1.5">
                  {QUICK_INSPIRATIONS.map((insp, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPromptText(insp.prompt);
                        handleGenerateAi(insp.prompt);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-[#0d1424] hover:bg-[#131d33] border border-slate-800 hover:border-[#00f0ff]/40 transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 group-hover:text-[#00f0ff] transition text-xs">
                          {insp.title}
                        </span>
                        <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-[#00f0ff]" />
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {insp.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: KITCHEN STUDIO (Colors, Countertops, Islands)      */}
          {/* ========================================================= */}
          {activeSubTab === 'kitchen' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Kitchen Cabinet Finish
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'matte-obsidian', name: 'Matte Obsidian', hex: '#141619' },
                    { id: 'scandinavian-oak', name: 'Scandinavian Oak', hex: '#c49a6c' },
                    { id: 'navy-blue', name: 'Navy Blue', hex: '#1b2a4a' },
                    { id: 'marble-white', name: 'Architectural White', hex: '#f8fafc' },
                    { id: 'forest-green', name: 'Nordic Forest Green', hex: '#243828' },
                    { id: 'smoked-charcoal', name: 'Smoked Charcoal', hex: '#333a42' },
                  ].map((cab) => (
                    <button
                      key={cab.id}
                      onClick={() => onUpdateModel({ kitchenColor: cab.id as KitchenColor })}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                        modelConfig.kitchenColor === cab.id
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full shrink-0 border border-slate-600" style={{ backgroundColor: cab.hex }} />
                      <span className="text-[11px] font-medium truncate">{cab.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Countertop Material
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'calacatta-quartz', name: 'Calacatta Marble Quartz', desc: 'White Italian veined' },
                    { id: 'black-granite', name: 'Honed Black Granite', desc: 'Matte non-porous' },
                    { id: 'butcherblock-oak', name: 'Butcherblock Oak', desc: 'Warm natural timber' },
                    { id: 'brushed-stainless', name: 'Chef Stainless Steel', desc: 'Commercial restaurant grade' },
                  ].map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => onUpdateModel({ kitchenCountertop: ct.id as KitchenCountertop })}
                      className={`p-2 rounded-xl border text-left transition ${
                        (modelConfig.kitchenCountertop || 'calacatta-quartz') === ct.id
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-medium text-[11px] truncate">{ct.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{ct.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Kitchen Island Configuration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'chef-island', name: "Chef's Island + 3 Stools" },
                    { id: 'breakfast-bar', name: 'Peninsula Breakfast Bar' },
                    { id: 'linear-minimal', name: 'Linear Minimal Wall Unit' },
                  ].map((kt) => (
                    <button
                      key={kt.id}
                      onClick={() => onUpdateModel({ kitchenType: kt.id as KitchenType })}
                      className={`p-2 rounded-xl border text-left transition ${
                        modelConfig.kitchenType === kt.id
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[11px] font-medium">{kt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: BEDROOM STUDIO (Textiles, Platform Beds)           */}
          {/* ========================================================= */}
          {activeSubTab === 'bedroom' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Bed Linen &amp; Textile Palette
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'warm-linen', name: 'Warm Off-White Linen', hex: '#f8f7f4' },
                    { id: 'charcoal-grey', name: 'Charcoal Wool & Slate', hex: '#374151' },
                    { id: 'sage-green', name: 'Nordic Sage Green', hex: '#6b8067' },
                    { id: 'terracotta-clay', name: 'Terracotta Clay', hex: '#b45309' },
                    { id: 'midnight-navy', name: 'Midnight Deep Navy', hex: '#1e293b' },
                  ].map((bp) => (
                    <button
                      key={bp.id}
                      onClick={() => onUpdateModel({ bedroomPalette: bp.id as BedroomPalette })}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                        (modelConfig.bedroomPalette || 'warm-linen') === bp.id
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full shrink-0 border border-slate-600" style={{ backgroundColor: bp.hex }} />
                      <span className="text-[11px] font-medium truncate">{bp.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Bedroom Layout &amp; Suite Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'master-suite', name: 'Master Suite (King Platform)' },
                    { id: 'japandi-platform', name: 'Japandi Low Tatami Bed' },
                    { id: 'nordic-minimal', name: 'Nordic Minimal Suite' },
                    { id: 'bunk-studio', name: 'Dual Bunk Studio Retreat' },
                  ].map((bt) => (
                    <button
                      key={bt.id}
                      onClick={() => onUpdateModel({ bedroomType: bt.id as BedroomType })}
                      className={`p-2 rounded-xl border text-left transition ${
                        (modelConfig.bedroomType || 'master-suite') === bt.id
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[11px] font-medium">{bt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: SITTING / LOUNGE STUDIO                            */}
          {/* ========================================================= */}
          {activeSubTab === 'sitting' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Sofa Upholstery Palette
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'warm-cognac', name: 'Warm Cognac Leather', hex: '#965228' },
                    { id: 'charcoal-boucle', name: 'Charcoal Heather Bouclé', hex: '#333a42' },
                    { id: 'sand-beige', name: 'Sand Beige Linen', hex: '#e2d9cc' },
                    { id: 'emerald-velvet', name: 'Deep Emerald Velvet', hex: '#1b4332' },
                    { id: 'slate-grey', name: 'Slate Grey Twill', hex: '#64748b' },
                  ].map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => onUpdateModel({ sittingPalette: sp.id as SittingPalette })}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                        (modelConfig.sittingPalette || 'slate-grey') === sp.id
                          ? 'border-emerald-400 bg-emerald-950/20 text-emerald-200'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full shrink-0 border border-slate-600" style={{ backgroundColor: sp.hex }} />
                      <span className="text-[11px] font-medium truncate">{sp.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Lounge Centerpiece
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'tv-media', name: '75" OLED Cinematic Media Wall' },
                    { id: 'great-room', name: 'Electric Linear Fireplace Suite' },
                    { id: 'sunroom-reading', name: 'Sunroom Reading Library' },
                    { id: 'conversational-lounge', name: 'Social U-Shape Lounge' },
                  ].map((lt) => (
                    <button
                      key={lt.id}
                      onClick={() => onUpdateModel({ loungeType: lt.id as LoungeType })}
                      className={`p-2 rounded-xl border text-left transition ${
                        (modelConfig.loungeType || 'great-room') === lt.id
                          ? 'border-emerald-400 bg-emerald-950/20 text-emerald-200'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[11px] font-medium">{lt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: WASHROOM / COMMODE & SHOWER/BATHTUB STUDIO        */}
          {/* ========================================================= */}
          {activeSubTab === 'washroom' && (
            <div className="space-y-4">
              {/* Commode / Toilet Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Toilet / Commode Type (WC)
                  </label>
                  <span className="text-[9px] font-mono text-[#00f0ff]">3D OPERABLE</span>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      id: 'western-commode',
                      title: 'Western Commode (Standard WC)',
                      subtitle: 'Floor-mounted ceramic bowl with close-coupled porcelain tank & dual-flush buttons',
                    },
                    {
                      id: 'wall-hung-rimless',
                      title: 'Wall-Hung Rimless WC',
                      subtitle: 'Concealed in-wall tank, floating suspended bowl, dual chrome wall flush plate',
                    },
                    {
                      id: 'smart-bidet-wc',
                      title: 'Luxury Smart Bidet Commode',
                      subtitle: 'Heated seat, side electronic wand console, cyan LED ambient nightlight glow',
                    },
                  ].map((wc) => (
                    <button
                      key={wc.id}
                      onClick={() => onUpdateModel({ washroomToiletType: wc.id as WashroomToiletType })}
                      className={`w-full p-2.5 rounded-xl border text-left transition ${
                        (modelConfig.washroomToiletType || 'western-commode') === wc.id
                          ? 'border-cyan-400 bg-cyan-950/30 text-cyan-100 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{wc.title}</span>
                        {(modelConfig.washroomToiletType || 'western-commode') === wc.id && (
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{wc.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathtub vs Shower vs Combo Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Bathing Wet Area Fixture
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'bathtub',
                      title: 'Freestanding Oval Soaking Tub',
                      subtitle: 'Double-ended sculptural soak tub with floor-mounted tall chrome tub filler',
                    },
                    {
                      id: 'walk-in-shower',
                      title: 'Walk-in Frameless Glass Rain Shower',
                      subtitle: 'Ceiling rainfall showerhead, linear stainless floor trench drain, glass screen',
                    },
                    {
                      id: 'shower-tub-combo',
                      title: 'Spa Combo: Freestanding Tub + Rain Shower',
                      subtitle: 'Both soaking tub AND frameless walk-in glass shower stall in master ensuite',
                    },
                  ].map((wet) => (
                    <button
                      key={wet.id}
                      onClick={() => onUpdateModel({ washroomWetType: wet.id as WashroomWetType })}
                      className={`w-full p-2.5 rounded-xl border text-left transition ${
                        (modelConfig.washroomWetType || 'bathtub') === wet.id
                          ? 'border-cyan-400 bg-cyan-950/30 text-cyan-100 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{wet.title}</span>
                        {(modelConfig.washroomWetType || 'bathtub') === wet.id && (
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{wet.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathroom Tiles */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Wall &amp; Floor Tile Finishes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'carrara-marble', name: 'Italian Carrara Marble' },
                    { id: 'black-slate', name: 'Midnight Charcoal Slate' },
                    { id: 'white-terrazzo', name: 'Venetian White Terrazzo' },
                    { id: 'sandstone', name: 'Desert Sandstone' },
                  ].map((tile) => (
                    <button
                      key={tile.id}
                      onClick={() => onUpdateModel({ washroomTileStyle: tile.id as WashroomTileStyle })}
                      className={`p-2 rounded-xl border text-left transition ${
                        (modelConfig.washroomTileStyle || 'carrara-marble') === tile.id
                          ? 'border-cyan-400 bg-cyan-950/20 text-cyan-200'
                          : 'border-slate-800 bg-[#0d1424] text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[11px] font-medium">{tile.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: DOORS & APERTURES MASTER CONTROLS                  */}
          {/* ========================================================= */}
          {activeSubTab === 'doors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1222] border border-slate-700">
                <div>
                  <div className="font-bold text-slate-200 text-xs">All House Doors</div>
                  <div className="text-[10px] text-slate-400">Master synchronized opening &amp; closing</div>
                </div>
                <button
                  onClick={handleToggleAllDoors}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition ${
                    areAllDoorsOpen
                      ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                      : 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  {areAllDoorsOpen ? <DoorClosed className="w-3.5 h-3.5" /> : <DoorOpen className="w-3.5 h-3.5" />}
                  <span>{areAllDoorsOpen ? 'CLOSE ALL' : 'OPEN ALL'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'front' as const,
                    name: 'Main Front Entrance Door',
                    desc: 'Smooth 86° outward hinge with zero frame overlap',
                    isOpen: isFrontDoorOpen,
                  },
                  {
                    id: 'cargo' as const,
                    name: 'Industrial Double Cargo Doors',
                    desc: 'Dual 105° swing open with locking cam bar hardware',
                    isOpen: isCargoDoorsOpen,
                  },
                  {
                    id: 'bed' as const,
                    name: 'Master Bedroom Privacy Door',
                    desc: 'Swings flush into bedroom wall leaving corridor 100% open',
                    isOpen: isBedDoorOpen,
                  },
                  {
                    id: 'bath' as const,
                    name: 'Private Bathroom Pocket/Hinged Door',
                    desc: 'Concealed sliding pocket door into partition cavity',
                    isOpen: isBathDoorOpen,
                  },
                ].map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d1424] border border-slate-800"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 text-xs">{d.name}</div>
                      <div className="text-[10px] text-slate-400">{d.desc}</div>
                    </div>
                    <button
                      onClick={() => handleToggleSingleDoor(d.id)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition ${
                        d.isOpen
                          ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {d.isOpen ? 'OPEN' : 'CLOSED'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
