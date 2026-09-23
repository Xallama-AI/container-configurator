import React, { useState } from 'react';
import { Sparkles, Bot, Wand2, ArrowRight, CheckCircle2, AlertCircle, FileText, Download, X, Home, RefreshCw } from 'lucide-react';
import { ContainerModelConfig, SitePlanningConfig } from '../types';
import { soundFx } from '../utils/audio';
import { generateArchitecturalPdf } from '../utils/pdfGenerator';
import confetti from 'canvas-confetti';

interface AiArchitectBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  onApplyConfig: (newConfig: ContainerModelConfig) => void;
}

const INSPIRATION_PROMPTS = [
  {
    title: 'Nordic Villa with Sliding Glass & Inside Doors',
    prompt: '40ft off-grid Scandinavian villa with master bedroom, spa bathroom, floor-to-ceiling panoramic glass sliding doors, sliding windows, and interior sliding pocket doors inside the house, charred Shou Sugi Ban black siding, and cedar deck with plunge pool.',
    tag: 'Recommended',
  },
  {
    title: '2-Story Executive Estate with Patio Sliders',
    prompt: 'Stacked 2-story luxury container home with 3 bedrooms, cantilever balcony, 16ft glass sliding doors, horizontal sliding windows, interior doors inside the house, rooftop terrace, and French chevron oak floors.',
    tag: 'Luxury',
  },
  {
    title: 'Modern Minimalist Studio with Sliding Apertures',
    prompt: '20ft high-cube compact office and guest retreat with panoramic sliding glass front, dual sliding window, interior sliding bathroom door inside the house, board-formed concrete facade, and dark slate floors.',
    tag: 'Compact',
  },
  {
    title: 'Desert Off-Grid Haven with Gliding Sashes',
    prompt: 'Double-wide weathered Corten steel desert house with 16ft sliding patio doors, sliding bedroom windows, interior pocket doors inside the house, 12 solar panels, shaded pergola, and sunken fire pit lounge.',
    tag: 'Off-Grid',
  },
];

