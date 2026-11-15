import React, { useState, useMemo } from 'react';
import Magnet from './Magnet';
import FlameSIChat from './FlameSIChat';
import SpotlightCard from './SpotlightCard';
import AnimatedContent from './AnimatedContent';
import CountUp from './CountUp';
import './SIDashboard.css';

const PRESETS = {
  moon: {
    id: 'moon',
    title: 'Lunar Surface Base',
    oxygen: 34,
    pressure: 10.2,
    gravity: '0.166g (Lunar)',
    gravityVal: 0.166,
    specs: '34% O₂ · 10.2 psi · 1/6 g',
    desc: 'Intermediate enriched atmosphere planned for Artemis Lunar Camp to reduce pre-breathe times. Significantly elevated material flammability.',
    envKey: 'Moon Base',
  },
  eva: {
    id: 'eva',
    title: 'Spacesuit EVA',
    oxygen: 100,
    pressure: 4.3,
    gravity: '0g (Microgravity)',
    gravityVal: 0,
    specs: '100% O₂ · 4.3 psi · 0 g',
    desc: 'Pure oxygen atmosphere at reduced pressure to maintain glove and joint flexibility. Highly volatile ignition conditions.',
    envKey: 'Spacesuit EVA',
  },
  iss: {
    id: 'iss',
    title: 'ISS Cabin Habitat',
    oxygen: 21,
    pressure: 14.7,
    gravity: '0g (Microgravity)',
    gravityVal: 0,
    specs: '21% O₂ · 14.7 psi · 0 g',
    desc: 'Earth-equivalent sea level atmosphere. In freefall, buoyancy ceases: spherical flames form and cool-flame reignitions occur.',
    envKey: 'ISS',
  },
  mars: {
    id: 'mars',
    title: 'Pressurized Mars Rover',
    oxygen: 28,
    pressure: 10.0,
    gravity: '0.38g (Martian)',
    gravityVal: 0.38,
    specs: '28% O₂ · 10.0 psi · 3/8 g',
    desc: 'Long-duration habitat with reduced pressure and partial gravity. Weak convection alters smoke transport and sensor response.',
    envKey: 'Mars Rover',
  },
};

