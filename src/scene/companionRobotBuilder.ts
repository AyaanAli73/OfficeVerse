import * as THREE from 'three';
import {
  HIP_PIVOT_Y,
  DEFAULT_REST_POSE,
  computeWorkTaskPose,
  type RobotConfig,
  type RobotColorTheme,
  type RobotExpression,
  type RobotActionMode,
  type RobotPoseState,
} from '../utils/robotTasks';

function smoothstepRobot(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function spowRobot(val: number, exp: number): number {
  return Math.sign(val) * Math.pow(Math.abs(val), exp);
}

function roundedRectSDFRobot(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  cornerRadius: number
): number {
  const qx = Math.abs(x) - (halfW - cornerRadius);
  const qy = Math.abs(y) - (halfH - cornerRadius);
  const outDist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inDist = Math.min(Math.max(qx, qy), 0);
  return (outDist + inDist - cornerRadius) / cornerRadius;
}

function getRoundedRectPerimeterPointRobot(
  angle: number,
  halfW: number,
  halfH: number,
  cornerR: number
): { x: number; y: number } {
  const r = Math.min(cornerR, Math.min(halfW, halfH) * 0.96);
  const iw = Math.max(0.001, halfW - r);
  const ih = Math.max(0.001, halfH - r);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const sx = spowRobot(cosA, 0.74) * halfW;
  const sy = spowRobot(sinA, 0.74) * halfH;
  const cx = Math.max(-iw, Math.min(iw, sx));
  const cy = Math.max(-ih, Math.min(ih, sy));
  let dx = sx - cx;
  let dy = sy - cy;
  const len = Math.hypot(dx, dy);
  if (len > 1e-5) {
    dx = (dx / len) * r;
    dy = (dy / len) * r;
  }
  return { x: cx + dx, y: cy + dy };
}

const VISOR_CENTER_Y = -0.15;
const VISOR_HALF_W = 2.58;
const VISOR_HALF_H = 1.98;
const VISOR_CORNER_R = 1.42;
const FOOT_ARCH_HALF_SPAN = 0.79;
const FOOT_SOLE_TOP_Y = 0.14;
const FOOT_ARCH_PEAK_Y = 0.54;

function evaluateHelmetUnrecessedPoint(nx: number, ny: number, nz: number) {
  const halfW = 3.38;
  const halfH = 2.66;
  const halfD = 2.6;
  const ex = nx * halfW;
  const ey = ny * halfH;
  const ez = nz * halfD;
  const sx = spowRobot(nx, 0.78) * halfW;
  const sy = spowRobot(ny, 0.8) * halfH;
  const sz = spowRobot(nz, 0.8) * halfD;

  let x = THREE.MathUtils.lerp(sx, ex * 1.03, 0.52);
  let y = THREE.MathUtils.lerp(sy, ey * 1.03, 0.52);
  let z = THREE.MathUtils.lerp(sz, ez * 1.02, 0.52);

  const yNorm = y / halfH;
  const horizR2 = (x / halfW) * (x / halfW) + (z / halfD) * (z / halfD);

  if (y > 0) {
    y += 0.17 * Math.max(0, 1.0 - horizR2 * 0.75) * smoothstepRobot(0.0, 0.95, yNorm);
    const topCornerSoft = 1.0 - 0.045 * Math.pow(Math.max(0, yNorm), 1.8);
    x *= topCornerSoft;
  } else {
    const chinSoft = 1.0 - 0.068 * Math.pow(Math.abs(yNorm), 1.75);
    x *= chinSoft;
    y *= 1.0 - 0.05 * Math.max(0, 1.0 - horizR2) * smoothstepRobot(-0.3, -1.0, yNorm);
  }
  return { x, y, z };
}

function evaluateHelmetFrontEnvelopeZ(x: number, y: number): number {
  const u = x / 3.36;
  const v = y / 2.66;
  const r2 = u * u + v * v;
  const zSphere = Math.sqrt(Math.max(0.08, 1.0 - 0.82 * u * u - 0.8 * v * v));
  const zSquircle = Math.pow(zSphere, 0.86);
  return 2.63 * THREE.MathUtils.lerp(zSquircle, zSphere, 0.5) - 0.04 * r2 * r2;
}

function evaluateVisorSurfaceZ(x: number, y: number): number {
  const envZ = evaluateHelmetFrontEnvelopeZ(x, y);
  const sdf = roundedRectSDFRobot(x, y - VISOR_CENTER_Y, VISOR_HALF_W, VISOR_HALF_H, VISOR_CORNER_R);
  const centerDome = (1.0 - smoothstepRobot(-0.85, 0.0, sdf)) * 0.052;
  return envZ - 0.064 + centerDome;
}

export interface RobotEnvironments {
  bodyEnvMap: THREE.Texture;
  visorEnvMap: THREE.Texture;
}

export function createRobotEnvironments(rendererInstance: THREE.WebGLRenderer): RobotEnvironments {
  const pmrem = new THREE.PMREMGenerator(rendererInstance);
  pmrem.compileEquirectangularShader();

  const bodyCanvas = document.createElement('canvas');
  bodyCanvas.width = 512;
  bodyCanvas.height = 256;
  const bCtx = bodyCanvas.getContext('2d')!;
  const bGrad = bCtx.createLinearGradient(0, 0, 0, 256);
  bGrad.addColorStop(0.0, '#FFFDFB');
  bGrad.addColorStop(0.38, '#F6EAE2');
  bGrad.addColorStop(0.68, '#D8C7BE');
  bGrad.addColorStop(1.0, '#B9A69E');
  bCtx.fillStyle = bGrad;
  bCtx.fillRect(0, 0, 512, 256);

  const bSoftbox = bCtx.createRadialGradient(290, 58, 12, 290, 58, 170);
  bSoftbox.addColorStop(0.0, 'rgba(255, 253, 250, 0.98)');
  bSoftbox.addColorStop(0.5, 'rgba(255, 244, 235, 0.45)');
  bSoftbox.addColorStop(1.0, 'rgba(240, 224, 214, 0.0)');
  bCtx.fillStyle = bSoftbox;
  bCtx.fillRect(0, 0, 512, 256);

  const bodyTex = new THREE.CanvasTexture(bodyCanvas);
  bodyTex.mapping = THREE.EquirectangularReflectionMapping;
  bodyTex.colorSpace = THREE.SRGBColorSpace;
  const bodyEnvMap = pmrem.fromEquirectangular(bodyTex).texture;
  bodyTex.dispose();

  const visorCanvas = document.createElement('canvas');
  visorCanvas.width = 1024;
  visorCanvas.height = 512;
  const vCtx = visorCanvas.getContext('2d')!;
  vCtx.fillStyle = '#020305';
  vCtx.fillRect(0, 0, 1024, 512);

  vCtx.save();
  vCtx.translate(1024 * 0.59, 512 * 0.24);
  vCtx.rotate(-0.28);
  const sbGrad = vCtx.createRadialGradient(0, 0, 4, 0, 0, 82);
  sbGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.62)');
  sbGrad.addColorStop(0.45, 'rgba(235, 238, 246, 0.30)');
  sbGrad.addColorStop(0.8, 'rgba(170, 175, 188, 0.06)');
  sbGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  vCtx.fillStyle = sbGrad;
  vCtx.scale(1.42, 0.54);
  vCtx.beginPath();
  vCtx.arc(0, 0, 82, 0, Math.PI * 2);
  vCtx.fill();
  vCtx.restore();

  const visorTex = new THREE.CanvasTexture(visorCanvas);
  visorTex.mapping = THREE.EquirectangularReflectionMapping;
  visorTex.colorSpace = THREE.SRGBColorSpace;
  const visorEnvMap = pmrem.fromEquirectangular(visorTex).texture;
  visorTex.dispose();

  pmrem.dispose();
  return { bodyEnvMap, visorEnvMap };
}

