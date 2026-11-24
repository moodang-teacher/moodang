import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ProjectItem {
  index: string;
  title: string;
}

const PROJECTS: ProjectItem[] = [
  { index: '01', title: 'HDAC 영문 웹 사이트 퍼블리싱' },
  { index: '02', title: '녹십자헬스케어서비스 퍼블리싱' },
  { index: '03', title: '교보어린이헬스케어 디자인/퍼블리싱' },
  { index: '04', title: 'AIMMED REACT2 admin' },
  { index: '05', title: '스마트캐스트 app. 디자인' },
  { index: '06', title: '비법닷컴 기획/디자인/운영' },
  { index: '07', title: '통일부 이산가족 영상편지 기획/디자인' },
  { index: '08', title: '지자체 인터넷방송국 디자인' },
  { index: '09', title: '강남구청 그린파킹 사이트 기획/디자인' },
  { index: '10', title: '강남구청 전자정부 홍보용 애니메이션' },
  { index: '11', title: '강남구청 인터넷수능방송 홍보 사이트 기획/디자인' },
  { index: '12', title: 'SK텔레콤 모바일 전용영화관 디자인' },
  { index: '13', title: '오라클 온라인 세미나 디자인' },
  { index: '14', title: '컴팩 e-Korea 애니메이션' },
  { index: '15', title: '인터넷방송국 채티비 웹 사이트 기획/디자인' },
];

const MARQUEE_ROWS: Array<{
  items: ProjectItem[];
  duration: number;
  emphasisOdd: boolean;
}> = [
  { items: PROJECTS.slice(0, 5), duration: 34, emphasisOdd: false },
  { items: PROJECTS.slice(5, 10), duration: 42, emphasisOdd: true },
  { items: PROJECTS.slice(10, 15), duration: 37, emphasisOdd: false },
];