export default function SIDashboard() {
  const [viewMode, setViewMode] = useState('simulator');
  const [activePreset, setActivePreset] = useState('moon');
  const [oxygen, setOxygen] = useState(34);
  const [pressure, setPressure] = useState(10.2);
  const [gravity, setGravity] = useState('0.166g (Lunar)');
  const [activeTab, setActiveTab] = useState('prevention');

  const experiments = typeof window !== 'undefined' && Array.isArray(window.EXPERIMENTS) 
    ? window.EXPERIMENTS 
    : [];

  const handlePresetSelect = (key) => {
    setActivePreset(key);
    const p = PRESETS[key];
    setOxygen(p.oxygen);
    setPressure(p.pressure);
    setGravity(p.gravity);
  };

  // Physics Calculations
  const metrics = useMemo(() => {
    // Oxygen Partial Pressure (psi)
    const pO2 = (oxygen / 100) * pressure;
    // Earth sea level standard pO2 = 0.21 * 14.7 = 3.087 psi
    const earthPO2 = 3.087;
    const pO2Ratio = pO2 / earthPO2;

    // Flammability rate delta relative to Earth
    // In enriched O2, flammability increases roughly with (pO2 / 3.087) * (O2 / 21)
    let flammabilityDelta = ((pO2Ratio * (oxygen / 21)) - 1) * 100;
    if (oxygen >= 90) flammabilityDelta = Math.max(flammabilityDelta, 180);

    // Hazard Score Calculation (0 - 100)
    let score = Math.round((oxygen * 0.45) + (pO2Ratio * 25) + ((15 - pressure) * 1.5));
    if (oxygen >= 95) score = Math.min(99, Math.max(88, score));
    else if (oxygen >= 30) score = Math.min(84, Math.max(62, score));
    else score = Math.min(55, Math.max(38, score));

    let statusLabel = 'Moderate Risk';
    let statusClass = 'status-moderate';
    if (score >= 80) {
      statusLabel = 'Critical Hazard';
      statusClass = 'status-critical';
    } else if (score >= 60) {
      statusLabel = 'Elevated Hazard';
      statusClass = 'status-elevated';
    } else if (score <= 35) {
      statusLabel = 'Baseline / Managed';
      statusClass = 'status-low';
    }

    return {
      pO2: pO2.toFixed(2),
      flammabilityDelta: flammabilityDelta >= 0 ? `+${flammabilityDelta.toFixed(0)}%` : `${flammabilityDelta.toFixed(0)}%`,
      score,
      statusLabel,
      statusClass,
    };
  }, [oxygen, pressure]);

  // Dynamic SI Ranking Engine
  const rankedInvestigations = useMemo(() => {
    if (!experiments.length) return [];

    const activeEnv = PRESETS[activePreset]?.envKey || '';

    const scored = experiments.map(item => {
      let score = 50;

      // Match crew environment relevance
      if (item.crewRelevance && item.crewRelevance.includes(activeEnv)) {
        score += 30;
      }

      // Oxygen matching
      const nums = (item.oxygen || '').match(/(\d+(?:\.\d+)?)/g);
      if (nums && nums.length > 0) {
        const minO2 = Math.min(...nums.map(Number));
        const maxO2 = Math.max(...nums.map(Number));
        if (oxygen >= minO2 && oxygen <= maxO2) {
          score += 25;
        } else {
          const dist = Math.min(Math.abs(oxygen - minO2), Math.abs(oxygen - maxO2));
          score += Math.max(0, 15 - dist);
        }
      }

      // High O2 bonus for CFI-G and Saffire
      if (oxygen > 30 && (item.id === 'acme-cfig' || item.id === 'saffire-i' || item.id === 'saffire-iii')) {
        score += 15;
      }

      // Detection bonus for smoke research
      if (item.id === 'same-r') score += 10;

      return {
        ...item,
        siScore: score,
        matchPercent: Math.min(99, Math.round(score * 0.95)),
      };
    });

    return scored.sort((a, b) => b.siScore - a.siScore).slice(0, 4);
  }, [experiments, activePreset, oxygen]);

  const handleInspectInExplorer = (id, targetO2) => {
    const exploreSection = document.querySelector('#explore');
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: 'smooth' });
    }
    const o2Input = document.querySelector('#oxygen');
    const searchInput = document.querySelector('#search');
    if (o2Input) {
      o2Input.value = targetO2 || oxygen;
      o2Input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  return (
    <section className="si-dashboard-section" id="si-intelligence">
      <AnimatedContent className="si-header">
        <div className="si-eyebrow-badge">
          <span className="pulse-dot"></span>
          Super Intelligence (SI) · Mission Fire Safety Engine
        </div>
        <h2>
          Predictive Fire Hazard <strong>Analysis & Ranking</strong>
        </h2>
        <p>
          Simulating microgravity and partial-gravity combustion dynamics across Moon, Mars, and ISS mission profiles.
          Powered by data synthesized from NASA's Physical Science Informatics (PSI) repository.
        </p>
      </AnimatedContent>

      {/* View Switcher: Simulator vs AI Chat */}
      <div className="si-view-switcher">
        <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<button
          type="button"
          className={`si-view-btn ${viewMode === 'simulator' ? 'is-active' : ''}`}
          onClick={() => setViewMode('simulator')}
        >
          Mission Hazard Simulator & Rankings
        </button>
</Magnet>
        <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<button
          type="button"
          className={`si-view-btn ${viewMode === 'chat' ? 'is-active' : ''}`}
          onClick={() => setViewMode('chat')}
        >
          Chat with FLAME-SI Co-Pilot (Chain-of-Thought)
        </button>
</Magnet>
      </div>

      {viewMode === 'chat' ? (
        <AnimatedContent trigger="mount" distance={0} duration={0.2}><FlameSIChat /></AnimatedContent>
      ) : (
        <>
          {/* Preset Environments */}
          <span className="si-preset-label">Select Mission Profile or Atmospheric Condition:</span>
      <AnimatedContent className="si-presets-grid">
        {Object.entries(PRESETS).map(([key, p]) => (
          <Magnet key={key} wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1} style={{ display: 'grid', minWidth: 0 }}>
          <SpotlightCard
            style={{ width: '100%', height: '100%' }}
            as="button"
            type="button"
            aria-pressed={activePreset === key}
            onClick={() => handlePresetSelect(key)}
            theme="dark"
            spotlightColor="#ff8a58"
            intensity={0.15}
            spotlightSize={240}
            softness={0.7}
            shape="circle"
            borderGlow={0.6}
            proximity={80}
            smoothing={0.3}
            grain={0}
            ambient={false}
            flare
            className={`si-preset-card ${activePreset === key ? 'is-active' : ''}`}
          >
            <span className="si-preset-title">{p.title}</span>
            <span className="si-preset-specs">{p.specs}</span>
            <span className="si-preset-desc">{p.desc}</span>
          </SpotlightCard>
          </Magnet>
        ))}
      </AnimatedContent>

      {/* Console: Hazard Meter on Left, SI Rankings on Right */}
      <div className="si-console-grid">
        {/* Left: Hazard Gauge & Atmosphere Controls */}
        <AnimatedContent className="si-gauge-panel" >
          <div className="si-gauge-header">
            <div>
              <h3>Fire Hazard Index</h3>
              <span className="si-hazard-demo-badge">Demo Estimate · Relative Scale</span>
            </div>
            <span className={`si-hazard-score-label ${metrics.statusClass}`}>
              {metrics.statusLabel}
            </span>
          </div>

          <div className="si-hazard-score-container">
            <span className={`si-hazard-score-value ${metrics.statusClass}`}>
              {metrics.score}
            </span>
            <div className="si-meter-bar">
              <div 
                className="si-meter-fill"
                style={{ 
                  width: `${metrics.score}%`,
                  backgroundColor: metrics.score >= 80 ? '#ef4444' : metrics.score >= 60 ? '#fb923c' : '#fbbf24'
                }}
              />
            </div>
          </div>

          <div className="si-metrics-table">
            <div className="si-metric-row">
              <span>Oxygen Concentration:</span>
              <span>{oxygen}%</span>
            </div>
            <div className="si-metric-row">
              <span>Cabin Pressure:</span>
              <span>{pressure.toFixed(1)} psi ({(pressure * 6.895).toFixed(0)} kPa)</span>
            </div>
            <div className="si-metric-row">
              <span>Oxygen Partial Pressure (PO₂):</span>
              <span>{metrics.pO2} psi</span>
            </div>
            <div className="si-metric-row">
              <span>Gravity Environment:</span>
              <span>{gravity}</span>
            </div>
            <div className="si-metric-row">
              <span>Flammability Spread vs Earth:</span>
              <span style={{ color: metrics.statusClass === 'status-critical' ? '#ef4444' : '#ff8a58' }}>
                {metrics.flammabilityDelta}
              </span>
            </div>
          </div>

          {/* Real-time Fine-Tuning Controls */}
          <div className="si-custom-controls">
            <div className="si-control-group">
              <label>
                <span>Oxygen Concentration:</span>
                <b>{oxygen}%</b>
              </label>
              <input
                type="range"
                min="14"
                max="100"
                value={oxygen}
                onChange={(e) => {
                  setOxygen(Number(e.target.value));
                  setActivePreset('custom');
                }}
              />
            </div>

            <div className="si-control-group">
              <label>
                <span>Cabin Total Pressure:</span>
                <b>{pressure.toFixed(1)} psi</b>
              </label>
              <input
                type="range"
                min="4"
                max="15"
                step="0.1"
                value={pressure}
                onChange={(e) => {
                  setPressure(Number(e.target.value));
                  setActivePreset('custom');
                }}
              />
            </div>
          </div>
        </AnimatedContent>

        {/* Right: SI Intelligent Investigation Rankings */}
        <AnimatedContent className="si-rankings-panel">
          <div className="si-rankings-header">
            <div>
              <h3>SI Priority Investigation Rankings</h3>
              <p>Top NASA PSI research investigations mapped to your mission's flammability criteria.</p>
            </div>
          </div>

          <div>
            {rankedInvestigations.map((inv, idx) => (
              <div key={inv.id} className={`si-rank-card ${idx === 0 ? 'top-rank' : ''}`}>
                <div className="si-rank-badge-row">
                  <span className="si-rank-num">RANK #{idx + 1} · {inv.category || 'NASA RESEARCH'}</span>
                  <span className="si-rank-match">
                    Relevance: <CountUp to={inv.matchPercent} suffix="%" duration={0.8} />
                  </span>
                </div>

                <h4>{inv.name}</h4>

                <div className="si-rank-tags">
                  <span className="si-tag">Fuel: {inv.fuel}</span>
                  <span className="si-tag">O₂: {inv.oxygen}</span>
                  <span className="si-tag">Hardware: {inv.hardware || 'CIR'}</span>
                </div>

                <div className="si-rank-insight">
                  <strong>SI Scientific Takeaway & Safety Directive:</strong>
                  {inv.siInterpretation || inv.objective}
                </div>

                <div className="si-rank-actions">
                  <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<button
                    type="button"
                    className="si-action-btn primary"
                    onClick={() => handleInspectInExplorer(inv.id, inv.oxygen ? parseInt(inv.oxygen, 10) : oxygen)}
                  >
                    Inspect in Explorer ↗
                  </button>
</Magnet>
                  <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<button
                    type="button"
                    className="si-action-btn secondary"
                    onClick={() => setViewMode('chat')}
                  >
                    Ask FLAME-SI
                  </button>
</Magnet>
                  {inv.sourceUrl && (
                    <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<a
                      href={inv.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="si-action-btn secondary"
                    >
                      NASA PSI Source ↗
                    </a>
</Magnet>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AnimatedContent>
      </div>

      {/* Pillars of Fire Safety & Terrestrial Impact Tabs */}
      <div className="si-pillars-container">
        <AnimatedContent className="si-tabs-nav" >
          <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<button
            type="button"
            className={`si-tab-btn ${activeTab === 'prevention' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('prevention')}
          >
            01. Prevention Protocols
          </button>
</Magnet>
          <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<button
            type="button"
            className={`si-tab-btn ${activeTab === 'detection' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('detection')}
          >
            02. Detection Dynamics
          </button>
</Magnet>
          <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<button
            type="button"
            className={`si-tab-btn ${activeTab === 'suppression' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('suppression')}
          >
            03. Suppression Architecture
          </button>
</Magnet>
          <Magnet wrapperClassName="magnet-wrapper" padding={35} magnetStrength={3} maxOffset={5} tilt={0} scale={1}>
<button
            type="button"
            className={`si-tab-btn ${activeTab === 'earth' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('earth')}
          >
            04. Earth Applications
          </button>
</Magnet>
        </AnimatedContent>

        <AnimatedContent className="si-tab-content-panel" animateKey={activeTab} trigger="mount" distance={0} duration={0.2}>
          {activeTab === 'prevention' && (
            <>
              <Magnet wrapperClassName="magnet-wrapper" padding={30} magnetStrength={6} maxOffset={3} tilt={0} scale={1} style={{ width: '100%', minWidth: 0 }}>
<div className="si-pillar-card">
                <h4>NASA-STD-6001 Compliance</h4>
                <p>
                  Materials that pass upward flame spread on Earth at 21% O₂ can ignite explosively under Lunar Base 
                  conditions (34% O₂). Rigorous Limiting Oxygen Index (LOI) calibration is required for all habitat fabrics.
                </p>
                <span className="si-pillar-badge">Validated by BASS-II & ACME-BRE</span>
              </div>
</Magnet>
              <Magnet wrapperClassName="magnet-wrapper" padding={30} magnetStrength={6} maxOffset={3} tilt={0} scale={1} style={{ width: '100%', minWidth: 0 }}>
<div className="si-pillar-card">
                <h4>Ventilation Velocity Thresholds</h4>
                <p>
                  In still air, solid flames self-extinguish through radiant heat loss. Cabin ventilation must stay 
                  strictly below 0.1 m/s in suspected overheating zones to prevent forced convection from feeding oxygen.
                </p>
                <span className="si-pillar-badge">Validated by Saffire-I & III</span>
              </div>
</Magnet>
            </>
          )}

          {activeTab === 'detection' && (
            <>
              <Magnet wrapperClassName="magnet-wrapper" padding={30} magnetStrength={6} maxOffset={3} tilt={0} scale={1} style={{ width: '100%', minWidth: 0 }}>
<div className="si-pillar-card">
                <h4>Soot Particle Agglomeration</h4>
                <p>
                  Without buoyancy to sweep soot away, smoke particles cluster into much larger agglomerates than on Earth. 
                  Standard optical ionization detectors can trigger false alarms or experience delayed response.
                </p>
                <span className="si-pillar-badge">Validated by SAME & SAME-R</span>
              </div>
</Magnet>
              <Magnet wrapperClassName="magnet-wrapper" padding={30} magnetStrength={6} maxOffset={3} tilt={0} scale={1} style={{ width: '100%', minWidth: 0 }}>
<div className="si-pillar-card">
                <h4>Dust Discrimination (DAFT-2)</h4>
                <p>
                  Lunar and Martian habitat air contains abrasive regolith dust. Dual-wavelength optical sensors must 
                  differentiate between airborne regolith particulates and pyrolyzed plastic aerosols.
                </p>
                <span className="si-pillar-badge">Validated by DAFT / DAFT-2</span>
              </div>
</Magnet>
            </>
          )}

          {activeTab === 'suppression' && (
            <>
              <Magnet wrapperClassName="magnet-wrapper" padding={30} magnetStrength={6} maxOffset={3} tilt={0} scale={1} style={{ width: '100%', minWidth: 0 }}>
<div className="si-pillar-card">
                <h4>Cool-Flame Reignition Hazards</h4>
                <p>
                  FLEX experiments discovered low-temperature (600 - 800 K) 'cool flames' burning invisibly after apparent 
                  thermal extinction. Fire suppression systems must continue inerting until fuel drops below pyrolysis limits.
                </p>
                <span className="si-pillar-badge">Validated by FLEX & FLEX-2</span>
              </div>
</Magnet>
              <Magnet wrapperClassName="magnet-wrapper" padding={30} magnetStrength={6} maxOffset={3} tilt={0} scale={1} style={{ width: '100%', minWidth: 0 }}>
<div className="si-pillar-card">
                <h4>Inert Dilution Limits (CO₂ & He)</h4>
                <p>
                  Diluting closed habitats with carbon dioxide or helium effectively depresses flame temperatures without 
                  displacing breathable air, preventing atmospheric overpressurization during spacecraft emergency venting.
                </p>
                <span className="si-pillar-badge">Validated by ACME CFI & CIR</span>
              </div>
</Magnet>
            </>
          )}

          {activeTab === 'earth' && (
            <>
              <Magnet wrapperClassName="magnet-wrapper" padding={30} magnetStrength={6} maxOffset={3} tilt={0} scale={1} style={{ width: '100%', minWidth: 0 }}>
<div className="si-pillar-card">
                <h4>Fine-Water-Mist Suppression</h4>
                <p>
                  Water-mist extinguishers engineered for the ISS avoid chemical toxicity and water damage. Today, 
                  this NASA technology protects hospital archives, server data centers, and cultural heritage museums on Earth.
                </p>
                <span className="si-pillar-badge">Terrestrial Fire Technology</span>
              </div>
</Magnet>
              <Magnet wrapperClassName="magnet-wrapper" padding={30} magnetStrength={6} maxOffset={3} tilt={0} scale={1} style={{ width: '100%', minWidth: 0 }}>
<div className="si-pillar-card">
                <h4>Firefighter Protective Gear</h4>
                <p>
                  High-temperature thermal barrier fabrics and lightweight composite oxygen breathing tanks originally 
                  developed for astronaut life support are now standard life-saving equipment for municipal firefighters worldwide.
                </p>
                <span className="si-pillar-badge">Global Firefighter Safety</span>
              </div>
</Magnet>
            </>
          )}
        </AnimatedContent>
      </div>
        </>
      )}
    </section>
  );
}
