import React from 'react';
import { X, Command, Keyboard, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: '1 - 5', label: 'Quick Load Presets', desc: 'Monaco, Aspen, Bel-Air, Zurich, Kyoto' },
  { key: 'B', label: 'AI Architect Bot', desc: 'Prompt natural language house creator & instant PDF exporter' },
  { key: 'V', label: 'Cycle View Modes', desc: 'Switch between 3D Orbit, 2D Site Plan, and VR Walkthrough' },
  { key: 'T', label: 'Cinematic Drone Tour', desc: 'Start 4K rotating architectural video presentation' },
  { key: 'R', label: 'Cutaway Roof / X-Ray', desc: 'Inspect interior layout, bedrooms, kitchen, & furniture' },
  { key: 'M', label: 'Measurements & Scale', desc: 'Open certified millimeter precision dimensions & setbacks' },
  { key: 'G', label: 'Toggle 1ft Grid', desc: 'Enable/disable 1:1 real-world calibrated floor grid' },
  { key: 'P', label: 'Blueprint Specs', desc: 'Launch certified structural & foundation blueprint PDF sheet' },
  { key: 'S', label: 'Save Configuration', desc: 'Save active model to your architectural project portfolio' },
  { key: 'Esc', label: 'Close Dialogs / Focus', desc: 'Dismiss active modals, menus, and overlays' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#090e17] border border-[#1e293b] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-white tracking-wider flex items-center gap-2">
                <span>STUDIO HOTKEYS &amp; SHORTCUTS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
                  PRO
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Instant keyboard navigation for architectural CAD controls
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

        {/* Shortcuts List */}
        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f172a]/60 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div>
                <div className="text-xs font-semibold text-white">{item.label}</div>
                <div className="text-[11px] text-slate-400 font-mono">{item.desc}</div>
              </div>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-[#00f0ff] shadow-inner shrink-0">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
            Certified 1:1 Scale Precision Viewport
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
