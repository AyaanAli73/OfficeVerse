import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export interface DynamicSceneUpdatables {
  auraDashboardCursor: THREE.Group;
  codingFloatPanel: THREE.Group;
  pcFloatPreview: THREE.Group;
  boardLaserCursor: THREE.Group;
}

export function buildPastelOfficeEnvironment(
  scene: THREE.Scene,
  registerMat: <T extends THREE.Material>(mat: T) => T
) {
  // Subtle procedural noise/bump texture for fabric and upholstery
  function createFabricTexture(baseHex: string, contrast = 18, size = 128) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * contrast;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Embossed botanical/scroll woven texture for the soft gray area rugs
  function createRugTexture(baseHex = '#b8b0b5') {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(132, 122, 128, 0.34)';
    ctx.lineWidth = 4.5;
    for (let gx = 32; gx < 512; gx += 64) {
      for (let gy = 32; gy < 512; gy += 64) {
        ctx.beginPath();
        ctx.arc(gx, gy, 21, 0, Math.PI * 1.65);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(gx + 10, gy - 8, 9, 0, Math.PI * 1.4);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 2 + Math.random() * 6;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(240,235,238,0.22)' : 'rgba(105,96,102,0.22)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 1.3);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Rich warm honey-oak wood grain texture
  function createOakGrainTexture(baseHex = '#df9f66') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 128);

    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(148, 82, 28, 0.12)' : 'rgba(255, 218, 178, 0.12)';
      const y = Math.random() * 128;
      ctx.fillRect(0, y, 512, 1 + Math.random() * 2.6);
    }

    ctx.strokeStyle = 'rgba(138, 76, 24, 0.10)';
    ctx.lineWidth = 1.8;
    for (let k = 0; k < 12; k++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 128;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60 + Math.random() * 95, 8 + Math.random() * 15, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(115, 62, 18, 0.22)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, 510, 126);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  const oakTex1 = createOakGrainTexture('#e2a36b');
  const oakTex2 = createOakGrainTexture('#d8965c');
  const oakTex3 = createOakGrainTexture('#e7ab74');
  const oakTex4 = createOakGrainTexture('#d18e54');

  const MAT = {
    wallWhite: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0xeae1dc,
        roughness: 0.62,
        metalness: 0.01,
      })
    ),
    furnitureWhite: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0xf2eae4,
        roughness: 0.45,
        metalness: 0.02,
      })
    ),
    softGrayTrim: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0x8d94a2,
        roughness: 0.5,
        metalness: 0.08,
      })
    ),
    platformGray: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0x747b8a,
        roughness: 0.55,
        metalness: 0.1,
      })
    ),
    pastelPink: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0xec82a6,
        roughness: 0.46,
        metalness: 0.02,
      })
    ),
    pastelPinkFabric: registerMat(
      new THREE.MeshStandardMaterial({
        map: createFabricTexture('#e87a9f', 16),
        roughness: 0.78,
        metalness: 0.0,
      })
    ),
    deepPink: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0xd9648a,
        roughness: 0.5,
        metalness: 0.02,
      })
    ),
    lavenderFabric: registerMat(
      new THREE.MeshStandardMaterial({
        map: createFabricTexture('#926fe2', 16),
        roughness: 0.78,
        metalness: 0.0,
      })
    ),
    sofaFabric: registerMat(
      new THREE.MeshStandardMaterial({
        map: createFabricTexture('#dfd6d9', 14),
        roughness: 0.82,
        metalness: 0.0,
      })
    ),
    rugGray: registerMat(
      new THREE.MeshStandardMaterial({
        map: createRugTexture('#b7afb4'),
        bumpMap: createRugTexture('#808080'),
        bumpScale: 0.018,
        roughness: 0.9,
        metalness: 0.0,
      })
    ),
    oakPlanks: [
      registerMat(new THREE.MeshStandardMaterial({ map: oakTex1, roughness: 0.46, metalness: 0.02 })),
      registerMat(new THREE.MeshStandardMaterial({ map: oakTex2, roughness: 0.48, metalness: 0.02 })),
      registerMat(new THREE.MeshStandardMaterial({ map: oakTex3, roughness: 0.44, metalness: 0.02 })),
      registerMat(new THREE.MeshStandardMaterial({ map: oakTex4, roughness: 0.5, metalness: 0.02 })),
    ],
    paleWood: registerMat(
      new THREE.MeshStandardMaterial({
        map: oakTex3,
        color: 0xedd0b0,
        roughness: 0.48,
        metalness: 0.02,
      })
    ),
    darkMetal: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0x1e2129,
        roughness: 0.3,
        metalness: 0.65,
      })
    ),
    charcoalPlastic: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0x262a34,
        roughness: 0.36,
        metalness: 0.2,
      })
    ),
    chromeMetal: registerMat(
      new THREE.MeshStandardMaterial({
        color: 0xd8dde6,
        roughness: 0.2,
        metalness: 0.85,
      })
    ),
    glassBlue: registerMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x8ce0fa,
        transparent: true,
        opacity: 0.28,
        roughness: 0.08,
        metalness: 0.05,
        reflectivity: 0.92,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    ),
    glassEdge: registerMat(
      new THREE.MeshBasicMaterial({
        color: 0x56d4f8,
        transparent: true,
        opacity: 0.82,
      })
    ),
    warmLed: registerMat(
      new THREE.MeshBasicMaterial({
        color: 0xffe8b8,
      })
    ),
    leafGreens: [
      registerMat(new THREE.MeshStandardMaterial({ color: 0x467e27, roughness: 0.38, side: THREE.DoubleSide })),
      registerMat(new THREE.MeshStandardMaterial({ color: 0x5d9936, roughness: 0.35, side: THREE.DoubleSide })),
      registerMat(new THREE.MeshStandardMaterial({ color: 0x33641b, roughness: 0.42, side: THREE.DoubleSide })),
      registerMat(new THREE.MeshStandardMaterial({ color: 0x74b048, roughness: 0.36, side: THREE.DoubleSide })),
    ],
    soilDark: registerMat(new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 })),
    potBeige: registerMat(new THREE.MeshStandardMaterial({ color: 0xe3cdb8, roughness: 0.48 })),
    potTerracotta: registerMat(new THREE.MeshStandardMaterial({ color: 0xc2855c, roughness: 0.52 })),
    holoCyanGlow: registerMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.88,
      })
    ),
    holoPinkGlow: registerMat(
      new THREE.MeshBasicMaterial({
        color: 0xf472b6,
        transparent: true,
        opacity: 0.88,
      })
    ),
    holoVioletGlow: registerMat(
      new THREE.MeshBasicMaterial({
        color: 0xa78bfa,
        transparent: true,
        opacity: 0.85,
      })
    ),
  };

  const roundedBoxCache = new Map<string, RoundedBoxGeometry>();
  function createRoundedBox(
    w: number,
    h: number,
    d: number,
    radius = 0.04,
    segments = 3,
    material: THREE.Material = MAT.furnitureWhite,
    castShadow = true,
    receiveShadow = true
  ) {
    const r = Math.min(radius, w * 0.45, h * 0.45, d * 0.45);
    const key = `${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}_${r.toFixed(3)}_${segments}`;
    let geom = roundedBoxCache.get(key);
    if (!geom) {
      geom = new RoundedBoxGeometry(w, h, d, segments, r);
      roundedBoxCache.set(key, geom);
    }
    const mesh = new THREE.Mesh(geom, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    return mesh;
  }

  // Contact shadow helper
  const shadowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    g.addColorStop(0, 'rgba(32, 18, 10, 0.56)');
    g.addColorStop(0.55, 'rgba(32, 18, 10, 0.24)');
    g.addColorStop(1, 'rgba(32, 18, 10, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });

  function addContactShadow(
    parent: THREE.Object3D,
    w: number,
    d: number,
    x = 0,
    y = 0.004,
    z = 0,
    opacity = 0.92
  ) {
    const m = contactShadowMat.clone();
    m.opacity = opacity;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, y, z);
    parent.add(plane);
    return plane;
  }

  // Warm 3000K glow decal
  const warmGlowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(255, 165, 45, 0.68)');
    g.addColorStop(0.45, 'rgba(255, 138, 25, 0.30)');
    g.addColorStop(1, 'rgba(255, 120, 15, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  function addWarmGlowPool(
    parent: THREE.Object3D,
    w: number,
    d: number,
    x = 0,
    y = 0.006,
    z = 0,
    opacity = 0.85
  ) {
    const mat = new THREE.MeshBasicMaterial({
      map: warmGlowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, y, z);
    parent.add(plane);
    return plane;
  }

  function addWallWarmGlow(
    parent: THREE.Object3D,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    opacity = 0.72
  ) {
    const mat = new THREE.MeshBasicMaterial({
      map: warmGlowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    plane.position.set(x, y, z);
    plane.rotation.y = rotY;
    parent.add(plane);
    return plane;
  }

  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xff9824,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  function createLedStrip(
    w: number,
    h: number,
    d: number,
    withLight = false,
    lightIntensity = 1.15,
    lightDistance = 3.2
  ) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MAT.warmLed);
    core.castShadow = false;
    group.add(core);

    const halo = new THREE.Mesh(new THREE.BoxGeometry(w + 0.035, h + 0.035, d + 0.035), haloMat);
    halo.castShadow = false;
    group.add(halo);

    if (withLight) {
      const pl = new THREE.PointLight(0xff9626, lightIntensity, lightDistance, 1.7);
      group.add(pl);
    }
    return group;
  }

  // Procedural Canvas Screen Textures
  function createCanvasScreenTexture(type: 'dashboard' | 'code' | 'design' | 'art' | 'holo', flipX = true) {
    const canvas = document.createElement('canvas');
    if (type === 'dashboard') {
      canvas.width = 1400;
      canvas.height = 560;
    } else if (type === 'holo') {
      canvas.width = 1024;
      canvas.height = 580;
    } else {
      canvas.width = 640;
      canvas.height = 380;
    }
    const ctx = canvas.getContext('2d')!;

    const drawRoundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      fill: string | CanvasGradient | null,
      stroke: string | null = null
    ) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    if (type === 'dashboard') {
      const bgGrad = ctx.createLinearGradient(0, 0, 1400, 560);
      bgGrad.addColorStop(0, '#5a52a5');
      bgGrad.addColorStop(0.5, '#7c6fd6');
      bgGrad.addColorStop(1, '#5d6ce0');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1400, 560);

      drawRoundRect(22, 22, 310, 516, 20, '#232442');
      const avatarColors = ['#ff85b3', '#5ce1e6', '#a480f2', '#ffc857', '#ff85b3', '#6ee7b7', '#93c5fd'];
      for (let i = 0; i < 7; i++) {
        const ry = 46 + i * 68;
        drawRoundRect(38, ry, 278, 54, 12, 'rgba(255,255,255,0.06)');
        ctx.beginPath();
        ctx.arc(66, ry + 27, 15, 0, Math.PI * 2);
        ctx.fillStyle = avatarColors[i];
        ctx.fill();
        drawRoundRect(94, ry + 14, 110 + (i % 3) * 20, 9, 4, 'rgba(255,255,255,0.85)');
        drawRoundRect(94, ry + 31, 75, 7, 3, 'rgba(180,185,230,0.5)');
        drawRoundRect(268, ry + 20, 32, 14, 7, i % 2 === 0 ? '#5ce1e6' : '#f48fb1');
      }

      drawRoundRect(354, 22, 540, 315, 22, '#f4f0ff');
      drawRoundRect(384, 48, 160, 16, 8, '#c7b8f5');
      drawRoundRect(384, 74, 100, 10, 5, '#dcd3fa');
      drawRoundRect(770, 46, 95, 28, 10, '#e5dcff');

      const bars = [
        { h: 155, c: '#ff7eb6' },
        { h: 120, c: '#9b72f2' },
        { h: 95, c: '#ff9ebb' },
        { h: 175, c: '#6bd5e1' },
        { h: 110, c: '#ffb36b' },
        { h: 85, c: '#ff7eb6' },
        { h: 135, c: '#8465e6' },
        { h: 105, c: '#5ec9dc' },
        { h: 165, c: '#7a5af8' },
      ];
      const baseBarY = 302;
      bars.forEach((b, idx) => {
        const bx = 392 + idx * 52;
        drawRoundRect(bx, baseBarY - b.h, 28, b.h, 7, b.c);
      });

      drawRoundRect(354, 355, 540, 183, 22, '#f4f0ff');
      ctx.fillStyle = '#5c548a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('04', 388, 425);
      drawRoundRect(450, 398, 220, 14, 7, '#d5c8f7');
      drawRoundRect(450, 422, 140, 10, 5, '#e2d9fc');
      drawRoundRect(388, 470, 470, 22, 11, '#e2d9fc');
      const pGrad = ctx.createLinearGradient(388, 0, 740, 0);
      pGrad.addColorStop(0, '#5ce1e6');
      pGrad.addColorStop(0.6, '#9b72f2');
      pGrad.addColorStop(1, '#ff7eb6');
      drawRoundRect(388, 470, 360, 22, 11, pGrad);

      drawRoundRect(914, 22, 464, 315, 22, '#f4f0ff');
      drawRoundRect(944, 48, 140, 14, 7, '#c7b8f5');
      const cx = 1045,
        cy = 195,
        r = 88;
      const slices = [
        { start: 0, end: 1.8, color: '#38bdf8' },
        { start: 1.8, end: 3.1, color: '#a855f7' },
        { start: 3.1, end: 4.5, color: '#fb7185' },
        { start: 4.5, end: Math.PI * 2, color: '#34d399' },
      ];
      slices.forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, s.start, s.end);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = '#f4f0ff';
        ctx.lineWidth = 4;
        ctx.stroke();
      });
      for (let i = 0; i < 6; i++) {
        const ly = 95 + i * 34;
        drawRoundRect(1175, ly, 26, 12, 6, slices[i % slices.length].color);
        drawRoundRect(1212, ly, 130, 12, 6, '#d8cdf7');
      }

      drawRoundRect(914, 355, 464, 183, 22, '#f4f0ff');
      ctx.beginPath();
      ctx.arc(1010, 446, 52, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff85b3';
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1010, 446, 52, -0.8, 1.5);
      ctx.strokeStyle = '#6bd5e1';
      ctx.lineWidth = 18;
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        const ry = 388 + i * 32;
        drawRoundRect(1105, ry, 235, 14, 7, '#e2d9fc');
        drawRoundRect(1105, ry, 90 + ((i * 35) % 130), 14, 7, i % 2 === 0 ? '#a855f7' : '#fb7185');
      }
    } else if (type === 'code') {
      ctx.fillStyle = '#181a26';
      ctx.fillRect(0, 0, 640, 380);
      ctx.fillStyle = '#12131d';
      ctx.fillRect(0, 0, 56, 380);
      ctx.fillRect(56, 0, 584, 28);
      ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => {
        ctx.beginPath();
        ctx.arc(18 + i * 14, 14, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
      });
      const codeColors = ['#ff79c6', '#8be9fd', '#bd93f9', '#50fa7b', '#f1fa8c', '#ffb86c'];
      for (let line = 0; line < 19; line++) {
        const y = 44 + line * 17;
        drawRoundRect(68, y, 14, 6, 2, 'rgba(255,255,255,0.18)');
        let x = 96 + (line % 4) * 18;
        const segments = 2 + (line % 4);
        for (let s = 0; s < segments; s++) {
          const w = 28 + ((line * 19 + s * 31) % 75);
          const col = codeColors[(line + s) % codeColors.length];
          drawRoundRect(x, y, w, 7, 3, col);
          x += w + 10;
        }
      }
    } else if (type === 'design') {
      ctx.fillStyle = '#1d2030';
      ctx.fillRect(0, 0, 640, 380);
      drawRoundRect(16, 16, 95, 348, 10, '#262a3d');
      drawRoundRect(495, 16, 129, 348, 10, '#262a3d');
      const cGrad = ctx.createLinearGradient(128, 30, 478, 320);
      cGrad.addColorStop(0, '#4c3b78');
      cGrad.addColorStop(1, '#2b244d');
      drawRoundRect(126, 28, 354, 260, 14, cGrad);

      ctx.beginPath();
      ctx.moveTo(126, 288);
      ctx.lineTo(126, 205);
      ctx.lineTo(215, 125);
      ctx.lineTo(295, 195);
      ctx.lineTo(385, 105);
      ctx.lineTo(480, 185);
      ctx.lineTo(480, 288);
      ctx.closePath();
      const mGrad = ctx.createLinearGradient(126, 105, 126, 288);
      mGrad.addColorStop(0, '#ff80b5');
      mGrad.addColorStop(1, '#9b6bff');
      ctx.fillStyle = mGrad;
      ctx.fill();

      const swatches = ['#ff7eb6', '#7afcff', '#feff9c', '#b28dff', '#ff9cee', '#6eb5ff'];
      swatches.forEach((col, i) => {
        const sx = 512 + (i % 2) * 52;
        const sy = 40 + Math.floor(i / 2) * 48;
        drawRoundRect(sx, sy, 42, 34, 6, col);
      });
      drawRoundRect(126, 302, 354, 58, 10, '#262a3d');
      drawRoundRect(142, 318, 220, 10, 5, '#5ce1e6');
      drawRoundRect(142, 336, 290, 10, 5, '#ff7eb6');
    } else if (type === 'art') {
      const grad = ctx.createLinearGradient(0, 0, 0, 380);
      grad.addColorStop(0, '#fce4ec');
      grad.addColorStop(0.55, '#f8bbd0');
      grad.addColorStop(1, '#f48fb1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 380);

      ctx.beginPath();
      ctx.arc(460, 110, 44, 0, Math.PI * 2);
      ctx.fillStyle = '#fff5f8';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 380);
      ctx.lineTo(0, 230);
      ctx.quadraticCurveTo(140, 130, 290, 220);
      ctx.quadraticCurveTo(440, 110, 640, 210);
      ctx.lineTo(640, 380);
      ctx.closePath();
      ctx.fillStyle = '#f06292';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 380);
      ctx.lineTo(0, 290);
      ctx.quadraticCurveTo(210, 185, 410, 285);
      ctx.quadraticCurveTo(530, 235, 640, 270);
      ctx.lineTo(640, 380);
      ctx.closePath();
      ctx.fillStyle = '#d81b60';
      ctx.fill();
    } else if (type === 'holo') {
      // Translucent Futuristic Holographic Planning Screen Texture
      ctx.clearRect(0, 0, 1024, 580);
      const hGrad = ctx.createLinearGradient(0, 0, 1024, 580);
      hGrad.addColorStop(0, 'rgba(14, 116, 144, 0.36)');
      hGrad.addColorStop(0.5, 'rgba(76, 29, 149, 0.34)');
      hGrad.addColorStop(1, 'rgba(190, 24, 93, 0.36)');
      drawRoundRect(8, 8, 1008, 564, 28, hGrad, 'rgba(56, 189, 248, 0.85)');

      // Holographic grid lines
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.16)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < 1000; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 20);
        ctx.lineTo(gx, 560);
        ctx.stroke();
      }
      for (let gy = 40; gy < 560; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(20, gy);
        ctx.lineTo(1000, gy);
        ctx.stroke();
      }

      // Top Holo Header Bar
      drawRoundRect(34, 28, 956, 54, 14, 'rgba(15, 23, 42, 0.62)', 'rgba(56, 189, 248, 0.6)');
      ctx.fillStyle = '#67e8f9';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('HOLO-PLANNER // SPATIAL ARCHITECTURE MATRIX', 58, 62);

      // Left Panel: 3D Node Topology Graph
      drawRoundRect(34, 100, 440, 446, 18, 'rgba(15, 23, 42, 0.52)', 'rgba(244, 114, 182, 0.65)');
      const nodes = [
        [140, 210],
        [280, 175],
        [375, 260],
        [245, 320],
        [135, 410],
        [345, 435],
      ];
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 3;
      nodes.forEach(([nx, ny], i) => {
        const [tx, ty] = nodes[(i + 1) % nodes.length];
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      });
      nodes.forEach(([nx, ny], i) => {
        ctx.beginPath();
        ctx.arc(nx, ny, 16, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#f472b6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Right Top Panel: Sprint Gantt & Waveforms
      drawRoundRect(496, 100, 494, 220, 18, 'rgba(15, 23, 42, 0.52)', 'rgba(167, 139, 250, 0.65)');
      const holoBars = [
        { y: 132, w: 340, c: '#38bdf8' },
        { y: 172, w: 410, c: '#f472b6' },
        { y: 212, w: 280, c: '#a78bfa' },
        { y: 252, w: 390, c: '#34d399' },
      ];
      holoBars.forEach((hb) => {
        drawRoundRect(524, hb.y, 430, 22, 11, 'rgba(255,255,255,0.12)');
        drawRoundRect(524, hb.y, hb.w, 22, 11, hb.c);
      });

      // Right Bottom Panel: Circular Radar & Sync Ring
      drawRoundRect(496, 338, 494, 208, 18, 'rgba(15, 23, 42, 0.52)', 'rgba(56, 189, 248, 0.65)');
      ctx.beginPath();
      ctx.arc(610, 442, 68, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(610, 442, 46, -0.5, 2.4);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 10;
      ctx.stroke();

      for (let k = 0; k < 4; k++) {
        drawRoundRect(715, 368 + k * 38, 240, 18, 9, k % 2 === 0 ? '#67e8f9' : '#f472b6');
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    if (flipX) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.x = -1;
    }
    return texture;
  }

  const TEX_DASHBOARD = createCanvasScreenTexture('dashboard', true);
  const TEX_CODE = createCanvasScreenTexture('code', true);
  const TEX_DESIGN = createCanvasScreenTexture('design', true);
  const TEX_ART = createCanvasScreenTexture('art', true);
  const TEX_HOLO = createCanvasScreenTexture('holo', false);

  // Leaf geometries
  function createLeafGeometry(length = 0.28, width = 0.11, curve = 0.08) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(width, length * 0.45, 0, length);
    shape.quadraticCurveTo(-width, length * 0.45, 0, 0);
    const geom = new THREE.ShapeGeometry(shape, 6);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = y / length;
      const z = -Math.pow(t, 1.7) * curve;
      pos.setZ(i, z);
    }
    geom.computeVertexNormals();
    return geom;
  }

  const LEAF_GEOM_SMALL = createLeafGeometry(0.18, 0.065, 0.05);
  const LEAF_GEOM_MED = createLeafGeometry(0.34, 0.12, 0.11);
  const LEAF_GEOM_LARGE = createLeafGeometry(0.55, 0.19, 0.18);
  const LEAF_GEOM_VINE = createLeafGeometry(0.11, 0.055, 0.02);

  function createPot(
    radiusTop = 0.16,
    radiusBottom = 0.12,
    height = 0.26,
    potMat: THREE.Material = MAT.furnitureWhite
  ) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 18),
      potMat
    );
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(radiusTop * 0.98, radiusTop * 0.08, 8, 18),
      potMat
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = height - 0.01;
    group.add(rim);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop * 0.92, radiusTop * 0.92, 0.03, 14),
      MAT.soilDark
    );
    soil.position.y = height - 0.02;
    group.add(soil);

    return group;
  }

  function createPlant(options: {
    type?: 'small' | 'succulent' | 'medium' | 'tall' | 'hanging';
    potColor?: 'white' | 'pink' | 'beige' | 'terracotta';
    scale?: number;
    vineLength?: number;
  } = {}) {
    const { type = 'medium', potColor = 'white', scale = 1.0, vineLength = 0.9 } = options;

    const group = new THREE.Group();
    const potMat =
      potColor === 'pink'
        ? MAT.pastelPink
        : potColor === 'beige'
        ? MAT.potBeige
        : potColor === 'terracotta'
        ? MAT.potTerracotta
        : MAT.furnitureWhite;

    if (type === 'small' || type === 'succulent') {
      const potH = 0.16;
      const pot = createPot(0.095, 0.075, potH, potMat);
      group.add(pot);

      const count = type === 'succulent' ? 14 : 9;
      for (let i = 0; i < count; i++) {
        const leaf = new THREE.Mesh(LEAF_GEOM_SMALL, MAT.leafGreens[i % MAT.leafGreens.length]);
        leaf.castShadow = true;
        const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.3;
        const tilt = type === 'succulent' ? 0.35 + (i % 3) * 0.22 : 0.25 + (i % 4) * 0.18;
        leaf.position.set(0, potH - 0.01, 0);
        leaf.rotation.order = 'YXZ';
        leaf.rotation.y = angle;
        leaf.rotation.x = tilt;
        const s = 0.65 + (i % 3) * 0.2;
        leaf.scale.set(s, s, s);
        group.add(leaf);
      }
    } else if (type === 'medium') {
      const potH = 0.26;
      const pot = createPot(0.15, 0.115, potH, potMat);
      group.add(pot);

      const count = 13;
      for (let i = 0; i < count; i++) {
        const leaf = new THREE.Mesh(LEAF_GEOM_MED, MAT.leafGreens[i % MAT.leafGreens.length]);
        leaf.castShadow = true;
        const angle = (i / count) * Math.PI * 2 + Math.sin(i * 2.1) * 0.2;
        const layer = i % 3;
        leaf.position.set(Math.cos(angle) * 0.02, potH, Math.sin(angle) * 0.02);
        leaf.rotation.order = 'YXZ';
        leaf.rotation.y = angle;
        leaf.rotation.x = 0.22 + layer * 0.24;
        const s = 0.8 + layer * 0.16;
        leaf.scale.set(s, s, s);
        group.add(leaf);
      }
    } else if (type === 'tall') {
      const potH = 0.38;
      const pot = createPot(0.22, 0.16, potH, potMat);
      group.add(pot);

      const count = 16;
      for (let i = 0; i < count; i++) {
        const leaf = new THREE.Mesh(LEAF_GEOM_LARGE, MAT.leafGreens[i % MAT.leafGreens.length]);
        leaf.castShadow = true;
        const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.18;
        const layer = i % 4;
        leaf.position.set(Math.cos(angle) * 0.03, potH + 0.02, Math.sin(angle) * 0.03);
        leaf.rotation.order = 'YXZ';
        leaf.rotation.y = angle;
        leaf.rotation.x = 0.18 + layer * 0.2;
        const s = 0.82 + (3 - layer) * 0.14;
        leaf.scale.set(s, s, s);
        group.add(leaf);
      }
    } else if (type === 'hanging') {
      const potH = 0.22;
      const pot = createPot(0.14, 0.105, potH, potMat);
      group.add(pot);

      for (let i = 0; i < 12; i++) {
        const leaf = new THREE.Mesh(LEAF_GEOM_SMALL, MAT.leafGreens[i % MAT.leafGreens.length]);
        leaf.castShadow = true;
        const angle = (i / 12) * Math.PI * 2;
        leaf.position.set(0, potH, 0);
        leaf.rotation.order = 'YXZ';
        leaf.rotation.y = angle;
        leaf.rotation.x = 0.3 + (i % 3) * 0.25;
        group.add(leaf);
      }

      const vineStrands = 6;
      for (let v = 0; v < vineStrands; v++) {
        const strandAngle = -0.5 + (v / (vineStrands - 1)) * 1.8;
        const startX = Math.cos(strandAngle) * 0.13;
        const startZ = Math.sin(strandAngle) * 0.13;
        const leavesInStrand = 8 + (v % 4) * 3;
        const strandLen = vineLength * (0.65 + (v % 3) * 0.22);

        for (let k = 0; k < leavesInStrand; k++) {
          const t = k / leavesInStrand;
          const vLeaf = new THREE.Mesh(
            LEAF_GEOM_VINE,
            MAT.leafGreens[(v + k) % MAT.leafGreens.length]
          );
          vLeaf.castShadow = true;
          const sway = Math.sin(t * Math.PI * 3 + v) * 0.03;
          vLeaf.position.set(
            startX * (1 + t * 0.35) + sway,
            potH - t * strandLen,
            startZ * (1 + t * 0.35) + sway
          );
          vLeaf.rotation.set(Math.PI * 0.65 + (k % 2) * 0.25, strandAngle + k * 0.7, 0.2);
          group.add(vLeaf);
        }
      }
    }

    group.scale.setScalar(scale);
    return group;
  }

  function createOfficeChair(forRobotSeat = false) {
    const chair = new THREE.Group();
    addContactShadow(chair, 0.82, 0.82, 0, 0.003, 0, 0.78);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.08, 14),
      MAT.furnitureWhite
    );
    hub.position.y = 0.09;
    chair.add(hub);

    const spokeLen = forRobotSeat ? 0.31 : 0.28;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spokeGroup = new THREE.Group();
      spokeGroup.rotation.y = angle;

      const spoke = createRoundedBox(0.042, 0.032, spokeLen, 0.01, 2, MAT.furnitureWhite);
      spoke.position.set(0, 0.075, spokeLen * 0.48);
      spoke.rotation.x = 0.12;
      spokeGroup.add(spoke);

      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12),
        MAT.darkMetal
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.032, spokeLen * 0.92);
      spokeGroup.add(wheel);

      chair.add(spokeGroup);
    }

    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.032, 0.32, 14),
      MAT.darkMetal
    );
    column.position.y = 0.24;
    chair.add(column);

    const seatW = forRobotSeat ? 0.62 : 0.52;
    const seatD = forRobotSeat ? 0.55 : 0.5;

    const seatShell = createRoundedBox(seatW, 0.055, seatD, 0.025, 3, MAT.furnitureWhite);
    seatShell.position.set(0, 0.41, 0.02);
    chair.add(seatShell);

    const seatCushion = createRoundedBox(
      seatW - 0.03,
      0.075,
      seatD - 0.03,
      0.035,
      3,
      MAT.pastelPinkFabric
    );
    seatCushion.position.set(0, 0.45, 0.02);
    chair.add(seatCushion);

    const backGroup = new THREE.Group();
    backGroup.position.set(0, 0.74, forRobotSeat ? -0.27 : -0.21);
    backGroup.rotation.x = -0.14;

    const backW = forRobotSeat ? 0.54 : 0.48;
    const backShell = createRoundedBox(backW, 0.58, 0.055, 0.025, 3, MAT.furnitureWhite);
    backGroup.add(backShell);

    const backCushion = createRoundedBox(backW - 0.04, 0.54, 0.055, 0.025, 3, MAT.pastelPinkFabric);
    backCushion.position.z = 0.025;
    backGroup.add(backCushion);

    const backBar = createRoundedBox(0.28, 0.045, 0.025, 0.01, 2, MAT.pastelPink);
    backBar.position.set(0, -0.1, -0.03);
    backGroup.add(backBar);

    chair.add(backGroup);

    const armX = forRobotSeat ? 0.335 : 0.255;
    [-1, 1].forEach((side) => {
      const armSupport = createRoundedBox(0.035, 0.2, 0.045, 0.012, 2, MAT.furnitureWhite);
      armSupport.position.set(side * armX, 0.52, -0.05);
      chair.add(armSupport);

      const armTop = createRoundedBox(0.055, 0.035, 0.26, 0.015, 2, MAT.furnitureWhite);
      armTop.position.set(side * armX, 0.61, 0.02);
      chair.add(armTop);
    });

    return chair;
  }

  function createMonitor(width = 0.76, height = 0.46, screenTexture = TEX_CODE) {
    const group = new THREE.Group();

    const base = createRoundedBox(0.24, 0.016, 0.18, 0.006, 2, MAT.darkMetal);
    base.position.y = 0.008;
    group.add(base);

    const neck = createRoundedBox(0.045, 0.22, 0.035, 0.008, 2, MAT.darkMetal);
    neck.position.set(0, 0.11, -0.03);
    neck.rotation.x = -0.08;
    group.add(neck);

    const bezel = createRoundedBox(width, height, 0.032, 0.012, 2, MAT.darkMetal);
    bezel.position.set(0, 0.16 + height / 2, 0);
    group.add(bezel);

    const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.035, height - 0.035),
      screenMat
    );
    screen.position.set(0, 0.16 + height / 2, 0.017);
    group.add(screen);

    return group;
  }

  function createKeyboardAndMouse(matWidth = 0.95, matDepth = 0.42) {
    const group = new THREE.Group();

    const pad = createRoundedBox(matWidth, 0.008, matDepth, 0.004, 2, MAT.pastelPink);
    pad.position.y = 0.004;
    group.add(pad);

    const kbGroup = new THREE.Group();
    kbGroup.position.set(-0.08, 0.016, 0.04);
    const kbBody = createRoundedBox(0.42, 0.02, 0.15, 0.006, 2, MAT.furnitureWhite);
    kbGroup.add(kbBody);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 11; c++) {
        const isAccent = c === 0 || c === 10 || (r === 3 && c === 5);
        const kMat = isAccent ? MAT.pastelPink : MAT.wallWhite;
        const key = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.024), kMat);
        key.position.set(-0.17 + c * 0.034, 0.012, -0.048 + r * 0.032);
        kbGroup.add(key);
      }
    }
    group.add(kbGroup);

    const mouse = createRoundedBox(0.065, 0.024, 0.105, 0.012, 3, MAT.furnitureWhite);
    mouse.position.set(0.24, 0.016, 0.04);
    group.add(mouse);

    return group;
  }

  function createMobilePedestal(w = 0.56, h = 0.62, d = 0.58, withUnderglow = true) {
    const group = new THREE.Group();
    addContactShadow(group, w + 0.14, d + 0.14);

    const body = createRoundedBox(w, h - 0.04, d, 0.025, 3, MAT.furnitureWhite);
    body.position.y = (h - 0.04) / 2 + 0.04;
    group.add(body);

    [0.21, 0.46].forEach((yPos) => {
      const drawer = createRoundedBox(w - 0.04, 0.22, 0.02, 0.008, 2, MAT.wallWhite);
      drawer.position.set(0, yPos, d / 2 + 0.005);
      group.add(drawer);

      const handle = createRoundedBox(0.11, 0.016, 0.02, 0.005, 2, MAT.softGrayTrim);
      handle.position.set(0, yPos + 0.05, d / 2 + 0.02);
      group.add(handle);
    });

    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].forEach(([sx, sz]) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.02, 10),
        MAT.darkMetal
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx * (w * 0.38), 0.022, sz * (d * 0.38));
      group.add(wheel);
    });

    if (withUnderglow) {
      const led = createLedStrip(w * 0.85, 0.02, d * 0.85, false);
      led.position.y = 0.025;
      group.add(led);
    }

    return group;
  }

  const BOOK_COLORS = [
    0xf48fb1, 0x9575cd, 0x4fc3f7, 0xffb74d, 0x81c784, 0xf06292, 0x7986cb, 0xffd54f,
  ].map((c) => registerMat(new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })));

  function createBookStack(count = 3, horizontal = true) {
    const group = new THREE.Group();
    if (horizontal) {
      let curY = 0;
      for (let i = 0; i < count; i++) {
        const bw = 0.24 - (i % 2) * 0.02;
        const bh = 0.042;
        const bd = 0.32 - (i % 2) * 0.02;
        const cover = createRoundedBox(bw, bh, bd, 0.006, 2, BOOK_COLORS[i % BOOK_COLORS.length]);
        cover.position.y = curY + bh / 2;
        cover.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.06;
        group.add(cover);
        curY += bh;
      }
    } else {
      let curX = 0;
      for (let i = 0; i < count; i++) {
        const bw = 0.042 + (i % 3) * 0.012;
        const bh = 0.24 + (i % 2) * 0.04;
        const bd = 0.22;
        const book = createRoundedBox(
          bw,
          bh,
          bd,
          0.005,
          2,
          BOOK_COLORS[(i * 2) % BOOK_COLORS.length]
        );
        book.position.set(curX + bw / 2, bh / 2, 0);
        if (i === count - 1 && count > 3) {
          book.rotation.z = -0.22;
          book.position.x += 0.03;
        }
        group.add(book);
        curX += bw + 0.006;
      }
    }
    return group;
  }

  function createPencilHolder() {
    const group = new THREE.Group();
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.046, 0.11, 14),
      MAT.furnitureWhite
    );
    cup.position.y = 0.055;
    cup.castShadow = true;
    group.add(cup);

    const pencilColors = [0xff8a65, 0xf06292, 0x4fc3f7, 0xffd54f, 0x9575cd, 0x81c784];
    for (let i = 0; i < 6; i++) {
      const pMat = registerMat(
        new THREE.MeshStandardMaterial({ color: pencilColors[i], roughness: 0.4 })
      );
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.15, 8), pMat);
      const angle = (i / 6) * Math.PI * 2;
      pencil.position.set(Math.cos(angle) * 0.022, 0.09, Math.sin(angle) * 0.022);
      pencil.rotation.set(Math.sin(angle) * 0.18, 0, -Math.cos(angle) * 0.18);
      group.add(pencil);
    }
    return group;
  }

  function createMug(colorMat: THREE.Material = MAT.pastelPink) {
    const group = new THREE.Group();
    const coaster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.008, 16),
      MAT.paleWood
    );
    coaster.position.y = 0.004;
    group.add(coaster);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.038, 0.085, 16),
      colorMat
    );
    body.position.y = 0.05;
    body.castShadow = true;
    group.add(body);

    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 8, 12), colorMat);
    handle.position.set(0.044, 0.05, 0);
    group.add(handle);
    return group;
  }

  function createDeskLamp() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.12, 0.025, 18),
      MAT.pastelPink
    );
    base.position.y = 0.0125;
    base.castShadow = true;
    group.add(base);

    const lowerArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.34, 10),
      MAT.pastelPink
    );
    lowerArm.position.set(-0.04, 0.17, 0);
    lowerArm.rotation.z = 0.25;
    group.add(lowerArm);

    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.26, 10),
      MAT.pastelPink
    );
    upperArm.position.set(0.02, 0.39, 0);
    upperArm.rotation.z = -0.55;
    group.add(upperArm);

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.14, 18, 1, true),
      MAT.pastelPink
    );
    shade.position.set(0.14, 0.42, 0);
    shade.rotation.z = -0.35;
    shade.castShadow = true;
    group.add(shade);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), MAT.warmLed);
    bulb.position.set(0.13, 0.39, 0);
    group.add(bulb);

    return group;
  }

  function createGlassPanel(width = 1.6, height = 1.45, thickness = 0.03) {
    const group = new THREE.Group();

    const pane = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), MAT.glassBlue);
    pane.position.y = height / 2;
    group.add(pane);

    const topEdge = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.012, thickness + 0.004),
      MAT.glassEdge
    );
    topEdge.position.y = height;
    group.add(topEdge);

    [-width / 2, width / 2].forEach((xPos) => {
      const post = createRoundedBox(0.045, height + 0.04, 0.055, 0.01, 2, MAT.softGrayTrim);
      post.position.set(xPos, (height + 0.04) / 2, 0);
      group.add(post);

      [height * 0.22, height * 0.78].forEach((yClip) => {
        const clip = createRoundedBox(0.075, 0.045, 0.065, 0.008, 2, MAT.darkMetal);
        clip.position.set(xPos, yClip, 0);
        group.add(clip);
      });
    });

    return group;
  }

  // Root Office Group with scale.x = -1 to align handedness with reference
  const officeGroup = new THREE.Group();
  officeGroup.name = 'PastelCoWorkingOffice';
  officeGroup.scale.x = -1;
  scene.add(officeGroup);

  // 1. Floor and Base
  const floorGroup = new THREE.Group();
  floorGroup.name = 'FloorPlatform';
  addContactShadow(floorGroup, 14.5, 13.8, 0, -0.39, 0, 0.65);

  const baseSlab = createRoundedBox(11.95, 0.34, 11.15, 0.16, 4, MAT.platformGray, true, true);
  baseSlab.position.set(0, -0.21, 0);
  floorGroup.add(baseSlab);

  const trimSlab = createRoundedBox(11.78, 0.12, 10.98, 0.12, 4, MAT.softGrayTrim, true, true);
  trimSlab.position.set(0, -0.08, 0);
  floorGroup.add(trimSlab);

  const floorWidth = 11.15;
  const floorDepth = 10.35;
  const numRows = 40;
  const plankDepth = floorDepth / numRows;

  for (let r = 0; r < numRows; r++) {
    const z = -floorDepth / 2 + (r + 0.5) * plankDepth;
    const split1 = -2.2 + ((r * 1.7) % 1.8);
    const split2 = 1.6 + ((r * 1.3) % 1.8);
    const segments = [
      [-floorWidth / 2, split1],
      [split1, split2],
      [split2, floorWidth / 2],
    ];

    segments.forEach(([xStart, xEnd], sIdx) => {
      const pw = xEnd - xStart - 0.012;
      const pd = plankDepth - 0.01;
      const mat = MAT.oakPlanks[(r + sIdx * 2) % MAT.oakPlanks.length];
      const plank = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.06, pd), mat);
      plank.position.set((xStart + xEnd) / 2, -0.03, z);
      plank.receiveShadow = true;
      floorGroup.add(plank);
    });
  }

  const stepGroup = new THREE.Group();
  stepGroup.position.set(0.55, 0, -5.25);

  const step1Base = createRoundedBox(1.85, 0.16, 0.42, 0.03, 2, MAT.platformGray);
  step1Base.position.set(0, -0.22, -0.15);
  stepGroup.add(step1Base);

  const step1Wood = createRoundedBox(1.8, 0.05, 0.38, 0.015, 2, MAT.oakPlanks[0]);
  step1Wood.position.set(0, -0.12, -0.15);
  stepGroup.add(step1Wood);

  const step2Base = createRoundedBox(1.92, 0.14, 0.42, 0.03, 2, MAT.platformGray);
  step2Base.position.set(0, -0.31, -0.45);
  stepGroup.add(step2Base);

  const step2Wood = createRoundedBox(1.86, 0.05, 0.38, 0.015, 2, MAT.oakPlanks[2]);
  step2Wood.position.set(0, -0.22, -0.45);
  stepGroup.add(step2Wood);

  const stepLed = createLedStrip(1.72, 0.02, 0.02, false);
  stepLed.position.set(0, -0.06, 0.02);
  stepGroup.add(stepLed);

  floorGroup.add(stepGroup);
  officeGroup.add(floorGroup);

  // 2. Walls, Glass Door Recess, Pillar & Notice Board
  const archGroup = new THREE.Group();
  archGroup.name = 'Architecture';
  const wallH = 3.85;
  const wallThick = 0.4;

  const leftWallMain = createRoundedBox(wallThick, wallH, 4.95, 0.08, 3, MAT.wallWhite);
  leftWallMain.position.set(-5.55, wallH / 2, -1.9);
  archGroup.add(leftWallMain);

  const leftFrontCornerPost = createRoundedBox(0.55, 2.25, 0.65, 0.09, 3, MAT.wallWhite);
  leftFrontCornerPost.position.set(-5.5, 1.125, -4.6);
  archGroup.add(leftFrontCornerPost);

  const leftCornerPlanter = createRoundedBox(0.68, 0.65, 0.68, 0.06, 3, MAT.wallWhite);
  leftCornerPlanter.position.set(-5.45, 0.325, -5.05);
  archGroup.add(leftCornerPlanter);

  const cornerPlantFL = createPlant({ type: 'medium', potColor: 'white', scale: 0.95 });
  cornerPlantFL.position.set(-5.45, 0.55, -5.05);
  archGroup.add(cornerPlantFL);

  const tallPlantLeft = createPlant({ type: 'tall', potColor: 'terracotta', scale: 1.05 });
  tallPlantLeft.position.set(-5.05, 0, -4.25);
  archGroup.add(tallPlantLeft);

  const recessHeader = createRoundedBox(0.46, 0.52, 2.0, 0.07, 3, MAT.wallWhite);
  recessHeader.position.set(-5.52, wallH - 0.26, 1.45);
  archGroup.add(recessHeader);

  const recessBack = createRoundedBox(0.18, wallH - 0.4, 1.9, 0.04, 2, MAT.wallWhite);
  recessBack.position.set(-5.82, (wallH - 0.4) / 2, 1.45);
  archGroup.add(recessBack);

  const recessLed = createLedStrip(0.04, 2.9, 1.5, true, 0.7, 3.5);
  recessLed.position.set(-5.7, 1.65, 1.45);
  archGroup.add(recessLed);
  addWarmGlowPool(archGroup, 0.9, 1.8, -5.45, 0.006, 1.45, 0.75);

  const doorFrameGroup = new THREE.Group();
  doorFrameGroup.position.set(-5.45, 0, 1.45);
  const frameTop = createRoundedBox(0.08, 0.07, 1.78, 0.01, 2, MAT.darkMetal);
  frameTop.position.y = 3.28;
  doorFrameGroup.add(frameTop);

  [-0.86, 0, 0.86].forEach((zOff) => {
    const post = createRoundedBox(0.08, 3.3, 0.06, 0.01, 2, MAT.darkMetal);
    post.position.set(0, 1.65, zOff);
    doorFrameGroup.add(post);
  });

  const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.24, 1.7), MAT.glassBlue);
  doorGlass.position.y = 1.62;
  doorFrameGroup.add(doorGlass);

  [-0.1, 0.1].forEach((zHandle) => {
    const handle = createRoundedBox(0.04, 0.45, 0.025, 0.008, 2, MAT.chromeMetal);
    handle.position.set(0.05, 1.55, zHandle);
    doorFrameGroup.add(handle);
  });

  const pinkDoorTrim = createRoundedBox(0.18, 3.35, 0.22, 0.03, 2, MAT.pastelPink);
  pinkDoorTrim.position.set(-5.32, 1.675, 2.28);
  archGroup.add(pinkDoorTrim);
  archGroup.add(doorFrameGroup);

  const pillar = createRoundedBox(0.95, 4.18, 0.98, 0.14, 4, MAT.wallWhite);
  pillar.position.set(-5.25, 2.09, 2.85);
  archGroup.add(pillar);

  const sconceGroup = new THREE.Group();
  sconceGroup.position.set(-4.74, 2.95, 2.85);
  const sconceBack = createRoundedBox(0.08, 0.42, 0.22, 0.02, 2, MAT.pastelPink);
  sconceGroup.add(sconceBack);
  const sconceCore = createRoundedBox(0.1, 0.36, 0.12, 0.015, 2, MAT.darkMetal);
  sconceCore.position.x = 0.03;
  sconceGroup.add(sconceCore);
  const sconceGlow = createLedStrip(0.09, 0.38, 0.16, true, 0.85, 3.8);
  sconceGlow.position.x = 0.01;
  sconceGroup.add(sconceGlow);
  addWallWarmGlow(sconceGroup, 0.75, 1.15, -0.02, 0, 0, Math.PI / 2, 0.85);
  archGroup.add(sconceGroup);

  const leftBackWall = createRoundedBox(wallThick, wallH, 2.25, 0.08, 3, MAT.wallWhite);
  leftBackWall.position.set(-5.55, wallH / 2, 4.35);
  archGroup.add(leftBackWall);

  const backWallMain = createRoundedBox(9.0, wallH, wallThick, 0.08, 3, MAT.wallWhite);
  backWallMain.position.set(-1.05, wallH / 2, 5.15);
  archGroup.add(backWallMain);

  const dashBackPanel = createRoundedBox(6.15, 3.65, 0.18, 0.1, 3, MAT.furnitureWhite);
  dashBackPanel.position.set(-0.45, 1.95, 4.92);
  archGroup.add(dashBackPanel);

  const rightBackWall = createRoundedBox(2.15, 3.45, wallThick, 0.08, 3, MAT.wallWhite);
  rightBackWall.position.set(4.5, 1.725, 5.15);
  archGroup.add(rightBackWall);

  const pinkTopAccent = createRoundedBox(1.55, 0.52, 0.44, 0.1, 3, MAT.pastelPink);
  pinkTopAccent.position.set(4.35, 3.55, 5.15);
  archGroup.add(pinkTopAccent);

  const rightCornerTallWall = createRoundedBox(wallThick, 3.65, 2.25, 0.08, 3, MAT.wallWhite);
  rightCornerTallWall.position.set(5.55, 1.825, 4.15);
  archGroup.add(rightCornerTallWall);

  const rightCornerLedTop = createLedStrip(1.35, 0.05, 0.05, true, 0.75, 3.6);
  rightCornerLedTop.position.set(4.65, 2.95, 4.9);
  archGroup.add(rightCornerLedTop);

  const rightCornerLedVert = createLedStrip(0.05, 2.85, 0.05, false);
  rightCornerLedVert.position.set(5.28, 1.5, 4.9);
  archGroup.add(rightCornerLedVert);
  addWallWarmGlow(archGroup, 1.45, 2.4, 4.65, 2.15, 4.92, 0, 0.72);

  const rightCornerShelf = createRoundedBox(0.75, 1.25, 0.95, 0.06, 3, MAT.wallWhite);
  rightCornerShelf.position.set(5.12, 0.625, 3.55);
  archGroup.add(rightCornerShelf);

  const rightShelfLed = createLedStrip(0.04, 0.04, 0.88, false);
  rightShelfLed.position.set(4.74, 1.24, 3.55);
  archGroup.add(rightShelfLed);

  const rcPlant1 = createPlant({ type: 'tall', potColor: 'white', scale: 0.85 });
  rcPlant1.position.set(5.12, 1.25, 3.7);
  archGroup.add(rcPlant1);

  const rcPlant2 = createPlant({ type: 'small', potColor: 'beige', scale: 0.95 });
  rcPlant2.position.set(5.16, 1.25, 3.22);
  archGroup.add(rcPlant2);

  // Asset 28: Interactive Glass Kanban & Notice Board (used by Robot 03 Nova-03!)
  const noticeBoardGroup = new THREE.Group();
  noticeBoardGroup.position.set(3.55, 0, 3.68);
  const nbGlass = createGlassPanel(1.35, 2.55, 0.025);
  noticeBoardGroup.add(nbGlass);

  // Rich Kanban columns, sticky notes & glowing connector bars on the Notice Board
  const noteColors = [0xff85b3, 0x70d6ff, 0xffe66d, 0xc77dff, 0x6ee7b7];
  for (let n = 0; n < 9; n++) {
    const col = n % 3;
    const row = Math.floor(n / 3);
    const nMat = registerMat(
      new THREE.MeshStandardMaterial({
        color: noteColors[n % noteColors.length],
        roughness: 0.45,
        emissive: noteColors[n % noteColors.length],
        emissiveIntensity: 0.15,
      })
    );
    const note = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.018), nMat);
    note.position.set(-0.38 + col * 0.38, 1.15 + row * 0.36, -0.02);
    note.rotation.z = ((n % 2 === 0 ? 1 : -1) * 0.04);
    noticeBoardGroup.add(note);
  }

  // Animated Laser Target Cursor Ring on the Notice Board tracked by Robot 03
  const boardLaserCursor = new THREE.Group();
  boardLaserCursor.position.set(0.0, 1.52, -0.032);
  const cursorRing = new THREE.Mesh(
    new THREE.RingGeometry(0.055, 0.085, 24),
    MAT.holoVioletGlow
  );
  boardLaserCursor.add(cursorRing);
  const cursorDot = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), MAT.holoPinkGlow);
  boardLaserCursor.add(cursorDot);
  noticeBoardGroup.add(boardLaserCursor);

  archGroup.add(noticeBoardGroup);

  const rightMidPlant = createPlant({ type: 'tall', potColor: 'white', scale: 0.95 });
  rightMidPlant.position.set(4.62, 0, 2.65);
  archGroup.add(rightMidPlant);

  const frontLeftLowWall = createRoundedBox(3.45, 1.12, 0.42, 0.08, 3, MAT.wallWhite);
  frontLeftLowWall.position.set(-3.42, 0.56, -5.15);
  archGroup.add(frontLeftLowWall);

  const stepLeftCap = createRoundedBox(0.55, 0.46, 0.44, 0.07, 3, MAT.wallWhite);
  stepLeftCap.position.set(-0.68, 0.23, -5.15);
  archGroup.add(stepLeftCap);

  const frontRightLowWall = createRoundedBox(4.15, 0.72, 0.44, 0.08, 3, MAT.wallWhite);
  frontRightLowWall.position.set(3.55, 0.36, -5.15);
  archGroup.add(frontRightLowWall);

  const frontPlanterBox = createRoundedBox(1.25, 0.52, 0.65, 0.06, 3, MAT.wallWhite);
  frontPlanterBox.position.set(2.25, 0.26, -4.68);
  archGroup.add(frontPlanterBox);

  const fp1 = createPlant({ type: 'medium', potColor: 'white', scale: 0.95 });
  fp1.position.set(2.45, 0.35, -4.65);
  archGroup.add(fp1);

  const fp2 = createPlant({ type: 'small', potColor: 'beige', scale: 1.0 });
  fp2.position.set(1.92, 0.45, -4.75);
  archGroup.add(fp2);

  const fp3 = createPlant({ type: 'medium', potColor: 'white', scale: 0.82 });
  fp3.position.set(4.05, 0.35, -4.68);
  archGroup.add(fp3);

  const rightLowWall = createRoundedBox(0.46, 0.76, 8.2, 0.08, 3, MAT.wallWhite);
  rightLowWall.position.set(5.55, 0.38, -1.05);
  archGroup.add(rightLowWall);

  [-3.45, -1.15, 1.15].forEach((zGlass) => {
    const gp = createGlassPanel(2.22, 1.58, 0.03);
    gp.rotation.y = Math.PI / 2;
    gp.position.set(5.55, 0.76, zGlass);
    archGroup.add(gp);
  });

  const rgp1 = createPlant({ type: 'medium', potColor: 'white', scale: 0.88 });
  rgp1.position.set(5.02, 0.38, -2.55);
  archGroup.add(rgp1);

  const rgp2 = createPlant({ type: 'tall', potColor: 'white', scale: 0.82 });
  rgp2.position.set(5.05, 0.38, 1.65);
  archGroup.add(rgp2);

  officeGroup.add(archGroup);

  // 3. Dashboard and Console Cabinet
  const dashGroup = new THREE.Group();
  dashGroup.name = 'DashboardAndConsole';
  dashGroup.position.set(-0.45, 0, 4.45);

  const screenW = 5.45;
  const screenH = 2.15;
  const housing = createRoundedBox(screenW, screenH, 0.12, 0.04, 3, MAT.darkMetal);
  housing.position.set(0, 2.18, 0.34);
  dashGroup.add(housing);

  const lcdMat = new THREE.MeshBasicMaterial({ map: TEX_DASHBOARD });
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(screenW - 0.14, screenH - 0.14), lcdMat);
  lcd.position.set(0, 2.18, 0.278);
  lcd.rotation.y = Math.PI;
  dashGroup.add(lcd);

  // Animated Coordinator Target Reticle on Team Dashboard Wall tracked by AURA (Office Manager)
  const auraDashboardCursor = new THREE.Group();
  auraDashboardCursor.position.set(0.35, 2.18, 0.262);
  const dashCursorRing = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.115, 28),
    MAT.holoVioletGlow
  );
  auraDashboardCursor.add(dashCursorRing);
  const dashCursorDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.035, 20),
    MAT.holoPinkGlow
  );
  auraDashboardCursor.add(dashCursorDot);
  dashGroup.add(auraDashboardCursor);

  const overheadBar = createRoundedBox(5.75, 0.22, 0.22, 0.06, 3, MAT.darkMetal);
  overheadBar.position.set(0, 3.48, 0.3);
  dashGroup.add(overheadBar);

  const overheadLed = createLedStrip(2.85, 0.065, 0.06, true, 0.95, 4.5);
  overheadLed.position.set(0, 3.48, 0.18);
  dashGroup.add(overheadLed);

  const cLen = 5.55;
  const cHeight = 0.76;
  const cDepth = 0.84;

  addContactShadow(dashGroup, cLen + 0.3, cDepth + 0.3, 0, 0.003, -0.05, 0.85);

  const plinth = createRoundedBox(cLen - 0.16, 0.1, cDepth - 0.14, 0.02, 2, MAT.wallWhite);
  plinth.position.set(0, 0.05, -0.05);
  dashGroup.add(plinth);

  const underConsoleLed = createLedStrip(cLen - 0.12, 0.035, 0.04, true, 1.15, 3.6);
  underConsoleLed.position.set(0, 0.05, -0.44);
  dashGroup.add(underConsoleLed);

  addWarmGlowPool(dashGroup, cLen + 0.5, 1.35, 0, 0.006, -0.38, 0.92);

  const cabinetBody = createRoundedBox(cLen, cHeight - 0.08, cDepth, 0.05, 3, MAT.furnitureWhite);
  cabinetBody.position.set(0, 0.42, -0.05);
  dashGroup.add(cabinetBody);

  const pinkSidePanel = createRoundedBox(
    0.06,
    cHeight - 0.12,
    cDepth - 0.08,
    0.03,
    3,
    MAT.pastelPink
  );
  pinkSidePanel.position.set(cLen / 2 + 0.01, 0.42, -0.05);
  dashGroup.add(pinkSidePanel);

  const numDoors = 5;
  const doorW = (cLen - 0.85) / numDoors;
  for (let i = 0; i < numDoors; i++) {
    const dx = -cLen / 2 + 0.55 + i * (doorW + 0.03);
    const door = createRoundedBox(doorW, 0.54, 0.025, 0.01, 2, MAT.wallWhite);
    door.position.set(dx, 0.41, -0.47);
    dashGroup.add(door);

    const handle = createRoundedBox(0.18, 0.018, 0.025, 0.005, 2, MAT.chromeMetal);
    handle.position.set(dx, 0.58, -0.49);
    dashGroup.add(handle);
  }

  const cp1 = createPlant({ type: 'medium', potColor: 'white', scale: 0.72 });
  cp1.position.set(-2.35, cHeight, -0.05);
  dashGroup.add(cp1);

  const cp2 = createPlant({ type: 'small', potColor: 'beige', scale: 0.85 });
  cp2.position.set(-2.02, cHeight, -0.08);
  dashGroup.add(cp2);

  const cp3 = createPlant({ type: 'succulent', potColor: 'pink', scale: 0.8 });
  cp3.position.set(-1.72, cHeight, -0.04);
  dashGroup.add(cp3);

  const consolePad = createRoundedBox(1.15, 0.025, 0.28, 0.01, 2, MAT.lavenderFabric);
  consolePad.position.set(-0.15, cHeight + 0.012, -0.05);
  dashGroup.add(consolePad);

  const cpRight = createPlant({ type: 'tall', potColor: 'white', scale: 0.82 });
  cpRight.position.set(2.22, cHeight, -0.05);
  dashGroup.add(cpRight);

  const cornerTallPlant = createPlant({ type: 'tall', potColor: 'terracotta', scale: 1.15 });
  cornerTallPlant.position.set(-3.55, 0, -0.05);
  dashGroup.add(cornerTallPlant);

  officeGroup.add(dashGroup);

  // 4. Coffee Corner
  const coffeeGroup = new THREE.Group();
  coffeeGroup.name = 'CoffeeCorner';
  coffeeGroup.position.set(-4.95, 0, 3.95);

  const cabLen = 1.85;
  const cabDepth = 0.76;
  const cabH = 0.86;
  addContactShadow(coffeeGroup, cabDepth + 0.2, cabLen + 0.2, 0, 0.003, 0, 0.85);

  const leftCab = createRoundedBox(cabDepth, cabH - 0.06, 1.05, 0.03, 3, MAT.furnitureWhite);
  leftCab.position.set(0, (cabH - 0.06) / 2, -0.38);
  coffeeGroup.add(leftCab);

  [-0.62, -0.14].forEach((zDoor, idx) => {
    const door = createRoundedBox(0.025, 0.72, 0.46, 0.01, 2, MAT.wallWhite);
    door.position.set(cabDepth / 2 + 0.01, 0.4, zDoor);
    coffeeGroup.add(door);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), MAT.chromeMetal);
    knob.position.set(cabDepth / 2 + 0.03, 0.48, zDoor + (idx === 0 ? 0.16 : -0.16));
    coffeeGroup.add(knob);
  });

  const fridgeShell = createRoundedBox(cabDepth, cabH - 0.06, 0.76, 0.03, 3, MAT.furnitureWhite);
  fridgeShell.position.set(0, (cabH - 0.06) / 2, 0.52);
  coffeeGroup.add(fridgeShell);

  const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.58), MAT.darkMetal);
  cavity.position.set(cabDepth / 2 - 0.06, 0.4, 0.52);
  coffeeGroup.add(cavity);

  const drinkColors = [0xffb74d, 0x4fc3f7, 0xf48fb1, 0x81c784];
  for (let d = 0; d < 4; d++) {
    const dMat = registerMat(new THREE.MeshStandardMaterial({ color: drinkColors[d], roughness: 0.3 }));
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.035, 0.18, 10), dMat);
    bottle.position.set(cabDepth / 2 - 0.04, 0.22, 0.34 + d * 0.12);
    coffeeGroup.add(bottle);
  }

  const fridgeDoor = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.66, 0.62), MAT.glassBlue);
  fridgeDoor.position.set(cabDepth / 2 + 0.02, 0.4, 0.52);
  coffeeGroup.add(fridgeDoor);

  const redIndicator = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.025, 0.08),
    registerMat(new THREE.MeshBasicMaterial({ color: 0xff5252 }))
  );
  redIndicator.position.set(cabDepth / 2 + 0.03, 0.74, 0.52);
  coffeeGroup.add(redIndicator);

  const countertop = createRoundedBox(cabDepth + 0.04, 0.06, cabLen + 0.04, 0.02, 3, MAT.paleWood);
  countertop.position.set(0, cabH - 0.02, 0);
  coffeeGroup.add(countertop);

  const cmGroup = new THREE.Group();
  cmGroup.position.set(-0.02, cabH + 0.01, -0.18);
  const cmBase = createRoundedBox(0.42, 0.04, 0.48, 0.015, 2, MAT.darkMetal);
  cmBase.position.y = 0.02;
  cmGroup.add(cmBase);

  const cmBack = createRoundedBox(0.24, 0.44, 0.44, 0.025, 3, MAT.charcoalPlastic);
  cmBack.position.set(-0.08, 0.24, 0);
  cmGroup.add(cmBack);

  const cmTopHead = createRoundedBox(0.4, 0.14, 0.44, 0.025, 3, MAT.charcoalPlastic);
  cmTopHead.position.set(0, 0.39, 0);
  cmGroup.add(cmTopHead);

  const cmPinkLid = createRoundedBox(0.38, 0.025, 0.42, 0.01, 2, MAT.pastelPink);
  cmPinkLid.position.set(0, 0.465, 0);
  cmGroup.add(cmPinkLid);

  const brewHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.038, 0.06, 12),
    MAT.chromeMetal
  );
  brewHead.position.set(0.08, 0.29, 0);
  cmGroup.add(brewHead);

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.028, 0.065, 12),
    MAT.furnitureWhite
  );
  cup.position.set(0.08, 0.075, 0);
  cmGroup.add(cup);

  const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.22, 16), MAT.potBeige);
  canister.position.set(0.04, 0.13, 0.36);
  cmGroup.add(canister);

  const canisterLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.088, 0.088, 0.035, 16),
    MAT.chromeMetal
  );
  canisterLid.position.set(0.04, 0.25, 0.36);
  cmGroup.add(canisterLid);
  coffeeGroup.add(cmGroup);

  [1.82, 2.52].forEach((shelfY, idx) => {
    const shelf = createRoundedBox(0.38, 0.045, 1.25, 0.015, 2, MAT.paleWood);
    shelf.position.set(-0.2, shelfY, 0.05);
    coffeeGroup.add(shelf);

    const shelfLed = createLedStrip(0.04, 0.03, 1.15, idx === 0, 0.75, 2.8);
    shelfLed.position.set(-0.34, shelfY - 0.03, 0.05);
    coffeeGroup.add(shelfLed);
  });
  addWallWarmGlow(coffeeGroup, 1.45, 1.65, -0.37, 2.05, 0.05, Math.PI / 2, 0.8);

  const shelfBooks = createBookStack(5, false);
  shelfBooks.rotation.y = Math.PI / 2;
  shelfBooks.position.set(-0.2, 1.84, -0.35);
  coffeeGroup.add(shelfBooks);

  const shelfPlantSmall = createPlant({ type: 'small', potColor: 'white', scale: 0.9 });
  shelfPlantSmall.position.set(-0.18, 1.84, 0.35);
  coffeeGroup.add(shelfPlantSmall);

  const upperHangingPlant = createPlant({
    type: 'hanging',
    potColor: 'terracotta',
    scale: 1.15,
    vineLength: 1.1,
  });
  upperHangingPlant.position.set(-0.16, 2.54, 0.15);
  coffeeGroup.add(upperHangingPlant);

  officeGroup.add(coffeeGroup);

  // 5. Two-Tier Plant Shelf & Glass Enclosure
  const centralShelfGroup = new THREE.Group();
  centralShelfGroup.name = 'CentralPlantShelfAndGlass';
  centralShelfGroup.position.set(-3.45, 0, 0.55);

  const sW = 1.48;
  const sH = 1.55;
  const sD = 0.42;
  addContactShadow(centralShelfGroup, sW + 0.2, sD + 0.2, 0, 0.003, -0.55, 0.8);

  const shelfUnit = new THREE.Group();
  shelfUnit.position.set(0, 0, -0.55);

  const baseBlock = createRoundedBox(sW, 0.24, sD, 0.03, 2, MAT.furnitureWhite);
  baseBlock.position.y = 0.12;
  shelfUnit.add(baseBlock);

  const backBoard = createRoundedBox(sW, sH, 0.06, 0.02, 2, MAT.furnitureWhite);
  backBoard.position.set(0, sH / 2, sD / 2 - 0.03);
  shelfUnit.add(backBoard);

  [-sW / 2 + 0.04, sW / 2 - 0.04].forEach((xSide) => {
    const sideWall = createRoundedBox(0.08, sH, sD, 0.02, 2, MAT.furnitureWhite);
    sideWall.position.set(xSide, sH / 2, 0);
    shelfUnit.add(sideWall);
  });

  [0.85, 1.48].forEach((yLevel) => {
    const board = createRoundedBox(sW - 0.04, 0.055, sD, 0.015, 2, MAT.furnitureWhite);
    board.position.y = yLevel;
    shelfUnit.add(board);

    const led = createLedStrip(sW - 0.18, 0.025, 0.04, yLevel === 0.85, 0.5, 2.5);
    led.position.set(0, yLevel - 0.03, -sD / 2 + 0.05);
    shelfUnit.add(led);
  });

  [-0.44, 0, 0.44].forEach((px, idx) => {
    const pBot = createPlant({
      type: 'small',
      potColor: idx === 1 ? 'beige' : 'white',
      scale: 0.92,
    });
    pBot.position.set(px, 0.24, -0.02);
    shelfUnit.add(pBot);

    const pMid = createPlant({
      type: 'small',
      potColor: idx === 0 ? 'pink' : 'white',
      scale: 0.95,
    });
    pMid.position.set(px, 0.88, -0.02);
    shelfUnit.add(pMid);

    const pTop = createPlant({
      type: idx === 1 ? 'medium' : 'small',
      potColor: 'white',
      scale: 0.85,
    });
    pTop.position.set(px, 1.51, -0.02);
    shelfUnit.add(pTop);
  });

  centralShelfGroup.add(shelfUnit);

  const backGlass1 = createGlassPanel(1.45, 2.45, 0.025);
  backGlass1.position.set(0, 0, -0.28);
  centralShelfGroup.add(backGlass1);

  const sideGlassRight = createGlassPanel(1.55, 2.45, 0.025);
  sideGlassRight.rotation.y = Math.PI / 2;
  sideGlassRight.position.set(0.72, 0, 0.48);
  centralShelfGroup.add(sideGlassRight);

  const innerBench = createRoundedBox(1.35, 0.78, 0.55, 0.03, 2, MAT.furnitureWhite);
  innerBench.position.set(-0.05, 0.39, 0.55);
  centralShelfGroup.add(innerBench);

  const innerPlant = createPlant({ type: 'medium', potColor: 'white', scale: 1.0 });
  innerPlant.position.set(-0.05, 0.78, 0.55);
  centralShelfGroup.add(innerPlant);

  officeGroup.add(centralShelfGroup);

  // 6. Workstation 1 — Left Wall Dual PC Setup (Operated by ORBIT · Quality Reviewer!)
  const ws1Group = new THREE.Group();
  ws1Group.name = 'Workstation1_LeftWall';
  ws1Group.position.set(-4.65, 0, -1.72);

  const deskLen = 2.45;
  const deskDepth = 1.04;
  const deskH = 0.76;

  addContactShadow(ws1Group, deskDepth + 0.28, deskLen + 0.28, 0, 0.003, 0, 0.85);

  const top1 = createRoundedBox(deskDepth, 0.065, deskLen, 0.03, 3, MAT.furnitureWhite);
  top1.position.set(0, deskH - 0.03, 0);
  ws1Group.add(top1);

  [-deskLen / 2 + 0.05, deskLen / 2 - 0.05].forEach((zLeg) => {
    const leg = createRoundedBox(deskDepth - 0.06, deskH - 0.06, 0.08, 0.02, 2, MAT.paleWood);
    leg.position.set(0, (deskH - 0.06) / 2, zLeg);
    ws1Group.add(leg);
  });

  const underDeskLed = createLedStrip(0.06, 0.03, deskLen - 0.3, true, 1.15, 3.8);
  underDeskLed.position.set(-0.15, deskH - 0.08, 0);
  ws1Group.add(underDeskLed);
  addWarmGlowPool(ws1Group, 1.4, deskLen + 0.15, 0.05, 0.005, 0, 0.85);

  // Neatly tucked under-desk pedestal so nothing protrudes into the Lounge Sofa!
  const leftPedestal = createMobilePedestal(0.52, 0.66, 0.52, true);
  leftPedestal.rotation.y = Math.PI / 2;
  leftPedestal.position.set(0.02, 0, -0.84);
  ws1Group.add(leftPedestal);

  const monLeft = createMonitor(0.78, 0.47, TEX_DESIGN);
  monLeft.rotation.y = Math.PI / 2;
  monLeft.position.set(-0.26, deskH, -0.42);
  ws1Group.add(monLeft);

  const monRight = createMonitor(0.78, 0.47, TEX_CODE);
  monRight.rotation.y = Math.PI / 2 - 0.14;
  monRight.position.set(-0.22, deskH, 0.38);
  ws1Group.add(monRight);

  // Floating 3D Quality Review Layer above Workstation 1 for ORBIT
  const pcFloatPreview = new THREE.Group();
  pcFloatPreview.position.set(-0.12, deskH + 0.68, -0.02);
  const uiCardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.22),
    new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    })
  );
  uiCardMesh.rotation.y = Math.PI / 2;
  pcFloatPreview.add(uiCardMesh);
  const uiWireBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.03, 0.52),
    MAT.holoPinkGlow
  );
  uiWireBar.position.y = 0.06;
  pcFloatPreview.add(uiWireBar);
  ws1Group.add(pcFloatPreview);

  const kbMouse = createKeyboardAndMouse(1.04, 0.4);
  kbMouse.rotation.y = Math.PI / 2;
  kbMouse.position.set(0.16, deskH, -0.02);
  ws1Group.add(kbMouse);

  const lamp = createDeskLamp();
  lamp.position.set(-0.2, deskH, -0.92);
  ws1Group.add(lamp);

  const pencils = createPencilHolder();
  pencils.position.set(0.22, deskH, -0.88);
  ws1Group.add(pencils);

  const mug = createMug(MAT.pastelPink);
  mug.position.set(0.22, deskH, 0.64);
  ws1Group.add(mug);

  const deskPlant = createPlant({ type: 'medium', potColor: 'terracotta', scale: 0.68 });
  deskPlant.position.set(-0.18, deskH, 0.78);
  ws1Group.add(deskPlant);

  // Ergonomic Office Chair positioned directly at Workstation 1 for ORBIT (Quality Reviewer) to sit on!
  const chair1 = createOfficeChair(true);
  chair1.rotation.y = -Math.PI / 2;
  chair1.position.set(0.68, 0, -0.02);
  ws1Group.add(chair1);

  const wallLedBar = createRoundedBox(0.1, 0.09, 1.65, 0.02, 2, MAT.furnitureWhite);
  wallLedBar.position.set(-0.66, 1.68, -0.35);
  ws1Group.add(wallLedBar);
  const wallLedGlow = createLedStrip(0.06, 0.05, 1.58, true, 0.95, 3.2);
  wallLedGlow.position.set(-0.62, 1.66, -0.35);
  ws1Group.add(wallLedGlow);
  addWallWarmGlow(ws1Group, 1.95, 0.85, -0.68, 1.72, -0.35, Math.PI / 2, 0.85);

  const pegGroup = new THREE.Group();
  pegGroup.position.set(-0.67, 2.42, -0.85);
  const pegBoard = createRoundedBox(0.05, 0.92, 1.02, 0.02, 2, MAT.pastelPink);
  pegGroup.add(pegBoard);

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 8; c++) {
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.02, 6),
        MAT.darkMetal
      );
      hole.rotation.z = Math.PI / 2;
      hole.position.set(0.022, -0.32 + r * 0.1, -0.38 + c * 0.105);
      pegGroup.add(hole);
    }
  }

  const pocket = createRoundedBox(0.08, 0.18, 0.14, 0.01, 2, MAT.deepPink);
  pocket.position.set(0.05, -0.15, 0.08);
  pegGroup.add(pocket);

  const noteCard = createRoundedBox(0.02, 0.36, 0.24, 0.005, 2, MAT.furnitureWhite);
  noteCard.position.set(0.035, -0.08, 0.32);
  pegGroup.add(noteCard);
  ws1Group.add(pegGroup);

  const artGroup = new THREE.Group();
  artGroup.position.set(-0.67, 2.48, 0.22);
  const artFrame = createRoundedBox(0.06, 0.88, 0.96, 0.015, 2, MAT.paleWood);
  artGroup.add(artFrame);
  const artCanvas = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.78),
    new THREE.MeshBasicMaterial({ map: TEX_ART })
  );
  artCanvas.rotation.y = Math.PI / 2;
  artCanvas.position.x = 0.032;
  artGroup.add(artCanvas);
  ws1Group.add(artGroup);

  const bookShelf = new THREE.Group();
  bookShelf.position.set(-0.34, deskH, 1.02);
  const bsW = 0.4;
  const bsH = 1.95;
  const bsD = 0.84;

  const bsBack = createRoundedBox(0.04, bsH, bsD, 0.01, 2, MAT.paleWood);
  bsBack.position.set(-bsW / 2 + 0.02, bsH / 2, 0);
  bookShelf.add(bsBack);

  [-bsD / 2 + 0.025, bsD / 2 - 0.025].forEach((zSide) => {
    const side = createRoundedBox(bsW, bsH, 0.05, 0.015, 2, MAT.paleWood);
    side.position.set(0, bsH / 2, zSide);
    bookShelf.add(side);
  });

  [0.025, 0.65, 1.28, bsH - 0.025].forEach((yS) => {
    const shelf = createRoundedBox(bsW, 0.05, bsD, 0.015, 2, MAT.paleWood);
    shelf.position.set(0, yS, 0);
    bookShelf.add(shelf);
  });

  const bsBooks1 = createBookStack(7, false);
  bsBooks1.rotation.y = Math.PI / 2;
  bsBooks1.position.set(0, 0.05, -0.28);
  bookShelf.add(bsBooks1);

  const bsBooks2 = createBookStack(4, false);
  bsBooks2.rotation.y = Math.PI / 2;
  bsBooks2.position.set(0, 0.68, -0.3);
  bookShelf.add(bsBooks2);

  const miniRobotFig = new THREE.Group();
  miniRobotFig.position.set(0.02, 0.68, 0.16);
  const rBody = createRoundedBox(0.14, 0.16, 0.14, 0.04, 3, MAT.furnitureWhite);
  rBody.position.y = 0.08;
  miniRobotFig.add(rBody);
  const rHead = createRoundedBox(0.18, 0.15, 0.2, 0.05, 3, MAT.furnitureWhite);
  rHead.position.y = 0.24;
  miniRobotFig.add(rHead);
  const rVisor = createRoundedBox(0.04, 0.08, 0.14, 0.02, 2, MAT.darkMetal);
  rVisor.position.set(0.08, 0.24, 0);
  miniRobotFig.add(rVisor);
  bookShelf.add(miniRobotFig);

  const topSmallPlant = createPlant({ type: 'small', potColor: 'white', scale: 0.9 });
  topSmallPlant.position.set(0, bsH, -0.22);
  bookShelf.add(topSmallPlant);

  const topHangingPlant = createPlant({
    type: 'hanging',
    potColor: 'beige',
    scale: 1.15,
    vineLength: 1.35,
  });
  topHangingPlant.position.set(0.02, bsH, 0.2);
  bookShelf.add(topHangingPlant);

  ws1Group.add(bookShelf);
  officeGroup.add(ws1Group);

  // 7. Lounge Area (Cleanly separated from Left-Wall Desk & Sofa!)
  const loungeGroup = new THREE.Group();
  loungeGroup.name = 'LoungeArea';

  const loungeRug = createRoundedBox(3.35, 0.035, 2.85, 0.015, 2, MAT.rugGray, false, true);
  loungeRug.position.set(-2.72, 0.018, -3.45);
  loungeGroup.add(loungeRug);

  const centerRug = createRoundedBox(2.55, 0.035, 1.85, 0.015, 2, MAT.rugGray, false, true);
  centerRug.position.set(-0.25, 0.018, -0.15);
  loungeGroup.add(centerRug);

  const sofa = new THREE.Group();
  sofa.position.set(-3.35, 0, -4.12);
  addContactShadow(sofa, 2.35, 1.25, 0, 0.004, 0, 0.9);

  const sofaW = 2.08;
  const sofaD = 1.02;

  const sofaBase = createRoundedBox(sofaW, 0.22, sofaD, 0.05, 3, MAT.sofaFabric);
  sofaBase.position.y = 0.14;
  sofa.add(sofaBase);

  const backrest = createRoundedBox(sofaW, 0.72, 0.26, 0.08, 4, MAT.sofaFabric);
  backrest.position.set(0, 0.5, -sofaD / 2 + 0.13);
  sofa.add(backrest);

  [-sofaW / 2 + 0.15, sofaW / 2 - 0.15].forEach((xArm) => {
    const arm = createRoundedBox(0.3, 0.54, sofaD, 0.09, 4, MAT.sofaFabric);
    arm.position.set(xArm, 0.36, 0);
    sofa.add(arm);
  });

  [-0.38, 0.38].forEach((xSeat) => {
    const seat = createRoundedBox(0.73, 0.2, 0.74, 0.06, 4, MAT.sofaFabric);
    seat.position.set(xSeat, 0.32, 0.08);
    sofa.add(seat);
  });

  const pinkPillow = createRoundedBox(0.56, 0.48, 0.18, 0.07, 4, MAT.pastelPinkFabric);
  pinkPillow.position.set(-0.36, 0.62, -0.18);
  pinkPillow.rotation.set(0.18, 0.08, 0.05);
  sofa.add(pinkPillow);

  const lavPillow = createRoundedBox(0.46, 0.42, 0.17, 0.07, 4, MAT.lavenderFabric);
  lavPillow.position.set(0.18, 0.58, -0.12);
  lavPillow.rotation.set(0.22, -0.14, -0.06);
  sofa.add(lavPillow);

  loungeGroup.add(sofa);

  const poufGroup = new THREE.Group();
  poufGroup.position.set(-1.68, 0, -2.78);
  addContactShadow(poufGroup, 1.15, 1.15, 0, 0.004, 0, 0.85);

  const numSegments = 16;
  const poufRadius = 0.46;
  const poufHeight = 0.42;
  for (let s = 0; s < numSegments; s++) {
    const angle = (s / numSegments) * Math.PI * 2;
    const lobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 14, 12),
      MAT.pastelPinkFabric
    );
    lobe.scale.set(0.62, 0.88, 1.35);
    lobe.position.set(
      Math.cos(angle) * (poufRadius * 0.54),
      poufHeight / 2,
      Math.sin(angle) * (poufRadius * 0.54)
    );
    lobe.rotation.y = -angle + Math.PI / 2;
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    poufGroup.add(lobe);
  }
  const poufCenter = new THREE.Mesh(
    new THREE.SphereGeometry(0.33, 16, 12),
    MAT.pastelPinkFabric
  );
  poufCenter.scale.set(1, 0.52, 1);
  poufCenter.position.y = poufHeight * 0.54;
  poufGroup.add(poufCenter);
  loungeGroup.add(poufGroup);

  // Round Coffee Table placed cleanly in front of the sofa & clear of ORBIT's chair
  const tableGroup = new THREE.Group();
  tableGroup.position.set(-2.78, 0, -2.96);
  addContactShadow(tableGroup, 1.1, 1.1, 0, 0.004, 0, 0.8);

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.06, 28),
    MAT.furnitureWhite
  );
  tableTop.position.y = 0.4;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableGroup.add(tableTop);

  for (let l = 0; l < 4; l++) {
    const a = (l / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.024, 0.39, 10),
      MAT.oakPlanks[0]
    );
    leg.position.set(Math.cos(a) * 0.34, 0.195, Math.sin(a) * 0.34);
    leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
    leg.castShadow = true;
    tableGroup.add(leg);
  }

  const ctBooks = createBookStack(2, true);
  ctBooks.position.set(-0.14, 0.43, 0.06);
  tableGroup.add(ctBooks);

  const ctPencils = createPencilHolder();
  ctPencils.scale.setScalar(0.75);
  ctPencils.position.set(-0.14, 0.51, 0.06);
  tableGroup.add(ctPencils);

  const ctPlant = createPlant({ type: 'medium', potColor: 'white', scale: 0.68 });
  ctPlant.position.set(0.18, 0.43, -0.08);
  tableGroup.add(ctPlant);

  loungeGroup.add(tableGroup);
  officeGroup.add(loungeGroup);

  // 8. Central Workstation Island — Workstation 2 (Coding Robot Byte-01) & Workstation 3
  const islandGroup = new THREE.Group();
  islandGroup.name = 'CentralWorkstationIsland';

  const ws2 = new THREE.Group();
  ws2.position.set(0.55, 0, -2.55);

  const dLen = 2.95;
  const dDepth = 1.15;
  const dH = 0.76;

  addContactShadow(ws2, dLen + 0.35, dDepth + 0.35, 0, 0.003, 0, 0.85);

  const top2 = createRoundedBox(dLen, 0.07, dDepth, 0.035, 3, MAT.furnitureWhite);
  top2.position.set(0, dH - 0.035, 0);
  ws2.add(top2);

  [-dLen / 2 + 0.06, dLen / 2 - 0.06].forEach((xSide) => {
    const legPanel = createRoundedBox(0.1, dH - 0.06, dDepth - 0.06, 0.025, 2, MAT.paleWood);
    legPanel.position.set(xSide, (dH - 0.06) / 2, 0);
    ws2.add(legPanel);

    const sideLed = createLedStrip(0.12, 0.025, dDepth - 0.14, false);
    sideLed.position.set(xSide, 0.025, 0);
    ws2.add(sideLed);
  });

  const frontLed = createLedStrip(dLen - 0.25, 0.03, 0.05, true, 1.1, 3.6);
  frontLed.position.set(0, dH - 0.08, -0.25);
  ws2.add(frontLed);
  addWarmGlowPool(ws2, dLen + 0.4, dDepth + 0.5, 0, 0.005, -0.05, 0.8);

  const backDivider = createRoundedBox(dLen, 0.38, 0.08, 0.025, 2, MAT.furnitureWhite);
  backDivider.position.set(0, dH + 0.16, dDepth / 2 - 0.04);
  ws2.add(backDivider);

  const rightPedestal = createMobilePedestal(0.58, 0.64, 0.58, true);
  rightPedestal.rotation.y = Math.PI;
  rightPedestal.position.set(0.88, 0, -0.18);
  ws2.add(rightPedestal);

  const ws2FloorPlant = createPlant({ type: 'medium', potColor: 'white', scale: 0.76 });
  ws2FloorPlant.position.set(1.58, 0, -0.28);
  ws2.add(ws2FloorPlant);

  const ws2MonLeft = createMonitor(0.86, 0.5, TEX_CODE);
  ws2MonLeft.rotation.y = Math.PI - 0.08;
  ws2MonLeft.position.set(-0.38, dH, 0.22);
  ws2.add(ws2MonLeft);

  const ws2MonRight = createMonitor(0.74, 0.46, TEX_CODE);
  ws2MonRight.rotation.y = Math.PI + 0.24;
  ws2MonRight.position.set(0.46, dH, 0.16);
  ws2.add(ws2MonRight);

  // Floating Live Code Matrix Banner above Workstation 2 for Robot 01 (Byte-01)
  const codingFloatPanel = new THREE.Group();
  codingFloatPanel.position.set(-0.02, dH + 0.72, 0.18);
  const codeBacking = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.26),
    new THREE.MeshBasicMaterial({
      color: 0x0d9488,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
    })
  );
  codingFloatPanel.add(codeBacking);
  for (let row = 0; row < 3; row++) {
    const lineBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.58 - row * 0.12, 0.022, 0.012),
      row % 2 === 0 ? MAT.holoCyanGlow : MAT.holoPinkGlow
    );
    lineBar.position.set(-0.1 + row * 0.06, 0.06 - row * 0.06, 0.01);
    codingFloatPanel.add(lineBar);
  }
  ws2.add(codingFloatPanel);

  const ws2Kb = createKeyboardAndMouse(1.12, 0.44);
  ws2Kb.rotation.y = Math.PI;
  ws2Kb.position.set(-0.08, dH, -0.18);
  ws2.add(ws2Kb);

  // Ergonomic Office Chair positioned directly at Workstation 2 for PIXEL (Creator) to sit on!
  const ws2Chair = createOfficeChair(true);
  ws2Chair.rotation.y = 0;
  ws2Chair.position.set(-0.08, 0, -0.67);
  ws2.add(ws2Chair);

  const ws2PlantLeft1 = createPlant({ type: 'medium', potColor: 'terracotta', scale: 0.78 });
  ws2PlantLeft1.position.set(-1.18, dH, 0.24);
  ws2.add(ws2PlantLeft1);

  const ws2PlantLeft2 = createPlant({ type: 'small', potColor: 'white', scale: 0.85 });
  ws2PlantLeft2.position.set(-1.22, dH, -0.12);
  ws2.add(ws2PlantLeft2);

  const ws2Books = createBookStack(4, true);
  ws2Books.position.set(1.18, dH, -0.22);
  ws2.add(ws2Books);

  const ws2Mug = createMug(MAT.pastelPink);
  ws2Mug.position.set(0.72, dH, -0.32);
  ws2.add(ws2Mug);

  const ws2Succulent = createPlant({ type: 'succulent', potColor: 'beige', scale: 0.85 });
  ws2Succulent.position.set(0.62, dH, -0.05);
  ws2.add(ws2Succulent);

  const ws2PlantRight = createPlant({ type: 'small', potColor: 'white', scale: 0.92 });
  ws2PlantRight.position.set(0.95, dH, -0.38);
  ws2.add(ws2PlantRight);

  islandGroup.add(ws2);

  // Workstation 3
  const ws3 = new THREE.Group();
  ws3.position.set(2.35, 0, -0.95);
  const s3Len = 2.35;
  const s3Depth = 1.05;
  addContactShadow(ws3, s3Len + 0.3, s3Depth + 0.3, 0, 0.003, 0, 0.82);

  const top3 = createRoundedBox(s3Len, 0.065, s3Depth, 0.03, 3, MAT.furnitureWhite);
  top3.position.set(0, dH - 0.032, 0);
  ws3.add(top3);

  [-s3Len / 2 + 0.06, s3Len / 2 - 0.06].forEach((xSide) => {
    const leg = createRoundedBox(0.09, dH - 0.06, s3Depth - 0.06, 0.02, 2, MAT.furnitureWhite);
    leg.position.set(xSide, (dH - 0.06) / 2, 0);
    ws3.add(leg);
  });

  const pinkPanel3 = createRoundedBox(s3Len - 0.2, dH - 0.16, 0.06, 0.02, 2, MAT.pastelPink);
  pinkPanel3.position.set(0, (dH - 0.16) / 2 + 0.04, -0.15);
  ws3.add(pinkPanel3);

  const ws3Mon = createMonitor(0.84, 0.49, TEX_CODE);
  ws3Mon.position.set(0.08, dH, -0.12);
  ws3.add(ws3Mon);

  const ws3Kb = createKeyboardAndMouse(0.92, 0.38);
  ws3Kb.position.set(0.05, dH, 0.22);
  ws3.add(ws3Kb);

  const ws3Mug = createMug(MAT.pastelPink);
  ws3Mug.position.set(-0.62, dH, 0.18);
  ws3.add(ws3Mug);

  const ws3Notes = createBookStack(2, true);
  ws3Notes.position.set(-0.78, dH, -0.18);
  ws3.add(ws3Notes);

  const ws3Plant1 = createPlant({ type: 'medium', potColor: 'white', scale: 0.78 });
  ws3Plant1.position.set(0.75, dH, -0.18);
  ws3.add(ws3Plant1);

  const ws3Plant2 = createPlant({ type: 'small', potColor: 'beige', scale: 0.85 });
  ws3Plant2.position.set(0.92, dH, 0.18);
  ws3.add(ws3Plant2);

  const ws3Chair = createOfficeChair();
  ws3Chair.rotation.y = Math.PI + 0.15;
  ws3Chair.position.set(-0.18, 0, 0.78);
  ws3.add(ws3Chair);

  const ws3RightBoard = createRoundedBox(0.08, 1.05, 1.35, 0.025, 2, MAT.furnitureWhite);
  ws3RightBoard.position.set(s3Len / 2 + 0.32, 0.55, -0.25);
  ws3.add(ws3RightBoard);

  for (let i = 0; i < 6; i++) {
    const sNote = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.15, 0.16),
      BOOK_COLORS[i % BOOK_COLORS.length]
    );
    sNote.position.set(
      s3Len / 2 + 0.365,
      0.55 + Math.floor(i / 3) * 0.24,
      -0.55 + (i % 3) * 0.26
    );
    ws3.add(sNote);
  }

  islandGroup.add(ws3);
  officeGroup.add(islandGroup);

  // Enable real-time shadow casting across office geometry
  officeGroup.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (
        obj.material !== MAT.glassBlue &&
        obj.material !== MAT.glassEdge &&
        obj.material !== haloMat &&
        !obj.material.transparent
      ) {
        obj.castShadow = true;
      }
      obj.receiveShadow = true;
    }
  });

  // Real-time Shadow Receiver on Infinite White Studio Surface
  const groundShadowMat = registerMat(
    new THREE.ShadowMaterial({
      opacity: 0.28,
      transparent: true,
      depthWrite: false,
    })
  );
  const groundShadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    groundShadowMat
  );
  groundShadowPlane.name = 'GroundShadowReceiver';
  groundShadowPlane.rotation.x = -Math.PI / 2;
  groundShadowPlane.position.set(0, -0.385, 0);
  groundShadowPlane.receiveShadow = true;
  scene.add(groundShadowPlane);

  // ============================================================================
  // 9. LIGHTING SYSTEM (Optimized for White Studio Surface & Real-time Shadows)
  // ============================================================================
  const hemiLight = new THREE.HemisphereLight(0xfffdfa, 0xe2e6ef, 0.72);
  hemiLight.position.set(0, 25, 0);
  scene.add(hemiLight);

  // Main Key Directional Light (Projects soft real-time shadows onto the white floor)
  const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.35);
  dirLight.position.set(-14, 22, -10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 2;
  dirLight.shadow.camera.far = 60;
  const d = 16.5;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0003;
  dirLight.shadow.radius = 3.2;
  scene.add(dirLight);

  // Secondary soft directional light for shadow definition on opposite angle
  const secondaryDirLight = new THREE.DirectionalLight(0xffeedd, 0.85);
  secondaryDirLight.position.set(10, 20, 12);
  secondaryDirLight.castShadow = true;
  secondaryDirLight.shadow.mapSize.width = 2048;
  secondaryDirLight.shadow.mapSize.height = 2048;
  secondaryDirLight.shadow.camera.near = 2;
  secondaryDirLight.shadow.camera.far = 60;
  secondaryDirLight.shadow.camera.left = -d;
  secondaryDirLight.shadow.camera.right = d;
  secondaryDirLight.shadow.camera.top = d;
  secondaryDirLight.shadow.camera.bottom = -d;
  secondaryDirLight.shadow.bias = -0.0003;
  secondaryDirLight.shadow.radius = 3.5;
  scene.add(secondaryDirLight);

  const fillLight = new THREE.DirectionalLight(0xe4ecff, 0.42);
  fillLight.position.set(16, 12, -18);
  scene.add(fillLight);

  const coffeeBounce = new THREE.PointLight(0xff9628, 1.25, 4.8, 1.8);
  coffeeBounce.position.set(4.1, 2.2, 3.8);
  scene.add(coffeeBounce);

  const dashBounce = new THREE.PointLight(0xff9e32, 0.95, 5.5, 1.8);
  dashBounce.position.set(0.4, 1.6, 3.8);
  scene.add(dashBounce);

  const leftWallBounce = new THREE.PointLight(0xff9828, 1.05, 4.5, 1.8);
  leftWallBounce.position.set(4.4, 1.6, -2.2);
  scene.add(leftWallBounce);

  const rightCornerBounce = new THREE.PointLight(0xff9628, 1.15, 4.6, 1.8);
  rightCornerBounce.position.set(-4.5, 2.1, 3.9);
  scene.add(rightCornerBounce);

  const updatables: DynamicSceneUpdatables = {
    auraDashboardCursor,
    codingFloatPanel,
    pcFloatPreview,
    boardLaserCursor,
  };

  return {
    officeGroup,
    addContactShadow,
    addWarmGlowPool,
    updatables,
  };
}
