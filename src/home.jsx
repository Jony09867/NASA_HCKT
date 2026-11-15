import React from 'react';
import { createRoot } from 'react-dom/client';
import BlurText from './components/BlurText';
import ShinyText from './components/ShinyText';
import CircularText from './components/CircularText';
import ScrollReveal from './components/ScrollReveal';
import ParticleSaturn from './components/ParticleSaturn';
import Magnet, { magnetizeAllPageButtons } from './components/Magnet';
import GlassSurface, { glassifyAllPageButtons } from './components/GlassSurface';



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
          <GlassSurface
            width="auto"
            height="auto"
            borderRadius={8}
            backgroundOpacity={0.12}
            distortionScale={-140}
            displace={0.4}
            style={{ display: 'inline-flex' }}
          >
            <a className="button" href="/explore/" style={{ margin: 0 }}>
              Explore investigations
            </a>
          </GlassSurface>
        </Magnet>
        <Magnet
          padding={35}
          magnetStrength={2.2}
          maxOffset={5} tilt={0}
          scale={1}
          spring={{ stiffness: 180, damping: 15, mass: 0.9 }}
        >
          <GlassSurface
            width="auto"
            height="auto"
            borderRadius={8}
            backgroundOpacity={0.1}
            distortionScale={-140}
            displace={0.4}
            style={{ display: 'inline-flex' }}
          >
            <a
              className="button"
              href="/simulator/"
              style={{
                margin: 0,
                background: 'rgba(255, 255, 255, 0.7)',
                borderColor: '#cbd8e8',
                color: '#102b4e',
              }}
            >
              Try the simulator <span>↗</span>
            </a>
          </GlassSurface>
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

  // 7. Footer Back to Top Magnet
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
