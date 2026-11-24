import * as THREE from 'three';
import type { StudentWorkRaw } from './portfolioData';

export function detectSoftwareWebGL(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return false;
    const unmasked = String(
      gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? ''
    );
    return /SwiftShader|llvmpipe|Software Rasterizer|Microsoft Basic Render/i.test(
      unmasked
    );
  } catch {
    return false;
  }
}

export function createPlaqueTexture(
  work: StudentWorkRaw,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const width = 440;
  const height = 190;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FAF7F0';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(12, 18, 27, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Cohort eyebrow
  ctx.fillStyle = '#736C62';
  ctx.font = '600 20px "Pretendard Variable", sans-serif';
  ctx.fillText(work.cohort, 26, 48);

  // Student Name
  ctx.fillStyle = '#0C121B';
  ctx.font = '700 29px "Outfit", "Pretendard Variable", sans-serif';
  const maxTextW = width - 52;
  let nameText = work.student;
  while (ctx.measureText(nameText).width > maxTextW && nameText.length > 6) {
    nameText = nameText.slice(0, -2) + '…';
  }
  ctx.fillText(nameText, 26, 98);

  // Academy & Year
  ctx.fillStyle = '#4B4842';
  ctx.font = '500 20px "Pretendard Variable", sans-serif';
  ctx.fillText(`${work.academy} · ${work.year}`, 26, 146);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createFrameShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.52,
    size * 0.18,
    size * 0.5,
    size * 0.52,
    size * 0.5
  );
  grad.addColorStop(0, 'rgba(20, 17, 13, 0.28)');
  grad.addColorStop(0.62, 'rgba(20, 17, 13, 0.09)');
  grad.addColorStop(1, 'rgba(20, 17, 13, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Mathematically periodic 1024x1024 45-degree Herringbone oak parquet texture
 * with zero seams when tiled infinitely via RepeatWrapping.
 */
export function createSeamlessHerringboneTexture(
  maxAnisotropy: number
): THREE.CanvasTexture {
  const S = 1024;
  const repeatsAcrossTile = 2;
  const a = S / (repeatsAcrossTile * 8 * Math.SQRT2); // plank width in UV units
  const L = 4 * a; // plank length (4:1 classic proportion)
  const periodUV = 8 * a;

  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  // Grout / plank seam base
  ctx.fillStyle = '#BFB4A0';
  ctx.fillRect(0, 0, S, S);

  // Deterministic pseudo-random helper keyed by integer plank indices
  const hash01 = (x: number, y: number, z: number): number => {
    const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  };

  // Transform canvas so drawing axes align with 45-degree herringbone (u, v)
  ctx.save();
  ctx.rotate(Math.PI / 4);

  const drawPlank = (
    u: number,
    v: number,
    w: number,
    h: number,
    seedA: number,
    seedB: number,
    isVertical: boolean
  ) => {
    const toneRand = hash01(seedA, seedB, isVertical ? 1 : 2);
    const grainRand = hash01(seedA * 3, seedB * 5, isVertical ? 7 : 11);

    // Subtle warm beige-ash oak plank palette matching #EAE1D1 museum walls
    const baseR = Math.round(218 + (toneRand - 0.5) * 14);
    const baseG = Math.round(207 + (toneRand - 0.5) * 13);
    const baseB = Math.round(189 + (toneRand - 0.5) * 12);

    const pad = 0.85;
    const pu = u + pad;
    const pv = v + pad;
    const pw = w - pad * 2;
    const ph = h - pad * 2;

    ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    ctx.fillRect(pu, pv, pw, ph);

    // Subtle longitudinal wood grain lines inside plank
    ctx.save();
    ctx.beginPath();
    ctx.rect(pu, pv, pw, ph);
    ctx.clip();

    const lineCount = 6;
    for (let k = 0; k < lineCount; k++) {
      const f = (k + 0.5 + (grainRand - 0.5) * 0.4) / lineCount;
      const alpha = 0.04 + hash01(seedA + k, seedB, 19) * 0.05;
      ctx.strokeStyle =
        k % 2 === 0
          ? `rgba(148, 134, 114, ${alpha.toFixed(3)})`
          : `rgba(244, 238, 226, ${(alpha * 0.8).toFixed(3)})`;
      ctx.lineWidth = 1.2 + hash01(k, seedA, seedB) * 1.4;
      ctx.beginPath();
      if (isVertical) {
        const lx = pu + pw * f;
        ctx.moveTo(lx, pv);
        ctx.lineTo(lx + (grainRand - 0.5) * 2.5, pv + ph);
      } else {
        const ly = pv + ph * f;
        ctx.moveTo(pu, ly);
        ctx.lineTo(pu + pw, ly + (grainRand - 0.5) * 2.5);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // Cover all rotated (u, v) cells overlapping [0..S, 0..S]
  // Note: Under +45deg rotation around origin, [0..S, 0..S] maps into u in [0, S*sqrt(2)], v in [-S/sqrt(2), S/sqrt(2)]
  for (let m = -2; m <= repeatsAcrossTile * 2 + 1; m++) {
    for (let n = -repeatsAcrossTile - 2; n <= repeatsAcrossTile + 1; n++) {
      // Exact periodic wrapping indices so edge planks get identical hash seeds!
      const wrapM = ((m % repeatsAcrossTile) + repeatsAcrossTile) % repeatsAcrossTile;
      const wrapN = ((n % repeatsAcrossTile) + repeatsAcrossTile) % repeatsAcrossTile;
      //Wait: shifting x by S moves (u,v) by (+S/sqrt(2), -S/sqrt(2)) = (8*2*a, -8*2*a) -> wait m += repeatsAcrossTile, n -= repeatsAcrossTile!
      // Both m and n step by integer multiples of periodUV = 8a, so (m + n) mod repeatsAcrossTile matches? Wait:
      // Shifting x by S shifts (u, v) by (2*periodUV, -2*periodUV) -> m+2, n-2 (both wrap mod repeatsAcrossTile = 2!).
      // Shifting y by S shifts (u, v) by (2*periodUV, +2*periodUV) -> m+2, n+2 (both wrap mod repeatsAcrossTile = 2!).
      const offU = m * periodUV;
      const offV = n * periodUV;

      for (let i = 0; i < 8; i++) {
        const uV = offU + i * a;
        const vV = offV + i * a;
        drawPlank(uV, vV, a, L, wrapM * 8 + i, wrapN * 8 + i, true);

        const uH = offU + (i + 1) * a;
        const vH = offV + i * a;
        drawPlank(uH, vH, L, a, wrapM * 8 + i, wrapN * 8 + i, false);
      }
    }
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Flat, larger bold black Korean typography directly on the front sanctuary wall
 * (no Z-axis offset, no 3D extrusion, no glow halo, no red line).
 */
export function createSanctuaryQuoteTexture(
  maxAnisotropy: number
): THREE.CanvasTexture {
  const width = 2048;
  const height = 640;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#0C121B';
  ctx.font = '700 106px "Pretendard Variable", "Pretendard", sans-serif';
  ctx.fillText('유쾌한 친구들은,', width * 0.5, 225);
  ctx.fillText('이 곳을 명예의 전당이라 불렀습니다.', width * 0.5, 395);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Soft feathered vertical light beam texture (bright near fixture, gently fading to 0)
 * for subtle architectural ceiling spotlight glow.
 */
export function createSpotConeTexture(): THREE.CanvasTexture {
  const width = 128;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(255, 253, 248, 0.85)');
  grad.addColorStop(0.22, 'rgba(255, 252, 244, 0.42)');
  grad.addColorStop(0.65, 'rgba(255, 250, 240, 0.12)');
  grad.addColorStop(1, 'rgba(255, 250, 240, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
