import React, { lazy, Suspense, useState, useEffect } from 'react';
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
import { ArchitectSidebar } from './components/ArchitectSidebar';
const ThreeContainerScene = lazy(() => import('./components/ThreeContainerScene').then((module) => ({ default: module.ThreeContainerScene })));
const AuthModal = lazy(() => import('./components/AuthModal').then((module) => ({ default: module.AuthModal })));
const AdminConsoleModal = lazy(() => import('./components/AdminConsoleModal').then((module) => ({ default: module.AdminConsoleModal })));
const SpecSheetModal = lazy(() => import('./components/SpecSheetModal').then((module) => ({ default: module.SpecSheetModal })));
const CameraAROverlay = lazy(() => import('./components/CameraAROverlay').then((module) => ({ default: module.CameraAROverlay })));
const ARMobileModal = lazy(() => import('./components/ARMobileModal').then((module) => ({ default: module.ARMobileModal })));
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal').then((module) => ({ default: module.KeyboardShortcutsModal })));
const AiArchitectBotModal = lazy(() => import('./components/AiArchitectBotModal').then((module) => ({ default: module.AiArchitectBotModal })));
import { CheckCircle2 } from 'lucide-react';
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
  const [isAiPromptSidebarOpen, setIsAiPromptSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1600px)').matches
  );
  const [isHousesSidebarOpen, setIsHousesSidebarOpen] = useState<boolean>(false);
  const [rightStudioActiveTab, setRightStudioActiveTab] = useState<'houses' | 'edit'>('edit');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundFx.getIsMuted());
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    const compactViewport = window.matchMedia('(max-width: 1599px)');
    const closeDrawersOnCompactViewport = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsAiPromptSidebarOpen(false);
        setIsHousesSidebarOpen(false);
      }
    };

    compactViewport.addEventListener('change', closeDrawersOnCompactViewport);
    return () => compactViewport.removeEventListener('change', closeDrawersOnCompactViewport);
  }, []);

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsSoundMuted(muted);
  };

  const handleDownloadPdf = async () => {
    soundFx.playSuccess();
    const { generateArchitecturalPdf } = await import('./utils/pdfGenerator');
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
    <div className="app-shell relative flex h-[100dvh] w-screen bg-[#05080e] text-slate-100 overflow-hidden font-sans">
      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-[#00f0ff] text-black font-semibold px-4 py-2.5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      <ArchitectSidebar
        model={modelConfig}
        site={siteConfig}
        viewMode={viewMode}
        estimatedCost={calculateConfigurationCost(modelConfig).totalUsd}
        onUpdateModel={handleUpdateModel}
        onUpdateSite={handleUpdateSite}
        onSelectPreset={handleSelectPreset}
        onViewMode={setViewMode}
        onSave={handleSaveConfig}
      />

      <main className="app-workspace relative flex-1 min-w-0 h-full bg-[#05080e] overflow-hidden">
        <Suspense fallback={<div className="app-canvas-loading" aria-label="Loading 3D workspace"><span /></div>}>
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
            onOpenCustomizerTab={() => undefined}
            externalShowMeasurements={showMeasurementsModal}
            onCloseMeasurements={() => setShowMeasurementsModal(false)}
          />
        </Suspense>

      </main>

      {/* MODAL 1: AUTHENTICATION & GOOGLE SIGN-IN */}
      {showAuthModal && <Suspense fallback={null}>
        <AuthModal
          currentUser={currentUser}
          onLogin={handleLogin}
          onClose={() => setShowAuthModal(false)}
        />
      </Suspense>}

      {/* MODAL 2: MASTER ADMIN CONSOLE */}
      {showAdminModal && currentUser && isOwnerAdmin && <Suspense fallback={null}>
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
      </Suspense>}

      {/* MODAL 3: CERTIFIED TECHNICAL BLUEPRINT & SPEC SHEET */}
      {showSpecModal && <Suspense fallback={null}>
        <SpecSheetModal
          modelConfig={modelConfig}
          siteConfig={siteConfig}
          currentUser={currentUser}
          onClose={() => setShowSpecModal(false)}
        />
      </Suspense>}

      {/* MODAL 4: CAMERA AR SITE OVERLAY */}
      {showAROverlay && <Suspense fallback={null}>
        <CameraAROverlay
          modelConfig={modelConfig}
          siteConfig={siteConfig}
          onClose={() => setShowAROverlay(false)}
          onOpenQR={() => setShowARMobileModal(true)}
          onUpdateModelConfig={handleUpdateModel}
        />
      </Suspense>}

      {/* MODAL 4B: AR MOBILE QR & DIRECT PHONE URL MODAL */}
      {showARMobileModal && <Suspense fallback={null}><ARMobileModal
        isOpen={showARMobileModal}
        onClose={() => setShowARMobileModal(false)}
        onLaunchLocalAR={() => setShowAROverlay(true)}
        appUrl="https://ais-pre-lrpphggcaos46uchfat5cl-785371161024.asia-southeast1.run.app"
      /></Suspense>}

      {/* MODAL 5: PROFESSIONAL HOTKEYS & SHORTCUTS */}
      {showShortcutsModal && <Suspense fallback={null}><KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      /></Suspense>}

      {/* MODAL 6: AI ARCHITECT BOT & GENERATIVE HOUSE DESIGN */}
      {showAiArchitectModal && <Suspense fallback={null}><AiArchitectBotModal
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
      /></Suspense>}
    </div>
  );
}