export default function WorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const marqueeStageRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const headerEl = headerRef.current;
    const stageEl = marqueeStageRef.current;
    if (!sectionEl || !headerEl || !stageEl) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const headerReveal = headerEl.querySelectorAll('[data-works-reveal]');
        const trackTweens: gsap.core.Tween[] = [];
        const hoverCleanups: Array<() => void> = [];

        if (headerReveal.length > 0) {
          gsap.fromTo(
            headerReveal,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: sectionEl,
                start: 'top 76%',
                toggleActions: 'play none none reverse',
                refreshPriority: 30,
              },
            }
          );
        }

        gsap.fromTo(
          stageEl,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionEl,
              start: 'top 72%',
              toggleActions: 'play none none reverse',
              refreshPriority: 30,
            },
          }
        );

        // Seamless right-to-left continuous marquee per tilted row
        trackRefs.current.forEach((trackEl, rowIdx) => {
          if (!trackEl) return;
          const baseDuration = MARQUEE_ROWS[rowIdx]?.duration ?? 36;
          gsap.set(trackEl, { xPercent: 0 });

          const tween = gsap.to(trackEl, {
            xPercent: -50,
            duration: baseDuration,
            ease: 'none',
            repeat: -1,
          });
          trackTweens.push(tween);

          const onEnter = () => {
            gsap.to(tween, { timeScale: 0.25, duration: 0.4, ease: 'power2.out' });
          };
          const onLeave = () => {
            gsap.to(tween, { timeScale: 1, duration: 0.5, ease: 'power2.out' });
          };

          trackEl.addEventListener('mouseenter', onEnter);
          trackEl.addEventListener('mouseleave', onLeave);
          hoverCleanups.push(() => {
            trackEl.removeEventListener('mouseenter', onEnter);
            trackEl.removeEventListener('mouseleave', onLeave);
          });
        });

        // Scroll momentum gently accelerates the R->L stream while scrolling through Works
        let velocityDecay: gsap.core.Tween | undefined;
        const velocityProxy = { boost: 1 };

        const applyBoost = () => {
          trackTweens.forEach((tween) => {
            tween.timeScale(velocityProxy.boost);
          });
        };

        const scrollBoostTrigger = ScrollTrigger.create({
          trigger: sectionEl,
          start: 'top bottom',
          end: 'bottom top',
          refreshPriority: 30,
          onUpdate: (self) => {
            const absVelocity = Math.min(2600, Math.abs(self.getVelocity()));
            if (absVelocity < 35) return;

            const targetBoost = 1 + (absVelocity / 2600) * 2.8;
            velocityDecay?.kill();
            velocityProxy.boost = Math.max(velocityProxy.boost, targetBoost);
            applyBoost();

            velocityDecay = gsap.to(velocityProxy, {
              boost: 1,
              duration: 0.75,
              ease: 'power3.out',
              onUpdate: applyBoost,
            });
          },
        });

        return () => {
          velocityDecay?.kill();
          scrollBoostTrigger.kill();
          hoverCleanups.forEach((fn) => fn());
          trackTweens.forEach((t) => t.kill());
        };
      }, sectionEl);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      id="works"
      ref={sectionRef}
      aria-label="My Works"
      className="relative z-20 min-h-[100dvh] w-full overflow-hidden bg-[#0C121B] text-[#D7D0C3] pt-28 pb-28 md:pt-36 md:pb-36 flex flex-col justify-center"
    >
      {/* Subtle Atmospheric Mood Wash & 35mm Grain */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_18%,rgba(165,42,67,0.1)_0%,transparent_54%),radial-gradient(ellipse_at_50%_88%,rgba(215,208,195,0.04)_0%,transparent_56%)]"
      />
      <div
        aria-hidden="true"
        className="cinema-grain absolute -inset-12 z-[1] opacity-25 mix-blend-overlay pointer-events-none"
      />

      {/* Section Header */}
      <div
        ref={headerRef}
        className="relative z-10 w-full max-w-[1160px] mx-auto px-6 sm:px-10 text-center mb-10 md:mb-14"
      >
        <p
          data-works-reveal
          className="text-xs sm:text-[13px] font-normal tracking-[0.2em] text-[#D7D0C3]/55"
        >
          실무에서 쌓아온 기록
        </p>
        <h2
          data-works-reveal
          className="mt-2 font-display text-[clamp(2.2rem,4.4vw,3.65rem)] font-bold tracking-[-0.03em] leading-none text-[#EAE5DC]"
        >
          my works<span className="text-[#A52A43]">.</span>
        </h2>
        <p
          data-works-reveal
          className="mt-6 font-brush text-[8.5vw] sm:text-[6vw] md:text-[clamp(2.75rem,4.6vw,6.25rem)] font-normal tracking-[0.08em] leading-none whitespace-nowrap text-[#A52A43] drop-shadow-[0_10px_30px_rgba(12,18,27,0.9)]"
        >
          實戰記錄
        </p>
      </div>

      {/* Right-Tilted Diagonal Marquee Streams (Right -> Left) */}
      <div
        ref={marqueeStageRef}
        className="relative z-10 w-full overflow-hidden py-10 md:py-14 motion-reduce:hidden"
      >
        {/* Left & Right Black-Navy Edge Vignettes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 sm:w-28 md:w-40 bg-gradient-to-r from-[#0C121B] via-[#0C121B]/75 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 sm:w-28 md:w-40 bg-gradient-to-l from-[#0C121B] via-[#0C121B]/75 to-transparent"
        />

        {/* Tilted Stage (slight clockwise tilt toward the right) */}
        <div className="-mx-[14vw] rotate-[4.2deg] space-y-6 sm:space-y-8 md:space-y-10 select-none">
          {MARQUEE_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="w-full overflow-hidden">
              <div
                ref={(el) => {
                  trackRefs.current[rowIdx] = el;
                }}
                className="flex w-max items-baseline will-change-transform"
              >
                {[0, 1].map((dupIndex) => (
                  <ul
                    key={dupIndex}
                    aria-hidden={dupIndex === 1}
                    className="flex shrink-0 items-baseline"
                  >
                    {row.items.map((project, itemIdx) => {
                      const isBright = row.emphasisOdd
                        ? itemIdx % 2 === 1
                        : itemIdx % 2 === 0;
                      return (
                        <li
                          key={`${dupIndex}-${project.index}`}
                          className="group inline-flex shrink-0 items-baseline pr-8 sm:pr-12 md:pr-14"
                        >
                          <span className="mr-2.5 sm:mr-3 font-display text-xs sm:text-sm font-medium tabular-nums tracking-[0.06em] text-[#A52A43]/85">
                            {project.index}
                          </span>
                          <span
                            className={`whitespace-nowrap font-bold tracking-[-0.025em] leading-[1.15] text-[clamp(1.45rem,3.1vw,3.1rem)] transition-colors duration-200 group-hover:text-[#EAE5DC] ${
                              isBright ? 'text-[#EAE5DC]' : 'text-[#D7D0C3]/65'
                            }`}
                          >
                            {project.title}
                          </span>
                          <span
                            aria-hidden="true"
                            className="ml-8 sm:ml-12 md:ml-14 font-display text-lg sm:text-2xl font-light text-[#A52A43]/55"
                          >
                            /
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reduced-Motion Accessible List Fallback */}
      <div className="hidden motion-reduce:block relative z-10 w-full max-w-[1040px] mx-auto px-6 sm:px-10">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          {PROJECTS.map((project) => (
            <li key={project.index} className="flex items-baseline gap-3">
              <span className="font-display text-xs font-medium tabular-nums text-[#A52A43]">
                {project.index}
              </span>
              <span className="text-sm sm:text-base font-medium text-[#EAE5DC]">
                {project.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
