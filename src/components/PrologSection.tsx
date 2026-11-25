import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HanjaArtwork from './HanjaArtwork';

gsap.registerPlugin(ScrollTrigger);

export default function PrologSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const topSealRef = useRef<HTMLDivElement>(null);
  const bgWallRef = useRef<HTMLDivElement>(null);
  const smoke1Ref = useRef<HTMLDivElement>(null);
  const smoke2Ref = useRef<HTMLDivElement>(null);
  const smoke3Ref = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const textColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const lines = textColumnRef.current?.querySelectorAll('[data-prolog-line]');

        if (lines && lines.length > 0) {
          gsap.set(lines, { opacity: 0, y: 24 });
        }

        // Smoothly seal the transparent top feather with #0C121B right before pinning at top: 0
        if (topSealRef.current) {
          gsap.fromTo(
            topSealRef.current,
            { opacity: 0 },
            {
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 22%',
                end: 'top top',
                scrub: true,
              },
            }
          );
        }

        // Background enters the screen smoothly as Prolog rises into view
        if (bgWallRef.current) {
          gsap.fromTo(
            bgWallRef.current,
            { opacity: 0.1, xPercent: -6 },
            {
              opacity: 0.72,
              xPercent: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top bottom',
                end: 'top top',
                scrub: true,
              },
            }
          );
        }

        // Pinned ScrollTrigger timeline once Prolog reaches the top of the viewport
        const pinnedTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=4400',
            pin: true,
            pinSpacing: true,
            scrub: 0.75,
            anticipatePin: 1,
            refreshPriority: 50,
          },
        });

        const lineList = lines ? Array.from(lines) : [];
        const revealStep = 0.42;
        const revealDuration = 0.55;
        const revealEnd =
          lineList.length > 0
            ? (lineList.length - 1) * revealStep + revealDuration
            : 0;

        // Phase 1: Reveal lines one by one as user scrolls
        lineList.forEach((line, index) => {
          pinnedTl.to(
            line,
            {
              opacity: 1,
              y: 0,
              duration: revealDuration,
              ease: 'power2.out',
            },
            index * revealStep
          );
        });

        // Phase 2: Generous reading pause while background and smoke drift subtly
        const holdDuration = 2.65;
        const exitStart = revealEnd + holdDuration;
        const exitStep = 0.26;
        const exitDuration = 0.45;

        // Phase 3: Reverse disappearance (last line out first, reversing entrance motion)
        const reversedLines = [...lineList].reverse();
        reversedLines.forEach((line, index) => {
          pinnedTl.to(
            line,
            {
              opacity: 0,
              y: 24,
              duration: exitDuration,
              ease: 'power2.in',
              immediateRender: false,
            },
            exitStart + index * exitStep
          );
        });

        const fadeOutSpan =
          reversedLines.length > 0
            ? (reversedLines.length - 1) * exitStep + exitDuration
            : 1.6;
        const fadeOutEnd = exitStart + fadeOutSpan;

        // Fade out background skull wall, crimson smoke layers, and grain together with text exit
        const visualLayers = [
          bgWallRef.current,
          smoke1Ref.current,
          smoke2Ref.current,
          smoke3Ref.current,
          grainRef.current,
        ].filter(Boolean);

        if (visualLayers.length > 0) {
          pinnedTl.to(
            visualLayers,
            {
              opacity: 0,
              ease: 'power1.inOut',
              immediateRender: false,
              duration: fadeOutSpan,
            },
            exitStart
          );
        }

        // Brief settled black-navy pause before unpinning to next section
        pinnedTl.to({}, { duration: 0.25 }, fadeOutEnd);

        const totalDuration = pinnedTl.duration();

        // Slowly scroll background rightward across the full pinned timeline
        if (bgWallRef.current) {
          pinnedTl.to(
            bgWallRef.current,
            {
              xPercent: 10,
              ease: 'none',
              immediateRender: false,
              duration: totalDuration,
            },
            0
          );
        }

        // Crimson smoke parallax across the pinned scroll
        if (smoke1Ref.current) {
          pinnedTl.fromTo(
            smoke1Ref.current,
            { xPercent: -8, y: 30 },
            { xPercent: 10, y: -40, ease: 'none', duration: totalDuration },
            0
          );
        }

        if (smoke2Ref.current) {
          pinnedTl.fromTo(
            smoke2Ref.current,
            { xPercent: 8, y: 45 },
            { xPercent: -10, y: -35, ease: 'none', duration: totalDuration },
            0
          );
        }

        if (smoke3Ref.current) {
          pinnedTl.fromTo(
            smoke3Ref.current,
            { xPercent: -5, y: 20 },
            { xPercent: 8, y: -50, ease: 'none', duration: totalDuration },
            0
          );
        }
      }, sectionRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      id="prolog"
      ref={sectionRef}
      className="relative z-30 h-[var(--pinned-stage-height,100dvh)] w-full overflow-hidden text-[#D7D0C3]"
    >
      {/* Solid #0C121B Seal: fades in right as Prolog docks at top: 0 so pinned view fully covers Hero */}
      <div
        ref={topSealRef}
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-[#0C121B] opacity-0 pointer-events-none"
      />

      {/* Confined Parallax Visual Stage with Soft Top Transparency Gradient */}
      <div className="prolog-top-feather absolute inset-0 z-[1] overflow-hidden bg-[#0C121B] pointer-events-none">
        {/* Background: prologue-skull-wall-end-frame.png slowly entering and scrolling right */}
        <div
          ref={bgWallRef}
          aria-hidden="true"
          className="absolute inset-y-0 -left-[18%] w-[132%] z-0 pointer-events-none will-change-[transform,opacity]"
        >
          <img
            src="/assets/aistudio/prologue-skull-wall-end-frame_b5358ad2.webp"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-right mix-blend-lighten brightness-[0.92] contrast-[1.08]"
          />
        </div>

        {/* Black Navy Integration Scrims */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-b from-[#0C121B] via-transparent via-22% to-[#0C121B]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[3] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(12,18,27,0.78)_0%,rgba(12,18,27,0.38)_54%,rgba(12,18,27,0.82)_100%)]"
        />

        {/* Smoke Images Only */}
        <div
          ref={smoke1Ref}
          aria-hidden="true"
          className="absolute right-[4%] top-[16%] w-[70%] md:w-[52%] z-[6] pointer-events-none will-change-transform opacity-60 mix-blend-screen"
        >
          <img
            src="/assets/aistudio/smoke-prolog1_fb53e7b1.webp"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto"
          />
        </div>

        <div
          ref={smoke2Ref}
          aria-hidden="true"
          className="absolute left-[-6%] bottom-[12%] w-[75%] md:w-[54%] z-[7] pointer-events-none will-change-transform opacity-55 mix-blend-screen"
        >
          <img
            src="/assets/aistudio/smoke-prolog2_8e825771.webp"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto"
          />
        </div>

        <div
          ref={smoke3Ref}
          aria-hidden="true"
          className="absolute right-[12%] bottom-[20%] w-[65%] md:w-[46%] z-[8] pointer-events-none will-change-transform opacity-50 mix-blend-screen"
        >
          <img
            src="/assets/aistudio/smoke-prolog3_33ebf60f.webp"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-auto"
          />
        </div>

        <div
          ref={grainRef}
          aria-hidden="true"
          className="cinema-grain absolute -inset-12 z-[10] opacity-25 mix-blend-overlay pointer-events-none"
        />
      </div>

      {/* Centered Editorial Copy (Exact Verbatim Text, Line-by-Line Scroll Reveal) */}
      <div className="relative z-20 h-dvh w-full max-w-[1100px] mx-auto px-6 sm:px-10 pt-20 md:pt-24 pb-8 flex items-center justify-center">
        <div
          ref={textColumnRef}
          className="w-full max-w-[680px] text-center flex flex-col items-center"
        >
          <p
            data-prolog-line
            className="text-xs sm:text-[13px] font-normal tracking-[0.2em] text-[#D7D0C3]/55"
          >
            원효대사 해골물
          </p>

          <h2
            data-prolog-line
            className="mt-2 font-display section-title font-bold tracking-[-0.03em] leading-none text-[#EAE5DC]"
          >
            prolog<span className="text-[#A52A43]">.</span>
          </h2>

          <HanjaArtwork
            artwork="prolog"
            data-prolog-line
            className="drop-shadow-[0_10px_30px_rgba(12,18,27,0.9)]"
          />

          <p
            data-prolog-line
            className="mt-5 md:mt-7 text-lg sm:text-xl md:text-[22px] font-semibold tracking-[-0.015em] text-[#EAE5DC]"
          >
            모든 것은 마음에서 시작된다.
          </p>

          <div className="mt-4 md:mt-5 space-y-1 text-[13px] sm:text-[15px] md:text-[16px] leading-[1.75] text-[#D7D0C3]/90">
            <p data-prolog-line>행복도 불행도 내 마음에서 시작된다.</p>
            <p data-prolog-line>
              그 누구도 날 행복하게 할 수 없고 불행하게도 할 수 없다.
            </p>
          </div>

          <p
            data-prolog-line
            className="mt-4 md:mt-5 text-[13px] sm:text-[15px] md:text-[16px] text-[#9E988C]"
          >
            <del className="line-through decoration-current">
              오직 막걸리만이 날 구원하.....
            </del>
          </p>

          <div className="mt-4 md:mt-5 space-y-1 text-[13px] sm:text-[15px] md:text-[16px] leading-[1.75] text-[#D7D0C3]/85">
            <p data-prolog-line>약간의 성공과 또 약간의 실패 속에서</p>
            <p data-prolog-line>마음이 흔들리고 기분이 우울할 때...</p>
          </div>

          <div className="mt-4 md:mt-5 space-y-1 text-[13px] sm:text-[15px] md:text-[16px] leading-[1.75] text-[#D7D0C3]/85">
            <p data-prolog-line>상황을 반전시키고</p>
            <p data-prolog-line>나를 바꾸며</p>
            <p data-prolog-line>삶을 변화시키는 마법의 주문</p>
          </div>
        </div>
      </div>
    </section>
  );
}
