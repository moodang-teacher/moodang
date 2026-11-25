import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Matter from 'matter-js';
import HanjaArtwork from './HanjaArtwork';
import TearsInRainSection, { type TearsInRainHandle } from './TearsInRainSection';

gsap.registerPlugin(ScrollTrigger);

const MAKGEOLLI_IMG_SRC = '/assets/aistudio/makgeolli-sprite.webp';

const PORTRAIT_SEQUENCE_SRCS = [
  '/assets/aistudio/P20220616_002951331_8F0899B1-B9AB-48AC-8244-4152D2BE63A9_c5efede3.webp',
  '/assets/aistudio/P20220616_002951378_99B1BD13-9F9A-4EDC-B3D6-426FEE2C5E70_66012070.webp',
  '/assets/aistudio/P20220616_002951403_B6E3D026-E9EA-47F9-8DF4-76A165343033_170096cf.webp',
  '/assets/aistudio/P20220616_002951431_FE7C26CE-88E7-45CE-BE40-694A00E29D9F_aa2f4d34.webp',
  '/assets/aistudio/P20220616_002951456_4145C05A-D09F-468F-9151-D7D5C7A48B10_36b82bc9.webp',
  '/assets/aistudio/P20220616_002951593_828A16AE-AB58-4D96-BB14-2742DAAF5222_af2cd672.webp',
  '/assets/aistudio/P20220616_002951627_37F44D14-6657-421A-90A4-3C90C279BAC5_a3a587c1.webp',
  '/assets/aistudio/P20220616_002951661_817190CC-DEEB-4FFE-955A-3E591F377E2E_fec33ca5.webp',
];

const CAREER_ITEMS = [
  '인천직업전문학교',
  '하이미디어 아카데미',
  '레브아트 일산',
  '(주)채티비 기획운영본부 이사',
  '서울과학기술대학교 공업디자인',
];

const CAREER_BASE_YEAR = 2026;
const koreaYear = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
});

interface BottleMeta {
  body: Matter.Body;
  width: number;
  height: number;
  comOffsetY: number;
}

