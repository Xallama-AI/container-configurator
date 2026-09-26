import * as THREE from 'three';
import React, { useEffect, useRef, useState } from 'react';
import { ContainerModelConfig, SitePlanningConfig } from '../types';
import { buildCompleteContainerHouse } from './3d/ContainerModelBuilder';
import {
  Camera,
  X,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Check,
  AlertCircle,
  DoorOpen,
  DoorClosed,
  QrCode,
  Eye,
} from 'lucide-react';

interface CameraAROverlayProps {
  modelConfig: ContainerModelConfig;
  siteConfig: SitePlanningConfig;
  onClose: () => void;
  onOpenQR?: () => void;
  onUpdateModelConfig?: (config: ContainerModelConfig) => void;
}

export const CameraAROverlay: React.FC<CameraAROverlayProps> = ({
  modelConfig,
  siteConfig,
  onClose,
  onOpenQR,
  onUpdateModelConfig,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<'real' | 'miniature'>('real');
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [rotationY, setRotationY] = useState(0);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(-1.5);
  const [positionZ, setPositionZ] = useState(-16);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, origX: 0, origY: 0 });
  const [realScaleLocked, setRealScaleLocked] = useState(true);
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [doorsAllOpen, setDoorsAllOpen] = useState(false);

  // Mutable transform ref to prevent closure staleness in Three.js render loop
  const transformRef = useRef({
    scaleFactor: 1.0,
    positionX: 0,
    positionY: -1.5,
    positionZ: -16,
    rotationY: 0,
  });

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const houseGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // -------------------------------------------------------------
  // 1. DEVICE CAMERA STREAM (Rear environment camera)
  // -------------------------------------------------------------
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn('Camera AR feed error:', err);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera access permission denied. Allow camera in browser settings to visualize on site.'
            : 'Live camera is unavailable on this device. Visualizing in simulated site environment.'
        );
      }
    }

    startCamera();

    return () => {
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // -------------------------------------------------------------
  // 2. THREE.JS AR SCENE SETUP (Transparent WebGL Overlay)
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene with pure transparency (shows live camera underneath)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.5, 0);
    camera.lookAt(0, 0, -16);
    cameraRef.current = camera;

    // WebGL Renderer with alpha transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Natural outdoor directional daylight & ambient sky
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.4);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sunLight.position.set(25, 40, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const softFill = new THREE.DirectionalLight(0xdbeafe, 0.9);
    softFill.position.set(-20, 20, -10);
    scene.add(softFill);

    // -------------------------------------------------------------
    // RENDER ONLY THE HOUSE (No lot lines, no setbacks, no grids)
    // -------------------------------------------------------------
    const houseRoot = new THREE.Group();
    houseGroupRef.current = houseRoot;
    scene.add(houseRoot);

    const completeHouse = buildCompleteContainerHouse(modelConfig);
    houseRoot.add(completeHouse);

    // Render loop using transformRef to guarantee real-time updates
    const render = () => {
      if (houseGroupRef.current) {
        const t = transformRef.current;
        houseGroupRef.current.position.set(t.positionX, t.positionY, t.positionZ);
        houseGroupRef.current.rotation.y = t.rotationY;
        houseGroupRef.current.scale.setScalar(t.scaleFactor);
      }
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(render);
    };
    render();

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update house model when modelConfig changes
  useEffect(() => {
    const houseRoot = houseGroupRef.current;
    if (!houseRoot) return;

    while (houseRoot.children.length > 0) {
      const child = houseRoot.children[0];
      houseRoot.remove(child);
      if ('geometry' in child && child.geometry) {
        (child.geometry as THREE.BufferGeometry).dispose();
      }
    }

    const completeHouse = buildCompleteContainerHouse(modelConfig);
    houseRoot.add(completeHouse);
  }, [modelConfig]);

  // Update position, rotation, scale in scene
  useEffect(() => {
    transformRef.current = { scaleFactor, positionX, positionY, positionZ, rotationY };
    if (houseGroupRef.current) {
      houseGroupRef.current.position.set(positionX, positionY, positionZ);
      houseGroupRef.current.rotation.y = rotationY;
      houseGroupRef.current.scale.setScalar(scaleFactor);
    }
  }, [positionX, positionY, positionZ, rotationY, scaleFactor]);

  // -------------------------------------------------------------
  // 3. INTERACTIVE TOUCH / MOUSE CONTROLS (Drag & Tap Doors)
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      origX: positionX,
      origY: positionY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = (e.clientX - dragStartRef.current.x) * 0.015;
    const deltaY = (dragStartRef.current.y - e.clientY) * 0.015;
    setPositionX(dragStartRef.current.origX + deltaX);
    setPositionY(dragStartRef.current.origY + deltaY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const distMoved = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
    setIsDragging(false);

    // If tap/click without drag: raycast to toggle clicked door or window!
    if (distMoved < 8 && rendererRef.current && cameraRef.current && houseGroupRef.current) {
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(houseGroupRef.current.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== houseGroupRef.current) {
          if (cur.userData && cur.userData.isDoorOrWindow) {
            const opId = cur.userData.openingId;
            if (opId === 'cargo-doors' && onUpdateModelConfig) {
              onUpdateModelConfig({
                ...modelConfig,
                cargoDoorsOpen: !modelConfig.cargoDoorsOpen,
              });
              return;
            } else if (opId === 'front-door' && onUpdateModelConfig) {
              onUpdateModelConfig({
                ...modelConfig,
                frontDoorOpen: !modelConfig.frontDoorOpen,
              });
              return;
            } else if ((opId === 'interior-bath-door' || opId === 'interior-bed-door') && onUpdateModelConfig) {
              const curState = modelConfig.doorStates?.[opId] !== undefined
                ? modelConfig.doorStates[opId]
                : !!modelConfig.interiorDoorsOpen;
              onUpdateModelConfig({
                ...modelConfig,
                doorStates: { ...(modelConfig.doorStates || {}), [opId]: !curState },
                ...(opId === 'interior-bath-door' ? { interiorDoorsOpen: !curState } : {}),
              });
              return;
            } else if (opId && onUpdateModelConfig) {
              const updated = (modelConfig.openings || []).map((op) =>
                op.id === opId ? { ...op, isOpen: !op.isOpen } : op
              );
              onUpdateModelConfig({
                ...modelConfig,
                openings: updated,
              });
              return;
            }
          }
          cur = cur.parent;
        }
      }
    }
  };

  // Toggle all doors and windows open/closed
  const handleToggleAllDoors = () => {
    const nextState = !doorsAllOpen;
    setDoorsAllOpen(nextState);
    if (onUpdateModelConfig) {
      const updatedOpenings = (modelConfig.openings || []).map((op) => ({
        ...op,
        isOpen: nextState,
      }));
      onUpdateModelConfig({
        ...modelConfig,
        openings: updatedOpenings,
        cargoDoorsOpen: nextState,
      });
    }
  };

  // -------------------------------------------------------------
  // 4. HIGH-RESOLUTION AR PHOTO CAPTURE
  // -------------------------------------------------------------
  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    const webglRenderer = rendererRef.current;
    if (!webglRenderer) return;

    const exportCanvas = document.createElement('canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw live camera background
    if (video && cameraActive) {
      ctx.drawImage(video, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw transparent 3D container house
    ctx.drawImage(webglRenderer.domElement, 0, 0, width, height);

    // 3. Subtle watermark
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 18px "Chakra Petch", sans-serif';
    ctx.fillText('GRID & LOGIC - 1:1 REAL-WORLD AR PLACEMENT', 30, 40);
    ctx.font = '13px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${modelConfig.name} (${modelConfig.lengthFt}ft × ${modelConfig.widthFt}ft)`, 30, 65);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ar-site-house-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black select-none overflow-hidden">
      {/* 1. Live Background Video Stream (or ambient twilight plot if camera denied) */}
      {cameraActive ? (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#090d16] via-[#101b2b] to-[#14231b] flex items-center justify-center pointer-events-none">
          <div className="text-center p-6 max-w-md bg-[#0d121c]/90 rounded-2xl border border-slate-700 backdrop-blur-md">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <h3 className="font-heading text-base font-bold text-white mb-1">
              AR Camera Environment
            </h3>
            <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
            <span className="inline-block px-3 py-1 bg-[#00f0ff]/15 text-[#00f0ff] rounded-full text-[11px] font-mono border border-[#00f0ff]/30">
              Interactive 3D House Active • Drag to Reposition
            </span>
          </div>
        </div>
      )}

      {/* 2. Three.js Transparent WebGL Overlay (RENDERS ONLY THE HOUSE) */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-move touch-none z-10"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* 3. Top Header Bar */}
      <div className="relative z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00f0ff]"></span>
          </div>
          <span className="font-heading font-bold text-white tracking-wide text-xs sm:text-sm">
            AR REALITY • HOUSE VIEW
          </span>
          <span className="rounded bg-[#00f0ff]/20 px-2 py-0.5 text-[10px] font-mono text-[#00f0ff] border border-[#00f0ff]/40">
            {modelConfig.name}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {onOpenQR && (
            <button
              onClick={onOpenQR}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-[#00f0ff] border border-[#00f0ff]/30 text-xs font-mono transition shadow"
              title="Open QR Code to view on Phone"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Phone QR</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-full bg-black/60 hover:bg-black/90 p-2 text-white border border-slate-700 transition"
            title="Exit AR Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Snapshot Confirmation Toast */}
      {snapshotTaken && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-xl bg-[#0d121c]/95 px-4 py-2.5 border border-[#00f0ff]/50 shadow-[0_0_30px_rgba(0,240,255,0.4)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-bold text-white">AR Photo Saved to Downloads</span>
        </div>
      )}

      {/* 4. Streamlined AR Bottom Controls (Minimalist & Functional) */}
      <div className="mt-auto relative z-30 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex flex-col gap-3">
        {/* Interactive Door/Window Click Hint & Dimension Pill */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="px-3 py-1 rounded-full bg-black/70 border border-slate-700/80 text-[11px] font-mono text-slate-300 backdrop-blur-md flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" />
            <span>Tap doors or windows to open / close</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-black/75 border border-[#00f0ff]/40 text-[11px] font-mono text-[#00f0ff] backdrop-blur-md">
            {scaleMode === 'miniature'
              ? 'TABLETOP MINIATURE (1:25 ARCHITECTURAL MAQUETTE)'
              : `1:1 REAL SCALE (${modelConfig.lengthFt}' L × ${modelConfig.widthFt || 8}' W × 9.5' H IN FEET)`}
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
          {/* Rotate Slider & Quick Rotate Button */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-xl p-1.5 border border-slate-800">
            <button
              onClick={() => setRotationY((r) => r + Math.PI / 4)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white transition"
              title="Rotate 45°"
            >
              <RotateCw className="w-4 h-4 text-[#00f0ff]" />
            </button>
            <input
              type="range"
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              value={rotationY}
              onChange={(e) => setRotationY(parseFloat(e.target.value))}
              className="w-16 sm:w-24 accent-[#00f0ff] cursor-pointer"
              title="Rotate House"
            />
          </div>

          {/* Toggle All Doors Open/Closed */}
          <button
            onClick={handleToggleAllDoors}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition border backdrop-blur-md ${
              doorsAllOpen
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/50'
                : 'bg-black/60 text-slate-300 border-slate-700 hover:bg-black/80'
            }`}
            title="Toggle All Doors Open / Closed"
          >
            {doorsAllOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
            <span className="hidden sm:inline">{doorsAllOpen ? 'Doors: Open' : 'Doors: Closed'}</span>
          </button>

          {/* 1:1 Scale in Feet */}
          <button
            onClick={() => {
              setScaleMode('real');
              setScaleFactor(1.0);
              setPositionY(-1.5);
              setPositionZ(-16);
              setPositionX(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition border backdrop-blur-md ${
              scaleMode === 'real'
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/60 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-black/60 text-slate-300 border-slate-700 hover:bg-black/80'
            }`}
            title="View house in 1:1 scale (identical dimensions in feet)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>1:1 Scale ({modelConfig.lengthFt}ft)</span>
          </button>

          {/* Miniature Model on Desk */}
          <button
            onClick={() => {
              setScaleMode('miniature');
              setScaleFactor(0.04);
              setPositionY(-0.5);
              setPositionZ(-3.2);
              setPositionX(0);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition border backdrop-blur-md ${
              scaleMode === 'miniature'
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : 'bg-black/60 text-slate-300 border-slate-700 hover:bg-black/80'
            }`}
            title="View house as a miniature tabletop architectural model"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Miniature Model</span>
          </button>

          {/* Snapshot Photo Button */}
          <button
            onClick={handleTakeSnapshot}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00f0ff] hover:bg-[#00d8e6] text-black font-heading font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] transition active:scale-95"
            title="Take Photo"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
