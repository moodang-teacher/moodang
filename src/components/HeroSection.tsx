import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ArrowDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, SplitText);

interface HeroSectionProps {
  onExplore: () => void;
}

const HERO_VIDEO_SRC =
  '/assets/aistudio/Man_and_bull_standing_together_2ce14f77_6df9eff4.mp4';

const SLOGAN_WORDS = ['깨끗하게,', '맑게,', '자신있게!'];

export default function HeroSection({ onExplore }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const svgLogoRef = useRef<SVGSVGElement>(null);
  const sloganRef = useRef<HTMLDivElement>(null);
  const portalStageRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const glitchVideoRef = useRef<HTMLDivElement>(null);
  const glitchSlice1Ref = useRef<HTMLDivElement>(null);
  const glitchSlice2Ref = useRef<HTMLDivElement>(null);
  const glitchSlice3Ref = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const projectorFlickerRef = useRef<HTMLDivElement>(null);
  const filmScratchRef = useRef<HTMLDivElement>(null);
  const filmScratch2Ref = useRef<HTMLDivElement>(null);
  const parallaxMediaRef = useRef<HTMLDivElement>(null);
  const emberGlowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const parallaxTextRef = useRef<HTMLDivElement>(null);
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);

  const [videoFailed, setVideoFailed] = useState(false);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    const heroEl = sectionRef.current;
    let isHeroCovered = false;
    let setEffectsCovered: ((covered: boolean) => void) | undefined;

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let headlineSplit: SplitText | null = null;
      let breathingTween: gsap.core.Tween | undefined;
      let glowTween: gsap.core.Tween | undefined;
      let scrollCueTween: gsap.core.Tween | undefined;

      const ctx = gsap.context(() => {
        const logoPaths = svgLogoRef.current?.querySelectorAll('path');
        const words = sloganRef.current?.querySelectorAll('[data-slogan-word]');
        const revealItems = sectionRef.current?.querySelectorAll('[data-hero-reveal]');

        // Initial hidden states before timeline starts
        gsap.set(preloaderRef.current, { display: 'flex' });
        gsap.set(portalStageRef.current, {
          clipPath: 'inset(45% 47.5% 45% 47.5% round 4px)',
          opacity: 0,
        });

        gsap.set(mediaWrapRef.current, {
          scale: 1.24,
        });

        if (revealItems) {
          gsap.set(revealItems, { opacity: 0, y: 44 });
        }

        if (headlineRef.current) {
          headlineSplit = SplitText.create(headlineRef.current, {
            type: 'lines,words,chars',
            mask: 'lines',
            linesClass: 'pt-[0.12em] pb-[0.2em] -mt-[0.12em] -mb-[0.2em]',
          });
          gsap.set(headlineSplit.chars, { yPercent: 112, opacity: 0 });
        }

        if (scrollWrapRef.current) {
          gsap.set(scrollWrapRef.current, { opacity: 0, y: 12 });
        }

        const tl = gsap.timeline();

        // Phase 1: SVG Seal Logo line-drawing + word-by-word "깨끗하게, 맑게, 자신있게!" underneath on Black Navy
        if (logoPaths && logoPaths.length > 0) {
          logoPaths.forEach((path) => {
            const len = path.getTotalLength();
            gsap.set(path, {
              strokeDasharray: len,
              strokeDashoffset: len,
              fillOpacity: 0,
              strokeOpacity: 1,
            });
          });

          tl.to(logoPaths, {
            strokeDashoffset: 0,
            duration: 1.05,
            stagger: 0.09,
            ease: 'power2.inOut',
          }).to(
            logoPaths,
            {
              fillOpacity: 1,
              strokeOpacity: 0,
              duration: 0.38,
              ease: 'power2.out',
            },
            '-=0.28'
          );
        }

        if (words && words.length > 0) {
          gsap.set(words, { opacity: 0, y: 12 });

          tl.to(
            words,
            {
              opacity: 1,
              y: 0,
              duration: 0.42,
              stagger: 0.24,
              ease: 'power3.out',
            },
            0.3
          );
        }

        tl.to(lockupRef.current, {
          opacity: 0,
          scale: 1.08,
          duration: 0.34,
          delay: 0.22,
          ease: 'power2.in',
        });

        // Phase 2: Dramatic center-outward portal wipe & camera pullback
        tl.to(
          preloaderRef.current,
          {
            opacity: 0,
            duration: 0.25,
            ease: 'power2.out',
            onComplete: () => {
              if (preloaderRef.current) {
                preloaderRef.current.style.display = 'none';
              }
            },
          },
          '-=0.1'
        )
          .to(
            portalStageRef.current,
            {
              opacity: 1,
              clipPath: 'inset(0% 0% 0% 0% round 0px)',
              duration: 1.15,
              ease: 'power4.inOut',
            },
            '<'
          )
          .to(
            mediaWrapRef.current,
            {
              scale: 1,
              duration: 1.55,
              ease: 'power3.out',
            },
            '<'
          );

        // Phase 3: Hanja artwork, headline character glide, quote & scroll cue entrance
        const hanjaEl = revealItems?.[0];
        const quoteEl = revealItems?.[1];

        if (hanjaEl) {
          tl.to(
            hanjaEl,
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              clearProps: 'transform',
            },
            '-=0.85'
          );
        }

        if (headlineSplit && headlineSplit.chars.length > 0) {
          tl.to(
            headlineSplit.chars,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.78,
              stagger: 0.026,
              ease: 'power3.out',
            },
            hanjaEl ? '<+0.12' : '-=0.85'
          );
        }

        if (quoteEl) {
          tl.to(
            quoteEl,
            {
              opacity: 1,
              y: 0,
              duration: 0.95,
              ease: 'power3.out',
              clearProps: 'transform',
            },
            '-=0.45'
          );
        }

        if (scrollWrapRef.current) {
          tl.to(
            scrollWrapRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power3.out',
              clearProps: 'transform',
            },
            '-=0.5'
          );
        }

        // Continuous atmospheric life after intro completes
        tl.add(() => {
          if (mediaWrapRef.current) {
            breathingTween = gsap.to(mediaWrapRef.current, {
              scale: 1.055,
              duration: 16,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
              paused: isHeroCovered,
            });
          }
        });

        if (emberGlowRef.current) {
          glowTween = gsap.to(emberGlowRef.current, {
            opacity: 0.85,
            scale: 1.08,
            duration: 4.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            paused: isHeroCovered,
          });
        }

        if (scrollCueRef.current) {
          scrollCueTween = gsap.to(scrollCueRef.current, {
            y: 7,
            duration: 1.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            paused: isHeroCovered,
          });
        }

        // Keep Hero crisp at full opacity until Prolog physically rises over it
      }, sectionRef);

      let removeMouseListener: (() => void) | undefined;
      let glitchDelayCall: gsap.core.Tween | undefined;
      let activeGlitchTl: gsap.core.Timeline | undefined;
      let isUnmounted = false;

      const triggerGlitchBurst = () => {
        glitchDelayCall = undefined;
        if (isUnmounted || isHeroCovered) return;

        const randRange = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        const slice1Top = Math.round(randRange(10, 32));
        const slice1Bottom = Math.round(100 - slice1Top - randRange(4, 11));
        const slice2Top = Math.round(randRange(38, 62));
        const slice2Bottom = Math.round(100 - slice2Top - randRange(3, 9));
        const slice3Top = Math.round(randRange(68, 86));
        const slice3Bottom = Math.round(100 - slice3Top - randRange(3, 8));

        const glitchTl = gsap.timeline({
          onComplete: () => {
            activeGlitchTl = undefined;
            if (!isUnmounted && !isHeroCovered) {
              glitchDelayCall = gsap.delayedCall(
                randRange(2.8, 6.2),
                triggerGlitchBurst
              );
            }
          },
        });
        activeGlitchTl = glitchTl;

        // Frame 1: sharp signal tear & crimson/silver aberration
        glitchTl
          .set(glitchVideoRef.current, {
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

          // Frame 2: unstable horizontal shift + lower slice snap
          .to(
            {},
            {
              duration: 0.055,
            }
          )
          .set(glitchVideoRef.current, {
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

          // Frame 3: brief calm micro-gap before optional second flutter
          .to({}, { duration: 0.05 })
          .set(glitchVideoRef.current, {
            x: 0,
            skewX: 0,
            scaleX: 1,
            filter: 'none',
          })
          .set([glitchSlice1Ref.current, glitchSlice3Ref.current], {
            opacity: 0,
          })
          .set(scanlineRef.current, { opacity: 0.14 });

        // 60% chance of a quick aftershock pulse
        if (Math.random() > 0.4) {
          glitchTl
            .to({}, { duration: 0.06 })
            .set(glitchVideoRef.current, {
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
            .set(glitchVideoRef.current, {
              x: 0,
              skewX: 0,
              scaleX: 1,
              filter: 'none',
            })
            .set(glitchSlice2Ref.current, { opacity: 0 })
            .set(scanlineRef.current, { opacity: 0.14 });
        }
      };

      // Start intermittent SF glitch cycle right after initial portal reveal finishes
      glitchDelayCall = gsap.delayedCall(2.8, triggerGlitchBurst);

      // Analog 35mm projector shutter flicker & hairline celluloid scratches
      let analogDelayCall: gsap.core.Tween | undefined;
      let activeAnalogTl: gsap.core.Timeline | undefined;

      const triggerAnalogArtifact = () => {
        analogDelayCall = undefined;
        if (isUnmounted || isHeroCovered) return;

        const randRange = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        const scratchLeft1 = Math.round(randRange(14, 86));
        const scratchLeft2 = Math.round(randRange(18, 82));

        const analogTl = gsap.timeline({
          onComplete: () => {
            activeAnalogTl = undefined;
            if (!isUnmounted && !isHeroCovered) {
              analogDelayCall = gsap.delayedCall(
                randRange(1.4, 3.8),
                triggerAnalogArtifact
              );
            }
          },
        });
        activeAnalogTl = analogTl;

        // Subtle projector exposure flutter + optional vertical film hair scratch
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

      analogDelayCall = gsap.delayedCall(2.4, triggerAnalogArtifact);

      setEffectsCovered = (covered) => {
        breathingTween?.paused(covered);
        glowTween?.paused(covered);
        scrollCueTween?.paused(covered);
        glitchDelayCall?.paused(covered);
        activeGlitchTl?.paused(covered);
        analogDelayCall?.paused(covered);
        activeAnalogTl?.paused(covered);
      };
      setEffectsCovered(isHeroCovered);

      // Subtle cursor depth parallax on desktop
      if (
        window.matchMedia('(pointer: fine)').matches &&
        parallaxMediaRef.current &&
        parallaxTextRef.current
      ) {
        const mediaX = gsap.quickTo(parallaxMediaRef.current, 'x', {
          duration: 0.9,
          ease: 'power3.out',
        });
        const mediaY = gsap.quickTo(parallaxMediaRef.current, 'y', {
          duration: 0.9,
          ease: 'power3.out',
        });
        const textX = gsap.quickTo(parallaxTextRef.current, 'x', {
          duration: 0.9,
          ease: 'power3.out',
        });
        const textY = gsap.quickTo(parallaxTextRef.current, 'y', {
          duration: 0.9,
          ease: 'power3.out',
        });

        const handleMouseMove = (e: MouseEvent) => {
          if (isHeroCovered) return;
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          mediaX(nx * -18);
          mediaY(ny * -12);
          textX(nx * 8);
          textY(ny * 6);
        };

        const sectionEl = sectionRef.current;
        sectionEl?.addEventListener('mousemove', handleMouseMove);
        removeMouseListener = () => {
          sectionEl?.removeEventListener('mousemove', handleMouseMove);
        };
      }

      return () => {
        isUnmounted = true;
        setEffectsCovered = undefined;
        breathingTween?.kill();
        glitchDelayCall?.kill();
        activeGlitchTl?.kill();
        analogDelayCall?.kill();
        activeAnalogTl?.kill();
        removeMouseListener?.();
        headlineSplit?.revert();
        ctx.revert();
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(preloaderRef.current, { display: 'none' });
    });

    const setHeroCovered = (covered: boolean) => {
      if (covered === isHeroCovered) return;
      isHeroCovered = covered;
      heroEl?.toggleAttribute('data-hero-covered', covered);
      setEffectsCovered?.(covered);
      if (covered) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play().catch(() => {});
      }
    };
    const syncCover = (trigger: ScrollTrigger) => setHeroCovered(trigger.scroll() >= trigger.start);
    const coverTrigger = ScrollTrigger.create({
      trigger: '#prolog',
      start: 'top top',
      onEnter: () => setHeroCovered(true),
      onLeaveBack: () => setHeroCovered(false),
      onRefresh: syncCover,
    });
    syncCover(coverTrigger);

    return () => {
      coverTrigger.kill();
      heroEl?.removeAttribute('data-hero-covered');
      mm.revert();
    };
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="sticky top-0 z-10 isolate h-dvh w-full overflow-hidden bg-[#0C121B] flex flex-col justify-between"
    >
      {/* Keep the splash above the sticky Hero, site navigation and later sections. */}
      {createPortal(
        <div
          ref={preloaderRef}
          aria-hidden="true"
          data-hero-splash
          className="fixed inset-0 z-[100] bg-[#0C121B] flex items-center justify-center motion-reduce:hidden"
        >
          <div ref={lockupRef} className="flex flex-col items-center justify-center gap-5">
            <svg
              ref={svgLogoRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 370 350"
              width="76"
              height="72"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="square"
              strokeLinejoin="miter"
              className="text-[#A52A43]"
            >
              <g id="preloader-moodang-teacher">
                <path d="M292 188.62h-91V147h-32.26v41.62H62.65V283H92v-74.59h185.65V283H307v-94.38h-15z" />
                <path d="M0 0v350h370V0zm168.74 30v58H201V30h139v71.84l-62.71-36.2-93.29 53-93.29-53L30 100.69V30zM201 320v-33h29.6v-7.61H201v-15.3h59.46v-43.84H108.69v43.84h60.05v15.3h-30.19V287h30.19v33H30V123.55l61.2-35.29L150.74 120h-49.59v6h165.7v-6h-49.59l59.54-31.74L340 124.7V320zm-77.24-71v-13.7h121.63V249z" />
                <path transform="rotate(-81.81 99.5 157.502)" d="M93 121h13v73H93z" />
                <path transform="rotate(-8.19 268.459 157.508)" d="M232 151h73v13h-73z" />
              </g>
            </svg>

            <div
              ref={sloganRef}
              className="font-medium text-[#D7D0C3] select-none flex items-center justify-center gap-2 sm:gap-2.5 whitespace-nowrap text-sm sm:text-base leading-none tracking-[0.06em]"
            >
              {SLOGAN_WORDS.map((word, index) => (
                <span key={index} data-slogan-word className="inline-block">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Expanding Portal Stage */}
      <div
        ref={portalStageRef}
        className="absolute inset-0 z-0 overflow-hidden bg-[#0C121B] pointer-events-none will-change-[clip-path,opacity]"
      >
        {/* Fallback atmospheric black-navy + moonlight + deep crimson glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_74%_24%,rgba(215,208,195,0.12),transparent_42%),radial-gradient(circle_at_72%_72%,rgba(165,42,67,0.18),transparent_45%),linear-gradient(180deg,#0C121B_0%,#080D14_100%)]"
        />

        {!videoFailed && (
          <div ref={parallaxMediaRef} className="absolute -inset-4 will-change-transform">
            <div ref={mediaWrapRef} className="w-full h-full will-change-transform">
              <div ref={glitchVideoRef} className="w-full h-full will-change-[transform,filter]">
                <video
                  ref={videoRef}
                  src={HERO_VIDEO_SRC}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onError={() => setVideoFailed(true)}
                  aria-label="폐허가 된 도시의 빗속에 홀로 선 남자와 그 뒤를 지키는 거대한 검은 황소 영상"
                  className="w-full h-full object-cover object-[66%_35%] md:object-[64%_center] sepia-[0.16] saturate-[0.84] contrast-[1.12] brightness-[0.88]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Analog 35mm Warm-Bone Wash & Optical Lens Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-[#D7D0C3]/[0.04] mix-blend-soft-light"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_44%,rgba(12,18,27,0.74)_100%)]"
        />

        {/* Intermittent SF Glitch Tear Slices & Scanline Interference */}
        <div
          ref={glitchSlice1Ref}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none backdrop-brightness-150 backdrop-contrast-150 bg-[#D7D0C3]/10 mix-blend-screen will-change-[transform,opacity,clip-path]"
        />
        <div
          ref={glitchSlice2Ref}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none backdrop-contrast-150 backdrop-hue-rotate-15 bg-[#A52A43]/22 mix-blend-screen will-change-[transform,opacity,clip-path]"
        />
        <div
          ref={glitchSlice3Ref}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none backdrop-invert-[0.14] backdrop-contrast-150 bg-[#0C121B]/35 will-change-[transform,opacity,clip-path]"
        />
        <div
          ref={scanlineRef}
          aria-hidden="true"
          className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_2px,rgba(215,208,195,0.08)_3px,rgba(12,18,27,0.28)_4px)]"
        />

        {/* Analog Projector Shutter Flicker & Vertical Film Scratches */}
        <div
          ref={projectorFlickerRef}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none bg-[#070B11]"
        />
        <div
          ref={filmScratchRef}
          aria-hidden="true"
          className="absolute inset-y-0 w-px opacity-0 pointer-events-none bg-gradient-to-b from-transparent via-[#D7D0C3]/65 to-transparent"
        />
        <div
          ref={filmScratch2Ref}
          aria-hidden="true"
          className="absolute inset-y-0 w-px opacity-0 pointer-events-none bg-gradient-to-b from-transparent via-[#A52A43]/45 to-transparent"
        />

        {/* Dynamic Breathing Ember & Moonlight Atmosphere */}
        <div
          ref={emberGlowRef}
          aria-hidden="true"
          className="absolute inset-0 opacity-50 pointer-events-none bg-[radial-gradient(circle_at_82%_68%,rgba(165,42,67,0.22),transparent_38%),radial-gradient(circle_at_76%_18%,rgba(215,208,195,0.12),transparent_32%)]"
        />

        {/* Balanced Directional & Center Readability Scrims */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(12,18,27,0.68)_0%,rgba(12,18,27,0.36)_54%,rgba(12,18,27,0.22)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#0C121B]/25"
        />
        {/* Top & Bottom Vignettes */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0C121B]/90 via-[#0C121B]/45 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0C121B] via-[#0C121B]/65 to-transparent"
        />
        {/* Animated 35mm Celluloid Film Grain */}
        <div
          aria-hidden="true"
          className="cinema-grain absolute -inset-12 opacity-40 mix-blend-overlay pointer-events-none"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 inset-y-[24.5%] z-[25] flex justify-center md:inset-y-[17.5%]">
        <img
          data-hero-reveal
          src="/assets/hanja/hero.svg"
          alt="巫堂先生"
          width={464}
          height={1334}
          className="h-full w-auto max-w-[40%] object-contain drop-shadow-[0_6px_24px_rgba(12,18,27,0.9)]"
        />
      </div>

      {/* Top Spacer for Centered Logo + Nav */}
      <div className="h-28 md:h-32 shrink-0" aria-hidden="true" />

      {/* Centered Monumental Headline Block */}
      <div className="relative z-30 w-full px-4 sm:px-8 py-8 md:py-12 flex-1 flex items-center justify-center">
        <div
          ref={parallaxTextRef}
          className="w-full mx-auto text-center will-change-transform"
        >
          <div className="flex w-full flex-col items-center pt-12 text-center sm:pt-[3.25rem] md:pt-[3.75rem]">
            <h1
              ref={headlineRef}
              className="font-display font-bold tracking-[-0.05em] leading-[0.95] text-[10.4vw] whitespace-nowrap select-none md:select-text drop-shadow-[0_12px_36px_rgba(12,18,27,0.92)]"
            >
              <span className="text-[#EAE5DC]">
                designer <span className="font-thin">&amp;&amp;</span>
              </span>{' '}
              <span className="text-[#D7D0C3]">teacher</span>
            </h1>

            <figure data-hero-reveal className="hidden mt-7 md:mt-10 max-w-[600px] mx-auto text-center">
              <blockquote className="text-lg sm:text-xl md:text-[22px] font-medium leading-[1.6] tracking-[-0.015em] text-[#D7D0C3]">
                규칙을 알아야 그 규칙을 파괴할 수 있다.
              </blockquote>
              <figcaption className="mt-2.5 text-sm md:text-[15px] font-normal text-[#D7D0C3]/80 tracking-wide">
                에드 펠라(Ed Fella)
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      {/* Centered Scroll Cue */}
      <div
        ref={scrollWrapRef}
        className="relative z-30 w-full pb-8 pt-4 flex items-center justify-center"
      >
        <button
          type="button"
          onClick={onExplore}
          aria-label="다음 섹션으로 스크롤"
          className="inline-flex flex-col items-center gap-2 text-[11px] font-medium tracking-[0.26em] text-[#D7D0C3] hover:text-[#EAE5DC] transition-colors cursor-pointer py-2 px-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A52A43]"
        >
          <span>SCROLL</span>
          <div ref={scrollCueRef} className="inline-flex items-center text-white">
            <ArrowDown size={16} aria-hidden="true" />
          </div>
        </button>
      </div>
    </section>
  );
}
