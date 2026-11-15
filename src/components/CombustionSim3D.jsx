import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import GlassSurface from './GlassSurface';
import './CombustionSim3D.css';

export const GRAVITY_REGIMES = {
  '0g': {
    id: '0g',
    shortLabel: '0g',
    subLabel: 'Microgravity',
    gValue: 0.0,
    badge: '0g · ISS / Orbital Freefall',
    physicsSummary:
      'Buoyancy is absent (Gr ≈ 0). Molecular diffusion dominates: oxygen diffuses inward omnidirectionally to form a spherical reaction shell (NASA ACME s-Flame / FLEX).',
  },
  '1/6g': {
    id: '1/6g',
    shortLabel: '1/6g',
    subLabel: 'Lunar',
    gValue: 0.166,
    badge: '1/6g · Artemis Lunar Base',
    physicsSummary:
      'Weak partial buoyancy stretches the spherical diffusion zone into a hemispherical plume. Reduced convective cooling lowers the Limiting Oxygen Index (LOI) and accelerates material flame spread.',
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
    loiEarth: 17.5,
    loiMicro: 15.2,
    baseSpread: 1.0,
    baseTemp: 1020,
    baseBurnTime: 95,
    sootFactor: 0.55,
    sampleColor: '#3b4a54',
    emissiveColor: '#ff6b39',
    experimentRef: 'BASS-II (#922)',
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton Fabric',
    shortName: 'Cotton Fabric',
    geometryLabel: 'Fiberglass-Cotton Composite (Saffire)',
    loiEarth: 18.0,
    loiMicro: 15.8,
    baseSpread: 1.48,
    baseTemp: 1120,
    baseBurnTime: 62,
    sootFactor: 0.72,
    sampleColor: '#4c463b',
    emissiveColor: '#ff8a47',
    experimentRef: 'Saffire-I & III (#1738)',
  },
  silicone: {
    id: 'silicone',
    name: 'Silicone Rubber',
    shortName: 'Silicone Rubber',
    geometryLabel: 'Elastomer Insulation Slab',
    loiEarth: 23.5,
    loiMicro: 20.4,
    baseSpread: 0.74,
    baseTemp: 980,
    baseBurnTime: 130,
    sootFactor: 0.85,
    sampleColor: '#523835',
    emissiveColor: '#f97316',
    experimentRef: 'ACME: BRE (#7585)',
  },
  nomex: {
    id: 'nomex',
    name: 'Nomex III (NASA)',
    shortName: 'Nomex III (NASA)',
    geometryLabel: 'Meta-Aramid Flame-Retardant Weave',
    loiEarth: 28.5,
    loiMicro: 25.2,
    baseSpread: 0.42,
    baseTemp: 910,
    baseBurnTime: 175,
    sootFactor: 0.35,
    sampleColor: '#474335',
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

  // Effective Limiting Oxygen Index (LOI) shifts lower in reduced gravity and higher pressure
  const gFactor = grav.gValue;
  const effectiveLOI =
    mat.loiMicro +
    (mat.loiEarth - mat.loiMicro) * Math.pow(gFactor, 0.45) -
    (pressure - 10.2) * 0.12;

  // Oxygen Partial Pressure (psi)
  const pO2 = (oxygen / 100) * pressure;
  const o2Margin = oxygen - effectiveLOI;

  // Determine combustion regime: extinguished, cool-flame, spherical diffusion, partial-buoyancy, buoyant plume, or forced-convection wake
  const isCoolFlame =
    gravityKey === '0g' && oxygen >= effectiveLOI - 3.0 && oxygen < effectiveLOI + 1.2 && ventilation < 0.08;
  const isExtinguished = oxygen < effectiveLOI - 3.0 || (gravityKey === '0g' && ventilation < 0.015 && oxygen < 18);

  // Forced convection factor: in 0g/1/6g, cabin ventilation > 0.10 m/s feeds fresh O2 into the reaction zone
  const forcedFlowBoost =
    ventilation <= 0.28
      ? 1 + ventilation * 2.65
      : Math.max(0.55, 1 + 0.28 * 2.65 - (ventilation - 0.28) * 1.4);

  const o2Multiplier = Math.max(0.15, Math.pow(Math.max(10, oxygen) / 21, 1.55));
  const pressureMultiplier = Math.pow(Math.max(3.5, pressure) / 10.2, 0.32);
  const gravitySpreadFactor =
    gravityKey === '0g' ? 0.78 : gravityKey === '1/6g' ? 1.18 : 1.0;

  const rawSpread = isExtinguished
    ? 0
    : isCoolFlame
    ? 0.18
    : mat.baseSpread * o2Multiplier * pressureMultiplier * forcedFlowBoost * gravitySpreadFactor;

  const spreadRate = Number(rawSpread.toFixed(2));

  // Flame temperature (K)
  let flameTemp = 300;
  if (!isExtinguished) {
    if (isCoolFlame) {
      flameTemp = Math.round(640 + (oxygen - 12) * 18);
    } else {
      const baseT = mat.baseTemp;
      const o2TempBoost = (oxygen - 21) * 11.5;
      const flowTempBoost = ventilation * 420;
      const gravTempBoost = gravityKey === '1g' ? 280 : gravityKey === '1/6g' ? 110 : 0;
      flameTemp = Math.min(2480, Math.max(720, Math.round(baseT + o2TempBoost + flowTempBoost + gravTempBoost)));
    }
  }

  // Burn time (s) inversely proportional to spread intensity
  const burnTime = isExtinguished
    ? 0
    : Math.max(12, Math.min(240, Math.round(mat.baseBurnTime / Math.max(0.35, spreadRate * 0.82))));

  // Flow regime label
  let ventilationRegime = 'Quiescent';
  if (ventilation >= 0.32) ventilationRegime = 'High Forced Flow';
  else if (ventilation >= 0.14) ventilationRegime = 'Forced Convection';
  else if (ventilation >= 0.06) ventilationRegime = 'Low Laminar Drift';

  // Flashover warning condition (Saffire-III / BASS-II)
  const flashoverWarning =
    !isExtinguished &&
    ((ventilation >= 0.13 && oxygen >= 20) || (oxygen >= 32 && ventilation >= 0.08));

  // Soot agglomeration multiplier (SAME-R: 8x-12x larger in 0g low flow)
  const sootClusterScale =
    gravityKey === '0g'
      ? Math.max(2.5, 9.5 - ventilation * 14)
      : gravityKey === '1/6g'
      ? Math.max(1.8, 5.2 - ventilation * 7)
      : 1.0;

  return {
    spreadRate,
    flameTemp,
    burnTime,
    pO2: Number(pO2.toFixed(2)),
    effectiveLOI: Number(effectiveLOI.toFixed(1)),
    o2Margin: Number(o2Margin.toFixed(1)),
    isCoolFlame,
    isExtinguished,
    flashoverWarning,
    ventilationRegime,
    sootClusterScale: Number(sootClusterScale.toFixed(1)),
  };
}

/* ============================================================================
   GLSL Shaders for 3D Volumetric Multi-Shell Flame & 3D Particle Plume
   ============================================================================ */

const FLAME_VERTEX_SHADER = /* glsl */ `
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

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3D(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
        mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
        mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x),
        f.y
      ),
      f.z
    );
  }

  void main() {
    vec3 pos = position;
    vLocalPos = position;

    // Normalize oxygen intensity (0.0 at 15%, 1.0 at 100%)
    float o2Norm = clamp((uOxygen - 15.0) / 85.0, 0.0, 1.0);
    // Buoyancy strength from gravity (0.0 in 0g, ~0.41 in 1/6g, 1.0 in 1g)
    float buoyancy = pow(clamp(uGravity, 0.0, 1.0), 0.42);
    // Forced convection wake strength from cabin ventilation (0.0 to 0.55 m/s)
    float wind = clamp(uAirflow / 0.45, 0.0, 1.35);

    // 3D turbulence field
    vec3 samplePt = pos * 2.4 - vec3(uTime * (1.2 + wind * 3.8), uTime * (1.5 + buoyancy * 3.2), 0.0);
    float n1 = noise3D(samplePt);
    float n2 = noise3D(samplePt * 2.1 + 4.3);
    float turb = (n1 * 0.65 + n2 * 0.35) - 0.5;
    vNoise = n1;

    // 1. Base Spherical Radius (0g diffusion envelope)
    float baseScale = 0.82 + o2Norm * 0.36 + uShellIndex * 0.16;
    if (uCoolFlame > 0.5) {
      baseScale = 0.68 + 0.06 * sin(uTime * 3.2) + uShellIndex * 0.12;
    }
    pos *= baseScale;

    // 2. Buoyant Vertical Plume Deformation (1/6g Lunar & 1g Earth)
    float upperFactor = smoothstep(-0.35, 0.85, vLocalPos.y);
    if (buoyancy > 0.01) {
      // Stretch upward and taper toward tip (teardrop / bell geometry)
      float verticalStretch = 1.0 + buoyancy * (1.35 + o2Norm * 0.45) * upperFactor;
      float tipTaper = 1.0 - buoyancy * 0.58 * pow( clamp((vLocalPos.y + 0.2) / 1.2, 0.0, 1.0), 1.35 );
      // Slight buoyant necking near base
      float basePinch = 1.0 - buoyancy * 0.16 * exp(-pow((vLocalPos.y + 0.45) * 3.0, 2.0));
      pos.y *= verticalStretch;
      pos.x *= tipTaper * basePinch;
      pos.z *= tipTaper * basePinch;
      // Upward shift so flame sits cleanly on/above fuel sample
      pos.y += buoyancy * 0.42 * upperFactor;
    }

    // 3. Forced Convection Wake Deformation (+X airflow from cabin ventilation)
    float downstreamFactor = smoothstep(-0.65, 0.95, vLocalPos.x);
    if (wind > 0.04) {
      // Compress windward (-X) boundary layer, stretch leeward (+X) trailing wake cone
      float windStretchX = 1.0 + wind * (1.65 + o2Norm * 0.5) * downstreamFactor;
      float windwardCompress = vLocalPos.x < 0.0 ? (1.0 - min(0.42, wind * 0.28)) : 1.0;
      float wakeTaper = 1.0 - min(0.55, wind * 0.36) * pow(downstreamFactor, 1.25);
      pos.x = pos.x * windStretchX * windwardCompress + wind * 0.55 * Math_max(0.0, upperFactor * 0.6 + downstreamFactor);
      pos.y *= (1.0 - min(0.32, wind * 0.22) * downstreamFactor);
      pos.z *= wakeTaper;
    }

    // 4. Organic 3D Flicker & Shear-Layer Ripples
    float rippleAmp = (0.045 + buoyancy * 0.09 + wind * 0.11) * (0.4 + 0.6 * max(upperFactor, downstreamFactor));
    pos.x += turb * rippleAmp * (1.0 + wind * 1.4);
    pos.y += turb * rippleAmp * (1.0 + buoyancy * 1.2);
    pos.z += (n2 - 0.5) * rippleAmp * 0.85;

    // Heat coordinate (0 = base/leading edge, 1 = downstream/plume tip)
    vHeat = clamp(0.35 + upperFactor * buoyancy * 0.55 + downstreamFactor * wind * 0.45 + turb * 0.18, 0.0, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPos = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }

  float Math_max(float a, float b) {
    return a > b ? a : b;
  }
`;

const FLAME_FRAGMENT_SHADER = /* glsl */ `
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

    // Volumetric rim + core density
    float fresnel = pow(1.0 - ndotv, 1.65);
    float coreDensity = pow(ndotv, 1.35);

    float o2Norm = clamp((uOxygen - 15.0) / 85.0, 0.0, 1.0);
    float buoyancy = pow(clamp(uGravity, 0.0, 1.0), 0.42);
    float wind = clamp(uAirflow / 0.45, 0.0, 1.35);

    // Regime blend: 0.0 = pure 0g blue spherical diffusion, 1.0 = incandescent yellow-orange soot/convective flame
    float radiativeMix = clamp(buoyancy * 0.82 + wind * 0.68 + o2Norm * 0.38, 0.0, 1.0);

    // Palette 1: 0g Microgravity Spherical Diffusion (CH* / OH* blue-cyan radical emission)
    vec3 zeroGCore = vec3(0.78, 0.93, 1.00);
    vec3 zeroGMid  = vec3(0.16, 0.68, 0.98);
    vec3 zeroGRim  = vec3(0.22, 0.36, 0.92);

    // Palette 2: Partial/Earth Gravity & Forced Convection (Blue base -> Amber/Orange -> White-Yellow core)
    vec3 baseBlue   = vec3(0.18, 0.58, 0.98);
    vec3 midOrange  = vec3(1.00, 0.44, 0.11);
    vec3 hotYellow  = vec3(1.00, 0.88, 0.48);
    vec3 whiteCore  = vec3(1.00, 0.98, 0.90);

    // In buoyant/convective flames, leading edge/bottom is blue, upper/wake body is orange-gold
    float blueBaseZone = smoothstep(-0.75, -0.05, -vLocalPos.y * (0.6 + buoyancy) - vLocalPos.x * wind * 0.7);
    vec3 buoyantColor = mix(midOrange, hotYellow, clamp(vHeat * 0.85 + coreDensity * 0.45, 0.0, 1.0));
    buoyantColor = mix(buoyantColor, whiteCore, pow(coreDensity, 2.4) * (0.45 + o2Norm * 0.45));
    buoyantColor = mix(buoyantColor, baseBlue, blueBaseZone * (0.65 - o2Norm * 0.25));

    vec3 zeroGColor = mix(zeroGRim, zeroGMid, coreDensity);
    zeroGColor = mix(zeroGColor, zeroGCore, pow(coreDensity, 2.6) * (0.55 + o2Norm * 0.35));

    vec3 finalColor = mix(zeroGColor, buoyantColor, radiativeMix);

    // Cool flame override (FLEX 600-800 K invisible/UV-blue regime)
    if (uCoolFlame > 0.5) {
      vec3 coolInner = vec3(0.32, 0.78, 1.0);
      vec3 coolOuter = vec3(0.38, 0.28, 0.95);
      finalColor = mix(coolOuter, coolInner, coreDensity);
    }

    // Shell-dependent alpha for true 3D multi-layer volumetric look
    float shellAlpha = uShellIndex < 0.5
      ? (0.58 * coreDensity + 0.28 * fresnel)
      : uShellIndex < 1.5
      ? (0.34 * coreDensity + 0.46 * fresnel)
      : (0.14 * coreDensity + 0.32 * fresnel);

    if (uCoolFlame > 0.5) {
      shellAlpha *= 0.55 + 0.15 * sin(uTime * 4.0);
    }

    // Subtle cellular flicker modulation
    shellAlpha *= 0.88 + 0.16 * vNoise;

    gl_FragColor = vec4(finalColor * (1.12 + o2Norm * 0.28), clamp(shellAlpha, 0.0, 0.92));
  }
`;

export function CombustionSim3D({
  initialGravity = '0g',
  initialMaterial = 'pmma',
  initialOxygen = 34,
  initialVentilation = 0.1,
  initialPressure = 4.3,
  compact = false,
  onStateChange,
}) {
  const [gravityKey, setGravityKey] = useState(initialGravity);
  const [materialKey, setMaterialKey] = useState(initialMaterial);
  const [oxygen, setOxygen] = useState(initialOxygen);
  const [ventilation, setVentilation] = useState(initialVentilation);
  const [pressure, setPressure] = useState(initialPressure);
  const [cameraPreset, setCameraPreset] = useState('iso');

  const mountRef = useRef(null);
  const simStateRef = useRef({
    gravityKey,
    materialKey,
    oxygen,
    ventilation,
    pressure,
    cameraPreset,
  });

  // Sync props when parent changes preset
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
    const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 100);

    // Root 3D group for user orbit rotation
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Scientific Chamber Floor Grid & Optical Measurement Ring
    const gridGroup = new THREE.Group();
    gridGroup.position.y = -1.25;
    const gridHelper = new THREE.GridHelper(9.5, 24, 0x2c3b42, 0x182228);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.55;
    gridGroup.add(gridHelper);

    // Circular chamber base ring
    const ringGeo = new THREE.RingGeometry(1.85, 1.9, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const baseRing = new THREE.Mesh(ringGeo, ringMat);
    baseRing.position.y = 0.01;
    gridGroup.add(baseRing);
    worldGroup.add(gridGroup);

    // 2. 3D Fuel Sample & CIR Metallic Sting Holder
    const sampleGroup = new THREE.Group();
    worldGroup.add(sampleGroup);

    // Fuel rod/cylinder sample
    const fuelGeo = new THREE.CapsuleGeometry(0.24, 0.85, 24, 36);
    fuelGeo.rotateZ(Math.PI / 2);
    const fuelMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3b4a54'),
      roughness: 0.38,
      metalness: 0.15,
      emissive: new THREE.Color('#ff5520'),
      emissiveIntensity: 0.22,
    });
    const fuelMesh = new THREE.Mesh(fuelGeo, fuelMat);
    sampleGroup.add(fuelMesh);

    // Metallic holder sting on right (-X to +X flow across sample)
    const stingGeo = new THREE.CylinderGeometry(0.055, 0.075, 1.8, 16);
    stingGeo.rotateZ(Math.PI / 2);
    const stingMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.3,
      metalness: 0.85,
    });
    const stingMesh = new THREE.Mesh(stingGeo, stingMat);
    stingMesh.position.set(-1.35, 0, 0);
    sampleGroup.add(stingMesh);

    // Vertical support strut down to chamber floor
    const strutGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.25, 16);
    const strutMesh = new THREE.Mesh(strutGeo, stingMat);
    strutMesh.position.set(-2.15, -0.62, 0);
    sampleGroup.add(strutMesh);

    // Lights for 3D fuel sample & chamber hardware
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 1.1);
    scene.add(ambientLight);
    const flamePointLight = new THREE.PointLight(0xff7b39, 3.2, 8.0);
    flamePointLight.position.set(0.2, 0.4, 0.5);
    worldGroup.add(flamePointLight);

    // 3. Multi-Layer 3D Volumetric Flame Shells (Inner Core, Reaction Sheet, Outer Halo)
    const flameGroup = new THREE.Group();
    worldGroup.add(flameGroup);

    const flameMaterials = [0, 1, 2].map((shellIdx) => {
      return new THREE.ShaderMaterial({
        vertexShader: FLAME_VERTEX_SHADER,
        fragmentShader: FLAME_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uGravity: { value: 0 },
          uAirflow: { value: 0.1 },
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

    const flameGeo = new THREE.SphereGeometry(0.72, 56, 56);
    const flameMeshes = flameMaterials.map((mat) => {
      const m = new THREE.Mesh(flameGeo, mat);
      m.frustumCulled = false;
      flameGroup.add(m);
      return m;
    });

    // 4. 3D Stoichiometric Reaction Boundary Geodesic Wireframe (visible especially in 0g / 1/6g)
    const boundaryGeo = new THREE.SphereGeometry(0.96, 20, 16);
    const boundaryMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const boundaryCage = new THREE.Mesh(boundaryGeo, boundaryMat);
    worldGroup.add(boundaryCage);

    // 5. 3D Soot, Ember & Cabin Airflow Particle System (1,100 particles in 3D space)
    const PARTICLE_COUNT = 950;
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pVelocities = new Float32Array(PARTICLE_COUNT * 3);
    const pPhases = new Float32Array(PARTICLE_COUNT);
    const pColors = new Float32Array(PARTICLE_COUNT * 3);

    const resetParticle = (i, initial = false) => {
      const st = simStateRef.current;
      const gVal = (GRAVITY_REGIMES[st.gravityKey] || GRAVITY_REGIMES['0g']).gValue;
      const wind = st.ventilation;
      const isStreamline = i % 5 === 0;

      if (isStreamline) {
        // Cabin ventilation streamline particle
        pPositions[i * 3 + 0] = initial ? -3.2 + Math.random() * 6.4 : -3.2;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
        pVelocities[i * 3 + 0] = 0.4 + wind * 5.2;
        pVelocities[i * 3 + 1] = 0;
        pVelocities[i * 3 + 2] = 0;
      } else {
        // Soot / thermal plume particle originating near reaction shell
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.35 + Math.random() * 0.45;
        pPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        pPositions[i * 3 + 1] = r * Math.cos(phi);
        pPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        // Velocity combines radial diffusion + buoyant updraft + forced convection wake
        const radialSpeed = 0.22 + Math.random() * 0.25;
        pVelocities[i * 3 + 0] =
          Math.sin(phi) * Math.cos(theta) * radialSpeed * (1 - gVal * 0.5) +
          wind * (3.8 + Math.random() * 2.4);
        pVelocities[i * 3 + 1] =
          Math.cos(phi) * radialSpeed * (1 - gVal * 0.4) +
          Math.pow(gVal, 0.45) * (1.35 + Math.random() * 1.1);
        pVelocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radialSpeed;
      }
      pPhases[i] = initial ? Math.random() : 0.01;
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      resetParticle(i, true);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    // Create soft circular sprite texture in memory
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const sCtx = spriteCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 64);
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      map: spriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particlePoints);

    // Interactive 3D Orbit State
    let targetYaw = -0.32;
    let targetPitch = 0.22;
    let currentYaw = -0.32;
    let currentPitch = 0.22;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

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
      targetPitch = Math.max(-0.65, Math.min(1.05, targetPitch + dy * 0.0075));
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const updateSize = () => {
      const w = Math.max(280, container.clientWidth || 640);
      const h = Math.max(240, container.clientHeight || 360);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.set(0, 0.35, 5.15);
      camera.lookAt(0.15, 0.1, 0);
      camera.updateProjectionMatrix();
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    // Smooth interpolated uniform values
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

      // Apply camera preset if changed
      if (!isDragging) {
        if (st.cameraPreset === 'side') {
          targetYaw += (0.0 - targetYaw) * 0.08;
          targetPitch += (0.06 - targetPitch) * 0.08;
        } else if (st.cameraPreset === 'top') {
          targetYaw += (0.0 - targetYaw) * 0.08;
          targetPitch += (0.95 - targetPitch) * 0.08;
        }
      }

      currentYaw += (targetYaw - currentYaw) * 0.14;
      currentPitch += (targetPitch - currentPitch) * 0.14;
      worldGroup.rotation.y = currentYaw;
      worldGroup.rotation.x = currentPitch;

      smoothG += (targetG - smoothG) * 0.12;
      smoothWind += (st.ventilation - smoothWind) * 0.12;
      smoothO2 += (st.oxygen - smoothO2) * 0.12;

      // Update fuel rod material & glowing pyrolysis core
      fuelMat.color.set(matCfg.sampleColor);
      fuelMat.emissive.set(
        st.physics?.isCoolFlame
          ? '#38bdf8'
          : smoothG < 0.05 && smoothWind < 0.08
          ? '#38bdf8'
          : matCfg.emissiveColor
      );
      fuelMat.emissiveIntensity = st.physics?.isExtinguished
        ? 0.02
        : 0.25 + (smoothO2 / 100) * 0.55;

      // Update flame shader uniforms
      flameMaterials.forEach((shMat) => {
        shMat.uniforms.uTime.value = clockTime;
        shMat.uniforms.uGravity.value = smoothG;
        shMat.uniforms.uAirflow.value = smoothWind;
        shMat.uniforms.uOxygen.value = smoothO2;
        shMat.uniforms.uCoolFlame.value = st.physics?.isCoolFlame ? 1.0 : 0.0;
        shMat.uniforms.uExtinguished.value = st.physics?.isExtinguished ? 1.0 : 0.0;
      });

      // Update 3D geodesic reaction boundary cage to match regime
      boundaryCage.visible = !st.physics?.isExtinguished;
      const cageScaleY = 1.0 + Math.pow(smoothG, 0.45) * 0.85;
      const cageScaleX = 1.0 + smoothWind * 1.45;
      boundaryCage.scale.set(cageScaleX, cageScaleY, 1.0);
      boundaryCage.position.set(smoothWind * 0.52, Math.pow(smoothG, 0.45) * 0.35, 0);
      boundaryCage.rotation.y = clockTime * 0.18;
      boundaryMat.color.set(
        smoothG < 0.05 && smoothWind < 0.08 ? 0x38bdf8 : 0xff8a58
      );
      boundaryMat.opacity = smoothG < 0.05 ? 0.18 : 0.08;

      // Point light color matches flame regime
      flamePointLight.color.set(
        smoothG < 0.05 && smoothWind < 0.08 ? 0x38bdf8 : 0xff7b39
      );
      flamePointLight.intensity = st.physics?.isExtinguished
        ? 0.2
        : 2.4 + (smoothO2 / 100) * 2.2;

      // Update 3D particles (soot agglomerates + convective wake + airflow streamlines)
      const posAttr = particleGeo.getAttribute('position');
      const colAttr = particleGeo.getAttribute('color');
      // Soot particle visual size scales up in 0g (SAME-R agglomeration discovery)
      particleMat.size =
        smoothG < 0.05 && smoothWind < 0.12 ? 0.17 : smoothG < 0.3 ? 0.14 : 0.11;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const isStreamline = i % 5 === 0;
        if (!prefersReducedMotion) {
          pPhases[i] += dt * (isStreamline ? 0.45 + smoothWind * 1.6 : 0.42);
          if (pPhases[i] >= 1.0 || pPositions[i * 3] > 3.6 || pPositions[i * 3 + 1] > 3.1) {
            resetParticle(i, false);
          } else {
            pPositions[i * 3 + 0] +=
              (pVelocities[i * 3 + 0] + smoothWind * 3.4) * dt;
            pPositions[i * 3 + 1] +=
              (pVelocities[i * 3 + 1] + Math.pow(smoothG, 0.45) * 1.45) * dt;
            pPositions[i * 3 + 2] += pVelocities[i * 3 + 2] * dt;
          }
        }

        const life = 1.0 - pPhases[i];
        if (isStreamline) {
          // Cool slate-cyan oxidizer airflow particle
          const streamIntensity = Math.min(0.65, 0.12 + smoothWind * 1.1) * life;
          pColors[i * 3 + 0] = 0.35 * streamIntensity;
          pColors[i * 3 + 1] = 0.72 * streamIntensity;
          pColors[i * 3 + 2] = 0.95 * streamIntensity;
        } else if (st.physics?.isExtinguished) {
          pColors[i * 3 + 0] = 0.2 * life;
          pColors[i * 3 + 1] = 0.25 * life;
          pColors[i * 3 + 2] = 0.3 * life;
        } else if (smoothG < 0.05 && smoothWind < 0.09) {
          // 0g blue-cyan diffusion & soot cluster particles
          pColors[i * 3 + 0] = 0.24 * life;
          pColors[i * 3 + 1] = 0.68 * life;
          pColors[i * 3 + 2] = 0.98 * life;
        } else {
          // Warm glowing ember -> cooling soot particle
          pColors[i * 3 + 0] = (0.98 * life + 0.35 * (1 - life)) * life;
          pColors[i * 3 + 1] = (0.54 * life + 0.22 * (1 - life)) * life;
          pColors[i * 3 + 2] = 0.16 * life * life;
        }
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      flameGeo.dispose();
      flameMaterials.forEach((m) => m.dispose());
      fuelGeo.dispose();
      fuelMat.dispose();
      stingGeo.dispose();
      stingMat.dispose();
      strutGeo.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      boundaryGeo.dispose();
      boundaryMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      spriteTex.dispose();
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

        {/* Top-Left HUD: Chamber & Physics Regime Pill */}
        <div className="c3d-hud-top-left">
          <span className="c3d-regime-pill">
            <span
              className="c3d-regime-dot"
              style={{
                background:
                  gravityKey === '0g' && ventilation < 0.09 ? '#38bdf8' : '#ff8a58',
              }}
            />
            {physics.isExtinguished
              ? 'QUENCHED / BELOW LOI'
              : physics.isCoolFlame
              ? 'FLEX COOL-FLAME REGIME (600–800 K)'
              : gravityKey === '0g' && ventilation < 0.09
              ? '3D SPHERICAL DIFFUSION FLAME'
              : ventilation >= 0.13
              ? '3D FORCED-CONVECTION WAKE CONE'
              : gravityKey === '1/6g'
              ? '3D LUNAR PARTIAL-BUOYANCY PLUME'
              : '3D BUOYANT TEARDROP PLUME'}
          </span>
          <span className="c3d-drag-hint">↻ Drag 3D chamber to orbit 360°</span>
        </div>

        {/* Top-Right HUD: Gravity Badge + Camera View Switcher */}
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

        {/* Bottom-Left HUD: Non-overlapping Material Sample Badge (Fixes 2D label collision!) */}
        <div className="c3d-hud-bottom-left">
          <span className="c3d-sample-title">{currentMaterial.name}</span>
          <span className="c3d-sample-sub">
            {currentMaterial.geometryLabel} · LOI {physics.effectiveLOI}% · {currentMaterial.experimentRef}
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

        {/* Non-overlapping Saffire-III Flashover Alert Banner */}
        {physics.flashoverWarning && (
          <div className="c3d-flashover-banner" role="status">
            <span className="c3d-flashover-dot" />
            <span>
              <strong>Forced convection ({ventilation.toFixed(2)} m/s):</strong> smoldering can
              transition to open flashover (NASA Saffire-III / BASS-II).
            </span>
          </div>
        )}
      </div>

      {/* 5-Column Live Telemetry Strip (Exact match to user's dashboard layout) */}
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
                physics.isCoolFlame || (gravityKey === '0g' && ventilation < 0.09)
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
            onClick={() => setGravityKey(g.id)}
          >
            <strong>{g.shortLabel}</strong>
            <span>{g.subLabel}</span>
          </button>
        ))}
      </div>

      {/* Fuel Material Selector (PMMA, Cotton Fabric, Silicone Rubber, Nomex III) */}
      <div className="c3d-material-grid" role="group" aria-label="Fuel Material">
        {Object.values(FUEL_MATERIALS).map((m) => (
          <button
            key={m.id}
            type="button"
            className={`c3d-material-btn ${materialKey === m.id ? 'is-active' : ''}`}
            onClick={() => setMaterialKey(m.id)}
          >
            {m.shortName}
          </button>
        ))}
      </div>

      {/* Interactive Environmental Sliders: O2Concentration, Cabin Ventilation, Ambient Pressure */}
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
            onChange={(e) => setOxygen(Number(e.target.value))}
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
            onChange={(e) => setVentilation(Number(e.target.value))}
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
            onChange={(e) => setPressure(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Concise Physics Note */}
      <div className="c3d-physics-footnote">
        <strong>Active Physics Regime ({currentGravity.badge}):</strong> {currentGravity.physicsSummary}
      </div>
    </div>
  );
}

