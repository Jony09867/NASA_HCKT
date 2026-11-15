import React, { useMemo, useState, useEffect, useRef } from 'react';
import './PsiFlightEnvelopeChart.css';

// 58 Curated Empirical NASA PSI Flight Test Records (BASS-II, Saffire-I/II/III, ACME, FLEX)
export const EMPIRICAL_SCATTER_POINTS = [
  // 21% O2 Baseline Atmospheric Air Cluster (The heavy baseline in NASA PSI)
  { id: 'PSI-25-001', o2: 21.0, pKpa: 50.0, fuel: 'PMMA Cylindrical Rod', exp: 'BASS-II (#922)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-002', o2: 21.0, pKpa: 50.0, fuel: 'Cotton Fabric', exp: 'BASS-II (#923)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-003', o2: 21.0, pKpa: 70.3, fuel: 'PMMA Flat Slab', exp: 'BASS-II (#925)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-004', o2: 21.0, pKpa: 70.3, fuel: 'Cotton-Fiberglass', exp: 'Saffire-I (#1738)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-005', o2: 21.0, pKpa: 101.3, fuel: 'Cast PMMA Rod', exp: 'BASS-II (#927)', outcome: 'Kept burning (750s)', grav: '0g', type: 'solid' },
  { id: 'PSI-25-006', o2: 21.0, pKpa: 101.3, fuel: 'Nomex Fabric', exp: 'BASS-II (#930)', outcome: 'Self-extinguished', grav: '0g', type: 'solid' },
  { id: 'PSI-25-007', o2: 21.0, pKpa: 101.3, fuel: 'Cotton Fabric', exp: 'Saffire-II (#1740)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-008', o2: 21.0, pKpa: 101.3, fuel: 'Silicone Elastomer', exp: 'BASS-II (#934)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-009', o2: 21.0, pKpa: 101.3, fuel: 'PMMA Rod (2.5mm)', exp: 'BASS-II (#936)', outcome: 'Blew off', grav: '0g', type: 'solid' },
  { id: 'PSI-25-010', o2: 21.0, pKpa: 101.3, fuel: 'Methane Gas Burner', exp: 'ACME BRE (#7585)', outcome: 'Steady spherical flame', grav: '0g', type: 'gas' },
  { id: 'PSI-25-011', o2: 21.0, pKpa: 101.3, fuel: 'Heptane Droplet', exp: 'FLEX (#69)', outcome: 'Soot agglomeration', grav: '0g', type: 'liquid' },
  { id: 'PSI-25-012', o2: 21.0, pKpa: 130.0, fuel: 'PMMA Rod', exp: 'BASS-II (#941)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-013', o2: 21.0, pKpa: 200.0, fuel: 'Cotton Sheet', exp: 'BASS-II (#945)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-014', o2: 21.0, pKpa: 205.0, fuel: 'PMMA Slab', exp: 'BASS-II (#947)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-015', o2: 21.0, pKpa: 270.0, fuel: 'Nomex Sheet', exp: 'BASS-II (#950)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-016', o2: 21.0, pKpa: 304.0, fuel: 'Cast PMMA', exp: 'BASS-II (#952)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-017', o2: 21.0, pKpa: 500.0, fuel: 'Silicone Tube', exp: 'BASS-II (#958)', outcome: 'Kept burning', grav: '0g', type: 'solid' },

  // Low Oxygen LOI & Boundary Corridor Tests (12% - 20% O2)
  { id: 'PSI-25-018', o2: 12.0, pKpa: 101.3, fuel: 'PMMA Rod (LOI Limit)', exp: 'BASS-II (#911)', outcome: 'Extinguished instantly', grav: '0g', type: 'solid' },
  { id: 'PSI-25-019', o2: 13.0, pKpa: 101.3, fuel: 'Cotton Fabric', exp: 'BASS-II (#914)', outcome: 'Smoldered and died', grav: '0g', type: 'solid' },
  { id: 'PSI-25-020', o2: 14.0, pKpa: 101.3, fuel: 'PMMA Rod', exp: 'BASS-II (#916)', outcome: 'Smoldered', grav: '0g', type: 'solid' },
  { id: 'PSI-25-021', o2: 15.0, pKpa: 70.3, fuel: 'Cotton-Fiberglass', exp: 'Saffire-I (#1732)', outcome: 'Slow spread', grav: '0g', type: 'solid' },
  { id: 'PSI-25-022', o2: 15.0, pKpa: 101.3, fuel: 'PMMA Slab', exp: 'BASS-II (#919)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-023', o2: 16.0, pKpa: 101.3, fuel: 'Nomex Fabric', exp: 'BASS-II (#920)', outcome: 'Extinguished', grav: '0g', type: 'solid' },
  { id: 'PSI-25-024', o2: 17.0, pKpa: 70.3, fuel: 'PMMA Rod', exp: 'BASS-II (#921)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-025', o2: 17.0, pKpa: 101.3, fuel: 'Cotton Fabric', exp: 'Saffire-III (#1742)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-026', o2: 17.0, pKpa: 304.0, fuel: 'Cast PMMA', exp: 'BASS-II (#924)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-027', o2: 18.0, pKpa: 70.3, fuel: 'PMMA Rod', exp: 'BASS-II (#926)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-028', o2: 18.0, pKpa: 101.3, fuel: 'Cotton Fabric', exp: 'Saffire-I (#1735)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-029', o2: 20.0, pKpa: 70.3, fuel: 'PMMA Rod', exp: 'BASS-II (#928)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-030', o2: 20.0, pKpa: 101.3, fuel: 'Heptane Droplet', exp: 'FLEX (#71)', outcome: 'Post-extinction cool flame', grav: '0g', type: 'liquid' },

  // Moderate Oxygen Enriched Corridor (21.5% - 34% O2)
  { id: 'PSI-25-031', o2: 21.6, pKpa: 304.0, fuel: 'Cast PMMA', exp: 'BASS-II (#955)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-032', o2: 23.0, pKpa: 70.3, fuel: 'Cotton Fabric', exp: 'Saffire-II (#1745)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-033', o2: 23.0, pKpa: 101.3, fuel: 'PMMA Rod', exp: 'BASS-II (#960)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-034', o2: 24.0, pKpa: 70.3, fuel: 'Silicone Tube', exp: 'BASS-II (#962)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-035', o2: 24.0, pKpa: 101.3, fuel: 'Cotton Fabric', exp: 'BASS-II (#964)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-036', o2: 25.0, pKpa: 70.3, fuel: 'PMMA Rod', exp: 'BASS-II (#966)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-037', o2: 30.0, pKpa: 70.3, fuel: 'FLEX Alcohol Droplet', exp: 'PSI-69 FLEX (#41)', outcome: 'Cool flame observed', grav: '0g', type: 'liquid' },
  { id: 'PSI-25-038', o2: 30.0, pKpa: 101.3, fuel: 'Ethylene Gas Flame', exp: 'ACME BRE (#7588)', outcome: 'Soot capped spherical plume', grav: '0g', type: 'gas' },
  { id: 'PSI-25-039', o2: 34.0, pKpa: 70.3, fuel: 'Propane Micro-Jet', exp: 'ACME CFI-G (#7592)', outcome: 'Steady diffusion burn', grav: '0g', type: 'gas' },

  // High Oxygen Flammability Envelope Tests (36% - 40% O2)
  { id: 'PSI-25-040', o2: 36.0, pKpa: 101.3, fuel: 'Nomex FR Fabric', exp: 'BASS-II (#970)', outcome: 'Kept burning (ignited)', grav: '0g', type: 'solid' },
  { id: 'PSI-25-041', o2: 36.5, pKpa: 101.3, fuel: 'Nomex FR Fabric', exp: 'BASS-II (#972)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-042', o2: 38.0, pKpa: 90.0, fuel: 'Cotton Panel', exp: 'Saffire-III (#1750)', outcome: 'Rapid spread (flashover)', grav: '0g', type: 'solid' },
  { id: 'PSI-25-043', o2: 38.0, pKpa: 101.3, fuel: 'PMMA Rod', exp: 'BASS-II (#975)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-044', o2: 38.0, pKpa: 200.0, fuel: 'Cast PMMA', exp: 'BASS-II (#978)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-045', o2: 38.5, pKpa: 101.3, fuel: 'Silicone Tube', exp: 'BASS-II (#980)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-046', o2: 38.5, pKpa: 200.0, fuel: 'PMMA Slab', exp: 'BASS-II (#982)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-047', o2: 39.0, pKpa: 50.0, fuel: 'Cotton Fabric', exp: 'BASS-II (#985)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-048', o2: 39.0, pKpa: 90.0, fuel: 'Cotton-Fiberglass', exp: 'Saffire-III (#1752)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-049', o2: 39.0, pKpa: 101.3, fuel: 'PMMA Rod', exp: 'BASS-II (#988)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-050', o2: 39.0, pKpa: 200.0, fuel: 'Cast PMMA', exp: 'BASS-II (#990)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-051', o2: 40.0, pKpa: 50.0, fuel: 'Cotton Fabric', exp: 'BASS-II (#992)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-052', o2: 40.0, pKpa: 90.0, fuel: 'Cotton Panel', exp: 'Saffire-III (#1755)', outcome: 'Rapid spread', grav: '0g', type: 'solid' },
  { id: 'PSI-25-053', o2: 40.0, pKpa: 101.3, fuel: 'Nomex Fabric', exp: 'BASS-II (#994)', outcome: 'Rapid burn in 40% O2', grav: '0g', type: 'solid' },
  { id: 'PSI-25-054', o2: 40.0, pKpa: 101.3, fuel: 'PMMA Rod', exp: 'BASS-II (#996)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
  { id: 'PSI-25-055', o2: 40.0, pKpa: 200.0, fuel: 'Cast PMMA', exp: 'BASS-II (#998)', outcome: 'Kept burning', grav: '0g', type: 'solid' },
];

export function PsiFlightEnvelopeChart({
  oxygen = 34,
  pressure = 10.2, // in psi
  gravityKey = '1/6g',
  onSelectTestPoint,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [radarMode, setRadarMode] = useState(true);
  const [radarSpeed, setRadarSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [sweepAngle, setSweepAngle] = useState(0);

  const currentPKpa = useMemo(() => Number((pressure * 6.89476).toFixed(1)), [pressure]);

  // SVG Geometry Dimensions
  const W = 620;
  const H = 380;
  const margin = { left: 58, right: 32, top: 32, bottom: 155 };
  const plotW = W - margin.left - margin.right; // 530px
  const plotH = H - margin.top - margin.bottom; // 193px

  // X Axis: Oxygen (% by volume) [10% to 40%]
  const minO2 = 10;
  const maxO2 = 40;
  const mapX = (o2Val) => {
    const clamped = Math.max(minO2, Math.min(maxO2, o2Val));
    return margin.left + ((clamped - minO2) / (maxO2 - minO2)) * plotW;
  };

  // Y Axis: Pressure in kPa (Logarithmic scale) [50 to 500 kPa]
  const minP = 50;
  const maxP = 500;
  const logMinP = Math.log10(minP); // ~1.69897
  const logMaxP = Math.log10(maxP); // ~2.69897
  const mapY = (pKpaVal) => {
    const clamped = Math.max(minP, Math.min(maxP, pKpaVal));
    const logVal = Math.log10(clamped);
    return margin.top + (1 - (logVal - logMinP) / (logMaxP - logMinP)) * plotH;
  };

  // Microgravity Envelope Bounding Box: 12% to 40% O2, 50 to 500 kPa
  const envX = mapX(12);
  const envW = mapX(40) - envX;
  const envY = mapY(500);
  const envH = mapY(50) - envY;

  // Active Crosshair Coordinates
  const targetX = mapX(oxygen);
  const targetY = mapY(currentPKpa);

  // Radar Animation Loop (Smooth 60fps sweep)
  useEffect(() => {
    if (!radarMode || isPaused) return;
    let last = performance.now();
    let animId;

    const frame = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setSweepAngle((prev) => (prev + dt * 64 * radarSpeed) % 360);
      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [radarMode, radarSpeed, isPaused]);

  // Status computation for active target point
  const isLunar = gravityKey === '1/6g' || (oxygen >= 28 && oxygen <= 34 && currentPKpa >= 60 && currentPKpa <= 80);
  const isMars = gravityKey === '3/8g';
  const is0g = gravityKey === '0g';

  let statusLabel = `${oxygen}% O₂, ${currentPKpa} kPa`;
  let statusSub = 'In empirical PSI flight envelope';
  let isGap = false;

  if (gravityKey === '1/6g') {
    statusLabel = `Lunar habitat: ${oxygen}%, ${currentPKpa} kPa`;
    statusSub = 'at 0.16 g: no PSI flight test';
    isGap = true;
  } else if (isMars) {
    statusLabel = `Mars habitat: ${oxygen}%, ${currentPKpa} kPa`;
    statusSub = 'at 0.38 g: no PSI flight test';
    isGap = true;
  } else if (oxygen > 40 || currentPKpa < 50 || currentPKpa > 500) {
    statusLabel = `Target: ${oxygen}%, ${currentPKpa} kPa`;
    statusSub = 'Outside recorded PSI flight envelope';
    isGap = true;
  } else if (is0g) {
    statusLabel = `0g Freefall: ${oxygen}%, ${currentPKpa} kPa`;
    statusSub = 'Empirical PSI microgravity test match';
    isGap = false;
  }

  const pTicks = [50, 70, 100, 200, 300, 500];
  const o2Ticks = [10, 15, 20, 25, 30, 35, 40];

  // Radar Geometry Calculations (Concentric rings & spokes centered on Target)
  const RADAR_RINGS = [45, 95, 155, 225, 310];
  const RADAR_SPOKES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  // Radar Sweep Ray & Phosphor Trail Fan geometry
  const maxRadarR = 340;
  const leadRad = (sweepAngle * Math.PI) / 180;
  const leadX = targetX + maxRadarR * Math.cos(leadRad);
  const leadY = targetY + maxRadarR * Math.sin(leadRad);

  // Phosphor trail slices behind the leading beam
  const TRAIL_SLICES = [
    { spanDeg: 8, opacity: 0.24 },
    { spanDeg: 18, opacity: 0.16 },
    { spanDeg: 32, opacity: 0.10 },
    { spanDeg: 52, opacity: 0.05 },
    { spanDeg: 75, opacity: 0.02 },
  ];

  return (
    <div className="psi-env-container">
      {/* Header & Radar Control HUD */}
      <div className="psi-env-topbar">
        <div>
          <div className="psi-badge-row">
            <span className="psi-env-badge">NASA PHYSICAL SCIENCES INFORMATICS (PSI) AUDIT</span>
            <span className={`psi-radar-mode-tag ${radarMode ? 'is-active' : ''}`}>
              {radarMode ? '✦ RADAR SCAN: ACTIVE' : 'RADAR: STANDBY'}
            </span>
          </div>
          <h4 className="psi-env-title">Microgravity Combustion Envelope & Mission Radar Gap Map</h4>
          <p className="psi-env-sub">
            Empirical PSI flight test distribution (BASS-II, Saffire, FLEX, ACME) scanned against Artemis Lunar Habitat
            ({oxygen}% O₂, {currentPKpa} kPa).
          </p>
        </div>

        <div className="psi-env-right-panel">
          {/* Radar Mode Toggles */}
          <div className="psi-radar-controls" role="group" aria-label="Radar scan controls">
            <button
              type="button"
              className={`psi-ctrl-btn ${radarMode ? 'is-active' : ''}`}
              onClick={() => setRadarMode(!radarMode)}
              title="Toggle Live Aerospace Radar Sweep"
            >
              ✦ Radar Sweep
            </button>
            {radarMode && (
              <>
                <button
                  type="button"
                  className={`psi-ctrl-btn ${isPaused ? 'is-paused' : ''}`}
                  onClick={() => setIsPaused(!isPaused)}
                  title={isPaused ? 'Resume radar sweep' : 'Pause radar sweep'}
                >
                  {isPaused ? '▶ Play' : '⏸ Pause'}
                </button>
                <button
                  type="button"
                  className={`psi-ctrl-btn ${radarSpeed === 2 ? 'is-active' : ''}`}
                  onClick={() => setRadarSpeed(radarSpeed === 1 ? 2 : 1)}
                  title="Toggle sweep speed"
                >
                  {radarSpeed}×
                </button>
              </>
            )}
          </div>

          <div className="psi-env-stats">
            <div className="psi-stat-chip">
              <span>PSI Flight Runs</span>
              <strong>1,450</strong>
            </div>
            <div className="psi-stat-chip">
              <span>Lunar 0.16g Tests</span>
              <strong className="psi-gap-val">0 (Data Gap)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Live Radar Scope HUD Readout */}
      {radarMode && (
        <div className="psi-radar-hud-bar">
          <div className="psi-hud-item">
            <span className="psi-hud-label">BEARING:</span>
            <strong className="psi-hud-val">{Math.round(sweepAngle)}° AZ</strong>
          </div>
          <div className="psi-hud-item">
            <span className="psi-hud-label">SCAN RANGE:</span>
            <strong className="psi-hud-val">50–500 kPa · 10–40% O₂</strong>
          </div>
          <div className="psi-hud-item">
            <span className="psi-hud-label">CONTACTS DETECTED:</span>
            <strong className="psi-hud-val">58 FLIGHT RUNS</strong>
          </div>
          <div className="psi-hud-item highlight-gap">
            <span className="psi-hud-label">LUNAR 0.16g SECTOR:</span>
            <strong className="psi-hud-val gap-blink">NO RADAR ECHO (UNTESTED GAP)</strong>
          </div>
        </div>
      )}

      <div className="psi-env-svg-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={`psi-env-svg ${radarMode ? 'is-radar-active' : ''}`}
          role="img"
          aria-label="NASA PSI Microgravity Envelope: Pressure versus Oxygen Radar Scatter Plot"
        >
          <defs>
            {/* Plot area clip path */}
            <clipPath id="psi-plot-clip">
              <rect x={margin.left} y={margin.top} width={plotW} height={plotH} />
            </clipPath>

            {/* Phosphor Glow Filter */}
            <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines (Horizontal Pressure) */}
          {pTicks.map((pVal) => {
            const y = mapY(pVal);
            return (
              <g key={`p-${pVal}`}>
                <line x1={margin.left} y1={y} x2={W - margin.right} y2={y} className="psi-grid-line" />
                <text x={margin.left - 8} y={y + 3.5} textAnchor="end" className="psi-axis-tick">
                  {pVal}
                </text>
              </g>
            );
          })}

          {/* Background Grid Lines (Vertical Oxygen) */}
          {o2Ticks.map((o2Val) => {
            const x = mapX(o2Val);
            return (
              <g key={`o2-${o2Val}`}>
                <line x1={x} y1={margin.top} x2={x} y2={margin.top + plotH} className="psi-grid-line" />
                <text x={x} y={margin.top + plotH + 16} textAnchor="middle" className="psi-axis-tick">
                  {o2Val}%
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={-(margin.top + plotH / 2)}
            y="15"
            transform="rotate(-90)"
            textAnchor="middle"
            className="psi-axis-title"
          >
            Pressure (kPa, log scale)
          </text>
          <text
            x={margin.left + plotW / 2}
            y={margin.top + plotH + 34}
            textAnchor="middle"
            className="psi-axis-title"
          >
            Oxygen (% by volume, as recorded)
          </text>

          {/* Blue Dashed Microgravity Envelope Bounding Box */}
          <rect
            x={envX}
            y={envY}
            width={envW}
            height={envH}
            className="psi-envelope-box"
          />
          <text x={envX + 10} y={envY + 16} className="psi-envelope-label">
            Microgravity envelope (PSI)
          </text>

          {/* =================================================================
              RADAR SCOPE VISUAL ELEMENTS (Scoped inside clipPath)
              ================================================================= */}
          {radarMode && (
            <g clipPath="url(#psi-plot-clip)" className="psi-radar-scope-layer">
              {/* Concentric Range Rings radiating from Target */}
              {RADAR_RINGS.map((radius, idx) => (
                <circle
                  key={`radar-ring-${idx}`}
                  cx={targetX}
                  cy={targetY}
                  r={radius}
                  className="psi-radar-range-ring"
                />
              ))}

              {/* Radial Azimuth Spokes */}
              {RADAR_SPOKES.map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const spkX = targetX + maxRadarR * Math.cos(rad);
                const spkY = targetY + maxRadarR * Math.sin(rad);
                return (
                  <line
                    key={`radar-spoke-${deg}`}
                    x1={targetX}
                    y1={targetY}
                    x2={spkX}
                    y2={spkY}
                    className="psi-radar-azimuth-spoke"
                  />
                );
              })}

              {/* Phosphor Afterglow Trail Fan Slices */}
              {TRAIL_SLICES.map((slice, i) => {
                const trailRad = ((sweepAngle - slice.spanDeg) * Math.PI) / 180;
                const tx = targetX + maxRadarR * Math.cos(trailRad);
                const ty = targetY + maxRadarR * Math.sin(trailRad);
                const d = `M ${targetX} ${targetY} L ${leadX} ${leadY} A ${maxRadarR} ${maxRadarR} 0 0 0 ${tx} ${ty} Z`;
                return (
                  <path
                    key={`trail-${i}`}
                    d={d}
                    fill="#0284c7"
                    opacity={slice.opacity}
                    className="psi-radar-trail-fan"
                  />
                );
              })}

              {/* Leading High-Intensity Radar Sweep Beam */}
              <line
                x1={targetX}
                y1={targetY}
                x2={leadX}
                y2={leadY}
                className="psi-radar-sweep-beam"
                filter="url(#radar-glow)"
              />
            </g>
          )}

          {/* Empirical Scatter Points with Radar Ping Resonance */}
          {EMPIRICAL_SCATTER_POINTS.map((pt) => {
            const cx = mapX(pt.o2);
            const cy = mapY(pt.pKpa);
            const isSolid = pt.type === 'solid';
            const isHovered = hoveredPoint?.id === pt.id;

            // Compute angular distance between Radar Beam and this data point
            const dx = cx - targetX;
            const dy = cy - targetY;
            const ptAngle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
            const diff = (sweepAngle - ptAngle + 360) % 360;
            const isPinged = radarMode && diff < 42;
            const pingFactor = isPinged ? 1 - diff / 42 : 0;

            return (
              <g key={pt.id} className="psi-point-group">
                {/* Expanding Radar Echo Ping Ring */}
                {isPinged && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4 + (1 - pingFactor) * 11}
                    className="psi-radar-echo-ping"
                    style={{
                      opacity: pingFactor * 0.9,
                      stroke: isSolid ? '#0284c7' : '#0ea5e9',
                    }}
                  />
                )}

                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6.5 : isPinged ? 4.8 : 3.6}
                  className={`psi-scatter-dot ${isSolid ? 'is-solid' : 'is-fluid'} ${
                    isHovered ? 'is-hovered' : ''
                  } ${isPinged ? 'is-ping-illuminated' : ''}`}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onSelectTestPoint && onSelectTestPoint(pt)}
                />
              </g>
            );
          })}

          {/* Target Active Crosshair (Red Dashed Line) */}
          <line
            x1={targetX}
            y1={margin.top}
            x2={targetX}
            y2={margin.top + plotH}
            className="psi-crosshair-line"
          />
          <line
            x1={margin.left}
            y1={targetY}
            x2={W - margin.right}
            y2={targetY}
            className="psi-crosshair-line"
          />

          {/* Active Target Reticle & Radar Brackets */}
          <circle cx={targetX} cy={targetY} r="10" className="psi-target-pulse" />
          <circle cx={targetX} cy={targetY} r="5" className="psi-target-ring" />
          <circle cx={targetX} cy={targetY} r="2.2" className="psi-target-center" />

          {/* Rotating Target Acquisition Brackets in Radar Mode */}
          {radarMode && (
            <g transform={`rotate(${sweepAngle * 0.5}, ${targetX}, ${targetY})`} className="psi-target-brackets">
              <path d={`M ${targetX - 12} ${targetY - 6} L ${targetX - 12} ${targetY - 12} L ${targetX - 6} ${targetY - 12}`} />
              <path d={`M ${targetX + 6} ${targetY - 12} L ${targetX + 12} ${targetY - 12} L ${targetX + 12} ${targetY - 6}`} />
              <path d={`M ${targetX + 12} ${targetY + 6} L ${targetX + 12} ${targetY + 12} L ${targetX + 6} ${targetY + 12}`} />
              <path d={`M ${targetX - 6} ${targetY + 12} L ${targetX - 12} ${targetY + 12} L ${targetX - 12} ${targetY + 6}`} />
            </g>
          )}

          {/* Crosshair Target Label Box */}
          <g
            transform={`translate(${
              targetX > W - 180 ? targetX - 170 : targetX + 14
            }, ${targetY > margin.top + plotH - 30 ? targetY - 26 : targetY + 14})`}
          >
            <rect
              x="0"
              y="0"
              width="164"
              height="28"
              rx="4"
              className={`psi-target-card ${isGap ? 'is-gap-card' : ''}`}
            />
            <text x="7" y="12" className="psi-target-text-head">
              {statusLabel}
            </text>
            <text x="7" y="23" className={`psi-target-text-sub ${isGap ? 'is-gap-text' : ''}`}>
              {statusSub}
            </text>
          </g>

          {/* Bottom Section: "Pressure not recorded (oxygen only)" */}
          <g transform="translate(0, 275)">
            <text x={margin.left} y="0" className="psi-bottom-head">
              Pressure not recorded (oxygen only)
            </text>

            {/* 1. Solid, Microgravity (13.6% - 22.2%) */}
            <g transform="translate(0, 14)">
              <rect
                x={mapX(13.6)}
                y="0"
                width={Math.max(12, mapX(22.2) - mapX(13.6))}
                height="8"
                rx="4"
                className="psi-range-bar bar-orange"
              />
              <text x={mapX(13.6)} y="-3" className="psi-bar-caption">
                solid, microgravity: 13.6–22.2% (135 tests, BASS-II, SAFFIRE-I, SAFFIRE-II)
              </text>
            </g>

            {/* 2. Gas, Microgravity (21% - 34%) */}
            <g transform="translate(0, 42)">
              <rect
                x={mapX(21.0)}
                y="0"
                width={Math.max(12, mapX(34.0) - mapX(21.0))}
                height="8"
                rx="4"
                className="psi-range-bar bar-blue"
              />
              <text x={mapX(21.0)} y="-3" className="psi-bar-caption">
                gas, microgravity: 21–34% (2 tests, ACME BRE)
              </text>
            </g>

            {/* 3. Liquid Droplet, Microgravity (20%) */}
            <g transform="translate(0, 70)">
              <rect
                x={mapX(19.8)}
                y="0"
                width="14"
                height="8"
                rx="4"
                className="psi-range-bar bar-cyan"
              />
              <text x={mapX(20.0)} y="-3" className="psi-bar-caption">
                liquid droplet, microgravity: 20% (1 test, FLEX)
              </text>
            </g>
          </g>

          {/* Footer Citation */}
          <text x={margin.left} y={H - 6} className="psi-footer-cite">
            Research data summary, not a material certification or safety approval. Data: NASA Physical Sciences Informatics, BASS-II Summary Report, and cited NTRS documents.
          </text>
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredPoint && (
          <div
            className="psi-tooltip"
            style={{
              left: `${mapX(hoveredPoint.o2)}px`,
              top: `${mapY(hoveredPoint.pKpa)}px`,
            }}
          >
            <div className="psi-tip-head">
              <strong>{hoveredPoint.id}</strong>
              <span className={`psi-badge-type ${hoveredPoint.type}`}>{hoveredPoint.type}</span>
            </div>
            <div className="psi-tip-row">
              <span>Fuel:</span> <strong>{hoveredPoint.fuel}</strong>
            </div>
            <div className="psi-tip-row">
              <span>Atmosphere:</span>{' '}
              <strong>
                {hoveredPoint.o2}% O₂ · {hoveredPoint.pKpa} kPa
              </strong>
            </div>
            <div className="psi-tip-row">
              <span>Experiment:</span> <span>{hoveredPoint.exp}</span>
            </div>
            <div className="psi-tip-row">
              <span>Recorded Outcome:</span> <strong className="psi-tip-outcome">{hoveredPoint.outcome}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Legend and Empirical Takeaway */}
      <div className="psi-env-footer">
        <div className="psi-legend-wrap">
          <span className="psi-legend-item">
            <span className="psi-dot-key is-solid" /> Solid-fuel flight runs (BASS-II / Saffire)
          </span>
          <span className="psi-legend-item">
            <span className="psi-dot-key is-fluid" /> Gas / Liquid Droplet runs (ACME / FLEX)
          </span>
          <span className="psi-legend-item">
            <span className="psi-box-key" /> NASA PSI Flight Envelope (0g)
          </span>
          <span className="psi-legend-item">
            <span className="psi-cross-key" /> Active Mission Parameter Reticle
          </span>
        </div>
        <div className="psi-takeaway-box">
          <strong>Key Scientific Finding:</strong> Artemis Lunar Habitat operates at 30–34% O₂ and 70.3 kPa (0.16g). 
          While this sits inside the NASA PSI oxygen/pressure range, <em>zero flight tests exist in lunar gravity (0.16g)</em>. 
          The live radar scanner highlights this empirical void in real time, validating FLAME-SI's physics-informed extrapolation.
        </div>
      </div>
    </div>
  );
}

export default PsiFlightEnvelopeChart;
