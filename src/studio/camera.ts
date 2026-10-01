import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CameraFocus, dimensions, StudioConfig, WINDOWS } from "./config";
import { windowPosition } from "./layout";
interface Pose {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  interior: boolean;
}
interface Move {
  poses: Pose[];
  from: Pose;
  started: number;
  config: StudioConfig;
}
export const isInteriorFocus = (focus: CameraFocus) =>
  ["interior", "floor", "walls", "indoor-ac"].includes(focus);
export class StudioCamera {
  private move: Move | null = null;
  private inside = false;
  private focus: CameraFocus = "exterior";
  private config: StudioConfig;
  constructor(
    private camera: THREE.PerspectiveCamera,
    private controls: OrbitControls,
    config: StudioConfig,
  ) {
    this.config = config;
  }
  pose(focus: CameraFocus, config: StudioConfig): Pose {
    const {
        length: L,
        width: W,
        height: H,
        base: B,
        floor: F,
      } = dimensions(config),
      V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const fit = Math.max(1, 1 / this.camera.aspect),
      distance = Math.max(10.8, L * 1.5) * fit;
    const openingPose = (kind: "window" | "door", sign: number): Pose => {
      const window = WINDOWS.find(
        (option) => option.id === config.windowStyle,
      )!;
      const h = Math.min(window.h, H - 0.42);
      const y =
        kind === "door"
          ? F + 1.07
          : h > 1.8
            ? F + h / 2 + 0.035
            : Math.min(B + H - 0.3 - h / 2, F + 1.05 + h / 2);
      const x = kind === "window" ? windowPosition(L, config.layout) : L * 0.27;
      const distance =
        kind === "window"
          ? Math.max(3, Math.min(window.w, L * 0.32) * 1.6)
          : 4.8;
      return {
        position: V(x + 0.45, y + 0.28, sign * (W / 2 + distance * fit)),
        target: V(x, y, (sign * W) / 2),
        fov: 44,
        interior: false,
      };
    };
    const poses: Record<CameraFocus, Pose> = {
      "window-left": openingPose("window", 1),
      "window-right": openingPose("window", -1),
      "door-left": openingPose("door", 1),
      "door-right": openingPose("door", -1),
      exterior: {
        position: V(distance * 0.66, H * 0.7 + distance * 0.3, distance * 0.75),
        target: V(0, H * 0.43, 0),
        fov: 40,
        interior: false,
      },
      layout: {
        position: V(0, H + Math.max(9, L * 1.55) * fit, Math.max(1.2, L * 0.1) * fit),
        target: V(0, F, 0),
        fov: 42,
        interior: false,
      },
      front: {
        position: V(L / 2 + 5, 2.3, 0.25),
        target: V(L / 2, H / 2, 0),
        fov: 44,
        interior: false,
      },
      left: {
        position: V(0, H * 0.7, Math.max(7, L * 0.95) * fit),
        target: V(0, H / 2, W / 2),
        fov: 44,
        interior: false,
      },
      right: {
        position: V(0, H * 0.7, -Math.max(7, L * 0.95) * fit),
        target: V(0, H / 2, -W / 2),
        fov: 44,
        interior: false,
      },
      rear: {
        position: V(-L / 2 - 5, 2.4, 0.6),
        target: V(-L / 2, H / 2, 0),
        fov: 44,
        interior: false,
      },
      interior: {
        position: V(L / 2 - 0.55, 1.72, 0.15),
        target: V(-L / 2 + 0.8, 1.45, 0),
        fov: 68,
        interior: true,
      },
      floor: {
        position: V(L / 2 - 0.6, 1.75, 0.25),
        target: V(-L * 0.18, F + 0.03, 0),
        fov: 72,
        interior: true,
      },
      walls: {
        position: V(L / 2 - 0.65, 1.7, -0.4),
        target: V(-L * 0.25, 1.6, W / 2 - 0.07),
        fov: 68,
        interior: true,
      },
      "indoor-ac": {
        position: V(1.6, H - 0.7, 0.75),
        target: V(0, B + H - 0.42, -W / 2 + 0.2),
        fov: 60,
        interior: true,
      },
      "outdoor-ac": {
        position: V(-1.25, 1.65, -W / 2 - 3.1),
        target: V(0, 0.9, -W / 2 - 0.35),
        fov: 40,
        interior: false,
      },
    };
    return poses[focus];
  }
  go(focus: CameraFocus, config: StudioConfig, instant = false) {
    this.config = config;
    this.focus = focus;
    const target = this.pose(focus, config);
    if (instant) {
      this.move = null;
      this.apply(target);
      return;
    }
    const poses: Pose[] = [];
    if (target.interior !== this.inside) {
      const { length: L, width: W } = dimensions(config),
        entryX = L / 2 + 1.4;
      if (target.interior && this.camera.position.x < entryX) {
        const sideZ =
          (this.camera.position.z < 0 ? -1 : 1) *
          Math.max(Math.abs(this.camera.position.z), W / 2 + 1.2);
        if (Math.abs(this.camera.position.z) < W / 2 + 0.3)
          poses.push({
            position: new THREE.Vector3(this.camera.position.x, 1.72, sideZ),
            target: new THREE.Vector3(0, 1.5, 0),
            fov: 60,
            interior: false,
          });
        poses.push({
          position: new THREE.Vector3(entryX, 1.72, sideZ),
          target: new THREE.Vector3(0, 1.5, 0),
          fov: 60,
          interior: false,
        });
      }
      poses.push({
        position: new THREE.Vector3(entryX, 1.72, 0),
        target: new THREE.Vector3(0, 1.5, 0),
        fov: 60,
        interior: false,
      });
      if (!target.interior && target.position.x < entryX)
        poses.push({
          position: new THREE.Vector3(
            entryX,
            1.72,
            (target.position.z < 0 ? -1 : 1) *
              Math.max(Math.abs(target.position.z), W / 2 + 1.2),
          ),
          target: new THREE.Vector3(0, 1.5, 0),
          fov: 60,
          interior: false,
        });
    }
    poses.push(target);
    this.move = {
      poses,
      from: this.current(),
      started: performance.now(),
      config,
    };
    this.controls.enableDamping = false;
  }
  private current(): Pose {
    return {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      fov: this.camera.fov,
      interior: this.inside,
    };
  }
  private apply(pose: Pose) {
    this.camera.position.copy(pose.position);
    this.controls.target.copy(pose.target);
    this.camera.fov = pose.fov;
    this.camera.near = pose.interior ? 0.025 : 0.08;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(pose.target);
    this.inside = pose.interior;
    this.controls.enablePan = !pose.interior;
    this.controls.minDistance = pose.interior ? 0.25 : 1.8;
    this.controls.maxDistance = pose.interior
      ? dimensions(this.config).length + 2
      : 65;
    this.controls.maxPolarAngle = pose.interior
      ? Math.PI - 0.15
      : Math.PI / 2 - 0.025;
    this.controls.enableDamping = true;
  }
  update(now: number) {
    if (!this.move) return false;
    const move = this.move,
      to = move.poses[0];
    const t = Math.min(
        1,
        (now - move.started) / (move.poses.length > 1 ? 400 : 850),
      ),
      ease = t * t * (3 - 2 * t);
    this.camera.position.lerpVectors(move.from.position, to.position, ease);
    this.controls.target.lerpVectors(move.from.target, to.target, ease);
    this.camera.fov = THREE.MathUtils.lerp(move.from.fov, to.fov, ease);
    this.camera.near = 0.025;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.controls.target);
    if (t === 1) {
      move.poses.shift();
      if (move.poses.length) {
        move.from = this.current();
        move.started = now;
      } else {
        this.apply(to);
        this.move = null;
      }
    }
    return true;
  }
  resize() {
    this.go(this.focus, this.config, true);
  }
  cancel() {
    this.move = null;
    const { length: L, width: W, height: H, base: B } = dimensions(this.config),
      p = this.camera.position;
    this.inside = Math.abs(p.x) < L / 2 && Math.abs(p.z) < W / 2 && p.y < H + B;
    this.apply(this.current());
  }
  clamp() {
    if (this.move) return;
    const {
      length: L,
      width: W,
      height: H,
      base: B,
      floor: F,
    } = dimensions(this.config);
    const p = this.camera.position;
    if (!this.inside) {
      if (
        Math.abs(p.x) < L / 2 + 0.18 &&
        Math.abs(p.z) < W / 2 + 0.18 &&
        p.y < H + B + 0.18
      ) {
        const distances = [
          L / 2 + 0.18 - Math.abs(p.x),
          W / 2 + 0.18 - Math.abs(p.z),
          H + B + 0.18 - p.y,
        ];
        const nearest = distances.indexOf(Math.min(...distances));
        if (nearest === 0) p.x = (p.x < 0 ? -1 : 1) * (L / 2 + 0.18);
        else if (nearest === 1) p.z = (p.z < 0 ? -1 : 1) * (W / 2 + 0.18);
        else p.y = H + B + 0.18;
        this.camera.lookAt(this.controls.target);
      }
      return;
    }
    p.x = THREE.MathUtils.clamp(p.x, -L / 2 + 0.17, L / 2 - 0.17);
    p.z = THREE.MathUtils.clamp(p.z, -W / 2 + 0.17, W / 2 - 0.17);
    p.y = THREE.MathUtils.clamp(p.y, F + 0.25, H + B - 0.15);
    this.camera.lookAt(this.controls.target);
  }
}
