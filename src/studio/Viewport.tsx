import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ArrowDownToLine, Box, LayoutGrid, Move, RotateCcw, RotateCw, Trash2, X } from "lucide-react";
import { CameraFocus, CameraRequest, dimensions, StudioConfig } from "./config";
import { catalogItem, entryClearance, LayoutItem, nearestFreePlacement } from "./layout";
import { disposeTree, StudioAssets } from "./assets";
import { physicalPlane } from "./geometry";
import { buildContainer } from "./model";
import { StudioCamera } from "./camera";
import { upgradeInteriorAssets } from "./interior";
export interface ViewerHandle {
  snapshot: () => void;
}
interface Props {
  config: StudioConfig;
  request: CameraRequest;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayoutChange: (layout: LayoutItem[]) => void;
  onFocus: (focus: CameraFocus) => void;
  onOpenPlan: () => void;
  onToggleDoor: (door: "cargo" | "side" | "rear") => void;
}
export default forwardRef<ViewerHandle, Props>(function Viewport(
  { config, request, selectedId, onSelect, onLayoutChange, onFocus, onOpenPlan, onToggleDoor },
  ref,
) {
  const mount = useRef<HTMLDivElement>(null),
    sceneRef = useRef<THREE.Scene | null>(null),
    rendererRef = useRef<THREE.WebGLRenderer | null>(null),
    cameraRef = useRef<THREE.PerspectiveCamera | null>(null),
    modelRef = useRef<THREE.Group | null>(null),
    systemRef = useRef<StudioCamera | null>(null),
    assetsRef = useRef<StudioAssets | null>(null),
    invalidateRef = useRef(() => {}),
    previousConfig = useRef<StudioConfig | null>(null),
    environmentReady = useRef<Promise<void>>(Promise.resolve()),
    configRef = useRef(config),
    selectedRef = useRef(selectedId),
    selectRef = useRef(onSelect),
    layoutChangeRef = useRef(onLayoutChange),
    toggleDoorRef = useRef(onToggleDoor),
    sceneReadyRef = useRef(false),
    selectionHelperRef = useRef<THREE.BoxHelper | null>(null),
    refreshSelectionRef = useRef(() => {}),
    epoch = useRef(0);
  const [sceneStatus, setSceneStatus] = useState({ ready: false, message: "Preparing 3D scene…", error: false });
  const [editNotice, setEditNotice] = useState("Select a furniture piece, then drag it to move.");
  configRef.current = config;
  selectedRef.current = selectedId;
  selectRef.current = onSelect;
  layoutChangeRef.current = onLayoutChange;
  toggleDoorRef.current = onToggleDoor;
  useImperativeHandle(
    ref,
    () => ({
      snapshot: () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
          return;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        const link = document.createElement("a");
        link.download = "container-studio.png";
        link.href = rendererRef.current.domElement.toDataURL("image/png");
        link.click();
      },
    }),
    [],
  );
  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let frameCount = 0;
    let raf = 0,
      disposed = false,
      environment: THREE.Texture | null = null;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e7eae8");
    scene.fog = new THREE.Fog("#e7eae8", 24, 65);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.25 : 1.5),
    );
    renderer.setSize(element.clientWidth, element.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    element.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(
      40,
      element.clientWidth / element.clientHeight,
      0.08,
      150,
    );
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.3, 0);
    const system = new StudioCamera(camera, controls, config);
    system.go(request.focus, config, true);
    const invalidate = () => {
      if (!disposed && !raf) raf = requestAnimationFrame(render);
    };
    function render(now: number) {
      raf = 0;
      if (disposed || document.visibilityState === "hidden") return;
      const moving = system.update(now);
      const damping = moving ? false : controls.update();
      system.clamp();
      renderer.render(scene, camera);
      if (import.meta.env.DEV) {
        element.dataset.renderCount = String(++frameCount);
        element.dataset.drawCalls = String(renderer.info.render.calls);
        element.dataset.triangles = String(renderer.info.render.triangles);
        element.dataset.geometries = String(renderer.info.memory.geometries);
        element.dataset.textures = String(renderer.info.memory.textures);
      }
      if (moving || damping) invalidate();
    }
    const assets = new StudioAssets(invalidate, (message) => {
      sceneReadyRef.current = false;
      setSceneStatus({ ready: false, message, error: true });
    });
    assetsRef.current = assets;
    scene.add(new THREE.HemisphereLight("#ecf3f2", "#77775e", 0.9));
    const sunlight = new THREE.DirectionalLight("#fff7e7", 2.1);
    sunlight.position.set(-5, 10, 6);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(
      window.innerWidth < 760 ? 512 : 1024,
      window.innerWidth < 760 ? 512 : 1024,
    );
    sunlight.shadow.camera.left = -14;
    sunlight.shadow.camera.right = 14;
    sunlight.shadow.camera.top = 12;
    sunlight.shadow.camera.bottom = -12;
    sunlight.shadow.camera.near = 0.1;
    sunlight.shadow.camera.far = 35;
    sunlight.shadow.bias = -0.00015;
    sunlight.shadow.normalBias = 0.02;
    scene.add(sunlight);
    const ground = new THREE.Mesh(
      physicalPlane(100, 100, 2),
      assets.pbr("grass", "#a3bfa1"),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.006;
    scene.add(ground);
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    systemRef.current = system;
    invalidateRef.current = invalidate;
    environmentReady.current = assets
      .environment(renderer)
      .then((texture) => {
        if (disposed) {
          texture?.dispose();
          return;
        }
        environment = texture;
        scene.environment = texture;
        scene.environmentIntensity = 0.45;
        renderer.shadowMap.needsUpdate = true;
        invalidate();
      })
      .catch(() => {
        if (!disposed) invalidate();
      });
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const floorPoint = new THREE.Vector3();
    let drag: { id: string; pointerId: number; offsetX: number; offsetZ: number; x: number; z: number } | null = null;
    const setRay = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
    };
    const floorIntersection = (event: PointerEvent) => {
      setRay(event);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -dimensions(configRef.current).floor);
      return raycaster.ray.intersectPlane(plane, floorPoint);
    };
    const activeGroup = (id: string) => {
      const interior = modelRef.current?.getObjectByName("Interior layout") as THREE.Group | undefined;
      return interior?.children.find((child) => child.visible && child.userData.layoutItemId === id);
    };
    const clearSelectionBox = () => {
      const helper = selectionHelperRef.current;
      if (!helper) return;
      scene.remove(helper);
      helper.geometry.dispose();
      (helper.material as THREE.Material).dispose();
      selectionHelperRef.current = null;
    };
    const refreshSelectionBox = () => {
      clearSelectionBox();
      const group = selectedRef.current && activeGroup(selectedRef.current);
      if (!group) return;
      const helper = new THREE.BoxHelper(group, 0x111916);
      helper.material.depthTest = false;
      helper.renderOrder = 100;
      scene.add(helper);
      selectionHelperRef.current = helper;
      invalidate();
    };
    refreshSelectionRef.current = refreshSelectionBox;
    const hitItem = (event: PointerEvent) => {
      const interior = modelRef.current?.getObjectByName("Interior layout") as THREE.Group | undefined;
      if (!interior) return null;
      setRay(event);
      const hits = raycaster.intersectObjects(interior.children.filter((child) => child.visible), true);
      for (const hit of hits) {
        let node: THREE.Object3D | null = hit.object;
        while (node && node !== interior) {
          if (node.userData.layoutItemId) return String(node.userData.layoutItemId);
          node = node.parent;
        }
      }
      return null;
    };
    const hitDoor = (event: PointerEvent): "cargo" | "side" | "rear" | null => {
      const model = modelRef.current;
      if (!model) return null;
      setRay(event);
      const hits = raycaster.intersectObject(model, true);
      for (const hit of hits) {
        let node: THREE.Object3D | null = hit.object;
        while (node && node !== model) {
          if (node.userData.doorAction) return node.userData.doorAction as "cargo" | "side" | "rear";
          node = node.parent;
        }
        // An opaque shell surface in front of a door should block the click.
        if ((hit.object as THREE.Mesh).material) break;
      }
      return null;
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !sceneReadyRef.current) return;
      const id = hitItem(event);
      if (!id) {
        const door = hitDoor(event);
        if (door) {
          toggleDoorRef.current(door);
          setEditNotice(`${door === "cargo" ? "Cargo doors" : door === "rear" ? "Rear shutter" : "Side door"} toggled.`);
          event.preventDefault();
          return;
        }
      }
      selectedRef.current = id;
      selectRef.current(id);
      refreshSelectionBox();
      if (!id) return;
      const item = configRef.current.layout.find((entry) => entry.id === id);
      const point = floorIntersection(event);
      if (!item || !point) return;
      drag = { id, pointerId: event.pointerId, offsetX: item.x - point.x, offsetZ: item.z - point.z, x: item.x, z: item.z };
      controls.enabled = false;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      canvas.focus();
      event.preventDefault();
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) {
        canvas.style.cursor = sceneReadyRef.current && hitItem(event) ? "grab" : sceneReadyRef.current && hitDoor(event) ? "pointer" : "auto";
        return;
      }
      const point = floorIntersection(event);
      if (!point) return;
      const group = activeGroup(drag.id);
      if (!group) return;
      drag.x = point.x + drag.offsetX;
      drag.z = point.z + drag.offsetZ;
      group.position.set(drag.x, 0.08, drag.z);
      selectionHelperRef.current?.update();
      invalidate();
    };
    const endDrag = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      controls.enabled = true;
      canvas.style.cursor = "auto";
      const placed = drag;
      drag = null;
      const current = configRef.current.layout;
      const item = current.find((entry) => entry.id === placed.id);
      if (!item) return;
      const configNow = configRef.current;
      const bounds = dimensions(configNow);
      const next = event.type === "pointercancel" ? null : nearestFreePlacement({ ...item, x: placed.x, z: placed.z, onTopOf: undefined }, current, bounds.length, entryClearance(configNow.doorStyle, configNow.doorSide, bounds.length, bounds.width), bounds.width);
      if (!next) {
        activeGroup(item.id)?.position.set(item.x, 0, item.z);
        selectionHelperRef.current?.update();
        invalidate();
        if (event.type !== "pointercancel") setEditNotice("No clear floor space is available. The item stayed where it was.");
        return;
      }
      if (item.x === next.x && item.z === next.z && !item.onTopOf) {
        activeGroup(item.id)?.position.set(item.x, 0, item.z);
        selectionHelperRef.current?.update();
        invalidate();
        if (Math.abs(placed.x - item.x) > 0.05 || Math.abs(placed.z - item.z) > 0.05) setEditNotice(`${catalogItem(item.kind).label} returned to the nearest clear floor space.`);
        return;
      }
      layoutChangeRef.current(current.map((entry) => entry.id === placed.id ? next : entry));
      const corrected = Math.abs(next.x - placed.x) > 0.051 || Math.abs(next.z - placed.z) > 0.051;
      setEditNotice(`${catalogItem(item.kind).label} ${corrected ? "settled in the nearest clear space" : "placed"} at ${next.x.toFixed(1)} × ${next.z.toFixed(1)} m.`);
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    const observer = new ResizeObserver(() => {
      if (disposed) return;
      const w = element.clientWidth,
        h = element.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.25 : 1.5),
      );
      renderer.setSize(w, h);
      system.resize();
      invalidate();
    });
    observer.observe(element);
    const start = () => system.cancel();
    controls.addEventListener("start", start);
    controls.addEventListener("change", invalidate);
    const visibility = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    document.addEventListener("visibilitychange", visibility);
    renderer.shadowMap.needsUpdate = true;
    invalidate();
    return () => {
      disposed = true;
      epoch.current++;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      clearSelectionBox();
      refreshSelectionRef.current = () => {};
      document.removeEventListener("visibilitychange", visibility);
      controls.removeEventListener("change", invalidate);
      controls.removeEventListener("start", start);
      controls.dispose();
      environment?.dispose();
      disposeTree(scene);
      assets.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      modelRef.current = null;
      rendererRef.current = null;
      assetsRef.current = null;
      systemRef.current = null;
      previousConfig.current = null;
      invalidateRef.current = () => {};
    };
  }, []);
  useEffect(() => {
    const scene = sceneRef.current,
      assets = assetsRef.current,
      renderer = rendererRef.current;
    if (!scene || !assets || !renderer) return;
    const prev = previousConfig.current;
    previousConfig.current = config;
    if (
      prev &&
      modelRef.current &&
      Object.keys(config).every(
        (key) =>
          key === "color" ||
          config[key as keyof StudioConfig] === prev[key as keyof StudioConfig],
      )
    ) {
      (modelRef.current.userData.paint as THREE.MeshStandardMaterial).color.set(
        config.color,
      );
      invalidateRef.current();
      return;
    }
    if (modelRef.current) {
      scene.remove(modelRef.current);
      disposeTree(modelRef.current);
    }
    sceneReadyRef.current = false;
    setSceneStatus({ ready: false, message: "Loading models and materials…", error: false });
    const model = buildContainer(config, assets);
    modelRef.current = model;
    scene.add(model);
    renderer.shadowMap.needsUpdate = true;
    invalidateRef.current();
    const currentEpoch = ++epoch.current;
    const interior = model.getObjectByName("Interior layout") as THREE.Group | undefined;
    const furnitureReady = interior && config.layout.length
      ? upgradeInteriorAssets(
        interior,
        config.layout,
        dimensions(config).floor,
        assets,
        () => currentEpoch === epoch.current,
        () => {
          renderer.shadowMap.needsUpdate = true;
          refreshSelectionRef.current();
          invalidateRef.current();
        },
      )
      : Promise.resolve();
    const equipmentReady = config.ac
      ? Promise.all(
        (["indoor", "outdoor"] as const).map(async (kind) => {
          const asset = await assets.ac(kind);
          if (currentEpoch !== epoch.current) return;
          const bounds = new THREE.Box3().setFromObject(asset),
            size = bounds.getSize(new THREE.Vector3()),
            center = bounds.getCenter(new THREE.Vector3());
          asset.position.sub(
            new THREE.Vector3(
              center.x,
              kind === "outdoor" ? 0.06 : center.y,
              center.z,
            ),
          );
          const wrapper = new THREE.Group();
          wrapper.add(asset);
          wrapper.scale.setScalar((kind === "indoor" ? 0.82 : 0.86) / size.x);
          model.getObjectByName(`${kind}-ac-slot`)?.add(wrapper);
        }),
      )
      : Promise.resolve();
    void Promise.all([furnitureReady, assets.whenTexturesReady(), environmentReady.current, equipmentReady])
      .then(() => {
        if (currentEpoch !== epoch.current) return;
        renderer.shadowMap.needsUpdate = true;
        invalidateRef.current();
        refreshSelectionRef.current();
        sceneReadyRef.current = true;
        setSceneStatus({ ready: true, message: "", error: false });
      })
      .catch((error) => {
        if (currentEpoch !== epoch.current) return;
        sceneReadyRef.current = false;
        setSceneStatus({ ready: false, message: error instanceof Error ? error.message : "The 3D scene could not load.", error: true });
      });
  }, [config]);
  useEffect(() => {
    systemRef.current?.go(request.focus, config);
    invalidateRef.current();
  }, [request.sequence]);
  useEffect(() => { refreshSelectionRef.current(); }, [selectedId, config.layout]);
  const dim = dimensions(config);
  const selectedItem = config.layout.find((item) => item.id === selectedId);
  const rotateSelected = (direction: -90 | 90) => {
    if (!selectedItem || selectedItem.kind === "bathroom") return;
    const rotation = ((selectedItem.rotation + direction + 360) % 360) as LayoutItem["rotation"];
    const next = nearestFreePlacement({ ...selectedItem, rotation, onTopOf: undefined }, config.layout, dim.length, entryClearance(config.doorStyle, config.doorSide, dim.length, dim.width), dim.width);
    if (!next) {
      setEditNotice("Move this item into clear space before rotating it.");
      return;
    }
    onLayoutChange(config.layout.map((item) => item.id === selectedItem.id ? next : item));
    setEditNotice(`${catalogItem(selectedItem.kind).label} rotated to ${rotation}°.`);
  };
  const removeSelected = () => {
    if (!selectedItem) return;
    onLayoutChange(config.layout.filter((item) => item.id !== selectedItem.id));
    onSelect(null);
    setEditNotice(`${catalogItem(selectedItem.kind).label} removed.`);
  };
  return (
    <main
      className="studio-viewer"
      aria-label="Interactive 3D container preview"
    >
      <div ref={mount} className="studio-canvas" />
      <div className="studio-viewer-label">
        <span>YOUR CONTAINER / LIVE PREVIEW</span>
        <strong>
          {config.containers === 2 ? "2 × " : ""}{config.size}′ {config.highCube ? "High cube" : "Standard"}
        </strong>
        <small>
          {dim.length.toFixed(2)} × {dim.width.toFixed(2)} ×{" "}
          {dim.height.toFixed(2)} m
        </small>
      </div>
      <div className="studio-viewer-actions">
        <button
          type="button"
          aria-label="Reset camera"
          onClick={() => onFocus("exterior")}
        >
          <RotateCcw size={17} />
        </button>
        <button
          type="button"
          aria-label="Download preview image"
          onClick={() =>
            ref && typeof ref !== "function" && ref.current?.snapshot()
          }
        >
          <ArrowDownToLine size={17} />
        </button>
      </div>
      <div className="studio-canvas-dock">
        {selectedItem && <div className="studio-edit-bar" aria-label="Selected furniture controls">
          <div className="studio-edit-detail"><strong>{catalogItem(selectedItem.kind).label}</strong><span><Move size={13}/> Drag freely · {selectedItem.rotation}°</span></div>
          <div className="studio-edit-actions">
            <button type="button" onClick={() => rotateSelected(-90)} disabled={selectedItem.kind === "bathroom"} aria-label="Rotate selected item left 90 degrees" title="Rotate left"><RotateCcw size={17}/></button>
            <button type="button" onClick={() => rotateSelected(90)} disabled={selectedItem.kind === "bathroom"} aria-label="Rotate selected item right 90 degrees" title="Rotate right"><RotateCw size={17}/></button>
            <button type="button" className="studio-edit-delete" onClick={removeSelected} aria-label="Delete selected item" title="Delete item"><Trash2 size={17}/></button>
            <button type="button" onClick={() => onSelect(null)} aria-label="Deselect item" title="Deselect"><X size={17}/></button>
          </div>
        </div>}
        <div className="studio-dock-main">
          <button type="button" className="studio-dock-plan" onClick={onOpenPlan}><LayoutGrid size={17}/> Floor plan</button>
          <div className="studio-dock-divider"/>
          <div className="studio-view-tabs" aria-label="Camera views">
            {(["layout", "exterior", "front", "left", "right", "interior"] as CameraFocus[]).map((view) => <button type="button" key={view} aria-pressed={request.focus === view} onClick={() => onFocus(view)}>{view === "layout" ? "Layout 3D" : view[0].toUpperCase() + view.slice(1)}</button>)}
          </div>
        </div>
        <span className="studio-dock-hint" role="status">{selectedItem ? editNotice : "Drag furniture over other pieces; release to find clear space"}</span>
      </div>
      {!sceneStatus.ready && <div className="studio-scene-gate" role="status" aria-live="polite"><div className="studio-scene-gate-card"><span>CONTAINER STUDIO / LIVE PREVIEW</span><strong>{sceneStatus.error ? "Preview could not load" : "Preparing your 3D view"}</strong><p>{sceneStatus.message}</p>{!sceneStatus.error ? <div className="studio-scene-gate-track"><i/></div> : <button type="button" onClick={() => window.location.reload()}>Retry loading</button>}</div></div>}
    </main>
  );
});
