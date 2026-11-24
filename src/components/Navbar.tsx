import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Menu, X } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
}

const LEFT_NAV_ITEMS: NavItem[] = [
  { id: 'prolog', label: 'prolog' },
  { id: 'about', label: 'about me' },
  { id: 'works', label: 'my works' },
];

const RIGHT_NAV_ITEMS: NavItem[] = [
  { id: 'portfolio', label: 'portfolio' },
  { id: 'epilogue', label: 'epilogue' },
  { id: 'contact', label: 'contact' },
];

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

function SealMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 370 350"
      width="38"
      height="36"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0 text-[#A52A43]"
    >
      <g id="moodang-teacher" data-name="moodang-teacher">
        <g id="moodang" data-name="moodang">
          <path d="M292 188.62h-91V147h-32.26v41.62H62.65V283H92v-74.59h185.65V283H307v-94.38h-15z" />
          <path d="M0 0v350h370V0zm168.74 30v58H201V30h139v71.84l-62.71-36.2-93.29 53-93.29-53L30 100.69V30zM201 320v-33h29.6v-7.61H201v-15.3h59.46v-43.84H108.69v43.84h60.05v15.3h-30.19V287h30.19v33H30V123.55l61.2-35.29L150.74 120h-49.59v6h165.7v-6h-49.59l59.54-31.74L340 124.7V320zm-77.24-71v-13.7h121.63V249z" />
          <path transform="rotate(-81.81 99.5 157.502)" d="M93 121h13v73H93z" />
          <path transform="rotate(-8.19 268.459 157.508)" d="M232 151h73v13h-73z" />
        </g>
      </g>
    </svg>
  );
}

export default function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            delay: 1.95,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        );
      }, headerRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  const handleLinkClick = (id: string) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  const isLightSection = activeSection === 'portfolio';

  const renderLink = (item: NavItem, isMobileDrawer = false) => {
    const isActive = activeSection === item.id;
    const useLightText = isMobileDrawer || !isLightSection;
    return (
      <a
        key={item.id}
        href={`#${item.id}`}
        onClick={(e) => {
          e.preventDefault();
          if (e.detail !== 0) {
            e.currentTarget.blur();
          }
          handleLinkClick(item.id);
        }}
        className={`transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A52A43] ${
          isMobileDrawer ? 'py-3 text-2xl font-display font-semibold tracking-tight' : 'py-1'
        } ${
          isActive
            ? useLightText
              ? 'text-[#EAE5DC]'
              : 'text-[#0C121B]'
            : useLightText
              ? 'text-[#A52A43] hover:text-[#EAE5DC]'
              : 'text-[#A52A43] hover:text-[#0C121B]'
        }`}
      >
        {item.label}
      </a>
    );
  };

  const renderLogoLink = (extraClass = '') => (
    <a
      href="#hero"
      aria-label="히어로 섹션으로 이동"
      onClick={(e) => {
        e.preventDefault();
        if (e.detail !== 0) {
          e.currentTarget.blur();
        }
        handleLinkClick('hero');
      }}
      className={`inline-flex items-center justify-center cursor-pointer transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A52A43] ${extraClass}`}
    >
      <SealMark />
    </a>
  );

  const isDimmed = activeSection !== 'hero';

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 inset-x-0 z-40 pt-6 md:pt-8 pb-4 pointer-events-none"
      >
        <div
          className={`max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 pointer-events-auto transition-opacity duration-300 ${
            isDimmed
              ? isLightSection
                ? 'opacity-80 hover:opacity-100 has-[:focus-visible]:opacity-100'
                : 'opacity-50 hover:opacity-100 has-[:focus-visible]:opacity-100'
              : 'opacity-100'
          }`}
        >
          {/* Desktop (lg+): Symmetrical Left (3) — Center Logo — Right (3) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center gap-10 xl:gap-14 text-sm font-semibold tracking-[0.04em]"
          >
            <div className="flex items-center justify-end gap-8 xl:gap-11">
              {LEFT_NAV_ITEMS.map((item) => renderLink(item))}
            </div>

            {renderLogoLink()}

            <div className="flex items-center justify-start gap-8 xl:gap-11">
              {RIGHT_NAV_ITEMS.map((item) => renderLink(item))}
            </div>
          </nav>

          {/* Tablet & Mobile (< lg): Centered Logo + Right Hamburger Menu */}
          <div className="lg:hidden grid grid-cols-[1fr_auto_1fr] items-center">
            <div aria-hidden="true" />

            {renderLogoLink('justify-self-center')}

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={menuOpen}
              className={`justify-self-end inline-flex items-center justify-center w-11 h-11 rounded-md text-[#A52A43] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A52A43] ${
                isLightSection ? 'hover:text-[#0C121B]' : 'hover:text-[#EAE5DC]'
              }`}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Tablet & Mobile Fullscreen Menu Drawer */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="모바일 내비게이션 메뉴"
          className="lg:hidden fixed inset-0 z-50 bg-[#0C121B]/96 backdrop-blur-md flex flex-col justify-between px-6 sm:px-8 pt-6 md:pt-8 pb-12"
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div aria-hidden="true" />
            {renderLogoLink('justify-self-center')}
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="메뉴 닫기"
              className="justify-self-end inline-flex items-center justify-center w-11 h-11 rounded-md text-[#D7D0C3] hover:text-[#EAE5DC] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A52A43]"
            >
              <X size={24} />
            </button>
          </div>

          <nav
            aria-label="Mobile Navigation"
            className="flex flex-col items-center justify-center gap-2 my-auto"
          >
            {[...LEFT_NAV_ITEMS, ...RIGHT_NAV_ITEMS].map((item) =>
              renderLink(item, true)
            )}
          </nav>

          <div className="h-8" aria-hidden="true" />
        </div>
      )}
    </>
  );
}
