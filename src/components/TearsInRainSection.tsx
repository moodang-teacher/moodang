import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import gsap from 'gsap';

const TEARS_VIDEO_SRC = '/assets/aistudio/Time_to_Die_scrub.mp4';
const FALLBACK_VIDEO_DURATION = 50.633917;

const TEARS_LINES = [
  "I've seen things you people wouldn't believe.",
  'Attack ships on fire off the shoulder of Orion.',
  'I watched C-beams glitter in the dark near the Tannhauser gate.',
  'All those moments will be lost in time, like tears in rain.',
  'Time to die.',
];

const RIP_TRIBUTE_TEXT = 'R.I.P... Rutger Hauer(1944 ~ 2019)';

// Synced windows along the 10-unit tears_in_rain timeline (0s -> ~50.63s of video)
const LINE_CUE_WINDOWS: Array<{
  appearAt: number;
  fillStart: number;
  fillEnd: number;
  outStart?: number;
  outEnd?: number;
}> = [
  { appearAt: 1.35, fillStart: 1.48, fillEnd: 2.65, outStart: 2.82, outEnd: 3.04 },
  { appearAt: 3.08, fillStart: 3.2, fillEnd: 4.35, outStart: 4.52, outEnd: 4.74 },
  { appearAt: 4.78, fillStart: 4.9, fillEnd: 6.22, outStart: 6.4, outEnd: 6.62 },
  { appearAt: 6.66, fillStart: 6.78, fillEnd: 8.05, outStart: 8.22, outEnd: 8.4 },
  { appearAt: 8.42, fillStart: 8.52, fillEnd: 9.28 },
];

export const TEARS_TIMELINE_DURATION = 10;
const TEARS_HOLD_DURATION = 0.45;
const TEARS_FADE_DURATION = 0.95;
const TEARS_SCENE_DURATION =
  TEARS_TIMELINE_DURATION + TEARS_HOLD_DURATION + TEARS_FADE_DURATION;
const TOUCH_SEEK_INTERVAL_MS = 1000 / 24;

export interface TearsInRainHooks {
  isStageVisible?: () => boolean;
  onFullscreenEnter?: () => void;
  onFullscreenLeaveBack?: () => void;
}

export interface TearsInRainHandle {
  attachTimeline: (
    tl: gsap.core.Timeline,
    startAt: number,
    hooks?: TearsInRainHooks
  ) => () => void;
}

interface TearsInRainSectionProps {
  ref?: Ref<TearsInRainHandle>;
}

