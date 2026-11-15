import React from 'react';
import { createRoot } from 'react-dom/client';
import BlurText from './components/BlurText';
import ShinyText from './components/ShinyText';
import CircularText from './components/CircularText';
import ScrollReveal from './components/ScrollReveal';
import ParticleSaturn from './components/ParticleSaturn';
import Magnet, { magnetizeAllPageButtons } from './components/Magnet';
import GlassSurface, { glassifyAllPageButtons } from './components/GlassSurface';
import MagicBento from './components/MagicBento';

const BENTO_EXPLORATION_ITEMS = [
  {
    label: '01 / 3D FLAME LAB',
    title: 'Combustion in Freefall',
    description: 'Explore spherical flame fronts, soot shells, and micro-convection across solid fuels.',
    visual: 'analytics',
    href: '/simulator/',
    colSpan: 1,
    rowSpan: 1,
  },
  {
    label: '02 / EMPIRICAL DATA',
    title: '1,450 NASA PSI Records',
    description: 'Search complete flight tests from BASS-II, SAFFIRE I–III, FLEX, and ACME BRE.',
    visual: 'dashboard',
    href: '/explore/',
    colSpan: 1,
    rowSpan: 1,
  },
  {
    label: '03 / PARALLEL AUDIT',
    title: 'ISS 0g vs Earth 1g Comparison',
    description: 'Expose zero-gravity flammability paradoxes where slow flow sustains fire while Earth upward burns self-extinguish.',
    visual: 'collaboration',
    href: '/compare/',
    colSpan: 2,
    rowSpan: 2,
  },
  {
    label: '04 / DATA INTEGRITY',
    title: '18-Stage Zero-Loss Pipeline',
    description: 'Rigorous automated verification ensures every number traces back to NASA experiment tables without synthetic zeros.',
    visual: 'automation',
    href: '/simulator/',
    colSpan: 2,
    rowSpan: 2,
  },
  {
    label: '05 / MISSION POLICY',
    title: 'Lunar 30% O₂ Flammability Gap',
    description: 'Planned Artemis Lunar Habitat atmosphere (30–34% O₂) sits inside an empirical solid-fuel zero-flight-test gap.',
    visual: 'security',
    href: '/simulator/',
    colSpan: 1,
    rowSpan: 1,
  },
  {
    label: '06 / AI ASSISTANT',
    title: 'Flame-SI Copilot',
    description: 'Natural language research agent cited with NASA TM-20210011385 page numbers and sensor tables.',
    visual: 'integration',
    href: '/chat/',
    colSpan: 1,
    rowSpan: 1,
  },
];



function initReactHome() {
  // 1. Eyebrow ShinyText
  const eyebrowEl = document.getElementById('react-hero-eyebrow');
  if (eyebrowEl) {
    const root = createRoot(eyebrowEl);
    root.render(
      <ShinyText
        text="MICROGRAVITY RESEARCH / 01"
        color="#78b7ff"
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
          padding={35}
          magnetStrength={2.2}
          maxOffset={5} tilt={0}
          scale={1}
          spring={{ stiffness: 180, damping: 15, mass: 0.9 }}
        >
          <a href="/explore/" className="button">
            Explore investigations <span>↗</span>
          </a>
        </Magnet>
        <Magnet
          padding={35}
          magnetStrength={2.2}
          maxOffset={5} tilt={0}
          scale={1}
          spring={{ stiffness: 180, damping: 15, mass: 0.9 }}
        >
          <a href="/simulator/" className="button secondary">
            Try the simulator <span>↗</span>
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
          color="#416B9A"
        />
        <div className="saturn-wrap">
          <ParticleSaturn
            coreColor="#0B3D91"
            ringColor="#4DA6FF"
            density={14}
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
      
        <a
          href="https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/?tab=details"
          target="_blank"
          rel="noopener noreferrer"
        >
          VIEW THE CHALLENGE ↗
        </a>
      
    );
  }

  // 7. Interactive MagicBento Exploration Grid
  const bentoEl = document.getElementById('react-magic-bento');
  if (bentoEl) {
    const root = createRoot(bentoEl);
    root.render(
      <MagicBento
        columns={4}
        rowHeight={210}
        gap={16}
        radius={24}
        theme="light"
        glowColor="#164f91"
        enableBorderGlow={true}
        enableSpotlight={true}
        spotlightRadius={320}
        enableStars={true}
        particleCount={20}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        items={BENTO_EXPLORATION_ITEMS}
      />
    );
  }

  // 8. Footer Back to Top Magnet
  const backToTopEl = document.getElementById('react-back-to-top');
  if (backToTopEl) {
    const root = createRoot(backToTopEl);
    root.render(
      
        <a href="#top">BACK TO TOP ↑</a>
      
    );
  }

  magnetizeAllPageButtons();
  glassifyAllPageButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReactHome);
} else {
  initReactHome();
}
