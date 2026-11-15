import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import './CombustionSim3D.css';

export const GRAVITY_REGIMES = {
  '0g': {
    id: '0g',
    shortLabel: '0g',
    subLabel: 'Microgravity',
    gValue: 0.0,
    badge: '0g · ISS / Orbital Freefall',
    physicsSummary:
      'Buoyancy is absent (Gr ≈ 0). Molecular diffusion dominates: oxygen diffuses inward omnidirectionally to form an isotropic spherical reaction shell (NASA ACME s-Flame / FLEX).',
  },
  '1/6g': {
    id: '1/6g',
    shortLabel: '1/6g',
    subLabel: 'Lunar',
    gValue: 0.166,
    badge: '1/6g · Artemis Lunar Base',
    physicsSummary:
      'Weak partial buoyancy stretches the spherical diffusion zone into a hemispherical bell plume. Reduced convective cooling lowers the Limiting Oxygen Index (LOI) and accelerates flame spread.',
  },
  '1g': {
    id: '1g',
    shortLabel: '1g',
    subLabel: 'Earth',
    gValue: 1.0,
    badge: '1g · Terrestrial Baseline',
    physicsSummary:
      'Strong buoyancy-driven natural convection (~0.6–1.2 m/s updraft) pinches the flame base and accelerates hot gases into a tall, flickering laminar/turbulent teardrop plume.',
  },
};

export const FUEL_MATERIALS = {
  pmma: {
    id: 'pmma',
    name: 'PMMA (Plexiglass)',
    shortName: 'PMMA (Plexiglass)',
    geometryLabel: 'Cast Cylindrical Rod (BASS-II)',
    shapeType: 'rod',
    loiEarth: 17.5,
    loiMicro: 15.2,
    baseSpread: 1.0,
    baseTemp: 1040,
    baseBurnTime: 88,
    sootFactor: 0.55,
    sampleColor: '#2b3a42',
    emissiveColor: '#ff6b39',
    experimentRef: 'BASS-II (#922)',
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton Fabric',
    shortName: 'Cotton Fabric',
    geometryLabel: 'Fiberglass-Cotton Composite (Saffire)',
    shapeType: 'slab',
    loiEarth: 18.0,
    loiMicro: 15.8,
    baseSpread: 1.48,
    baseTemp: 1140,
    baseBurnTime: 62,
    sootFactor: 0.72,
    sampleColor: '#3d372e',
    emissiveColor: '#ff8a47',
    experimentRef: 'Saffire-I & III (#1738)',
  },
  silicone: {
    id: 'silicone',
    name: 'Silicone Rubber',
    shortName: 'Silicone Rubber',
    geometryLabel: 'Elastomer Insulation Cylinder',
    shapeType: 'rod',
    loiEarth: 23.5,
    loiMicro: 20.4,
    baseSpread: 0.74,
    baseTemp: 980,
    baseBurnTime: 130,
    sootFactor: 0.85,
    sampleColor: '#452c2a',
    emissiveColor: '#f97316',
    experimentRef: 'ACME: BRE (#7585)',
  },
  nomex: {
    id: 'nomex',
    name: 'Nomex III (NASA)',
    shortName: 'Nomex III (NASA)',
    geometryLabel: 'Meta-Aramid Flame-Retardant Weave',
    shapeType: 'slab',
    loiEarth: 28.5,
    loiMicro: 25.2,
    baseSpread: 0.42,
    baseTemp: 910,
    baseBurnTime: 175,
    sootFactor: 0.35,
    sampleColor: '#3a3628',
    emissiveColor: '#38bdf8',
    experimentRef: 'NASA-STD-6001 / ACME-CFIG',
  },
};

export function computeCombustionPhysics({
  gravityKey = '0g',
  materialKey = 'pmma',
  oxygen = 34,
  ventilation = 0.1,
  pressure = 4.3,
}) {
  const grav = GRAVITY_REGIMES[gravityKey] || GRAVITY_REGIMES['0g'];
  const mat = FUEL_MATERIALS[materialKey] || FUEL_MATERIALS.pmma;

  const gFactor = grav.gValue;
  const effectiveLOI =
    mat.loiMicro +
    (mat.loiEarth - mat.loiMicro) * Math.pow(gFactor, 0.45) -
    (pressure - 10.2) * 0.12;

  const pO2 = (oxygen / 100) * pressure;
  const earthPO2 = 3.087;
  const pO2Ratio = pO2 / earthPO2;
  const o2Margin = oxygen - effectiveLOI;

  const isCoolFlame =
    gravityKey === '0g' &&
    oxygen >= effectiveLOI - 3.2 &&
    oxygen < effectiveLOI + 1.2 &&
    ventilation < 0.09;
  const isExtinguished =
    oxygen < effectiveLOI - 3.2 ||
    (gravityKey === '0g' && ventilation < 0.012 && oxygen < 17.5);

  const forcedFlowBoost =
    ventilation <= 0.3
      ? 1 + ventilation * 2.5
      : Math.max(0.55, 1 + 0.3 * 2.5 - (ventilation - 0.3) * 1.45);

  const o2Multiplier = Math.max(0.15, Math.pow(Math.max(10, oxygen) / 21, 1.52));
  const pressureMultiplier = Math.pow(Math.max(3.5, pressure) / 10.2, 0.28);
  const gravitySpreadFactor =
    gravityKey === '0g' ? 0.76 : gravityKey === '1/6g' ? 1.16 : 1.0;

  const rawSpread = isExtinguished
    ? 0
    : isCoolFlame
    ? 0.16
    : mat.baseSpread * o2Multiplier * pressureMultiplier * forcedFlowBoost * gravitySpreadFactor;

  const spreadRate = Number(rawSpread.toFixed(2));

  let flameTemp = 300;
  if (!isExtinguished) {
    if (isCoolFlame) {
      flameTemp = Math.round(640 + (oxygen - 12) * 18);
    } else {
      const baseT = mat.baseTemp;
      const o2TempBoost = (oxygen - 34) * 9.5;
      const flowTempBoost = (ventilation - 0.1) * 380;
      const gravTempBoost = gravityKey === '1g' ? 310 : gravityKey === '1/6g' ? 120 : 0;
      flameTemp = Math.min(
        2480,
        Math.max(720, Math.round(baseT + o2TempBoost + flowTempBoost + gravTempBoost))
      );
    }
  }

  const burnTime = isExtinguished
    ? 0
    : Math.max(12, Math.min(240, Math.round((mat.baseBurnTime * 1.36) / Math.max(0.35, spreadRate))));

  let ventilationRegime = 'Quiescent';
  if (ventilation >= 0.32) ventilationRegime = 'High Forced Flow';
  else if (ventilation >= 0.14) ventilationRegime = 'Forced Convection';
  else if (ventilation >= 0.06) ventilationRegime = 'Low Laminar Drift';

  // Only trigger flashover warning when forced convection is genuinely active (>= 0.14 m/s)
  const flashoverWarning = !isExtinguished && ventilation >= 0.14 && oxygen >= 19;

  const sootClusterScale =
    gravityKey === '0g'
      ? Math.max(2.4, 9.2 - ventilation * 10)
      : gravityKey === '1/6g'
      ? Math.max(1.8, 5.1 - ventilation * 6)
      : 1.0;

  // Dynamic Hazard Score (0 - 100) for situational report
  const hazardScore = isExtinguished
    ? 12
    : Math.min(
        99,
        Math.max(
          22,
          Math.round(
            oxygen * 0.42 +
              pO2Ratio * 22 +
              spreadRate * 14 +
              (flashoverWarning ? 15 : 0) +
              (isCoolFlame ? 18 : 0)
          )
        )
      );

  let regimeTitle = '3D SPHERICAL DIFFUSION FLAME';
  let regimeCode = 'SPHERICAL_0G';
  if (isExtinguished) {
    regimeTitle = 'QUENCHED / BELOW LOI LIMIT';
    regimeCode = 'EXTINGUISHED';
  } else if (isCoolFlame) {
    regimeTitle = 'FLEX COOL-FLAME REGIME (600–800 K)';
    regimeCode = 'COOL_FLAME';
  } else if (gravityKey === '1g') {
    regimeTitle =
      ventilation >= 0.14
        ? '3D BUOYANT TEARDROP PLUME (VENTILATED)'
        : '3D BUOYANT TEARDROP PLUME';
    regimeCode = 'EARTH_TEARDROP';
  } else if (gravityKey === '1/6g') {
    regimeTitle =
      ventilation >= 0.14
        ? '3D LUNAR PARTIAL-BUOYANCY PLUME (VENTILATED)'
        : '3D LUNAR PARTIAL-BUOYANCY PLUME';
    regimeCode = 'LUNAR_PLUME';
  } else if (ventilation >= 0.14) {
    regimeTitle = '3D FORCED-CONVECTION DRIFT FLAME (0g)';
    regimeCode = 'FORCED_WAKE';
  } else {
    regimeTitle = '3D SPHERICAL DIFFUSION FLAME';
    regimeCode = 'SPHERICAL_0G';
  }

  // Radar metrics (0-100) for multi-axis situational assessment
  const radarMetrics = {
    ignitionRisk: Math.min(100, Math.round((oxygen / 100) * 75 + pO2Ratio * 20)),
    spreadVelocity: Math.min(100, Math.round((spreadRate / 4.5) * 100)),
    sootObscuration: Math.min(100, Math.round(mat.sootFactor * 60 + sootClusterScale * 4.2)),
    flashoverHazard: Math.min(
      100,
      Math.round(ventilation * 145 + (oxygen > 30 ? 35 : 10) + (gravityKey !== '1g' ? 15 : 0))
    ),
    suppressionDifficulty: Math.min(
      100,
      Math.round((o2Margin > 15 ? 55 : 25) + (isCoolFlame ? 40 : 0) + ventilation * 65)
    ),
  };

  return {
    spreadRate,
    flameTemp,
    burnTime,
    pO2: Number(pO2.toFixed(2)),
    pO2Ratio: Number(pO2Ratio.toFixed(2)),
    effectiveLOI: Number(effectiveLOI.toFixed(1)),
    o2Margin: Number(o2Margin.toFixed(1)),
    isCoolFlame,
    isExtinguished,
    flashoverWarning,
    ventilationRegime,
    sootClusterScale: Number(sootClusterScale.toFixed(1)),
    hazardScore,
    regimeTitle,
    regimeCode,
    radarMetrics,
  };
}