/* ============================================================================
   Interactive Multi-Mode Scientific Data Visualizer (for AI Chat & Dashboard)
   ============================================================================ */

export function CombustionTelemetryChart({
  gravityKey = '0g',
  materialKey = 'pmma',
  oxygen = 34,
  ventilation = 0.1,
  pressure = 4.3,
  defaultTab = 'o2-curve',
}) {
  const [chartTab, setChartTab] = useState(defaultTab);
  const mat = FUEL_MATERIALS[materialKey] || FUEL_MATERIALS.pmma;

  // Generate O2 vs Flame Spread curves across 0g, 1/6g, 1g
  const o2Points = [14, 18, 21, 28, 34, 50, 70, 100];
  const buildO2Path = (gKey) => {
    return o2Points
      .map((o2Val, idx) => {
        const res = computeCombustionPhysics({
          gravityKey: gKey,
          materialKey,
          oxygen: o2Val,
          ventilation,
          pressure,
        });
        const x = 48 + ((o2Val - 14) / (100 - 14)) * 470;
        const y = 178 - Math.min(150, (res.spreadRate / 6.5) * 145);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Generate Ventilation Velocity vs Flame Spread curve (BASS-II / Saffire-III dome)
  const ventPoints = [0.0, 0.03, 0.07, 0.12, 0.18, 0.25, 0.35, 0.45, 0.55];
  const buildVentPath = (gKey) => {
    return ventPoints
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
  };

  const activePhysics = computeCombustionPhysics({
    gravityKey,
    materialKey,
    oxygen,
    ventilation,
    pressure,
  });

  const activeO2X = 48 + ((Math.max(14, Math.min(100, oxygen)) - 14) / 86) * 470;
  const activeO2Y = 178 - Math.min(150, (activePhysics.spreadRate / 6.5) * 145);

  const activeVentX = 48 + (Math.max(0, Math.min(0.55, ventilation)) / 0.55) * 470;
  const activeVentY = 178 - Math.min(150, (activePhysics.spreadRate / 5.5) * 145);

  return (
    <div className="c3d-viz-card">
      <div className="c3d-viz-header">
        <div>
          <span className="c3d-viz-eyebrow">INTERACTIVE TELEMETRY VISUALIZER · NASA PSI</span>
          <h4>
            {chartTab === 'o2-curve'
              ? `Oxygen Flammability & Spread Rate Curve (${mat.shortName})`
              : chartTab === 'airflow-curve'
              ? 'Cabin Ventilation Flashover & Quench Envelope (Saffire-III / BASS-II)'
              : 'Two-Stage Cool-Flame Temperature & Soot Agglomeration Profile (FLEX / SAME-R)'}
          </h4>
        </div>
        <div className="c3d-viz-tabs" role="tablist">
          <GlassSurface width="auto" height="auto" borderRadius={4} backgroundOpacity={0.08} style={{ display: 'inline-flex' }}>
            <button
              type="button"
              className={chartTab === 'o2-curve' ? 'is-active' : ''}
              onClick={() => setChartTab('o2-curve')}
            >
              O₂ vs Spread
            </button>
          </GlassSurface>
          <GlassSurface width="auto" height="auto" borderRadius={4} backgroundOpacity={0.08} style={{ display: 'inline-flex' }}>
            <button
              type="button"
              className={chartTab === 'airflow-curve' ? 'is-active' : ''}
              onClick={() => setChartTab('airflow-curve')}
            >
              Airflow Envelope
            </button>
          </GlassSurface>
          <GlassSurface width="auto" height="auto" borderRadius={4} backgroundOpacity={0.08} style={{ display: 'inline-flex' }}>
            <button
              type="button"
              className={chartTab === 'cool-soot' ? 'is-active' : ''}
              onClick={() => setChartTab('cool-soot')}
            >
              Cool Flame & Soot
            </button>
          </GlassSurface>
        </div>
      </div>

      {chartTab === 'o2-curve' && (
        <div className="c3d-viz-body">
          <svg viewBox="0 0 550 215" className="c3d-viz-svg" role="img" aria-label="Oxygen concentration versus flame spread rate chart">
            {/* Horizontal grid lines */}
            {[40, 85, 130, 178].map((y, idx) => (
              <g key={y}>
                <line x1="48" y1={y} x2="520" y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
                <text x="40" y={y + 4} textAnchor="end" fill="#7d8983" fontSize="10">
                  {['6.0x', '4.0x', '2.0x', '0.0x'][idx]}
                </text>
              </g>
            ))}

            {/* LOI Threshold Vertical Marker */}
            {(() => {
              const loiX = 48 + ((activePhysics.effectiveLOI - 14) / 86) * 470;
              return (
                <g>
                  <line x1={loiX} y1="26" x2={loiX} y2="178" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4 3" />
                  <text x={loiX + 5} y="36" fill="#ef4444" fontSize="9.5" fontWeight="600">
                    LOI Limit ({activePhysics.effectiveLOI}% O₂)
                  </text>
                </g>
              );
            })()}

            {/* 3 Gravity Curves */}
            <path d={buildO2Path('1g')} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
            <path d={buildO2Path('1/6g')} fill="none" stroke="#ff8a58" strokeWidth="2.5" />
            <path d={buildO2Path('0g')} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Current Operating Point Cursor */}
            <line x1={activeO2X} y1="26" x2={activeO2X} y2="178" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
            <circle
              cx={activeO2X}
              cy={activeO2Y}
              r="6"
              fill={gravityKey === '0g' ? '#38bdf8' : '#ff8a58'}
              stroke="#0d1213"
              strokeWidth="2"
            />
            <rect x={Math.min(410, Math.max(52, activeO2X - 55))} y={Math.max(18, activeO2Y - 32)} width="118" height="22" rx="5" fill="#161f22" stroke="rgba(255,138,88,0.45)" />
            <text x={Math.min(469, Math.max(111, activeO2X + 4))} y={Math.max(33, activeO2Y - 17)} textAnchor="middle" fill="#f7f3ed" fontSize="10" fontWeight="700">
              {oxygen}% O₂ → {activePhysics.spreadRate}x
            </text>

            {/* X-axis labels */}
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
            <span><i style={{ background: '#38bdf8' }} /> 0g Microgravity</span>
            <span><i style={{ background: '#ff8a58' }} /> 1/6g Lunar Base</span>
            <span><i style={{ background: '#94a3b8' }} /> 1g Earth Baseline</span>
          </div>
        </div>
      )}

      {chartTab === 'airflow-curve' && (
        <div className="c3d-viz-body">
          <svg viewBox="0 0 550 215" className="c3d-viz-svg" role="img" aria-label="Cabin ventilation velocity versus flame spread chart">
            {/* Flashover hazard zone shading (0.10 to 0.35 m/s) */}
            <rect
              x={48 + (0.1 / 0.55) * 470}
              y="26"
              width={((0.35 - 0.1) / 0.55) * 470}
              height="152"
              fill="rgba(239, 68, 68, 0.08)"
            />
            <text x={48 + (0.225 / 0.55) * 470} y="40" textAnchor="middle" fill="#f87171" fontSize="9.5" fontWeight="600">
              Saffire-III Forced-Convection Flashover Zone (0.10–0.35 m/s)
            </text>

            {[40, 85, 130, 178].map((y, idx) => (
              <g key={y}>
                <line x1="48" y1={y} x2="520" y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
                <text x="40" y={y + 4} textAnchor="end" fill="#7d8983" fontSize="10">
                  {['5.0x', '3.5x', '1.8x', '0.0x'][idx]}
                </text>
              </g>
            ))}

            <path d={buildVentPath('0g')} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            <path d={buildVentPath('1/6g')} fill="none" stroke="#ff8a58" strokeWidth="2.5" />

            <line x1={activeVentX} y1="26" x2={activeVentX} y2="178" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
            <circle cx={activeVentX} cy={activeVentY} r="6" fill="#ff8a58" stroke="#0d1213" strokeWidth="2" />
            <text x={Math.min(475, Math.max(95, activeVentX))} y={Math.max(36, activeVentY - 12)} textAnchor="middle" fill="#f7f3ed" fontSize="10" fontWeight="700">
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
            <span><i style={{ background: '#38bdf8' }} /> 0g Microgravity Flow Response</span>
            <span><i style={{ background: '#ff8a58' }} /> 1/6g Lunar Partial-Gravity Flow</span>
          </div>
        </div>
      )}

      {chartTab === 'cool-soot' && (
        <div className="c3d-viz-body c3d-viz-bars">
          <div className="c3d-bar-group">
            <div className="c3d-bar-head">
              <span>Hot-Flame Reaction Zone (CH* / OH* Visible Emission)</span>
              <strong>{activePhysics.flameTemp} K</strong>
            </div>
            <div className="c3d-bar-track">
              <div
                className="c3d-bar-fill"
                style={{
                  width: `${Math.min(100, (activePhysics.flameTemp / 2300) * 100)}%`,
                  background: 'linear-gradient(90deg, #ff8a58, #fde047)',
                }}
              />
            </div>
          </div>

          <div className="c3d-bar-group">
            <div className="c3d-bar-head">
              <span>FLEX Post-Extinction Cool-Flame Secondary Oxidation Plateau</span>
              <strong>680 K (Invisible Reignition Hazard)</strong>
            </div>
            <div className="c3d-bar-track">
              <div
                className="c3d-bar-fill"
                style={{
                  width: '34%',
                  background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                }}
              />
            </div>
          </div>

          <div className="c3d-bar-group">
            <div className="c3d-bar-head">
              <span>SAME-R Soot Agglomerate Diameter vs. Earth 1g</span>
              <strong>{activePhysics.sootClusterScale}× Larger Clusters</strong>
            </div>
            <div className="c3d-bar-track">
              <div
                className="c3d-bar-fill"
                style={{
                  width: `${Math.min(100, (activePhysics.sootClusterScale / 10) * 100)}%`,
                  background: 'linear-gradient(90deg, #34d399, #38bdf8)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CombustionSim3D;
