import React, { useState } from 'react';
import './InteractiveFlameLab.css';

export default function InteractiveFlameLab({
  initialGravity = '0g',
  initialO2 = 34,
  initialFlow = 0.0,
  onApplyToDashboard,
  onInspectInExplorer,
}) {
  const [gravity, setGravity] = useState(initialGravity); // '0g', '0.166g', '1g'
  const [o2, setO2] = useState(initialO2);
  const [flow, setFlow] = useState(initialFlow); // 0 to 0.5 m/s
  const [fuel, setFuel] = useState('PMMA');
  const [applied, setApplied] = useState(false);

  // Compute combustion physics
  const isZeroG = gravity === '0g';
  const isLunar = gravity === '0.166g';
  const isEarth = gravity === '1g';

  // Flame regime
  let regimeName = 'Spherical Diffusion Flame';
  let regimeColor = '#38bdf8'; // Blue for microgravity cool/diffusion
  let flameShape = 'sphere';
  let alertWarning = null;

  if (isEarth) {
    regimeName = 'Buoyant Convective Teardrop Flame';
    regimeColor = '#fb923c';
    flameShape = 'teardrop';
  } else if (isZeroG) {
    if (flow > 0.1) {
      regimeName = 'Forced-Convection Flame Front (Flashover Risk)';
      regimeColor = '#ef4444';
      flameShape = 'elongated';
      alertWarning = 'Ventilation > 0.1 m/s supplies forced oxygen: smoldering transitions into flame flashover (NASA Saffire-III finding).';
    } else {
      regimeName = 'Quiescent Spherical Diffusion Envelope';
      regimeColor = '#38bdf8';
      flameShape = 'sphere';
    }
  } else if (isLunar) {
    regimeName = 'Partial-Gravity Transitional Flame (1/6 g)';
    regimeColor = flow > 0.1 ? '#f97316' : '#a855f7';
    flameShape = flow > 0.1 ? 'elongated' : 'hybrid';
  }

  // Flame size proportional to O2
  const flameScale = Math.max(0.7, Math.min(1.6, 0.6 + (o2 / 70)));

  const handleApply = () => {
    if (onApplyToDashboard) {
      const p = isZeroG ? 4.3 : isLunar ? 10.2 : 14.7;
      const gLabel = isZeroG ? '0g (Microgravity)' : isLunar ? '0.166g (Lunar)' : '1g (Earth)';
      onApplyToDashboard({ oxygen: o2, pressure: p, gravity: gLabel });
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  return (
    <div className="flame-lab-container">
      <div className="flame-lab-header">
        <div className="flame-lab-title">
          <span className="flame-lab-badge">Interactive Physics Lab</span>
          <h4>Microgravity Combustion Simulator</h4>
        </div>
        <span className="flame-lab-regime-tag" style={{ borderColor: regimeColor, color: regimeColor }}>
          {regimeName}
        </span>
      </div>

      {/* Visual Chamber */}
      <div className="flame-lab-chamber">
        <div className="flame-chamber-grid-lines" />

        {/* Ambient Flow Vector Arrows */}
        {flow > 0.05 && (
          <div className="flame-flow-vectors" style={{ opacity: Math.min(1, flow * 2.5) }}>
            <span>→ Airflow: {flow.toFixed(2)} m/s →</span>
          </div>
        )}

        {/* Dynamic Flame Render */}
        <div className="flame-render-stage">
          {flameShape === 'sphere' && (
            <div
              className="flame-sphere-glow"
              style={{
                transform: `scale(${flameScale})`,
                boxShadow: `0 0 ${20 * flameScale}px rgba(56, 189, 248, 0.4), inset 0 0 ${15 * flameScale}px #e0f2fe`,
              }}
            >
              <div className="flame-core-droplet" />
            </div>
          )}

          {flameShape === 'elongated' && (
            <div
              className="flame-elongated-glow"
              style={{
                transform: `scale(${flameScale})`,
                boxShadow: `0 0 28px rgba(239, 68, 68, 0.5)`,
              }}
            >
              <div className="flame-streak-tail" />
              <div className="flame-core-droplet" />
            </div>
          )}

          {flameShape === 'teardrop' && (
            <div
              className="flame-teardrop-glow"
              style={{
                transform: `scale(${flameScale})`,
              }}
            >
              <div className="flame-flicker-flame" />
              <div className="flame-smoke-plume" />
            </div>
          )}

          {flameShape === 'hybrid' && (
            <div
              className="flame-hybrid-glow"
              style={{
                transform: `scale(${flameScale})`,
              }}
            >
              <div className="flame-core-droplet" />
            </div>
          )}

          {/* Burner Base */}
          <div className="flame-burner-mount">
            <span className="flame-fuel-label">{fuel} Sample</span>
          </div>
        </div>

        {/* Warning Callout */}
        {alertWarning && (
          <div className="flame-lab-alert">
            <strong>Critical Airflow Threshold:</strong> {alertWarning}
          </div>
        )}
      </div>

      {/* Interactive Sliders & Toggles */}
      <div className="flame-lab-controls">
        <div className="flame-control-row">
          <label>Gravity Field:</label>
          <div className="flame-btn-group">
            <button
              type="button"
              className={`flame-g-btn ${isZeroG ? 'active' : ''}`}
              onClick={() => setGravity('0g')}
            >
              0g (Space / Freefall)
            </button>
            <button
              type="button"
              className={`flame-g-btn ${isLunar ? 'active' : ''}`}
              onClick={() => setGravity('0.166g')}
            >
              1/6g (Moon)
            </button>
            <button
              type="button"
              className={`flame-g-btn ${isEarth ? 'active' : ''}`}
              onClick={() => setGravity('1g')}
            >
              1g (Earth)
            </button>
          </div>
        </div>

        <div className="flame-sliders-grid">
          <div className="flame-slider-item">
            <div className="slider-label-row">
              <span>Oxygen (O₂):</span>
              <b>{o2}%</b>
            </div>
            <input
              type="range"
              min="14"
              max="100"
              value={o2}
              onChange={(e) => setO2(Number(e.target.value))}
            />
          </div>

          <div className="flame-slider-item">
            <div className="slider-label-row">
              <span>Cabin Ventilation:</span>
              <b style={{ color: flow > 0.1 ? '#ef4444' : '#ff8a58' }}>
                {flow.toFixed(2)} m/s {flow > 0.1 ? '(Hazard)' : '(Quiescent)'}
              </b>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.02"
              value={flow}
              onChange={(e) => setFlow(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Live Controller Action Buttons */}
        <div className="flame-lab-actions">
          <button
            type="button"
            className="flame-action-btn primary"
            onClick={handleApply}
          >
            {applied ? '✓ Synced to Simulator' : 'Apply to Mission Simulator'}
          </button>
          {onInspectInExplorer && (
            <button
              type="button"
              className="flame-action-btn secondary"
              onClick={() => onInspectInExplorer('saffire-iii', o2)}
            >
              Inspect Saffire-III in Library ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
