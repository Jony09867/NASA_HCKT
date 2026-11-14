import React from 'react';
import { createRoot } from 'react-dom/client';
import BlurText from './components/BlurText';
import ShinyText from './components/ShinyText';
import CircularText from './components/CircularText';
import ScrollReveal from './components/ScrollReveal';
import ParticleSaturn from './components/ParticleSaturn';

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

  // 3. Hero 3D Particle Art + CircularText
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

  // 4. About ScrollReveal (Word-by-word rotation & unblur on scroll)
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReactHome);
} else {
  initReactHome();
}