export const AiArchitectBotModal: React.FC<AiArchitectBotModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  siteConfig,
  onApplyConfig,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    config: ContainerModelConfig;
    architectRationale?: string;
    source: string;
    notice?: string;
  } | null>(null);

  if (!isOpen) return null;

  const parseCleanErrorMessage = (err: any): string => {
    if (!err) return 'Unable to generate house configuration. Please try again.';
    const raw = typeof err === 'string' ? err : err.message || String(err);
    if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
      return 'The AI model is experiencing a temporary spike in demand. Please try again shortly or click any pre-engineered architectural concept below.';
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // not JSON
    }
    return raw;
  };

  const handleGenerate = async (targetPrompt?: string) => {
    const textToSend = targetPrompt || prompt;
    if (!textToSend.trim()) return;

    soundFx.playClick();
    setIsLoading(true);
    setError(null);
    setGeneratedResult(null);

    try {
      const response = await fetch('/api/generate-house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          currentConfig: {
            lengthFt: currentConfig.lengthFt,
            widthFt: currentConfig.widthFt,
            layoutType: currentConfig.layoutType,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Architect engine failed to respond');
      }

      const data = await response.json();
      if (!data.config) {
        throw new Error('No architectural configuration returned');
      }

      // Merge defaults to ensure clean ContainerModelConfig strictly following user's intent
      const fullConfig: ContainerModelConfig = {
        ...currentConfig,
        ...data.config,
        presetId: `ai-${Date.now().toString().slice(-4)}`,
        cutawayRoof: true, // Automatically show inside rooms so client can inspect immediately!
        partitions: Array.isArray(data.config.partitions) ? data.config.partitions : [],
        openings: Array.isArray(data.config.openings) ? data.config.openings : [],
        deckPorch: !!data.config.deckPorch,
        attachedBath: data.config.attachedBath !== undefined
          ? !!data.config.attachedBath
          : (textToSend.toLowerCase().includes('attached') || textToSend.toLowerCase().includes('ensuite')),
        bathroomDoorType: data.config.bathroomDoorType || (textToSend.toLowerCase().includes('hinged') ? 'hinged' : 'sliding'),
        doorStates: data.config.doorStates || {
          'interior-bath-door': false,
          'interior-bed-door': false,
        },
        outdoorAmenities: {
          plungePool: false,
          firePitLounge: false,
          pergolaCanopy: false,
          cantileverBalcony: false,
          ...(data.config.outdoorAmenities || {}),
        },
      };

      setGeneratedResult({
        config: fullConfig,
        architectRationale: data.config.architectRationale,
        source: data.source || 'ai',
        notice: data.notice,
      });

      soundFx.playSuccess();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore confetti errors
      }
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setError(parseCleanErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;
    soundFx.playSuccess();
    onApplyConfig(generatedResult.config);
    onClose();
  };

  const handleDownloadPdf = () => {
    const configToExport = generatedResult ? generatedResult.config : currentConfig;
    soundFx.playSuccess();
    generateArchitecturalPdf(configToExport, siteConfig);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0b101b] border border-[#00f0ff]/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d1424]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                  BEAST AI ARCHITECT
                </h2>
                <span className="text-[10px] font-mono uppercase bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded font-bold">
                  Generative Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prompt your dream container home in natural language — the AI designs the full architecture, rooms &amp; materials.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Prompt Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Describe Your House Concept</span>
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 40ft two-bedroom luxury villa with Shou Sugi Ban exterior, spa bathroom, open kitchen lounge, floor-to-ceiling glass sliding doors, and an outdoor cedar deck with plunge pool..."
                rows={3}
                className="w-full rounded-xl bg-[#080d16] border border-slate-700/80 focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] p-3 text-sm text-white placeholder-slate-500 transition resize-none font-sans outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
              />
              <div className="absolute bottom-2.5 right-2.5">
                <button
                  onClick={() => handleGenerate()}
                  disabled={isLoading || !prompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00f0ff] hover:bg-[#00d2df] text-black font-heading text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Architecting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create House</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Press Cmd + Enter to generate</span>
              <span>Generates 3D layout, rooms, finishes &amp; turnkey quote</span>
            </div>
          </div>

          {/* AI Architect Advisory Card */}
          <div className="p-3.5 rounded-xl bg-[#0d1627] border border-[#00f0ff]/40 shadow-lg space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#00f0ff]/20 text-[#00f0ff] shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-heading font-bold text-white flex items-center gap-2">
                  <span>AI ARCHITECT ASKS:</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] font-bold">
                    CIRCULATION &amp; DOOR SPEC
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  &ldquo;How would you like your layout structured? Should the washroom be an <strong>Attached Ensuite Bath</strong> inside the master bedroom, or accessed via an <strong>independent corridor</strong> so no one walks through a bedroom? And would you prefer <strong>sliding pocket doors</strong> or <strong>hinged doors</strong>?&rdquo;
                </p>
              </div>
            </div>

            {/* Quick 1-Click Inclusion Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const addition = " with attached master ensuite bath, sliding pocket door, and central corridor circulation";
                  const newText = prompt.trim() ? `${prompt.trim()}${addition}` : `40ft luxury container villa${addition}`;
                  setPrompt(newText);
                  handleGenerate(newText);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#00f0ff]/15 hover:bg-[#00f0ff]/30 text-[#00f0ff] text-xs font-mono font-bold border border-[#00f0ff]/40 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Attached Bath (Ensuite) + Sliding Door</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const addition = " with hallway corridor access to washroom, zero walkthrough through bedrooms, and sliding doors";
                  const newText = prompt.trim() ? `${prompt.trim()}${addition}` : `40ft container home${addition}`;
                  setPrompt(newText);
                  handleGenerate(newText);
                }}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition flex items-center gap-1"
              >
                <span>+ Corridor Bath (Private Bedrooms)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const addition = " with modern sliding pocket doors inside the house";
                  const newText = prompt.trim() ? `${prompt.trim()}${addition}` : `40ft container villa${addition}`;
                  setPrompt(newText);
                }}
                className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition"
              >
                + Sliding Pocket Doors
              </button>
              <button
                type="button"
                onClick={() => {
                  const addition = " with hinged interior bathroom door";
                  const newText = prompt.trim() ? `${prompt.trim()}${addition}` : `40ft container villa${addition}`;
                  setPrompt(newText);
                }}
                className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition"
              >
                + Hinged Door
              </button>
              <button
                type="button"
                onClick={() => {
                  const addition = " with 16ft full-glass sliding patio doors and sliding windows";
                  const newText = prompt.trim() ? `${prompt.trim()}${addition}` : `40ft container villa${addition}`;
                  setPrompt(newText);
                }}
                className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition"
              >
                + 16ft Sliding Patio Doors
              </button>
            </div>
          </div>

          {/* Inspiration Quick Chips */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 font-semibold block">
              Or Click a Pre-Engineered Architectural Concept:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INSPIRATION_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(item.prompt);
                    handleGenerate(item.prompt);
                  }}
                  className="text-left p-2.5 rounded-xl bg-[#0c121f] hover:bg-[#111a2e] border border-slate-800 hover:border-[#00f0ff]/50 transition group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-[#00f0ff] transition">
                      {item.title}
                    </span>
                    <span className="text-[9px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Loading Animation State */}
          {isLoading && (
            <div className="p-6 rounded-xl bg-[#0c1424]/80 border border-[#00f0ff]/30 text-center space-y-3 animate-pulse">
              <div className="inline-flex p-3 rounded-full bg-[#00f0ff]/10 text-[#00f0ff]">
                <Wand2 className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="font-heading text-sm font-bold text-white tracking-wide">
                AI Architect is Calculating Structural Blueprint...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Synthesizing ISO container load calculations, continuous R-value insulation, custom room partition spacing, and exterior rainscreen finishes.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-start justify-between gap-3 text-xs text-rose-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Generation Notice:</strong>
                  <span>{error}</span>
                </div>
              </div>
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-white font-mono text-[11px] font-bold border border-rose-700 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Generated Result Preview Card */}
          {generatedResult && (
            <div className="p-4 rounded-xl bg-[#0e1626] border border-[#00f0ff]/40 space-y-4 shadow-[0_0_25px_rgba(0,240,255,0.15)] animate-in fade-in slide-in-from-bottom-2">
              {generatedResult.notice && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-[11px] font-mono">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{generatedResult.notice}</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      Architectural Proposal Ready
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-white mt-1">
                    {generatedResult.config.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {generatedResult.config.subtitle}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">DIMENSIONS</span>
                  <span className="text-xs font-mono font-bold text-[#00f0ff]">
                    {generatedResult.config.lengthFt}ft × {generatedResult.config.widthFt}ft ({generatedResult.config.lengthFt * generatedResult.config.widthFt} sq ft)
                  </span>
                </div>
              </div>

              {/* Rationale Quote */}
              {generatedResult.architectRationale && (
                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-xs text-slate-300 italic leading-relaxed">
                  "{generatedResult.architectRationale}"
                </div>
              )}

              {/* Room Breakdown Grid */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                  Generated Room Divisions ({generatedResult.config.partitions.length} Spaces):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {generatedResult.config.partitions.map((rm, i) => (
                    <div
                      key={rm.id || i}
                      className="p-2 rounded-lg bg-[#080d16] border border-slate-800 text-xs flex flex-col"
                    >
                      <span className="font-bold text-white truncate">{rm.name}</span>
                      <span className="text-[10px] font-mono text-[#00f0ff]">
                        {rm.roomType.toUpperCase()} • @ {rm.positionFt}ft
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Specs Pills */}
              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
                <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700">
                  Facade: <strong className="text-white">{generatedResult.config.exteriorMaterial}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700">
                  Roof: <strong className="text-white">{generatedResult.config.roofOption}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700">
                  Flooring: <strong className="text-white">{generatedResult.config.flooringMaterial}</strong>
                </span>
                {generatedResult.config.outdoorAmenities?.plungePool && (
                  <span className="px-2 py-1 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                    ✓ Plunge Pool Included
                  </span>
                )}
                {generatedResult.config.outdoorAmenities?.firePitLounge && (
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    ✓ Fire Pit Lounge
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={handleApply}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#00f0ff] hover:bg-[#00d2df] text-black font-heading text-xs font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)] transition"
                >
                  <Home className="w-4 h-4" />
                  <span>Apply &amp; Inspect in 3D</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-slate-700 transition"
                  title="Download Certified Architectural PDF Spec Sheet"
                >
                  <Download className="w-4 h-4 text-[#00f0ff]" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#090e18] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>ISO 668 High-Cube Compliant</span>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#00f0ff] transition font-mono"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Current Blueprint PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