export default function TearsInRainSection({ ref }: TearsInRainSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const slitStageRef = useRef<HTMLDivElement>(null);
  const parallaxMediaRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const glitchVideoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const glitchSlice1Ref = useRef<HTMLDivElement>(null);
  const glitchSlice2Ref = useRef<HTMLDivElement>(null);
  const glitchSlice3Ref = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const projectorFlickerRef = useRef<HTMLDivElement>(null);
  const filmScratchRef = useRef<HTMLDivElement>(null);
  const filmScratch2Ref = useRef<HTMLDivElement>(null);
  const emberGlowRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const parallaxTextRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const tributeRef = useRef<HTMLSpanElement>(null);

  const desiredProgressRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);
  const isSceneVisibleRef = useRef(false);
  const isSectionActiveRef = useRef(false);
  const syncEffectsRef = useRef<(active: boolean) => void>(() => {});
  const syncVideoRef = useRef<() => void>(() => {});

  const getClampedTargetTime = (videoEl: HTMLVideoElement) => {
    const duration =
      Number.isFinite(videoEl.duration) && videoEl.duration > 0
        ? videoEl.duration
        : FALLBACK_VIDEO_DURATION;
    return Math.max(
      0.02,
      Math.min(duration - 0.04, desiredProgressRef.current * duration)
    );
  };

  const cancelPendingSeek = () => {
    if (pendingSeekRef.current !== null) {
      window.clearTimeout(pendingSeekRef.current);
      pendingSeekRef.current = null;
    }
  };

  const setSceneVisible = (visible: boolean) => {
    if (isSceneVisibleRef.current === visible) return;
    isSceneVisibleRef.current = visible;
    sectionRef.current?.toggleAttribute('data-tears-visible', visible);
    if (!visible) {
      cancelPendingSeek();
      videoRef.current?.pause();
    }
  };

  const setEffectsActive = (active: boolean) => {
    if (isSectionActiveRef.current === active) return;
    isSectionActiveRef.current = active;
    syncEffectsRef.current(active);
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const touchInput = window.matchMedia('(pointer: coarse)');
    let lastSeekAt = -Infinity;
    let hasPrimed = false;
    let disposed = false;

    const flushVideoSeek = () => {
      if (disposed || !isSceneVisibleRef.current || videoEl.readyState < 1 || videoEl.seeking) {
        return;
      }

      const targetTime = getClampedTargetTime(videoEl);
      if (Math.abs(videoEl.currentTime - targetTime) < 0.018) return;

      const now = performance.now();
      const remaining = TOUCH_SEEK_INTERVAL_MS - (now - lastSeekAt);
      if (touchInput.matches && remaining > 0) {
        if (pendingSeekRef.current === null) {
          pendingSeekRef.current = window.setTimeout(() => {
            pendingSeekRef.current = null;
            flushVideoSeek();
          }, remaining);
        }
        return;
      }

      cancelPendingSeek();
      try {
        videoEl.currentTime = targetTime;
        lastSeekAt = now;
      } catch {
        // The next timeline update or media readiness event can retry.
      }
    };

    const syncVideo = () => {
      if (!isSceneVisibleRef.current) return;
      if (videoEl.preload !== 'auto') videoEl.preload = 'auto';
      if (!hasPrimed && desiredProgressRef.current > 0.01 && videoEl.readyState >= 2) {
        hasPrimed = true;
        videoEl.play()
          .then(() => {
            if (disposed) return;
            videoEl.pause();
            flushVideoSeek();
          })
          .catch(() => {
            // Direct seeking still works if the browser blocks playback.
          });
      }
      flushVideoSeek();
    };

    syncVideoRef.current = syncVideo;
    videoEl.addEventListener('loadedmetadata', syncVideo);
    videoEl.addEventListener('loadeddata', syncVideo);
    videoEl.addEventListener('canplay', syncVideo);
    videoEl.addEventListener('seeked', syncVideo);
    syncVideo();

    return () => {
      disposed = true;
      cancelPendingSeek();
      videoEl.pause();
      syncVideoRef.current = () => {};
      videoEl.removeEventListener('loadedmetadata', syncVideo);
      videoEl.removeEventListener('loadeddata', syncVideo);
      videoEl.removeEventListener('canplay', syncVideo);
      videoEl.removeEventListener('seeked', syncVideo);
    };
  }, []);

  // Hero-matched cinema effects: camera breathing, ember pulse, SF glitch bursts, 35mm flicker/scratches, cursor parallax
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let cameraTween: gsap.core.Tween | undefined;
      let emberTween: gsap.core.Tween | undefined;
      const ctx = gsap.context(() => {
        if (mediaWrapRef.current) {
          cameraTween = gsap.to(mediaWrapRef.current, {
            scale: 1.055,
            duration: 16,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            paused: true,
          });
        }

        if (emberGlowRef.current) {
          emberTween = gsap.to(emberGlowRef.current, {
            opacity: 0.85,
            scale: 1.08,
            duration: 4.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            paused: true,
          });
        }
      }, sectionRef);

      let isUnmounted = false;
      let glitchDelayCall: gsap.core.Tween | undefined;
      let activeGlitchTl: gsap.core.Timeline | undefined;
      let analogDelayCall: gsap.core.Tween | undefined;
      let activeAnalogTl: gsap.core.Timeline | undefined;
      let removeMouseListener: (() => void) | undefined;

      const randRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const triggerGlitchBurst = () => {
        if (isUnmounted || !isSectionActiveRef.current) return;

        const slice1Top = Math.round(randRange(10, 32));
        const slice1Bottom = Math.round(100 - slice1Top - randRange(4, 11));
        const slice2Top = Math.round(randRange(38, 62));
        const slice2Bottom = Math.round(100 - slice2Top - randRange(3, 9));
        const slice3Top = Math.round(randRange(68, 86));
        const slice3Bottom = Math.round(100 - slice3Top - randRange(3, 8));

        const glitchTl = gsap.timeline({
          onComplete: () => {
            activeGlitchTl = undefined;
            if (!isUnmounted && isSectionActiveRef.current) {
              glitchDelayCall = gsap.delayedCall(
                randRange(2.8, 6.2),
                triggerGlitchBurst
              );
            }
          },
        });
        activeGlitchTl = glitchTl;

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
          .to({}, { duration: 0.055 })
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

      const triggerAnalogArtifact = () => {
        if (isUnmounted || !isSectionActiveRef.current) return;

        const scratchLeft1 = Math.round(randRange(14, 86));
        const scratchLeft2 = Math.round(randRange(18, 82));

        const analogTl = gsap.timeline({
          onComplete: () => {
            activeAnalogTl = undefined;
            if (!isUnmounted && isSectionActiveRef.current) {
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

      const syncEffects = (active: boolean) => {
        if (active) {
          cameraTween?.resume();
          emberTween?.resume();
          glitchDelayCall = gsap.delayedCall(1.2, triggerGlitchBurst);
          analogDelayCall = gsap.delayedCall(0.9, triggerAnalogArtifact);
        } else {
          cameraTween?.pause();
          emberTween?.pause();
          glitchDelayCall?.kill();
          analogDelayCall?.kill();
          activeGlitchTl?.revert();
          activeAnalogTl?.revert();
          activeGlitchTl = undefined;
          activeAnalogTl = undefined;
        }
      };
      syncEffectsRef.current = syncEffects;
      syncEffects(isSectionActiveRef.current);

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
          if (!isSectionActiveRef.current) return;
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
        syncEffects(false);
        syncEffectsRef.current = () => {};
        removeMouseListener?.();
        ctx.revert();
      };
    });

    return () => mm.revert();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      attachTimeline: (tl, startAt, hooks) => {
        const sectionEl = sectionRef.current;
        const veilEl = veilRef.current;
        const slitEl = slitStageRef.current;
        const textLayerEl = textLayerRef.current;
        if (!sectionEl || !veilEl || !slitEl || !textLayerEl) return () => {};

        const validLines = lineRefs.current.filter(
          (el): el is HTMLParagraphElement => el !== null
        );
        const tributeEl = tributeRef.current;

        // Keep visibility: visible (opacity: 0) so Chromium never suspends video frame decoding
        gsap.set(sectionEl, { opacity: 0, pointerEvents: 'none' });
        gsap.set(veilEl, { opacity: 0 });
        gsap.set(slitEl, { top: '50%', bottom: '50%', opacity: 1 });
        gsap.set(textLayerEl, { opacity: 1 });
        if (tributeEl) {
          gsap.set(tributeEl, { opacity: 0, y: 12 });
        }

        validLines.forEach((lineEl) => {
          gsap.set(lineEl, { opacity: 0, y: 12 });
          const chars = lineEl.querySelectorAll('[data-tears-char]');
          if (chars.length > 0) {
            gsap.set(chars, { opacity: 0.1 });
          }
        });

        // Begin buffering during the completed portrait's reading beat.
        tl.call(() => {
          const videoEl = videoRef.current;
          if (videoEl) videoEl.preload = 'auto';
        }, [], Math.max(0, startAt - 1.4));

        // 1. Reveal section & open narrow 100%-wide horizontal center slit over motionless About Me
        tl.to(
          sectionEl,
          {
            opacity: 1,
            pointerEvents: 'auto',
            duration: 0.08,
            ease: 'none',
          },
          startAt
        )
          .to(
            veilEl,
            {
              opacity: 0.72,
              duration: 0.55,
              ease: 'power2.out',
            },
            startAt
          )
          .fromTo(
            slitEl,
            { top: '50%', bottom: '50%' },
            {
              top: '42%',
              bottom: '42%',
              duration: 0.55,
              ease: 'power2.out',
              immediateRender: false,
            },
            startAt
          )
          // Brief hold on the center strip before expanding upward & downward
          .to({}, { duration: 0.28 }, startAt + 0.55)
          .fromTo(
            slitEl,
            { top: '42%', bottom: '42%' },
            {
              top: '0%',
              bottom: '0%',
              duration: 0.85,
              ease: 'power3.inOut',
              immediateRender: false,
            },
            startAt + 0.83
          )
          .to(
            veilEl,
            {
              opacity: 1,
              duration: 0.7,
              ease: 'power2.inOut',
            },
            startAt + 0.83
          );

        // 2. One-line-at-a-time 7.5vw bold subtitles: appear at opacity 0.1, fill character-by-character to 1
        LINE_CUE_WINDOWS.forEach((cue, idx) => {
          const lineEl = lineRefs.current[idx];
          if (!lineEl) return;

          const chars = lineEl.querySelectorAll('[data-tears-char]');

          tl.fromTo(
            lineEl,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.18,
              ease: 'power2.out',
              immediateRender: false,
            },
            startAt + cue.appearAt
          );

          if (chars.length > 0) {
            tl.fromTo(
              chars,
              { opacity: 0.1 },
              {
                opacity: 1,
                duration: 0.22,
                stagger: {
                  each:
                    (cue.fillEnd - cue.fillStart - 0.22) /
                    Math.max(1, chars.length - 1),
                  from: 'start',
                },
                ease: 'none',
                immediateRender: false,
              },
              startAt + cue.fillStart
            );
          }

          if (cue.outStart !== undefined && cue.outEnd !== undefined) {
            tl.to(
              lineEl,
              {
                opacity: 0,
                y: -10,
                duration: cue.outEnd - cue.outStart,
                ease: 'power2.in',
                immediateRender: false,
              },
              startAt + cue.outStart
            );
          }
        });

        // Fade in Rutger Hauer tribute right after "Time to die." finishes filling
        if (tributeEl) {
          tl.fromTo(
            tributeEl,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.56,
              ease: 'power2.out',
              immediateRender: false,
            },
            startAt + 9.38
          );
        }

        // Keep the final frame visible through the reading beat and fade.
        const scrubProxy = { progress: 0 };
        let wasFullscreen = false;

        tl.to(
          scrubProxy,
          {
            progress: 1,
            duration: TEARS_SCENE_DURATION,
            ease: 'none',
            onUpdate: () => {
              const elapsed = scrubProxy.progress * TEARS_SCENE_DURATION;
              const p = Math.max(0, Math.min(1, elapsed / TEARS_TIMELINE_DURATION));
              desiredProgressRef.current = p;
              const visible =
                scrubProxy.progress > 0 &&
                scrubProxy.progress < 1 &&
                (hooks?.isStageVisible?.() ?? true);
              setSceneVisible(visible);
              setEffectsActive(visible && p > 0.01);
              if (visible) syncVideoRef.current();

              const isNowFullscreen = p >= 0.168;
              if (isNowFullscreen && !wasFullscreen) {
                wasFullscreen = true;
                hooks?.onFullscreenEnter?.();
              } else if (!isNowFullscreen && wasFullscreen) {
                wasFullscreen = false;
                hooks?.onFullscreenLeaveBack?.();
              }
            },
          },
          startAt
        );

        // 4. Brief reading beat on "Time to die." + tribute, then fade out to solid #0C121B before My Works
        tl.to({}, { duration: TEARS_HOLD_DURATION }, startAt + TEARS_TIMELINE_DURATION)
          .to(
            [slitEl, textLayerEl],
            {
              opacity: 0,
              duration: TEARS_FADE_DURATION,
              ease: 'power2.inOut',
              immediateRender: false,
            },
            startAt + TEARS_TIMELINE_DURATION + TEARS_HOLD_DURATION
          );

        return () => {
          wasFullscreen = false;
          setSceneVisible(false);
          setEffectsActive(false);
        };
      },
    }),
    []
  );

  return (
    <section
      id="tears_in_rain"
      ref={sectionRef}
      aria-label="Blade Runner Tears in Rain"
      className="motion-safe:absolute motion-safe:inset-0 motion-reduce:relative motion-reduce:min-h-[100dvh] z-30 h-[100dvh] w-full overflow-hidden text-[#EAE5DC]"
    >
      {/* Dimming #0C121B veil over About Me behind the expanding slit */}
      <div
        ref={veilRef}
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-[#0C121B]/95 pointer-events-none"
      />

      {/* Centered horizontal strip expanding vertically (up & down) to 100% fullscreen */}
      <div
        ref={slitStageRef}
        className="absolute inset-x-0 top-[50%] bottom-[50%] motion-reduce:top-0 motion-reduce:bottom-0 z-10 w-full overflow-hidden bg-[#0C121B] will-change-[top,bottom]"
      >
        {/* Fixed full-viewport inner video frame so slit opening crops cleanly without squishing */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-[100dvh]">
          {/* Fallback atmospheric black-navy + moonlight + deep crimson glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_74%_24%,rgba(215,208,195,0.12),transparent_42%),radial-gradient(circle_at_72%_72%,rgba(165,42,67,0.18),transparent_45%),linear-gradient(180deg,#0C121B_0%,#080D14_100%)]"
          />

          <div
            ref={parallaxMediaRef}
            className="absolute -inset-4 will-change-transform"
          >
            <div ref={mediaWrapRef} className="w-full h-full will-change-transform">
              <div
                ref={glitchVideoRef}
                className="w-full h-full will-change-[transform,filter]"
              >
                <video
                  ref={videoRef}
                  src={TEARS_VIDEO_SRC}
                  muted
                  playsInline
                  preload="metadata"
                  aria-label="빗속에서 독백하는 영화 블레이드 러너 로이 배티 장면"
                  className="w-full h-full object-cover object-[50%_47%] scale-[1.28] md:scale-[1.32] sepia-[0.16] saturate-[0.84] contrast-[1.12] brightness-[0.88] pointer-events-none select-none will-change-transform"
                />
              </div>
            </div>
          </div>

          {/* Analog 35mm Warm-Bone Wash & Optical Lens Vignette (Hero-matched) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] pointer-events-none bg-[#D7D0C3]/[0.04] mix-blend-soft-light"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_44%,rgba(12,18,27,0.74)_100%)]"
          />

          {/* Intermittent SF Glitch Tear Slices & Scanline Interference (Hero-matched) */}
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

          {/* Analog Projector Shutter Flicker & Vertical Film Scratches (Hero-matched) */}
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

          {/* Dynamic Breathing Ember & Moonlight Atmosphere (Hero-matched) */}
          <div
            ref={emberGlowRef}
            aria-hidden="true"
            className="absolute inset-0 z-[3] opacity-50 pointer-events-none bg-[radial-gradient(circle_at_82%_68%,rgba(165,42,67,0.22),transparent_38%),radial-gradient(circle_at_76%_18%,rgba(215,208,195,0.12),transparent_32%)]"
          />

          {/* Seamless Top & Bottom Letterbox-Concealing #0C121B Gradients */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 z-[4] h-[26vh] pointer-events-none bg-[linear-gradient(to_bottom,#0C121B_0%,#0C121B_24%,rgba(12,18,27,0.86)_52%,rgba(12,18,27,0.38)_78%,transparent_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-[4] h-[26vh] pointer-events-none bg-[linear-gradient(to_top,#0C121B_0%,#0C121B_24%,rgba(12,18,27,0.86)_52%,rgba(12,18,27,0.38)_78%,transparent_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[4] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(12,18,27,0.14)_0%,rgba(12,18,27,0.68)_100%)]"
          />

          {/* Animated 35mm Celluloid Film Grain (Hero-matched) */}
          <div
            aria-hidden="true"
            className="cinema-grain absolute -inset-12 z-[5] opacity-40 mix-blend-overlay pointer-events-none"
          />
        </div>
      </div>

      {/* Scroll-Synced 6.2vw Bold Single-Line Subtitles (1.5x horizontal margin, opacity: 0.1 -> 1) */}
      <div
        ref={textLayerRef}
        className="pointer-events-none absolute inset-0 z-20 px-9 sm:px-16 pt-[12vh] flex items-center justify-center will-change-[opacity]"
      >
        <div
          ref={parallaxTextRef}
          className="relative w-full max-w-[88vw] grid place-items-center text-center will-change-transform"
        >
          {TEARS_LINES.map((line, index) => {
            const isFinal = index === TEARS_LINES.length - 1;
            const words = line.split(' ');
            return (
              <p
                key={line}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                className={`col-start-1 row-start-1 w-full flex flex-wrap justify-center gap-x-[0.26em] gap-y-[0.06em] font-display text-[6.2vw] leading-[1.14] tracking-[-0.025em] drop-shadow-[0_8px_32px_rgba(7,11,17,0.96)] ${
                  isFinal
                    ? 'font-black text-[#EAE5DC]'
                    : 'font-extrabold text-[#EAE5DC]'
                } motion-reduce:hidden`}
              >
                {words.map((word, wIdx) => (
                  <span
                    key={`${word}-${wIdx}`}
                    className="inline-block whitespace-nowrap"
                  >
                    {Array.from(word).map((ch, cIdx) => (
                      <span
                        key={`${wIdx}-${cIdx}`}
                        data-tears-char
                        className="inline-block"
                      >
                        {ch}
                      </span>
                    ))}
                  </span>
                ))}
                {isFinal && (
                  <span
                    ref={tributeRef}
                    className="mt-4 sm:mt-6 basis-full block text-center font-display text-[9px] sm:text-[11px] md:text-[14px] font-medium leading-normal tracking-[0.14em] text-[#D7D0C3]/85 drop-shadow-[0_4px_18px_rgba(7,11,17,0.95)]"
                  >
                    {RIP_TRIBUTE_TEXT}
                  </span>
                )}
              </p>
            );
          })}

          {/* Static complete quote fallback when prefers-reduced-motion is enabled */}
          <blockquote className="hidden motion-reduce:block space-y-2 font-display text-lg sm:text-2xl md:text-3xl font-extrabold text-[#EAE5DC] drop-shadow-[0_4px_18px_rgba(7,11,17,0.95)]">
            {TEARS_LINES.map((line, index) => (
              <p
                key={line}
                className={
                  index === TEARS_LINES.length - 1
                    ? 'pt-2 font-black text-[#EAE5DC]'
                    : undefined
                }
              >
                {line}
              </p>
            ))}
            <p className="pt-3 text-[9px] sm:text-[10px] md:text-[11px] font-medium tracking-[0.14em] text-[#D7D0C3]/85">
              {RIP_TRIBUTE_TEXT}
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
