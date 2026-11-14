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
        shineColor="#fff1df"
        speed={3}
        delay={3}
        shineWidth={25}
        softness={0.8}
        trigger="loop"
        glow={0}
        followPointer={false}
      />
    );
  }

  // 2. Headline BlurText
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
        delay={120}
        stepDuration={0.35}
        blur={8}
        distance={18}
        loop={false}
        focusOnHover={false}
        as="h1"
      >
        <span className="hero-line">Fire behaves</span>
        <span className="hero-line"><em className="hero-muted">differently</em></span>
        <span className="hero-line">up here<span className="orange">.</span></span>
      </BlurText>
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
          repeat={1}
          ring={false}
          fontWeight={500}
          color="#d7ba9e"
        />
        <div className="saturn-wrap">
          <ParticleSaturn
            coreColor="#ff4d1a"
            ringColor="#ffa24a"
            density={18}
            particleSize={13}
            glow={22}
            tilt={8}
            roll={12}
            spinSpeed={6}
            dragSensitivity={2.2}
            sizePercent={130}
          />
        </div>
      </div>
    );
  }

  // 4. About ScrollReveal
  const aboutEl = document.getElementById('react-about-reveal');
  if (aboutEl) {
    const root = createRoot(aboutEl);
    root.render(
      <ScrollReveal
        mode="enter"
        splitBy="words"
        effect="fade"
        stagger={0.07}
        duration={0.8}
        baseOpacity={0.2}
        baseRotation={0}
        baseOffset={0}
        enableBlur={true}
        blurStrength={3}
        highlightColor=""
        as="h2"
      >
        <span>Better knowledge.</span>
        <em className="hero-muted">Safer exploration.</em>
      </ScrollReveal>
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReactHome);
} else {
  initReactHome();
}
