import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ArrowDownToLine, RotateCcw } from "lucide-react";
import { CameraFocus, CameraRequest, dimensions, StudioConfig } from "./config";
import { disposeTree, StudioAssets } from "./assets";
import { physicalPlane } from "./geometry";
import { buildContainer } from "./model";
import { StudioCamera } from "./camera";
export interface ViewerHandle {
  snapshot: () => void;
}
interface Props {
  config: StudioConfig;
  request: CameraRequest;
  onFocus: (focus: CameraFocus) => void;
}
export default forwardRef<ViewerHandle, Props>(function Viewport(
  { config, request, onFocus },
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
    epoch = useRef(0);
  const [notice, setNotice] = useState("Preparing materials…");
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
    system.go("exterior", config, true);
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
    const assets = new StudioAssets(invalidate, setNotice);
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
    assets
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
        setNotice("");
        invalidate();
      })
      .catch(() => {
        if (!disposed) {
          setNotice("Environment unavailable. Daylight lighting is active.");
          invalidate();
        }
      });
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
    if (prev?.ac && !config.ac) setNotice("");
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
    const model = buildContainer(config, assets);
    modelRef.current = model;
    scene.add(model);
    renderer.shadowMap.needsUpdate = true;
    invalidateRef.current();
    const currentEpoch = ++epoch.current;
    if (config.ac) {
      setNotice("Loading climate equipment…");
      Promise.all(
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
        .then(() => {
          if (currentEpoch === epoch.current) {
            setNotice("");
            renderer.shadowMap.needsUpdate = true;
            invalidateRef.current();
          }
        })
        .catch(() => {
          if (currentEpoch === epoch.current)
            setNotice("Climate model could not load. Refresh to retry.");
        });
    }
  }, [config]);
  useEffect(() => {
    systemRef.current?.go(request.focus, config);
    invalidateRef.current();
  }, [request.sequence]);
  const dim = dimensions(config);
  return (
    <main
      className="studio-viewer"
      aria-label="Interactive 3D container preview"
    >
      <div ref={mount} className="studio-canvas" />
      <div className="studio-viewer-label">
        <span>YOUR CONTAINER / LIVE PREVIEW</span>
        <strong>
          {config.size}′ {config.highCube ? "High cube" : "Standard"}
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
      {notice && (
        <div className="studio-loading" role="status">
          {notice}
        </div>
      )}
      <div className="studio-camera-bar" aria-label="Camera views">
        {(
          ["exterior", "front", "left", "right", "interior"] as CameraFocus[]
        ).map((view) => (
          <button
            type="button"
            key={view}
            aria-pressed={request.focus === view}
            className={request.focus === view ? "selected" : ""}
            onClick={() => onFocus(view)}
          >
            {view[0].toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
      <span className="studio-viewer-hint">Drag to orbit · Scroll to zoom</span>
    </main>
  );
});
