import React from 'react';
import { 
  ContainerModelConfig, 
  SitePlanningConfig, 
  ViewMode, 
  UserAccount 
} from '../types';
import { BrandLogo } from './BrandLogo';
import { soundFx } from '../utils/audio';
import { 
  Sparkles, 
  Menu, 
  Sofa, 
  Home,
  Glasses,
  Camera,
  Video,
  DoorOpen,
  DoorClosed,
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
  ShieldCheck, 
  Download,
  SlidersHorizontal
} from 'lucide-react';

interface NavbarProps {
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSelectPreset: (preset: ContainerModelConfig) => void;
  onUpdateSite: (partial: Partial<SitePlanningConfig>) => void;
  onUpdateModel: (partial: Partial<ContainerModelConfig>) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onLogout?: () => void;
  onOpenAdmin: () => void;
  onOpenSpec: () => void;
  onOpenAR: () => void;
  onSaveConfig: () => void;
  onToggleDrawer?: () => void;
  controlsDrawerOpen?: boolean;
  onOpenMeasurements: () => void;
  isOwnerAdmin: boolean;
  pendingApprovalsCount: number;
  onToggleShortcuts: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onOpenAiArchitect?: () => void;
  onDownloadPdf?: () => void;
  onToggleAiPromptSidebar?: () => void;
  isAiPromptSidebarOpen?: boolean;
  onToggleHousesSidebar?: () => void;
  isHousesSidebarOpen?: boolean;
  onOpenEditBar?: () => void;
  onOpenHouses?: () => void;
  isRightSidebarOpen?: boolean;
  rightSidebarActiveTab?: 'houses' | 'edit';
}

