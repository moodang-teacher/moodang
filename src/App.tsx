import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import PrologSection from './components/PrologSection';
import AboutSection from './components/AboutSection';
import WorksSection from './components/WorksSection';
import PortfolioSection from './components/PortfolioSection';
import EpilogueSection from './components/EpilogueSection';
import ContactFooter from './components/ContactFooter';
import SkullTop from './components/SkullTop';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '#prolog',
        start: 'top 45%',
        endTrigger: '[data-about-stage]',
        end: 'top top',
        refreshPriority: -10,
        onEnter: () => setActiveSection('prolog'),
        onLeaveBack: () => setActiveSection('hero'),
        onEnterBack: () => setActiveSection('prolog'),
      });

      ScrollTrigger.create({
        trigger: '[data-about-stage]',
        start: 'top top',
        endTrigger: '#works',
        end: 'top 55%',
        refreshPriority: -10,
        onEnter: () => setActiveSection('about'),
        onLeaveBack: () => setActiveSection('prolog'),
        onEnterBack: () => setActiveSection('about'),
      });

      ScrollTrigger.create({
        trigger: '#works',
        start: 'top 55%',
        endTrigger: '#portfolio',
        end: 'top 55%',
        refreshPriority: -10,
        onEnter: () => setActiveSection('works'),
        onLeaveBack: () => setActiveSection('about'),
        onEnterBack: () => setActiveSection('works'),
      });

      ScrollTrigger.create({
        trigger: '#portfolio',
        start: 'top 55%',
        endTrigger: '#epilogue',
        end: 'top 55%',
        refreshPriority: -10,
        onEnter: () => setActiveSection('portfolio'),
        onLeaveBack: () => setActiveSection('works'),
        onEnterBack: () => setActiveSection('portfolio'),
      });

      ScrollTrigger.create({
        trigger: '#epilogue',
        start: 'top 55%',
        endTrigger: '#contact-trigger',
        end: 'top 65%',
        refreshPriority: -10,
        onEnter: () => setActiveSection('epilogue'),
        onLeaveBack: () => setActiveSection('portfolio'),
        onEnterBack: () => setActiveSection('epilogue'),
      });

      ScrollTrigger.create({
        trigger: '#contact-trigger',
        start: 'top 65%',
        end: 'max',
        refreshPriority: -10,
        onEnter: () => setActiveSection('contact'),
        onLeaveBack: () => setActiveSection('epilogue'),
        onEnterBack: () => setActiveSection('contact'),
      });
    });

    return () => ctx.revert();
  }, []);

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'hero') {
      setActiveSection('hero');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'contact') {
      const anchor = document.getElementById('contact-trigger');
      if (anchor) {
        setActiveSection('contact');
        const bottomY = anchor.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: bottomY, behavior: 'smooth' });
      }
      return;
    }

    const target = document.getElementById(sectionId);
    if (target) {
      setActiveSection(sectionId);
      const pinParent = target.closest('.pin-spacer') ?? target;
      const topY = pinParent.getBoundingClientRect().top + window.scrollY;

      if (sectionId === 'prolog') {
        window.scrollTo({ top: topY + 180, behavior: 'smooth' });
      } else if (sectionId === 'about') {
        window.scrollTo({ top: topY + 20, behavior: 'smooth' });
      } else if (sectionId === 'tears_in_rain') {
        window.scrollTo({ top: topY + 3500, behavior: 'smooth' });
      } else if (sectionId === 'portfolio') {
        window.scrollTo({ top: topY + 10, behavior: 'smooth' });
      } else if (sectionId === 'epilogue') {
        window.scrollTo({ top: topY + 80, behavior: 'smooth' });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0C121B] text-[#D7D0C3]">
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />

      <main className="relative">
        <div className="relative">
          <HeroSection onExplore={() => handleNavigate('prolog')} />
          <PrologSection />
        </div>
        <AboutSection />
        <WorksSection />
        <PortfolioSection />
        <EpilogueSection />
      </main>

      {/* Transparent scroll runway that lifts main upward like a curtain over fixed ContactFooter */}
      <div
        id="contact-trigger"
        aria-hidden="true"
        className="relative z-0 h-[88dvh] w-full pointer-events-none"
      />

      <ContactFooter />

      <SkullTop
        visible={activeSection !== 'hero'}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