/* ============================================================================
   1. Volumetric Multi-Shell GLSL Shaders (100% WebGL Standards-Compliant)
   ============================================================================ */

const VOLUMETRIC_FLAME_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uGravity;
  uniform float uAirflow;
  uniform float uOxygen;
  uniform float uShellIndex;
  uniform float uCoolFlame;

  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;
  varying float vHeat;
  varying float vNoise;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash3(i + vec3(0.0, 0.0, 0.0)), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise3(p);
      p = p * 2.04 + vec3(1.7, 3.2, 2.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 pos = position;
    vLocalPos = position;

    float o2Norm = clamp((uOxygen - 14.0) / 86.0, 0.0, 1.0);
    float buoyancy = pow(clamp(uGravity, 0.0, 1.0), 0.44);
    float wind = clamp((uAirflow - 0.04) / 0.45, 0.0, 1.35);

    // Smooth, gentle laminar advection (no high-frequency jitter)
    vec3 advect = vec3(
      uTime * (0.22 + wind * 1.3),
      uTime * (0.28 + buoyancy * 1.6),
      uTime * 0.12
    );
    float n = fbm(pos * 2.1 - advect);
    float turb = n - 0.48;
    vNoise = n;

    // Shell radius scaling (inner hot core -> middle reaction sheet -> outer thermal halo)
    float shellScale = 0.70 + uShellIndex * 0.18 + o2Norm * 0.16;
    if (uCoolFlame > 0.5) {
      shellScale = 0.64 + uShellIndex * 0.14 + 0.03 * sin(uTime * 2.2);
    }
    pos *= shellScale;

    // Buoyant vertical teardrop elongation (1/6g Lunar & 1g Earth)
    // Hot gases rise upwards (+Y) from the candle tip, forming an authentic upward-pointing flame!
    float upperMask = smoothstep(-0.40, 0.80, vLocalPos.y);
    if (buoyancy > 0.01) {
      float stretchY = 1.0 + buoyancy * (1.45 + o2Norm * 0.40) * upperMask;
      pos.y *= stretchY;
      pos.y += buoyancy * 0.30 * upperMask;

      // Candle teardrop taper: width narrows smoothly towards the apex tip at the top (+Y)
      float apexTaper = clamp(1.0 - (vLocalPos.y + 0.25) * 0.72, 0.08, 1.0);
      float coneTaper = mix(1.0, apexTaper, buoyancy * upperMask);
      float baseNeck = 1.0 - buoyancy * 0.18 * exp(-pow((vLocalPos.y + 0.45) * 2.8, 2.0));
      pos.x *= coneTaper * baseNeck;
      pos.z *= coneTaper * baseNeck;
    }

    // Cross-ventilation airflow deflection (Tilt):
    // Airflow blowing along +X tilts the vertical flame downstream.
    // The base stays anchored at the candle wick; the rising flame leans with the breeze.
    // The flame tip ALWAYS points UPWARDS (+Y), leaning gracefully downstream!
    if (wind > 0.01) {
      float heightFromWick = max(0.0, pos.y + 0.35);
      float tilt = wind * (0.32 + o2Norm * 0.12);
      pos.x += heightFromWick * tilt;
      pos.y -= tilt * 0.08 * max(0.0, pos.x);

      // In 0g microgravity (no buoyancy), airflow gently drifts the rounded diffusion sphere downstream
      if (buoyancy < 0.01) {
        pos.x += wind * 0.30;
        pos.x *= (1.0 + wind * 0.12);
      }
    }

    // Organic living flame motion: only activates with buoyancy or forced airflow!
    // In 0g quiescent microgravity, the spherical diffusion flame is calm and stationary.
    float dispAmp = (buoyancy * 0.065 + wind * 0.06) * (0.2 + 0.8 * upperMask);
    pos.x += turb * dispAmp * (1.0 + wind * 1.1);
    pos.y += turb * dispAmp * (1.0 + buoyancy * 1.2);
    pos.z += turb * dispAmp * 0.7;

    vHeat = clamp(0.30 + upperMask * buoyancy * 0.52 + turb * 0.14, 0.0, 1.0);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewPos = -mvPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const VOLUMETRIC_FLAME_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uGravity;
  uniform float uAirflow;
  uniform float uOxygen;
  uniform float uShellIndex;
  uniform float uCoolFlame;
  uniform float uExtinguished;

  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;
  varying float vHeat;
  varying float vNoise;

  void main() {
    if (uExtinguished > 0.5) {
      discard;
    }

    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPos);
    float ndotv = abs(dot(N, V));

    // Soft volumetric glow profile
    float coreGlow = pow(ndotv, 1.35);
    float rimGlow = pow(1.0 - ndotv, 1.8) * smoothstep(0.0, 0.35, ndotv);

    float o2Norm = clamp((uOxygen - 14.0) / 86.0, 0.0, 1.0);
    float buoyancy = pow(clamp(uGravity, 0.0, 1.0), 0.44);
    float wind = clamp((uAirflow - 0.04) / 0.45, 0.0, 1.35);

    // 0g Spherical Diffusion Palette (CH* / OH* Chemiluminescence Blue-Cyan-Violet)
    vec3 diffCore = vec3(0.72, 0.92, 1.00);
    vec3 diffMid  = vec3(0.12, 0.62, 0.96);
    vec3 diffRim  = vec3(0.18, 0.28, 0.88);
    vec3 zeroGCol = mix(diffRim, diffMid, coreGlow);
    zeroGCol = mix(zeroGCol, diffCore, pow(coreGlow, 2.0) * (0.55 + o2Norm * 0.3));

    // Partial/Earth Gravity & Forced Convection Palette (Blue cup -> Deep Orange -> Gold -> White Core)
    vec3 baseCupBlue = vec3(0.14, 0.55, 0.96);
    vec3 outerCrimson = vec3(0.92, 0.24, 0.06);
    vec3 midAmber = vec3(0.98, 0.54, 0.10);
    vec3 innerGold = vec3(1.00, 0.88, 0.42);
    vec3 hotWhite = vec3(0.98, 0.96, 0.90);

    vec3 plumeCol = mix(outerCrimson, midAmber, clamp(vHeat * 0.85 + coreGlow * 0.4, 0.0, 1.0));
    plumeCol = mix(plumeCol, innerGold, pow(coreGlow, 1.5) * (0.6 + o2Norm * 0.28));
    plumeCol = mix(plumeCol, hotWhite, pow(coreGlow, 2.8) * (0.5 + o2Norm * 0.4));

    // Blue base reaction cup at the candle wick
    float cupMask = smoothstep(0.12, -0.55, vLocalPos.y * (0.75 + buoyancy * 0.4) + vLocalPos.x * wind * 0.35);
    plumeCol = mix(plumeCol, baseCupBlue, cupMask * (0.68 - o2Norm * 0.22));

    float radiativeBlend = clamp(buoyancy * 0.88 + wind * 0.78, 0.0, 1.0);
    vec3 color = mix(zeroGCol, plumeCol, radiativeBlend);

    if (uCoolFlame > 0.5) {
      vec3 coolCore = vec3(0.35, 0.80, 0.98);
      vec3 coolHalo = vec3(0.38, 0.22, 0.92);
      color = mix(coolHalo, coolCore, coreGlow);
    }

    // Calibrated multi-shell alpha without over-exposure blowout
    float alpha;
    if (uShellIndex < 0.5) {
      // Inner incandescent core
      alpha = 0.34 * pow(coreGlow, 1.3) + 0.08 * rimGlow;
    } else if (uShellIndex < 1.5) {
      // Primary stoichiometric reaction sheet
      alpha = 0.22 * coreGlow + 0.30 * rimGlow;
    } else {
      // Outer luminescence halo
      alpha = 0.12 * coreGlow + 0.20 * rimGlow;
    }

    if (uCoolFlame > 0.5) {
      alpha *= 0.65 + 0.15 * sin(uTime * 2.2);
    }

    // Clean, luminous output with rich color depth (no 60Hz alpha strobing)
    vec3 outColor = color * (0.95 + o2Norm * 0.22);
    gl_FragColor = vec4(outColor, clamp(alpha, 0.0, 0.85));
  }
