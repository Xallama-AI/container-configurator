import React from 'react';
import { 
  Glasses, 
  Compass, 
  DoorOpen, 
  X, 
  Home, 
  Sparkles, 
  HelpCircle,
  Eye
} from 'lucide-react';

interface VRWalkthroughOverlayProps {
  onExitVR: () => void;
  onTeleport: (roomKey: 'porch' | 'lounge' | 'kitchen' | 'bedroom' | 'bath' | 'deck') => void;
  onToggleAllDoors: () => void;
  allDoorsOpen: boolean;
  isStereoscopic: boolean;
  onToggleStereoscopic: () => void;
  onEnterWebXR?: () => void;
  hasWebXRSupport?: boolean;
}

export const VRWalkthroughOverlay: React.FC<VRWalkthroughOverlayProps> = ({
  onExitVR,
  onTeleport,
  onToggleAllDoors,
  allDoorsOpen,
  isStereoscopic,
  onToggleStereoscopic,
  onEnterWebXR,
  hasWebXRSupport = false,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-30 select-none">
      {/* Top VR Status Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 shadow-xl">
          <Glasses className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
              VR Walkthrough Mode <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </span>
            <span className="text-[11px] text-slate-300">
              Immersive 1:1 Scale • Move: WASD / Touch Joystick • Look: Mouse / Gyro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* WebXR Headset Button if supported */}
          {hasWebXRSupport && onEnterWebXR && (
            <button
              onClick={onEnterWebXR}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all"
              title="Launch WebXR Session on Meta Quest or Vision Pro"
            >
              <Glasses className="w-4 h-4" />
              <span>Enter VR Headset</span>
            </button>
          )}

          {/* Dual-Eye Stereoscopic Mode (Google Cardboard / Mobile VR) */}
          <button
            onClick={onToggleStereoscopic}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              isStereoscopic 
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/30' 
                : 'bg-slate-900/85 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Toggle Split-Screen Stereoscopic VR for mobile phone headsets"
          >
            <Eye className="w-4 h-4" />
            <span>{isStereoscopic ? 'Single View' : 'Cardboard VR'}</span>
          </button>

          {/* Toggle All Doors Open / Closed */}
          <button
            onClick={onToggleAllDoors}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              allDoorsOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-900/85 text-slate-200 border-slate-700 hover:bg-slate-800'
            }`}
            title="Open or close all doors and sliding windows in the house"
          >
            <DoorOpen className="w-4 h-4 text-cyan-400" />
            <span>{allDoorsOpen ? 'Close Doors' : 'Open All Doors'}</span>
          </button>

          {/* Exit VR Mode */}
          <button
            onClick={onExitVR}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Exit VR</span>
          </button>
        </div>
      </div>

      {/* Center Subtle Crosshair for Door/Window Focus */}
      {!isStereoscopic && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-4 border border-cyan-400/40 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Bottom Room Navigation & Quick Teleport Strip */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-2xl overflow-x-auto max-w-full">
          <span className="text-[11px] font-bold text-slate-400 uppercase px-2.5 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" /> Teleport:
          </span>

          <button
            onClick={() => onTeleport('porch')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
          >
            Front Porch
          </button>

          <button
            onClick={() => onTeleport('lounge')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
          >
            Living Lounge
          </button>

          <button
            onClick={() => onTeleport('kitchen')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
          >
            Chef's Kitchen
          </button>

          <button
            onClick={() => onTeleport('bedroom')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
          >
            Master Suite
          </button>

          <button
            onClick={() => onTeleport('bath')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
          >
            Spa Bath
          </button>

          <button
            onClick={() => onTeleport('deck')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-500/50 transition-colors whitespace-nowrap"
          >
            Sunset Terrace
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-black/60 px-3 py-1 rounded-full border border-white/10">
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          <span>Click on any door or window in the scene to open or close it smoothly.</span>
        </div>
      </div>
    </div>
  );
};
