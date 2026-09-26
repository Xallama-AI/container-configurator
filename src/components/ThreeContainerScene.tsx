import React, { lazy, Suspense, useEffect, useRef, useState, useCallback } from 'react';
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
import { soundFx } from '../utils/audio';

const MeasurementsPanel = lazy(() => import('./MeasurementsPanel').then((module) => ({ default: module.MeasurementsPanel })));
const HouseVisitVideoModal = lazy(() => import('./HouseVisitVideoModal').then((module) => ({ default: module.HouseVisitVideoModal })));
const VRWalkthroughOverlay = lazy(() => import('./VRWalkthroughOverlay').then((module) => ({ default: module.VRWalkthroughOverlay })));

function disposeObjectResources(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    const resourceObject = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (resourceObject.geometry) geometries.add(resourceObject.geometry);
    if (Array.isArray(resourceObject.material)) resourceObject.material.forEach((material) => materials.add(material));
    else if (resourceObject.material) materials.add(resourceObject.material);
  });
  root.clear();
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

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
  const dimensionsGroupRef = useRef<THREE.Group | null>(null);
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
  const cameraPositionInfoRef = useRef(cameraPositionInfo);
  const cameraInfoUpdateTimeRef = useRef(0);
  const isInsideBuildingRef = useRef(false);

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
  const povReticleTargetRef = useRef<typeof povReticleTarget>(null);
  const povReticleUpdateTimeRef = useRef(0);
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
    const isCompactViewport = window.matchMedia('(max-width: 700px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompactViewport ? 1 : 1.25));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
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
    const shadowMapSize = window.innerWidth <= 700 ? 512 : 1024;
    sunLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
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

    const dimensionsGroup = new THREE.Group();
    containerGroup.add(dimensionsGroup);
    dimensionsGroupRef.current = dimensionsGroup;

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
    const frameIntervalMs = window.matchMedia('(max-width: 700px)').matches ? 1000 / 24 : 1000 / 30;
    let lastTime = performance.now();
    let lastFrameTime = 0;
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      if (now - lastFrameTime < frameIntervalMs) return;
      lastFrameTime = now;
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
        const nextCameraInfo = {
          x: Math.round(camPos.x),
          y: Math.round(camPos.y),
          z: Math.round(camPos.z),
        };
        const previousCameraInfo = cameraPositionInfoRef.current;
        if (
          now - cameraInfoUpdateTimeRef.current >= 250 &&
          (nextCameraInfo.x !== previousCameraInfo.x || nextCameraInfo.y !== previousCameraInfo.y || nextCameraInfo.z !== previousCameraInfo.z)
        ) {
          cameraPositionInfoRef.current = nextCameraInfo;
          cameraInfoUpdateTimeRef.current = now;
          setCameraPositionInfo(nextCameraInfo);
        }

        // Check if inside container bounding box
        const halfL = mCfg.lengthFt / 2;
        const halfW = mCfg.widthFt / 2;
        const inside =
          Math.abs(camPos.x - sCfg.containerOffsetXFt) < halfL &&
          Math.abs(camPos.z - sCfg.containerOffsetZFt) < halfW &&
          camPos.y >= 0 &&
          camPos.y <= mCfg.heightFt;
        if (inside !== isInsideBuildingRef.current) {
          isInsideBuildingRef.current = inside;
          setIsInsideBuilding(inside);
        }
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
          const nextReticleTarget = {
            name: namePart,
            isOpen: isCurrentlyOpen,
            distanceFt: Math.round(hitDistance * 10) / 10,
          };
          const previousReticleTarget = povReticleTargetRef.current;
          if (
            !previousReticleTarget ||
            previousReticleTarget.name !== nextReticleTarget.name ||
            previousReticleTarget.isOpen !== nextReticleTarget.isOpen ||
            (previousReticleTarget.distanceFt !== nextReticleTarget.distanceFt && now - povReticleUpdateTimeRef.current >= 200)
          ) {
            povReticleTargetRef.current = nextReticleTarget;
            povReticleUpdateTimeRef.current = now;
            setPovReticleTarget(nextReticleTarget);
          }
        } else {
          focusedApertureInPOVRef.current = null;
          if (povReticleTargetRef.current !== null) {
            povReticleTargetRef.current = null;
            setPovReticleTarget(null);
          }
        }
      } else {
        if (focusedApertureInPOVRef.current) {
          focusedApertureInPOVRef.current = null;
          if (povReticleTargetRef.current !== null) {
            povReticleTargetRef.current = null;
            setPovReticleTarget(null);
          }
        }
      }

      if (document.visibilityState === 'visible') renderer.render(scene, camera);
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
      scene.environment?.dispose();
      disposeObjectResources(scene);
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
      renderer.shadowMap.type = THREE.PCFShadowMap;
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
    disposeObjectResources(siteGroup);

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
  }, [siteConfig.lotWidthFt, siteConfig.lotDepthFt, siteConfig.containerOffsetXFt, siteConfig.containerOffsetZFt, modelConfig.lengthFt, modelConfig.widthFt]);

  useEffect(() => {
    const containerGroup = containerGroupRef.current;
    if (!containerGroup) return;
    containerGroup.position.set(siteConfig.containerOffsetXFt, 0, siteConfig.containerOffsetZFt);
    containerGroup.rotation.y = (siteConfig.containerRotationDeg * Math.PI) / 180;
  }, [siteConfig.containerOffsetXFt, siteConfig.containerOffsetZFt, siteConfig.containerRotationDeg]);

  // Procedurally Build 3D Container House Model
  useEffect(() => {
    const containerGroup = containerGroupRef.current;
    if (!containerGroup) return;

    // Check if change is ONLY door/window open/close states
    const prev = prevModelConfigRef.current;
    const isStructural = isStructuralConfigChange(prev, modelConfig);
    prevModelConfigRef.current = { ...modelConfig };

    const hasBuiltModel = containerGroup.children.some((child) => child !== dimensionsGroupRef.current);
    if (!isStructural && hasBuiltModel) {
      // Smoothly update aperture targets in real time without destroying 3D meshes!
      updateApertureTargetsFromConfig(modelConfig);
      return;
    }

    // Clear old container model
    for (const child of [...containerGroup.children]) {
      if (child !== dimensionsGroupRef.current) {
        containerGroup.remove(child);
        disposeObjectResources(child);
      }
    }

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

  }, [modelConfig]);

  useEffect(() => {
    const dimensionsGroup = dimensionsGroupRef.current;
    if (!dimensionsGroup) return;
    disposeObjectResources(dimensionsGroup);
    if (!siteConfig.showDimensions) return;

    const { lengthFt, widthFt, heightFt, pierHeightInches } = modelConfig;
    const baseElevation = pierHeightInches / 12;
    const dimMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
    const lines = [
      [[-lengthFt / 2, baseElevation + 0.5, widthFt / 2 + 2], [lengthFt / 2, baseElevation + 0.5, widthFt / 2 + 2]],
      [[lengthFt / 2 + 2, baseElevation + 0.5, -widthFt / 2], [lengthFt / 2 + 2, baseElevation + 0.5, widthFt / 2]],
      [[lengthFt / 2 + 2, baseElevation, widthFt / 2 + 2], [lengthFt / 2 + 2, baseElevation + heightFt, widthFt / 2 + 2]],
    ];
    for (const points of lines) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
      dimensionsGroup.add(new THREE.Line(geometry, dimMat));
    }
    return () => dimMat.dispose();
  }, [siteConfig.showDimensions, modelConfig.lengthFt, modelConfig.widthFt, modelConfig.heightFt, modelConfig.pierHeightInches]);

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

      {/* VR Walkthrough Controls & Teleportation HUD */}
      {(viewMode === 'walkthrough-vr' || viewMode === 'vr-walkthrough') && (
        <Suspense fallback={null}><VRWalkthroughOverlay
          onExitVR={() => onViewModeChange('3d-orbit')}
          onTeleport={handleVRTeleport}
          onToggleAllDoors={handleToggleAllDoors}
          isAllDoorsOpen={!!modelConfig.frontDoorOpen || !!modelConfig.cargoDoorsOpen}
          isStereoscopic={isStereoscopic}
          onToggleStereoscopic={() => setIsStereoscopic(!isStereoscopic)}
        /></Suspense>
      )}

      {/* House Visit Video Playback & Download Modal */}
      {showVideoModal && <Suspense fallback={null}><HouseVisitVideoModal
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
      /></Suspense>}

      {/* Architectural Precision Measurements & Setbacks Panel */}
      {(externalShowMeasurements ?? showMeasurementsPanel) && <Suspense fallback={null}><MeasurementsPanel
        isOpen={externalShowMeasurements !== undefined ? externalShowMeasurements : showMeasurementsPanel}
        onClose={() => {
          setShowMeasurementsPanel(false);
          if (onCloseMeasurements) onCloseMeasurements();
        }}
        modelConfig={modelConfig}
        siteConfig={siteConfig}
        onUpdateSiteConfig={onUpdateSiteConfig}
        onOpenSpecSheet={onOpenSpecSheet}
      /></Suspense>}
    </div>
  );
};