`;

/* ============================================================================
   2. GPU-Accelerated 3D Volumetric Fire & Soot Cloud Shader (10,000+ Motes)
      Inspired by ParticleSaturn.jsx for ultra-rich 3D particle density
   ============================================================================ */

const FIRE_CLOUD_VERT = /* glsl */ `
  attribute float aLayer;
  attribute float aSeed;
  attribute float aPhase;
  attribute vec3 aBaseDir;

  uniform float uTime;
  uniform float uGravity;
  uniform float uAirflow;
  uniform float uOxygen;
  uniform float uCoolFlame;
  uniform float uExtinguished;
  uniform float uPixelRatio;
  uniform float uSootScale;

  varying float vLayer;
  varying float vLife;
  varying float vHeat;
  varying float vSeed;

  float hash1(float n) {
    return fract(sin(n * 91.3458) * 47453.5453);
  }

  void main() {
    vLayer = aLayer;
    vSeed = aSeed;

    float o2Norm = clamp((uOxygen - 14.0) / 86.0, 0.0, 1.0);
    float buoyancy = pow(clamp(uGravity, 0.0, 1.0), 0.44);
    float wind = clamp((uAirflow - 0.04) / 0.45, 0.0, 1.35);

    vec3 pos = vec3(0.0);
    float pointSize = 1.0;

    if (aLayer < 0.5) {
      // LAYER 0: Dense 3D Reaction Shell & Inner Flame Plasma Motes (7,500 motes)
      float life = fract(aPhase + uTime * (0.16 + buoyancy * 0.28 + wind * 0.35));
      vLife = life;

      // Base spherical shell distribution
      float baseR = (0.34 + 0.52 * pow(aSeed, 0.45)) * (0.85 + o2Norm * 0.22);
      if (uCoolFlame > 0.5) {
        baseR *= 0.78 + 0.03 * sin(uTime * 2.0 + aSeed * 6.28);
      }

      // Swirl around reaction zone (gentle, steady laminar flow)
      float angle = aSeed * 6.28318 + uTime * (0.12 + hash1(aSeed) * 0.12);
      vec3 dir = aBaseDir;
      float cosA = cos(angle * 0.12);
      float sinA = sin(angle * 0.12);
      dir = vec3(dir.x * cosA - dir.z * sinA, dir.y, dir.x * sinA + dir.z * cosA);

      pos = dir * baseR;

      // Upward buoyant rise & candle flame taper in gravity (1/6g & 1g)
      float upper = smoothstep(-0.4, 0.9, dir.y);
      if (buoyancy > 0.01) {
        float rise = life * buoyancy * (1.35 + o2Norm * 0.35);
        pos.y = pos.y * (1.0 + buoyancy * 1.1 * upper) + rise * upper;
        float taper = 1.0 - buoyancy * 0.60 * clamp(pos.y / 2.0, 0.0, 0.92);
        pos.x *= taper;
        pos.z *= taper;
        // Thermal buoyancy gentle wave
        pos.x += sin(uTime * 1.2 + pos.y * 1.6 + aSeed * 6.28) * 0.03 * buoyancy * upper;
        pos.z += cos(uTime * 1.1 + pos.y * 1.6 + aSeed * 6.28) * 0.03 * buoyancy * upper;
      }

      // Airflow cross-ventilation deflection:
      // Particles lean downwind (+X) as they rise upwards (+Y)
      if (wind > 0.01) {
        float heightFromBase = max(0.0, pos.y + 0.3);
        float tilt = wind * (0.32 + o2Norm * 0.12);
        pos.x += heightFromBase * tilt;
        if (buoyancy < 0.01) {
          pos.x += wind * 0.30;
        }
      }

      vHeat = clamp(1.0 - life * 0.55 + upper * buoyancy * 0.25, 0.0, 1.0);
      pointSize = (5.5 + hash1(aSeed * 3.1) * 6.5) * (1.0 - life * 0.35);
      if (uExtinguished > 0.5) {
        pointSize = 0.0;
      }
    } else if (aLayer < 1.5) {
      // LAYER 1: Soot Agglomerates & Thermal Plume Aerosols (SAME-R physics)
      // Soot rises upwards from the flame tip and drifts in the cabin ventilation
      float life = fract(aPhase + uTime * (0.12 + buoyancy * 0.22 + wind * 0.35));
      vLife = life;

      vec3 dir = aBaseDir;
      float startR = 0.55 + hash1(aSeed * 7.3) * 0.42;
      pos = dir * startR;

      // Thermal rise above candle flame tip
      pos.y += life * (0.45 + buoyancy * 1.95);
      // Downstream drift with cabin airflow
      pos.x += (pos.y + 0.2) * (wind * 0.75) + life * (wind * 0.65);
      pos.z += sin(uTime * 0.9 + aSeed * 6.28) * 0.03 * (buoyancy + wind) * life;

      vHeat = clamp(1.0 - life * 1.15, 0.0, 1.0);
      // Soot clusters are 8x-12x larger in 0g (SAME-R)
      float clusterBoost = 0.85 + clamp(uSootScale / 9.0, 0.15, 1.1) * 0.95;
      pointSize = (4.5 + hash1(aSeed * 19.7) * 6.5) * clusterBoost * sin(life * 3.14159);
    } else {
      // LAYER 2: Cabin Ventilation Oxidizer Airflow Streamlines
      float speed = 0.22 + uAirflow * 1.85;
      float life = fract(aPhase + uTime * speed);
      vLife = life;

      float x = -3.4 + life * 6.8;
      float y = (aBaseDir.y) * 1.55;
      float z = (aBaseDir.z) * 1.55;

      // Potential-flow streamline deflection around the 3D flame zone
      float distSq = x * x + y * y + z * z;
      float deflect = 0.45 / max(0.35, distSq + 0.25);
      y += sign(y + 0.001) * deflect * 0.35;
      z += sign(z + 0.001) * deflect * 0.35;

      pos = vec3(x, y, z);
      vHeat = clamp(uAirflow / 0.45, 0.15, 1.0);
      pointSize = (3.2 + uAirflow * 6.0) * sin(life * 3.14159);
    }

    // Align particle cloud center with the vertical candle flame center
    pos.y += 0.22;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = pointSize * uPixelRatio * (5.2 / max(0.5, -mvPos.z));
  }
`;

const FIRE_CLOUD_FRAG = /* glsl */ `
  precision highp float;

  uniform float uGravity;
  uniform float uAirflow;
  uniform float uOxygen;
  uniform float uCoolFlame;
  uniform float uExtinguished;

  varying float vLayer;
  varying float vLife;
  varying float vHeat;
  varying float vSeed;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;

    float falloff = 1.0 - d;
    // Crisp glowing core + soft radial halo (same formula family as ParticleSaturn)
    float shape = pow(falloff, 4.2) + pow(falloff, 1.5) * 0.38;

    float o2Norm = clamp((uOxygen - 14.0) / 86.0, 0.0, 1.0);
    float buoyancy = pow(clamp(uGravity, 0.0, 1.0), 0.44);
    float wind = clamp((uAirflow - 0.04) / 0.45, 0.0, 1.35);
    float radMix = clamp(buoyancy * 0.88 + wind * 0.78, 0.0, 1.0);

    vec3 col;
    float alpha;

    if (vLayer < 0.5) {
      // Flame plasma motes
      vec3 cyanMote = mix(vec3(0.15, 0.68, 1.0), vec3(0.75, 0.94, 1.0), vHeat);
      vec3 fireMote = mix(vec3(1.0, 0.36, 0.08), vec3(1.0, 0.92, 0.55), vHeat);
      col = mix(cyanMote, fireMote, radMix);
      if (uCoolFlame > 0.5) {
        col = mix(vec3(0.38, 0.28, 0.95), vec3(0.35, 0.85, 1.0), vHeat);
      }
      alpha = shape * (0.42 + o2Norm * 0.25) * sin(vLife * 3.14159);
    } else if (vLayer < 1.5) {
      // Soot agglomerates & embers
      if (uExtinguished > 0.5) {
        col = vec3(0.45, 0.52, 0.58);
        alpha = shape * 0.28 * (1.0 - vLife);
      } else if (radMix < 0.25) {
        col = mix(vec3(0.22, 0.58, 0.92), vec3(0.65, 0.88, 1.0), vHeat);
        alpha = shape * 0.52 * (1.0 - vLife * 0.65);
      } else {
        col = mix(vec3(0.55, 0.32, 0.20), vec3(1.0, 0.62, 0.22), vHeat);
        alpha = shape * 0.58 * (1.0 - vLife * 0.6);
      }
    } else {
      // Cabin ventilation airflow stream motes
      col = vec3(0.38, 0.78, 0.98);
      alpha = shape * (0.16 + vHeat * 0.32);
    }

    gl_FragColor = vec4(col * alpha * 1.35, clamp(alpha, 0.0, 0.95));
  }
