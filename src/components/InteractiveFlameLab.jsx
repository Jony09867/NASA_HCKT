import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import GlassSurface from './GlassSurface';
import './InteractiveFlameLab.css';

/* ══════════════════════════════════════════════════════════════
   Interactive Microgravity Combustion Physics Lab
   Full-featured in-chat simulator with:
   - 4 flame regimes (sphere, elongated, teardrop, hybrid)
   - 3 gravity presets (0g, 1/6g, 1g)
   - O₂ concentration & cabin ventilation sliders
   - Fuel material selector (PMMA, cotton, silicone, Nomex)
   - Live physics readout panel
   - Animated particle system for realism
   - Apply to Mission Simulator integration
   - Fully responsive design
   ══════════════════════════════════════════════════════════════ */

const FUEL_MATERIALS = [
  { id: 'PMMA', label: 'PMMA (Plexiglass)', ignition: 300, spread: 1.0, color: '#fb923c' },
  { id: 'cotton', label: 'Cotton Fabric', ignition: 210, spread: 1.35, color: '#facc15' },
  { id: 'silicone', label: 'Silicone Rubber', ignition: 450, spread: 0.6, color: '#a78bfa' },
  { id: 'nomex', label: 'Nomex III (NASA)', ignition: 370, spread: 0.45, color: '#34d399' },
];

const GRAVITY_PRESETS = [
  { id: '0g', label: '0g', subtitle: 'Microgravity', gVal: 0 },
  { id: '0.166g', label: '1/6g', subtitle: 'Lunar', gVal: 0.166 },
  { id: '1g', label: '1g', subtitle: 'Earth', gVal: 1.0 },
];

