import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  ContainerModelConfig, 
  SitePlanningConfig, 
  ViewMode 
} from '../types';
import { 
  Compass, 
  Eye, 
  Grid, 
  Sun, 
  User, 
  Car, 
  Camera, 
  RotateCw, 
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  Check,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tv,
  Film,
  Maximize2,
  Minimize2,
  X,
  Sliders,
  FileText,
  HelpCircle,
  Sofa,
  Box,
  Home,
  Ruler,
  Trees,
  DoorOpen,
  DoorClosed,
  Video,
  Volume2,
  ShieldCheck,
  Zap,
  Circle,
  Square
} from 'lucide-react';
import {
  createDynamicSkyDome,
  updateSkyDome,
  generateHDRIRadianceEnvironment,
  createMinecraftVoxelAvatar,
} from './3d/EnvironmentGraphics';
import {
  createContainerDoorDecalTexture,
  createIsoCornerCasting,
  createForkliftPockets,
  createIndustrialCargoDoors,
  createVentilationLouvers,
  createArchitecturalOpening,
} from './3d/ContainerDetails';
import {
  buildLivingRoomFurniture,
  buildKitchenDiningFurniture,
  buildBedroomSuiteFurniture,
  buildBathroomSpaFurniture,
  buildOutdoorDeckFurniture,
} from './3d/FurnitureModels';
import { buildLandscapingGreenery } from './3d/LandscapingGreenery';
import { buildCompleteContainerHouse } from './3d/ContainerModelBuilder';
import { buildArchitecturalModelFloor } from './3d/ArchitecturalSiteGround';
import { MeasurementsPanel } from './MeasurementsPanel';
import { HouseVisitVideoModal } from './HouseVisitVideoModal';
import { VRWalkthroughOverlay } from './VRWalkthroughOverlay';
import { soundFx } from '../utils/audio';

export interface AnimatableAperture {
  key: string;
  type: 'hinge-y' | 'hinge-x' | 'slide-x' | 'slide-z';
  object: THREE.Object3D;
  targetRotY?: number;
  targetRotX?: number;
  targetPosX?: number;
  targetPosZ?: number;
}

function isStructuralConfigChange(prev: ContainerModelConfig | null, curr: ContainerModelConfig): boolean {
  if (!prev) return true;
  if (
    prev.lengthFt !== curr.lengthFt ||
    prev.widthFt !== curr.widthFt ||
    prev.heightFt !== curr.heightFt ||
    prev.exteriorColor !== curr.exteriorColor ||
    prev.exteriorMaterial !== curr.exteriorMaterial ||
    prev.roofOption !== curr.roofOption ||
    prev.foundationType !== curr.foundationType ||
    prev.pierHeightInches !== curr.pierHeightInches ||
    prev.interiorStyle !== curr.interiorStyle ||
    prev.flooringMaterial !== curr.flooringMaterial ||
    prev.deckPorch !== curr.deckPorch ||
    prev.deckWidthFt !== curr.deckWidthFt ||
    prev.deckDepthFt !== curr.deckDepthFt ||
    prev.layoutType !== curr.layoutType ||
    prev.activeStoryView !== curr.activeStoryView ||
    prev.cutawayRoof !== curr.cutawayRoof ||
    prev.solarPanelsCount !== curr.solarPanelsCount ||
    prev.kitchenColor !== curr.kitchenColor ||
    prev.kitchenCountertop !== curr.kitchenCountertop ||
    prev.kitchenType !== curr.kitchenType ||
    prev.bedroomPalette !== curr.bedroomPalette ||
    prev.bedroomType !== curr.bedroomType ||
    prev.sittingPalette !== curr.sittingPalette ||
    prev.loungeType !== curr.loungeType ||
    prev.washroomToiletType !== curr.washroomToiletType ||
    prev.washroomWetType !== curr.washroomWetType ||
    prev.washroomTileStyle !== curr.washroomTileStyle ||
    prev.bathroomType !== curr.bathroomType ||
    prev.glassTint !== curr.glassTint ||
    prev.attachedBath !== curr.attachedBath ||
    prev.bathroomDoorType !== curr.bathroomDoorType
  ) {
    return true;
  }
  const prevOps = prev.openings || [];
  const currOps = curr.openings || [];
  if (prevOps.length !== currOps.length) return true;
  for (let i = 0; i < currOps.length; i++) {
    const p = prevOps[i];
    const c = currOps[i];
    if (
      p.id !== c.id ||
      p.type !== c.type ||
      p.wall !== c.wall ||
      p.positionFt !== c.positionFt ||
      p.widthFt !== c.widthFt ||
      p.heightFt !== c.heightFt ||
      p.elevationFt !== c.elevationFt
    ) {
      return true;
    }
  }
  return false;
}

function updateBadgeVisuals(group: THREE.Group, openingId: string, isOpen: boolean, title: string) {
  const badgeObj = group.getObjectByName(`badge-${openingId}`);
  if (badgeObj && badgeObj.children.length > 0) {
    const mesh = badgeObj.children[0] as THREE.Mesh;
    if (mesh && mesh.material && (mesh.material as THREE.MeshBasicMaterial).map) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 512, 128);
        ctx.fillStyle = isOpen ? 'rgba(5, 46, 36, 0.94)' : 'rgba(10, 15, 26, 0.94)';
        ctx.strokeStyle = isOpen ? '#10b981' : '#00f0ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(8, 8, 496, 112, 22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isOpen ? '#34d399' : '#00f0ff';
        ctx.shadowColor = isOpen ? '#10b981' : '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(48, 64, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px monospace';
        ctx.textBaseline = 'middle';
        const label = isOpen ? 'OPEN • TAP TO CLOSE' : 'TAP / CLICK TO OPEN';
        ctx.fillText(label, 82, 64);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      (mesh.material as THREE.MeshBasicMaterial).map = tex;
      (mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
      mesh.userData.isOpen = isOpen;
      mesh.userData.title = `${title} (${isOpen ? 'OPEN - Click to Close' : 'CLOSED - Click to Open'})`;
    }
  }
}

interface ThreeContainerSceneProps {
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUpdateSiteConfig: (partial: Partial<SitePlanningConfig>) => void;
  onUpdateModelConfig?: (partial: Partial<ContainerModelConfig>) => void;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
  onOpenSpecSheet?: () => void;
  onOpenARCamera?: () => void;
  onOpenCustomizerTab?: (tab: 'presets' | 'size' | 'exterior' | 'interior' | 'site' | 'cost') => void;
  externalShowMeasurements?: boolean;
  onCloseMeasurements?: () => void;
}

interface TourShot {
  id: string;
  title: string;
  subtitle: string;
  durationSec: number;
  getStartPos: (c: ContainerModelConfig, s: SitePlanningConfig) => THREE.Vector3;
  getEndPos: (c: ContainerModelConfig, s: SitePlanningConfig) => THREE.Vector3;
  getStartTarget: (c: ContainerModelConfig, s: SitePlanningConfig) => THREE.Vector3;
  getEndTarget: (c: ContainerModelConfig, s: SitePlanningConfig) => THREE.Vector3;
}

const TOUR_SHOTS: TourShot[] = [
  {
    id: 'shot-1',
    title: 'Manicured Approach & Architectural Facade',
    subtitle: 'Approaching entrance porch along the natural stone walkway',
    durationSec: 6.0,
    getStartPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.75, 5.8, s.containerOffsetZFt + c.widthFt * 2.2),
    getEndPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.42, 5.5, s.containerOffsetZFt + c.widthFt * 1.05),
    getStartTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.35, 4.8, s.containerOffsetZFt + c.widthFt * 0.45),
    getEndTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.35, 4.8, s.containerOffsetZFt + c.widthFt * 0.45),
  },
  {
    id: 'shot-2',
    title: 'Front Door Operable Swing & Entry Foyer',
    subtitle: 'Front door swings open smoothly revealing the interior layout',
    durationSec: 6.5,
    getStartPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.40, 5.5, s.containerOffsetZFt + c.widthFt * 0.95),
    getEndPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.22, 5.4, s.containerOffsetZFt + 0.5),
    getStartTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.35, 4.8, s.containerOffsetZFt + c.widthFt * 0.45),
    getEndTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt, 4.8, s.containerOffsetZFt),
  },
  {
    id: 'shot-3',
    title: 'Open-Concept Living Lounge & Media Center',
    subtitle: 'Designer sofa, custom coffee table & acoustic wood millwork',
    durationSec: 6.5,
    getStartPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.22, 5.4, s.containerOffsetZFt + 0.5),
    getEndPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.05, 5.4, s.containerOffsetZFt - 0.3),
    getStartTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.15, 4.2, s.containerOffsetZFt),
    getEndTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt - c.lengthFt * 0.1, 4.5, s.containerOffsetZFt),
  },
  {
    id: 'shot-4',
    title: "Chef's Kitchen Island & Dining Suite",
    subtitle: 'Waterfall quartz island, bar seating & ambient pendant illumination',
    durationSec: 6.5,
    getStartPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.05, 5.4, s.containerOffsetZFt + 0.8),
    getEndPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt - c.lengthFt * 0.15, 5.4, s.containerOffsetZFt + 0.2),
    getStartTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt - c.lengthFt * 0.08, 4.2, s.containerOffsetZFt - 0.6),
    getEndTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt - c.lengthFt * 0.25, 4.5, s.containerOffsetZFt),
  },
  {
    id: 'shot-5',
    title: 'Master Bedroom Suite & Spa Ensuite',
    subtitle: 'Panoramic window glazing, upholstered bed & built-in storage',
    durationSec: 6.0,
    getStartPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt - c.lengthFt * 0.15, 5.4, s.containerOffsetZFt),
    getEndPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt - c.lengthFt * 0.35, 5.4, s.containerOffsetZFt),
    getStartTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt - c.lengthFt * 0.42, 4.2, s.containerOffsetZFt - 0.5),
    getEndTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt - c.lengthFt * 0.35, 4.5, s.containerOffsetZFt + 1.2),
  },
  {
    id: 'shot-6',
    title: 'Sliding Glass Doors & Sunset Outdoor Terrace',
    subtitle: 'Glazed patio doors slide open into the outdoor living landscape',
    durationSec: 7.0,
    getStartPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.12, 5.3, s.containerOffsetZFt + 0.2),
    getEndPos: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.25, 6.2, s.containerOffsetZFt + c.widthFt * 1.6),
    getStartTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt + c.lengthFt * 0.2, 4.5, s.containerOffsetZFt + c.widthFt * 0.7),
    getEndTarget: (c, s) =>
      new THREE.Vector3(s.containerOffsetXFt, 4.2, s.containerOffsetZFt),
  },
];

