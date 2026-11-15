import React, { useState } from 'react';
import './LunarHabitatRecommendations.css';

export const LUNAR_RECOMMENDATIONS = [
  {
    id: 'R1',
    code: 'R1',
    title: 'Do not approve habitat materials on the Earth upward-burning test alone',
    severity: 'Critical Flaw in Standard Test',
    badge: 'NASA-STD-6001B Test 1 Audit',
    summary:
      'Standard terrestrial upward flammability tests (NASA-STD-6001B Test 1) assume natural convection drives hot buoyant gases upwards away from the base. In reduced lunar gravity (0.16g) and microgravity, convective cooling is crippled, allowing flames to spread at lower limiting oxygen concentrations (LOI) than predicted by 1g tests.',
    evidence:
      'BASS-II and Saffire-I empirical burns demonstrated that materials passing 1g flammability screening burned steadily in microgravity at 21% O₂ under low-speed ventilation. Terrestrial certification alone is dangerously non-conservative.',
    citation: 'NASA/TM-20210011385 (BASS-II Final Report) & NASA-STD-6001B.',
  },
  {
    id: 'R2',
    code: 'R2',
    title: 'Test materials at the habitat\'s own atmosphere before choosing 30% oxygen',
    severity: 'High Chemical Oxidation Hazard',
    badge: 'Artemis Volatile Corridor',
    summary:
      'The planned Artemis Exploration Atmosphere operates at 30–34% O₂ at 70.3 kPa (10.2 psi). This partial pressure elevates oxygen mass fraction by ~50% over sea level. In NASA PSI, zero solid-fuel tests exist at this oxygen level under partial gravity.',
    evidence:
      'Terrestrial and 0g drop tower experiments show an exponential increase in flame spread velocity above 25% O₂. Nomex, which self-extinguishes at 21% O₂, burns vigorously at 34% O₂ in BASS-II tests.',
    citation: 'NASA/CR-2016-219139 & Saffire-III Enriched O₂ Flight Results.',
  },
  {
    id: 'R3',
    code: 'R3',
    title: 'Do not assume lunar gravity (0.16g) is safer than orbit',
    severity: 'Partial Gravity Peak Spread',
    badge: 'Grashof Scaling Paradox',
    summary:
      'Many engineers intuitively assume lunar gravity is safer than microgravity because "some buoyancy exists". In fact, partial buoyancy stretches diffusion shells into bell plumes while convective cooling remains too weak to blow them out—creating the worst-case flammability regime.',
    evidence:
      'Theoretical Grashof-Rayleigh scaling and parabolic flight tests (LUCI) show that partial gravity (~0.16g) often produces faster flame propagation and thicker pyrolyzing soot layers than either 0g or 1g.',
    citation: 'NASA Glenn Combustion Branch & ACME Partial Gravity Studies.',
  },
  {
    id: 'R4',
    code: 'R4',
    title: 'Shut off ventilation to fight a fire, and confirm it is fully out before turning it back on',
    severity: 'Cool-Flame Reignition Hazard',
    badge: 'FLEX Smoldering Protocol',
    summary:
      'In freefall and lunar habitats, turning off ventilation removes convective oxidizer transport, starving active flaming. However, smoldering pyrolysis can continue in a low-temperature "cool-flame" state (600–800 K) with near-zero visible light.',
    evidence:
      'NASA FLEX and Saffire experiments proved that reignition can occur instantly when ventilation fans are re-energized, even tens of minutes after visible flaming ceased.',
    citation: 'NASA PSI-69 FLEX Project & Saffire-II Fire Safety Directive.',
  },
  {
    id: 'R5',
    code: 'R5',
    title: 'Qualify smoke detectors with real flaming smoke and lunar dust',
    severity: 'Sensor Blindness Hazard',
    badge: 'SAME-R Soot Physics',
    summary:
      'Spacecraft optical obscuration detectors calibrated for Earth soot fail in low gravity because soot agglomerates grow 8x to 12x larger due to prolonged residence time without buoyant escape.',
    evidence:
      'NASA SAME-R (Smoke Aerosol Measurement Experiment) demonstrated that low-gravity soot scatters light at drastically different angles, while lunar regolith dust cross-contaminates ionization chambers.',
    citation: 'NASA/TP-2012-217420 (SAME-R Final Flight Science Report).',
  },
];

export function LunarHabitatRecommendations() {
  const [expandedId, setExpandedId] = useState('R1');

  return (
    <div className="lunar-rec-container">
      {/* Title & Introduction */}
      <div className="lunar-rec-header">
        <span className="lunar-rec-eyebrow">MISSION FLAMMABILITY POLICY · ARTEMIS LUNAR HABITAT</span>
        <h2 className="lunar-rec-title">What this means for a lunar habitat</h2>
        <p className="lunar-rec-sub">
          A lunar habitat is planned at about <strong>30% oxygen and 10.2 psi (70.3 kPa)</strong>, at one-sixth of
          Earth's gravity: more oxygen than any solid in NASA's PSI tables was burned in, at a gravity PSI never
          tested. These five recommendations follow from the evidence that does exist.
        </p>
      </div>

      {/* "How to read this page" Callout Box (Matching Rival Screen 9) */}
      <div className="lunar-rec-callout">
        <strong>How to read this page:</strong> Each recommendation lists its evidence, with the NASA test or document
        it comes from, and says plainly how strong that evidence is. These are research suggestions drafted from the
        data, not safety requirements or a material certification.
      </div>

      {/* At a glance summary list */}
      <div className="lunar-at-a-glance">
        <h4 className="lunar-glance-title">At a glance</h4>
        <div className="lunar-glance-list">
          {LUNAR_RECOMMENDATIONS.map((r) => (
            <div
              key={r.id}
              className={`lunar-glance-item ${expandedId === r.id ? 'is-active' : ''}`}
              onClick={() => setExpandedId(r.id)}
            >
              <span className="lunar-glance-code">{r.code}</span>
              <span className="lunar-glance-text">{r.title}</span>
              <span className="lunar-glance-arrow">{expandedId === r.id ? '▼' : '→'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Recommendation Cards */}
      <div className="lunar-cards-list">
        {LUNAR_RECOMMENDATIONS.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className={`lunar-detail-card ${isExpanded ? 'is-open' : ''}`}>
              <div className="lunar-card-head" onClick={() => setExpandedId(isExpanded ? '' : r.id)}>
                <div className="lunar-card-head-left">
                  <span className="lunar-card-badge-code">{r.code}</span>
                  <h3 className="lunar-card-title">{r.title}</h3>
                </div>
                <div className="lunar-card-head-right">
                  <span className="lunar-badge-severity">{r.severity}</span>
                  <span className="lunar-toggle-btn">{isExpanded ? 'Collapse' : 'Expand'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="lunar-card-body">
                  <div className="lunar-summary-box">
                    <strong>Operational Finding:</strong> {r.summary}
                  </div>
                  <div className="lunar-evidence-box">
                    <strong>NASA Empirical Evidence:</strong> {r.evidence}
                  </div>
                  <div className="lunar-citation-box">
                    <span>Source:</span> <code>{r.citation}</code>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LunarHabitatRecommendations;
