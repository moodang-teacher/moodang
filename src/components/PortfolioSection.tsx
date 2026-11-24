import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import {
  fetchPortfolioWorks,
  type StudentWork,
  type StudentWorkRaw,
} from './gallery/portfolioData';
import {
  createFrameShadowTexture,
  createPlaqueTexture,
  createSeamlessHerringboneTexture,
  createSpotConeTexture,
  detectSoftwareWebGL,
} from './gallery/museumMaterials';

gsap.registerPlugin(ScrollTrigger, SplitText);

const HALL_OF_FAME_URL = 'https://moodang-teacher.github.io/hall_of_fame';

// Grand sweeping concave rotunda arc parameters
const CURVE_RADIUS = 48;
const WALL_HEIGHT = 5.2;
const CAM_OFFSET = 4.6;
const CAM_RADIUS = CURVE_RADIUS - CAM_OFFSET;
const LOOK_AHEAD_THETA = 0.29;
const LOOK_RADIUS = CURVE_RADIUS - 5.6;
const EXHIBIT_ARC_STEP = 2.45; // generous museum gallery breathing room between frames
const EYE_HEIGHT = 1.72;

interface CurvedArtwork extends StudentWork {
  theta: number;
}

interface ArtworkRig {
  work: CurvedArtwork;
  hitMesh: THREE.Mesh;
  frameMat: THREE.MeshStandardMaterial;
  inspectCamPos: THREE.Vector3;
  inspectLookAt: THREE.Vector3;
}

function getArcPoint(radius: number, theta: number): { x: number; z: number } {
  return {
    x: -CURVE_RADIUS + radius * Math.cos(theta),
    z: -radius * Math.sin(theta),
  };
}

