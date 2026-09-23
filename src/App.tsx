import React, { useState, useEffect } from 'react';
import { 
  ContainerModelConfig, 
  SitePlanningConfig, 
  ViewMode, 
  UserAccount, 
  SubdomainConfig, 
  SavedConfiguration 
} from './types';
import { PRESET_MODELS } from './data/presets';
import { calculateConfigurationCost } from './utils/calculator';
import { soundFx } from './utils/audio';
import { Navbar } from './components/Navbar';
import { ThreeContainerScene } from './components/ThreeContainerScene';
import { AuthModal } from './components/AuthModal';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { SpecSheetModal } from './components/SpecSheetModal';
import { CameraAROverlay } from './components/CameraAROverlay';
import { ARMobileModal } from './components/ARMobileModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { AiArchitectBotModal } from './components/AiArchitectBotModal';
import { AiPromptSidebar } from './components/AiPromptSidebar';
import { RightStudioSidebar } from './components/RightStudioSidebar';
import { generateArchitecturalPdf } from './utils/pdfGenerator';
import { BrandLogo } from './components/BrandLogo';
import { 
  CheckCircle2, 
  Camera,
  Bot,
  Sparkles,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

const FIRST_OWNER_EMAIL = 'abdulahad2086907@gmail.com';

const INITIAL_SUBDOMAIN_CONFIG: SubdomainConfig = {
  subdomain: 'configurator.gridandlogic.com',
  targetHost: 'ghs.googlehosted.com',
  txtRecordVerification: 'google-site-verification=g_l_container_arch_98412',
  status: 'active',
  sslStatus: 'active',
  verifiedAt: new Date().toISOString(),
};

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'owner-admin-1',
    email: FIRST_OWNER_EMAIL,
    name: 'Abdul Ahad',
    role: 'super_admin',
    isFirstOwner: true,
    verifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    company: 'Grid & Logic Modular Systems',
  },
  {
    id: 'client-verified-1',
    email: 'david.architect@gmail.com',
    name: 'David Vance',
    role: 'verified_client',
    isFirstOwner: false,
    verifiedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    company: 'Vance Architecture Studio',
  },
  {
    id: 'client-pending-1',
    email: 'sarah.client@example.com',
    name: 'Sarah Jenkins',
    role: 'pending_client',
    isFirstOwner: false,
    createdAt: new Date().toISOString(),
    company: 'Eco-Living Sites LLC',
  },
];

const INITIAL_SITE_CONFIG: SitePlanningConfig = {
  lotWidthFt: 80,
  lotDepthFt: 120,
  setbackFrontFt: 20,
  setbackRearFt: 15,
  setbackSideFt: 10,
  showSetbacks: true,
  containerOffsetXFt: 0,
  containerOffsetZFt: 0,
  containerRotationDeg: 0,
  show1ftGrid: true,
  showDimensions: true,
  showHumanFigure: true,
  showVehicleScale: false,
  showLandscaping: true,
  timeOfDayHours: 14,
  orientationCompassDeg: 0,
  unitSystem: 'imperial',
};