export const Navbar: React.FC<NavbarProps> = ({
  modelConfig,
  viewMode,
  onViewModeChange,
  onUpdateModel,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  isOwnerAdmin,
  pendingApprovalsCount,
  isSoundMuted,
  onToggleSound,
  onOpenAiArchitect,
  onDownloadPdf,
  onOpenAR,
  onToggleAiPromptSidebar,
  isAiPromptSidebarOpen,
  onToggleHousesSidebar,
  isHousesSidebarOpen,
  onOpenEditBar,
  onOpenHouses,
  isRightSidebarOpen,
  rightSidebarActiveTab,
}) => {
  const isDoorsOpen = !!modelConfig.frontDoorOpen ||
    !!modelConfig.cargoDoorsOpen ||
    !!modelConfig.interiorDoorsOpen ||
    (modelConfig.openings || []).some((o) => o.isOpen) ||
    Object.values(modelConfig.doorStates || {}).some(Boolean);

  const handleToggleDoors = () => {
    const next = !isDoorsOpen;
    if (next) {
      soundFx.playDoorOpen();
    } else {
      soundFx.playDoorClose();
    }
    onUpdateModel({
      frontDoorOpen: next,
      cargoDoorsOpen: next,
      interiorDoorsOpen: next,
      doorStates: {
        'interior-bath-door': next,
        'interior-bed-door': next,
      },
      openings: (modelConfig.openings || []).map((o) => ({ ...o, isOpen: next })),
    });
  };

  const handleToggleInteriorExterior = (interior: boolean) => {
    soundFx.playClick();
    onUpdateModel({ cutawayRoof: interior });
  };

  const handleToggleVR = () => {
    soundFx.playModeSwitch();
    onViewModeChange(viewMode === 'walkthrough-vr' || viewMode === 'vr-walkthrough' ? '3d-orbit' : 'vr-walkthrough');
  };

  const handleToggleVideoTour = () => {
    soundFx.playModeSwitch();
    onViewModeChange(viewMode === 'cinematic-tour' ? '3d-orbit' : 'cinematic-tour');
  };

  return (
    <header className="app-navbar relative z-40 h-16 w-full flex items-center justify-between px-3 sm:px-5 border-b border-[#1e293b]/90 bg-[#090d16]/96 backdrop-blur-xl shrink-0 select-none shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
      {/* Top Cyber Hairline Accent */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00f0ff]/60 to-transparent pointer-events-none" />

      {/* ========================================================= */}
      {/* LEFT: BRAND IDENTITY & BUSINESS NAME                      */}
      {/* ========================================================= */}
      <div className="navbar-brand flex items-center gap-2 sm:gap-3 shrink-0">
        <BrandLogo size={34} showText={true} />
        {onToggleAiPromptSidebar && (
          <button
            onClick={onToggleAiPromptSidebar}
            className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition border ${
              isAiPromptSidebarOpen
                ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#0e1626] text-[#00f0ff] hover:bg-[#142036] border-[#00f0ff]/40'
            }`}
            title="Side Area to Prompt AI & Edit Interior"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">PROMPT AI</span>
            <span className="lg:hidden">AI</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* CENTER: INTERIOR/EXTERIOR SWITCH, AR/VR & VIDEO TOUR      */}
      {/* ========================================================= */}
      <div className="navbar-modes flex items-center gap-1.5 sm:gap-2.5">
        {/* Exterior vs Interior Segmented Switch */}
        <div className="flex items-center gap-1 bg-[#0b101c] p-1 rounded-2xl border border-slate-800 font-mono text-xs shadow-inner">
          <button
            onClick={() => handleToggleInteriorExterior(false)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition font-bold text-xs ${
              !modelConfig.cutawayRoof
                ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.45)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Exterior: Solid Architecture & Roof"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="tracking-wider">EXTERIOR</span>
          </button>
          <button
            onClick={() => handleToggleInteriorExterior(true)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition font-bold text-xs ${
              modelConfig.cutawayRoof
                ? 'bg-[#00f0ff] text-black shadow-[0_0_12px_rgba(0,240,255,0.24)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Interior: Cutaway Roof & Furnished Rooms"
          >
            <Sofa className="w-3.5 h-3.5" />
            <span className="tracking-wider">INTERIOR</span>
          </button>
        </div>

        {/* House Visit Video Tour */}
        <button
          onClick={handleToggleVideoTour}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-mono font-bold transition border ${
            viewMode === 'cinematic-tour'
              ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.24)]'
              : 'bg-[#090c10] text-slate-300 hover:text-[#00f0ff] border-[#25313a] hover:bg-[#101419]'
          }`}
          title="House Visit Video: Automated 60fps walkthrough tour with operable doors & video recording"
        >
          <Video className="w-4 h-4" />
          <span className="hidden md:inline">
            {viewMode === 'cinematic-tour' ? 'EXIT VIDEO' : 'HOUSE VISIT VIDEO'}
          </span>
          <span className="md:hidden">
            {viewMode === 'cinematic-tour' ? 'EXIT' : 'VIDEO'}
          </span>
        </button>

        {/* VR (Virtual Reality) Walkthrough */}
        <button
          onClick={handleToggleVR}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-mono font-bold transition border ${
            viewMode === 'walkthrough-vr' || viewMode === 'vr-walkthrough'
              ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.24)]'
              : 'bg-[#090c10] text-slate-300 hover:text-[#00f0ff] border-[#25313a] hover:bg-[#101419]'
          }`}
          title="VR Feature: 1:1 Scale Immersive Virtual Reality Walkthrough"
        >
          <Glasses className="w-4 h-4" />
          <span className="hidden sm:inline">
            {viewMode === 'walkthrough-vr' || viewMode === 'vr-walkthrough' ? 'EXIT VR' : 'VR MODE'}
          </span>
          <span className="sm:hidden">VR</span>
        </button>

        {/* AR (Augmented Reality) Real-World Overlay */}
        <button
          onClick={() => {
            soundFx.playChime();
            onOpenAR();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-mono font-bold transition border bg-[#090c10] text-slate-300 hover:text-[#00f0ff] border-[#25313a] hover:bg-[#101419]"
          title="AR Feature: Project house in real-world scale using camera or mobile AR"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">AR MODE</span>
          <span className="sm:hidden">AR</span>
        </button>

        {/* Doors & Windows Operable Toggle - Accessible across Phone, Tablet & Laptop */}
        <button
          onClick={handleToggleDoors}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-mono font-bold transition border ${
            isDoorsOpen
              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'bg-[#0e1626] text-slate-300 border-slate-700/80 hover:text-white hover:border-slate-500'
          }`}
          title={isDoorsOpen ? 'Close All Doors & Windows' : 'Open All Doors & Windows'}
        >
          {isDoorsOpen ? (
            <DoorOpen className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <DoorClosed className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span className="hidden md:inline">{isDoorsOpen ? 'DOORS OPEN' : 'OPEN DOORS'}</span>
          <span className="md:hidden text-[10px]">{isDoorsOpen ? 'OPEN' : 'DOORS'}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* RIGHT: HOUSES SELECTOR, PROMPT AI AGENT & PROFILE         */}
      {/* ========================================================= */}
      <div className="navbar-actions flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Edit Bar Action */}
        {onOpenEditBar && (
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenEditBar();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition border ${
              isRightSidebarOpen && rightSidebarActiveTab === 'edit'
                ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#0e1626] text-[#00f0ff] hover:bg-[#15233d] border-[#00f0ff]/40 hover:text-white'
            }`}
            title="Open Live Architectural Customizer (Kitchen, Bedroom, Sitting, Washroom, Openings)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EDIT BAR</span>
            <span className="sm:hidden">EDIT</span>
          </button>
        )}

        {/* Change Houses Gallery Action */}
        {(onOpenHouses || onToggleHousesSidebar) && (
          <button
            onClick={() => {
              soundFx.playClick();
              if (onOpenHouses) onOpenHouses();
              else if (onToggleHousesSidebar) onToggleHousesSidebar();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition border ${
              isRightSidebarOpen && rightSidebarActiveTab === 'houses'
                ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.24)]'
                : 'bg-[#090c10] text-slate-300 hover:bg-[#101419] border-[#25313a] hover:text-[#00f0ff]'
            }`}
            title="Change House Models & Architecture Designs"
          >
            <Home className="w-3.5 h-3.5 text-current" />
            <span className="hidden sm:inline">CHANGE HOUSES</span>
            <span className="sm:hidden">HOUSES</span>
          </button>
        )}

        {/* Prompt AI Agent Primary Action */}
        {onOpenAiArchitect && (
          <button
            onClick={() => {
              soundFx.playChime();
              onOpenAiArchitect();
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#00f0ff] hover:bg-[#7af6ff] text-black font-heading text-xs font-bold shadow-[0_4px_16px_rgba(0,240,255,0.2)] transition hover:scale-[1.02] active:scale-[0.98]"
            title="Prompt AI Agent: Describe your house & let AI build it"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">PROMPT AI AGENT</span>
            <span className="sm:hidden">AI AGENT</span>
          </button>
        )}

        {/* Audio Mute / Unmute */}
        <button
          onClick={onToggleSound}
          className={`hidden sm:flex p-2 rounded-xl border transition ${
            isSoundMuted
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-[#090c10] hover:bg-[#151a20] text-slate-400 hover:text-white border-[#25313a]'
          }`}
          title={isSoundMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#00f0ff]" />}
        </button>

        {/* Admin Portal Indicator if Owner */}
        {isOwnerAdmin && (
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenAdmin();
            }}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#00f0ff]/10 hover:bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/25 text-xs font-mono font-bold transition"
            title="Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Admin</span>
            {pendingApprovalsCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        )}

        {/* User Account / Sign-In */}
        {currentUser ? (
          <button
            onClick={() => {
              soundFx.playClick();
              isOwnerAdmin ? onOpenAdmin() : onOpenAuth();
            }}
            className="hidden xl:flex items-center gap-2 rounded-xl bg-[#162032] px-2.5 py-1.5 border border-slate-700 hover:border-slate-600 transition"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00f0ff] text-black font-bold text-[10px]">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] font-mono text-slate-200 truncate max-w-[80px]">
              {currentUser.name.split(' ')[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenAuth();
            }}
            className="hidden xl:flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 border border-slate-700 text-xs font-mono transition"
          >
            <LogIn className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Sign-In</span>
          </button>
        )}

        {/* Direct Download Blueprint PDF Action */}
        {onDownloadPdf && (
          <button
            onClick={() => {
              soundFx.playSuccess();
              onDownloadPdf();
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-[#0e1626] hover:bg-[#162238] border border-slate-700 hover:border-[#00f0ff]/50 text-slate-200 hover:text-white text-xs font-mono font-bold transition shadow-sm"
            title="Download Certified Architectural Blueprint PDF"
          >
            <Download className="w-4 h-4 text-[#00f0ff]" />
            <span className="hidden md:inline">PDF BLUEPRINT</span>
            <span className="md:hidden">PDF</span>
          </button>
        )}
      </div>
    </header>
  );
};
