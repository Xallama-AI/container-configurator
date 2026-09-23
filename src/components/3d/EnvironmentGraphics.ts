import * as THREE from 'three';

/**
 * Procedural Sky Dome with dynamic daytime, golden hour, and starry night transitions.
 */
export function createDynamicSkyDome(timeOfDayHours: number = 14): THREE.Mesh {
  const skyGeo = new THREE.SphereGeometry(400, 32, 24);
  
  // Custom vertex/fragment shaders for atmospheric gradient
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform vec3 sunColor;
    uniform vec3 sunPosition;
    uniform float sunIntensity;
    uniform float nightMix;
    varying vec3 vWorldPosition;

    void main() {
      vec3 dir = normalize(vWorldPosition);
      float h = max(dir.y, 0.0);
      
      // Sky atmospheric vertical gradient
      vec3 sky = mix(bottomColor, topColor, pow(h, 0.6));
      
      // Sun disk & solar corona glow
      vec3 sunDir = normalize(sunPosition);
      float sunDot = max(dot(dir, sunDir), 0.0);
      float sunDisc = smoothstep(0.9985, 0.9995, sunDot);
      float sunCorona = pow(sunDot, 64.0) * 0.45 + pow(sunDot, 8.0) * 0.18;
      
      sky += (sunColor * sunDisc * 2.5 + sunColor * sunCorona) * sunIntensity;

      // Subtle procedural stars at night
      if (nightMix > 0.05 && dir.y > 0.1) {
        float n = fract(sin(dot(dir.xz * 120.0, vec2(12.9898, 78.233))) * 43758.5453);
        if (n > 0.985) {
          float starBright = (n - 0.985) / 0.015;
          sky += vec3(0.9, 0.95, 1.0) * starBright * nightMix * 0.9;
        }
      }

      gl_FragColor = vec4(sky, 1.0);
    }
  `;

  // Determine colors based on timeOfDay (6am to 19pm, etc.)
  const { topColor, bottomColor, sunColor, sunIntensity, nightMix } = getSkyColorsForHour(timeOfDayHours);

  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: topColor },
      bottomColor: { value: bottomColor },
      sunColor: { value: sunColor },
      sunPosition: { value: new THREE.Vector3(50, 40, 50) },
      sunIntensity: { value: sunIntensity },
      nightMix: { value: nightMix },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.name = 'dynamic-sky-dome';
  return skyMesh;
}

/**
 * Update sky uniforms when time of day changes.
 */
export function updateSkyDome(skyMesh: THREE.Mesh | null, timeOfDayHours: number, sunPos: THREE.Vector3) {
  if (!skyMesh) return;
  const mat = skyMesh.material as THREE.ShaderMaterial;
  if (!mat || !mat.uniforms) return;

  const { topColor, bottomColor, sunColor, sunIntensity, nightMix } = getSkyColorsForHour(timeOfDayHours);
  mat.uniforms.topColor.value.copy(topColor);
  mat.uniforms.bottomColor.value.copy(bottomColor);
  mat.uniforms.sunColor.value.copy(sunColor);
  mat.uniforms.sunPosition.value.copy(sunPos);
  mat.uniforms.sunIntensity.value = sunIntensity;
  mat.uniforms.nightMix.value = nightMix;
}

function getSkyColorsForHour(hour: number) {
  if (hour >= 9 && hour <= 16) {
    // Clear crisp architectural midday sky
    return {
      topColor: new THREE.Color(0x1960c4), // Rich cerulean blue
      bottomColor: new THREE.Color(0xdbeafe), // Pale atmospheric blue-white
      sunColor: new THREE.Color(0xfffbef), // Bright sun
      sunIntensity: 1.0,
      nightMix: 0.0,
    };
  } else if ((hour >= 6 && hour < 9) || (hour > 16 && hour <= 18.5)) {
    // Golden Hour (Sunrise / Sunset)
    return {
      topColor: new THREE.Color(0x273b7a), // Indigo zenith
      bottomColor: new THREE.Color(0xf59e0b), // Vibrant amber/golden horizon
      sunColor: new THREE.Color(0xff7733), // Warm golden-orange
      sunIntensity: 1.25,
      nightMix: 0.1,
    };
  } else if (hour > 18.5 && hour <= 20) {
    // Dusk / Twilight
    return {
      topColor: new THREE.Color(0x0f172a),
      bottomColor: new THREE.Color(0xc026d3), // Magenta/purple glow
      sunColor: new THREE.Color(0xf43f5e),
      sunIntensity: 0.5,
      nightMix: 0.6,
    };
  } else {
    // Midnight / Night Sky
    return {
      topColor: new THREE.Color(0x030712), // Deep black-blue
      bottomColor: new THREE.Color(0x0f172a), // Dark horizon
      sunColor: new THREE.Color(0x94a3b8), // Soft moon glow
      sunIntensity: 0.2,
      nightMix: 1.0,
    };
  }
}

/**
 * Generate a procedural HDRI environment map for photorealistic PBR reflections
 * on steel corrugations, glass windows, polished concrete, and architectural metals.
 */
export function generateHDRIRadianceEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // Create an offscreen cubemap scene to bake radiance
  const envScene = new THREE.Scene();
  
  // Sky hemisphere gradient
  const sphereGeo = new THREE.SphereGeometry(100, 24, 24);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Multi-tier atmospheric gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#0c4a6e'); // Deep zenith blue
  grad.addColorStop(0.3, '#0284c7'); // Clear blue sky
  grad.addColorStop(0.48, '#bae6fd'); // Atmospheric haze horizon
  grad.addColorStop(0.50, '#fef3c7'); // Golden horizon sun reflection line
  grad.addColorStop(0.54, '#475569'); // Distant landscape line
  grad.addColorStop(0.70, '#1e293b'); // Earth tone ground bounce
  grad.addColorStop(1.0, '#0f172a'); // Ground nadir
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // 2. Diffuse atmospheric cloud wisps
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let c = 0; c < 12; c++) {
    const cx = (c * 90 + 30) % 1024;
    const cy = 120 + Math.sin(c) * 45;
    const cw = 120 + Math.cos(c) * 40;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Ultra-bright Solar Radiance Disc (produces crisp specular highlights on metal and glass)
  const sunX = 512;
  const sunY = 220;

  // Outer solar corona
  const coronaGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
  coronaGrad.addColorStop(0, 'rgba(255, 250, 230, 0.95)');
  coronaGrad.addColorStop(0.3, 'rgba(255, 240, 190, 0.45)');
  coronaGrad.addColorStop(0.7, 'rgba(255, 220, 150, 0.12)');
  coronaGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
  ctx.fill();

  // Pure white high-intensity solar core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
  ctx.fill();

  // Secondary architectural fill studio softbox (opposing side for balanced specular reflections)
  const fillGrad = ctx.createRadialGradient(180, 200, 20, 180, 200, 160);
  fillGrad.addColorStop(0, 'rgba(224, 242, 254, 0.4)');
  fillGrad.addColorStop(1, 'rgba(224, 242, 254, 0)');
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  ctx.arc(180, 200, 160, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const sphereMat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });
  const envSphere = new THREE.Mesh(sphereGeo, sphereMat);
  envScene.add(envSphere);

  const renderTarget = pmremGenerator.fromScene(envScene, 0.04);
  pmremGenerator.dispose();
  sphereGeo.dispose();
  sphereMat.dispose();

  return renderTarget.texture;
}

/**
 * Scale human silhouette representation (clean architectural model scale).
 */
export function createMinecraftVoxelAvatar(): THREE.Group {
  const avatar = new THREE.Group();
  avatar.name = 'architectural-scale-figure';
  avatar.visible = false;
  return avatar;
}
