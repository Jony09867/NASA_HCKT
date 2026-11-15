import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './MagicBento.css';
import './MagicCard.css';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const THEMES = {
  light: {
    '--mb-surface': 'linear-gradient(180deg, #ffffff 0%, #f5f8fc 100%)',
    '--mb-edge': 'rgba(203, 216, 232, 0.75)',
    '--mb-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-shadow': '0 20px 40px -25px rgba(16, 43, 78, 0.12), 0 6px 16px -10px rgba(16, 43, 78, 0.08)',
    '--mb-ink': '#102b4e',
    '--mb-glow-alpha': 0.75,
    '--mb-spot-alpha': 0.08,
  },
  dark: {
    '--mb-surface': 'linear-gradient(180deg, #1a1820 0%, #121116 100%)',
    '--mb-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-highlight': 'rgba(255, 255, 255, 0.06)',
    '--mb-shadow': '0 24px 48px -28px rgba(0, 0, 0, 0.85), 0 8px 18px -12px rgba(0, 0, 0, 0.6)',
    '--mb-ink': '#f4f4f5',
    '--mb-glow-alpha': 0.85,
    '--mb-spot-alpha': 0.07,
  },
};

const parseRgb = (value) => {
  if (!value) return '22, 79, 145';
  if (value.includes(',')) return value;
  const hex = value.replace('#', '');
  const clean = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return '22, 79, 145';
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
};

/**
 * Universal MagicCard component.
 * Brings React Bits MagicBento dynamic border-glow, cursor spotlight,
 * floating particle specks, and click wave animations to any card element.
 */