export default function InteractiveFlameLab({
  initialGravity = '0g',
  initialO2 = 34,
  initialFlow = 0.0,
  onApplyToSimulator,
  onApplyToDashboard,
  onInspectInExplorer,
}) {
  const [gravity, setGravity] = useState(initialGravity);
  const [o2, setO2] = useState(initialO2);
  const [flow, setFlow] = useState(initialFlow);
  const [fuel, setFuel] = useState('PMMA');
  const [applied, setApplied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const particlesRef = useRef([]);

  const isZeroG = gravity === '0g';
  const isLunar = gravity === '0.166g';
  const isEarth = gravity === '1g';
  const fuelData = FUEL_MATERIALS.find(f => f.id === fuel) || FUEL_MATERIALS[0];

  // ── Flame regime determination ──
  const regime = useMemo(() => {
    let name, color, shape, alert = null, desc;

    if (isEarth) {
      name = 'Buoyant Convective Teardrop';
      color = '#fb923c';
      shape = 'teardrop';
      desc = 'Hot gases rise via buoyancy, creating the classic teardrop flame shape seen on Earth.';
    } else if (isZeroG) {
      if (flow > 0.1) {
        name = 'Forced-Convection Flashover';
        color = '#ef4444';
        shape = 'elongated';
        alert = 'Airflow > 0.1 m/s causes forced convection: smoldering can transition to flashover (NASA Saffire-III).';
        desc = 'Forced airflow stretches the flame into an elongated shape, increasing fire spread risk dramatically.';
      } else {
        name = 'Spherical Diffusion Envelope';
        color = '#38bdf8';
        shape = 'sphere';
        desc = 'Without gravity or airflow, combustion gases diffuse equally in all directions, forming a perfect sphere.';
      }
    } else if (isLunar) {
      if (flow > 0.1) {
        name = 'Lunar Forced-Convection';
        color = '#f97316';
        shape = 'elongated';
        desc = 'Reduced gravity with forced airflow creates an elongated flame with weaker buoyancy effects.';
      } else {
        name = 'Lunar Transitional Hybrid';
        color = '#a855f7';
        shape = 'hybrid';
        desc = 'Partial gravity (1/6g) creates a transition between spherical and teardrop — a squat, breathing flame.';
      }
    }

    return { name, color, shape, alert, desc };
  }, [gravity, flow, isZeroG, isLunar, isEarth]);

  // ── Flame scale from O₂ and fuel ──
  const flameScale = useMemo(() => {
    const base = 0.6 + (o2 / 70);
    return Math.max(0.5, Math.min(1.8, base * fuelData.spread));
  }, [o2, fuelData.spread]);

  // ── Physics calculations ──
  const physics = useMemo(() => {
    const ambientP = isZeroG ? 4.3 : isLunar ? 10.2 : 14.7;
    const po2 = ((o2 / 100) * ambientP).toFixed(2);
    const gFactor = isZeroG ? 0.6 : isLunar ? 0.85 : 1.0;
    const flowFactor = 1 + (flow * 4);
    const spreadRate = ((o2 / 21) * gFactor * flowFactor * fuelData.spread).toFixed(2);
    const extinctionO2 = isZeroG ? 15 : isLunar ? 14 : 12;
    const isExtinct = o2 < extinctionO2;
    const flameTemp = isExtinct ? 0 : Math.round(800 + (o2 - 14) * 12 * fuelData.spread);
    const burnTime = isExtinct ? '—' : `${Math.max(1, Math.round(120 / (parseFloat(spreadRate) || 1)))}s`;

    return { po2, ambientP, spreadRate, extinctionO2, isExtinct, flameTemp, burnTime };
  }, [o2, flow, isZeroG, isLunar, fuelData.spread]);

  // ── Particle system for ambient glow ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const spawnParticle = () => {
      const cx = canvas.offsetWidth / 2;
      const cy = canvas.offsetHeight / 2 - 10;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.8;
      const gDrift = isEarth ? -0.4 : isLunar ? -0.15 : 0;
      return {
        x: cx + (Math.random() - 0.5) * 16,
        y: cy + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed + (flow * 40),
        vy: Math.sin(angle) * speed + gDrift,
        life: 1,
        decay: 0.008 + Math.random() * 0.015,
        r: 1 + Math.random() * 2.5,
        hue: regime.shape === 'sphere' ? 200 : regime.shape === 'hybrid' ? 280 : 25,
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      if (isPlaying && !physics.isExtinct) {
        // Spawn new particles
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push(spawnParticle());
        }
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.life * 0.5})`;
        ctx.fill();
        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, physics.isExtinct, regime.shape, flow, isEarth, isLunar, isZeroG]);

  // ── Apply to parent callback ──
  const applyCallback = onApplyToSimulator || onApplyToDashboard;

  const handleApply = useCallback(() => {
    if (!applyCallback) return;
    const gPreset = GRAVITY_PRESETS.find(g => g.id === gravity);
    const gLabel = `${gPreset?.gVal ?? 0}g (${gPreset?.subtitle ?? 'Custom'})`;
    const ambientP = isZeroG ? 4.3 : isLunar ? 10.2 : 14.7;
    applyCallback({
      oxygen: o2,
      pressure: ambientP,
      gravity: gLabel,
      flow,
      fuel,
      spreadRate: parseFloat(physics.spreadRate),
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  }, [applyCallback, gravity, o2, flow, fuel, physics.spreadRate, isZeroG, isLunar]);

  const handleReset = useCallback(() => {
    setGravity(initialGravity);
    setO2(initialO2);
    setFlow(initialFlow);
    setFuel('PMMA');
    setApplied(false);
  }, [initialGravity, initialO2, initialFlow]);

  // ── Danger level indicator ──
  const dangerLevel = useMemo(() => {
    if (physics.isExtinct) return { label: 'Extinguished', color: '#6b7280', level: 0 };
    const risk = parseFloat(physics.spreadRate);
    if (risk > 2.5) return { label: 'CRITICAL', color: '#ef4444', level: 3 };
    if (risk > 1.5) return { label: 'Elevated', color: '#f97316', level: 2 };
    if (risk > 0.8) return { label: 'Moderate', color: '#facc15', level: 1 };
    return { label: 'Low', color: '#34d399', level: 0 };
  }, [physics.spreadRate, physics.isExtinct]);

  return (
    <div className="flame-lab-container">
      {/* ── Header ── */}
      <div className="flame-lab-header">
        <div className="flame-lab-title">
          <span className="flame-lab-badge">Interactive Physics Lab</span>
          <h4>Microgravity Combustion Simulator</h4>
        </div>
        <div className="flame-lab-header-right">
          <span
            className="flame-lab-regime-tag"
            style={{ borderColor: regime.color, color: regime.color }}
          >
            {regime.name}
          </span>
          <button
            type="button"
            className="flame-lab-info-btn"
            onClick={() => setShowInfo(!showInfo)}
            title="About this flame regime"
          >
            ?
          </button>
        </div>
      </div>

      {/* ── Regime explanation tooltip ── */}
      {showInfo && regime.desc && (
        <div className="flame-lab-info-panel">
          <p>{regime.desc}</p>
        </div>
      )}

      {/* ── Danger level bar ── */}
      <div className="flame-danger-bar">
        <span className="flame-danger-label">Fire Risk:</span>
        <div className="flame-danger-track">
          <div
            className="flame-danger-fill"
            style={{
              width: `${Math.min(100, (dangerLevel.level / 3) * 100)}%`,
              background: dangerLevel.color,
            }}
          />
        </div>
        <span className="flame-danger-text" style={{ color: dangerLevel.color }}>
          {dangerLevel.label}
        </span>
      </div>

      {/* ── Visual Chamber ── */}
      <div className="flame-lab-chamber">
        <div className="flame-chamber-grid-lines" />
        <canvas ref={canvasRef} className="flame-particle-canvas" />

        {/* Airflow indicator */}
        {flow > 0.05 && (
          <div className="flame-flow-vectors" style={{ opacity: Math.min(1, flow * 2.5) }}>
            <span>→ {flow.toFixed(2)} m/s →</span>
          </div>
        )}

        {/* Gravity indicator */}
        <div className="flame-gravity-badge">
          <span>{isZeroG ? '0g' : isLunar ? '1/6g' : '1g'}</span>
        </div>

        {/* Dynamic Flame */}
        <div className={`flame-render-stage ${physics.isExtinct ? 'extinct' : ''}`}>
          {physics.isExtinct ? (
            <div className="flame-extinct-notice">
              <span className="extinct-icon">&#9711;</span>
              <span>O₂ below {physics.extinctionO2}% — flame extinguished</span>
            </div>
          ) : (
            <>
              {regime.shape === 'sphere' && (
                <div
                  className={`flame-sphere-glow ${isPlaying ? '' : 'paused'}`}
                  style={{ '--flame-scale': flameScale, '--flame-color': fuelData.color }}
                >
                  <div className="flame-core-droplet" />
                  <div className="flame-outer-ring" />
                </div>
              )}

              {regime.shape === 'elongated' && (
                <div
                  className={`flame-elongated-glow ${isPlaying ? '' : 'paused'}`}
                  style={{ '--flame-scale': flameScale, '--flame-color': fuelData.color }}
                >
                  <div className="flame-streak-tail" />
                  <div className="flame-core-droplet" />
                  <div className="flame-heat-shimmer" />
                </div>
              )}

              {regime.shape === 'teardrop' && (
                <div
                  className={`flame-teardrop-glow ${isPlaying ? '' : 'paused'}`}
                  style={{ '--flame-scale': flameScale, '--flame-color': fuelData.color }}
                >
                  <div className="flame-flicker-flame" />
                  <div className="flame-smoke-plume" />
                </div>
              )}

              {regime.shape === 'hybrid' && (
                <div
                  className={`flame-hybrid-glow ${isPlaying ? '' : 'paused'}`}
                  style={{ '--flame-scale': flameScale, '--flame-color': fuelData.color }}
                >
                  <div className="flame-core-droplet" />
                  <div className="flame-outer-ring" />
                </div>
              )}
            </>
          )}

          {/* Burner base */}
          {!physics.isExtinct && (
            <div className="flame-burner-mount">
              <span className="flame-fuel-label">{fuelData.label}</span>
            </div>
          )}
        </div>

        {/* Alert callout */}
        {regime.alert && !physics.isExtinct && (
          <div className="flame-lab-alert">
            <strong>Warning:</strong> {regime.alert}
          </div>
        )}
      </div>

      {/* ── Live Physics Readout ── */}
      <div className="flame-lab-readouts">
        <div className="flame-readout-item">
          <span className="readout-label">PO₂</span>
          <span className="readout-value">{physics.po2} psi</span>
        </div>
        <div className="flame-readout-item">
          <span className="readout-label">Spread Rate</span>
          <span className="readout-value" style={{
            color: parseFloat(physics.spreadRate) > 1.5 ? '#ef4444' : '#34d399'
          }}>
            {physics.spreadRate}x
          </span>
        </div>
        <div className="flame-readout-item">
          <span className="readout-label">Flame Temp</span>
          <span className="readout-value" style={{
            color: physics.flameTemp > 1200 ? '#ef4444' : '#ff8a58'
          }}>
            {physics.isExtinct ? '—' : `${physics.flameTemp} K`}
          </span>
        </div>
        <div className="flame-readout-item">
          <span className="readout-label">O₂ Level</span>
          <span className="readout-value" style={{ color: o2 > 50 ? '#ef4444' : '#ff8a58' }}>
            {o2}%
          </span>
        </div>
        <div className="flame-readout-item">
          <span className="readout-label">Burn Time</span>
          <span className="readout-value">{physics.burnTime}</span>
        </div>
        <div className="flame-readout-item">
          <span className="readout-label">Ambient P</span>
          <span className="readout-value">{physics.ambientP} psi</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flame-lab-controls">
        {/* Gravity selector */}
        <div className="flame-control-section">
          <label className="flame-control-label">Gravity Field</label>
          <div className="flame-btn-group">
            {GRAVITY_PRESETS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`flame-g-btn ${gravity === g.id ? 'active' : ''}`}
                onClick={() => setGravity(g.id)}
              >
                <span className="g-btn-main">{g.label}</span>
                <span className="g-btn-sub">{g.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fuel selector */}
        <div className="flame-control-section">
          <label className="flame-control-label">Fuel Material</label>
          <div className="flame-fuel-group">
            {FUEL_MATERIALS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`flame-fuel-btn ${fuel === f.id ? 'active' : ''}`}
                style={fuel === f.id ? { borderColor: f.color, color: f.color } : {}}
                onClick={() => setFuel(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="flame-sliders-grid">
          <div className="flame-slider-item">
            <div className="slider-label-row">
              <span>Oxygen (O₂)</span>
              <b style={{ color: o2 < physics.extinctionO2 ? '#6b7280' : o2 > 50 ? '#ef4444' : '#ff8a58' }}>
                {o2}%
                {o2 < physics.extinctionO2 && ' (Below LOC)'}
              </b>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={o2}
              onChange={(e) => setO2(Number(e.target.value))}
              className="flame-range-input"
              style={{
                '--range-pct': `${((o2 - 10) / 90) * 100}%`,
                '--range-color': o2 < physics.extinctionO2 ? '#6b7280' : o2 > 50 ? '#ef4444' : '#ff8a58',
              }}
            />
            <div className="slider-marks">
              <span>10%</span>
              <span className="mark-loc" style={{ left: `${((physics.extinctionO2 - 10) / 90) * 100}%` }}>
                LOC {physics.extinctionO2}%
              </span>
              <span>100%</span>
            </div>
          </div>

          <div className="flame-slider-item">
            <div className="slider-label-row">
              <span>Cabin Ventilation</span>
              <b style={{ color: flow > 0.1 ? '#ef4444' : '#ff8a58' }}>
                {flow.toFixed(2)} m/s
                {flow > 0.1 ? ' (Forced)' : flow > 0 ? ' (Quiescent)' : ' (Still)'}
              </b>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={flow}
              onChange={(e) => setFlow(Number(e.target.value))}
              className="flame-range-input"
              style={{
                '--range-pct': `${(flow / 0.5) * 100}%`,
                '--range-color': flow > 0.1 ? '#ef4444' : '#ff8a58',
              }}
            />
            <div className="slider-marks">
              <span>0</span>
              <span className="mark-threshold" style={{ left: '20%' }}>Threshold</span>
              <span>0.5 m/s</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flame-lab-actions">
          <GlassSurface
            as="button"
            type="button"
            className={`flame-action-btn primary ${applied ? 'applied' : ''}`}
            onClick={handleApply}
            disabled={!applyCallback}
            borderRadius={8}
          >
            {applied ? '✓ Applied to Simulator' : 'Apply to Mission Simulator'}
          </GlassSurface>
          {onInspectInExplorer && (
            <GlassSurface
              as="button"
              type="button"
              className="flame-action-btn secondary"
              onClick={() => onInspectInExplorer('saffire-iii', o2)}
              borderRadius={8}
            >
              Inspect Saffire-III ↗
            </GlassSurface>
          )}
          <GlassSurface
            as="button"
            type="button"
            className="flame-action-btn secondary"
            onClick={handleReset}
            borderRadius={8}
          >
            Reset
          </GlassSurface>
          <GlassSurface
            as="button"
            type="button"
            className={`flame-action-btn secondary ${isPlaying ? '' : 'paused-btn'}`}
            onClick={() => setIsPlaying(!isPlaying)}
            borderRadius={8}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </GlassSurface>
        </div>
      </div>
    </div>
  );
}
