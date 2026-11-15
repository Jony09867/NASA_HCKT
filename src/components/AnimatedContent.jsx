'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// One observer for all entrances: filters, fonts and React islands can move
// sections after ScrollTrigger has measured their initial positions.
let layoutUsers = 0;
let layoutObserver;
let refreshFrame = 0;
function observeLayout() {
  if (layoutUsers++ === 0 && typeof ResizeObserver !== 'undefined') {
    layoutObserver = new ResizeObserver(() => {
      if (!refreshFrame) refreshFrame = requestAnimationFrame(() => {
        refreshFrame = 0;
        ScrollTrigger.refresh();
      });
    });
    layoutObserver.observe(document.body);
  }
  return () => {
    if (--layoutUsers === 0) {
      layoutObserver?.disconnect();
      layoutObserver = undefined;
      cancelAnimationFrame(refreshFrame);
      refreshFrame = 0;
    }
  };
}

const WIPES = {
  up: 'linear-gradient(to top, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  down: 'linear-gradient(to bottom, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  left: 'linear-gradient(to left, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  right: 'linear-gradient(to right, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))',
  center:
    'radial-gradient(farthest-corner at 50% 50%, #000 calc(var(--ac-wipe) * 140% - 40%), transparent calc(var(--ac-wipe) * 140%))'
};

const AnimatedContent = ({
  children,
  targetElement,
  animateKey,
  container,
  distance = 0,
  direction = 'vertical',
  reverse = false,
  duration = 0.2,
  ease = 'power2.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  blur = 0,
  rotate = 0,
  tilt = 0,
  wipe = 'none',
  threshold = 0.08,
  delay = 0,
  stagger = 0,
  staggerFrom = 'start',
  trigger = 'scroll',
  once = true,
  scrub = false,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power3.in',
  onStart,
  onComplete,
  onDisappearanceComplete,
  className = '',
  style,
  ...props
}) => {
  const ref = useRef(null);
  const callbacksRef = useRef({ onStart, onComplete, onDisappearanceComplete });
  callbacksRef.current = { onStart, onComplete, onDisappearanceComplete };

  useIsomorphicLayoutEffect(() => {
    const el = targetElement || ref.current;
    if (!el) return undefined;

    let scroller = container || document.getElementById('snap-main-container') || null;
    if (typeof scroller === 'string') scroller = document.querySelector(scroller);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const stopObservingLayout = trigger === 'scroll' && !reduce ? observeLayout() : () => {};
    let entrance;
    const ctx = gsap.context(() => {
      const targets = stagger > 0 && el.children.length ? Array.from(el.children) : [el];
      const horizontal = direction === 'horizontal';
      const axis = horizontal ? 'x' : 'y';
      const sign = reverse ? -1 : 1;
      const mask = WIPES[wipe];

      gsap.set(el, { visibility: 'visible' });

      if (reduce) {
        callbacksRef.current.onComplete?.();
        return;
      }

      const from = {
        [axis]: distance * sign,
        scale,
        opacity: animateOpacity ? initialOpacity : 1
      };
      const to = {
        [axis]: 0,
        scale: 1,
        opacity: 1,
        duration,
        ease
      };

      if (blur > 0) {
        from.filter = `blur(${blur}px)`;
        to.filter = 'blur(0px)';
      }
      if (rotate) {
        from.rotation = rotate * sign;
        to.rotation = 0;
      }
      if (tilt) {
        const tiltAxis = horizontal ? 'rotationY' : 'rotationX';
        from[tiltAxis] = horizontal ? -tilt * sign : tilt * sign;
        to[tiltAxis] = 0;
        from.transformPerspective = 900;
        to.transformPerspective = 900;
      }
      if (mask) {
        gsap.set(targets, { maskImage: mask, webkitMaskImage: mask });
        from['--ac-wipe'] = 0;
        to['--ac-wipe'] = 1;
      }
      if (stagger > 0) to.stagger = { each: stagger, from: staggerFrom };

      const settle = () => {
        if (scrub) return;
        gsap.set(targets, { clearProps: mask ? 'filter,transform,maskImage,webkitMaskImage' : 'filter,transform' });
      };

      const disappear = () => {
        if (disappearAfter <= 0) return;
        const out = {
          [axis]: -distance * sign,
          scale: 0.8,
          opacity: animateOpacity ? initialOpacity : 0,
          delay: disappearAfter,
          duration: disappearDuration,
          ease: disappearEase,
          onComplete: () => callbacksRef.current.onDisappearanceComplete?.()
        };
        if (blur > 0) out.filter = `blur(${blur}px)`;
        if (stagger > 0) out.stagger = { each: stagger, from: staggerFrom };
        gsap.to(targets, out);
      };

      const tl = gsap.timeline({
        paused: true,
        onStart: () => callbacksRef.current.onStart?.(),
        onComplete: () => {
          callbacksRef.current.onComplete?.();
          settle();
          if (once && !scrub) disappear();
        }
      });
      entrance = tl;
      tl.fromTo(targets, from, to, scrub ? 0 : Math.max(delay, 0));

      if (trigger === 'mount') {
        tl.play();
        return;
      }

      const start = `top ${(1 - threshold) * 100}%`;

      if (scrub) {
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start,
          end: `top ${Math.max((1 - threshold) * 100 - 45, 5)}%`,
          scrub: scrub === true ? true : Math.max(Number(scrub) || 0, 0.01),
          animation: tl
        });
        return;
      }

      ScrollTrigger.create({
        trigger: el,
        scroller,
        start,
        once,
        onEnter: () => tl.play(),
        onEnterBack: () => tl.play(),
        onLeaveBack: once
          ? undefined
          : () => {
              if (mask) gsap.set(targets, { maskImage: mask, webkitMaskImage: mask });
              tl.reverse();
            }
      });
    }, el);

    // Keyboard navigation must never land on a still-hidden control.
    const revealOnFocus = () => entrance?.progress(1);
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopMotion = () => { if (motionPreference.matches) ctx.revert(); };
    el.addEventListener('focusin', revealOnFocus);
    motionPreference.addEventListener('change', stopMotion);
    return () => {
      el.removeEventListener('focusin', revealOnFocus);
      motionPreference.removeEventListener('change', stopMotion);
      stopObservingLayout();
      ctx.revert();
    };
  }, [
    targetElement,
    animateKey,
    container,
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    blur,
    rotate,
    tilt,
    wipe,
    threshold,
    delay,
    stagger,
    staggerFrom,
    trigger,
    once,
    scrub,
    disappearAfter,
    disappearDuration,
    disappearEase
  ]);

  if (targetElement) return null;

  return (
    <div ref={ref} className={className} style={style} {...props}>
      {children}
    </div>
  );
};

export default AnimatedContent;