function createNeonTubeMaterial(
  registerMat: <T extends THREE.Material>(m: T) => T,
  {
    name,
    coreColorHex,
    midColorHex,
    edgeColorHex,
    coreBoost = 1.35,
  }: {
    name: string;
    coreColorHex: string;
    midColorHex: string;
    edgeColorHex: string;
    coreBoost?: number;
  }
) {
  const mat = registerMat(
    new THREE.MeshBasicMaterial({
      name,
      color: new THREE.Color('#FFFFFF'),
    })
  );

  const uCore = new THREE.Color(coreColorHex);
  const uMid = new THREE.Color(midColorHex);
  const uEdge = new THREE.Color(edgeColorHex);
  const uIntensity = { value: 1.0 };
  mat.userData.uIntensity = uIntensity;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uCoreColor = { value: uCore };
    shader.uniforms.uMidColor = { value: uMid };
    shader.uniforms.uEdgeColor = { value: uEdge };
    shader.uniforms.uCoreBoost = { value: coreBoost };
    shader.uniforms.uIntensity = uIntensity;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vTubeNormalView;
      varying vec3 vTubeViewDir;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      vTubeNormalView = normalize(normalMatrix * normal);
      vTubeViewDir = normalize(-mvPosition.xyz);`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform vec3 uCoreColor;
      uniform vec3 uMidColor;
      uniform vec3 uEdgeColor;
      uniform float uCoreBoost;
      uniform float uIntensity;
      varying vec3 vTubeNormalView;
      varying vec3 vTubeViewDir;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `float ndotv = clamp(dot(normalize(vTubeNormalView), normalize(vTubeViewDir)), 0.0, 1.0);
      float coreFactor = smoothstep(0.36, 0.92, ndotv);
      float midFactor = smoothstep(0.05, 0.62, ndotv);
      vec3 neonCol = mix(uEdgeColor, uMidColor, midFactor);
      neonCol = mix(neonCol, uCoreColor * uCoreBoost, coreFactor);
      vec4 diffuseColor = vec4(neonCol * uIntensity, opacity);`
    );
  };
  return mat;
}

export function createRobotMaterials(
  envs: RobotEnvironments,
  theme: RobotColorTheme,
  registerMat: <T extends THREE.Material>(m: T) => T
) {
  const bodyPlastic = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F3E7DC'),
      roughness: 0.36,
      metalness: 0.0,
      clearcoat: 0.08,
      clearcoatRoughness: 0.36,
      reflectivity: 0.48,
      sheen: 0.25,
      sheenRoughness: 0.48,
      sheenColor: new THREE.Color('#FFF6EE'),
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.68,
    })
  );

  const seamMaterial = registerMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#C4AEA2'),
      roughness: 0.5,
      metalness: 0.0,
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.35,
    })
  );

  const handPeachMaterial = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.accentPlasticHex),
      roughness: 0.37,
      metalness: 0.0,
      clearcoat: 0.08,
      clearcoatRoughness: 0.36,
      sheen: 0.18,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color('#FFE8D6'),
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.58,
    })
  );

  const peachPlastic = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.accentPlasticHex),
      roughness: 0.35,
      metalness: 0.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.34,
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.58,
    })
  );

  const earCupMaterial = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.accentPlasticHex),
      roughness: 0.35,
      metalness: 0.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.34,
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.58,
    })
  );

  const earInnerMaterial = registerMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.earInnerHex),
      roughness: 0.44,
      metalness: 0.0,
      emissive: new THREE.Color(theme.earEmissiveHex),
      emissiveIntensity: 0.18,
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.28,
    })
  );

  const emblemCenterMaterial = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.accentPlasticHex),
      roughness: 0.36,
      metalness: 0.0,
      emissive: new THREE.Color(theme.earEmissiveHex),
      emissiveIntensity: 0.18,
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.45,
    })
  );

  const visorGlass = registerMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#040508'),
      roughness: 0.11,
      metalness: 0.02,
      reflectivity: 0.94,
      envMap: envs.visorEnvMap,
      envMapIntensity: 1.0,
      side: THREE.FrontSide,
    })
  );
  visorGlass.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_fragment_end>',
      `#include <lights_fragment_end>
      reflectedLight.directDiffuse = vec3(0.0);
      reflectedLight.directSpecular = vec3(0.0);`
    );
  };

  const jointMaterial = registerMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#342C2B'),
      roughness: 0.56,
      metalness: 0.05,
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.28,
    })
  );

  const visorBezelMaterial = registerMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#141215'),
      roughness: 0.34,
      metalness: 0.06,
      envMap: envs.visorEnvMap,
      envMapIntensity: 0.48,
    })
  );

  const soleMaterial = registerMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#52403A'),
      roughness: 0.54,
      metalness: 0.04,
      envMap: envs.bodyEnvMap,
      envMapIntensity: 0.3,
    })
  );

  const faceEmissive = createNeonTubeMaterial(registerMat, {
    name: 'FaceEmissiveMaterial',
    coreColorHex: '#FFFFFB',
    midColorHex: '#FFF3DC',
    edgeColorHex: '#FFCC96',
    coreBoost: 1.38,
  });

  const heartEmissive = createNeonTubeMaterial(registerMat, {
    name: 'HeartEmissiveMaterial',
    coreColorHex: '#FFF6F2',
    midColorHex: '#FFA48E',
    edgeColorHex: '#FF5E42',
    coreBoost: 1.36,
  });

  const cheekEmissive = createNeonTubeMaterial(registerMat, {
    name: 'CheekEmissiveMaterial',
    coreColorHex: '#FFEAE0',
    midColorHex: '#FF987A',
    edgeColorHex: '#FF5436',
    coreBoost: 1.28,
  });

  const cheekGlowSheath = registerMat(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FF5A36'),
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  const peachEmissive = createNeonTubeMaterial(registerMat, {
    name: 'PeachEmissiveMaterial',
    coreColorHex: theme.neonCoreHex,
    midColorHex: theme.neonMidHex,
    edgeColorHex: theme.neonEdgeHex,
    coreBoost: 1.35,
  });

  const peachGlowSheath = registerMat(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.neonEdgeHex),
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  return {
    bodyPlastic,
    seamMaterial,
    handPeachMaterial,
    peachPlastic,
    earCupMaterial,
    earInnerMaterial,
    emblemCenterMaterial,
    visorGlass,
    jointMaterial,
    visorBezelMaterial,
    soleMaterial,
    faceEmissive,
    heartEmissive,
    cheekEmissive,
    cheekGlowSheath,
    peachEmissive,
    peachGlowSheath,
  };
}

export type RobotMaterialSet = ReturnType<typeof createRobotMaterials>;

// Cached shared geometries across all 4 robot instances for fast initialization & low memory
let cachedHelmetGeom: THREE.BufferGeometry | null = null;
let cachedBezelGeom: THREE.BufferGeometry | null = null;
let cachedScreenGeom: THREE.BufferGeometry | null = null;
let cachedTorsoGeom: THREE.BufferGeometry | null = null;

function createHelmetShellGeometry(): THREE.BufferGeometry {
  if (cachedHelmetGeom) return cachedHelmetGeom;
  const widthSegs = 64;
  const heightSegs = 48;
  const geom = new THREE.SphereGeometry(1, widthSegs, heightSegs);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let { x, y, z } = evaluateHelmetUnrecessedPoint(v.x, v.y, v.z);

    const foreheadSeamDist = Math.abs(y - 1.66);
    if (foreheadSeamDist < 0.03 && z > -0.2) {
      const groove = 1.0 - foreheadSeamDist / 0.03;
      const mask = smoothstepRobot(-0.2, 0.6, z);
      const depth = 0.014 * groove * groove * mask;
      x -= v.x * depth;
      y -= v.y * depth;
      z -= v.z * depth;
    }

    const sideSeamDist = Math.abs(y + 0.18);
    if (sideSeamDist < 0.028 && Math.abs(x) > 2.4) {
      const groove = 1.0 - sideSeamDist / 0.028;
      const mask = smoothstepRobot(2.4, 2.8, Math.abs(x));
      const depth = 0.014 * groove * groove * mask;
      x -= v.x * depth;
      z -= v.z * depth;
    }

    if (z > 0.25) {
      const sdf = roundedRectSDFRobot(
        x,
        y - VISOR_CENTER_Y,
        VISOR_HALF_W + 0.048,
        VISOR_HALF_H + 0.048,
        VISOR_CORNER_R + 0.048
      );
      const envBlend = 1.0 - smoothstepRobot(0.0, 0.34, sdf);
      if (envBlend > 0) {
        const envZ = evaluateHelmetFrontEnvelopeZ(x, y);
        z = THREE.MathUtils.lerp(z, envZ, envBlend);
      }
      if (sdf > -0.02 && sdf < 0.065) {
        const rimGroove = Math.sin(((sdf + 0.02) / 0.085) * Math.PI);
        z -= 0.018 * rimGroove;
      }
      if (sdf < 0.028) {
        const recessT = 1.0 - smoothstepRobot(-0.08, 0.028, sdf);
        const envZ = evaluateHelmetFrontEnvelopeZ(x, y);
        z = THREE.MathUtils.lerp(z, envZ - 0.32, recessT);
      }
    }
    pos.setXYZ(i, x, y, z);
  }
  geom.computeVertexNormals();
  cachedHelmetGeom = geom;
  return geom;
}

function createCurvedVisorGeometry(
  halfW: number,
  halfH: number,
  cornerR: number,
  zOffset = 0,
  rimDepth = 0.15
): THREE.BufferGeometry {
  const angularSteps = 64;
  const radialSteps = 20;
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= radialSteps; j++) {
    const vFrac = j / radialSteps;
    let radialScale: number;
    let edgeWrapZ = 0;
    if (vFrac <= 0.86) {
      radialScale = Math.pow(vFrac / 0.86, 0.88);
    } else {
      const bevelT = (vFrac - 0.86) / 0.14;
      radialScale = 1.0 + 0.01 * Math.sin(bevelT * Math.PI);
      edgeWrapZ = -rimDepth * (1.0 - Math.cos(bevelT * Math.PI * 0.5));
    }

    for (let i = 0; i <= angularSteps; i++) {
      const uFrac = i / angularSteps;
      const angle = uFrac * Math.PI * 2;
      const pt = getRoundedRectPerimeterPointRobot(
        angle,
        halfW * radialScale,
        halfH * radialScale,
        cornerR * radialScale
      );
      const x = pt.x;
      const y = pt.y + VISOR_CENTER_Y;
      const z = evaluateVisorSurfaceZ(x, y) + zOffset + edgeWrapZ;
      vertices.push(x, y, z);
      uvs.push(0.5 + x / (halfW * 2), 0.5 + (y - VISOR_CENTER_Y) / (halfH * 2));
    }
  }

  const stride = angularSteps + 1;
  for (let j = 0; j < radialSteps; j++) {
    for (let i = 0; i < angularSteps; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i;
      const d = c + 1;
      indices.push(a, c, d);
      indices.push(a, d, b);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function createVisorSoftboxReflectionMesh() {
  const uSteps = 24;
  const vSteps = 10;
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const angleStart = THREE.MathUtils.degToRad(22);
  const angleEnd = THREE.MathUtils.degToRad(76);

  for (let j = 0; j <= vSteps; j++) {
    const vFrac = j / vSteps;
    const rScale = THREE.MathUtils.lerp(0.76, 0.95, vFrac);
    const radialFade = Math.sin(vFrac * Math.PI);

    for (let i = 0; i <= uSteps; i++) {
      const uFrac = i / uSteps;
      const angle = THREE.MathUtils.lerp(angleStart, angleEnd, uFrac);
      const angularFade = Math.sin(uFrac * Math.PI);
      const pt = getRoundedRectPerimeterPointRobot(
        angle,
        VISOR_HALF_W * rScale,
        VISOR_HALF_H * rScale,
        VISOR_CORNER_R * rScale
      );
      const x = pt.x;
      const y = pt.y + VISOR_CENTER_Y;
      const z = evaluateVisorSurfaceZ(x, y) + 0.003;
      vertices.push(x, y, z);
      const intensity = Math.pow(radialFade * angularFade, 1.4) * 0.18;
      colors.push(intensity, intensity, intensity * 1.05);
    }
  }

  const stride = uSteps + 1;
  for (let j = 0; j < vSteps; j++) {
    for (let i = 0; i < uSteps; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i;
      const d = c + 1;
      indices.push(a, c, d);
      indices.push(a, d, b);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);

  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Mesh(geom, mat);
}

function createRobotVisor(materials: RobotMaterialSet) {
  const visorGroup = new THREE.Group();
  if (!cachedBezelGeom) {
    cachedBezelGeom = createCurvedVisorGeometry(
      VISOR_HALF_W + 0.068,
      VISOR_HALF_H + 0.068,
      VISOR_CORNER_R + 0.055,
      0.01,
      0.25
    );
  }
  visorGroup.add(new THREE.Mesh(cachedBezelGeom, materials.visorBezelMaterial));

  if (!cachedScreenGeom) {
    cachedScreenGeom = createCurvedVisorGeometry(
      VISOR_HALF_W,
      VISOR_HALF_H,
      VISOR_CORNER_R,
      0.022,
      0.15
    );
  }
  visorGroup.add(new THREE.Mesh(cachedScreenGeom, materials.visorGlass));

  const reflectionMesh = createVisorSoftboxReflectionMesh();
  reflectionMesh.position.z = 0.022;
  visorGroup.add(reflectionMesh);

  return visorGroup;
}

function createLocalVisorStroke(
  localPoints2D: Array<[number, number]>,
  anchorX: number,
  anchorY: number,
  radius: number,
  coreMat: THREE.Material,
  zLift = 0.026,
  sheathMat: THREE.Material | null = null,
  closed = false
) {
  const group = new THREE.Group();
  const visorScreenOffset = 0.022;
  const anchorZ = evaluateVisorSurfaceZ(anchorX, anchorY) + visorScreenOffset + zLift;
  group.position.set(anchorX, anchorY, anchorZ);

  const points3D = localPoints2D.map(([lx, ly]) => {
    const wx = anchorX + lx;
    const wy = anchorY + ly;
    const wz = evaluateVisorSurfaceZ(wx, wy) + visorScreenOffset + zLift;
    return new THREE.Vector3(lx, ly, wz - anchorZ);
  });

  const curve = new THREE.CatmullRomCurve3(points3D, closed, 'centripetal', 0.25);
  const coreTubeGeom = new THREE.TubeGeometry(curve, 28, radius, 12, closed);
  group.add(new THREE.Mesh(coreTubeGeom, coreMat));

  if (!closed) {
    const coreCapGeom = new THREE.SphereGeometry(radius, 10, 8);
    const startCap = new THREE.Mesh(coreCapGeom, coreMat);
    startCap.position.copy(points3D[0]);
    group.add(startCap);

    const endCap = new THREE.Mesh(coreCapGeom, coreMat);
    endCap.position.copy(points3D[points3D.length - 1]);
    group.add(endCap);
  }

  if (sheathMat) {
    const sheathRadius = radius * 1.38;
    const sheathTubeGeom = new THREE.TubeGeometry(curve, 20, sheathRadius, 10, closed);
    group.add(new THREE.Mesh(sheathTubeGeom, sheathMat));

    if (!closed) {
      const sheathCapGeom = new THREE.SphereGeometry(sheathRadius, 8, 6);
      const sCap1 = new THREE.Mesh(sheathCapGeom, sheathMat);
      sCap1.position.copy(points3D[0]);
      group.add(sCap1);

      const sCap2 = new THREE.Mesh(sheathCapGeom, sheathMat);
      sCap2.position.copy(points3D[points3D.length - 1]);
      group.add(sCap2);
    }
  }
  return group;
}

function createRobotFace(materials: RobotMaterialSet) {
  const faceGroup = new THREE.Group();
  const faceMat = materials.faceEmissive;
  const heartMat = materials.heartEmissive;
  const cheekMat = materials.cheekEmissive;

  const eyeCenterY = -0.32;
  const eyeOffsetX = 1.12;
  const eyeRadiusX = 0.48;
  const eyeRadiusY = 0.465;
  const eyeStrokeRadius = 0.092;
  const steps = 36;

  const leftEyeLocalPts: Array<[number, number]> = [];
  const rightEyeLocalPts: Array<[number, number]> = [];
  const startAngleL = THREE.MathUtils.degToRad(246);
  const endAngleL = THREE.MathUtils.degToRad(202 + 360);

  for (let i = 0; i <= steps; i++) {
    const a = THREE.MathUtils.lerp(startAngleL, endAngleL, i / steps);
    const lx = Math.cos(a) * eyeRadiusX;
    const ly = Math.sin(a) * eyeRadiusY;
    leftEyeLocalPts.push([lx, ly]);
    rightEyeLocalPts.push([-lx, ly]);
  }

  const leftEyeOpen = createLocalVisorStroke(leftEyeLocalPts, -eyeOffsetX, eyeCenterY, eyeStrokeRadius, faceMat);
  faceGroup.add(leftEyeOpen);

  const rightEyeOpen = createLocalVisorStroke(rightEyeLocalPts, eyeOffsetX, eyeCenterY, eyeStrokeRadius, faceMat);
  faceGroup.add(rightEyeOpen);

  const winkLocalPts: Array<[number, number]> = [];
  for (let i = 0; i <= 20; i++) {
    const a = THREE.MathUtils.degToRad(25 + (130 * i) / 20);
    winkLocalPts.push([Math.cos(a) * 0.44, Math.sin(a) * 0.24 - 0.1]);
  }
  const leftEyeWink = createLocalVisorStroke(winkLocalPts, -eyeOffsetX, eyeCenterY, eyeStrokeRadius * 0.94, faceMat);
  leftEyeWink.visible = false;
  faceGroup.add(leftEyeWink);

  const rightEyeWink = createLocalVisorStroke([...winkLocalPts].reverse(), eyeOffsetX, eyeCenterY, eyeStrokeRadius * 0.94, faceMat);
  rightEyeWink.visible = false;
  faceGroup.add(rightEyeWink);

  const sleepyLocalPts: Array<[number, number]> = [];
  for (let i = 0; i <= 20; i++) {
    const a = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(205), THREE.MathUtils.degToRad(335), i / 20);
    sleepyLocalPts.push([Math.cos(a) * 0.43, Math.sin(a) * 0.18 + 0.04]);
  }
  const leftEyeSleepy = createLocalVisorStroke(sleepyLocalPts, -eyeOffsetX, eyeCenterY, eyeStrokeRadius * 0.9, faceMat);
  leftEyeSleepy.visible = false;
  faceGroup.add(leftEyeSleepy);

  const rightEyeSleepy = createLocalVisorStroke([...sleepyLocalPts].reverse(), eyeOffsetX, eyeCenterY, eyeStrokeRadius * 0.9, faceMat);
  rightEyeSleepy.visible = false;
  faceGroup.add(rightEyeSleepy);

  const heartLocalPts: Array<[number, number]> = [];
  const heartSteps = 36;
  for (let i = 0; i < heartSteps; i++) {
    const t = (i / heartSteps) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    heartLocalPts.push([hx * 0.028, (hy - 1.5) * 0.028]);
  }
  const leftEyeHeart = createLocalVisorStroke(heartLocalPts, -eyeOffsetX, eyeCenterY, eyeStrokeRadius * 0.82, heartMat, 0.026, null, true);
  leftEyeHeart.visible = false;
  faceGroup.add(leftEyeHeart);

  const rightEyeHeart = createLocalVisorStroke(heartLocalPts, eyeOffsetX, eyeCenterY, eyeStrokeRadius * 0.82, heartMat, 0.026, null, true);
  rightEyeHeart.visible = false;
  faceGroup.add(rightEyeHeart);

  const mouthAnchorY = -0.64;
  const smileLocalPts: Array<[number, number]> = [];
  const mouthStart = THREE.MathUtils.degToRad(200);
  const mouthEnd = THREE.MathUtils.degToRad(340);
  for (let i = 0; i <= 24; i++) {
    const a = THREE.MathUtils.lerp(mouthStart, mouthEnd, i / 24);
    smileLocalPts.push([Math.cos(a) * 0.27, 0.1 + Math.sin(a) * 0.185]);
  }
  const mouthSmile = createLocalVisorStroke(smileLocalPts, 0, mouthAnchorY, 0.076, faceMat);
  faceGroup.add(mouthSmile);

  const surprisedLocalPts: Array<[number, number]> = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    surprisedLocalPts.push([Math.cos(a) * 0.145, Math.sin(a) * 0.165]);
  }
  const mouthSurprised = createLocalVisorStroke(surprisedLocalPts, 0, mouthAnchorY - 0.03, 0.064, faceMat, 0.026, null, true);
  mouthSurprised.visible = false;
  faceGroup.add(mouthSurprised);

  const sadLocalPts: Array<[number, number]> = [];
  for (let i = 0; i <= 20; i++) {
    const a = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(28), THREE.MathUtils.degToRad(152), i / 20);
    sadLocalPts.push([Math.cos(a) * 0.24, -0.14 + Math.sin(a) * 0.14]);
  }
  const mouthSad = createLocalVisorStroke(sadLocalPts, 0, mouthAnchorY, 0.07, faceMat);
  mouthSad.visible = false;
  faceGroup.add(mouthSad);

  const cheeksGroup = new THREE.Group();
  const cheekMarksList: THREE.Group[] = [];
  const cheekY = -1.06;
  const cheekSpacing = 0.22;
  const slantDX = 0.048;
  const slantDY = 0.082;
  const cheekStrokeRadius = 0.042;

  [-1.25, 1.25].forEach((baseX) => {
    const sideCheekGroup = new THREE.Group();
    for (let m = 0; m < 2; m++) {
      const offsetX = (m - 0.5) * cheekSpacing;
      const cx = baseX + offsetX;
      const markLocalPts: Array<[number, number]> = [
        [-slantDX, -slantDY],
        [0, 0],
        [slantDX, slantDY],
      ];
      const cheekMark = createLocalVisorStroke(
        markLocalPts,
        cx,
        cheekY,
        cheekStrokeRadius,
        cheekMat,
        0.022,
        materials.cheekGlowSheath
      );
      sideCheekGroup.add(cheekMark);
      cheekMarksList.push(cheekMark);
    }
    cheeksGroup.add(sideCheekGroup);
  });
  faceGroup.add(cheeksGroup);

  faceGroup.userData.parts = {
    leftEyeOpen,
    rightEyeOpen,
    leftEyeWink,
    rightEyeWink,
    leftEyeSleepy,
    rightEyeSleepy,
    leftEyeHeart,
    rightEyeHeart,
    mouthSmile,
    mouthSurprised,
    mouthSad,
    cheeksGroup,
    cheekMarksList,
  };

  return faceGroup;
}

function createRobotEarModules(materials: RobotMaterialSet) {
  const earsGroup = new THREE.Group();

  function applyEarOvalScale(geom: THREE.BufferGeometry) {
    geom.scale(1.0, 1.06, 0.94);
    geom.computeVertexNormals();
    return geom;
  }

  const mountPoints = [
    new THREE.Vector2(0.0, -0.45),
    new THREE.Vector2(0.76, -0.45),
    new THREE.Vector2(0.84, -0.02),
    new THREE.Vector2(0.86, 0.12),
    new THREE.Vector2(0.84, 0.22),
    new THREE.Vector2(0.76, 0.26),
    new THREE.Vector2(0.0, 0.26),
  ];
  const mountGeom = applyEarOvalScale(new THREE.LatheGeometry(mountPoints, 32).rotateZ(-Math.PI / 2));

  const housingPoints = [
    new THREE.Vector2(0.0, 0.16),
    new THREE.Vector2(0.82, 0.16),
    new THREE.Vector2(0.95, 0.22),
    new THREE.Vector2(1.0, 0.34),
    new THREE.Vector2(0.96, 0.45),
    new THREE.Vector2(0.86, 0.5),
    new THREE.Vector2(0.75, 0.49),
    new THREE.Vector2(0.68, 0.4),
    new THREE.Vector2(0.0, 0.4),
  ];
  const housingGeom = applyEarOvalScale(new THREE.LatheGeometry(housingPoints, 32).rotateZ(-Math.PI / 2));

  const innerRimGeom = applyEarOvalScale(new THREE.TorusGeometry(0.73, 0.024, 12, 32).rotateY(Math.PI / 2));
  const glowRingGeom = applyEarOvalScale(new THREE.TorusGeometry(0.66, 0.088, 16, 32).rotateY(Math.PI / 2));
  const glowSheathGeom = applyEarOvalScale(new THREE.TorusGeometry(0.66, 0.13, 12, 32).rotateY(Math.PI / 2));

  const innerDiscPoints = [
    new THREE.Vector2(0.0, 0.41),
    new THREE.Vector2(0.32, 0.42),
    new THREE.Vector2(0.52, 0.45),
    new THREE.Vector2(0.61, 0.48),
    new THREE.Vector2(0.61, 0.36),
    new THREE.Vector2(0.0, 0.36),
  ];
  const innerDiscGeom = applyEarOvalScale(new THREE.LatheGeometry(innerDiscPoints, 32).rotateZ(-Math.PI / 2));

  [-1, 1].forEach((side) => {
    const ear = new THREE.Group();
    ear.add(new THREE.Mesh(mountGeom, materials.jointMaterial));
    ear.add(new THREE.Mesh(housingGeom, materials.earCupMaterial));

    const innerRimMesh = new THREE.Mesh(innerRimGeom, materials.jointMaterial);
    innerRimMesh.position.x = 0.485;
    ear.add(innerRimMesh);

    ear.add(new THREE.Mesh(innerDiscGeom, materials.earInnerMaterial));

    const glowRing = new THREE.Mesh(glowRingGeom, materials.peachEmissive);
    glowRing.position.x = 0.512;
    ear.add(glowRing);

    const glowSheath = new THREE.Mesh(glowSheathGeom, materials.peachGlowSheath);
    glowSheath.position.x = 0.508;
    ear.add(glowSheath);

    ear.position.set(side * 3.16, -0.18, 0.0);
    if (side < 0) ear.rotation.set(0, Math.PI, 0);
    earsGroup.add(ear);
  });

  return earsGroup;
}

function createRobotTopSensor(materials: RobotMaterialSet) {
  const sensorGroup = new THREE.Group();
  const basePoints = [
    new THREE.Vector2(0.0, -0.08),
    new THREE.Vector2(0.7, -0.08),
    new THREE.Vector2(0.74, 0.02),
    new THREE.Vector2(0.68, 0.08),
    new THREE.Vector2(0.58, 0.09),
    new THREE.Vector2(0.0, 0.09),
  ];
  const baseMesh = new THREE.Mesh(new THREE.LatheGeometry(basePoints, 32), materials.jointMaterial);
  baseMesh.position.y = 2.71;
  sensorGroup.add(baseMesh);

  const capPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.61, 0.0),
    new THREE.Vector2(0.67, 0.06),
    new THREE.Vector2(0.68, 0.14),
    new THREE.Vector2(0.61, 0.23),
    new THREE.Vector2(0.43, 0.29),
    new THREE.Vector2(0.22, 0.315),
    new THREE.Vector2(0.0, 0.32),
  ];
  const capMesh = new THREE.Mesh(new THREE.LatheGeometry(capPoints, 32), materials.peachPlastic);
  capMesh.name = 'TopSensorCap';
  capMesh.position.y = 2.76;
  sensorGroup.add(capMesh);

  const slitPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 14; i++) {
    const u = (i / 14) * 2.0 - 1.0;
    const sx = u * 0.3;
    const sy = 1.98;
    const sz = evaluateHelmetFrontEnvelopeZ(sx, sy) - 0.148;
    slitPts.push(new THREE.Vector3(sx, sy, sz));
  }
  const slitCurve = new THREE.CatmullRomCurve3(slitPts);
  sensorGroup.add(new THREE.Mesh(new THREE.TubeGeometry(slitCurve, 14, 0.036, 8, false), materials.visorBezelMaterial));

  return sensorGroup;
}

function createSleepZSymbols(materials: RobotMaterialSet) {
  const zzzGroup = new THREE.Group();
  zzzGroup.visible = false;
  const zPts = [
    new THREE.Vector3(-0.18, 0.18, 0),
    new THREE.Vector3(0.18, 0.18, 0),
    new THREE.Vector3(-0.18, -0.18, 0),
    new THREE.Vector3(0.18, -0.18, 0),
  ];

  function buildSingleZMesh(scale: number) {
    const singleZ = new THREE.Group();
    const r = 0.042;
    const segs: Array<[THREE.Vector3, THREE.Vector3]> = [
      [zPts[0], zPts[1]],
      [zPts[1], zPts[2]],
      [zPts[2], zPts[3]],
    ];
    const capSphere = new THREE.SphereGeometry(r, 8, 6);
    segs.forEach(([p0, p1]) => {
      const curve = new THREE.LineCurve3(p0, p1);
      singleZ.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 6, r, 8, false), materials.peachEmissive));
    });
    zPts.forEach((p) => {
      const corner = new THREE.Mesh(capSphere, materials.peachEmissive);
      corner.position.copy(p);
      singleZ.add(corner);
    });
    singleZ.scale.setScalar(scale);
    return singleZ;
  }

  const items = [buildSingleZMesh(0.75), buildSingleZMesh(1.0), buildSingleZMesh(1.25)];
  items.forEach((item, idx) => {
    item.position.set(1.4 + idx * 0.55, 2.6 + idx * 0.65, 0.8);
    zzzGroup.add(item);
  });
  zzzGroup.userData.items = items;
  return zzzGroup;
}

function createRobotHead(materials: RobotMaterialSet) {
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 4.42, 0);

  const headContent = new THREE.Group();
  headContent.position.set(0, 2.53, 0);

  const helmetMesh = new THREE.Mesh(createHelmetShellGeometry(), materials.bodyPlastic);
  helmetMesh.castShadow = true;
  helmetMesh.receiveShadow = true;
  headContent.add(helmetMesh);

  headContent.add(createRobotVisor(materials));
  const faceGroup = createRobotFace(materials);
  headContent.add(faceGroup);
  headContent.add(createRobotEarModules(materials));
  const topSensorGroup = createRobotTopSensor(materials);
  headContent.add(topSensorGroup);
  const sleepZzzGroup = createSleepZSymbols(materials);
  headContent.add(sleepZzzGroup);

  headPivot.add(headContent);
  headPivot.userData.faceGroup = faceGroup;
  headPivot.userData.sleepZzzGroup = sleepZzzGroup;
  headPivot.userData.topSensorCap = topSensorGroup.getObjectByName('TopSensorCap');
  return headPivot;
}

function evaluateTorsoProfile(t: number) {
  let widthR: number;
  if (t < 0.28) {
    const u = t / 0.28;
    const bowl = Math.sin(u * Math.PI * 0.5);
    widthR = THREE.MathUtils.lerp(0.92, 1.66, Math.pow(bowl, 0.78));
  } else if (t < 0.88) {
    const u = (t - 0.28) / 0.6;
    const ease = smoothstepRobot(0.0, 1.0, u);
    widthR = THREE.MathUtils.lerp(1.66, 1.2, Math.pow(ease, 0.88));
  } else {
    const u = (t - 0.88) / 0.12;
    const bevel = Math.sin(u * Math.PI * 0.5);
    widthR = THREE.MathUtils.lerp(1.2, 1.08, bevel * bevel);
  }
  const depthRatio = 0.86 + 0.03 * Math.sin(t * Math.PI);
  return { widthR, depthR: widthR * depthRatio };
}

function createRobotTorso(materials: RobotMaterialSet) {
  const torsoGroup = new THREE.Group();
  const torsoBaseY = 1.42;
  const height = 2.96;

  if (!cachedTorsoGeom) {
    const radialSegs = 64;
    const heightSegs = 40;
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= heightSegs; j++) {
      const t = j / heightSegs;
      const y = t * height;
      const { widthR, depthR } = evaluateTorsoProfile(t);

      for (let i = 0; i <= radialSegs; i++) {
        const u = i / radialSegs;
        const theta = u * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const x = spowRobot(cosT, 0.92) * widthR;
        let z = spowRobot(sinT, 0.92) * depthR;
        if (sinT > 0) z += 0.065 * sinT * Math.sin(t * Math.PI);

        if (sinT > 0.15 && t > 0.06 && t < 0.92) {
          const targetSeamX = 1.08 + 0.14 * Math.sin((1.0 - t) * Math.PI * 0.65);
          const seamDist = Math.abs(Math.abs(x) - targetSeamX);
          if (seamDist < 0.032) {
            const g = 1.0 - seamDist / 0.032;
            z -= 0.012 * g * g;
          }
        }
        vertices.push(x, y, z);
        uvs.push(u, t);
      }
    }

    const stride = radialSegs + 1;
    for (let j = 0; j < heightSegs; j++) {
      for (let i = 0; i < radialSegs; i++) {
        const a = j * stride + i;
        const b = a + 1;
        const c = (j + 1) * stride + i;
        const d = c + 1;
        indices.push(a, c, d);
        indices.push(a, d, b);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    cachedTorsoGeom = geom;
  }

  const torsoMesh = new THREE.Mesh(cachedTorsoGeom, materials.bodyPlastic);
  torsoMesh.position.y = torsoBaseY;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  const emblemY = 3.55;
  const tEmblem = (emblemY - torsoBaseY) / height;
  const prof0 = evaluateTorsoProfile(tEmblem);
  const prof1 = evaluateTorsoProfile(tEmblem + 0.01);
  const z0 = prof0.depthR + 0.065 * Math.sin(tEmblem * Math.PI);
  const z1 = prof1.depthR + 0.065 * Math.sin((tEmblem + 0.01) * Math.PI);
  const dzdy = (z1 - z0) / (0.01 * height);
  const tiltAngleX = Math.atan2(-dzdy, 1.0);

  const emblemGroup = new THREE.Group();
  emblemGroup.position.set(0, emblemY, z0 - 0.002);
  emblemGroup.rotation.x = -tiltAngleX;

  const outerGrooveMesh = new THREE.Mesh(new THREE.TorusGeometry(0.365, 0.018, 12, 32), materials.seamMaterial);
  outerGrooveMesh.scale.z = 0.5;
  emblemGroup.add(outerGrooveMesh);

  const glowRingMesh = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 16, 32), materials.peachEmissive);
  glowRingMesh.position.z = 0.016;
  glowRingMesh.scale.z = 0.68;
  emblemGroup.add(glowRingMesh);

  const glowSheathMesh = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.082, 12, 32), materials.peachGlowSheath);
  glowSheathMesh.position.z = 0.012;
  glowSheathMesh.scale.z = 0.55;
  emblemGroup.add(glowSheathMesh);

  const innerDiscGeom = new THREE.SphereGeometry(0.28, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  innerDiscGeom.rotateX(Math.PI / 2);
  innerDiscGeom.scale(1.0, 1.0, 0.16);
  const innerDiscMesh = new THREE.Mesh(innerDiscGeom, materials.emblemCenterMaterial);
  innerDiscMesh.position.z = -0.002;
  emblemGroup.add(innerDiscMesh);

  torsoGroup.add(emblemGroup);
  return torsoGroup;
}

function createRobotArm(side: number, materials: RobotMaterialSet, role?: string) {
  const armGroup = new THREE.Group();
  armGroup.position.set(side * 1.28, 3.98, 0.02);

  const jointGeom = new THREE.SphereGeometry(0.35, 20, 16);
  jointGeom.scale(0.78, 1.15, 0.88);
  const jointMesh = new THREE.Mesh(jointGeom, materials.jointMaterial);
  jointMesh.position.set(side * 0.04, -0.22, 0.01);
  jointMesh.rotation.z = side * 0.22;
  armGroup.add(jointMesh);

  const limbPivot = new THREE.Group();
  limbPivot.position.set(side * 0.24, 0.02, 0.02);
  limbPivot.rotation.z = side * 0.34;
  limbPivot.rotation.x = -0.04;

  const totalArmLen = 2.18;
  const radialSegs = 36;
  const totalHeightSteps = 48;
  const wristSplitStep = 35;

  function evaluateArmCapsuleProfile(t: number) {
    const topDomeEnd = 0.2;
    const bottomDomeStart = 0.74;
    if (t <= topDomeEnd) {
      const u = (topDomeEnd - t) / topDomeEnd;
      return 0.425 * Math.sqrt(Math.max(0, 1.0 - Math.pow(u, 1.95)));
    } else if (t < bottomDomeStart) {
      const m = (t - topDomeEnd) / (bottomDomeStart - topDomeEnd);
      const forearmSwell = Math.sin(Math.pow(m, 0.85) * Math.PI) * 0.052;
      return THREE.MathUtils.lerp(0.425, 0.445, smoothstepRobot(0.0, 1.0, m)) + forearmSwell;
    } else {
      const u = (t - bottomDomeStart) / (1.0 - bottomDomeStart);
      return 0.445 * Math.sqrt(Math.max(0, 1.0 - Math.pow(u, 1.92)));
    }
  }

  const allVertices: number[] = [];
  const allUVs: number[] = [];

  for (let j = 0; j <= totalHeightSteps; j++) {
    const vFrac = j / totalHeightSteps;
    const t = 0.5 * (1.0 - Math.cos(vFrac * Math.PI));
    const baseY = -t * totalArmLen;
    let r = evaluateArmCapsuleProfile(t);

    const wristDist = Math.abs(j - wristSplitStep);
    if (wristDist <= 2) r -= (1.0 - wristDist / 2.5) * 0.015;

    for (let i = 0; i <= radialSegs; i++) {
      const uFrac = i / radialSegs;
      const theta = uFrac * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const isInner = (side > 0 && cosT < 0) || (side < 0 && cosT > 0);
      const innerFlatness = THREE.MathUtils.lerp(0.8, 0.9, smoothstepRobot(0.35, 0.85, t));
      const rx = isInner ? r * innerFlatness : r * 1.05;
      const rz = r * 0.95;
      const curveX = -side * 0.045 * Math.pow(t, 1.55);
      const curveZ = 0.055 * Math.sin(t * Math.PI);
      const outerArchFactor = side * cosT * 0.35 + sinT * 0.25;
      const wristArchY = 0.062 * outerArchFactor * Math.exp(-Math.pow((t - 0.72) / 0.14, 2));

      allVertices.push(cosT * rx + curveX, baseY + wristArchY, sinT * rz + curveZ);
      allUVs.push(uFrac, vFrac);
    }
  }

  const fullIndices: number[] = [];
  const stride = radialSegs + 1;
  for (let j = 0; j < totalHeightSteps; j++) {
    for (let i = 0; i < radialSegs; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i;
      const d = c + 1;
      fullIndices.push(a, b, d);
      fullIndices.push(a, d, c);
    }
  }

  const fullGeom = new THREE.BufferGeometry();
  fullGeom.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
  fullGeom.setAttribute('uv', new THREE.Float32BufferAttribute(allUVs, 2));
  fullGeom.setIndex(fullIndices);
  fullGeom.computeVertexNormals();
  const unifiedNormals = fullGeom.attributes.normal.array;

  function extractArmSubMesh(startRow: number, endRow: number) {
    const subGeom = new THREE.BufferGeometry();
    const subIndices: number[] = [];
    for (let j = startRow; j < endRow; j++) {
      for (let i = 0; i < radialSegs; i++) {
        const a = j * stride + i;
        const b = a + 1;
        const c = (j + 1) * stride + i;
        const d = c + 1;
        subIndices.push(a, b, d);
        subIndices.push(a, d, c);
      }
    }
    subGeom.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
    subGeom.setAttribute('normal', new THREE.Float32BufferAttribute(unifiedNormals, 3));
    subGeom.setAttribute('uv', new THREE.Float32BufferAttribute(allUVs, 2));
    subGeom.setIndex(subIndices);
    return subGeom;
  }

  const armShellMesh = new THREE.Mesh(extractArmSubMesh(0, wristSplitStep), materials.bodyPlastic);
  armShellMesh.castShadow = true;
  armShellMesh.receiveShadow = true;
  limbPivot.add(armShellMesh);

  const handCapMesh = new THREE.Mesh(extractArmSubMesh(wristSplitStep, totalHeightSteps), materials.handPeachMaterial);
  handCapMesh.castShadow = true;
  handCapMesh.receiveShadow = true;
  limbPivot.add(handCapMesh);

  // Role-specific hand tool props matching the OfficeVerse AI PDF!
  if (role === 'researcher' && side === 1) {
    // NOVA's right-hand note-taking stylus
    const stylusGroup = new THREE.Group();
    stylusGroup.position.set(-0.08, -1.98, 0.16);
    stylusGroup.rotation.set(0.85, 0.25, 0.35);
    const penBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.95, 10),
      materials.jointMaterial
    );
     stylusGroup.add(penBody);
    const penTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 10, 10),
      materials.peachEmissive
    );
    penTip.position.y = -0.5;
    stylusGroup.add(penTip);
    limbPivot.add(stylusGroup);
  } else if (role === 'manager' && side === -1) {
    // AURA (Office Manager): Smart Coordinator Pointer Wand in Left Hand for pointing at the Team Dashboard Wall
    const wandGroup = new THREE.Group();
    wandGroup.position.set(-0.05, -2.02, 0.16);
    wandGroup.rotation.x = Math.PI * 0.28;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 1.15, 12),
      materials.jointMaterial
    );
    shaft.position.y = -0.48;
    wandGroup.add(shaft);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), materials.peachEmissive);
    tip.position.y = -1.08;
    wandGroup.add(tip);
    limbPivot.add(wandGroup);
  }

  fullGeom.dispose();
  armGroup.add(limbPivot);
  armGroup.userData.limbPivot = limbPivot;
  return armGroup;
}

function evaluateLegAndFootSurface(theta: number, y: number, side: number) {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const h = Math.max(0, Math.min(1, y / 1.7));
  const bellFlare = Math.pow(1.0 - h, 0.82);
  const bottomBevel = y < 0.26 ? -0.042 * Math.pow(1.0 - Math.max(0, (y - 0.12) / 0.14), 1.8) : 0.0;
  const contourFullness = 0.035 * Math.sin(h * Math.PI);
  const radialScale = 0.79 + 0.25 * bellFlare + contourFullness + bottomBevel;
  const isOuter = side * cosT > 0;
  const halfWidth = (isOuter ? 0.94 : 0.82) * radialScale;
  const bootForwardFactor = Math.pow(Math.max(0, 1.0 - Math.max(0, y - 0.12) / 1.05), 1.38);
  const frontLen = 0.82 + 0.56 * bootForwardFactor + bottomBevel * 0.8;
  const backLen = 0.78 + 0.14 * bootForwardFactor + bottomBevel * 0.5;

  let x = spowRobot(cosT, 0.88) * halfWidth;
  const zRadius = sinT >= 0 ? frontLen : backLen;
  const toeForwardShift = sinT > 0 ? 0.15 * bootForwardFactor * sinT : 0;
  const z = spowRobot(sinT, 0.88) * zRadius + toeForwardShift;
  x -= side * 0.22 * Math.pow(h, 1.05);
  return { x, y, z };
}

function evaluateFootStripArchY(x: number): number {
  const u = Math.min(1.0, Math.abs(x) / FOOT_ARCH_HALF_SPAN);
  const archCurve = Math.pow(Math.max(0, 1.0 - Math.pow(u, 2.25)), 0.65);
  return FOOT_SOLE_TOP_Y + (FOOT_ARCH_PEAK_Y - FOOT_SOLE_TOP_Y) * archCurve;
}

function evaluateBootFrontZAtXY(xTarget: number, y: number, side: number): number {
  let low = 0.0;
  let high = Math.PI;
  for (let iter = 0; iter < 14; iter++) {
    const mid = 0.5 * (low + high);
    const pt = evaluateLegAndFootSurface(mid, y, side);
    if (pt.x > xTarget) low = mid;
    else high = mid;
  }
  return evaluateLegAndFootSurface(0.5 * (low + high), y, side).z;
}

function createRobotFoot(side: number, materials: RobotMaterialSet) {
  const footGroup = new THREE.Group();
  const radialSegs = 40;
  const stride = radialSegs + 1;

  const soleGeom = new THREE.BufferGeometry();
  const soleVerts: number[] = [0, 0, 0.1];
  const soleIndices: number[] = [];
  const soleSteps = 6;

  for (let j = 0; j <= soleSteps; j++) {
    const vFrac = j / soleSteps;
    const y = vFrac * FOOT_SOLE_TOP_Y;
    const edgeRound = Math.sin(vFrac * Math.PI);
    const bottomBevel = vFrac < 0.25 ? 0.95 + 0.05 * (vFrac / 0.25) : 1.0 + 0.02 * edgeRound;
    for (let i = 0; i <= radialSegs; i++) {
      const theta = (i / radialSegs) * Math.PI * 2;
      const pt = evaluateLegAndFootSurface(theta, FOOT_SOLE_TOP_Y, side);
      soleVerts.push(pt.x * bottomBevel, y, pt.z * bottomBevel);
    }
  }
  for (let i = 0; i < radialSegs; i++) {
    soleIndices.push(0, 1 + i + 1, 1 + i);
  }
  for (let j = 0; j < soleSteps; j++) {
    for (let i = 0; i < radialSegs; i++) {
      const a = 1 + j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i;
      const d = c + 1;
      soleIndices.push(a, c, d);
      soleIndices.push(a, d, b);
    }
  }
  soleGeom.setAttribute('position', new THREE.Float32BufferAttribute(soleVerts, 3));
  soleGeom.setIndex(soleIndices);
  soleGeom.computeVertexNormals();

  const soleMesh = new THREE.Mesh(soleGeom, materials.soleMaterial);
  soleMesh.castShadow = true;
  soleMesh.receiveShadow = true;
  footGroup.add(soleMesh);

  const toeGeom = new THREE.BufferGeometry();
  const toeVerts: number[] = [];
  const toeIndices: number[] = [];
  const toeUSteps = 28;
  const toeVSteps = 12;

  for (let j = 0; j <= toeVSteps; j++) {
    const vFrac = j / toeVSteps;
    for (let i = 0; i <= toeUSteps; i++) {
      const uFrac = (i / toeUSteps) * 2.0 - 1.0;
      const x = uFrac * FOOT_ARCH_HALF_SPAN;
      const archTopY = evaluateFootStripArchY(x);
      const y = THREE.MathUtils.lerp(FOOT_SOLE_TOP_Y - 0.004, archTopY, vFrac);
      const z = evaluateBootFrontZAtXY(x, y, side);
      const cushion = Math.sin(vFrac * Math.PI) * (1.0 - uFrac * uFrac * 0.85);
      toeVerts.push(x, y, z + 0.003 + 0.012 * cushion);
    }
  }
  const toeStride = toeUSteps + 1;
  for (let j = 0; j < toeVSteps; j++) {
    for (let i = 0; i < toeUSteps; i++) {
      const a = j * toeStride + i;
      const b = a + 1;
      const c = (j + 1) * toeStride + i;
      const d = c + 1;
      toeIndices.push(a, b, d);
      toeIndices.push(a, d, c);
    }
  }
  toeGeom.setAttribute('position', new THREE.Float32BufferAttribute(toeVerts, 3));
  toeGeom.setIndex(toeIndices);
  toeGeom.computeVertexNormals();

  const toeMesh = new THREE.Mesh(toeGeom, materials.handPeachMaterial);
  toeMesh.castShadow = true;
  toeMesh.receiveShadow = true;
  footGroup.add(toeMesh);

  const stripPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = (i / 28) * 2.0 - 1.0;
    const x = u * FOOT_ARCH_HALF_SPAN;
    const yArch = evaluateFootStripArchY(x);
    const zFront = evaluateBootFrontZAtXY(x, yArch, side);
    stripPoints.push(new THREE.Vector3(x, yArch, zFront + 0.012));
  }
  const stripCurve = new THREE.CatmullRomCurve3(stripPoints);
  footGroup.add(new THREE.Mesh(new THREE.TubeGeometry(stripCurve, 28, 0.045, 10, false), materials.peachEmissive));
  footGroup.add(new THREE.Mesh(new THREE.TubeGeometry(stripCurve, 28, 0.075, 10, false), materials.peachGlowSheath));

  return footGroup;
}

function createRobotLeg(side: number, materials: RobotMaterialSet) {
  const legGroup = new THREE.Group();
  legGroup.position.set(side * 1.12, HIP_PIVOT_Y, 0.0);

  const legContent = new THREE.Group();
  legContent.position.set(0, -HIP_PIVOT_Y, 0);
  legGroup.add(legContent);

  const radialSegs = 40;
  const heightSegs = 32;
  const stride = radialSegs + 1;

  function evaluateHipTopY(cosT: number) {
    return 1.48 + 0.2 * (side * cosT);
  }

  const legGeom = new THREE.BufferGeometry();
  const legVerts: number[] = [];
  const legIndices: number[] = [];

  for (let j = 0; j <= heightSegs; j++) {
    const t = j / heightSegs;
    for (let i = 0; i <= radialSegs; i++) {
      const theta = (i / radialSegs) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const topY = evaluateHipTopY(cosT);
      const prelimPt = evaluateLegAndFootSurface(theta, FOOT_SOLE_TOP_Y, side);
      let bottomY = FOOT_SOLE_TOP_Y;
      if (sinT > 0.02 && Math.abs(prelimPt.x) < FOOT_ARCH_HALF_SPAN) {
        const archY = evaluateFootStripArchY(prelimPt.x);
        const frontMask = smoothstepRobot(0.02, 0.22, sinT);
        bottomY = THREE.MathUtils.lerp(FOOT_SOLE_TOP_Y, archY, frontMask);
      }

      const y = THREE.MathUtils.lerp(bottomY, topY, t);
      let { x, z } = evaluateLegAndFootSurface(theta, y, side);

      const ankleTargetY = 0.84 - 0.05 * sinT;
      const ankleDist = Math.abs(y - ankleTargetY);
      if (ankleDist < 0.032) {
        const groove = 1.0 - ankleDist / 0.032;
        const gAmt = 0.012 * groove * groove;
        x -= cosT * gAmt;
        z -= sinT * gAmt;
      }

      if (t > 0.93) {
        const b = smoothstepRobot(0.93, 1.0, t);
        const cx = -side * 0.22;
        x = THREE.MathUtils.lerp(x, cx + (x - cx) * 0.945, b);
        z = THREE.MathUtils.lerp(z, z * 0.945, b);
      }
      legVerts.push(x, y, z);
    }
  }

  for (let j = 0; j < heightSegs; j++) {
    for (let i = 0; i < radialSegs; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i;
      const d = c + 1;
      legIndices.push(a, c, d);
      legIndices.push(a, d, b);
    }
  }

  legGeom.setAttribute('position', new THREE.Float32BufferAttribute(legVerts, 3));
  legGeom.setIndex(legIndices);
  legGeom.computeVertexNormals();

  const legShellMesh = new THREE.Mesh(legGeom, materials.bodyPlastic);
  legShellMesh.castShadow = true;
  legShellMesh.receiveShadow = true;
  legContent.add(legShellMesh);

  const footGroup = createRobotFoot(side, materials);
  legContent.add(footGroup);
  legGroup.userData.footGroup = footGroup;
  return legGroup;
}

export interface CompanionRobotParts {
  robotGroup: THREE.Group;
  upperBodyGroup: THREE.Group;
  headGroup: THREE.Group;
  torsoGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
}

export function createCompanionRobotHierarchy(
  materials: RobotMaterialSet,
  role?: string
): CompanionRobotParts {
  const robotGroup = new THREE.Group();
  robotGroup.name = 'CuteCompanionRobot';

  const upperBodyGroup = new THREE.Group();
  upperBodyGroup.position.set(0, HIP_PIVOT_Y, 0);

  const upperBodyContent = new THREE.Group();
  upperBodyContent.position.set(0, -HIP_PIVOT_Y, 0);
  upperBodyGroup.add(upperBodyContent);

  const headGroup = createRobotHead(materials);
  const neckGeom = new THREE.CylinderGeometry(1.06, 1.14, 0.22, 32);
  neckGeom.scale(1.0, 1.0, 0.84);
  const neckMesh = new THREE.Mesh(neckGeom, materials.jointMaterial);
  neckMesh.position.y = 4.35;

  const torsoGroup = createRobotTorso(materials);
  const leftArmGroup = createRobotArm(-1, materials, role);
  const rightArmGroup = createRobotArm(1, materials, role);

  upperBodyContent.add(headGroup);
  upperBodyContent.add(neckMesh);
  upperBodyContent.add(torsoGroup);
  upperBodyContent.add(leftArmGroup);
  upperBodyContent.add(rightArmGroup);

  // NOVA (Researcher): Sleek Dark Digital Research Tablet / Open Folio Pad held in front of chest (matches PDF Page 1!)
  if (role === 'researcher') {
    const folioGroup = new THREE.Group();
    folioGroup.name = 'NovaResearchTablet';
    folioGroup.position.set(0.0, 2.28, 1.88);
    folioGroup.rotation.set(-0.55, 0.0, 0.0);

    // Dark matte slate tablet casing
    const coverBack = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 1.58, 0.12),
      materials.visorBezelMaterial
    );
    coverBack.castShadow = true;
    coverBack.receiveShadow = true;
    folioGroup.add(coverBack);

    // Mint/Teal accent rim around the Research Tablet
    const rimStrip = new THREE.Mesh(
      new THREE.BoxGeometry(2.41, 1.64, 0.06),
      materials.peachPlastic
    );
    rimStrip.position.z = 0.01;
    folioGroup.add(rimStrip);

    // Illuminated Research Screen facing NOVA's visor
    const innerScreen = new THREE.Mesh(
      new THREE.BoxGeometry(2.12, 1.36, 0.03),
      materials.peachEmissive
    );
    innerScreen.position.set(0, 0, -0.065);
    folioGroup.add(innerScreen);

    // Back glowing status emblem visible from the front isometric camera
    const backLogo = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.22, 0.03),
      materials.peachEmissive
    );
    backLogo.position.set(0, 0.12, 0.065);
    folioGroup.add(backLogo);

    upperBodyContent.add(folioGroup);
  }

  const leftLegGroup = createRobotLeg(-1, materials);
  const rightLegGroup = createRobotLeg(1, materials);

  robotGroup.add(upperBodyGroup);
  robotGroup.add(leftLegGroup);
  robotGroup.add(rightLegGroup);

  return {
    robotGroup,
    upperBodyGroup,
    headGroup,
    torsoGroup,
    leftArmGroup,
    rightArmGroup,
    leftLegGroup,
    rightLegGroup,
  };
}

export class FacialExpressionController {
  faceGroup: THREE.Group;
  parts: Record<string, any>;
  materials: RobotMaterialSet;
  currentExpression: RobotExpression = 'happy';
  winkSide = 1;
  isBlinking = false;
  blinkTimer = 0;
  blinkDuration = 0.17;
  nextBlinkInterval = 2.8 + Math.random() * 2.4;

  state = {
    leftEyeScaleX: 1,
    leftEyeScaleY: 1,
    rightEyeScaleX: 1,
    rightEyeScaleY: 1,
    leftEyeRotZ: 0,
    rightEyeRotZ: 0,
    mouthScaleX: 1,
    mouthScaleY: 1,
    mouthRotZ: 0,
    cheekScale: 1,
    faceGlow: 1.0,
    cheekGlow: 1.0,
    exprHeadReactionY: 0,
    exprHeadReactionZ: 0,
  };

  target = { ...this.state };
  reactionDecay = 0;

  constructor(faceGroup: THREE.Group, materials: RobotMaterialSet, initialExpr: RobotExpression = 'happy') {
    this.faceGroup = faceGroup;
    this.parts = faceGroup.userData.parts;
    this.materials = materials;
    this.setExpression(initialExpr, false);
  }

  setExpression(exprName: RobotExpression, triggerReaction = true) {
    if (exprName === 'wink') this.winkSide *= -1;
    this.currentExpression = exprName;

    const p = this.parts;
    p.leftEyeOpen.visible = true;
    p.rightEyeOpen.visible = true;
    p.leftEyeWink.visible = false;
    p.rightEyeWink.visible = false;
    p.leftEyeSleepy.visible = false;
    p.rightEyeSleepy.visible = false;
    p.leftEyeHeart.visible = false;
    p.rightEyeHeart.visible = false;

    p.mouthSmile.visible = true;
    p.mouthSurprised.visible = false;
    p.mouthSad.visible = false;

    Object.assign(this.target, {
      leftEyeScaleX: 1.0,
      leftEyeScaleY: 1.0,
      rightEyeScaleX: 1.0,
      rightEyeScaleY: 1.0,
      leftEyeRotZ: 0.0,
      rightEyeRotZ: 0.0,
      mouthScaleX: 1.0,
      mouthScaleY: 1.0,
      mouthRotZ: 0.0,
      cheekScale: 1.0,
      faceGlow: 1.0,
      cheekGlow: 1.0,
      exprHeadReactionY: 0.0,
      exprHeadReactionZ: 0.0,
    });

    switch (exprName) {
      case 'excited':
        this.target.leftEyeScaleX = 1.12;
        this.target.leftEyeScaleY = 1.14;
        this.target.rightEyeScaleX = 1.12;
        this.target.rightEyeScaleY = 1.14;
        this.target.mouthScaleX = 1.24;
        this.target.mouthScaleY = 1.32;
        this.target.cheekScale = 1.16;
        this.target.faceGlow = 1.18;
        this.target.cheekGlow = 1.25;
        if (triggerReaction) {
          this.state.exprHeadReactionY = 0.09;
          this.reactionDecay = 0.45;
        }
        break;
      case 'wink':
        if (this.winkSide > 0) {
          p.rightEyeOpen.visible = false;
          p.rightEyeWink.visible = true;
          this.target.mouthRotZ = 0.12;
        } else {
          p.leftEyeOpen.visible = false;
          p.leftEyeWink.visible = true;
          this.target.mouthRotZ = -0.12;
        }
        this.target.mouthScaleX = 1.15;
        this.target.mouthScaleY = 1.12;
        this.target.cheekScale = 1.12;
        if (triggerReaction) {
          this.state.exprHeadReactionZ = this.winkSide * -0.07;
          this.reactionDecay = 0.55;
        }
        break;
      case 'surprised':
        this.target.leftEyeScaleX = 1.16;
        this.target.leftEyeScaleY = 1.2;
        this.target.rightEyeScaleX = 1.16;
        this.target.rightEyeScaleY = 1.2;
        p.mouthSmile.visible = false;
        p.mouthSurprised.visible = true;
        this.target.faceGlow = 1.16;
        this.target.cheekScale = 0.92;
        if (triggerReaction) {
          this.state.exprHeadReactionY = 0.11;
          this.reactionDecay = 0.45;
        }
        break;
      case 'sleepy':
        p.leftEyeOpen.visible = false;
        p.rightEyeOpen.visible = false;
        p.leftEyeSleepy.visible = true;
        p.rightEyeSleepy.visible = true;
        this.target.mouthScaleX = 0.78;
        this.target.mouthScaleY = 0.65;
        this.target.faceGlow = 0.76;
        this.target.cheekGlow = 0.8;
        break;
      case 'sad':
        this.target.leftEyeScaleX = 0.95;
        this.target.leftEyeScaleY = 0.88;
        this.target.rightEyeScaleX = 0.95;
        this.target.rightEyeScaleY = 0.88;
        this.target.leftEyeRotZ = 0.24;
        this.target.rightEyeRotZ = -0.24;
        p.mouthSmile.visible = false;
        p.mouthSad.visible = true;
        this.target.faceGlow = 0.82;
        this.target.cheekGlow = 0.72;
        this.target.cheekScale = 0.88;
        break;
      case 'curious':
        this.target.leftEyeScaleX = 1.15;
        this.target.leftEyeScaleY = 1.16;
        this.target.rightEyeScaleX = 0.9;
        this.target.rightEyeScaleY = 0.78;
        this.target.mouthScaleX = 0.75;
        this.target.mouthScaleY = 0.85;
        this.target.mouthRotZ = -0.14;
        if (triggerReaction) {
          this.state.exprHeadReactionZ = -0.1;
          this.reactionDecay = 0.75;
        }
        break;
      case 'love':
        p.leftEyeOpen.visible = false;
        p.rightEyeOpen.visible = false;
        p.leftEyeHeart.visible = true;
        p.rightEyeHeart.visible = true;
        this.target.mouthScaleX = 1.18;
        this.target.mouthScaleY = 1.24;
        this.target.cheekScale = 1.22;
        this.target.faceGlow = 1.15;
        this.target.cheekGlow = 1.32;
        break;
    }
  }

  triggerBlink() {
    if (this.currentExpression === 'sleepy') return;
    this.isBlinking = true;
    this.blinkTimer = 0;
  }

  update(dt: number, elapsed: number) {
    this.blinkTimer += dt;
    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkInterval) {
      if (this.currentExpression !== 'sleepy') this.isBlinking = true;
      this.blinkTimer = 0;
      this.nextBlinkInterval = 2.6 + Math.random() * 3.2;
    }

    let blinkSquash = 1.0;
    let showBlinkArcs = false;
    if (this.isBlinking) {
      const bNorm = this.blinkTimer / this.blinkDuration;
      if (bNorm >= 1.0) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      } else {
        const closeCurve = Math.sin(bNorm * Math.PI);
        blinkSquash = Math.max(0.08, 1.0 - closeCurve * 0.95);
        showBlinkArcs = closeCurve > 0.72;
      }
    }

    const lerpRate = Math.min(1.0, dt * 14.0);
    for (const key of Object.keys(this.target) as Array<keyof typeof this.target>) {
      if (key === 'exprHeadReactionY' || key === 'exprHeadReactionZ') continue;
      this.state[key] = THREE.MathUtils.lerp(this.state[key], this.target[key], lerpRate);
    }

    if (this.reactionDecay > 0) {
      this.reactionDecay = Math.max(0, this.reactionDecay - dt);
      const decayFactor = Math.exp(-dt * 6.5);
      this.state.exprHeadReactionY *= decayFactor;
      this.state.exprHeadReactionZ *= decayFactor;
    } else {
      this.state.exprHeadReactionY = 0;
      this.state.exprHeadReactionZ = 0;
    }

    const p = this.parts;
    const s = this.state;
    const heartBeat = this.currentExpression === 'love' ? 1.0 + Math.sin(elapsed * 7.5) * 0.08 : 1.0;

    p.leftEyeOpen.scale.set(s.leftEyeScaleX, s.leftEyeScaleY * blinkSquash, 1.0);
    p.rightEyeOpen.scale.set(s.rightEyeScaleX, s.rightEyeScaleY * blinkSquash, 1.0);
    p.leftEyeOpen.rotation.z = s.leftEyeRotZ;
    p.rightEyeOpen.rotation.z = s.rightEyeRotZ;

    p.leftEyeHeart.scale.set(heartBeat, heartBeat * blinkSquash, 1.0);
    p.rightEyeHeart.scale.set(heartBeat, heartBeat * blinkSquash, 1.0);

    if (this.currentExpression !== 'wink' && this.currentExpression !== 'sleepy') {
      p.leftEyeWink.visible = showBlinkArcs;
      p.rightEyeWink.visible = showBlinkArcs;
      if (this.currentExpression === 'love') {
        p.leftEyeHeart.visible = !showBlinkArcs;
        p.rightEyeHeart.visible = !showBlinkArcs;
      } else {
        p.leftEyeOpen.visible = !showBlinkArcs;
        p.rightEyeOpen.visible = !showBlinkArcs;
      }
    }

    p.mouthSmile.scale.set(s.mouthScaleX, s.mouthScaleY, 1.0);
    p.mouthSmile.rotation.z = s.mouthRotZ;
    p.mouthSurprised.scale.set(s.mouthScaleX, s.mouthScaleY, 1.0);
    p.mouthSad.scale.set(s.mouthScaleX, s.mouthScaleY, 1.0);

    if (p.cheekMarksList) {
      p.cheekMarksList.forEach((mark: THREE.Group) => {
        mark.scale.set(s.cheekScale, s.cheekScale, 1.0);
      });
    }
    if (this.materials.faceEmissive.userData.uIntensity) {
      this.materials.faceEmissive.userData.uIntensity.value = s.faceGlow;
    }
    if (this.materials.cheekEmissive.userData.uIntensity) {
      this.materials.cheekEmissive.userData.uIntensity.value = s.cheekGlow;
    }
    this.materials.cheekGlowSheath.opacity = 0.32 * s.cheekGlow;
  }
}

export class OfficeRobotAnimationController {
  config: RobotConfig;
  parts: CompanionRobotParts;
  anchorGroup: THREE.Group;
  exprCtrl: FacialExpressionController;
  onStateChange?: (robotId: string, action: RobotActionMode, expr: RobotExpression) => void;

  currentAction: RobotActionMode = 'work';
  actionTime = 0;
  homePos: THREE.Vector3;
  homeRotY: number;
  patrolWaypoints: THREE.Vector3[];
  patrolIndex = 1;
  phaseOffset: number;

  rest: RobotPoseState = { ...DEFAULT_REST_POSE };
  pose: RobotPoseState = { ...DEFAULT_REST_POSE };

  constructor(
    config: RobotConfig,
    robotParts: CompanionRobotParts,
    anchorGroup: THREE.Group,
    exprCtrl: FacialExpressionController,
    onStateChange?: (robotId: string, action: RobotActionMode, expr: RobotExpression) => void
  ) {
    this.config = config;
    this.parts = robotParts;
    this.anchorGroup = anchorGroup;
    this.exprCtrl = exprCtrl;
    this.onStateChange = onStateChange;
    this.phaseOffset = config.index * 1.37;

    this.homePos = new THREE.Vector3(config.homePos.x, config.homePos.y, config.homePos.z);
    this.homeRotY = config.homeRotY;
    this.patrolWaypoints = config.patrolWaypoints.map((w) => new THREE.Vector3(w.x, w.y, w.z));
  }

  setAction(actionName: RobotActionMode) {
    if (actionName === 'patrol' && this.currentAction === 'patrol') {
      actionName = 'work';
    }
    this.currentAction = actionName;
    this.actionTime = 0;

    const zzz = this.parts.headGroup.userData.sleepZzzGroup;
    if (zzz) zzz.visible = actionName === 'sleep';

    switch (actionName) {
      case 'work':
        this.exprCtrl.setExpression(this.config.defaultExpression, false);
        break;
      case 'idle':
        if (this.exprCtrl.currentExpression === 'sleepy') {
          this.exprCtrl.setExpression('happy', false);
        }
        break;
      case 'patrol':
        this.exprCtrl.setExpression('happy', false);
        break;
      case 'wave':
        this.exprCtrl.setExpression('happy', true);
        break;
      case 'bounce':
        this.exprCtrl.setExpression('excited', true);
        break;
      case 'dance':
        this.exprCtrl.setExpression('excited', false);
        break;
      case 'bow':
        this.exprCtrl.setExpression('happy', false);
        break;
      case 'curious':
        this.exprCtrl.setExpression('curious', true);
        break;
      case 'sleep':
        this.exprCtrl.setExpression('sleepy', false);
        break;
      case 'celebrate':
        this.exprCtrl.setExpression('love', true);
        break;
    }

    if (this.onStateChange) {
      this.onStateChange(this.config.id, this.currentAction, this.exprCtrl.currentExpression);
    }
  }

  update(dt: number, elapsed: number) {
    this.actionTime += dt;
    const t = this.actionTime;
    const e = elapsed + this.phaseOffset;
    let target: RobotPoseState = { ...this.rest };

    // Smoothly return to home position (including seat elevation Y) & rotation when not patrolling
    if (this.currentAction !== 'patrol') {
      this.anchorGroup.position.x = THREE.MathUtils.lerp(
        this.anchorGroup.position.x,
        this.homePos.x,
        Math.min(1.0, dt * 4.5)
      );
      this.anchorGroup.position.y = THREE.MathUtils.lerp(
        this.anchorGroup.position.y,
        this.homePos.y,
        Math.min(1.0, dt * 5.5)
      );
      this.anchorGroup.position.z = THREE.MathUtils.lerp(
        this.anchorGroup.position.z,
        this.homePos.z,
        Math.min(1.0, dt * 4.5)
      );
      let angleDiff = this.homeRotY - this.anchorGroup.rotation.y;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      this.anchorGroup.rotation.y += angleDiff * Math.min(1.0, dt * 5.5);
    } else {
      // Lower to floor level (y = 0) when walking on patrol
      this.anchorGroup.position.y = THREE.MathUtils.lerp(
        this.anchorGroup.position.y,
        0.0,
        Math.min(1.0, dt * 6.0)
      );
    }

    switch (this.currentAction) {
      case 'work': {
        target = computeWorkTaskPose(this.config.role, e);
        break;
      }

      case 'idle': {
        const breath = Math.sin(e * 2.0);
        target.upperY = HIP_PIVOT_Y + breath * 0.025;
        target.headRotZ = Math.sin(e * 0.9) * 0.035;
        target.headRotY = Math.sin(e * 0.65) * 0.08;
        target.leftArmRotZ = -0.34 - Math.max(0, breath) * 0.02;
        target.rightArmRotZ = 0.34 + Math.max(0, breath) * 0.02;
        break;
      }

      case 'patrol': {
        const wp = this.patrolWaypoints[this.patrolIndex];
        const dx = wp.x - this.anchorGroup.position.x;
        const dz = wp.z - this.anchorGroup.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.08) {
          this.patrolIndex = (this.patrolIndex + 1) % this.patrolWaypoints.length;
        } else {
          const moveSpeed = 0.72;
          const step = Math.min(dist, moveSpeed * dt);
          this.anchorGroup.position.x += (dx / dist) * step;
          this.anchorGroup.position.z += (dz / dist) * step;

          const desiredYaw = Math.atan2(dx, dz);
          let diff = desiredYaw - this.anchorGroup.rotation.y;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          this.anchorGroup.rotation.y += diff * Math.min(1.0, dt * 6.5);
        }

        const phase = t * 6.2;
        const sinP = Math.sin(phase);
        const cosP = Math.cos(phase);
        target.leftLegRotX = sinP * 0.38;
        target.rightLegRotX = -sinP * 0.38;
        target.leftLegY = HIP_PIVOT_Y + Math.max(0, cosP) * 0.1;
        target.rightLegY = HIP_PIVOT_Y + Math.max(0, -cosP) * 0.1;
        target.leftArmRotX = -0.04 - sinP * 0.4;
        target.rightArmRotX = -0.04 + sinP * 0.4;
        target.upperY = HIP_PIVOT_Y + Math.abs(sinP) * 0.09;
        target.upperRotZ = -cosP * 0.048;
        target.upperRotY = sinP * 0.08;
        target.upperRotX = 0.04;
        target.headRotZ = cosP * 0.04;
        break;
      }

      case 'wave': {
        const duration = 3.1;
        if (t >= duration) {
          this.setAction('work');
          break;
        }
        const env =
          smoothstepRobot(0.0, 0.45, t) * (1.0 - smoothstepRobot(duration - 0.55, duration, t));
        const waveOsc = Math.sin(t * 11.5) * env;
        target.rightArmRotZ = THREE.MathUtils.lerp(0.34, 1.48, env) + waveOsc * 0.16;
        target.rightArmRotX = THREE.MathUtils.lerp(-0.04, -0.32, env);
        target.headRotZ = -0.1 * env + waveOsc * 0.025;
        target.headRotY = 0.1 * env;
        target.upperRotZ = -0.05 * env;
        target.upperY = HIP_PIVOT_Y + Math.abs(waveOsc) * 0.035;
        break;
      }

      case 'bounce': {
        const duration = 2.4;
        if (t >= duration) {
          this.setAction('work');
          break;
        }
        const hopPhase = (t / duration) * 3 * Math.PI;
        const hopSin = Math.max(0, Math.sin(hopPhase));
        const squat = Math.max(0, -Math.sin(hopPhase * 2.0)) * 0.04;
        target.robotY = Math.pow(hopSin, 0.78) * 0.52;
        target.upperY = HIP_PIVOT_Y - squat;
        target.robotScaleY = 1.0 + hopSin * 0.035 - squat * 0.6;
        target.robotScaleX = 1.0 - hopSin * 0.018 + squat * 0.4;
        target.robotScaleZ = 1.0 - hopSin * 0.018 + squat * 0.4;
        target.leftArmRotZ = -0.33 - hopSin * 0.58;
        target.rightArmRotZ = 0.33 + hopSin * 0.58;
        target.headRotX = -hopSin * 0.1;
        break;
      }

      case 'dance': {
        const duration = 4.8;
        if (t >= duration) {
          this.setAction('work');
          break;
        }
        const env =
          smoothstepRobot(0.0, 0.3, t) * (1.0 - smoothstepRobot(duration - 0.4, duration, t));
        const beat = t * 6.2;
        const sway = Math.sin(beat);
        const bounce = Math.abs(Math.sin(beat * 2.0));
        target.robotX = sway * 0.18 * env;
        target.upperY = HIP_PIVOT_Y + bounce * 0.11 * env;
        target.upperRotZ = -sway * 0.12 * env;
        target.upperRotY = Math.cos(beat) * 0.18 * env;
        target.headRotZ = sway * 0.16 * env;
        target.headRotY = -Math.sin(beat) * 0.15 * env;
        target.leftArmRotZ = -0.33 - (0.65 + 0.45 * Math.sin(beat)) * env;
        target.rightArmRotZ = 0.33 + (0.65 - 0.45 * Math.sin(beat)) * env;
        target.leftLegRotX = Math.max(0, sway) * -0.22 * env;
        target.rightLegRotX = Math.max(0, -sway) * -0.22 * env;
        target.leftLegY = HIP_PIVOT_Y + Math.max(0, sway) * 0.08 * env;
        target.rightLegY = HIP_PIVOT_Y + Math.max(0, -sway) * 0.08 * env;
        break;
      }

      case 'bow': {
        const duration = 2.8;
        if (t >= duration) {
          this.setAction('work');
          break;
        }
        const env =
          smoothstepRobot(0.0, 0.7, t) * (1.0 - smoothstepRobot(duration - 0.75, duration, t));
        target.upperRotX = 0.42 * env;
        target.headRotX = 0.22 * env;
        target.leftArmRotX = 0.2 * env;
        target.rightArmRotX = 0.2 * env;
        target.leftArmRotZ = -0.33 - 0.12 * env;
        target.rightArmRotZ = 0.33 + 0.12 * env;
        break;
      }

      case 'curious': {
        const duration = 2.8;
        if (t >= duration) {
          this.setAction('work');
          break;
        }
        const env =
          smoothstepRobot(0.0, 0.5, t) * (1.0 - smoothstepRobot(duration - 0.55, duration, t));
        target.headRotZ = -0.26 * env;
        target.headRotY = 0.14 * env;
        target.headRotX = -0.06 * env;
        target.upperRotZ = -0.07 * env;
        target.leftArmRotZ = -0.33 - 0.18 * env;
        target.rightArmRotZ = 0.33 + 0.08 * env;
        break;
      }

      case 'sleep': {
        const slowBreath = Math.sin(t * 1.15);
        target.headRotX = 0.22 + slowBreath * 0.04;
        target.upperRotX = 0.05 + slowBreath * 0.015;
        target.upperY = HIP_PIVOT_Y + slowBreath * 0.015;
        const zzz = this.parts.headGroup.userData.sleepZzzGroup;
        if (zzz && zzz.visible) {
          zzz.userData.items.forEach((item: THREE.Group, idx: number) => {
            const cycle = (t * 0.55 + idx * 0.33) % 1.0;
            item.position.x = 1.25 + idx * 0.35 + cycle * 0.65 + Math.sin(t * 2.2 + idx) * 0.08;
            item.position.y = 2.35 + cycle * 1.55;
            const scalePulse = Math.sin(cycle * Math.PI) * (0.65 + idx * 0.22);
            item.scale.setScalar(Math.max(0.001, scalePulse));
            item.rotation.z = Math.sin(t * 1.8 + idx) * 0.15;
          });
        }
        break;
      }

      case 'celebrate': {
        const duration = 3.2;
        if (t >= duration) {
          this.setAction('work');
          break;
        }
        const env =
          smoothstepRobot(0.0, 0.35, t) * (1.0 - smoothstepRobot(duration - 0.45, duration, t));
        const cheerHop = Math.max(0, Math.sin(t * 8.5)) * env;
        target.robotY = cheerHop * 0.36;
        target.leftArmRotZ = THREE.MathUtils.lerp(-0.34, -1.52, env) - cheerHop * 0.12;
        target.rightArmRotZ = THREE.MathUtils.lerp(0.34, 1.52, env) + cheerHop * 0.12;
        target.leftArmRotX = -0.25 * env;
        target.rightArmRotX = -0.25 * env;
        target.headRotX = -0.14 * env - cheerHop * 0.06;
        target.headRotZ = Math.sin(t * 6.0) * 0.08 * env;
        break;
      }
    }

    // Keep seated PC employees (PIXEL & ORBIT) in a natural seated leg posture when on their chair
    if (this.config.isSeatedAtDesk && this.currentAction !== 'patrol') {
      target.leftLegY = HIP_PIVOT_Y + 0.08;
      target.leftLegRotX = -1.18;
      target.leftLegRotZ = -0.1;
      target.rightLegY = HIP_PIVOT_Y + 0.08;
      target.rightLegRotX = -1.18;
      target.rightLegRotZ = 0.1;
    }

    target.headY += this.exprCtrl.state.exprHeadReactionY;
    target.headRotZ += this.exprCtrl.state.exprHeadReactionZ;

    const blend = Math.min(1.0, dt * 12.5);
    for (const key of Object.keys(this.pose) as Array<keyof RobotPoseState>) {
      this.pose[key] = THREE.MathUtils.lerp(this.pose[key], target[key], blend);
    }

    const p = this.pose;
    const {
      robotGroup,
      upperBodyGroup,
      headGroup,
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
    } = this.parts;

    robotGroup.position.set(p.robotX, p.robotY, 0);
    robotGroup.rotation.y = p.robotRotY;
    robotGroup.scale.set(p.robotScaleX, p.robotScaleY, p.robotScaleZ);

    upperBodyGroup.position.y = p.upperY;
    upperBodyGroup.rotation.set(p.upperRotX, p.upperRotY, p.upperRotZ);

    headGroup.position.y = p.headY;
    headGroup.rotation.set(p.headRotX, p.headRotY, p.headRotZ);

    leftArmGroup.userData.limbPivot.rotation.set(p.leftArmRotX, p.leftArmRotY, p.leftArmRotZ);
    rightArmGroup.userData.limbPivot.rotation.set(p.rightArmRotX, p.rightArmRotY, p.rightArmRotZ);

    leftLegGroup.position.y = p.leftLegY;
    leftLegGroup.rotation.set(p.leftLegRotX, 0, p.leftLegRotZ);
    rightLegGroup.position.y = p.rightLegY;
    rightLegGroup.rotation.set(p.rightLegRotX, 0, p.rightLegRotZ);

    if (leftLegGroup.userData.footGroup) {
      leftLegGroup.userData.footGroup.rotation.x = -p.leftLegRotX * 0.45;
    }
    if (rightLegGroup.userData.footGroup) {
      rightLegGroup.userData.footGroup.rotation.x = -p.rightLegRotX * 0.45;
    }
  }
}
