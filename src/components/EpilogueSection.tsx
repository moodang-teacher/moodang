import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import HanjaArtwork from './HanjaArtwork';

gsap.registerPlugin(ScrollTrigger, SplitText);

const HORATIUS_BUST_SRC = '/assets/aistudio/______00386154.webp';

const ASCII_RAMP = ' .,:;-=+*#%@';
const SCRAMBLE_GLYPHS = '01/\\|_+=*#%@<>';
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

interface SampleGrid {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  luma: Float32Array;
  energy: Float32Array;
  scrambleSeed: Float32Array;
}

export default function EpilogueSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const latinRef = useRef<HTMLDivElement>(null);
  const bustStageRef = useRef<HTMLDivElement>(null);
  const asciiCanvasRef = useRef<HTMLCanvasElement>(null);

  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let quoteSplit: SplitText | null = null;

      const ctx = gsap.context(() => {
        const headerItems = headerRef.current?.querySelectorAll('[data-epilogue-head]');

        if (headerItems && headerItems.length > 0) {
          gsap.set(headerItems, { opacity: 0, y: 24 });
        }

        if (quoteRef.current) {
          quoteSplit = SplitText.create(quoteRef.current, {
            type: 'lines,words,chars',
            mask: 'lines',
            linesClass: 'pt-[0.06em] pb-[0.12em] -mt-[0.06em] -mb-[0.12em]',
          });
          gsap.set(quoteSplit.chars, { yPercent: 112, opacity: 0 });
        }

        if (latinRef.current) {
          gsap.set(latinRef.current, { opacity: 0, y: 16 });
        }

        const headerTl = gsap.timeline({ paused: true });
        if (headerItems && headerItems.length > 0) {
          headerTl.to(headerItems, {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.08,
            ease: 'power3.out',
          });
        }

        const quoteTl = gsap.timeline({ paused: true });
        if (quoteSplit && quoteSplit.chars.length > 0) {
          quoteTl.to(quoteSplit.chars, {
            yPercent: 0,
            opacity: 1,
            duration: 0.82,
            stagger: 0.018,
            ease: 'power3.out',
          });
        }

        if (latinRef.current) {
          quoteTl.to(
            latinRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: 'power3.out',
            },
            '-=0.4'
          );
        }

        let headerShown = false;
        let quoteShown = false;

        // Pin Epilogue at top: 0; text stays hidden until pinned & scrolled, while right ASCII bust + mouse tracking is visible from the start
        const pinnedTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top top',
            end: '+=1800',
            pin: true,
            pinSpacing: true,
            scrub: 0.65,
            anticipatePin: 1,
            refreshPriority: 10,
            onEnter: () => {
              if (!headerShown) {
                headerShown = true;
                headerTl.timeScale(1).play();
              }
            },
            onUpdate: (self) => {
              if (!headerShown && self.progress > 0) {
                headerShown = true;
                headerTl.timeScale(1).play();
              }
              if (!quoteShown && self.progress >= 0.025) {
                quoteShown = true;
                quoteTl.timeScale(1).play();
              } else if (quoteShown && self.progress < 0.01) {
                quoteShown = false;
                quoteTl.timeScale(1.6).reverse();
              }
            },
            onLeaveBack: () => {
              if (quoteShown) {
                quoteShown = false;
                quoteTl.timeScale(1.6).reverse();
              }
              if (headerShown) {
                headerShown = false;
                headerTl.timeScale(1.6).reverse();
              }
            },
          },
        });

        if (asciiCanvasRef.current) {
          pinnedTl.fromTo(
            asciiCanvasRef.current,
            { y: 14, scale: 1.03 },
            { y: -14, scale: 1, ease: 'none', duration: 1 },
            0
          );
        }
      }, sectionEl);

      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      return () => {
        quoteSplit?.revert();
        ctx.revert();
      };
    });

    return () => mm.revert();
  }, []);

  // Early-web ASCII + Bayer Pixel Matrix Renderer with Live Mouse Tracking
  useEffect(() => {
    const sectionEl = sectionRef.current;
    const stageEl = bustStageRef.current;
    const canvas = asciiCanvasRef.current;
    if (!sectionEl || !stageEl || !canvas) return;

    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    let disposed = false;
    let isVisible = false;
    let rafId: number | null = null;
    let imageLoaded = false;

    let stageW = Math.max(stageEl.clientWidth, 1);
    let stageH = Math.max(stageEl.clientHeight, 1);
    let grid: SampleGrid | null = null;

    const pointer = {
      active: false,
      targetX: stageW * 0.52,
      targetY: stageH * 0.36,
      x: stageW * 0.52,
      y: stageH * 0.36,
      prevX: stageW * 0.52,
      prevY: stageH * 0.36,
      speed: 0,
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    const buildGrid = () => {
      if (!imageLoaded || disposed || !isVisible) return;

      stageW = Math.max(stageEl.clientWidth, 1);
      stageH = Math.max(stageEl.clientHeight, 1);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(stageW * dpr);
      canvas.height = Math.floor(stageH * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Early-web monospace cell density: fine enough for crisp sculpture recognition, coarse enough for tactile ASCII/pixel cells
      const cellW = stageW < 640 ? 8 : 9;
      const cellH = stageW < 640 ? 10 : 11;
      const cols = Math.max(16, Math.ceil(stageW / cellW));
      const rows = Math.max(16, Math.ceil(stageH / cellH));

      offscreen.width = cols;
      offscreen.height = rows;

      // Compute distortion-free object-cover crop accounting for non-square cellW x cellH ASCII cells
      const imgRatio = img.naturalWidth / Math.max(img.naturalHeight, 1);
      const viewRatio = stageW / Math.max(stageH, 1);

      let drawW = cols;
      let drawH = rows;
      let offsetX = 0;
      let offsetY = 0;

      if (viewRatio > imgRatio) {
        drawW = cols;
        drawH = (cols * cellW) / (imgRatio * cellH);
        offsetY = (rows - drawH) * 0.16;
      } else {
        drawH = rows;
        drawW = (rows * cellH * imgRatio) / cellW;
        offsetX = (cols - drawW) * 0.5;
      }

      offCtx.clearRect(0, 0, cols, rows);
      offCtx.drawImage(img, offsetX, offsetY, drawW, drawH);

      const pixels = offCtx.getImageData(0, 0, cols, rows).data;
      const count = cols * rows;
      const luma = new Float32Array(count);
      const energy = new Float32Array(count);
      const scrambleSeed = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const p = i * 4;
        const r = pixels[p] / 255;
        const g = pixels[p + 1] / 255;
        const b = pixels[p + 2] / 255;
        const rawL = 0.299 * r + 0.587 * g + 0.114 * b;
        // Cut out dark background studio backdrop into pure obsidian while sharpening marble relief
        const norm = Math.max(0, Math.min(1, (rawL - 0.13) / 0.72));
        luma[i] = Math.pow(norm, 0.9);
        scrambleSeed[i] = Math.random();
      }

      grid = { cols, rows, cellW, cellH, luma, energy, scrambleSeed };

      if (!pointer.active) {
        pointer.targetX = stageW * 0.52;
        pointer.targetY = stageH * 0.36;
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
        pointer.prevX = pointer.targetX;
        pointer.prevY = pointer.targetY;
      }
    };

    const drawFrame = (now: number) => {
      rafId = null;
      if (disposed || !grid) return;

      const { cols, rows, cellW, cellH, luma, energy, scrambleSeed } = grid;

      // Smooth pointer tracking
      pointer.x += (pointer.targetX - pointer.x) * 0.2;
      pointer.y += (pointer.targetY - pointer.y) * 0.2;
      const dxMove = pointer.x - pointer.prevX;
      const dyMove = pointer.y - pointer.prevY;
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;

      const instantSpeed = Math.hypot(dxMove, dyMove);
      pointer.speed = pointer.speed * 0.82 + instantSpeed * 0.18;

      ctx2d.fillStyle = '#05070A';
      ctx2d.fillRect(0, 0, stageW, stageH);

      const fontSize = Math.max(8, cellH - 1);
      ctx2d.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';

      const spotlightRadius = Math.max(190, Math.min(stageW, stageH) * 0.42);
      const interactionRadius = 115;
      const timeStep = Math.floor(now / 65);
      let hasActiveEnergy = false;

      for (let row = 0; row < rows; row++) {
        const cy = row * cellH + cellH * 0.5;
        const bayerRow = BAYER_4X4[row & 3];

        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const baseLuma = luma[idx];
          if (baseLuma < 0.025) {
            energy[idx] = 0;
            continue;
          }

          const cx = col * cellW + cellW * 0.5;
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const dist = Math.hypot(dx, dy);

          // Inject subtle kinetic ASCII scramble + pixel ripple when pointer passes over active bust cells
          if (!reducedMotion && pointer.active && dist < interactionRadius) {
            const proximity = 1 - dist / interactionRadius;
            const impulse = proximity * Math.min(1, 0.28 + pointer.speed * 0.055);
            if (impulse > energy[idx]) {
              energy[idx] = Math.min(1, impulse);
            }
          }

          const cellEnergy = energy[idx];
          if (cellEnergy > 0.01) {
            energy[idx] *= 0.91;
            hasActiveEnergy = true;
          } else {
            energy[idx] = 0;
          }

          // Chiaroscuro spotlight illumination falloff centered at cursor (or classical Rembrandt resting point)
          const spotFalloff = Math.max(0, 1 - dist / spotlightRadius);
          const spotBoost = Math.pow(spotFalloff, 1.55);
          const litLuma = Math.min(
            1,
            baseLuma * (0.56 + spotBoost * 0.72 + cellEnergy * 0.35)
          );

          // Ordered 4x4 Bayer pixel matrix threshold + crisp retro scanline modulation
          const bayerVal = (bayerRow[col & 3] + 0.5) / 16;
          const scanMod = (row & 1) === 0 ? 1.0 : 0.86;
          const ditherOn = litLuma > bayerVal * 0.85;

          // Subtle physical pixel scatter inside active cursor ripple
          const rippleAngle = scrambleSeed[idx] * Math.PI * 2;
          const jitterX =
            cellEnergy > 0.05
              ? (Math.cos(rippleAngle + timeStep * 0.6) * 2.4 +
                  (dx / (dist + 1)) * 4.5) *
                cellEnergy
              : 0;
          const jitterY =
            cellEnergy > 0.05
              ? Math.sin(rippleAngle + timeStep * 0.6) * 1.8 * cellEnergy
              : 0;

          const drawX = col * cellW + jitterX;
          const drawY = row * cellH + jitterY;

          // Layer 1: Retro 1px-gapped pixel block (stronger inside pointer lens & dither highlights)
          if (ditherOn && (litLuma > 0.24 || spotBoost > 0.35)) {
            const blockAlpha = Math.min(
              0.34,
              litLuma * (0.14 + spotBoost * 0.22) * scanMod
            );
            ctx2d.fillStyle =
              cellEnergy > 0.45 && scrambleSeed[idx] > 0.68
                ? `rgba(165, 42, 67, ${Math.min(0.45, blockAlpha * 1.6)})`
                : `rgba(215, 208, 195, ${blockAlpha})`;
            ctx2d.fillRect(drawX + 0.5, drawY + 0.5, cellW - 1.5, cellH - 1.5);
          }

          // Layer 2: Crisp ASCII character glyph representing sculpted tonal density
          let glyph: string;
          if (cellEnergy > 0.22) {
            const scrambleIdx =
              Math.floor(scrambleSeed[idx] * 97 + timeStep + col + row) %
              SCRAMBLE_GLYPHS.length;
            glyph = SCRAMBLE_GLYPHS[scrambleIdx];
          } else {
            const rampIdx = Math.min(
              ASCII_RAMP.length - 1,
              Math.max(1, Math.floor(litLuma * (ASCII_RAMP.length - 1)))
            );
            glyph = ASCII_RAMP[rampIdx];
          }

          const charAlpha = Math.min(
            0.96,
            (0.24 + litLuma * 0.72) * scanMod
          );

          if (cellEnergy > 0.36 && scrambleSeed[idx] > 0.6) {
            // Brief crimson glitch spark inside cursor wake
            ctx2d.fillStyle = `rgba(165, 42, 67, ${Math.min(0.95, charAlpha + 0.15)})`;
          } else if (litLuma > 0.72) {
            ctx2d.fillStyle = `rgba(234, 229, 220, ${charAlpha})`;
          } else if (litLuma > 0.38) {
            ctx2d.fillStyle = `rgba(215, 208, 195, ${charAlpha * 0.9})`;
          } else {
            ctx2d.fillStyle = `rgba(158, 152, 140, ${charAlpha * 0.75})`;
          }

          ctx2d.fillText(glyph, drawX + cellW * 0.5, drawY + cellH * 0.54);
        }
      }

      if (!reducedMotion && isVisible) {
        const settling =
          Math.abs(pointer.targetX - pointer.x) > 0.35 ||
          Math.abs(pointer.targetY - pointer.y) > 0.35 ||
          pointer.speed > 0.08;
        if (settling || hasActiveEnergy) {
          scheduleDraw();
        }
      }
    };

    const scheduleDraw = () => {
      if (disposed || !isVisible || rafId !== null) return;
      rafId = requestAnimationFrame(drawFrame);
    };

    img.onload = () => {
      if (disposed) return;
      imageLoaded = true;
      setImgFailed(false);
      buildGrid();
      scheduleDraw();
    };

    img.onerror = () => {
      if (disposed) return;
      setImgFailed(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (reducedMotion || !grid) return;
      const rect = stageEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointer.active = true;
      pointer.targetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      pointer.targetY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      scheduleDraw();
    };

    const onPointerLeave = () => {
      if (reducedMotion) return;
      pointer.active = false;
      pointer.targetX = stageW * 0.52;
      pointer.targetY = stageH * 0.36;
      scheduleDraw();
    };

    sectionEl.addEventListener('pointermove', onPointerMove);
    sectionEl.addEventListener('pointerleave', onPointerLeave);

    const resizeObserver = new ResizeObserver(() => {
      if (!imageLoaded || disposed) return;
      buildGrid();
      scheduleDraw();
    });
    resizeObserver.observe(stageEl);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible && !img.hasAttribute('src')) {
          img.src = HORATIUS_BUST_SRC;
        } else if (isVisible && imageLoaded) {
          buildGrid();
          scheduleDraw();
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(sectionEl);

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      sectionEl.removeEventListener('pointermove', onPointerMove);
      sectionEl.removeEventListener('pointerleave', onPointerLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return (
    <section
      id="epilogue"
      ref={sectionRef}
      aria-label="Epilogue — Horatius Finale"
      className="relative z-30 w-full h-[100dvh] min-h-[100dvh] bg-[#05070A] text-[#D7D0C3] overflow-hidden flex flex-col justify-between shadow-[0_28px_70px_rgba(0,0,0,0.88)]"
    >
      {/* Full-Height Right-Anchored Early-Web ASCII & Pixel Matrix Bust */}
      <div
        ref={bustStageRef}
        className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[56%] xl:w-[52%] overflow-hidden"
      >
        {!imgFailed ? (
          <canvas
            ref={asciiCanvasRef}
            aria-label="아스키 아트 및 픽셀 매트릭스로 재구성된 호라티우스 석고 흉상"
            className="w-full h-full block opacity-55 sm:opacity-65 lg:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#090C11] px-6 text-center">
            <HanjaArtwork artwork="epilogue" compact className="opacity-60" />
            <p className="mt-3 font-display text-xs tracking-[0.22em] text-[#9E988C]/50">
              QUINTUS HORATIUS FLACCUS
            </p>
          </div>
        )}

        {/* Seamless Multi-Edge Black Dissolve so Left 2/3 Monumental Quote Stays Crisp */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_right,#05070A_4%,rgba(5,7,10,0.82)_26%,rgba(5,7,10,0.14)_56%,rgba(5,7,10,0.42)_100%),linear-gradient(to_bottom,#05070A_0%,transparent_22%,transparent_78%,#05070A_100%)]"
        />
      </div>

      {/* Full-Viewport Width Container (Minus Clean Outer Edge Padding) */}
      <div className="relative z-10 w-full h-full min-h-[100dvh] px-6 sm:px-10 md:px-14 lg:px-16 pt-28 sm:pt-32 md:pt-36 pb-10 sm:pb-12 md:pb-14 flex flex-col justify-between gap-6 sm:gap-8">
        {/* Top Centered Section Header */}
        <div ref={headerRef} className="w-full text-center flex flex-col items-center">
          <p
            data-epilogue-head
            className="text-xs sm:text-[13px] font-normal tracking-[0.2em] text-[#D7D0C3]/55"
          >
            자, 드가자!
          </p>
          <h2
            data-epilogue-head
            className="mt-2 font-display section-title font-bold tracking-[-0.03em] leading-none text-[#EAE5DC]"
          >
            epilogue<span className="text-[#A52A43]">.</span>
          </h2>
          <HanjaArtwork
            artwork="epilogue"
            data-epilogue-head
            className="drop-shadow-[0_10px_30px_rgba(5,7,10,0.95)]"
          />
        </div>

        {/* Monumental Left 2/3 Quote & Subtle Latin Original */}
        <div className="w-full my-auto pt-2 md:pt-4 text-left">
          <blockquote
            ref={quoteRef}
            className="text-[6.1vw] sm:text-[5vw] md:text-[4.4vw] lg:text-[4.4vw] font-bold leading-[1.32] tracking-[-0.03em] whitespace-nowrap text-[#EAE5DC] drop-shadow-[0_12px_40px_rgba(5,7,10,0.9)]"
          >
            용기있는 자로 살아라.
            <br />
            운이 따라주지 않는다면
            <br />
            용기 있는 가슴으로 불행에 맞서라.
          </blockquote>

          <div ref={latinRef} className="mt-6 sm:mt-8 max-w-[58ch]">
            <p className="font-display text-xs sm:text-sm md:text-[15px] font-normal tracking-[0.045em] leading-[1.75] text-[#9E988C]">
              Quocirca vivite fortes, fortiaque adversis opponite pectora rebus.
            </p>
            <p className="mt-2 text-[11px] sm:text-xs font-normal tracking-[0.14em] text-[#D7D0C3]/45">
              Quintus Horatius Flaccus — Satires II. 2
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
