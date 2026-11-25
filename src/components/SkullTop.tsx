import { useEffect, useRef, useState, type MouseEvent } from 'react';
import gsap from 'gsap';

const SKULL_ACTIVE_SRC = '/assets/aistudio/skull-active_da855264.webp';

const MENU_SECTIONS = [
  'prolog',
  'about',
  'works',
  'portfolio',
  'epilogue',
  'contact',
] as const;

interface SkullTopProps {
  visible: boolean;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export default function SkullTop({
  visible,
  activeSection,
  onNavigate,
}: SkullTopProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const bubbleRef = useRef<HTMLParagraphElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isLaunchingRef = useRef(false);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;
  const launchTlRef = useRef<gsap.core.Timeline | null>(null);
  const hoverTweenRef = useRef<gsap.core.Tween | null>(null);

  const pickRandomMenu = () => {
    const candidates = MENU_SECTIONS.filter(
      (id) => id !== activeSectionRef.current
    );
    const pool = candidates.length > 0 ? candidates : MENU_SECTIONS;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  useEffect(() => {
    const btnEl = buttonRef.current;
    const bubbleEl = bubbleRef.current;
    if (!btnEl || !bubbleEl || isLaunchingRef.current) return;

    gsap.killTweensOf(btnEl, 'opacity');

    if (visible) {
      gsap.set(btnEl, { pointerEvents: 'auto' });
      gsap.to(btnEl, {
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out',
      });
    } else {
      gsap.set(btnEl, { pointerEvents: 'none' });
      gsap.to(btnEl, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
      });
      hoverTweenRef.current?.kill();
      gsap.set(bubbleEl, { opacity: 0, right: '2%' });
      setIsPaused(false);
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      launchTlRef.current?.kill();
      hoverTweenRef.current?.kill();
    };
  }, []);

  const showBubble = () => {
    if (isLaunchingRef.current || !visible) return;
    setIsPaused(true);
    if (!bubbleRef.current) return;
    hoverTweenRef.current?.kill();
    hoverTweenRef.current = gsap.to(bubbleRef.current, {
      right: '2.5%',
      opacity: 1,
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  const hideBubble = () => {
    if (!isLaunchingRef.current) {
      setIsPaused(false);
    }
    if (!bubbleRef.current) return;
    hoverTweenRef.current?.kill();
    hoverTweenRef.current = gsap.to(bubbleRef.current, {
      right: '2%',
      opacity: 0,
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.currentTarget.blur();

    const btnEl = buttonRef.current;
    const bubbleEl = bubbleRef.current;
    if (!btnEl || isLaunchingRef.current) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onNavigate(pickRandomMenu());
      return;
    }

    isLaunchingRef.current = true;
    setIsPaused(true);

    if (bubbleEl) {
      hoverTweenRef.current?.kill();
      gsap.to(bubbleEl, {
        right: '2%',
        opacity: 0,
        duration: 0.14,
        ease: 'power2.out',
      });
    }

    launchTlRef.current?.kill();
    const tl = gsap.timeline({
      onComplete: () => {
        isLaunchingRef.current = false;
        setIsPaused(false);
        gsap.set(btnEl, {
          bottom: '10%',
          x: 0,
        });
        if (visibleRef.current) {
          gsap.set(btnEl, { pointerEvents: 'auto' });
          gsap.to(btnEl, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        } else {
          gsap.set(btnEl, { opacity: 0, pointerEvents: 'none' });
        }
      },
    });
    launchTlRef.current = tl;

    // 1. Shake 5 times horizontally (~200ms)
    const shakeOffsets = [-5, 5, -5, 5, -4, 4, -3, 3, -2, 0];
    shakeOffsets.forEach((offsetX) => {
      tl.to(btnEl, {
        x: offsetX,
        duration: 0.02,
        ease: 'none',
      });
    });

    // 2. Rocket upward off the top edge (~220ms)
    tl.to(btnEl, {
      bottom: '105%',
      duration: 0.22,
      ease: 'power2.in',
    });

    // 3. Hide once exited above viewport & trigger smooth scroll to a random menu at ~500ms
    tl.set(btnEl, { opacity: 0, pointerEvents: 'none' });
    tl.call(() => {
      onNavigate(pickRandomMenu());
    }, undefined, 0.5);

    // Wait for smooth scroll completion before resetting resting state
    tl.to({}, { duration: 0.7 });
  };

  return (
    <>
      <p
        ref={bubbleRef}
        aria-hidden="true"
        className="fixed bottom-[calc(10%+12px)] sm:bottom-[calc(10%+15px)] right-[2%] z-[44] opacity-0 pointer-events-none select-none rounded-[20px] bg-[#070B11] py-[9px] pl-[13px] pr-[62px] sm:pr-[68px] text-[11px] font-medium leading-none tracking-[-0.01em] text-[#EAE5DC] shadow-[0_10px_28px_rgba(4,7,12,0.65)] whitespace-nowrap"
      >
        해골이 이끄는 곳으로!
      </p>

      <a
        ref={buttonRef}
        href="#prolog"
        aria-label="랜덤 메뉴로 이동"
        onClick={handleClick}
        onMouseEnter={showBubble}
        onMouseLeave={hideBubble}
        onFocus={showBubble}
        onBlur={hideBubble}
        className="fixed bottom-[10%] right-[2.5%] z-[45] block w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] opacity-0 pointer-events-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A52A43] rounded-full"
      >
        <img
          src={SKULL_ACTIVE_SRC}
          alt=""
          draggable={false}
          referrerPolicy="no-referrer"
          className="skull-spin w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_8px_18px_rgba(4,7,12,0.55)]"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        />
      </a>
    </>
  );
}