function createCurvedRibbonGeometry(
  radius: number,
  height: number,
  yBottom: number,
  thetaStart: number,
  thetaEnd: number,
  segments: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const theta = THREE.MathUtils.lerp(thetaStart, thetaEnd, t);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const x = -CURVE_RADIUS + radius * cosT;
    const z = -radius * sinT;
    const nx = -cosT;
    const nz = sinT;

    positions.push(x, yBottom, z);
    positions.push(x, yBottom + height, z);

    normals.push(nx, 0, nz);
    normals.push(nx, 0, nz);

    uvs.push(t, 0);
    uvs.push(t, 1);

    if (i < segments) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      // Front-facing inward normal winding
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

export default function PortfolioSection() {
  const stageRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const foyerRef = useRef<HTMLDivElement>(null);
  const quotePanelRef = useRef<HTMLDivElement>(null);
  const quoteTextRef = useRef<HTMLParagraphElement>(null);
  const quoteCtaRef = useRef<HTMLAnchorElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [works, setWorks] = useState<CurvedArtwork[]>([]);
  const [selectedWork, setSelectedWork] = useState<CurvedArtwork | null>(null);
  const [hoveredWork, setHoveredWork] = useState<CurvedArtwork | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const selectedWorkRef = useRef<CurvedArtwork | null>(null);
  selectedWorkRef.current = selectedWork;
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    fetchPortfolioWorks().then((rawList: StudentWorkRaw[]) => {
      if (!active) return;
      const dTheta = EXHIBIT_ARC_STEP / CURVE_RADIUS;
      const mapped: CurvedArtwork[] = rawList.map((item, idx) => {
        const theta = idx * dTheta;
        const pos = getArcPoint(CURVE_RADIUS, theta);
        return {
          ...item,
          wall: 'right',
          z: pos.z,
          theta,
        };
      });
      setWorks(mapped);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    requestRenderRef.current?.();
  }, [selectedWork]);

  useEffect(() => {
    if (!selectedWork || works.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedWork(null);
      } else if (e.key === 'ArrowRight') {
        const idx = works.findIndex((w) => w.id === selectedWork.id);
        setSelectedWork(works[(idx + 1) % works.length]);
      } else if (e.key === 'ArrowLeft') {
        const idx = works.findIndex((w) => w.id === selectedWork.id);
        setSelectedWork(works[(idx - 1 + works.length) % works.length]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedWork, works]);

  const stepSelectedWork = useCallback(
    (delta: number) => {
      if (!selectedWork || works.length === 0) return;
      const idx = works.findIndex((w) => w.id === selectedWork.id);
      const nextIdx = (idx + delta + works.length) % works.length;
      setSelectedWork(works[nextIdx]);
    },
    [selectedWork, works]
  );

  useEffect(() => {
    if (prefersReducedMotion || works.length === 0) return;

    const stageEl = stageRef.current;
    const hostEl = canvasHostRef.current;
    const foyerEl = foyerRef.current;
    const quotePanelEl = quotePanelRef.current;
    const quoteTextEl = quoteTextRef.current;
    const quoteCtaEl = quoteCtaRef.current;
    const hudEl = hudRef.current;
    const progressBarEl = progressBarRef.current;
    if (!stageEl || !hostEl) return;

    const firstWorkTheta = works[0].theta;
    const lastWorkTheta = works[works.length - 1].theta;

    const camStartTheta = firstWorkTheta - 0.21; // generous foyer buffer before first recent work
    const camEndTheta = Math.max(firstWorkTheta, lastWorkTheta - 0.2);

    const wallThetaMin = camStartTheta - 0.35;
    const wallThetaMax = lastWorkTheta + 0.85;

    const disposables = {
      geometries: [] as THREE.BufferGeometry[],
      materials: [] as THREE.Material[],
      textures: [] as THREE.Texture[],
      renderTargets: [] as THREE.WebGLRenderTarget[],
    };

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposables.geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      disposables.materials.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      disposables.textures.push(t);
      return t;
    };

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const isSoftwareGl = detectSoftwareWebGL(renderer);
    if (isSoftwareGl) {
      renderer.dispose();
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          powerPreference: 'default',
        });
      } catch {
        return;
      }
    }

    let hostWidth = Math.max(hostEl.clientWidth, 1);
    let hostHeight = Math.max(hostEl.clientHeight, 1);

    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(hostWidth, hostHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = false;

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    hostEl.appendChild(renderer.domElement);

    const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    // Wide architectural museum perspective fading gracefully into warm bright mist
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EAE1D1');
    scene.fog = new THREE.Fog('#EAE1D1', 16, 46);

    const camera = new THREE.PerspectiveCamera(44, hostWidth / hostHeight, 0.1, 80);
    const initCamPt = getArcPoint(CAM_RADIUS, camStartTheta);
    camera.position.set(initCamPt.x, EYE_HEIGHT, initCamPt.z);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.45;

    // Uniform soft daylight preserving clean single-color beige walls & ceiling
    const ambientLight = new THREE.AmbientLight('#FFFDF8', 1.0);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#FFFDF8', '#F6F0E5', 0.65);
    scene.add(hemiLight);

    const softDirLight = new THREE.DirectionalLight('#FFFBF2', 0.14);
    softDirLight.position.set(1.5, 9, 4);
    scene.add(softDirLight);

    let needsRender = true;
    let rafId: number | null = null;
    let isContextLost = false;
    let lastTime = performance.now();

    const scheduleLoop = () => {
      if (rafId === null && !isContextLost) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const requestRender = () => {
      needsRender = true;
      scheduleLoop();
    };
    requestRenderRef.current = requestRender;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    // 1. Expansive Seamless Herringbone Floor (+ Subtle Specular Reflection, completely clear floor)
    const floorSize = 260;
    const floorTex = trackTex(createSeamlessHerringboneTexture(maxAniso));
    const tileWorldSize = 2.7;
    floorTex.repeat.set(floorSize / tileWorldSize, floorSize / tileWorldSize);

    const floorGeo = trackGeo(new THREE.PlaneGeometry(floorSize, floorSize));
    const floorCenterX = -CURVE_RADIUS * 0.55;
    const floorCenterZ = -CURVE_RADIUS * 0.72;

    if (!isSoftwareGl) {
      const floorReflector = new Reflector(floorGeo, {
        clipBias: 0.003,
        textureWidth: 512,
        textureHeight: 512,
        color: 0xe5dccb,
      });
      floorReflector.rotation.x = -Math.PI / 2;
      floorReflector.position.set(floorCenterX, 0, floorCenterZ);
      scene.add(floorReflector);
      const reflectorRt = floorReflector.getRenderTarget();
      if (reflectorRt) disposables.renderTargets.push(reflectorRt);
      trackMat(floorReflector.material as THREE.Material);
    }

    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: floorTex,
        color: '#F3EDE2',
        roughness: 0.42,
        metalness: 0.03,
        transparent: !isSoftwareGl,
        opacity: isSoftwareGl ? 1 : 0.88,
      })
    );
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(floorCenterX, isSoftwareGl ? 0 : 0.003, floorCenterZ);
    scene.add(floorMesh);

    // 2. Single Uniform Beige Curved Wall & Single Uniform Beige Ceiling
    const wallMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#EAE1D1',
        roughness: 0.94,
        metalness: 0.0,
      })
    );

    const ceilingMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#EAE1D1',
        roughness: 0.94,
        metalness: 0.0,
        side: THREE.DoubleSide,
      })
    );

    const curvedWallGeo = trackGeo(
      createCurvedRibbonGeometry(
        CURVE_RADIUS,
        WALL_HEIGHT,
        0,
        wallThetaMin,
        wallThetaMax,
        180
      )
    );
    const curvedWallMesh = new THREE.Mesh(curvedWallGeo, wallMat);
    scene.add(curvedWallMesh);

    const ceilingGeo = trackGeo(new THREE.PlaneGeometry(floorSize, floorSize));
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(floorCenterX, WALL_HEIGHT, floorCenterZ);
    scene.add(ceilingMesh);

    // 3. Curved Ceiling Track Lighting Following the Sweeping Wall
    const trackRadius = CURVE_RADIUS - 1.65;
    const trackY = WALL_HEIGHT - 0.025;
    const curvedTrackGeo = trackGeo(
      createCurvedRibbonGeometry(
        trackRadius,
        0.04,
        trackY,
        wallThetaMin,
        wallThetaMax,
        160
      )
    );
    const railMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#23262C',
        roughness: 0.42,
        metalness: 0.58,
        side: THREE.DoubleSide,
      })
    );
    const curvedTrackMesh = new THREE.Mesh(curvedTrackGeo, railMat);
    scene.add(curvedTrackMesh);

    const spotConeTex = trackTex(createSpotConeTexture());
    const railBeamMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: spotConeTex,
        color: '#FFFDF7',
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );

    if (works.length > 0) {
      const stemGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 10));
      const canGeo = trackGeo(new THREE.CylinderGeometry(0.046, 0.052, 0.19, 16));
      canGeo.rotateX(-Math.PI / 2);
      const lensGeo = trackGeo(new THREE.CircleGeometry(0.04, 16));
      const beamLen = 1.65;
      const beamGeo = trackGeo(
        new THREE.CylinderGeometry(0.038, 0.36, beamLen, 16, 1, true)
      );
      beamGeo.translate(0, -beamLen * 0.5, 0);
      beamGeo.rotateX(-Math.PI / 2);

      const housingMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#1E2127',
          roughness: 0.38,
          metalness: 0.62,
        })
      );
      const lensMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: '#FFFDF7',
          toneMapped: false,
        })
      );

      const count = works.length;
      const stemInst = new THREE.InstancedMesh(stemGeo, housingMat, count);
      const canInst = new THREE.InstancedMesh(canGeo, housingMat, count);
      const lensInst = new THREE.InstancedMesh(lensGeo, lensMat, count);
      const beamInst = new THREE.InstancedMesh(beamGeo, railBeamMat, count);

      const dummy = new THREE.Object3D();
      const aimTarget = new THREE.Vector3();
      const lensOffset = new THREE.Vector3();

      works.forEach((w, i) => {
        const sp = getArcPoint(trackRadius, w.theta);
        const wp = getArcPoint(CURVE_RADIUS, w.theta);

        dummy.position.set(sp.x, trackY - 0.06, sp.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        stemInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(sp.x, trackY - 0.13, sp.z);
        aimTarget.set(wp.x, 1.98, wp.z);
        dummy.lookAt(aimTarget);
        dummy.updateMatrix();
        canInst.setMatrixAt(i, dummy.matrix);

        const headPos = dummy.position.clone();
        const headQuat = dummy.quaternion.clone();

        lensOffset.set(0, 0, 0.098).applyQuaternion(headQuat);
        dummy.position.copy(headPos).add(lensOffset);
        dummy.updateMatrix();
        lensInst.setMatrixAt(i, dummy.matrix);

        dummy.position.copy(headPos).add(lensOffset);
        dummy.quaternion.copy(headQuat);
        dummy.updateMatrix();
        beamInst.setMatrixAt(i, dummy.matrix);
      });

      stemInst.instanceMatrix.needsUpdate = true;
      canInst.instanceMatrix.needsUpdate = true;
      lensInst.instanceMatrix.needsUpdate = true;
      beamInst.instanceMatrix.needsUpdate = true;

      scene.add(stemInst);
      scene.add(canInst);
      scene.add(lensInst);
      scene.add(beamInst);
    }

    // 4. Framed Student Portfolio Works Arranged Tangentially Along the Curved Wall
    const rigs: ArtworkRig[] = [];
    const hitMeshes: THREE.Mesh[] = [];

    const maxArtW = 1.24;
    const maxArtH = 0.88;
    const innerW = 1.48;
    const innerH = 1.08;
    const frameBorder = 0.032;
    const frameDepth = 0.052;
    const outerW = innerW + frameBorder * 2;
    const outerH = innerH + frameBorder * 2;

    const frameShadowTex = trackTex(createFrameShadowTexture());
    const frameShadowMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: frameShadowTex,
        transparent: true,
        depthWrite: false,
      })
    );

    const shadowGeo = trackGeo(new THREE.PlaneGeometry(outerW + 0.3, outerH + 0.3));
    const spacerGeo = trackGeo(
      new THREE.BoxGeometry(outerW - 0.08, outerH - 0.08, 0.016)
    );
    const topBottomRailGeo = trackGeo(
      new THREE.BoxGeometry(outerW, frameBorder, frameDepth)
    );
    const leftRightRailGeo = trackGeo(
      new THREE.BoxGeometry(frameBorder, innerH, frameDepth)
    );
    const matGeo = trackGeo(new THREE.BoxGeometry(innerW, innerH, 0.016));
    const unitArtGeo = trackGeo(new THREE.PlaneGeometry(1, 1));
    const hitGeo = trackGeo(new THREE.PlaneGeometry(outerW + 0.16, outerH + 0.24));
    const plaqueGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.198, 0.01));

    const matBoardMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#FAF7F0',
        roughness: 0.9,
        metalness: 0.0,
      })
    );

    const backingMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#CFC7B8',
        roughness: 0.9,
      })
    );

    const placeholderArtMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#DFD7C8',
        roughness: 0.7,
      })
    );

    works.forEach((work) => {
      const wp = getArcPoint(CURVE_RADIUS, work.theta);
      const nx = -Math.cos(work.theta);
      const nz = Math.sin(work.theta);

      const bayGroup = new THREE.Group();
      // Slightly proud off the curved chord (~0.015m) so edges never sink into the arc
      bayGroup.position.set(wp.x + nx * 0.018, 1.94, wp.z + nz * 0.018);
      bayGroup.lookAt(wp.x + nx * 2, 1.94, wp.z + nz * 2);
      scene.add(bayGroup);

      const shadowMesh = new THREE.Mesh(shadowGeo, frameShadowMat);
      shadowMesh.position.set(0, -0.03, 0.006);
      bayGroup.add(shadowMesh);

      const frameMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#1F1D1A',
          roughness: 0.36,
          metalness: 0.45,
          emissive: '#000000',
          emissiveIntensity: 0,
        })
      );

      const spacerMesh = new THREE.Mesh(spacerGeo, backingMat);
      spacerMesh.position.z = 0.014;
      bayGroup.add(spacerMesh);

      const topRail = new THREE.Mesh(topBottomRailGeo, frameMat);
      topRail.position.set(0, innerH * 0.5 + frameBorder * 0.5, 0.042);
      bayGroup.add(topRail);

      const bottomRail = new THREE.Mesh(topBottomRailGeo, frameMat);
      bottomRail.position.set(0, -innerH * 0.5 - frameBorder * 0.5, 0.042);
      bayGroup.add(bottomRail);

      const leftFrameRail = new THREE.Mesh(leftRightRailGeo, frameMat);
      leftFrameRail.position.set(-innerW * 0.5 - frameBorder * 0.5, 0, 0.042);
      bayGroup.add(leftFrameRail);

      const rightFrameRail = new THREE.Mesh(leftRightRailGeo, frameMat);
      rightFrameRail.position.set(innerW * 0.5 + frameBorder * 0.5, 0, 0.042);
      bayGroup.add(rightFrameRail);

      const matMesh = new THREE.Mesh(matGeo, matBoardMat);
      matMesh.position.set(0, 0, 0.028);
      bayGroup.add(matMesh);

      const artMesh = new THREE.Mesh(unitArtGeo, placeholderArtMat);
      artMesh.scale.set(maxArtW, maxArtH, 1);
      artMesh.position.set(0, 0, 0.04);
      bayGroup.add(artMesh);

      const artTexture = trackTex(
        textureLoader.load(work.image, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = maxAniso;
          tex.needsUpdate = true;

          const imgEl = tex.image as { width?: number; height?: number } | undefined;
          if (imgEl && imgEl.width && imgEl.height) {
            const natAspect = imgEl.width / imgEl.height;
            let fitW = maxArtW;
            let fitH = fitW / natAspect;
            if (fitH > maxArtH) {
              fitH = maxArtH;
              fitW = fitH * natAspect;
            }
            artMesh.scale.set(fitW, fitH, 1);
          }

          const loadedMat = trackMat(
            new THREE.MeshPhysicalMaterial({
              map: tex,
              color: '#FFFFFF',
              roughness: 0.4,
              metalness: 0.0,
              clearcoat: 0.28,
              clearcoatRoughness: 0.2,
            })
          );
          artMesh.material = loadedMat;
          requestRender();
        })
      );
      artTexture.colorSpace = THREE.SRGBColorSpace;

      const hitMat = trackMat(
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.set(0, 0, 0.08);
      hitMesh.userData.workId = work.id;
      bayGroup.add(hitMesh);
      hitMeshes.push(hitMesh);

      const plaqueTex = trackTex(createPlaqueTexture(work, maxAniso));
      const plaqueMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: plaqueTex,
          roughness: 0.65,
          metalness: 0.02,
        })
      );
      const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
      plaqueMesh.position.set(0, -(outerH * 0.5 + 0.17), 0.012);
      bayGroup.add(plaqueMesh);

      const inspectCamPos = new THREE.Vector3(
        wp.x + nx * 2.3,
        1.92,
        wp.z + nz * 2.3
      );
      const inspectLookAt = new THREE.Vector3(wp.x, 1.94, wp.z);

      rigs.push({
        work,
        hitMesh,
        frameMat,
        inspectCamPos,
        inspectLookAt,
      });
    });

    // Camera Sweeping Traversal Along the Curved Arc
    let scrollProgress = 0;
    let pointerNdcX = 0;
    let pointerNdcY = 0;
    let hoveredWorkId: string | null = null;

    const initLookPt = getArcPoint(LOOK_RADIUS, camStartTheta + LOOK_AHEAD_THETA);
    const currentCamPos = new THREE.Vector3(initCamPt.x, EYE_HEIGHT, initCamPt.z);
    const currentLookAt = new THREE.Vector3(initLookPt.x, 1.88, initLookPt.z);
    const targetCamPos = new THREE.Vector3().copy(currentCamPos);
    const targetLookAt = new THREE.Vector3().copy(currentLookAt);

    const raycaster = new THREE.Raycaster();
    const pointerVec = new THREE.Vector2();

    const updateTargets = () => {
      const selected = selectedWorkRef.current;
      if (selected) {
        const rig = rigs.find((r) => r.work.id === selected.id);
        if (rig) {
          targetCamPos.copy(rig.inspectCamPos);
          targetLookAt.copy(rig.inspectLookAt);
          return;
        }
      }

      // First 8% eases into foyer curve, remaining 92% glides along all 49 works
      let thetaC: number;
      if (scrollProgress <= 0.08) {
        const foyerT = THREE.MathUtils.clamp(scrollProgress / 0.08, 0, 1);
        thetaC = THREE.MathUtils.lerp(camStartTheta, camStartTheta + 0.04, foyerT);
      } else {
        const walkT = THREE.MathUtils.clamp((scrollProgress - 0.08) / 0.92, 0, 1);
        thetaC = THREE.MathUtils.lerp(camStartTheta + 0.04, camEndTheta, walkT);
      }

      const camPt = getArcPoint(CAM_RADIUS, thetaC);
      const lookPt = getArcPoint(LOOK_RADIUS, thetaC + LOOK_AHEAD_THETA);

      const nx = -Math.cos(thetaC);
      const nz = Math.sin(thetaC);

      targetCamPos.set(
        camPt.x + nx * (pointerNdcX * 0.14),
        EYE_HEIGHT,
        camPt.z + nz * (pointerNdcX * 0.14)
      );
      targetLookAt.set(
        lookPt.x + nx * (pointerNdcX * 0.45),
        1.88 + pointerNdcY * 0.16,
        lookPt.z + nz * (pointerNdcX * 0.45)
      );
    };

    function tick(now: number) {
      rafId = null;
      if (isContextLost || !renderer) return;

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      updateTargets();

      const lambda = selectedWorkRef.current ? 7.5 : 8.5;
      currentCamPos.x = THREE.MathUtils.damp(currentCamPos.x, targetCamPos.x, lambda, dt);
      currentCamPos.y = THREE.MathUtils.damp(currentCamPos.y, targetCamPos.y, lambda, dt);
      currentCamPos.z = THREE.MathUtils.damp(currentCamPos.z, targetCamPos.z, lambda, dt);

      currentLookAt.x = THREE.MathUtils.damp(currentLookAt.x, targetLookAt.x, lambda, dt);
      currentLookAt.y = THREE.MathUtils.damp(currentLookAt.y, targetLookAt.y, lambda, dt);
      currentLookAt.z = THREE.MathUtils.damp(currentLookAt.z, targetLookAt.z, lambda, dt);

      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);
      camera.updateMatrixWorld();

      let frameAnim = false;
      for (const rig of rigs) {
        const isActive =
          rig.work.id === hoveredWorkId ||
          rig.work.id === selectedWorkRef.current?.id;
        const targetEmissive = isActive ? 0.22 : 0;
        const nextEmissive = THREE.MathUtils.damp(
          rig.frameMat.emissiveIntensity,
          targetEmissive,
          9,
          dt
        );
        if (Math.abs(nextEmissive - targetEmissive) > 0.004) {
          frameAnim = true;
        }
        rig.frameMat.emissive.set('#A52A43');
        rig.frameMat.emissiveIntensity = nextEmissive;
      }

      renderer.render(scene, camera);

      const posDelta = currentCamPos.distanceToSquared(targetCamPos);
      const lookDelta = currentLookAt.distanceToSquared(targetLookAt);

      if (needsRender || posDelta > 0.00001 || lookDelta > 0.00001 || frameAnim) {
        needsRender = false;
        scheduleLoop();
      }
    }

    let downX = 0;
    let downY = 0;
    let lastMoveCheck = 0;

    const performRaycast = (clientX: number, clientY: number): CurvedArtwork | null => {
      const rect = renderer!.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      pointerVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerVec, camera);
      const hits = raycaster.intersectObjects(hitMeshes, false);
      if (hits.length === 0) return null;

      const hitWorkId = hits[0].object.userData.workId as string | undefined;
      return works.find((w) => w.id === hitWorkId) ?? null;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (selectedWorkRef.current) return;
      const rect = renderer!.domElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerNdcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }

      const now = performance.now();
      if (now - lastMoveCheck > 32) {
        lastMoveCheck = now;
        const hit = performRaycast(e.clientX, e.clientY);
        const nextId = hit?.id ?? null;
        if (nextId !== hoveredWorkId) {
          hoveredWorkId = nextId;
          setHoveredWork(hit);
          renderer!.domElement.style.cursor = hit ? 'pointer' : 'default';
        }
      }
      requestRender();
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (selectedWorkRef.current) return;
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 8) return;

      const hit = performRaycast(e.clientX, e.clientY);
      if (hit) {
        setSelectedWork(hit);
        setHoveredWork(null);
        hoveredWorkId = null;
        if (renderer) renderer.domElement.style.cursor = 'default';
      }
    };

    const onPointerLeave = () => {
      pointerNdcX = 0;
      pointerNdcY = 0;
      if (hoveredWorkId !== null) {
        hoveredWorkId = null;
        setHoveredWork(null);
        if (renderer) renderer.domElement.style.cursor = 'default';
      }
      requestRender();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('pointerleave', onPointerLeave);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
    const onContextRestored = () => {
      isContextLost = false;
      requestRender();
    };
    domEl.addEventListener('webglcontextlost', onContextLost);
    domEl.addEventListener('webglcontextrestored', onContextRestored);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !renderer) return;
      hostWidth = Math.max(Math.floor(entry.contentRect.width), 1);
      hostHeight = Math.max(Math.floor(entry.contentRect.height), 1);
      renderer.setSize(hostWidth, hostHeight, false);
      camera.aspect = hostWidth / hostHeight;
      camera.updateProjectionMatrix();
      requestRender();
    });
    resizeObserver.observe(hostEl);

    const scrollDistance = Math.max(5800, works.length * 165);
    let quoteSplit: SplitText | null = null;
    const ctx = gsap.context(() => {
      let quoteTl: gsap.core.Timeline | null = null;
      let quoteRevealed = false;

      if (quotePanelEl && quoteTextEl) {
        quoteSplit = SplitText.create(quoteTextEl, {
          type: 'lines,words,chars',
          mask: 'lines',
          linesClass: 'pb-[0.06em]',
        });

        gsap.set(quotePanelEl, { autoAlpha: 0, pointerEvents: 'none' });
        gsap.set(quoteSplit.chars, { yPercent: 112, opacity: 0 });
        if (quoteCtaEl) {
          gsap.set(quoteCtaEl, { y: 14, opacity: 0 });
        }

        quoteTl = gsap.timeline({ paused: true });
        quoteTl
          .set(quotePanelEl, { autoAlpha: 1, pointerEvents: 'auto' })
          .to(quoteSplit.chars, {
            yPercent: 0,
            opacity: 1,
            duration: 0.78,
            stagger: 0.02,
            ease: 'power3.out',
          });

        if (quoteCtaEl) {
          quoteTl.to(
            quoteCtaEl,
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              ease: 'power3.out',
            },
            '-=0.42'
          );
        }
      }

      ScrollTrigger.create({
        trigger: stageEl,
        start: 'top top',
        end: `+=${scrollDistance}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.75,
        anticipatePin: 1,
        refreshPriority: 20,
        onUpdate: (self) => {
          scrollProgress = self.progress;

          if (foyerEl) {
            const foyerProgress = THREE.MathUtils.clamp(scrollProgress / 0.1, 0, 1);
            gsap.set(foyerEl, {
              opacity: 1 - foyerProgress,
              y: -36 * foyerProgress,
            });
          }

          // Trigger standalone SplitText entrance once reaching the gallery zone (independent of scroll speed)
          if (quoteTl) {
            if (!quoteRevealed && scrollProgress >= 0.08) {
              quoteRevealed = true;
              quoteTl.timeScale(1).play();
            } else if (quoteRevealed && scrollProgress < 0.035) {
              quoteRevealed = false;
              quoteTl.timeScale(1.6).reverse();
            }
          }

          if (hudEl) {
            const hudAlpha = THREE.MathUtils.clamp(0.75 + scrollProgress * 2.5, 0.75, 1);
            hudEl.style.opacity = String(hudAlpha);
          }

          if (progressBarEl) {
            progressBarEl.style.width = `${Math.max(3, scrollProgress * 100)}%`;
          }

          requestRender();
        },
      });
    }, stageEl);

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    requestRender();

    return () => {
      quoteSplit?.revert();
      ctx.revert();
      resizeObserver.disconnect();

      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('pointerleave', onPointerLeave);
      domEl.removeEventListener('webglcontextlost', onContextLost);
      domEl.removeEventListener('webglcontextrestored', onContextRestored);

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());
      disposables.renderTargets.forEach((rt) => rt.dispose());
      envTarget.dispose();
      pmremGenerator.dispose();
      roomEnv.dispose();
      renderer?.dispose();

      if (domEl.parentNode === hostEl) {
        hostEl.removeChild(domEl);
      }
      requestRenderRef.current = null;
    };
  }, [prefersReducedMotion, works]);

  return (
    <section
      id="portfolio"
      ref={stageRef}
      aria-label="Portfolio — Student Works Gallery"
      className={`relative ${
        selectedWork ? 'z-50' : 'z-20'
      } w-full min-h-[100dvh] h-[100dvh] overflow-hidden bg-[#EAE1D1] text-[#0C121B]`}
    >
      {!prefersReducedMotion ? (
        <>
          {/* Sweeping Curved 3D Gallery Stage */}
          <div
            ref={canvasHostRef}
            className={`absolute inset-0 w-full h-full transition-[filter,transform] duration-500 ease-out origin-center ${
              selectedWork
                ? 'blur-md scale-[1.02] brightness-95 pointer-events-none'
                : 'blur-0 scale-100 brightness-100'
            }`}
          />

          {/* Bright Gallery Foyer Header */}
          <div
            ref={foyerRef}
            className="pointer-events-none absolute inset-x-0 top-[10.5%] sm:top-[11%] z-10 flex flex-col items-center text-center px-6 will-change-transform"
          >
            <p className="text-xs sm:text-[13px] font-medium tracking-[0.2em] text-[#0C121B]/55">
              모두 내 아픈 손가락
            </p>
            <h2 className="mt-2 font-display text-[clamp(2.3rem,4.5vw,3.75rem)] font-bold tracking-[-0.03em] leading-none text-[#0C121B]">
              portfolio<span className="text-[#A52A43]">.</span>
            </h2>
            <p className="mt-6 font-brush text-[8.5vw] sm:text-[6vw] md:text-[clamp(2.75rem,4.6vw,6.25rem)] font-normal tracking-[0.08em] leading-none whitespace-nowrap text-[#A52A43]">
              靑出於藍
            </p>
          </div>

          {/* Left Open-Zone Editorial Quote & Always-Accessible External Button (Blue Box Zone) */}
          <div
            ref={quotePanelRef}
            style={{ opacity: 0, visibility: 'hidden', pointerEvents: 'none' }}
            className={`absolute z-10 left-6 right-6 sm:left-10 sm:right-auto md:left-14 lg:left-20 top-[14%] md:top-[46%] md:-translate-y-1/2 sm:max-w-[88vw] md:max-w-[58vw] ${
              selectedWork ? '!opacity-0 !pointer-events-none' : ''
            }`}
          >
            <p
              ref={quoteTextRef}
              className="text-[7.2vw] sm:text-[6.2vw] md:text-[4.2vw] lg:text-[3.5vw] font-bold leading-[1.38] tracking-[-0.025em] text-[#0C121B]"
            >
              유쾌한 친구들은,
              <br />이 곳을
              <br />명예의 전당이라 불렀습니다.
            </p>

            <a
              ref={quoteCtaRef}
              href={HALL_OF_FAME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#0C121B] text-[#FAF8F3] hover:bg-[#A52A43] text-sm sm:text-base font-semibold tracking-[0.04em] shadow-[0_14px_36px_rgba(12,18,27,0.18)] transition-colors duration-200 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A52A43]"
            >
              <span>새 창에서 열기</span>
              <ArrowUpRight size={18} />
            </a>
          </div>

          {/* Bottom Instruction & Working Progress Bar */}
          <div
            ref={hudRef}
            className={`pointer-events-none absolute inset-x-0 bottom-6 sm:bottom-8 z-20 px-6 flex flex-col items-center gap-2.5 transition-opacity duration-300 ${
              selectedWork ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <p className="text-[11px] sm:text-xs font-medium tracking-[0.06em] text-[#0C121B]/75 h-4 text-center">
              {hoveredWork ? (
                <>
                  <span className="font-semibold text-[#0C121B]">
                    {hoveredWork.student}
                  </span>
                  <span className="text-[#0C121B]/55 ml-2">
                    {hoveredWork.cohort} — 클릭하여 작품 상세 보기
                  </span>
                </>
              ) : (
                <span>
                  스크롤하여 전시실 전진 · 벽면 작품 클릭 시 상세 정보
                </span>
              )}
            </p>

            <div className="w-40 sm:w-56 h-[2.5px] bg-[#0C121B]/18 overflow-hidden">
              <div
                ref={progressBarRef}
                style={{ width: '3%' }}
                className="h-full bg-[#A52A43]"
              />
            </div>
          </div>
        </>
      ) : (
        /* Reduced-Motion Accessible Grid of All Cohort Student Works */
        <div className="relative z-10 w-full h-full overflow-y-auto py-20 px-6 sm:px-10">
          <div className="max-w-[1160px] mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-medium tracking-[0.2em] text-[#0C121B]/55">
                모두 내 아픈 손가락
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-[#0C121B]">
                portfolio<span className="text-[#A52A43]">.</span>
              </h2>
              <p className="mt-6 font-brush text-5xl sm:text-6xl text-[#A52A43]">
                靑出於藍
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {works.map((work) => (
                <button
                  key={work.id}
                  type="button"
                  onClick={() => setSelectedWork(work)}
                  className="group text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A52A43]"
                >
                  <div className="aspect-[4/3] bg-[#F7F4ED] p-3 border border-[#0C121B]/15 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                    <img
                      src={work.image}
                      alt={work.student}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-[#A52A43]">
                      {work.cohort}
                    </span>
                    <span className="font-display text-xs text-[#0C121B]/50">
                      {work.year}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-[#0C121B] group-hover:text-[#A52A43] transition-colors">
                    {work.student}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#0C121B]/65">
                    {work.academy}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-16 pt-12 border-t border-[#0C121B]/12 text-center">
              <p className="text-2xl sm:text-3xl font-bold leading-relaxed text-[#0C121B]">
                유쾌한 친구들은,
                <br />이 곳을
                <br />명예의 전당이라 불렀습니다.
              </p>
              <a
                href={HALL_OF_FAME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#0C121B] text-[#FAF8F3] hover:bg-[#A52A43] text-sm sm:text-base font-semibold tracking-[0.04em] transition-colors"
              >
                <span>새 창에서 열기</span>
                <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Focused Student Work Detail Modal (Blurred Gallery Background) */}
      {selectedWork && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="work-modal-title"
          onClick={() => setSelectedWork(null)}
          className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#EAE1D1]/45"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[920px] max-h-[86dvh] flex flex-col bg-[#F7F4ED] text-[#0C121B] border border-[#0C121B]/12 shadow-[0_32px_90px_rgba(12,18,27,0.22)]"
          >
            <button
              type="button"
              onClick={() => setSelectedWork(null)}
              aria-label="작품 상세 닫기"
              className="absolute top-3.5 right-3.5 z-30 inline-flex items-center justify-center w-9 h-9 text-[#0C121B]/60 hover:text-[#A52A43] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A52A43]"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
              <div className="bg-[#E5DFD3] pt-14 px-6 pb-6 sm:p-8 flex items-center justify-center">
                <div className="bg-[#FAF8F3] p-3 border-[5px] border-[#1F1D1A] shadow-[0_18px_40px_rgba(12,18,27,0.2)] max-h-[40dvh] md:max-h-[60dvh] flex items-center justify-center">
                  <img
                    src={selectedWork.image}
                    alt={selectedWork.student}
                    className="max-h-[34dvh] md:max-h-[52dvh] w-auto object-contain"
                  />
                </div>
              </div>

              <div className="p-6 sm:p-9 flex flex-col justify-between gap-6">
                <div>
                  <p className="text-xs font-medium tracking-[0.08em] text-[#A52A43]">
                    {selectedWork.cohort}
                  </p>

                  <h3
                    id="work-modal-title"
                    className="mt-2.5 font-display text-2xl sm:text-[1.75rem] font-bold tracking-[-0.025em] leading-[1.15] text-[#0C121B]"
                  >
                    {selectedWork.student}
                  </h3>

                  <dl className="mt-6 pt-5 border-t border-[#0C121B]/10 grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                    <div>
                      <dt className="text-[11px] font-medium tracking-[0.08em] text-[#0C121B]/45">
                        교육 기관
                      </dt>
                      <dd className="mt-1 font-semibold text-[#0C121B]">
                        {selectedWork.academy}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium tracking-[0.08em] text-[#0C121B]/45">
                        연도
                      </dt>
                      <dd className="mt-1 font-display font-semibold tabular-nums text-[#0C121B]">
                        {selectedWork.year}
                      </dd>
                    </div>
                  </dl>

                  {selectedWork.note && (
                    <p className="mt-5 text-sm leading-relaxed text-[#0C121B]/75">
                      {selectedWork.note}
                    </p>
                  )}

                  <a
                    href={selectedWork.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0C121B] text-[#FAF8F3] hover:bg-[#A52A43] text-xs font-medium tracking-[0.06em] transition-colors"
                  >
                    <span>포트폴리오 사이트 보기</span>
                    <ArrowUpRight size={15} />
                  </a>
                </div>

                <div className="pt-5 border-t border-[#0C121B]/10 flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => stepSelectedWork(-1)}
                      className="inline-flex items-center gap-1.5 text-[#0C121B]/65 hover:text-[#A52A43] transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>이전 작품</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => stepSelectedWork(1)}
                      className="inline-flex items-center gap-1.5 text-[#0C121B]/65 hover:text-[#A52A43] transition-colors cursor-pointer"
                    >
                      <span>다음 작품</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