function buildGradedBottleSprite(img: HTMLImageElement): HTMLCanvasElement {
  const targetHeight = 520;
  const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
  const targetWidth = Math.round(targetHeight * aspect);

  const offscreen = document.createElement('canvas');
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;

  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;

  // Base moody B-movie film color grading (shifts pure white toward aged bone, cools vivid greens)
  ctx.save();
  if ('filter' in ctx) {
    ctx.filter = 'sepia(0.22) saturate(0.58) contrast(1.14) brightness(0.78)';
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // Cylindrical noir studio lighting across bottle silhouette (source-atop preserves alpha cutout)
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';

  const sideGrad = ctx.createLinearGradient(0, 0, targetWidth, 0);
  sideGrad.addColorStop(0, 'rgba(215, 208, 195, 0.14)');
  sideGrad.addColorStop(0.28, 'rgba(12, 18, 27, 0.04)');
  sideGrad.addColorStop(0.72, 'rgba(12, 18, 27, 0.34)');
  sideGrad.addColorStop(1, 'rgba(12, 18, 27, 0.56)');
  ctx.fillStyle = sideGrad;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Subtle Black-Navy ambient wash + faint crimson bounce at the base
  const moodGrad = ctx.createLinearGradient(0, 0, 0, targetHeight);
  moodGrad.addColorStop(0, 'rgba(12, 18, 27, 0.18)');
  moodGrad.addColorStop(0.65, 'rgba(12, 18, 27, 0.12)');
  moodGrad.addColorStop(1, 'rgba(165, 42, 67, 0.14)');
  ctx.fillStyle = moodGrad;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  ctx.restore();
  return offscreen;
}

export default function AboutSection() {
  const additionalYears = Number(koreaYear.format(new Date())) - CAREER_BASE_YEAR;
  const stats = [
    { value: 18 + additionalYears, unit: 'years.', label: '실무경력' },
    { value: 16 + additionalYears, unit: 'years.', label: '강의경력' },
    { value: 4.8, unit: 'mark.', label: '강의만족도' },
  ];

  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const tearsHandleRef = useRef<TearsInRainHandle>(null);
  const makgeolliLayerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aboutMeLayerRef = useRef<HTMLDivElement>(null);
  const portraitMotionRef = useRef<HTMLDivElement>(null);
  const glitchPortraitRef = useRef<HTMLDivElement>(null);
  const glitchSlice1Ref = useRef<HTMLDivElement>(null);
  const glitchSlice2Ref = useRef<HTMLDivElement>(null);
  const glitchSlice3Ref = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const projectorFlickerRef = useRef<HTMLDivElement>(null);
  const filmScratchRef = useRef<HTMLDivElement>(null);
  const filmScratch2Ref = useRef<HTMLDivElement>(null);
  const portraitImgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const statGlitchRefs = useRef<(HTMLElement | null)[]>([]);
  const aboutContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stageEl = stageRef.current;
    const sectionEl = sectionRef.current;
    const canvasEl = canvasRef.current;
    const makgeolliLayerEl = makgeolliLayerRef.current;
    const aboutMeLayerEl = aboutMeLayerRef.current;
    const aboutContentEl = aboutContentRef.current;
    if (
      !stageEl ||
      !sectionEl ||
      !canvasEl ||
      !makgeolliLayerEl ||
      !aboutMeLayerEl ||
      !aboutContentEl
    ) {
      return;
    }

    const ctx2d = canvasEl.getContext('2d');
    if (!ctx2d) return;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 2.35, scale: 0.001 },
      positionIterations: 8,
      velocityIterations: 6,
    });

    let width = document.documentElement.clientWidth || window.innerWidth;
    let height = window.innerHeight || sectionEl.clientHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let walls: Matter.Body[] = [];
    const bottles: BottleMeta[] = [];
    let spriteCanvas: HTMLCanvasElement | null = null;
    let bottleAspect = 0.31;

    let rafId: number | null = null;
    let lastTime = 0;
    let spawnTimerIds: number[] = [];
    let resizeDebounceId: number | null = null;
    let portraitTimerId: number | null = null;
    let portraitTween: gsap.core.Tween | undefined;
    let currentPortraitIndex = 0;
    let isSimulationActive = false;
    let isAboutPinned = false;
    let isMakgeolliVisible = false;
    let lastSpawnWidth = width;
    let isDestroyed = false;

    const getViewportSize = () => {
      const nextWidth =
        document.documentElement.clientWidth ||
        window.innerWidth ||
        sectionEl.clientWidth;
      const nextHeight =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        sectionEl.clientHeight;
      return { nextWidth, nextHeight };
    };

    const syncCanvasSize = () => {
      const { nextWidth, nextHeight } = getViewportSize();
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = isMakgeolliVisible ? Math.round(nextWidth * nextDpr) : 1;
      const pixelHeight = isMakgeolliVisible ? Math.round(nextHeight * nextDpr) : 1;
      const changed = width !== nextWidth || height !== nextHeight || dpr !== nextDpr;
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;

      if (canvasEl.width !== pixelWidth) canvasEl.width = pixelWidth;
      if (canvasEl.height !== pixelHeight) canvasEl.height = pixelHeight;
      return changed;
    };

    const rebuildBoundaries = () => {
      if (walls.length > 0) {
        Matter.Composite.remove(engine.world, walls);
      }

      const wallThickness = 120;
      const floor = Matter.Bodies.rectangle(
        width / 2,
        height + wallThickness / 2 - 4,
        width + wallThickness * 2,
        wallThickness,
        {
          isStatic: true,
          friction: 0.85,
          restitution: 0.18,
        }
      );
      const leftWall = Matter.Bodies.rectangle(
        -wallThickness / 2,
        height / 2 - 300,
        wallThickness,
        height + 1600,
        {
          isStatic: true,
          friction: 0.4,
          restitution: 0.25,
        }
      );
      const rightWall = Matter.Bodies.rectangle(
        width + wallThickness / 2,
        height / 2 - 300,
        wallThickness,
        height + 1600,
        {
          isStatic: true,
          friction: 0.4,
          restitution: 0.25,
        }
      );

      walls = [floor, leftWall, rightWall];
      Matter.Composite.add(engine.world, walls);
    };

    const createBottleBody = (x: number, y: number, settled = false) => {
      const isMobile = width < 768;
      const baseHeight = isMobile
        ? Math.max(155, Math.min(205, height * 0.25))
        : Math.max(210, Math.min(275, height * 0.32));
      const scaleJitter = 0.92 + Math.random() * 0.16;
      const h = baseHeight * scaleJitter;
      const w = h * bottleAspect;

      const torso = Matter.Bodies.rectangle(x, y + h * 0.14, w * 0.94, h * 0.68, {
        chamfer: { radius: w * 0.15 },
      });
      const neck = Matter.Bodies.rectangle(x, y - h * 0.33, w * 0.42, h * 0.3, {
        chamfer: { radius: w * 0.08 },
      });

      const body = Matter.Body.create({
        parts: [torso, neck],
        restitution: 0.26,
        friction: 0.48,
        frictionStatic: 0.65,
        frictionAir: 0.003,
        density: 0.0022,
      });

      const comOffsetY = y - body.position.y;
      const initialAngle = (Math.random() - 0.5) * (settled ? 2.4 : 1.8);
      Matter.Body.setAngle(body, initialAngle);

      if (!settled) {
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 4.5,
          y: 7.5 + Math.random() * 8.5,
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.13);
      }

      Matter.Composite.add(engine.world, body);
      bottles.push({ body, width: w, height: h, comOffsetY });
    };

    const clearSpawnTimers = () => {
      spawnTimerIds.forEach((id) => window.clearTimeout(id));
      spawnTimerIds = [];
    };

    const clearBottles = () => {
      clearSpawnTimers();
      if (bottles.length > 0) {
        Matter.Composite.remove(
          engine.world,
          bottles.map((b) => b.body)
        );
        bottles.length = 0;
      }
    };

    const drawFrame = () => {
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, width, height);

      if (!spriteCanvas) return;

      for (let i = 0; i < bottles.length; i++) {
        const item = bottles[i];
        const { body, width: w, height: h, comOffsetY } = item;

        ctx2d.save();
        ctx2d.translate(body.position.x, body.position.y);
        ctx2d.rotate(body.angle);

        ctx2d.shadowColor = 'rgba(4, 7, 12, 0.34)';
        ctx2d.shadowBlur = 14;
        ctx2d.shadowOffsetX = 3;
        ctx2d.shadowOffsetY = 5;

        ctx2d.drawImage(spriteCanvas, -w / 2, comOffsetY - h / 2, w, h);
        ctx2d.restore();
      }
    };

    const tick = (now: number) => {
      if (isDestroyed || !isSimulationActive) {
        rafId = null;
        return;
      }

      if (!lastTime) lastTime = now;
      const dt = Math.min(now - lastTime, 33.33);
      lastTime = now;

      Matter.Engine.update(engine, dt);
      drawFrame();

      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafId !== null) return;
      isSimulationActive = true;
      lastTime = 0;
      rafId = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      isSimulationActive = false;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Living video-like burst portrait playback (random non-repeating cadence)
    const getNextRandomPortraitIndex = (excludeIndex: number) => {
      const total = PORTRAIT_SEQUENCE_SRCS.length;
      if (total <= 1) return 0;
      let nextIdx = Math.floor(Math.random() * (total - 1));
      if (nextIdx >= excludeIndex) {
        nextIdx += 1;
      }
      return nextIdx;
    };

    const applyPortraitFrame = (frameIndex: number) => {
      currentPortraitIndex = frameIndex;
      portraitImgRefs.current.forEach((imgEl, idx) => {
        if (imgEl) {
          imgEl.style.opacity = idx === frameIndex ? '1' : '0';
        }
      });
    };

    const startPortraitLoop = () => {
      if (portraitTimerId !== null) return;
      portraitTween?.resume();
      applyPortraitFrame(currentPortraitIndex);
      portraitTimerId = window.setInterval(() => {
        if (isDestroyed) return;
        const nextIdx = getNextRandomPortraitIndex(currentPortraitIndex);
        applyPortraitFrame(nextIdx);
      }, 630);
    };

    const stopPortraitLoop = () => {
      portraitTween?.pause();
      if (portraitTimerId !== null) {
        window.clearInterval(portraitTimerId);
        portraitTimerId = null;
      }
    };

    const triggerMakgeolliAvalanche = () => {
      if (isDestroyed || !isMakgeolliVisible || !spriteCanvas) return;
      clearBottles();
      startLoop();

      lastSpawnWidth = width;
      const isMobile = width < 768;
      const totalBottles = isMobile ? 20 : 34;

      // Wave 1: Immediate chaotic crate-dump burst from above
      const burstCount = isMobile ? 6 : 10;
      for (let i = 0; i < totalBottles; i++) {
        const delayMs = i < burstCount ? i * 18 : 110 + (i - burstCount) * 28;
        const timerId = window.setTimeout(() => {
          if (isDestroyed || !isSimulationActive) return;
          const currentMargin = Math.max(48, width * 0.08);
          const currentUsableWidth = Math.max(120, width - currentMargin * 2);
          const x = currentMargin + Math.random() * currentUsableWidth;
          const y = -110 - Math.random() * 190;
          createBottleBody(x, y, false);
        }, delayMs);
        spawnTimerIds.push(timerId);
      }
    };

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      bottles.forEach(({ body }) => {
        const dx = body.position.x - cx;
        const dy = body.position.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 220) {
          const strength = (1 - dist / 220) * 0.28;
          const dirX = dx === 0 ? Math.random() - 0.5 : dx / Math.max(1, dist);
          Matter.Body.applyForce(body, body.position, {
            x: dirX * strength,
            y: -strength * 1.35,
          });
          Matter.Body.setAngularVelocity(
            body,
            body.angularVelocity + (Math.random() - 0.5) * 0.16
          );
        }
      });
    };

    canvasEl.addEventListener('click', handleCanvasClick);

    syncCanvasSize();
    rebuildBoundaries();
    applyPortraitFrame(0);

    const handleViewportAdapt = () => {
      if (isDestroyed) return;
      const prevWidth = width;
      const prevHeight = height;
      if (!syncCanvasSize()) return;
      rebuildBoundaries();

      if (bottles.length > 0 && prevWidth > 0 && prevHeight > 0) {
        const scaleX = width / prevWidth;
        const scaleY = height / prevHeight;
        if (Math.abs(scaleX - 1) > 0.002 || Math.abs(scaleY - 1) > 0.002) {
          bottles.forEach(({ body }) => {
            const clampedX = Math.max(
              40,
              Math.min(width - 40, body.position.x * scaleX)
            );
            const clampedY = Math.min(height - 32, body.position.y * scaleY);
            Matter.Body.setPosition(body, { x: clampedX, y: clampedY });
          });
        }
      }

      if (isMakgeolliVisible) drawFrame();

      if (width === prevWidth) return;

      if (resizeDebounceId !== null) {
        window.clearTimeout(resizeDebounceId);
      }

      resizeDebounceId = window.setTimeout(() => {
        resizeDebounceId = null;
        if (Math.abs(width - lastSpawnWidth) > 70) {
          triggerMakgeolliAvalanche();
        }
      }, 160);
    };

    window.addEventListener('resize', handleViewportAdapt);
    ScrollTrigger.addEventListener('refresh', handleViewportAdapt);

    const img = new Image();
    img.src = MAKGEOLLI_IMG_SRC;
    img.onload = () => {
      if (isDestroyed) return;
      bottleAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
      spriteCanvas = buildGradedBottleSprite(img);

      if (bottles.length === 0) {
        triggerMakgeolliAvalanche();
      }
    };

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const revealItems = aboutContentEl.querySelectorAll('[data-about-reveal]');
        let isCoveredByTears = false;
        const makgeolliFadeStart = 1.45;
        const makgeolliFadeDuration = 1.05;

        const syncMakgeolli = (time: number) => {
          const visible = isAboutPinned && time < makgeolliFadeStart + makgeolliFadeDuration;
          if (visible === isMakgeolliVisible) return;
          isMakgeolliVisible = visible;
          if (syncCanvasSize()) rebuildBoundaries();
          if (!visible) {
            stopLoop();
          } else if (
            spriteCanvas &&
            (bottles.length === 0 || Math.abs(width - lastSpawnWidth) > 70)
          ) {
            triggerMakgeolliAvalanche();
          } else {
            startLoop();
          }
        };

        // Stay invisible behind Prolog without visibility: hidden so descendant video preloads cleanly
        gsap.set(stageEl, { opacity: 0, pointerEvents: 'none' });
        gsap.set(makgeolliLayerEl, { autoAlpha: 1 });
        gsap.set(aboutMeLayerEl, { autoAlpha: 0 });
        if (revealItems.length > 0) {
          gsap.set(revealItems, { opacity: 0, y: 26 });
        }

        // Subtle continuous camera breathing on the living portrait backdrop
        if (portraitMotionRef.current) {
          portraitTween = gsap.to(portraitMotionRef.current, {
            scale: 1.055,
            duration: 14,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            paused: true,
          });
        }

        const aboutTl = gsap.timeline({
          scrollTrigger: {
            id: 'about-sequence',
            trigger: stageEl,
            start: 'top top',
            end: () => window.matchMedia('(pointer: coarse)').matches
              ? `+=${Math.max(3600, stageEl.clientHeight * 6)}`
              : '+=10600',
            pin: true,
            pinSpacing: true,
            scrub: 0.65,
            invalidateOnRefresh: true,
            refreshPriority: 40,
            onEnter: (self) => {
              gsap.set(stageEl, { opacity: 1, pointerEvents: 'auto' });
              isAboutPinned = true;
              syncMakgeolli(self.animation?.time() ?? 0);
              if (!isCoveredByTears) {
                startPortraitLoop();
              }
            },
            onEnterBack: (self) => {
              gsap.set(stageEl, { opacity: 1, pointerEvents: 'auto' });
              isAboutPinned = true;
              syncMakgeolli(self.animation?.time() ?? 0);
              if (!isCoveredByTears) {
                startPortraitLoop();
              }
            },
            onLeave: () => {
              isAboutPinned = false;
              syncMakgeolli(0);
              stopPortraitLoop();
            },
            onLeaveBack: () => {
              isCoveredByTears = false;
              aboutMeLayerEl.hidden = false;
              isAboutPinned = false;
              gsap.set(stageEl, { opacity: 0, pointerEvents: 'none' });
              syncMakgeolli(0);
              stopPortraitLoop();
              clearBottles();
              drawFrame();
            },
          },
        });

        // Beat 1: Hold Makgeolli B-movie avalanche on screen while bottles fall & pile
        aboutTl.to({}, { duration: makgeolliFadeStart });

        // Beat 2: Fade out Makgeolli layer while cross-dissolving in the living portrait + About Me contents
        aboutTl.to(
          makgeolliLayerEl,
          {
            autoAlpha: 0,
            duration: makgeolliFadeDuration,
            ease: 'power2.inOut',
          },
          makgeolliFadeStart
        );

        aboutTl.to(
          aboutMeLayerEl,
          {
            autoAlpha: 1,
            duration: 1.15,
            ease: 'power2.out',
          },
          1.75
        );

        if (revealItems.length > 0) {
          aboutTl.to(
            revealItems,
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.16,
              ease: 'power3.out',
            },
            2.15
          );
        }

        // Hold completed About Me state comfortably before Tears in Rain emerges
        aboutTl.to({}, { duration: 1.4 });

        const tearsStart = aboutTl.duration();
        aboutTl.addLabel('tears', tearsStart);
        const tearsCleanup = tearsHandleRef.current?.attachTimeline(
          aboutTl,
          tearsStart,
          {
            isStageVisible: () => {
              const trigger = aboutTl.scrollTrigger;
              if (!trigger) return false;
              const scroll = trigger.scroll();
              return scroll >= trigger.start && scroll < trigger.end + height;
            },
            onFullscreenEnter: () => {
              isCoveredByTears = true;
              aboutMeLayerEl.hidden = true;
              stopPortraitLoop();
            },
            onFullscreenLeaveBack: () => {
              isCoveredByTears = false;
              aboutMeLayerEl.hidden = false;
              if (isAboutPinned) startPortraitLoop();
            },
          }
        );
        aboutTl.eventCallback('onUpdate', () => syncMakgeolli(aboutTl.time()));

        // Hero-matched intermittent SF glitch bursts & 35mm analog projector artifacts for P202 portraits
        let glitchDelayCall: gsap.core.Tween | undefined;
        let activeGlitchTl: gsap.core.Timeline | undefined;
        let analogDelayCall: gsap.core.Tween | undefined;
        let activeAnalogTl: gsap.core.Timeline | undefined;
        let statGlitchDelayCall: gsap.core.Tween | undefined;
        let activeStatGlitchTl: gsap.core.Timeline | undefined;

        const randRange = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        const triggerStatGlitch = () => {
          if (isDestroyed) return;
          if (portraitTimerId === null) {
            statGlitchDelayCall = gsap.delayedCall(1.0, triggerStatGlitch);
            return;
          }

          const statNodes = statGlitchRefs.current.filter(
            (el): el is HTMLElement => el !== null
          );
          if (statNodes.length === 0) return;

          // Glitch 1-2 numbers per burst (or occasionally all 3)
          const targetNodes =
            Math.random() > 0.65
              ? statNodes
              : [statNodes[Math.floor(Math.random() * statNodes.length)]];

          const statTl = gsap.timeline({
            onComplete: () => {
              if (!isDestroyed) {
                statGlitchDelayCall = gsap.delayedCall(
                  randRange(1.8, 3.9),
                  triggerStatGlitch
                );
              }
            },
          });
          activeStatGlitchTl = statTl;

          targetNodes.forEach((node, idx) => {
            const mainEl = node.querySelector('[data-stat-main]');
            const crimsonEl = node.querySelector('[data-stat-crimson]');
            const boneEl = node.querySelector('[data-stat-bone]');
            if (!mainEl || !crimsonEl || !boneEl) return;

            const topA = Math.round(randRange(8, 38));
            const bottomA = Math.round(100 - topA - randRange(18, 32));
            const topB = Math.round(randRange(46, 70));
            const bottomB = Math.round(100 - topB - randRange(16, 28));
            const offset = idx * 0.03;

            statTl
              .set(
                mainEl,
                {
                  x: randRange(-4, 4),
                  skewX: randRange(-9, 9),
                  opacity: 0.72,
                },
                offset
              )
              .set(
                crimsonEl,
                {
                  opacity: 0.92,
                  x: randRange(-7, -3),
                  y: randRange(-2, 2),
                  clipPath: `inset(${topA}% 0% ${bottomA}% 0%)`,
                },
                offset
              )
              .set(
                boneEl,
                {
                  opacity: 0.9,
                  x: randRange(3, 7),
                  y: randRange(-2, 2),
                  clipPath: `inset(${topB}% 0% ${bottomB}% 0%)`,
                },
                offset
              )
              .to({}, { duration: 0.05 }, offset)
              .set(
                mainEl,
                {
                  x: randRange(-5, 5),
                  skewX: randRange(-6, 6),
                  opacity: 0.9,
                },
                offset + 0.05
              )
              .set(
                crimsonEl,
                {
                  x: randRange(4, 8),
                  clipPath: `inset(${topB}% 0% ${bottomB}% 0%)`,
                },
                offset + 0.05
              )
              .set(
                boneEl,
                {
                  x: randRange(-8, -4),
                  clipPath: `inset(${topA}% 0% ${bottomA}% 0%)`,
                },
                offset + 0.05
              )
              .to({}, { duration: 0.045 }, offset + 0.05)
              .set(
                mainEl,
                {
                  x: 0,
                  skewX: 0,
                  opacity: 1,
                },
                offset + 0.095
              )
              .set(
                [crimsonEl, boneEl],
                {
                  opacity: 0,
                  x: 0,
                  y: 0,
                  clipPath: 'inset(0% 0% 0% 0%)',
                },
                offset + 0.095
              );

            if (Math.random() > 0.45) {
              statTl
                .to({}, { duration: 0.04 }, offset + 0.095)
                .set(
                  mainEl,
                  {
                    x: randRange(-3, 3),
                    skewX: randRange(-5, 5),
                    opacity: 0.8,
                  },
                  offset + 0.135
                )
                .set(
                  crimsonEl,
                  {
                    opacity: 0.85,
                    x: randRange(-6, 6),
                    clipPath: `inset(${Math.round(randRange(22, 54))}% 0% ${Math.round(randRange(18, 42))}% 0%)`,
                  },
                  offset + 0.135
                )
                .to({}, { duration: 0.045 }, offset + 0.135)
                .set(
                  mainEl,
                  { x: 0, skewX: 0, opacity: 1 },
                  offset + 0.18
                )
                .set(
                  crimsonEl,
                  {
                    opacity: 0,
                    x: 0,
                    clipPath: 'inset(0% 0% 0% 0%)',
                  },
                  offset + 0.18
                );
            }
          });
        };

        const triggerGlitchBurst = () => {
          if (isDestroyed) return;
          if (portraitTimerId === null) {
            glitchDelayCall = gsap.delayedCall(1.2, triggerGlitchBurst);
            return;
          }

          const slice1Top = Math.round(randRange(10, 32));
          const slice1Bottom = Math.round(100 - slice1Top - randRange(4, 11));
          const slice2Top = Math.round(randRange(38, 62));
          const slice2Bottom = Math.round(100 - slice2Top - randRange(3, 9));
          const slice3Top = Math.round(randRange(68, 86));
          const slice3Bottom = Math.round(100 - slice3Top - randRange(3, 8));

          const glitchTl = gsap.timeline({
            onComplete: () => {
              if (!isDestroyed) {
                glitchDelayCall = gsap.delayedCall(
                  randRange(2.8, 6.2),
                  triggerGlitchBurst
                );
              }
            },
          });
          activeGlitchTl = glitchTl;

          glitchTl
            .set(glitchPortraitRef.current, {
              x: randRange(-10, 10),
              skewX: randRange(-2.2, 2.2),
              filter: 'contrast(1.42) brightness(1.18) saturate(0.7)',
            })
            .set(glitchSlice1Ref.current, {
              opacity: 0.9,
              x: randRange(-24, 24),
              clipPath: `inset(${slice1Top}% 0% ${slice1Bottom}% 0%)`,
            })
            .set(glitchSlice2Ref.current, {
              opacity: 0.85,
              x: randRange(-28, 28),
              clipPath: `inset(${slice2Top}% 0% ${slice2Bottom}% 0%)`,
            })
            .set(scanlineRef.current, { opacity: 0.55 })
            .to({}, { duration: 0.055 })
            .set(glitchPortraitRef.current, {
              x: randRange(-6, 6),
              skewX: randRange(-1.4, 1.4),
              scaleX: 1.015,
              filter: 'contrast(1.25) brightness(0.92)',
            })
            .set(glitchSlice1Ref.current, {
              x: randRange(-18, 18),
              clipPath: `inset(${slice1Top + 4}% 0% ${Math.max(2, slice1Bottom - 4)}% 0%)`,
            })
            .set(glitchSlice2Ref.current, { opacity: 0 })
            .set(glitchSlice3Ref.current, {
              opacity: 0.85,
              x: randRange(-22, 22),
              clipPath: `inset(${slice3Top}% 0% ${slice3Bottom}% 0%)`,
            })
            .to({}, { duration: 0.05 })
            .set(glitchPortraitRef.current, {
              x: 0,
              skewX: 0,
              scaleX: 1,
              filter: 'none',
            })
            .set([glitchSlice1Ref.current, glitchSlice3Ref.current], {
              opacity: 0,
            })
            .set(scanlineRef.current, { opacity: 0.14 });

          if (Math.random() > 0.4) {
            glitchTl
              .to({}, { duration: 0.06 })
              .set(glitchPortraitRef.current, {
                x: randRange(-8, 8),
                skewX: randRange(-1.8, 1.8),
                filter: 'contrast(1.38) brightness(1.14)',
              })
              .set(glitchSlice2Ref.current, {
                opacity: 0.8,
                x: randRange(-20, 20),
                clipPath: `inset(${slice2Top - 5}% 0% ${slice2Bottom + 5}% 0%)`,
              })
              .set(scanlineRef.current, { opacity: 0.48 })
              .to({}, { duration: 0.05 })
              .set(glitchPortraitRef.current, {
                x: 0,
                skewX: 0,
                scaleX: 1,
                filter: 'none',
              })
              .set(glitchSlice2Ref.current, { opacity: 0 })
              .set(scanlineRef.current, { opacity: 0.14 });
          }
        };

        const triggerAnalogArtifact = () => {
          if (isDestroyed) return;
          if (portraitTimerId === null) {
            analogDelayCall = gsap.delayedCall(1.2, triggerAnalogArtifact);
            return;
          }

          const scratchLeft1 = Math.round(randRange(14, 86));
          const scratchLeft2 = Math.round(randRange(18, 82));

          const analogTl = gsap.timeline({
            onComplete: () => {
              if (!isDestroyed) {
                analogDelayCall = gsap.delayedCall(
                  randRange(1.4, 3.8),
                  triggerAnalogArtifact
                );
              }
            },
          });
          activeAnalogTl = analogTl;

          analogTl
            .to(projectorFlickerRef.current, {
              opacity: randRange(0.08, 0.18),
              duration: 0.04,
              ease: 'none',
            })
            .set(filmScratchRef.current, {
              left: `${scratchLeft1}%`,
              opacity: Math.random() > 0.35 ? randRange(0.18, 0.34) : 0,
              scaleY: randRange(0.7, 1),
            })
            .set(filmScratch2Ref.current, {
              left: `${scratchLeft2}%`,
              opacity: Math.random() > 0.65 ? randRange(0.12, 0.25) : 0,
            })
            .to(projectorFlickerRef.current, {
              opacity: 0,
              duration: 0.06,
              ease: 'none',
            })
            .set([filmScratchRef.current, filmScratch2Ref.current], {
              opacity: 0,
            });

          if (Math.random() > 0.45) {
            analogTl
              .to(projectorFlickerRef.current, {
                opacity: randRange(0.05, 0.12),
                duration: 0.04,
                delay: 0.05,
                ease: 'none',
              })
              .to(projectorFlickerRef.current, {
                opacity: 0,
                duration: 0.07,
                ease: 'none',
              });
          }
        };

        glitchDelayCall = gsap.delayedCall(1.6, triggerGlitchBurst);
        analogDelayCall = gsap.delayedCall(1.2, triggerAnalogArtifact);
        statGlitchDelayCall = gsap.delayedCall(1.4, triggerStatGlitch);

        return () => {
          isAboutPinned = false;
          syncMakgeolli(0);
          stopPortraitLoop();
          tearsCleanup?.();
          aboutMeLayerEl.hidden = false;
          glitchDelayCall?.kill();
          activeGlitchTl?.kill();
          analogDelayCall?.kill();
          activeAnalogTl?.kill();
          statGlitchDelayCall?.kill();
          activeStatGlitchTl?.kill();
        };
      }, stageEl);

      return () => ctx.revert();
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(makgeolliLayerEl, { autoAlpha: 0 });
      gsap.set(aboutMeLayerEl, { autoAlpha: 1 });
      applyPortraitFrame(0);
    });

    return () => {
      isDestroyed = true;
      mm.revert();
      stopLoop();
      stopPortraitLoop();
      clearBottles();
      if (resizeDebounceId !== null) {
        window.clearTimeout(resizeDebounceId);
      }
      ScrollTrigger.removeEventListener('refresh', handleViewportAdapt);
      window.removeEventListener('resize', handleViewportAdapt);
      canvasEl.removeEventListener('click', handleCanvasClick);
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
  }, []);

  return (
    <div className="relative z-[35] motion-safe:-mt-[var(--prolog-stage-height,100dvh)]">
      <div
        ref={stageRef}
        data-about-stage
        className="relative h-[100dvh] motion-reduce:h-auto w-full overflow-hidden bg-[#0C121B] text-[#D7D0C3]"
      >
        <section
          id="about"
          ref={sectionRef}
          aria-label="About Me"
          className="motion-safe:absolute motion-safe:inset-0 motion-reduce:relative motion-reduce:min-h-[100dvh] z-10 h-[100dvh] w-full overflow-hidden bg-[#0C121B] text-[#D7D0C3]"
        >
        {/* BEAT 1: B-Movie Comedy Makgeolli Avalanche Stage */}
        <div
          ref={makgeolliLayerRef}
          className="absolute inset-0 z-10 overflow-hidden bg-[#0C121B]"
        >
          {/* Atmospheric B-Movie Noir Stage Lighting */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_18%,rgba(215,208,195,0.08)_0%,transparent_52%),radial-gradient(ellipse_at_50%_96%,rgba(165,42,67,0.22)_0%,transparent_54%),linear-gradient(180deg,#0C121B_0%,#090E15_100%)]"
          />

          {/* Bold Full-Screen Background Headline Pre-set Behind Falling Makgeolli Bottles */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[5] flex items-center justify-center px-2 sm:px-4 pointer-events-none select-none overflow-hidden"
          >
            <p className="w-full text-center font-black uppercase tracking-[-0.045em] leading-[0.9] text-[#D7D0C3]/9">
              <span className="block whitespace-nowrap text-[min(24vw,42vh)]">
                하늘에서
              </span>
              <span className="block whitespace-nowrap text-[min(11.8vw,34vh)] mt-[0.04em]">
                막걸리가 빗발친다
              </span>
            </p>
          </div>

          {/* Matter.js Makgeolli Avalanche Canvas */}
          <canvas
            ref={canvasRef}
            className="relative z-10 block w-full h-full cursor-pointer"
          />

          {/* Edge Vignette & Grain */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(12,18,27,0.72)_100%)]"
          />
          <div
            aria-hidden="true"
            className="cinema-grain absolute -inset-12 z-20 opacity-25 mix-blend-overlay pointer-events-none"
          />
        </div>

        {/* BEAT 2: Living P202 Portrait Video Backdrop + About Me Contents */}
        <div
          ref={aboutMeLayerRef}
          className="absolute inset-0 z-20 overflow-hidden bg-[#0C121B]"
        >
          {/* Animated Sequence of P202 Portraits with Hero-Matched Glitch & 35mm Analog Effects */}
          <div
            ref={portraitMotionRef}
            aria-hidden="true"
            className="absolute -inset-4 z-0 pointer-events-none will-change-transform"
          >
            <div
              ref={glitchPortraitRef}
              className="w-full h-full will-change-[transform,filter]"
            >
              {PORTRAIT_SEQUENCE_SRCS.map((src, index) => (
                <picture key={src}>
                  <source media="(pointer: coarse)" srcSet={src.replace('/aistudio/', '/aistudio/mobile/')} />
                  <img
                    ref={(el) => {
                      portraitImgRefs.current[index] = el;
                    }}
                    src={src}
                    alt=""
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover object-[50%_58%] md:object-[50%_55%] sepia-[0.2] saturate-[0.48] contrast-[1.16] brightness-[0.64] transition-opacity duration-500 ease-linear"
                    style={{ opacity: index === 0 ? 1 : 0 }}
                  />
                </picture>
              ))}
            </div>
          </div>

          {/* Analog 35mm Warm-Bone Wash & Optical Lens Vignette */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] pointer-events-none bg-[#D7D0C3]/[0.04] mix-blend-soft-light"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_44%,rgba(12,18,27,0.74)_100%)]"
          />

          {/* Intermittent SF Glitch Tear Slices & Scanline Interference */}
          <div
            ref={glitchSlice1Ref}
            aria-hidden="true"
            className="absolute inset-0 z-[2] opacity-0 pointer-events-none backdrop-brightness-150 backdrop-contrast-150 bg-[#D7D0C3]/10 mix-blend-screen will-change-[transform,opacity,clip-path]"
          />
          <div
            ref={glitchSlice2Ref}
            aria-hidden="true"
            className="absolute inset-0 z-[2] opacity-0 pointer-events-none backdrop-contrast-150 backdrop-hue-rotate-15 bg-[#A52A43]/22 mix-blend-screen will-change-[transform,opacity,clip-path]"
          />
          <div
            ref={glitchSlice3Ref}
            aria-hidden="true"
            className="absolute inset-0 z-[2] opacity-0 pointer-events-none backdrop-invert-[0.14] backdrop-contrast-150 bg-[#0C121B]/35 will-change-[transform,opacity,clip-path]"
          />
          <div
            ref={scanlineRef}
            aria-hidden="true"
            className="absolute inset-0 z-[2] opacity-15 pointer-events-none bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_2px,rgba(215,208,195,0.08)_3px,rgba(12,18,27,0.28)_4px)]"
          />

          {/* Analog Projector Shutter Flicker & Vertical Film Scratches */}
          <div
            ref={projectorFlickerRef}
            aria-hidden="true"
            className="absolute inset-0 z-[3] opacity-0 pointer-events-none bg-[#070B11]"
          />
          <div
            ref={filmScratchRef}
            aria-hidden="true"
            className="absolute inset-y-0 z-[3] w-px opacity-0 pointer-events-none bg-gradient-to-b from-transparent via-[#D7D0C3]/65 to-transparent"
          />
          <div
            ref={filmScratch2Ref}
            aria-hidden="true"
            className="absolute inset-y-0 z-[3] w-px opacity-0 pointer-events-none bg-gradient-to-b from-transparent via-[#A52A43]/45 to-transparent"
          />

          {/* Black Navy & Crimson Noir Integration Scrims for Crisp Readability */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[4] pointer-events-none bg-[radial-gradient(ellipse_at_50%_46%,rgba(12,18,27,0.52)_0%,rgba(12,18,27,0.78)_58%,rgba(12,18,27,0.94)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[4] pointer-events-none bg-gradient-to-b from-[#0C121B]/85 via-transparent via-35% to-[#0C121B]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[4] pointer-events-none bg-[radial-gradient(circle_at_50%_28%,rgba(165,42,67,0.16),transparent_48%)]"
          />
          <div
            aria-hidden="true"
            className="cinema-grain absolute -inset-12 z-[5] opacity-40 mix-blend-overlay pointer-events-none"
          />

          {/* Centered Editorial Content Matching about-me-contents.png */}
          <div className="relative z-10 h-full w-full max-w-[1040px] mx-auto px-6 sm:px-10 pt-20 md:pt-24 pb-8 flex items-center justify-center">
            <div
              ref={aboutContentRef}
              className="w-full flex flex-col items-center text-center"
            >
              <p
                data-about-reveal
                className="text-xs sm:text-[13px] font-normal tracking-[0.2em] text-[#D7D0C3]/55"
              >
                수많은 싸움을 치른 노련한 장수
              </p>

              <h2
                data-about-reveal
                className="mt-2 font-display section-title font-bold tracking-[-0.03em] leading-none text-[#EAE5DC]"
              >
                about me<span className="text-[#A52A43]">.</span>
              </h2>

              <HanjaArtwork
                artwork="about"
                data-about-reveal
                className="drop-shadow-[0_10px_30px_rgba(12,18,27,0.9)]"
              />

              <ul className="mt-6 md:mt-8 space-y-2 text-sm sm:text-[15px] md:text-base font-normal tracking-[-0.01em] text-[#D7D0C3]/90">
                {CAREER_ITEMS.map((item) => (
                  <li key={item} data-about-reveal>
                    {item}
                  </li>
                ))}
              </ul>

              <dl className="mt-8 md:mt-11 w-full max-w-[660px] grid grid-cols-3 gap-4 sm:gap-10">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    data-about-reveal
                    className="flex flex-col items-center"
                  >
                    <dd
                      ref={(el) => {
                        statGlitchRefs.current[index] = el;
                      }}
                      className="relative inline-block font-display font-bold leading-none tracking-[-0.03em] text-[clamp(2.25rem,5.2vw,4rem)] text-[#D7D0C3] drop-shadow-[0_8px_24px_rgba(12,18,27,0.85)] select-none"
                    >
                      <span data-stat-main className="relative inline-block will-change-transform">
                        {stat.value}
                      </span>
                      <span
                        data-stat-crimson
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 text-[#A52A43] opacity-0 will-change-[transform,opacity,clip-path]"
                      >
                        {stat.value}
                      </span>
                      <span
                        data-stat-bone
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 text-[#EAE5DC] opacity-0 will-change-[transform,opacity,clip-path]"
                      >
                        {stat.value}
                      </span>
                    </dd>
                    <span className="mt-1.5 font-display text-xs sm:text-sm font-medium tracking-[0.06em] text-[#9E988C]">
                      {stat.unit}
                    </span>
                    <dt className="mt-2.5 text-xs sm:text-sm font-semibold tracking-[0.02em] text-[#EAE5DC]">
                      {stat.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
        </section>

        <TearsInRainSection ref={tearsHandleRef} />
      </div>
    </div>
  );
}
