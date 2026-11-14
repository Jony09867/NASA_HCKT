import React from 'react';
import { createRoot } from 'react-dom/client';
import BlurText from './components/BlurText';
import ShinyText from './components/ShinyText';
import CircularText from './components/CircularText';
import ScrollReveal from './components/ScrollReveal';
import ParticleSaturn from './components/ParticleSaturn';
import Magnet, { magnetizeAllPageButtons } from './components/Magnet';
import SIDashboard from './components/SIDashboard';
import AnimatedContent from './components/AnimatedContent';

function initReactHome() {
  // 1. Eyebrow ShinyText
  const eyebrowEl = document.getElementById('react-hero-eyebrow');
  if (eyebrowEl) {
    const root = createRoot(eyebrowEl);
    root.render(
      <ShinyText
        text="MICROGRAVITY RESEARCH / 01"
        color="#ff8a58"
        shineColor="#ffffff"
        speed={2.5}
        shineWidth={35}
        softness={0.8}
        trigger="loop"
      />
    );
  }

  // 2. Headline BlurText (Word-by-word staggered reveal)
  const headlineEl = document.getElementById('react-hero-headline');
  if (headlineEl) {
    const root = createRoot(headlineEl);
    root.render(
      <BlurText
        effect="blur"
        animateBy="words"
        direction="bottom"
        staggerFrom="start"
        trigger="load"
        delay={150}
        stepDuration={0.4}
        blur={12}
        distance={22}
        loop={false}
        as="h1"
      />
    );
  }

  // 3. Hero CTA Magnet Button
  const heroCtaEl = document.getElementById('react-hero-cta');
  if (heroCtaEl) {
    const root = createRoot(heroCtaEl);
    root.render(
      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Magnet
          padding={90}
          magnetStrength={2.2}
          tilt={6}
          scale={1.03}
          spring={{ stiffness: 180, damping: 15, mass: 0.9 }}
        >
          <a className="button" href="#si-intelligence">
            SI Safety Dashboard
          </a>
        </Magnet>
        <Magnet
          padding={90}
          magnetStrength={2.2}
          tilt={6}
          scale={1.03}
          spring={{ stiffness: 180, damping: 15, mass: 0.9 }}
        >
          <a
            className="button"
            href="#explore"
            style={{
              background: 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.18)',
              color: '#d7ba9e',
            }}
          >
            Explore Library <span>↗</span>
          </a>
        </Magnet>
      </div>
    );
  }

  // 4. Hero 3D Particle Art + CircularText
  const artEl = document.getElementById('react-hero-art');
  if (artEl) {
    const root = createRoot(artEl);
    root.render(
      <div className="art-3d-stage">
        <CircularText
          text="MICROGRAVITY · COMBUSTION · RESEARCH · "
          direction="clockwise"
          spinDuration={40}
          onHover="pause"
          draggable={false}
          hoverTilt={0}
          fill={true}
          repeat={2}
          ring={false}
          fontWeight={500}
          color="#d7ba9e"
        />
        <div className="saturn-wrap">
          <ParticleSaturn
            coreColor="#ff4414"
            ringColor="#ffa855"
            density={20}
            particleSize={15}
            glow={26}
            tilt={8}
            roll={12}
            spinSpeed={5}
            dragSensitivity={2.2}
            sizePercent={165}
          />
        </div>
      </div>
    );
  }

  // 4b. SI Fire Safety Intelligence Dashboard
  const siDashboardEl = document.getElementById('react-si-dashboard');
  if (siDashboardEl) {
    const root = createRoot(siDashboardEl);
    root.render(<SIDashboard />);
  }

  // 5. About ScrollReveal (Word-by-word rotation & unblur on scroll)
  const aboutEl = document.getElementById('react-about-reveal');
  if (aboutEl) {
    const root = createRoot(aboutEl);
    root.render(
      <ScrollReveal
        mode="enter"
        splitBy="words"
        effect="fade"
        stagger={0.08}
        duration={0.8}
        baseOpacity={0.15}
        baseRotation={2}
        baseOffset={10}
        enableBlur={true}
        blurStrength={4}
        as="h2"
      />
    );
  }

  // 6. About Challenge Magnet Link
  const aboutCtaEl = document.getElementById('react-about-cta');
  if (aboutCtaEl) {
    const root = createRoot(aboutCtaEl);
    root.render(
      <Magnet
        padding={70}
        magnetStrength={2.5}
        tilt={5}
        scale={1.04}
        spring={{ stiffness: 180, damping: 15, mass: 0.9 }}
      >
        <a
          href="https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/?tab=details"
          target="_blank"
          rel="noopener noreferrer"
        >
          VIEW THE CHALLENGE ↗
        </a>
      </Magnet>
    );
  }

  // 7. Footer Back to Top Magnet
  const backToTopEl = document.getElementById('react-back-to-top');
  if (backToTopEl) {
    const root = createRoot(backToTopEl);
    root.render(
      <Magnet
        padding={60}
        magnetStrength={2.5}
        tilt={4}
        scale={1.05}
        spring={{ stiffness: 180, damping: 15, mass: 0.9 }}
      >
        <a href="#top">BACK TO TOP ↑</a>
      </Magnet>
    );
  }

  // 8. Global Magnetizer: magnetizes all buttons, nav links, and dynamic cards across the entire page!
  magnetizeAllPageButtons();

  // Animate existing static layout nodes without reparenting the vanilla Explore UI.
  // Text effects and dynamic library cards keep their own existing animations.
  const entranceTargets = document.querySelectorAll(

    '#explore .section-head, #explore .notice, #explore .filters-container, ' +
    '#compare, footer'
  );
  const animationRoot = createRoot(document.createElement('div'));
  animationRoot.render(<>{Array.from(entranceTargets, (element, index) => (
    <AnimatedContent key={index} targetElement={element} />
  ))}</>);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReactHome);
} else {
  initReactHome();
}