export default function App() {
  // Model state: initialize with Horizon 40ft HC Villa
  const [modelConfig, setModelConfig] = useState<ContainerModelConfig>(PRESET_MODELS[1]);
  const [siteConfig, setSiteConfig] = useState<SitePlanningConfig>(INITIAL_SITE_CONFIG);
  const [viewMode, setViewMode] = useState<ViewMode>('3d-orbit');

  // Authentication & Users state with persistent localStorage
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('grid_logic_current_user');
      return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default logged in as Owner for seamless inspection
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('grid_logic_users_db');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [subdomainConfig, setSubdomainConfig] = useState<SubdomainConfig>(() => {
    try {
      const saved = localStorage.getItem('grid_logic_subdomain_config');
      return saved ? JSON.parse(saved) : INITIAL_SUBDOMAIN_CONFIG;
    } catch {
      return INITIAL_SUBDOMAIN_CONFIG;
    }
  });

  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>(() => {
    try {
      const saved = localStorage.getItem('grid_logic_saved_configs');
      if (saved) return JSON.parse(saved);
      // Sample saved configuration
      return [
        {
          id: 'proj-1',
          userId: 'client-verified-1',
          userName: 'David Vance',
          userEmail: 'david.architect@gmail.com',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          model: PRESET_MODELS[1],
          site: INITIAL_SITE_CONFIG,
          estimatedCostUsd: 114200,
          status: 'engineering_review',
        },
      ];
    } catch {
      return [];
    }
  });

  // UI Modals & Panels state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showSpecModal, setShowSpecModal] = useState<boolean>(false);
  const [showAROverlay, setShowAROverlay] = useState<boolean>(false);
  const [showARMobileModal, setShowARMobileModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState<boolean>(false);
  const [showAiArchitectModal, setShowAiArchitectModal] = useState<boolean>(false);
  const [isAiPromptSidebarOpen, setIsAiPromptSidebarOpen] = useState<boolean>(true); // Open by default for immediate accessibility
  const [isHousesSidebarOpen, setIsHousesSidebarOpen] = useState<boolean>(false);
  const [rightStudioActiveTab, setRightStudioActiveTab] = useState<'houses' | 'edit'>('edit');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundFx.getIsMuted());
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsSoundMuted(muted);
  };

  const handleDownloadPdf = () => {
    soundFx.playSuccess();
    generateArchitecturalPdf(modelConfig, siteConfig, currentUser?.name);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName.toUpperCase());
      if (isInput) return;

      // 1-5 for Presets
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (PRESET_MODELS[idx]) {
          soundFx.playChime();
          setModelConfig(PRESET_MODELS[idx]);
        }
      } else if (e.key === 'v' || e.key === 'V') {
        soundFx.playModeSwitch();
        setViewMode((prev) => {
          if (prev === '3d-orbit') return 'floorplan-2d';
          if (prev === 'floorplan-2d') return 'walkthrough-vr';
          return '3d-orbit';
        });
      } else if (e.key === 'm' || e.key === 'M') {
        soundFx.playClick();
        setShowMeasurementsModal((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        soundFx.playClick();
        setSiteConfig((prev) => ({ ...prev, show1ftGrid: !prev.show1ftGrid }));
      } else if (e.key === 'r' || e.key === 'R') {
        soundFx.playClick();
        setModelConfig((prev) => ({ ...prev, cutawayRoof: !prev.cutawayRoof }));
      } else if (e.key === 't' || e.key === 'T') {
        soundFx.playModeSwitch();
        setViewMode((prev) => (prev === 'cinematic-tour' ? '3d-orbit' : 'cinematic-tour'));
      } else if (e.key === 'p' || e.key === 'P') {
        soundFx.playClick();
        setShowSpecModal(true);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveConfig();
      } else if (e.key === '?') {
        soundFx.playClick();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        soundFx.playChime();
        setShowAiArchitectModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setShowMeasurementsModal(false);
        setShowAuthModal(false);
        setShowAdminModal(false);
        setShowSpecModal(false);
        setShowAROverlay(false);
        setShowAiArchitectModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('grid_logic_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('grid_logic_current_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('grid_logic_users_db', JSON.stringify(usersList));
    } catch (e) {
      console.error(e);
    }
  }, [usersList]);

  useEffect(() => {
    try {
      localStorage.setItem('grid_logic_subdomain_config', JSON.stringify(subdomainConfig));
    } catch (e) {
      console.error(e);
    }
  }, [subdomainConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('grid_logic_saved_configs', JSON.stringify(savedConfigs));
    } catch (e) {
      console.error(e);
    }
  }, [savedConfigs]);

  // Model & Site updates
  const handleUpdateModel = (partial: Partial<ContainerModelConfig>) => {
    setModelConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleUpdateSite = (partial: Partial<SitePlanningConfig>) => {
    setSiteConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleSelectPreset = (presetOrId: ContainerModelConfig | string) => {
    if (typeof presetOrId === 'string') {
      const found = PRESET_MODELS.find((p) => p.presetId === presetOrId);
      if (found) {
        setModelConfig(found);
      }
    } else if (presetOrId && typeof presetOrId === 'object') {
      setModelConfig(presetOrId);
    }
  };

  // Auth handlers
  const handleLogin = (user: UserAccount) => {
    // Check if email is first owner or if this is the very first user
    const isOwner =
      user.email.toLowerCase() === FIRST_OWNER_EMAIL.toLowerCase() ||
      (usersList.length === 0 && !usersList.some((u) => u.isFirstOwner));

    const finalRole = isOwner ? 'super_admin' : user.role || 'pending_client';

    const updatedUser: UserAccount = {
      ...user,
      role: finalRole,
      isFirstOwner: isOwner,
      verifiedAt: isOwner ? new Date().toISOString() : user.verifiedAt,
    };

    setCurrentUser(updatedUser);

    // Update in usersList
    setUsersList((prev) => {
      const idx = prev.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedUser;
        return copy;
      }
      return [...prev, updatedUser];
    });

    setShowAuthModal(false);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUpdateUserRole = (userId: string, newRole: UserAccount['role']) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            role: newRole,
            verifiedAt: newRole === 'verified_client' ? new Date().toISOString() : u.verifiedAt,
          };
        }
        return u;
      })
    );

    // If current logged-in user was updated
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
  };

  // Save Project Handler
  const handleSaveConfig = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const cost = calculateConfigurationCost(modelConfig);
    const newConfig: SavedConfiguration = {
      id: `proj-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: modelConfig,
      site: siteConfig,
      estimatedCostUsd: cost.totalUsd,
      status: 'submitted_for_review',
    };

    setSavedConfigs((prev) => [newConfig, ...prev]);
    setSaveToast(`Configuration "${modelConfig.name}" saved! Submitted for Grid & Logic review.`);
    setTimeout(() => setSaveToast(null), 4000);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const cost = calculateConfigurationCost(modelConfig);
  const pendingApprovalsCount = usersList.filter((u) => u.role === 'pending_client').length;
  const isOwnerAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#05080e] text-slate-100 overflow-hidden font-sans">
      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-[#00f0ff] text-black font-semibold px-4 py-2.5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* BEAST LUXURY ARCHITECTURAL NAVBAR */}
      <Navbar
        modelConfig={modelConfig}
        siteConfig={siteConfig}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSelectPreset={handleSelectPreset}
        onUpdateSite={handleUpdateSite}
        onUpdateModel={handleUpdateModel}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenSpec={() => setShowSpecModal(true)}
        onOpenAR={() => setShowARMobileModal(true)}
        onSaveConfig={handleSaveConfig}
        onOpenMeasurements={() => setShowMeasurementsModal(true)}
        isOwnerAdmin={isOwnerAdmin}
        pendingApprovalsCount={pendingApprovalsCount}
        onToggleShortcuts={() => setShowShortcutsModal(!showShortcutsModal)}
        isSoundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
        onOpenAiArchitect={() => setShowAiArchitectModal(true)}
        onDownloadPdf={handleDownloadPdf}
        onToggleAiPromptSidebar={() => setIsAiPromptSidebarOpen(!isAiPromptSidebarOpen)}
        isAiPromptSidebarOpen={isAiPromptSidebarOpen}
        onToggleHousesSidebar={() => setIsHousesSidebarOpen(!isHousesSidebarOpen)}
        isHousesSidebarOpen={isHousesSidebarOpen}
        onOpenEditBar={() => {
          setIsHousesSidebarOpen(true);
          setRightStudioActiveTab('edit');
        }}
        onOpenHouses={() => {
          setIsHousesSidebarOpen(true);
          setRightStudioActiveTab('houses');
        }}
        isRightSidebarOpen={isHousesSidebarOpen}
        rightSidebarActiveTab={rightStudioActiveTab}
      />

      {/* MAIN WORKSPACE AREA */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* 3D Interactive Viewport / Canvas */}
        <main className="relative flex-1 h-full w-full bg-[#05080e] overflow-hidden">
          <ThreeContainerScene
            modelConfig={modelConfig}
            siteConfig={siteConfig}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onUpdateSiteConfig={handleUpdateSite}
            onUpdateModelConfig={handleUpdateModel}
            isPresentationMode={isPresentationMode}
            onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
            onOpenSpecSheet={() => setShowSpecModal(true)}
            onOpenARCamera={() => setShowARMobileModal(true)}
            onOpenCustomizerTab={() => {
              setIsHousesSidebarOpen(true);
              setRightStudioActiveTab('edit');
            }}
            externalShowMeasurements={showMeasurementsModal}
            onCloseMeasurements={() => setShowMeasurementsModal(false)}
          />

          {/* Left-Docked AI Prompt & Generative Architecture Sidebar */}
          <AiPromptSidebar
            isOpen={isAiPromptSidebarOpen}
            onToggle={() => setIsAiPromptSidebarOpen(!isAiPromptSidebarOpen)}
            modelConfig={modelConfig}
            siteConfig={siteConfig}
            onUpdateModel={handleUpdateModel}
            onApplyConfig={handleSelectPreset}
          />

          {/* Right-Docked Live Edit Bar & Houses Architecture Studio Sidebar */}
          <RightStudioSidebar
            isOpen={isHousesSidebarOpen}
            onToggle={() => setIsHousesSidebarOpen(!isHousesSidebarOpen)}
            activeTab={rightStudioActiveTab}
            onTabChange={setRightStudioActiveTab}
            modelConfig={modelConfig}
            siteConfig={siteConfig}
            onUpdateModel={handleUpdateModel}
            onSelectHouse={handleSelectPreset}
          />
        </main>
      </div>

      {/* MODAL 1: AUTHENTICATION & GOOGLE SIGN-IN */}
      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          onLogin={handleLogin}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* MODAL 2: MASTER ADMIN CONSOLE */}
      {showAdminModal && currentUser && isOwnerAdmin && (
        <AdminConsoleModal
          currentUser={currentUser}
          usersList={usersList}
          savedConfigs={savedConfigs}
          subdomainConfig={subdomainConfig}
          onUpdateUserRole={handleUpdateUserRole}
          onDeleteUser={handleDeleteUser}
          onUpdateSubdomainConfig={setSubdomainConfig}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {/* MODAL 3: CERTIFIED TECHNICAL BLUEPRINT & SPEC SHEET */}
      {showSpecModal && (
        <SpecSheetModal
          modelConfig={modelConfig}
          siteConfig={siteConfig}
          currentUser={currentUser}
          onClose={() => setShowSpecModal(false)}
        />
      )}

      {/* MODAL 4: CAMERA AR SITE OVERLAY */}
      {showAROverlay && (
        <CameraAROverlay
          modelConfig={modelConfig}
          siteConfig={siteConfig}
          onClose={() => setShowAROverlay(false)}
          onOpenQR={() => setShowARMobileModal(true)}
          onUpdateModelConfig={handleUpdateModel}
        />
      )}

      {/* MODAL 4B: AR MOBILE QR & DIRECT PHONE URL MODAL */}
      <ARMobileModal
        isOpen={showARMobileModal}
        onClose={() => setShowARMobileModal(false)}
        onLaunchLocalAR={() => setShowAROverlay(true)}
        appUrl="https://ais-pre-lrpphggcaos46uchfat5cl-785371161024.asia-southeast1.run.app"
      />

      {/* MODAL 5: PROFESSIONAL HOTKEYS & SHORTCUTS */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* MODAL 6: AI ARCHITECT BOT & GENERATIVE HOUSE DESIGN */}
      <AiArchitectBotModal
        isOpen={showAiArchitectModal}
        onClose={() => setShowAiArchitectModal(false)}
        currentConfig={modelConfig}
        siteConfig={siteConfig}
        currentUser={currentUser}
        onApplyConfig={(newConfig) => {
          setModelConfig(newConfig);
          soundFx.playSuccess();
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.6 },
          });
        }}
      />
    </div>
  );
}