`;

function buildFireCloudGeometry() {
  const FLAME_MOTES = 6800;
  const SOOT_MOTES = 1800;
  const FLOW_MOTES = 600;
  const TOTAL = FLAME_MOTES + SOOT_MOTES + FLOW_MOTES;

  const positions = new Float32Array(TOTAL * 3);
  const layers = new Float32Array(TOTAL);
  const seeds = new Float32Array(TOTAL);
  const phases = new Float32Array(TOTAL);
  const baseDirs = new Float32Array(TOTAL * 3);

  for (let i = 0; i < TOTAL; i++) {
    const layer = i < FLAME_MOTES ? 0 : i < FLAME_MOTES + SOOT_MOTES ? 1 : 2;
    layers[i] = layer;
    seeds[i] = Math.random();
    phases[i] = Math.random();

    if (layer < 2) {
      // Fibonacci / uniform sphere direction
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      baseDirs[i * 3 + 0] = Math.sin(phi) * Math.cos(theta);
      baseDirs[i * 3 + 1] = Math.cos(phi);
      baseDirs[i * 3 + 2] = Math.sin(phi) * Math.sin(theta);
    } else {
      baseDirs[i * 3 + 0] = 1;
      baseDirs[i * 3 + 1] = (Math.random() - 0.5) * 2;
      baseDirs[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aBaseDir', new THREE.BufferAttribute(baseDirs, 3));
  return geo;
}

export function CombustionSim3D({
  initialGravity = '0g',
  initialMaterial = 'pmma',
  initialOxygen = 34,
  initialVentilation = 0.08,
  initialPressure = 4.3,
  compact = false,
  showReport = true,
  onStateChange,
}) {
  const [gravityKey, setGravityKey] = useState(initialGravity);
  const [materialKey, setMaterialKey] = useState(initialMaterial);
  const [oxygen, setOxygen] = useState(initialOxygen);
  const [ventilation, setVentilation] = useState(initialVentilation);
  const [pressure, setPressure] = useState(initialPressure);
  const [cameraPreset, setCameraPreset] = useState('iso');
  const [changeHistory, setChangeHistory] = useState([
    'Initialized 3D WebGL Combustion Integrated Rack (CIR) simulation.',
  ]);

  const mountRef = useRef(null);
  const simStateRef = useRef({
    gravityKey,
    materialKey,
    oxygen,
    ventilation,
    pressure,
    cameraPreset,
  });

  // Sync when parent or AI Chat dispatches new situational parameters
  useEffect(() => {
    setGravityKey(initialGravity);
  }, [initialGravity]);
  useEffect(() => {
    setMaterialKey(initialMaterial);
  }, [initialMaterial]);
  useEffect(() => {
    setOxygen(initialOxygen);
  }, [initialOxygen]);
  useEffect(() => {
    setVentilation(initialVentilation);
  }, [initialVentilation]);
  useEffect(() => {
    setPressure(initialPressure);
  }, [initialPressure]);

  const physics = useMemo(
    () =>
      computeCombustionPhysics({
        gravityKey,
        materialKey,
        oxygen,
        ventilation,
        pressure,
      }),
    [gravityKey, materialKey, oxygen, ventilation, pressure]
  );

  const logParameterChange = (description) => {
    setChangeHistory((prev) => [description, ...prev.slice(0, 3)]);
  };

  useEffect(() => {
    simStateRef.current = {
      gravityKey,
      materialKey,
      oxygen,
      ventilation,
      pressure,
      cameraPreset,
      physics,
    };
    if (onStateChange) {
      onStateChange({
        gravityKey,
        materialKey,
        oxygen,
        ventilation,
        pressure,
        physics,
      });
    }
  }, [gravityKey, materialKey, oxygen, ventilation, pressure, cameraPreset, physics, onStateChange]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return undefined;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = 'c3d-webgl-canvas';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 100);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Scientific Chamber Perspective Floor Grid & Thin Diagnostic Orbit Rings
    const gridGroup = new THREE.Group();
    gridGroup.position.y = -1.25;
    const gridHelper = new THREE.GridHelper(10, 24, 0x263840, 0x141f24);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.5;
    gridGroup.add(gridHelper);

    const floorRingGeo = new THREE.RingGeometry(1.72, 1.75, 96);
    floorRingGeo.rotateX(-Math.PI / 2);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
    floorRing.position.y = 0.01;
    gridGroup.add(floorRing);
    gridGroup.position.set(0, -1.8, 0);
    worldGroup.add(gridGroup);

    // Thin Scientific Diagnostic Gimbal Rings around Flame (Centered at flame reaction zone)
    const gimbalGroup = new THREE.Group();
    gimbalGroup.position.set(0, 0.22, 0);
    const gimbalRingGeo1 = new THREE.RingGeometry(1.18, 1.2, 96);
    const gimbalRingMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const gimbal1 = new THREE.Mesh(gimbalRingGeo1, gimbalRingMat1);
    gimbal1.rotation.x = Math.PI / 2.6;
    gimbalGroup.add(gimbal1);

    const gimbal2 = new THREE.Mesh(gimbalRingGeo1, gimbalRingMat1);
    gimbal2.rotation.y = Math.PI / 3;
    gimbal2.rotation.x = -Math.PI / 5;
    gimbalGroup.add(gimbal2);
    worldGroup.add(gimbalGroup);

    // 2. 3D Fuel Sample & Vertical Candle Burner Mount (Burns from the bottom like a candle!)
    const sampleGroup = new THREE.Group();
    worldGroup.add(sampleGroup);

    // Vertical Fuel Candle / Polymer Rod standing from the bottom
    const fuelGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.92, 32);
    const fuelMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2b3a42'),
      roughness: 0.42,
      metalness: 0.15,
      emissive: new THREE.Color('#38bdf8'),
      emissiveIntensity: 0.35,
    });
    const fuelMesh = new THREE.Mesh(fuelGeo, fuelMat);
    fuelMesh.position.set(0, -0.46, 0); // Top tip touches y = 0.0
    sampleGroup.add(fuelMesh);

    // Glowing pyrolyzing candle tip / wick char ring at the top
    const tipGeo = new THREE.SphereGeometry(0.165, 24, 16);
    const tipMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ff8a58'),
      emissive: new THREE.Color('#ff7b39'),
      emissiveIntensity: 0.85,
      roughness: 0.25,
    });
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.scale.set(1.0, 0.45, 1.0);
    tipMesh.position.set(0, 0.0, 0);
    sampleGroup.add(tipMesh);

    // Burner Collar / Ring at the base of the fuel rod
    const collarGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.12, 32);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.set(0, -0.92, 0);
    sampleGroup.add(collarMesh);

    // Metallic Aerospace Burner Base / Candle Holder underneath
    const stingGeo = new THREE.CylinderGeometry(0.07, 0.11, 1.6, 24);
    const stingMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.25,
      metalness: 0.88,
    });
    const stingMesh = new THREE.Mesh(stingGeo, stingMat);
    stingMesh.position.set(0, -1.72, 0);
    sampleGroup.add(stingMesh);

    const ambientLight = new THREE.AmbientLight(0x94a3b8, 1.15);
    scene.add(ambientLight);
    const flameLight = new THREE.PointLight(0x38bdf8, 3.6, 9.0);
    flameLight.position.set(0.0, 0.35, 0.45);
    worldGroup.add(flameLight);

    // 3. 4 Nested Volumetric GLSL Shader Flame Shells (Sits on top of the vertical candle rod!)
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 0.22, 0);
    worldGroup.add(flameGroup);

    const flameGeo = new THREE.SphereGeometry(0.76, 64, 64);
    const flameMaterials = [0, 1, 2, 3].map((shellIdx) => {
      return new THREE.ShaderMaterial({
        vertexShader: VOLUMETRIC_FLAME_VERT,
        fragmentShader: VOLUMETRIC_FLAME_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uGravity: { value: 0 },
          uAirflow: { value: 0.08 },
          uOxygen: { value: 34 },
          uShellIndex: { value: shellIdx },
          uCoolFlame: { value: 0 },
          uExtinguished: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    });

    flameMaterials.forEach((mat) => {
      const mesh = new THREE.Mesh(flameGeo, mat);
      mesh.frustumCulled = false;
      flameGroup.add(mesh);
    });

    // 4. 9,200-Mote GPU Volumetric Fire, Soot & Streamline Cloud
    const cloudGeo = buildFireCloudGeometry();
    const cloudMat = new THREE.ShaderMaterial({
      vertexShader: FIRE_CLOUD_VERT,
      fragmentShader: FIRE_CLOUD_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uGravity: { value: 0 },
        uAirflow: { value: 0.08 },
        uOxygen: { value: 34 },
        uCoolFlame: { value: 0 },
        uExtinguished: { value: 0 },
        uPixelRatio: { value: dpr },
        uSootScale: { value: 8.4 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudPoints = new THREE.Points(cloudGeo, cloudMat);
    cloudPoints.frustumCulled = false;
    worldGroup.add(cloudPoints);

    // Interactive 360° Orbit & Smooth Wheel Zoom Controls
    let targetYaw = -0.28;
    let targetPitch = 0.2;
    let currentYaw = -0.28;
    let currentPitch = 0.2;
    let lastCameraPreset = simStateRef.current.cameraPreset;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let camDistance = 4.85;

    const onPointerDown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetYaw += dx * 0.0085;
      targetPitch = Math.max(-0.65, Math.min(1.1, targetPitch + dy * 0.0075));
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      camDistance = Math.max(2.4, Math.min(6.2, camDistance + e.deltaY * 0.0035));
      camera.position.set(0, 0.28, camDistance);
      camera.lookAt(0.12, 0.08, 0);
      camera.updateProjectionMatrix();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const updateSize = () => {
      const w = Math.max(280, container.clientWidth || 640);
      const h = Math.max(240, container.clientHeight || 360);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.set(0, 0.28, camDistance);
      camera.lookAt(0.12, 0.08, 0);
      camera.updateProjectionMatrix();
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    let smoothG = (GRAVITY_REGIMES[simStateRef.current.gravityKey] || GRAVITY_REGIMES['0g']).gValue;
    let smoothWind = simStateRef.current.ventilation;
    let smoothO2 = simStateRef.current.oxygen;
    let clockTime = 0;
    let lastTime = performance.now();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (!prefersReducedMotion) {
        clockTime += dt;
      }

      const st = simStateRef.current;
      const targetG = (GRAVITY_REGIMES[st.gravityKey] || GRAVITY_REGIMES['0g']).gValue;
      const matCfg = FUEL_MATERIALS[st.materialKey] || FUEL_MATERIALS.pmma;

      // Handle Camera Preset button switches (without autonomous wobbling/vibrating)
      if (st.cameraPreset !== lastCameraPreset) {
        lastCameraPreset = st.cameraPreset;
        if (st.cameraPreset === 'iso') {
          targetYaw = -0.28;
          targetPitch = 0.2;
        } else if (st.cameraPreset === 'side') {
          targetYaw = 0.0;
          targetPitch = 0.04;
        } else if (st.cameraPreset === 'top') {
          targetYaw = 0.0;
          targetPitch = 1.02;
        }
      }

      // Smooth, stable rotation interpolation without autonomous wobble
      currentYaw += (targetYaw - currentYaw) * 0.12;
      currentPitch += (targetPitch - currentPitch) * 0.12;
      worldGroup.rotation.y = currentYaw;
      worldGroup.rotation.x = currentPitch;

      smoothG += (targetG - smoothG) * 0.12;
      smoothWind += (st.ventilation - smoothWind) * 0.12;
      smoothO2 += (st.oxygen - smoothO2) * 0.12;

      const isBlueSpherical = smoothG < 0.05 && smoothWind < 0.1;

      // Adapt 3D sample geometry scale to material type (rod vs fabric slab)
      if (matCfg.shapeType === 'slab') {
        fuelMesh.scale.set(1.4, 1.0, 0.25);
        tipMesh.scale.set(1.4, 0.45, 0.35);
      } else {
        fuelMesh.scale.set(1.0, 1.0, 1.0);
        tipMesh.scale.set(1.0, 0.45, 1.0);
      }
      fuelMat.color.set(matCfg.sampleColor);
      fuelMat.emissive.set(isBlueSpherical ? '#38bdf8' : matCfg.emissiveColor);
      fuelMat.emissiveIntensity = st.physics?.isExtinguished
        ? 0.04
        : 0.22 + (smoothO2 / 100) * 0.45;
      tipMat.emissive.set(isBlueSpherical ? '#38bdf8' : '#ff7b39');
      tipMat.emissiveIntensity = st.physics?.isExtinguished
        ? 0.05
        : 0.65 + (smoothO2 / 100) * 0.55;

      // Update volumetric flame shell uniforms
      flameMaterials.forEach((shMat) => {
        shMat.uniforms.uTime.value = clockTime;
        shMat.uniforms.uGravity.value = smoothG;
        shMat.uniforms.uAirflow.value = smoothWind;
        shMat.uniforms.uOxygen.value = smoothO2;
        shMat.uniforms.uCoolFlame.value = st.physics?.isCoolFlame ? 1.0 : 0.0;
        shMat.uniforms.uExtinguished.value = st.physics?.isExtinguished ? 1.0 : 0.0;
      });

      // Update GPU Fire & Soot Cloud uniforms
      cloudMat.uniforms.uTime.value = clockTime;
      cloudMat.uniforms.uGravity.value = smoothG;
      cloudMat.uniforms.uAirflow.value = smoothWind;
      cloudMat.uniforms.uOxygen.value = smoothO2;
      cloudMat.uniforms.uCoolFlame.value = st.physics?.isCoolFlame ? 1.0 : 0.0;
      cloudMat.uniforms.uExtinguished.value = st.physics?.isExtinguished ? 1.0 : 0.0;
      cloudMat.uniforms.uSootScale.value = st.physics?.sootClusterScale || 5.0;

      // Static, clean diagnostic gimbal rings (stationary spatial frame)
      gimbalRingMat1.color.set(isBlueSpherical ? 0x38bdf8 : 0xff8a58);
      floorRingMat.color.set(isBlueSpherical ? 0x38bdf8 : 0xff8a58);

      flameLight.color.set(isBlueSpherical ? 0x38bdf8 : 0xff7b39);
      flameLight.intensity = st.physics?.isExtinguished
        ? 0.25
        : 2.8 + (smoothO2 / 100) * 2.4;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      flameGeo.dispose();
      flameMaterials.forEach((m) => m.dispose());
      cloudGeo.dispose();
      cloudMat.dispose();
      fuelGeo.dispose();
      fuelMat.dispose();
      tipGeo.dispose();
      tipMat.dispose();
      collarGeo.dispose();
      collarMat.dispose();
      stingGeo.dispose();
      stingMat.dispose();
      floorRingGeo.dispose();
      floorRingMat.dispose();
      gimbalRingGeo1.dispose();
      gimbalRingMat1.dispose();
      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  const currentGravity = GRAVITY_REGIMES[gravityKey] || GRAVITY_REGIMES['0g'];
  const currentMaterial = FUEL_MATERIALS[materialKey] || FUEL_MATERIALS.pmma;

  return (
    <div className={`c3d-sim-card ${compact ? 'c3d-sim-card--compact' : ''}`}>
      {/* 3D WebGL Viewport */}
      <div className="c3d-viewport-wrap">
        <div
          ref={mountRef}
          className="c3d-viewport"
          role="img"
          aria-label={`3D combustion simulation of ${currentMaterial.name} under ${currentGravity.shortLabel} gravity at ${oxygen}% oxygen`}
        />

        {/* Top-Left HUD: Active 3D Regime Pill */}
        <div className="c3d-hud-top-left">
          <span className="c3d-regime-pill">
            <span
              className="c3d-regime-dot"
              style={{
                background:
                  gravityKey === '0g' && ventilation < 0.1 ? '#38bdf8' : '#ff8a58',
              }}
            />
            {physics.regimeTitle}
          </span>
          <span className="c3d-drag-hint">↻ Drag 3D chamber to orbit 360°</span>
        </div>

        {/* Top-Right HUD: Compact Camera Switcher + Gravity Badge */}
        <div className="c3d-hud-top-right">
          <div className="c3d-cam-pills" role="group" aria-label="3D Camera View">
            {[
              { id: 'iso', label: '3D Orbit' },
              { id: 'side', label: 'Side' },
              { id: 'top', label: 'Top' },
            ].map((cam) => (
              <button
                key={cam.id}
                type="button"
                className={`c3d-cam-btn ${cameraPreset === cam.id ? 'is-active' : ''}`}
                onClick={() => setCameraPreset(cam.id)}
              >
                {cam.label}
              </button>
            ))}
          </div>
          <span className="c3d-gravity-badge">{currentGravity.shortLabel}</span>
        </div>

        {/* Saffire-III Flashover Alert Pill (High-contrast text, docked cleanly below top bar) */}
        {physics.flashoverWarning && (
          <div className="c3d-flashover-banner" role="status">
            <span className="c3d-flashover-dot" />
            <span>
              <strong className="c3d-flashover-strong">
                Forced convection ({ventilation.toFixed(2)} m/s):
              </strong>{' '}
              smoldering transitions to open flashover (NASA Saffire-III / BASS-II).
            </span>
          </div>
        )}

        {/* Bottom-Left HUD: Non-overlapping Material Sample Badge */}
        <div className="c3d-hud-bottom-left">
          <span className="c3d-sample-title">{currentMaterial.name}</span>
          <span className="c3d-sample-sub">
            {currentMaterial.geometryLabel} · LOI {physics.effectiveLOI}% ·{' '}
            {currentMaterial.experimentRef}
          </span>
        </div>

        {/* Bottom-Right HUD: Soot & Flow Vector Indicator */}
        <div className="c3d-hud-bottom-right">
          <span>
            SOOT CLUSTER: <b>{physics.sootClusterScale}× Earth</b>
          </span>
          <span>
            FLOW: <b>{ventilation.toFixed(2)} m/s →</b>
          </span>
        </div>
      </div>

      {/* 5-Column Live Telemetry Strip */}
      <div className="c3d-telemetry-strip">
        <div className="c3d-telemetry-cell">
          <span className="c3d-telemetry-label">SPREAD RATE</span>
          <strong className="c3d-telemetry-val c3d-val--green">
            {physics.isExtinguished ? '0.00x' : `${physics.spreadRate.toFixed(2)}x`}
          </strong>
        </div>
        <div className="c3d-telemetry-cell">
          <span className="c3d-telemetry-label">FLAME TEMP</span>
          <strong
            className="c3d-telemetry-val"
            style={{
              color:
                physics.isCoolFlame || (gravityKey === '0g' && ventilation < 0.1)
                  ? '#38bdf8'
                  : '#ff8a58',
            }}
          >
            {physics.flameTemp} K
          </strong>
        </div>
        <div className="c3d-telemetry-cell">
          <span className="c3d-telemetry-label">O₂ LEVEL</span>
          <strong className="c3d-telemetry-val c3d-val--orange">{oxygen}%</strong>
        </div>
        <div className="c3d-telemetry-cell">
          <span className="c3d-telemetry-label">BURN TIME</span>
          <strong className="c3d-telemetry-val c3d-val--orange">
            {physics.isExtinguished ? 'Quenched' : `${physics.burnTime}s`}
          </strong>
        </div>
        <div className="c3d-telemetry-cell">
          <span className="c3d-telemetry-label">AMBIENT P</span>
          <strong className="c3d-telemetry-val c3d-val--orange">
            {pressure.toFixed(1)} psi
          </strong>
        </div>
      </div>

      {/* Gravity Regime Selector (0g, 1/6g Lunar, 1g Earth) */}
      <div className="c3d-gravity-grid" role="group" aria-label="Gravity Regime">
        {Object.values(GRAVITY_REGIMES).map((g) => (
          <button
            key={g.id}
            type="button"
            className={`c3d-gravity-btn ${gravityKey === g.id ? 'is-active' : ''}`}
            onClick={() => {
              setGravityKey(g.id);
              logParameterChange(
                `Gravity switched to ${g.shortLabel} (${g.subLabel}): 3D flame geometry adapted.`
              );
            }}
          >
            <strong>{g.shortLabel}</strong>
            <span>{g.subLabel}</span>
          </button>
        ))}
      </div>

      {/* Fuel Material Selector */}
      <div className="c3d-material-grid" role="group" aria-label="Fuel Material">
        {Object.values(FUEL_MATERIALS).map((m) => (
          <button
            key={m.id}
            type="button"
            className={`c3d-material-btn ${materialKey === m.id ? 'is-active' : ''}`}
            onClick={() => {
              setMaterialKey(m.id);
              logParameterChange(
                `Fuel sample changed to ${m.shortName} (LOI ${m.loiMicro}% in 0g, Ref: ${m.experimentRef}).`
              );
            }}
          >
            {m.shortName}
          </button>
        ))}
      </div>

      {/* Environmental Sliders */}
      <div className="c3d-sliders-grid">
        <div className="c3d-slider-box">
          <div className="c3d-slider-head">
            <span>Oxygen Concentration (O₂)</span>
            <strong>
              {oxygen}% · P<sub>O₂</sub> {physics.pO2} psi
            </strong>
          </div>
          <input
            type="range"
            min="12"
            max="100"
            step="1"
            value={oxygen}
            aria-label="Oxygen Concentration Percentage"
            onChange={(e) => {
              const val = Number(e.target.value);
              setOxygen(val);
              logParameterChange(
                `O₂ updated to ${val}% (PO₂ = ${((val / 100) * pressure).toFixed(2)} psi).`
              );
            }}
          />
        </div>

        <div className="c3d-slider-box">
          <div className="c3d-slider-head">
            <span>Cabin Ventilation</span>
            <strong>
              {ventilation.toFixed(2)} m/s ({physics.ventilationRegime})
            </strong>
          </div>
          <input
            type="range"
            min="0"
            max="0.55"
            step="0.01"
            value={ventilation}
            aria-label="Cabin Ventilation Speed"
            onChange={(e) => {
              const val = Number(e.target.value);
              setVentilation(val);
              logParameterChange(
                `Cabin airflow adjusted to ${val.toFixed(2)} m/s (${
                  val >= 0.14 ? 'Forced-Convection Wake' : 'Quiescent / Laminar Diffusion'
                }).`
              );
            }}
          />
        </div>

        <div className="c3d-slider-box">
          <div className="c3d-slider-head">
            <span>Cabin Ambient Pressure</span>
            <strong>
              {pressure.toFixed(1)} psi ({(pressure * 6.895).toFixed(0)} kPa)
            </strong>
          </div>
          <input
            type="range"
            min="4.0"
            max="14.7"
            step="0.1"
            value={pressure}
            aria-label="Cabin Ambient Pressure"
            onChange={(e) => {
              const val = Number(e.target.value);
              setPressure(val);
              logParameterChange(
                `Chamber pressure set to ${val.toFixed(1)} psi (${(val * 6.895).toFixed(0)} kPa).`
              );
            }}
          />
        </div>
      </div>

      {/* Dynamic Situational SI Assessment Report (Automatically adapts to every parameter change!) */}
      {showReport && (
        <CombustionSituationalReport
          gravityKey={gravityKey}
          materialKey={materialKey}
          oxygen={oxygen}
          ventilation={ventilation}
          pressure={pressure}
          physics={physics}
          changeHistory={changeHistory}
        />
      )}
    </div>
  );
}

/* ============================================================================
   3. Dynamic Situational SI Assessment Report Component
      Automatically updates engineering metrics, regime analysis & directives
   ============================================================================ */

export function CombustionSituationalReport({
  gravityKey = '0g',
  materialKey = 'pmma',
  oxygen = 34,
  ventilation = 0.08,
  pressure = 4.3,
  physics: passedPhysics,
  changeHistory = [],
}) {
  const [copiedReport, setCopiedReport] = useState(false);

  const physics =
    passedPhysics ||
    computeCombustionPhysics({
      gravityKey,
      materialKey,
      oxygen,
      ventilation,
      pressure,
    });

  const grav = GRAVITY_REGIMES[gravityKey] || GRAVITY_REGIMES['0g'];
  const mat = FUEL_MATERIALS[materialKey] || FUEL_MATERIALS.pmma;

  const directives = useMemo(() => {
    const list = [];
    if (physics.isExtinguished) {
      list.push(
        `Oxygen (${oxygen}%) is below the effective Limiting Oxygen Index (${physics.effectiveLOI}% LOI for ${mat.shortName}): flame self-quenches via radiative heat loss.`
      );
      list.push(
        'Maintain inert N₂/CO₂ purge for at least 180s until sample surface cools below 420 K pyrolysis threshold.'
      );
    } else if (physics.isCoolFlame) {
      list.push(
        `FLEX Cool-Flame Warning: Invisible low-temperature oxidation (${physics.flameTemp} K) persists near ${oxygen}% O₂. Re-introducing fresh air can trigger explosive flash reignition.`
      );
      list.push(
        'Use mid-wave infrared (MWIR) radiometry and maintain CO₂/He dilution blanket before restoring cabin airflow.'
      );
    } else {
      if (physics.flashoverWarning) {
        list.push(
          `CRITICAL FLOW ALERT (Saffire-III): Cabin ventilation (${ventilation.toFixed(
            2
          )} m/s) is feeding oxidizer into the boundary layer, stretching the flame into a ${physics.spreadRate.toFixed(
            2
          )}x wake cone. Throttle HVAC below 0.08 m/s immediately.`
        );
      } else {
        list.push(
          `Keep cabin ventilation below 0.10 m/s (${ventilation.toFixed(
            2
          )} m/s active) to starve the reaction zone of convective oxygen supply.`
        );
      }

      if (oxygen >= 30) {
        list.push(
          `Elevated Oxygen Envelope (${oxygen}% O₂, PO₂ = ${physics.pO2} psi): Material LOI margin is +${physics.o2Margin}% above extinction. Enforce NASA-STD-6001 material exclusions.`
        );
      }

      if (gravityKey === '0g' || gravityKey === '1/6g') {
        list.push(
          `SAME-R Smoke Sensor Calibration: Soot agglomerates are ${physics.sootClusterScale}× larger than 1g Earth soot due to reduced buoyancy. Switch optical detectors to low-gravity scatter profile.`
        );
      }
    }
    return list;
  }, [physics, oxygen, ventilation, gravityKey, mat]);

  const handleCopyReport = () => {
    const reportText = [
      `FLAME-SI SITUATIONAL ENGINEERING REPORT`,
      `Regime: ${physics.regimeTitle} (${grav.badge})`,
      `Material: ${mat.name} (${mat.experimentRef})`,
      `Atmosphere: ${oxygen}% O2 | ${pressure.toFixed(1)} psi (PO2 = ${physics.pO2} psi) | Airflow = ${ventilation.toFixed(2)} m/s`,
      `Telemetry: Spread Rate = ${physics.spreadRate}x | Flame Temp = ${physics.flameTemp} K | Burn Time = ${physics.burnTime}s | Soot Cluster = ${physics.sootClusterScale}x Earth | Hazard Score = ${physics.hazardScore}/100`,
      `Directives:\n- ${directives.join('\n- ')}`,
    ].join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  return (
    <div className="c3d-situational-report">
      <div className="c3d-report-header">
        <div>
          <span className="c3d-report-eyebrow">
            LIVE ADAPTIVE SI SITUATION REPORT · REAL-TIME TELEMETRY SYNTHESIS
          </span>
          <h5>
            {physics.regimeTitle} — {mat.shortName} ({oxygen}% O₂ · {ventilation.toFixed(2)} m/s ·{' '}
            {grav.shortLabel})
          </h5>
        </div>
        <div className="c3d-report-actions">
          <span
            className={`c3d-report-risk-pill ${
              physics.hazardScore >= 75
                ? 'is-critical'
                : physics.hazardScore >= 50
                ? 'is-elevated'
                : 'is-managed'
            }`}
          >
            SI Hazard Index: {physics.hazardScore}/100
          </span>
          <button type="button" className="c3d-report-copy-btn" onClick={handleCopyReport}>
            {copiedReport ? '✓ Report Copied' : 'Copy SI Report'}
          </button>
        </div>
      </div>

      {/* Quantitative Situational Matrix */}
      <div className="c3d-report-grid">
        <div className="c3d-report-metric">
          <span>O₂ Partial Pressure (PO₂)</span>
          <strong>
            {physics.pO2} psi ({(physics.pO2Ratio * 100).toFixed(0)}% of Earth)
          </strong>
        </div>
        <div className="c3d-report-metric">
          <span>LOI Flammability Margin</span>
          <strong style={{ color: physics.o2Margin > 0 ? '#ff8a58' : '#34d399' }}>
            {physics.o2Margin >= 0 ? `+${physics.o2Margin}% above LOI` : `${physics.o2Margin}% (Below LOI)`}
          </strong>
        </div>
        <div className="c3d-report-metric">
          <span>Soot Agglomeration (SAME-R)</span>
          <strong>{physics.sootClusterScale}× Terrestrial Diameter</strong>
        </div>
        <div className="c3d-report-metric">
          <span>Convective / Diffusive State</span>
          <strong>{physics.ventilationRegime}</strong>
        </div>
      </div>

      {/* Dynamic Directives List */}
      <ul className="c3d-report-directives">
        {directives.map((d, idx) => (
          <li key={idx}>{d}</li>
        ))}
      </ul>

      {/* Live Parameter Change Audit Log */}
      {changeHistory.length > 0 && (
        <div className="c3d-report-changelog">
          <span>LIVE PARAMETER CHANGE LOG:</span>
          <code>{changeHistory[0]}</code>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   4. Interactive Multi-Mode Scientific Data Visualizer (4 Dynamic Chart Modes)
   ============================================================================ */

export function CombustionTelemetryChart({
  gravityKey = '0g',
  materialKey = 'pmma',
  oxygen = 34,
  ventilation = 0.08,
  pressure = 4.3,
  defaultTab = 'o2-curve',
}) {
  const [chartTab, setChartTab] = useState(defaultTab);

  useEffect(() => {
    setChartTab(defaultTab);
  }, [defaultTab]);

  const mat = FUEL_MATERIALS[materialKey] || FUEL_MATERIALS.pmma;

  const activePhysics = useMemo(
    () =>
      computeCombustionPhysics({
        gravityKey,
        materialKey,
        oxygen,
        ventilation,
        pressure,
      }),
    [gravityKey, materialKey, oxygen, ventilation, pressure]
  );

  // 1. O2 vs Spread Rate curves
  const o2Points = [14, 18, 21, 28, 34, 50, 70, 100];
  const buildO2Path = (gKey) =>
    o2Points
      .map((o2Val, idx) => {
        const res = computeCombustionPhysics({
          gravityKey: gKey,
          materialKey,
          oxygen: o2Val,
          ventilation,
          pressure,
        });
        const x = 48 + ((o2Val - 14) / 86) * 470;
        const y = 178 - Math.min(150, (res.spreadRate / 6.5) * 145);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  // 2. Ventilation Velocity vs Spread Rate curves
  const ventPoints = [0.0, 0.03, 0.07, 0.12, 0.18, 0.25, 0.35, 0.45, 0.55];
  const buildVentPath = (gKey) =>
    ventPoints
      .map((vVal, idx) => {
        const res = computeCombustionPhysics({
          gravityKey: gKey,
          materialKey,
          oxygen,
          ventilation: vVal,
          pressure,
        });
        const x = 48 + (vVal / 0.55) * 470;
        const y = 178 - Math.min(150, (res.spreadRate / 5.5) * 145);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  // 3. Time-Series Temperature & Cool-Flame Trajectory (0 - 120s)
  const timePoints = [0, 10, 25, 45, 65, 85, 105, 120];
  const buildTimeTempPath = () =>
    timePoints
      .map((tSec, idx) => {
        const x = 48 + (tSec / 120) * 470;
        let tempK = 300;
        if (!activePhysics.isExtinguished) {
          if (tSec <= 12) {
            tempK = 300 + (activePhysics.flameTemp - 300) * (tSec / 12);
          } else if (tSec <= activePhysics.burnTime) {
            tempK = activePhysics.flameTemp - (tSec - 12) * 1.4;
          } else if (gravityKey === '0g') {
            // FLEX post-extinction cool-flame plateau (680 K)
            tempK = 680 - Math.min(280, (tSec - activePhysics.burnTime) * 3.2);
          } else {
            tempK = Math.max(320, activePhysics.flameTemp * Math.exp(-(tSec - activePhysics.burnTime) * 0.045));
          }
        }
        const y = 178 - Math.min(150, ((tempK - 300) / 2200) * 145);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  const activeO2X = 48 + ((Math.max(14, Math.min(100, oxygen)) - 14) / 86) * 470;
  const activeO2Y = 178 - Math.min(150, (activePhysics.spreadRate / 6.5) * 145);

  const activeVentX = 48 + (Math.max(0, Math.min(0.55, ventilation)) / 0.55) * 470;
  const activeVentY = 178 - Math.min(150, (activePhysics.spreadRate / 5.5) * 145);

  return (
    <div className="c3d-viz-card">
      <div className="c3d-viz-header">
        <div>
          <span className="c3d-viz-eyebrow">
            DYNAMIC SITUATIONAL TELEMETRY VISUALIZER · LIVE PARAMETER SYNC
          </span>
          <h4>
            {chartTab === 'o2-curve'
              ? `Oxygen Flammability & Spread Rate Curve (${mat.shortName} · ${pressure.toFixed(1)} psi)`
              : chartTab === 'airflow-curve'
              ? `Cabin Ventilation Flashover Envelope (${oxygen}% O₂ · ${gravityKey})`
              : chartTab === 'time-series'
              ? `Temporal Burn & FLEX Cool-Flame Temperature Trajectory (0–120s)`
              : `Multi-Axis Mission Fire Hazard Breakdown (${mat.shortName} @ ${oxygen}% O₂)`}
          </h4>
        </div>
        <div className="c3d-viz-tabs" role="tablist">
          <button
            type="button"
            className={chartTab === 'o2-curve' ? 'is-active' : ''}
            onClick={() => setChartTab('o2-curve')}
          >
            O₂ vs Spread
          </button>
          <button
            type="button"
            className={chartTab === 'airflow-curve' ? 'is-active' : ''}
            onClick={() => setChartTab('airflow-curve')}
          >
            Airflow Dome
          </button>
          <button
            type="button"
            className={chartTab === 'time-series' ? 'is-active' : ''}
            onClick={() => setChartTab('time-series')}
          >
            Temp Timeline
          </button>
          <button
            type="button"
            className={chartTab === 'hazard-radar' ? 'is-active' : ''}
            onClick={() => setChartTab('hazard-radar')}
          >
            Hazard Matrix
          </button>
        </div>
      </div>

      {chartTab === 'o2-curve' && (
        <div className="c3d-viz-body">
          <svg
            viewBox="0 0 550 215"
            className="c3d-viz-svg"
            role="img"
            aria-label="Oxygen concentration versus flame spread rate chart"
          >
            {[40, 85, 130, 178].map((y, idx) => (
              <g key={y}>
                <line
                  x1="48"
                  y1={y}
                  x2="520"
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="3 3"
                />
                <text x="40" y={y + 4} textAnchor="end" fill="#7d8983" fontSize="10">
                  {['6.0x', '4.0x', '2.0x', '0.0x'][idx]}
                </text>
              </g>
            ))}

            {(() => {
              const loiX = 48 + ((activePhysics.effectiveLOI - 14) / 86) * 470;
              return (
                <g>
                  <line
                    x1={loiX}
                    y1="26"
                    x2={loiX}
                    y2="178"
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <text x={loiX + 5} y="36" fill="#f87171" fontSize="9.5" fontWeight="600">
                    LOI Limit ({activePhysics.effectiveLOI}% O₂)
                  </text>
                </g>
              );
            })()}

            <path d={buildO2Path('1g')} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
            <path d={buildO2Path('1/6g')} fill="none" stroke="#ff8a58" strokeWidth="2.5" />
            <path d={buildO2Path('0g')} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

            <line x1={activeO2X} y1="26" x2={activeO2X} y2="178" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
            <circle
              cx={activeO2X}
              cy={activeO2Y}
              r="6"
              fill={gravityKey === '0g' ? '#38bdf8' : '#ff8a58'}
              stroke="#0d1213"
              strokeWidth="2"
            />
            <rect
              x={Math.min(410, Math.max(52, activeO2X - 55))}
              y={Math.max(18, activeO2Y - 32)}
              width="118"
              height="22"
              rx="5"
              fill="#161f22"
              stroke="rgba(255,138,88,0.45)"
            />
            <text
              x={Math.min(469, Math.max(111, activeO2X + 4))}
              y={Math.max(33, activeO2Y - 17)}
              textAnchor="middle"
              fill="#f7f3ed"
              fontSize="10"
              fontWeight="700"
            >
              {oxygen}% O₂ → {activePhysics.spreadRate}x
            </text>

            {[14, 21, 34, 50, 75, 100].map((val) => {
              const x = 48 + ((val - 14) / 86) * 470;
              return (
                <text key={val} x={x} y="198" textAnchor="middle" fill="#8b9690" fontSize="10">
                  {val}% O₂
                </text>
              );
            })}
          </svg>
          <div className="c3d-viz-legend">
            <span>
              <i style={{ background: '#38bdf8' }} /> 0g Microgravity
            </span>
            <span>
              <i style={{ background: '#ff8a58' }} /> 1/6g Lunar Base
            </span>
            <span>
              <i style={{ background: '#94a3b8' }} /> 1g Earth Baseline
            </span>
          </div>
        </div>
      )}

      {chartTab === 'airflow-curve' && (
        <div className="c3d-viz-body">
          <svg
            viewBox="0 0 550 215"
            className="c3d-viz-svg"
            role="img"
            aria-label="Cabin ventilation velocity versus flame spread chart"
          >
            <rect
              x={48 + (0.14 / 0.55) * 470}
              y="26"
              width={((0.36 - 0.14) / 0.55) * 470}
              height="152"
              fill="rgba(239, 68, 68, 0.09)"
            />
            <text
              x={48 + (0.25 / 0.55) * 470}
              y="39"
              textAnchor="middle"
              fill="#f87171"
              fontSize="9.5"
              fontWeight="600"
            >
              Saffire-III Forced-Convection Flashover Zone (0.14–0.36 m/s)
            </text>

            {[40, 85, 130, 178].map((y, idx) => (
              <g key={y}>
                <line
                  x1="48"
                  y1={y}
                  x2="520"
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="3 3"
                />
                <text x="40" y={y + 4} textAnchor="end" fill="#7d8983" fontSize="10">
                  {['5.0x', '3.5x', '1.8x', '0.0x'][idx]}
                </text>
              </g>
            ))}

            <path d={buildVentPath('0g')} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            <path d={buildVentPath('1/6g')} fill="none" stroke="#ff8a58" strokeWidth="2.5" />

            <line
              x1={activeVentX}
              y1="26"
              x2={activeVentX}
              y2="178"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1"
            />
            <circle cx={activeVentX} cy={activeVentY} r="6" fill="#ff8a58" stroke="#0d1213" strokeWidth="2" />
            <text
              x={Math.min(475, Math.max(95, activeVentX))}
              y={Math.max(36, activeVentY - 12)}
              textAnchor="middle"
              fill="#f7f3ed"
              fontSize="10"
              fontWeight="700"
            >
              {ventilation.toFixed(2)} m/s ({activePhysics.spreadRate}x)
            </text>

            {[0, 0.1, 0.2, 0.3, 0.4, 0.55].map((val) => {
              const x = 48 + (val / 0.55) * 470;
              return (
                <text key={val} x={x} y="198" textAnchor="middle" fill="#8b9690" fontSize="10">
                  {val.toFixed(2)} m/s
                </text>
              );
            })}
          </svg>
          <div className="c3d-viz-legend">
            <span>
              <i style={{ background: '#38bdf8' }} /> 0g Microgravity Flow Response
            </span>
            <span>
              <i style={{ background: '#ff8a58' }} /> 1/6g Lunar Partial-Gravity Flow
            </span>
          </div>
        </div>
      )}

      {chartTab === 'time-series' && (
        <div className="c3d-viz-body">
          <svg
            viewBox="0 0 550 215"
            className="c3d-viz-svg"
            role="img"
            aria-label="Flame temperature timeline and cool-flame plateau chart"
          >
            {[40, 85, 130, 178].map((y, idx) => (
              <g key={y}>
                <line
                  x1="48"
                  y1={y}
                  x2="520"
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="3 3"
                />
                <text x="40" y={y + 4} textAnchor="end" fill="#7d8983" fontSize="10">
                  {['2400K', '1700K', '1000K', '300K'][idx]}
                </text>
              </g>
            ))}

            {/* FLEX Cool-Flame Band (600 - 800 K) */}
            <rect x="48" y="138" width="472" height="20" fill="rgba(56, 189, 248, 0.09)" />
            <text x="514" y="151" textAnchor="end" fill="#38bdf8" fontSize="9.5" fontWeight="600">
              FLEX Cool-Flame Zone (600–800 K)
            </text>

            <path
              d={buildTimeTempPath()}
              fill="none"
              stroke={gravityKey === '0g' ? '#38bdf8' : '#ff8a58'}
              strokeWidth="2.8"
            />

            {[0, 20, 40, 60, 80, 100, 120].map((sec) => {
              const x = 48 + (sec / 120) * 470;
              return (
                <text key={sec} x={x} y="198" textAnchor="middle" fill="#8b9690" fontSize="10">
                  t = {sec}s
                </text>
              );
            })}
          </svg>
          <div className="c3d-viz-legend">
            <span>
              <i style={{ background: gravityKey === '0g' ? '#38bdf8' : '#ff8a58' }} /> Active Peak Temp:{' '}
              {activePhysics.flameTemp} K (Burn Duration: {activePhysics.burnTime}s)
            </span>
          </div>
        </div>
      )}

      {chartTab === 'hazard-radar' && (
        <div className="c3d-viz-body c3d-viz-bars">
          {[
            {
              label: 'Ignition & Oxidation Susceptibility (PO₂ & LOI Margin)',
              val: activePhysics.radarMetrics.ignitionRisk,
              col: 'linear-gradient(90deg, #ff8a58, #ef4444)',
            },
            {
              label: `Flame Spread Velocity Index (${activePhysics.spreadRate}x Baseline)`,
              val: activePhysics.radarMetrics.spreadVelocity,
              col: 'linear-gradient(90deg, #fbbf24, #ff8a58)',
            },
            {
              label: `SAME-R Soot Agglomeration & Sensor Obscuration (${activePhysics.sootClusterScale}× Earth)`,
              val: activePhysics.radarMetrics.sootObscuration,
              col: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            },
            {
              label: `Forced-Convection Flashover Potential (${ventilation.toFixed(2)} m/s)`,
              val: activePhysics.radarMetrics.flashoverHazard,
              col: 'linear-gradient(90deg, #f97316, #ef4444)',
            },
            {
              label: 'Suppression & Cool-Flame Reignition Complexity (FLEX)',
              val: activePhysics.radarMetrics.suppressionDifficulty,
              col: 'linear-gradient(90deg, #34d399, #38bdf8)',
            },
          ].map((item, idx) => (
            <div key={idx} className="c3d-bar-group">
              <div className="c3d-bar-head">
                <span>{item.label}</span>
                <strong>{item.val}/100</strong>
              </div>
              <div className="c3d-bar-track">
                <div
                  className="c3d-bar-fill"
                  style={{ width: `${item.val}%`, background: item.col }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CombustionSim3D;