export function MagicCard({
  children,
  className = '',
  style = {},
  radius = 24,
  theme = 'light',
  glowColor = '#164f91',
  enableBorderGlow = true,
  enableSpotlight = true,
  enableStars = true,
  spotlightRadius = 320,
  particleCount = 14,
  clickEffect = true,
  onClick,
  tag = 'div',
  ...rest
}) {
  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const glowRgb = useMemo(() => parseRgb(glowColor), [glowColor]);
  const palette = THEMES[theme] || THEMES.light;

  const stateRef = useRef({
    x: -999,
    y: -999,
    hot: 0,
    near: 0,
    stars: 0,
    particles: null,
    wave: { x: 0, y: 0, r: 0, a: 0, active: false, start: 0, duration: 600, maxR: 0 },
  });

  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let raf = null;
    let visible = true;
    let rect = card.getBoundingClientRect();

    const updateRect = () => {
      if (!card) return;
      rect = card.getBoundingClientRect();
      const canvas = canvasRef.current;
      if (canvas && enableStars) {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(rect.width * ratio));
        const h = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }
    };

    updateRect();

    // Initialize particles
    const initParticles = () => {
      const state = stateRef.current;
      if (!state.particles || state.particles.length !== particleCount) {
        state.particles = Array.from({ length: particleCount }, () => ({
          x: Math.random() * (rect.width || 300),
          y: Math.random() * (rect.height || 200),
          vx: (Math.random() - 0.5) * 6,
          vy: -6 - Math.random() * 12,
          size: 0.8 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
          rate: 1 + Math.random() * 3,
        }));
      }
    };
    initParticles();

    let targetHot = 0;
    let targetNear = 0;
    let targetStars = 0;
    let targetX = -999;
    let targetY = -999;

    const onPointerMove = (e) => {
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      const inside = lx >= 0 && lx <= rect.width && ly >= 0 && ly <= rect.height;
      const nearDist = 80;
      const near =
        lx >= -nearDist &&
        lx <= rect.width + nearDist &&
        ly >= -nearDist &&
        ly <= rect.height + nearDist;

      targetX = lx;
      targetY = ly;
      targetHot = inside ? 1 : 0;
      targetNear = near ? 1 : 0;
      targetStars = inside ? 1 : 0;

      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onPointerLeave = () => {
      targetHot = 0;
      targetNear = 0;
      targetStars = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const handleClickWave = (e) => {
      if (!clickEffect) return;
      const lx = e.clientX ? e.clientX - rect.left : rect.width / 2;
      const ly = e.clientY ? e.clientY - rect.top : rect.height / 2;
      const maxR =
        Math.max(
          Math.hypot(lx, ly),
          Math.hypot(rect.width - lx, ly),
          Math.hypot(lx, rect.height - ly),
          Math.hypot(rect.width - lx, rect.height - ly)
        ) + 60;

      stateRef.current.wave = {
        x: lx,
        y: ly,
        r: 0,
        a: 1,
        active: true,
        start: performance.now(),
        duration: 700,
        maxR,
      };
      if (!raf) raf = requestAnimationFrame(loop);
    };

    let lastTime = performance.now();

    const loop = (now) => {
      raf = null;
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
      lastTime = now;

      const state = stateRef.current;
      // Smooth lerp
      state.x += (targetX - state.x) * 0.35;
      state.y += (targetY - state.y) * 0.35;
      state.hot += (targetHot - state.hot) * 0.2;
      state.near += (targetNear - state.near) * 0.2;
      state.stars += (targetStars - state.stars) * 0.15;

      if (state.hot < 0.001 && targetHot === 0) state.hot = 0;
      if (state.near < 0.001 && targetNear === 0) state.near = 0;
      if (state.stars < 0.001 && targetStars === 0) state.stars = 0;

      card.style.setProperty('--mb-x', `${state.x.toFixed(1)}px`);
      card.style.setProperty('--mb-y', `${state.y.toFixed(1)}px`);
      card.style.setProperty('--mb-hot', state.hot.toFixed(3));
      card.style.setProperty('--mb-near', state.near.toFixed(3));

      // Handle Wave
      const wave = state.wave;
      if (wave.active) {
        const elapsed = now - wave.start;
        const progress = Math.min(1, elapsed / wave.duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        wave.r = ease * wave.maxR;
        wave.a = 1 - progress;

        card.style.setProperty('--mb-wx', `${wave.x.toFixed(1)}px`);
        card.style.setProperty('--mb-wy', `${wave.y.toFixed(1)}px`);
        card.style.setProperty('--mb-wr', `${wave.r.toFixed(1)}px`);
        card.style.setProperty('--mb-wa', wave.a.toFixed(3));

        if (progress >= 1) {
          wave.active = false;
          card.style.setProperty('--mb-wa', '0');
        }
      }

      // Handle Canvas Stars
      const canvas = canvasRef.current;
      if (canvas && enableStars) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (state.stars > 0.01 && state.particles) {
            const ratio = canvas.width / Math.max(1, rect.width);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            const reach = spotlightRadius * 0.65;
            const [r, g, b] = glowRgb.split(',').map((n) => Number(n.trim()));

            for (const p of state.particles) {
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              if (p.y < -4) {
                p.y = rect.height + 4;
                p.x = Math.random() * rect.width;
              }
              if (p.x < -4) p.x = rect.width + 4;
              if (p.x > rect.width + 4) p.x = -4;

              const dist = Math.hypot(p.x - state.x, p.y - state.y) / reach;
              if (dist >= 1) continue;
              const falloff = 1 - dist * dist;
              const twinkle = 0.5 + 0.5 * Math.sin(now * 0.002 * p.rate + p.phase);
              const alpha = state.stars * falloff * twinkle;
              if (alpha < 0.01) continue;

              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      const isBusy =
        Math.abs(targetHot - state.hot) > 0.002 ||
        Math.abs(targetNear - state.near) > 0.002 ||
        Math.abs(targetStars - state.stars) > 0.002 ||
        wave.active;

      if (isBusy && visible) {
        raf = requestAnimationFrame(loop);
      }
    };

    const handleScrollOrResize = () => {
      updateRect();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    card.addEventListener('pointerleave', onPointerLeave);
    card.addEventListener('click', handleClickWave);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      card.removeEventListener('pointerleave', onPointerLeave);
      card.removeEventListener('click', handleClickWave);
    };
  }, [spotlightRadius, glowRgb, particleCount, clickEffect, enableStars]);

  const Tag = tag;

  return (
    <Tag
      ref={cardRef}
      className={`magic-card magic-bento__card ${className}`}
      onClick={onClick}
      style={{
        ...palette,
        '--mb-glow-rgb': glowRgb,
        '--mb-radius': `${radius}px`,
        '--mb-spot-size': `${spotlightRadius}px`,
        '--mb-border-size': `${spotlightRadius * 0.85}px`,
        ...style,
      }}
      {...rest}
    >
      {enableSpotlight && <span className="magic-bento__light" aria-hidden="true" />}
      {enableStars && <canvas ref={canvasRef} className="magic-bento__stars" aria-hidden="true" />}
      <div className="magic-card__body">{children}</div>
      <span className="magic-bento__rim" aria-hidden="true" />
      {enableBorderGlow && <span className="magic-bento__border" aria-hidden="true" />}
    </Tag>
  );
}

export default MagicCard;