export const ThreeContainerScene: React.FC<ThreeContainerSceneProps> = ({
  modelConfig,
  siteConfig,
  viewMode,
  onViewModeChange,
  onUpdateSiteConfig,
  onUpdateModelConfig,
  isPresentationMode = false,
  onTogglePresentationMode,
  onOpenSpecSheet,
  onOpenARCamera,
  onOpenCustomizerTab,
  externalShowMeasurements,
  onCloseMeasurements,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const containerGroupRef = useRef<THREE.Group | null>(null);
  const siteGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // First-person walkthrough state (VR & Minecraft Steve)
  const fpControlsRef = useRef<{
    active: boolean;
    keys: { forward: boolean; backward: boolean; left: boolean; right: boolean; sprint: boolean };
    moveSpeed: number;
    yaw: number;
    pitch: number;
  }>({
    active: false,
    keys: { forward: false, backward: false, left: false, right: false, sprint: false },
    moveSpeed: 0.25, // ft per frame
    yaw: 0,
    pitch: 0,
  });

  const [cameraPositionInfo, setCameraPositionInfo] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [isInsideBuilding, setIsInsideBuilding] = useState<boolean>(false);

  // Graphics Fidelity & Photorealism State
  const [graphicsPreset, setGraphicsPreset] = useState<'ultra' | 'high' | 'balanced'>('ultra');
  const [graphicsMenuOpen, setGraphicsMenuOpen] = useState(false);
  const [enableHdriReflections, setEnableHdriReflections] = useState(true);
  const [enableSoftShadows, setEnableSoftShadows] = useState(true);
  const [enableSkyAtmosphere, setEnableSkyAtmosphere] = useState(true);

  // Minecraft AFK Mode State & Synchronization Refs
  const skyDomeRef = useRef<THREE.Mesh | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const [afkSeconds, setAfkSeconds] = useState(0);
  const [afkSpeedMode, setAfkSpeedMode] = useState<'chill' | 'normal' | 'swift' | 'paused'>('normal');
  const [afkTargetType, setAfkTargetType] = useState<'house' | 'steve'>('house');
  const [afkFpvMode, setAfkFpvMode] = useState(false);
  const [afkRadius, setAfkRadius] = useState(42);
  const [afkHeight, setAfkHeight] = useState(14);
  const [afkChimePlaying, setAfkChimePlaying] = useState(false);

  const afkAngleRef = useRef(0);
  const afkSpeedRef = useRef(0.28);
  const afkRadiusRef = useRef(42);
  const afkHeightRef = useRef(14);
  const afkTargetSteveRef = useRef(false);
  const isAfkFirstPersonRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const walkBobRef = useRef(0);
  const canStepSoundRef = useRef(true);
  const jumpVelocityRef = useRef(0);
  const isPointerLockedRef = useRef(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Cinematic Video Tour State
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [isPlayingTour, setIsPlayingTour] = useState(true);
  const [tourSpeed, setTourSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState(true);
  const [snapshotToast, setSnapshotToast] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [siteToolsOpen, setSiteToolsOpen] = useState(false);
  const [showMeasurementsPanel, setShowMeasurementsPanel] = useState(false);
  const [isModelOnlyFocus, setIsModelOnlyFocus] = useState(false);
  const [interactionToast, setInteractionToast] = useState<{ title: string; subtitle: string; isOpen: boolean } | null>(null);
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);
  const [doorsMenuOpen, setDoorsMenuOpen] = useState(false);

  // House Visit Video Capture (MediaRecorder) State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // VR Walkthrough State
  const [isStereoscopic, setIsStereoscopic] = useState(false);

  // POV Mode Dynamic Reticle Target State & Ref
  const [povReticleTarget, setPovReticleTarget] = useState<{
    name: string;
    isOpen: boolean;
    distanceFt: number;
  } | null>(null);
  const focusedApertureInPOVRef = useRef<THREE.Object3D | null>(null);
  const executeToggleApertureRef = useRef<(obj: THREE.Object3D) => void>(() => {});

  // Operable Apertures Animation Tracking
  const animatableAperturesRef = useRef<AnimatableAperture[]>([]);
  const prevModelConfigRef = useRef<ContainerModelConfig | null>(null);

  // Synchronization refs for 60fps render loop
  const tourProgressRef = useRef(0);
  const tourShotIndexRef = useRef(0);
  const isPlayingTourRef = useRef(true);
  const tourSpeedRef = useRef(1.0);
  const isLoopingRef = useRef(true);
  const viewModeRef = useRef(viewMode);
  const modelConfigRef = useRef(modelConfig);
  const siteConfigRef = useRef(siteConfig);
  const onUpdateModelConfigRef = useRef(onUpdateModelConfig);

  // Video Recording timer
  useEffect(() => {
    if (!isRecordingVideo) return;
    const timer = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecordingVideo]);

  const handleStartVideoRecording = useCallback(() => {
    if (!rendererRef.current) return;
    const canvas = rendererRef.current.domElement;
    try {
      const stream = canvas.captureStream(60);
      let selectedMime = '';
      const candidateMimes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      for (const m of candidateMimes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }
      const options = selectedMime ? { mimeType: selectedMime, videoBitsPerSecond: 8000000 } : undefined;
      const recorder = new MediaRecorder(stream, options);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setShowVideoModal(true);
        setIsRecordingVideo(false);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecordingVideo(true);
      setRecordingSeconds(0);
      soundFx.playChime();
    } catch (err) {
      console.error('Failed to initiate canvas video recording:', err);
    }
  }, []);

  const handleStopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      soundFx.playSuccess();
    }
  }, []);

  const handleVRTeleport = useCallback((roomKey: 'porch' | 'lounge' | 'kitchen' | 'bedroom' | 'bath' | 'deck') => {
    if (!cameraRef.current) return;
    const s = siteConfigRef.current;
    const m = modelConfigRef.current;
    const baseElevation = (m.pierHeightInches || 12) / 12;
    soundFx.playClick();

    switch (roomKey) {
      case 'porch':
        cameraRef.current.position.set(s.containerOffsetXFt + m.lengthFt * 0.42, baseElevation + 5.5, s.containerOffsetZFt + m.widthFt * 0.9);
        fpControlsRef.current.yaw = Math.PI * 0.8;
        break;
      case 'lounge':
        cameraRef.current.position.set(s.containerOffsetXFt + m.lengthFt * 0.15, baseElevation + 5.5, s.containerOffsetZFt + 0.5);
        fpControlsRef.current.yaw = 0;
        break;
      case 'kitchen':
        cameraRef.current.position.set(s.containerOffsetXFt - m.lengthFt * 0.05, baseElevation + 5.5, s.containerOffsetZFt - 0.5);
        fpControlsRef.current.yaw = Math.PI * 0.5;
        break;
      case 'bedroom':
        cameraRef.current.position.set(s.containerOffsetXFt - m.lengthFt * 0.32, baseElevation + 5.5, s.containerOffsetZFt);
        fpControlsRef.current.yaw = Math.PI;
        break;
      case 'bath':
        cameraRef.current.position.set(s.containerOffsetXFt - m.lengthFt * 0.18, baseElevation + 5.5, s.containerOffsetZFt - m.widthFt * 0.25);
        fpControlsRef.current.yaw = -Math.PI * 0.5;
        break;
      case 'deck':
        cameraRef.current.position.set(s.containerOffsetXFt + m.lengthFt * 0.25, baseElevation + 5.5, s.containerOffsetZFt + m.widthFt * 1.5);
        fpControlsRef.current.yaw = -Math.PI * 0.25;
        break;
    }
  }, []);

  const handleToggleAllDoors = useCallback(() => {
    const anyOpen = !!modelConfig.frontDoorOpen ||
      !!modelConfig.cargoDoorsOpen ||
      !!modelConfig.interiorDoorsOpen ||
      (modelConfig.openings || []).some((o) => o.isOpen) ||
      Object.values(modelConfig.doorStates || {}).some(Boolean);
    const next = !anyOpen;
    if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();
    if (onUpdateModelConfigRef.current) {
      onUpdateModelConfigRef.current({
        frontDoorOpen: next,
        cargoDoorsOpen: next,
        interiorDoorsOpen: next,
        doorStates: {
          'interior-bath-door': next,
          'interior-bed-door': next,
        },
        openings: (modelConfig.openings || []).map((o) => ({ ...o, isOpen: next })),
      });
    }
  }, [modelConfig]);

  const updateApertureTargetsFromConfig = useCallback((cfg: ContainerModelConfig) => {
    const apertures = animatableAperturesRef.current;
    const containerGroup = containerGroupRef.current;
    if (!apertures || apertures.length === 0) return;

    const frontDoorOpen = !!cfg.frontDoorOpen;
    const cargoDoorsOpen = !!cfg.cargoDoorsOpen;

    for (let i = 0; i < apertures.length; i++) {
      const ap = apertures[i];
      if (ap.key === 'front-main-entry-door') {
        ap.targetRotY = frontDoorOpen ? -Math.PI * 0.48 : 0;
        if (containerGroup) {
          updateBadgeVisuals(containerGroup, 'front-main-entry-door', frontDoorOpen, 'FRONT MAIN ENTRANCE');
        }
      } else if (ap.key === 'cargo-doors-left') {
        ap.targetRotY = cargoDoorsOpen ? -Math.PI * 0.58 : 0;
        if (containerGroup) {
          updateBadgeVisuals(containerGroup, 'cargo-doors', cargoDoorsOpen, 'DUAL CARGO DOORS');
        }
      } else if (ap.key === 'cargo-doors-right') {
        ap.targetRotY = cargoDoorsOpen ? Math.PI * 0.58 : 0;
      } else if (ap.key === 'interior-bath-door') {
        const isOpen = cfg.bathroomDoorOpen !== undefined
          ? !!cfg.bathroomDoorOpen
          : (cfg.doorStates?.['interior-bath-door'] !== undefined
            ? !!cfg.doorStates['interior-bath-door']
            : !!cfg.interiorDoorsOpen);
        if (ap.type === 'slide-x') {
          const closedX = (ap.object.userData.closedPosX as number) ?? 0;
          const openX = (ap.object.userData.openPosX as number) ?? (closedX - 2.1);
          ap.targetPosX = isOpen ? openX : closedX;
        } else if (ap.type === 'slide-z') {
          const closedZ = (ap.object.userData.closedPosZ as number) ?? ap.object.position.z;
          const openZ = (ap.object.userData.openPosZ as number) ?? (closedZ + 1.9);
          ap.targetPosZ = isOpen ? openZ : closedZ;
        } else if (ap.type === 'hinge-y') {
          const closedRotY = (ap.object.userData.closedRotY as number) ?? 0;
          const openRotY = (ap.object.userData.openRotY as number) ?? -Math.PI * 0.48;
          ap.targetRotY = isOpen ? openRotY : closedRotY;
        }
      } else if (ap.key === 'interior-bed-door') {
        const isOpen = cfg.bedroomDoorOpen !== undefined
          ? !!cfg.bedroomDoorOpen
          : (cfg.doorStates?.['interior-bed-door'] !== undefined
            ? !!cfg.doorStates['interior-bed-door']
            : !!cfg.interiorDoorsOpen);
        if (ap.type === 'hinge-y') {
          const closedRotY = (ap.object.userData.closedRotY as number) ?? 0;
          const openRotY = (ap.object.userData.openRotY as number) ?? -Math.PI * 0.48;
          ap.targetRotY = isOpen ? openRotY : closedRotY;
        } else if (ap.type === 'slide-x') {
          const closedX = (ap.object.userData.closedPosX as number) ?? 0;
          const openX = (ap.object.userData.openPosX as number) ?? (closedX - 2.1);
          ap.targetPosX = isOpen ? openX : closedX;
        }
      } else if (ap.key.startsWith('opening-')) {
        const opId = ap.key.replace('opening-', '');
        const op = (cfg.openings || []).find((o) => o.id === opId);
        if (op) {
          const isDoor = op.type.includes('door') || op.type.includes('bifold');
          const isEffectiveOpen = !!op.isOpen || (isDoor && op.wall === 'front' && frontDoorOpen);
          if (ap.type === 'slide-x') {
            const closedX = (ap.object.userData.closedPosX as number) ?? ap.object.position.x;
            const openX = (ap.object.userData.openPosX as number) ?? (closedX - 2.5);
            ap.targetPosX = isEffectiveOpen ? openX : closedX;
          } else if (ap.type === 'hinge-y') {
            const closedRotY = (ap.object.userData.closedRotY as number) ?? 0;
            const openRotY = (ap.object.userData.openRotY as number) ?? -Math.PI * 0.45;
            ap.targetRotY = isEffectiveOpen ? openRotY : closedRotY;
          } else if (ap.type === 'hinge-x') {
            const closedRotX = (ap.object.userData.closedRotX as number) ?? 0;
            const openRotX = (ap.object.userData.openRotX as number) ?? -Math.PI * 0.22;
            ap.targetRotX = isEffectiveOpen ? openRotX : closedRotX;
          }
          if (containerGroup) {
            updateBadgeVisuals(containerGroup, op.id, isEffectiveOpen, op.type.replace(/-/g, ' ').toUpperCase());
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    onUpdateModelConfigRef.current = onUpdateModelConfig;
  }, [onUpdateModelConfig]);

  useEffect(() => {
    if (interactionToast) {
      const timer = setTimeout(() => setInteractionToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [interactionToast]);

  useEffect(() => {
    viewModeRef.current = viewMode;
    if (viewMode === 'cinematic-tour') {
      isPlayingTourRef.current = true;
      setIsPlayingTour(true);
    } else if (viewMode === 'minecraft-afk') {
      soundFx.playMinecraftAfkChime();
      soundFx.playModeSwitch();
      setAfkFpvMode(false);
      isAfkFirstPersonRef.current = false;
      afkAngleRef.current = 0.45;
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      if (cameraRef.current) {
        cameraRef.current.position.set(
          siteConfig.containerOffsetXFt + 42,
          14,
          siteConfig.containerOffsetZFt + 42
        );
        cameraRef.current.lookAt(
          siteConfig.containerOffsetXFt,
          4.5,
          siteConfig.containerOffsetZFt
        );
      }
    }
  }, [viewMode, siteConfig.containerOffsetXFt, siteConfig.containerOffsetZFt]);

  // Minecraft AFK seconds timer
  useEffect(() => {
    if (viewMode !== 'minecraft-afk') {
      setAfkSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setAfkSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [viewMode]);

  useEffect(() => {
    if (afkSpeedMode === 'chill') afkSpeedRef.current = 0.14;
    else if (afkSpeedMode === 'normal') afkSpeedRef.current = 0.28;
    else if (afkSpeedMode === 'swift') afkSpeedRef.current = 0.65;
    else if (afkSpeedMode === 'paused') afkSpeedRef.current = 0.0;
  }, [afkSpeedMode]);

  useEffect(() => { afkRadiusRef.current = afkRadius; }, [afkRadius]);
  useEffect(() => { afkHeightRef.current = afkHeight; }, [afkHeight]);
  useEffect(() => { afkTargetSteveRef.current = afkTargetType === 'steve'; }, [afkTargetType]);
  useEffect(() => { isAfkFirstPersonRef.current = afkFpvMode; }, [afkFpvMode]);

  useEffect(() => { modelConfigRef.current = modelConfig; }, [modelConfig]);
  useEffect(() => { siteConfigRef.current = siteConfig; }, [siteConfig]);
  useEffect(() => { tourShotIndexRef.current = currentShotIndex; }, [currentShotIndex]);
  useEffect(() => { isPlayingTourRef.current = isPlayingTour; }, [isPlayingTour]);
  useEffect(() => { tourSpeedRef.current = tourSpeed; }, [tourSpeed]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);

  // High-Resolution 4K Snapshot Tool
  const handleCaptureSnapshot = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    const cleanName = modelConfig.name.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `GridLogic_${cleanName}_4K_Render.png`;
    link.href = dataUrl;
    link.click();
    setSnapshotToast(true);
    setTimeout(() => setSnapshotToast(false), 3200);
  }, [modelConfig.name]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e);
    scene.fog = new THREE.FogExp2(0x06090e, 0.007);
    sceneRef.current = scene;

    // Camera: 1 unit = 1 foot
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    // Initial architectural view looking at container
    camera.position.set(38, 24, 45);
    camera.lookAt(0, 5, 0);
    cameraRef.current = camera;

    // Renderer with preserveDrawingBuffer for crystal-clear snapshots
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls with touch support
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath ground
    controls.minDistance = 4; // 4 ft
    controls.maxDistance = 250; // 250 ft for site planning
    controls.target.set(0, 4.5, 0);
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // Photorealistic PBR HDRI Specular Radiance Environment
    try {
      const hdriEnv = generateHDRIRadianceEnvironment(renderer);
      scene.environment = hdriEnv;
    } catch {
      // Fallback gracefully if PMREM is unavailable
    }

    // Dynamic Procedural Sky Atmosphere Dome (Day, Golden Hour, Twilight, Night)
    const skyDome = createDynamicSkyDome();
    scene.add(skyDome);
    skyDomeRef.current = skyDome;

    // Dual Hemisphere Sky Bounce Light for Realistic Outdoor Ambience
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.04; // Eliminates shadow acne on corrugations
    sunLight.shadow.radius = 2.0; // Soft penumbra shadow edges
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Natural soft sky atmospheric fill light (provides balanced architectural illumination)
    const skyFill = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    skyFill.position.set(-30, 25, -30);
    scene.add(skyFill);

    // Create Groups
    const siteGroup = new THREE.Group();
    scene.add(siteGroup);
    siteGroupRef.current = siteGroup;

    const containerGroup = new THREE.Group();
    scene.add(containerGroup);
    containerGroupRef.current = containerGroup;

    const findInteractiveDoorOrWindow = (obj: THREE.Object3D | null): THREE.Object3D | null => {
      let curr: THREE.Object3D | null = obj;
      while (curr && curr !== scene) {
        if (curr.userData && curr.userData.isDoorOrWindow) {
          return curr;
        }
        curr = curr.parent;
      }
      return null;
    };

    // Interactive aperture toggler function (shared by mouse clicks, touches, and POV crosshair left-clicks)
    const toggleApertureObject = (interactive: THREE.Object3D) => {
      const u = interactive.userData;
      const onUpdate = onUpdateModelConfigRef.current;
      if (!onUpdate) return;
      const currentConfig = modelConfigRef.current;

      // Haptic vibration feedback on touch devices (mobile)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(45); } catch (_) {}
      }

      // Front Entrance Door
      if (u.isFrontDoor || u.openingId === 'front-main-entry-door') {
        const next = !currentConfig.frontDoorOpen;
        if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();

        // Instant target update for zero-latency 60fps lerp
        for (const ap of animatableAperturesRef.current) {
          if (ap.key === 'front-main-entry-door') {
            ap.targetRotY = next ? -Math.PI * 0.48 : 0;
          }
        }
        updateBadgeVisuals(containerGroup, 'front-main-entry-door', next, 'FRONT MAIN ENTRANCE');

        onUpdate({ frontDoorOpen: next });
        setInteractionToast({
          title: next ? 'Front Entrance Door Opened' : 'Front Entrance Door Closed',
          subtitle: next ? 'Swinging open outward 86° with smooth 60fps hinge rotation' : 'Secured shut and latched',
          isOpen: next,
        });
        return;
      }

      // Cargo Doors
      if (u.openingId === 'cargo-doors') {
        const next = !currentConfig.cargoDoorsOpen;
        if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();

        // Instant target update for zero-latency 60fps lerp
        for (const ap of animatableAperturesRef.current) {
          if (ap.key === 'cargo-doors-left') {
            ap.targetRotY = next ? -Math.PI * 0.58 : 0;
          } else if (ap.key === 'cargo-doors-right') {
            ap.targetRotY = next ? Math.PI * 0.58 : 0;
          }
        }
        updateBadgeVisuals(containerGroup, 'cargo-doors', next, 'DUAL CARGO DOORS');

        onUpdate({ cargoDoorsOpen: next });
        setInteractionToast({
          title: next ? 'Industrial Cargo Doors Opened' : 'Industrial Cargo Doors Closed',
          subtitle: next ? 'Double-leaf 105° swing open revealing container interior' : 'Heavy container doors sealed and locked shut',
          isOpen: next,
        });
        return;
      }

      // Interior Bathroom Door (Pocket Sliding or Hinged)
      if (u.openingId === 'interior-bath-door' || u.apertureKey === 'interior-bath-door') {
        const ap = animatableAperturesRef.current.find((a) => a.key === 'interior-bath-door');
        const isCurrentlyOpen = ap ? (ap.object.userData.isOpen ?? false) : (currentConfig.doorStates?.['interior-bath-door'] ?? false);
        const next = !isCurrentlyOpen;
        if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();

        if (ap) {
          ap.object.userData.isOpen = next;
          if (ap.type === 'slide-x') {
            const closedX = (ap.object.userData.closedPosX as number) ?? 0;
            const openX = (ap.object.userData.openPosX as number) ?? (closedX - 2.1);
            ap.targetPosX = next ? openX : closedX;
          } else if (ap.type === 'slide-z') {
            const closedZ = (ap.object.userData.closedPosZ as number) ?? ap.object.position.z;
            const openZ = (ap.object.userData.openPosZ as number) ?? (closedZ + 1.9);
            ap.targetPosZ = next ? openZ : closedZ;
          } else if (ap.type === 'hinge-y') {
            const closedRotY = (ap.object.userData.closedRotY as number) ?? 0;
            const openRotY = (ap.object.userData.openRotY as number) ?? -Math.PI * 0.48;
            ap.targetRotY = next ? openRotY : closedRotY;
          }
        }

        const nextDoorStates = { ...(currentConfig.doorStates || {}), 'interior-bath-door': next };
        onUpdate({ doorStates: nextDoorStates, bathroomDoorOpen: next });
        setInteractionToast({
          title: next ? 'Bathroom Door Opened' : 'Bathroom Door Closed',
          subtitle: next ? 'Private washroom door retracted/swung open' : 'Private washroom door closed shut',
          isOpen: next,
        });
        return;
      }

      // Interior Master Bedroom Privacy Door (Hinged Swivel)
      if (u.openingId === 'interior-bed-door' || u.apertureKey === 'interior-bed-door') {
        const ap = animatableAperturesRef.current.find((a) => a.key === 'interior-bed-door');
        const isCurrentlyOpen = ap ? (ap.object.userData.isOpen ?? false) : (currentConfig.bedroomDoorOpen ?? currentConfig.doorStates?.['interior-bed-door'] ?? false);
        const next = !isCurrentlyOpen;
        if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();

        if (ap) {
          ap.object.userData.isOpen = next;
          if (ap.type === 'hinge-y') {
            const closedRotY = (ap.object.userData.closedRotY as number) ?? 0;
            const openRotY = (ap.object.userData.openRotY as number) ?? -Math.PI * 0.48;
            ap.targetRotY = next ? openRotY : closedRotY;
          } else if (ap.type === 'slide-x') {
            const closedX = (ap.object.userData.closedPosX as number) ?? 0;
            const openX = (ap.object.userData.openPosX as number) ?? (closedX - 2.1);
            ap.targetPosX = next ? openX : closedX;
          }
        }

        const nextDoorStates = { ...(currentConfig.doorStates || {}), 'interior-bed-door': next };
        onUpdate({ doorStates: nextDoorStates, bedroomDoorOpen: next });
        setInteractionToast({
          title: next ? 'Master Bedroom Door Opened' : 'Master Bedroom Door Closed',
          subtitle: next ? 'Bedroom privacy suite door swung open' : 'Bedroom suite closed for quiet privacy',
          isOpen: next,
        });
        return;
      }

      // Window or Glazed Slider
      if (u.openingId) {
        const target = (currentConfig.openings || []).find((o) => o.id === u.openingId);
        if (target) {
          const next = !target.isOpen;
          if (next) soundFx.playDoorOpen(); else soundFx.playDoorClose();

          // Instant target update for zero-latency 60fps lerp
          for (const ap of animatableAperturesRef.current) {
            if (ap.key === `opening-${target.id}`) {
              if (ap.type === 'slide-x') {
                const closedX = (ap.object.userData.closedPosX as number) ?? ap.object.position.x;
                const openX = (ap.object.userData.openPosX as number) ?? (closedX - 2.5);
                ap.targetPosX = next ? openX : closedX;
              } else if (ap.type === 'hinge-y') {
                const closedRotY = (ap.object.userData.closedRotY as number) ?? 0;
                const openRotY = (ap.object.userData.openRotY as number) ?? -Math.PI * 0.45;
                ap.targetRotY = next ? openRotY : closedRotY;
              } else if (ap.type === 'hinge-x') {
                const closedRotX = (ap.object.userData.closedRotX as number) ?? 0;
                const openRotX = (ap.object.userData.openRotX as number) ?? -Math.PI * 0.22;
                ap.targetRotX = next ? openRotX : closedRotX;
              }
            }
          }
          const label = target.type.replace(/-/g, ' ').toUpperCase();
          updateBadgeVisuals(containerGroup, target.id, next, label);

          const updatedOpenings = (currentConfig.openings || []).map((o) =>
            o.id === u.openingId ? { ...o, isOpen: next } : o
          );
          const isFrontDoorAperture = target.wall === 'front' && (target.type.includes('door') || target.type.includes('bifold'));
          onUpdate({
            openings: updatedOpenings,
            ...(isFrontDoorAperture ? { frontDoorOpen: next } : {}),
          });
          setInteractionToast({
            title: `${label} ${next ? 'Opened' : 'Closed'}`,
            subtitle: `${target.widthFt}ft × ${target.heightFt}ft architectural sash ${next ? 'gliding open' : 'latched shut'}`,
            isOpen: next,
          });
          return;
        }
      }
    };

    executeToggleApertureRef.current = toggleApertureObject;

    // Handle Resize with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Render loop
    let lastTime = performance.now();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const currentMode = viewModeRef.current;
      const mCfg = modelConfigRef.current;
      const sCfg = siteConfigRef.current;

      if (currentMode === 'cinematic-tour') {
        // Disable orbit controls during automated video tour
        controls.enabled = false;

        if (isPlayingTourRef.current && cameraRef.current) {
          const speed = tourSpeedRef.current;
          const shot = TOUR_SHOTS[tourShotIndexRef.current] || TOUR_SHOTS[0];
          const duration = shot.durationSec || 6.5;

          tourProgressRef.current += (deltaSeconds / duration) * speed;

          if (tourProgressRef.current >= 1.0) {
            tourProgressRef.current = 0;
            const nextIdx = tourShotIndexRef.current + 1;
            if (nextIdx >= TOUR_SHOTS.length) {
              if (isLoopingRef.current) {
                tourShotIndexRef.current = 0;
                setCurrentShotIndex(0);
              } else {
                isPlayingTourRef.current = false;
                setIsPlayingTour(false);
              }
            } else {
              tourShotIndexRef.current = nextIdx;
              setCurrentShotIndex(nextIdx);
            }
          }

          // Smooth Catmull-Rom style cubic easing
          const p = tourProgressRef.current;
          const t = p * p * (3 - 2 * p); // Smoothstep

          // Automated operable door triggers during house visit video tour
          if (tourShotIndexRef.current === 1 && p > 0.2) {
            if (!mCfg.frontDoorOpen && onUpdateModelConfigRef.current) {
              onUpdateModelConfigRef.current({ frontDoorOpen: true });
            }
          }
          if (tourShotIndexRef.current === 5 && p > 0.15) {
            if (!mCfg.cargoDoorsOpen && onUpdateModelConfigRef.current) {
              const updatedOpenings = (mCfg.openings || []).map((o) => ({ ...o, isOpen: true }));
              onUpdateModelConfigRef.current({ cargoDoorsOpen: true, openings: updatedOpenings });
            }
          }

          const startPos = shot.getStartPos(mCfg, sCfg);
          const endPos = shot.getEndPos(mCfg, sCfg);
          const startTgt = shot.getStartTarget(mCfg, sCfg);
          const endTgt = shot.getEndTarget(mCfg, sCfg);

          cameraRef.current.position.lerpVectors(startPos, endPos, t);
          const curTarget = new THREE.Vector3().lerpVectors(startTgt, endTgt, t);
          cameraRef.current.lookAt(curTarget);
        }
      } else if (currentMode === 'minecraft-afk') {
        controls.enabled = false;
        if (isAfkFirstPersonRef.current) {
          // First-Person Steve Walking Mode
          const fp = fpControlsRef.current;
          if (fp.active && cameraRef.current) {
            const moveX = (fp.keys.right ? 1 : 0) - (fp.keys.left ? 1 : 0);
            const moveZ = (fp.keys.backward ? 1 : 0) - (fp.keys.forward ? 1 : 0);
            const isMoving = moveX !== 0 || moveZ !== 0;
            const speed = fp.keys.sprint ? 0.38 : 0.22;

            if (isMoving) {
              const angle = fp.yaw;
              const forwardX = -Math.sin(angle);
              const forwardZ = -Math.cos(angle);
              const sideX = Math.cos(angle);
              const sideZ = -Math.sin(angle);

              cameraRef.current.position.x += (forwardX * -moveZ + sideX * moveX) * speed;
              cameraRef.current.position.z += (forwardZ * -moveZ + sideZ * moveX) * speed;

              // Minecraft Head Bobbing
              walkBobRef.current += deltaSeconds * (fp.keys.sprint ? 14 : 9);
              cameraRef.current.position.y = 5.5 + Math.sin(walkBobRef.current) * 0.16;

              // Gentle footstep audio
              if (Math.sin(walkBobRef.current) < -0.92 && canStepSoundRef.current) {
                canStepSoundRef.current = false;
                soundFx.playFootstep(true);
                setTimeout(() => { canStepSoundRef.current = true; }, 320);
              }
            } else {
              cameraRef.current.position.y = THREE.MathUtils.damp(cameraRef.current.position.y, 5.5, 8, deltaSeconds);
            }

            // Minecraft FOV dynamic sprint boost
            const targetFov = fp.keys.sprint && isMoving ? 58 : 45;
            if (Math.abs(cameraRef.current.fov - targetFov) > 0.1) {
              cameraRef.current.fov = THREE.MathUtils.damp(cameraRef.current.fov, targetFov, 6, deltaSeconds);
              cameraRef.current.updateProjectionMatrix();
            }
          }
        } else {
          // 360° Minecraft AFK Panoramic Orbit
          if (cameraRef.current) {
            if (!isUserInteractingRef.current) {
              afkAngleRef.current += deltaSeconds * afkSpeedRef.current;
            }
            const angle = afkAngleRef.current;
            const target = (afkTargetSteveRef.current && avatarGroupRef.current)
              ? avatarGroupRef.current.position
              : new THREE.Vector3(sCfg.containerOffsetXFt, 3.5, sCfg.containerOffsetZFt);

            const r = afkRadiusRef.current;
            const baseH = afkHeightRef.current;
            const sway = Math.sin(angle * 1.5) * 1.6;

            cameraRef.current.position.x = target.x + Math.cos(angle) * r;
            cameraRef.current.position.z = target.z + Math.sin(angle) * r;
            cameraRef.current.position.y = baseH + sway;
            cameraRef.current.lookAt(target.x, target.y + 2.5, target.z);
          }
        }
      } else if (currentMode === 'walkthrough-vr') {
        controls.enabled = false;
        // Handle Minecraft-style First-Person keyboard/mouse locomotion
        const fp = fpControlsRef.current;
        if (fp.active && cameraRef.current) {
          const moveX = (fp.keys.right ? 1 : 0) - (fp.keys.left ? 1 : 0);
          const moveZ = (fp.keys.backward ? 1 : 0) - (fp.keys.forward ? 1 : 0);

          if (moveX !== 0 || moveZ !== 0) {
            const angle = fp.yaw;
            const forwardX = -Math.sin(angle);
            const forwardZ = -Math.cos(angle);
            const sideX = Math.cos(angle);
            const sideZ = -Math.sin(angle);

            const speed = fp.keys.sprint ? fp.moveSpeed * 1.6 : fp.moveSpeed;
            cameraRef.current.position.x += (forwardX * -moveZ + sideX * moveX) * speed;
            cameraRef.current.position.z += (forwardZ * -moveZ + sideZ * moveX) * speed;
            walkBobRef.current += deltaSeconds * 9.5;
          }

          // Container floor & ground elevation detection
          const pierHeightFt = mCfg.pierHeightInches / 12;
          const halfL = mCfg.lengthFt / 2;
          const halfW = mCfg.widthFt / 2;
          const camPos = cameraRef.current.position;
          const deckDepth = mCfg.deckPorch ? (mCfg.deckDepthFt || 8) : 0;
          const onPlatform =
            (Math.abs(camPos.x - sCfg.containerOffsetXFt) < halfL && Math.abs(camPos.z - sCfg.containerOffsetZFt) < halfW) ||
            (mCfg.deckPorch && Math.abs(camPos.x - sCfg.containerOffsetXFt) < halfL && (camPos.z - sCfg.containerOffsetZFt) >= halfW && (camPos.z - sCfg.containerOffsetZFt) <= halfW + deckDepth);

          const baseEyeY = onPlatform ? (pierHeightFt + 0.50 + 5.5) : 5.5;

          // Minecraft Jumping & Gravity Physics
          if (jumpVelocityRef.current !== 0 || cameraRef.current.position.y > baseEyeY) {
            cameraRef.current.position.y += jumpVelocityRef.current * deltaSeconds;
            jumpVelocityRef.current -= 30 * deltaSeconds; // gravity
            if (cameraRef.current.position.y <= baseEyeY) {
              cameraRef.current.position.y = baseEyeY;
              jumpVelocityRef.current = 0;
            }
          } else {
            const bob = (moveX !== 0 || moveZ !== 0) ? Math.sin(walkBobRef.current) * 0.08 : 0;
            cameraRef.current.position.y = baseEyeY + bob;
          }
        }
      } else {
        controls.enabled = true;
        controls.update();
      }

      if (cameraRef.current) {
        const camPos = cameraRef.current.position;
        setCameraPositionInfo({
          x: Math.round(camPos.x),
          y: Math.round(camPos.y),
          z: Math.round(camPos.z),
        });

        // Check if inside container bounding box
        const halfL = mCfg.lengthFt / 2;
        const halfW = mCfg.widthFt / 2;
        const inside =
          Math.abs(camPos.x - sCfg.containerOffsetXFt) < halfL &&
          Math.abs(camPos.z - sCfg.containerOffsetZFt) < halfW &&
          camPos.y >= 0 &&
          camPos.y <= mCfg.heightFt;
        setIsInsideBuilding(inside);
      }

      // Smooth 60fps linear damping for operable doors and windows (hydraulic architectural glide)
      const apertures = animatableAperturesRef.current;
      if (apertures && apertures.length > 0) {
        for (let i = 0; i < apertures.length; i++) {
          const ap = apertures[i];
          if (ap.type === 'hinge-y' && ap.targetRotY !== undefined) {
            ap.object.rotation.y = THREE.MathUtils.damp(
              ap.object.rotation.y,
              ap.targetRotY,
              4.8,
              deltaSeconds
            );
          } else if (ap.type === 'hinge-x' && ap.targetRotX !== undefined) {
            ap.object.rotation.x = THREE.MathUtils.damp(
              ap.object.rotation.x,
              ap.targetRotX,
              4.8,
              deltaSeconds
            );
          } else if (ap.type === 'slide-x' && ap.targetPosX !== undefined) {
            ap.object.position.x = THREE.MathUtils.damp(
              ap.object.position.x,
              ap.targetPosX,
              4.8,
              deltaSeconds
            );
          } else if (ap.type === 'slide-z' && ap.targetPosZ !== undefined) {
            ap.object.position.z = THREE.MathUtils.damp(
              ap.object.position.z,
              ap.targetPosZ,
              4.8,
              deltaSeconds
            );
          }
        }
      }

      // POV Center Reticle Raycast check (when in walkthrough-vr)
      if (viewModeRef.current === 'walkthrough-vr' && cameraRef.current) {
        const povRaycaster = new THREE.Raycaster();
        povRaycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
        const centerHits = povRaycaster.intersectObjects(containerGroup.children, true);
        let povHitInteractive: THREE.Object3D | null = null;
        let hitDistance = Infinity;

        for (const hit of centerHits) {
          const interactive = findInteractiveDoorOrWindow(hit.object);
          if (interactive && hit.distance <= 14) {
            povHitInteractive = interactive;
            hitDistance = hit.distance;
            break;
          }
        }

        if (povHitInteractive) {
          focusedApertureInPOVRef.current = povHitInteractive;
          const u = povHitInteractive.userData;
          const currentCfg = modelConfigRef.current;
          let isCurrentlyOpen = false;
          if (u.isFrontDoor || u.openingId === 'front-main-entry-door') {
            isCurrentlyOpen = !!currentCfg.frontDoorOpen;
          } else if (u.openingId === 'cargo-doors') {
            isCurrentlyOpen = !!currentCfg.cargoDoorsOpen;
          } else if (u.openingId === 'interior-bath-door' || u.openingId === 'interior-bed-door') {
            isCurrentlyOpen = !!currentCfg.interiorDoorsOpen;
          } else if (u.openingId) {
            const match = (currentCfg.openings || []).find((o) => o.id === u.openingId);
            isCurrentlyOpen = !!(match && match.isOpen);
          }
          const namePart = (u.title || 'Door / Window').split('(')[0].trim();
          setPovReticleTarget({
            name: namePart,
            isOpen: isCurrentlyOpen,
            distanceFt: Math.round(hitDistance * 10) / 10,
          });
        } else {
          focusedApertureInPOVRef.current = null;
          setPovReticleTarget(null);
        }
      } else {
        if (focusedApertureInPOVRef.current) {
          focusedApertureInPOVRef.current = null;
          setPovReticleTarget(null);
        }
      }

      renderer.render(scene, camera);
    };

    // Interactive Raycaster for Direct Door & Window Cursor Clicks (PC) & Single Touch (Mobile)
    const raycaster = new THREE.Raycaster();
    const pointerVec = new THREE.Vector2();
    let pointerDownCoord = { x: 0, y: 0, time: 0 };

    const handleCanvasPointerDown = (e: PointerEvent) => {
      pointerDownCoord = { x: e.clientX, y: e.clientY, time: performance.now() };
      isUserInteractingRef.current = true;
    };

    const handleCanvasPointerUp = (e: PointerEvent) => {
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 2500);
      const dist = Math.hypot(e.clientX - pointerDownCoord.x, e.clientY - pointerDownCoord.y);
      const elapsed = performance.now() - pointerDownCoord.time;
      // If user dragged to rotate or held down too long, don't trigger door toggle
      if (dist > 10 || elapsed > 700) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointerVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerVec, camera);
      const intersects = raycaster.intersectObjects(containerGroup.children, true);

      for (const hit of intersects) {
        const interactive = findInteractiveDoorOrWindow(hit.object);
        if (interactive) {
          toggleApertureObject(interactive);
          return;
        }
      }
    };

    const handleCanvasPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerVec, camera);
      const intersects = raycaster.intersectObjects(containerGroup.children, true);
      let found: THREE.Object3D | null = null;
      for (const hit of intersects) {
        const interactive = findInteractiveDoorOrWindow(hit.object);
        if (interactive) {
          found = interactive;
          break;
        }
      }

      if (found) {
        renderer.domElement.style.cursor = 'pointer';
        const u = found.userData;
        let isCurrentlyOpen = false;
        const currentCfg = modelConfigRef.current;
        if (u.isFrontDoor || u.openingId === 'front-main-entry-door') {
          isCurrentlyOpen = !!currentCfg.frontDoorOpen;
        } else if (u.openingId === 'cargo-doors') {
          isCurrentlyOpen = !!currentCfg.cargoDoorsOpen;
        } else if (u.openingId) {
          const match = (currentCfg.openings || []).find((o) => o.id === u.openingId);
          isCurrentlyOpen = !!(match && match.isOpen);
        }
        const namePart = (u.title || 'Door / Window').split('(')[0].trim();
        setHoveredPrompt(`${namePart.toUpperCase()} • CLICK TO ${isCurrentlyOpen ? 'CLOSE' : 'OPEN'}`);
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredPrompt(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handleCanvasPointerDown);
    renderer.domElement.addEventListener('pointerup', handleCanvasPointerUp);
    renderer.domElement.addEventListener('pointermove', handleCanvasPointerMove);

    animate();

    return () => {
      renderer.domElement.removeEventListener('pointerdown', handleCanvasPointerDown);
      renderer.domElement.removeEventListener('pointerup', handleCanvasPointerUp);
      renderer.domElement.removeEventListener('pointermove', handleCanvasPointerMove);
      cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Sun Position and Dynamic Sky Atmosphere based on time of day & compass
  useEffect(() => {
    if (!sunLightRef.current) return;
    const hour = siteConfig.timeOfDayHours;
    // Map 6:00 (sunrise east) to 12:00 (noon south) to 18:00 (sunset west)
    const progress = (hour - 6) / 12; // 0 at 6am, 0.5 at noon, 1.0 at 6pm
    const sunAngle = progress * Math.PI; // 0 to PI
    const elevation = Math.sin(sunAngle) * 65; // peak height at noon
    const distance = 80;

    const compassRad = (siteConfig.orientationCompassDeg * Math.PI) / 180;
    const x = Math.cos(sunAngle) * distance * Math.cos(compassRad);
    const z = -Math.cos(sunAngle) * distance * Math.sin(compassRad) + Math.sin(sunAngle) * 35;
    const y = Math.max(elevation, 5);
    const sunPosVec = new THREE.Vector3(x, y, z);

    sunLightRef.current.position.set(x, y, z);

    // Warm golden light at dusk/dawn, bright neutral at noon
    if (hour <= 7 || hour >= 17) {
      sunLightRef.current.color.setHex(0xffaa55);
      sunLightRef.current.intensity = 1.6;
    } else {
      sunLightRef.current.color.setHex(0xfffaed);
      sunLightRef.current.intensity = 2.4;
    }

    // Synchronize procedural sky dome atmosphere gradient
    if (skyDomeRef.current) {
      updateSkyDome(skyDomeRef.current, hour, sunPosVec);
    }

    // Dynamic dual-hemisphere ambient sky bounce
    if (hemiLightRef.current) {
      if (hour <= 7 || hour >= 18) {
        hemiLightRef.current.color.setHex(0xf59e0b);
        hemiLightRef.current.groundColor.setHex(0x1e1b4b);
        hemiLightRef.current.intensity = 0.55;
      } else {
        hemiLightRef.current.color.setHex(0xdbeafe);
        hemiLightRef.current.groundColor.setHex(0x1e293b);
        hemiLightRef.current.intensity = 0.85;
      }
    }
  }, [siteConfig.timeOfDayHours, siteConfig.orientationCompassDeg]);

  // Graphics Quality Preset & Real-Time Fidelity Tuning
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const sunLight = sunLightRef.current;
    if (!renderer || !scene || !sunLight) return;

    if (graphicsPreset === 'ultra') {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.04;
    } else if (graphicsPreset === 'high') {
      renderer.shadowMap.type = THREE.PCFShadowMap;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    } else {
      renderer.shadowMap.type = THREE.BasicShadowMap;
      sunLight.shadow.mapSize.width = 512;
      sunLight.shadow.mapSize.height = 512;
      sunLight.shadow.bias = -0.0006;
      sunLight.shadow.normalBias = 0.01;
    }
    if (sunLight.shadow.map) {
      sunLight.shadow.map.dispose();
      (sunLight.shadow as any).map = null;
    }

    if (skyDomeRef.current) {
      skyDomeRef.current.visible = enableSkyAtmosphere;
    }
  }, [graphicsPreset, enableSkyAtmosphere]);

  // Build / Update Clean Architectural Model Floor (No grid structure or graph lines)
  useEffect(() => {
    const siteGroup = siteGroupRef.current;
    if (!siteGroup) return;

    // Clear previous site elements
    while (siteGroup.children.length > 0) {
      const obj = siteGroup.children[0];
      siteGroup.remove(obj);
      if ('geometry' in obj && obj.geometry) (obj.geometry as THREE.BufferGeometry).dispose();
    }

    const { lotWidthFt, lotDepthFt, containerOffsetXFt, containerOffsetZFt } = siteConfig;
    const { lengthFt, widthFt } = modelConfig;

    // Clean physical-scale architectural model floor: lawn garden, concrete foundation, travertine entry walkway
    const modelFloor = buildArchitecturalModelFloor(
      lotWidthFt,
      lotDepthFt,
      lengthFt,
      widthFt,
      containerOffsetXFt,
      containerOffsetZFt
    );
    siteGroup.add(modelFloor);
  }, [siteConfig, modelConfig]);

  // Procedurally Build 3D Container House Model
  useEffect(() => {
    const containerGroup = containerGroupRef.current;
    if (!containerGroup) return;

    // Check if change is ONLY door/window open/close states
    const prev = prevModelConfigRef.current;
    const isStructural = isStructuralConfigChange(prev, modelConfig);
    prevModelConfigRef.current = { ...modelConfig };

    if (!isStructural && containerGroup.children.length > 0) {
      // Smoothly update aperture targets in real time without destroying 3D meshes!
      updateApertureTargetsFromConfig(modelConfig);
      return;
    }

    // Clear old container model
    while (containerGroup.children.length > 0) {
      const obj = containerGroup.children[0];
      containerGroup.remove(obj);
      if ('geometry' in obj && obj.geometry) (obj.geometry as THREE.BufferGeometry).dispose();
    }

    // Set position & rotation from site config
    containerGroup.position.set(
      siteConfig.containerOffsetXFt,
      0,
      siteConfig.containerOffsetZFt
    );
    containerGroup.rotation.y = (siteConfig.containerRotationDeg * Math.PI) / 180;

    const {
      lengthFt,
      widthFt,
      heightFt,
      pierHeightInches,
    } = modelConfig;
    const baseElevation = pierHeightInches / 12;

    // Build authentic container house model with operable doors/windows & efficient interiors
    const completeHouse = buildCompleteContainerHouse(modelConfig);
    containerGroup.add(completeHouse);

    // Collect all animatable apertures (hinges, sliding tracks, awning windows)
    const apertures: AnimatableAperture[] = [];
    containerGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isAnimatableAperture) {
        apertures.push({
          key: obj.userData.apertureKey,
          type: obj.userData.apertureType,
          object: obj,
          targetRotY: obj.userData.targetRotY,
          targetRotX: obj.userData.targetRotX,
          targetPosX: obj.userData.targetPosX,
          targetPosZ: obj.userData.targetPosZ,
        });
      }
    });
    animatableAperturesRef.current = apertures;
    updateApertureTargetsFromConfig(modelConfig);

    // --- 3. 3D REAL-SCALE MEASUREMENT CALLOUT LINES ---
    if (siteConfig.showDimensions) {
      const dimMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });

      // Length Dimension Line (Front, along X axis)
      const lenPoints = [
        new THREE.Vector3(-lengthFt / 2, baseElevation + 0.5, widthFt / 2 + 2),
        new THREE.Vector3(lengthFt / 2, baseElevation + 0.5, widthFt / 2 + 2),
      ];
      const lenGeo = new THREE.BufferGeometry().setFromPoints(lenPoints);
      const lenLine = new THREE.Line(lenGeo, dimMat);
      containerGroup.add(lenLine);

      // Width Dimension Line (Side, along Z axis)
      const widthPoints = [
        new THREE.Vector3(lengthFt / 2 + 2, baseElevation + 0.5, -widthFt / 2),
        new THREE.Vector3(lengthFt / 2 + 2, baseElevation + 0.5, widthFt / 2),
      ];
      const widthGeo = new THREE.BufferGeometry().setFromPoints(widthPoints);
      const widthLine = new THREE.Line(widthGeo, dimMat);
      containerGroup.add(widthLine);

      // Height Dimension Line (Corner vertical, along Y axis)
      const heightPoints = [
        new THREE.Vector3(lengthFt / 2 + 2, baseElevation, widthFt / 2 + 2),
        new THREE.Vector3(lengthFt / 2 + 2, baseElevation + heightFt, widthFt / 2 + 2),
      ];
      const heightGeo = new THREE.BufferGeometry().setFromPoints(heightPoints);
      const heightLine = new THREE.Line(heightGeo, dimMat);
      containerGroup.add(heightLine);
    }
  }, [modelConfig, siteConfig]);

  // Handle First-Person Mode input handlers (Walkthrough VR & Minecraft Steve FPV)
  useEffect(() => {
    const isFpActive = viewMode === 'walkthrough-vr' || (viewMode === 'minecraft-afk' && afkFpvMode);
    if (!isFpActive) {
      fpControlsRef.current.active = false;
      if (controlsRef.current && viewMode !== 'minecraft-afk' && viewMode !== 'cinematic-tour') {
        controlsRef.current.enabled = true;
      }
      return;
    }

    // Switch to First-Person Walking Mode
    if (controlsRef.current) controlsRef.current.enabled = false;
    fpControlsRef.current.active = true;

    // Drop camera to 5.5ft eye level near front porch or container entrance
    if (cameraRef.current) {
      const pierHeightFt = modelConfig.pierHeightInches / 12;
      cameraRef.current.position.set(
        siteConfig.containerOffsetXFt + modelConfig.lengthFt / 2 - 2,
        5.5 + pierHeightFt,
        siteConfig.containerOffsetZFt + modelConfig.widthFt / 2 + 7
      );
      cameraRef.current.lookAt(
        siteConfig.containerOffsetXFt,
        5.5 + pierHeightFt,
        siteConfig.containerOffsetZFt
      );
      fpControlsRef.current.yaw = Math.PI;
      fpControlsRef.current.pitch = 0;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') fpControlsRef.current.keys.forward = true;
      if (k === 's' || k === 'arrowdown') fpControlsRef.current.keys.backward = true;
      if (k === 'a' || k === 'arrowleft') fpControlsRef.current.keys.left = true;
      if (k === 'd' || k === 'arrowright') fpControlsRef.current.keys.right = true;
      if (e.key === 'Shift') fpControlsRef.current.keys.sprint = true;
      if (k === 'e') {
        // Press 'E' to interact with targeted door or window in POV mode
        if (focusedApertureInPOVRef.current) {
          e.preventDefault();
          executeToggleApertureRef.current(focusedApertureInPOVRef.current);
        }
      }
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (jumpVelocityRef.current === 0) {
          jumpVelocityRef.current = 11.5;
          soundFx.playStep();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') fpControlsRef.current.keys.forward = false;
      if (k === 's' || k === 'arrowdown') fpControlsRef.current.keys.backward = false;
      if (k === 'a' || k === 'arrowleft') fpControlsRef.current.keys.left = false;
      if (k === 'd' || k === 'arrowright') fpControlsRef.current.keys.right = false;
      if (e.key === 'Shift') fpControlsRef.current.keys.sprint = false;
    };

    // Minecraft Pointer Lock & Mouse Look
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    const elem = mountRef.current;

    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === elem;
      isPointerLockedRef.current = locked;
      setIsPointerLocked(locked);
    };

    const handleCanvasClick = () => {
      if (!elem) return;
      if (document.pointerLockElement !== elem) {
        elem.requestPointerLock?.();
      } else {
        // If already pointer locked, left click toggles the aperture under crosshair
        if (focusedApertureInPOVRef.current) {
          executeToggleApertureRef.current(focusedApertureInPOVRef.current);
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!cameraRef.current) return;
      const isLocked = isPointerLockedRef.current;
      if (!isLocked && !isMouseDown) return;

      const dx = isLocked ? e.movementX : (e.clientX - lastMouseX);
      const dy = isLocked ? e.movementY : (e.clientY - lastMouseY);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      if (dx === 0 && dy === 0) return;

      // Smooth, high-precision Minecraft mouse sensitivity
      const sensitivity = isLocked ? 0.0022 : 0.0035;
      fpControlsRef.current.yaw -= dx * sensitivity;
      fpControlsRef.current.pitch = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, fpControlsRef.current.pitch - dy * sensitivity)
      );

      // Update camera rotation
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.y = fpControlsRef.current.yaw;
      euler.x = fpControlsRef.current.pitch;
      cameraRef.current.quaternion.setFromEuler(euler);
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    if (elem) {
      elem.addEventListener('click', handleCanvasClick);
      elem.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (elem) {
        elem.removeEventListener('click', handleCanvasClick);
        elem.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (document.pointerLockElement === elem) {
        document.exitPointerLock?.();
      }
    };
  }, [viewMode, afkFpvMode, siteConfig, modelConfig]);

  // Reset Camera View
  const handleResetCamera = (view: 'iso' | 'top' | 'front' | 'side') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const target = new THREE.Vector3(
      siteConfig.containerOffsetXFt,
      modelConfig.heightFt / 2,
      siteConfig.containerOffsetZFt
    );
    controlsRef.current.target.copy(target);

    if (view === 'iso') {
      cameraRef.current.position.set(
        target.x + modelConfig.lengthFt * 0.9,
        target.y + 18,
        target.z + modelConfig.widthFt * 2.2
      );
    } else if (view === 'top') {
      cameraRef.current.position.set(target.x, target.y + 70, target.z + 0.1);
    } else if (view === 'front') {
      cameraRef.current.position.set(target.x, target.y + 2, target.z + modelConfig.widthFt * 2.8);
    } else if (view === 'side') {
      cameraRef.current.position.set(target.x + modelConfig.lengthFt * 1.5, target.y + 2, target.z);
    }
    cameraRef.current.lookAt(target);
    controlsRef.current.update();
  };

  // Convert values for unit display
  const isMetric = siteConfig.unitSystem === 'metric';
  const formatLength = (ft: number) =>
    isMetric ? `${(ft * 0.3048).toFixed(2)} m` : `${ft.toFixed(1)} ft`;

  const currentShot = TOUR_SHOTS[currentShotIndex] || TOUR_SHOTS[0];

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#06090e]">
      {/* WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Beast UI Cyber Reticle Overlays (Corner brackets on viewport) */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#00f0ff]/35 pointer-events-none z-10" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#00f0ff]/35 pointer-events-none z-10" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#00f0ff]/35 pointer-events-none z-10" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#00f0ff]/35 pointer-events-none z-10" />

      {/* Beast UI Viewport HUD Watermark */}
      <div className="absolute bottom-2.5 right-12 z-10 pointer-events-none hidden md:flex items-center gap-2 font-mono text-[9px] text-slate-500/80 uppercase tracking-wider">
        <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]/50" />
        <span>BEAST UI ARCH ENGINE</span>
        <span>•</span>
        <span>1:1 SCALE VERIFIED</span>
      </div>

      {/* Snapshot Download Confirmation Toast (Top Right Corner) */}
      {snapshotToast && (
        <div className="absolute top-16 right-3 sm:right-4 z-50 flex items-center gap-3 rounded-xl bg-[#0d121c]/95 px-4 py-2.5 border border-[#00f0ff]/50 shadow-[0_0_30px_rgba(0,240,255,0.3)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00f0ff]/20 text-[#00f0ff]">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">4K Snapshot Saved</div>
            <div className="text-[10px] text-slate-400 font-mono">BeastUI_{modelConfig.name.replace(/[^a-zA-Z0-9]/g, '_')}_4K_CAD.png</div>
          </div>
        </div>
      )}

      {/* Interactive Door / Window Toggled Notification Toast (Top Right Corner) */}
      {interactionToast && (
        <div className="absolute top-16 right-3 sm:right-4 z-50 flex items-center gap-3 rounded-xl bg-[#0d121c]/95 px-4 py-2.5 border border-[#00f0ff]/60 shadow-[0_0_30px_rgba(0,240,255,0.35)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300 max-w-xs">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${interactionToast.isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#00f0ff]/20 text-[#00f0ff]'}`}>
            {interactionToast.isOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
              <span>{interactionToast.title}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${interactionToast.isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                {interactionToast.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans truncate max-w-[200px]">{interactionToast.subtitle}</div>
          </div>
        </div>
      )}

      {/* Real-time Hover Prompt for Doors & Windows (Top Right Corner) */}
      {hoveredPrompt && !interactionToast && viewMode !== 'cinematic-tour' && (
        <div className="absolute top-28 right-3 sm:right-4 z-40 pointer-events-none flex items-center gap-2 rounded-xl bg-[#0a0f18]/95 px-3 py-1.5 border border-[#00f0ff]/50 shadow-[0_0_20px_rgba(0,240,255,0.25)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
          <span className="text-slate-200">{hoveredPrompt}</span>
          <span className="text-[#00f0ff] font-bold text-[10px] bg-[#00f0ff]/15 px-1.5 py-0.5 rounded">CLICK TO TOGGLE</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* CINEMATIC VIDEO TOUR PLAYER OVERLAY                       */}
      {/* ========================================================= */}
      {viewMode === 'cinematic-tour' ? (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between">
          {/* Top Letterbox Bar */}
          <div className="pointer-events-auto w-full bg-gradient-to-b from-black/90 via-black/70 to-transparent p-4 md:p-6 backdrop-blur-[2px]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-[#00f0ff]/15 px-3 py-1 border border-[#00f0ff]/40 text-[#00f0ff]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff]"></span>
                  </span>
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
                    CINEMATIC WALKTHROUGH
                  </span>
                </div>
                <div className="hidden sm:inline-flex rounded bg-black/60 px-2 py-0.5 border border-slate-800 text-[10px] font-mono text-slate-400">
                  4K 60FPS • ARCHITECTURAL CUT
                </div>
              </div>

              {/* Current Shot Information */}
              <div className="text-left sm:text-right">
                <div className="text-xs font-mono font-bold text-white tracking-wide flex items-center gap-2">
                  <span className="text-[#00f0ff]">SHOT {currentShotIndex + 1}/{TOUR_SHOTS.length}:</span>
                  <span>{currentShot.title}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">{currentShot.subtitle}</div>
              </div>

              {/* Close Tour Button */}
              <button
                onClick={() => onViewModeChange('3d-orbit')}
                className="pointer-events-auto rounded-lg bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs font-medium border border-white/20 transition flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit Tour</span>
              </button>
            </div>
          </div>

          {/* Center Cinematic Reticle / Subtle Watermark */}
          <div className="flex-1 flex items-end p-6 justify-between opacity-80 pointer-events-none">
            <div className="text-xs font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
              <span className="text-[#00f0ff] font-bold">GRID &amp; LOGIC</span> • 1:1 REAL SCALE CLIENT ENGINE
            </div>
            <div className="text-xs font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm hidden md:block">
              SITE: {siteConfig.siteDimensionsFt.width} × {siteConfig.siteDimensionsFt.depth} FT • {modelConfig.layoutType.toUpperCase()}
            </div>
          </div>

          {/* Bottom Video Controller Bar */}
          <div className="pointer-events-auto w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 md:p-6 backdrop-blur-[2px]">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              {/* Shot Timeline Buttons */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {TOUR_SHOTS.map((shot, idx) => (
                  <button
                    key={shot.id}
                    onClick={() => {
                      tourProgressRef.current = 0;
                      tourShotIndexRef.current = idx;
                      setCurrentShotIndex(idx);
                      setIsPlayingTour(true);
                      isPlayingTourRef.current = true;
                    }}
                    className={`group relative flex flex-col items-start p-2 rounded-lg border transition text-left ${
                      idx === currentShotIndex
                        ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                        : 'bg-black/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className={idx === currentShotIndex ? 'text-[#00f0ff]' : 'text-slate-500'}>0{idx + 1}</span>
                      <span className="truncate hidden sm:inline">{shot.title.split(' ')[0]}</span>
                    </div>
                    {/* Active Progress Bar Under Timeline */}
                    <div className="w-full bg-slate-800 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-150 ${
                          idx === currentShotIndex ? 'bg-[#00f0ff] w-full' : idx < currentShotIndex ? 'bg-slate-500 w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Main Playback Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {/* Prev Shot */}
                  <button
                    onClick={() => {
                      tourProgressRef.current = 0;
                      const prevIdx = (currentShotIndex - 1 + TOUR_SHOTS.length) % TOUR_SHOTS.length;
                      tourShotIndexRef.current = prevIdx;
                      setCurrentShotIndex(prevIdx);
                    }}
                    className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                    title="Previous Shot"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {/* Play / Pause */}
                  <button
                    onClick={() => {
                      const next = !isPlayingTour;
                      setIsPlayingTour(next);
                      isPlayingTourRef.current = next;
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00f0ff] hover:bg-[#00d2df] text-black font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] transition"
                  >
                    {isPlayingTour ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  {/* Next Shot */}
                  <button
                    onClick={() => {
                      tourProgressRef.current = 0;
                      const nextIdx = (currentShotIndex + 1) % TOUR_SHOTS.length;
                      tourShotIndexRef.current = nextIdx;
                      setCurrentShotIndex(nextIdx);
                    }}
                    className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                    title="Next Shot"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  {/* Speed Selector */}
                  <div className="flex items-center rounded-lg bg-slate-900/80 border border-slate-700 p-0.5 ml-1">
                    {[0.75, 1.0, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          setTourSpeed(spd);
                          tourSpeedRef.current = spd;
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition ${
                          tourSpeed === spd ? 'bg-[#00f0ff] text-black font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Action Tools in Video Bar */}
                <div className="flex items-center gap-2">
                  {/* Record House Visit Video 60FPS Capture */}
                  {!isRecordingVideo ? (
                    <button
                      onClick={handleStartVideoRecording}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(239,68,68,0.5)] transition active:scale-95"
                      title="Record High-Definition House Visit Video"
                    >
                      <Circle className="w-3.5 h-3.5 fill-current animate-pulse text-white" />
                      <span>Record House Video</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopVideoRecording}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.5)] transition animate-pulse"
                      title="Stop Recording and Preview House Visit Video"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop &amp; View Video ({recordingSeconds}s)</span>
                    </button>
                  )}

                  <button
                    onClick={handleCaptureSnapshot}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-[#00f0ff]/50 text-xs font-medium transition"
                    title="Capture High-Resolution 4K Image for Client"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span className="hidden sm:inline">Capture 4K Frame</span>
                  </button>

                  <button
                    onClick={() => {
                      const next = !isLooping;
                      setIsLooping(next);
                      isLoopingRef.current = next;
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition ${
                      isLooping
                        ? 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff]'
                        : 'bg-slate-900/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    Loop Tour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================= */}
      {/* STANDARD / CLIENT SHOWROOM HUD OVERLAYS                   */}
      {/* ========================================================= */}

      {/* Showroom Center Focus Mode Active Badge */}
      {isModelOnlyFocus && viewMode !== 'cinematic-tour' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 rounded-2xl bg-[#090d16]/95 px-4 py-2 border border-[#00f0ff]/40 shadow-[0_0_30px_rgba(0,240,255,0.25)] backdrop-blur-xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00f0ff] animate-pulse" />
            <span className="font-heading text-xs font-bold tracking-wider text-white uppercase">
              Showroom Focus Mode
            </span>
            <span className="text-[10px] font-mono text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/20">
              {modelConfig.name}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <button
            onClick={() => setIsModelOnlyFocus(false)}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition"
          >
            <Minimize2 className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Exit Focus</span>
          </button>
        </div>
      )}

      {/* Top Left: Clean Architectural Status & Measurements Panel Launcher */}
      {!isModelOnlyFocus && viewMode !== 'cinematic-tour' && (
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-24px)] sm:max-w-md">
          {/* Main Status Pill */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-[#0d121c]/92 px-3 py-2 border border-[#1e293b] backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff]"></span>
              </span>
              <span className="font-heading text-xs font-bold text-white tracking-wide truncate max-w-[140px] sm:max-w-[180px]">
                {modelConfig.name}
              </span>
              <span className="text-[10px] font-mono text-[#00f0ff] bg-[#00f0ff]/15 px-2 py-0.5 rounded font-bold border border-[#00f0ff]/30">
                {formatLength(modelConfig.lengthFt)} × {formatLength(modelConfig.widthFt)}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Direct Launcher to Precision Measurements Panel */}
            <button
              onClick={() => setShowMeasurementsPanel(!showMeasurementsPanel)}
              className="flex items-center gap-1.5 rounded-lg bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 text-[#00f0ff] px-2.5 py-1 text-[11px] font-mono font-bold border border-[#00f0ff]/40 shadow-[0_0_10px_rgba(0,240,255,0.15)] transition"
              title="Open Detailed 1:1 Architectural Measurements & Setback Panel"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Measurements</span>
            </button>
          </div>

          {/* Inside Container Indicator Pill */}
          {viewMode === 'walkthrough-vr' && isInsideBuilding && (
            <div className="pointer-events-auto rounded-xl bg-emerald-500/20 border border-emerald-500/50 px-3 py-1.5 backdrop-blur-md shadow-lg text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>INSIDE CONTAINER HOME</span>
            </div>
          )}
        </div>
      )}

      {/* Top Right: Camera Angles, Snapshot, or Exit Walkthrough Button */}
      {!isModelOnlyFocus && viewMode !== 'cinematic-tour' && (
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex flex-wrap items-center justify-end gap-2 max-w-[calc(100vw-24px)] pointer-events-none">
          {viewMode === 'walkthrough-vr' ? (
            <div className="pointer-events-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d121c]/92 border border-[#00f0ff]/40 text-[#00f0ff] text-[11px] font-mono shadow-2xl backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
                <span>{isPointerLocked ? 'MOUSE LOOK • [E] INTERACT DOORS/WINDOWS • ESC RELEASE' : 'CLICK VIEWPORT FOR MOUSE LOOK • [E] TO INTERACT'}</span>
              </div>
              <button
                onClick={() => onViewModeChange('3d-orbit')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/25 hover:bg-red-500/40 text-red-200 hover:text-white border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.45)] backdrop-blur-md text-xs font-mono font-bold transition hover:scale-[1.02] active:scale-[0.98]"
                title="Exit Walkthrough and return to 3D Orbit View"
              >
                <X className="w-4 h-4 text-red-400" />
                <span>EXIT WALKTHROUGH</span>
              </button>
            </div>
          ) : (
            /* Main Control Pill */
            <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-[#0d121c]/92 p-1.5 border border-[#1e293b] backdrop-blur-md shadow-2xl">
              {/* View presets */}
              <button
                onClick={() => handleResetCamera('iso')}
                title="Isometric 3D View"
                className="rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium text-slate-300 hover:text-white hover:bg-[#162032] transition"
              >
                ISO
              </button>
              <button
                onClick={() => handleResetCamera('top')}
                title="Top-Down Site Plan View"
                className="rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium text-slate-300 hover:text-white hover:bg-[#162032] transition"
              >
                TOP
              </button>
              <button
                onClick={() => handleResetCamera('front')}
                title="Front Elevation"
                className="rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium text-slate-300 hover:text-white hover:bg-[#162032] transition hidden sm:inline-block"
              >
                FRONT
              </button>
              <button
                onClick={() => handleResetCamera('side')}
                title="Side Elevation"
                className="rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium text-slate-300 hover:text-white hover:bg-[#162032] transition hidden sm:inline-block"
              >
                SIDE
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              {/* Snapshot Button */}
              <button
                onClick={handleCaptureSnapshot}
                className="p-1.5 rounded-lg text-slate-300 hover:text-[#00f0ff] hover:bg-[#162032] transition"
                title="Capture 4K Snapshot"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Game Walkthrough Reticle & Touch D-Pad */}
      {viewMode === 'walkthrough-vr' && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex flex-col items-center justify-center gap-2">
            <div className={`transition-all duration-200 rounded-full flex items-center justify-center ${
              povReticleTarget 
                ? 'w-7 h-7 border-2 border-[#00f0ff] bg-[#00f0ff]/15 shadow-[0_0_15px_#00f0ff]' 
                : 'w-5 h-5 border border-white/60'
            }`}>
              <div className={`rounded-full transition-all duration-200 ${
                povReticleTarget 
                  ? 'w-2 h-2 bg-white shadow-[0_0_10px_#ffffff]' 
                  : 'w-1.5 h-1.5 bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]'
              }`} />
            </div>

            {/* Dynamic Aperture Target Floating HUD Badge in POV Mode */}
            {povReticleTarget && (
              <div className="animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#070b14]/90 border border-[#00f0ff]/60 shadow-[0_4px_20px_rgba(0,240,255,0.3)] backdrop-blur-md">
                <span className="px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] text-[10px] font-mono font-bold tracking-wider">
                  [E] or CLICK
                </span>
                <span className="text-[11px] font-bold text-white uppercase tracking-wide">
                  {povReticleTarget.name}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                  povReticleTarget.isOpen 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-amber-400 bg-amber-500/10'
                }`}>
                  {povReticleTarget.isOpen ? 'OPEN' : 'CLOSED'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {povReticleTarget.distanceFt}ft
                </span>
              </div>
            )}
          </div>

          <div className="md:hidden absolute bottom-6 right-6 z-30 pointer-events-auto flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-[#090d16]/95 border border-[#00f0ff]/40 shadow-2xl backdrop-blur-xl">
            <button
              onPointerDown={() => { fpControlsRef.current.keys.forward = true; }}
              onPointerUp={() => { fpControlsRef.current.keys.forward = false; }}
              onPointerLeave={() => { fpControlsRef.current.keys.forward = false; }}
              className="w-10 h-10 rounded-xl bg-slate-800 active:bg-[#00f0ff] active:text-black text-white font-bold flex items-center justify-center border border-slate-700 shadow"
            >
              ▲
            </button>
            <div className="flex items-center gap-1">
              <button
                onPointerDown={() => { fpControlsRef.current.keys.left = true; }}
                onPointerUp={() => { fpControlsRef.current.keys.left = false; }}
                onPointerLeave={() => { fpControlsRef.current.keys.left = false; }}
                className="w-10 h-10 rounded-xl bg-slate-800 active:bg-[#00f0ff] active:text-black text-white font-bold flex items-center justify-center border border-slate-700 shadow"
              >
                ◄
              </button>
              <button
                onPointerDown={() => { fpControlsRef.current.keys.backward = true; }}
                onPointerUp={() => { fpControlsRef.current.keys.backward = false; }}
                onPointerLeave={() => { fpControlsRef.current.keys.backward = false; }}
                className="w-10 h-10 rounded-xl bg-slate-800 active:bg-[#00f0ff] active:text-black text-white font-bold flex items-center justify-center border border-slate-700 shadow"
              >
                ▼
              </button>
              <button
                onPointerDown={() => { fpControlsRef.current.keys.right = true; }}
                onPointerUp={() => { fpControlsRef.current.keys.right = false; }}
                onPointerLeave={() => { fpControlsRef.current.keys.right = false; }}
                className="w-10 h-10 rounded-xl bg-slate-800 active:bg-[#00f0ff] active:text-black text-white font-bold flex items-center justify-center border border-slate-700 shadow"
              >
                ►
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Right: Site Controls Bar (Interactive Site Planning) */}
      {viewMode !== 'cinematic-tour' && (
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-10 flex flex-col items-end gap-2 pointer-events-none">
          {/* Mobile toggle button for site tools */}
          <button
            onClick={() => setSiteToolsOpen(!siteToolsOpen)}
            className="sm:hidden pointer-events-auto flex items-center gap-1.5 rounded-xl bg-[#0d121c]/92 px-3 py-2 border border-[#1e293b] text-xs font-mono text-[#00f0ff] backdrop-blur-md shadow-xl"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Site Tools</span>
            {siteToolsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Site Planning Control Box */}
          <div
            className={`pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl bg-[#0d121c]/92 p-2 border border-[#1e293b] backdrop-blur-md shadow-2xl text-slate-300 text-xs font-mono transition-all duration-200 ${
              siteToolsOpen ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {/* Sun Angle / Time of Day slider */}
            <div className="flex items-center gap-2 px-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400 min-w-[38px]">
                {siteConfig.timeOfDayHours}:00
              </span>
              <input
                type="range"
                min="6"
                max="18"
                step="1"
                value={siteConfig.timeOfDayHours}
                onChange={(e) => onUpdateSiteConfig({ timeOfDayHours: parseInt(e.target.value, 10) })}
                className="w-16 sm:w-20 accent-[#00f0ff] cursor-pointer"
                title="Adjust Sun Time of Day (Shadow Simulation)"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left: Cardinal Compass Indicator */}
      {!isModelOnlyFocus && viewMode !== 'cinematic-tour' && (
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-10 flex items-center gap-2 rounded-xl bg-[#0d121c]/92 px-3 py-2 border border-[#1e293b] backdrop-blur-md shadow-2xl text-slate-300 text-xs font-mono">
          <Compass className="w-4 h-4 text-[#00f0ff]" />
          <span className="hidden sm:inline text-slate-400">Orientation:</span>
          <span className="font-bold text-white">{siteConfig.orientationCompassDeg}°</span>
          <button
            onClick={() =>
              onUpdateSiteConfig({
                orientationCompassDeg: (siteConfig.orientationCompassDeg + 45) % 360,
              })
            }
            className="rounded-lg p-1 hover:bg-[#162032] text-slate-400 hover:text-white transition"
            title="Rotate Cardinal Orientation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VR Walkthrough Controls & Teleportation HUD */}
      {(viewMode === 'walkthrough-vr' || viewMode === 'vr-walkthrough') && (
        <VRWalkthroughOverlay
          onExitVR={() => onViewModeChange('3d-orbit')}
          onTeleport={handleVRTeleport}
          onToggleAllDoors={handleToggleAllDoors}
          isAllDoorsOpen={!!modelConfig.frontDoorOpen || !!modelConfig.cargoDoorsOpen}
          isStereoscopic={isStereoscopic}
          onToggleStereoscopic={() => setIsStereoscopic(!isStereoscopic)}
        />
      )}

      {/* House Visit Video Playback & Download Modal */}
      <HouseVisitVideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoBlobUrl={recordedVideoUrl}
        modelName={modelConfig.name}
        onRecordAgain={() => {
          setShowVideoModal(false);
          onViewModeChange('cinematic-tour');
          setTimeout(() => {
            handleStartVideoRecording();
          }, 600);
        }}
      />

      {/* Architectural Precision Measurements & Setbacks Panel */}
      <MeasurementsPanel
        isOpen={externalShowMeasurements !== undefined ? externalShowMeasurements : showMeasurementsPanel}
        onClose={() => {
          setShowMeasurementsPanel(false);
          if (onCloseMeasurements) onCloseMeasurements();
        }}
        modelConfig={modelConfig}
        siteConfig={siteConfig}
        onUpdateSiteConfig={onUpdateSiteConfig}
        onOpenSpecSheet={onOpenSpecSheet}
      />
    </div>
  );
};
