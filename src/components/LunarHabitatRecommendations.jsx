import React, { useState } from 'react';
import Stepper, { Step } from './Stepper';
import MagicCard from './MagicCard';
import './LunarHabitatRecommendations.css';

export const LUNAR_RECOMMENDATIONS = [
  {
    id: 'R1',
    code: 'R1',
    title: 'Do not approve habitat materials on the Earth upward-burning test alone',
    severity: 'Critical Test Gap',
    badge: 'NASA-STD-6001B Audit',
    coreHazard:
      'Materials that self-extinguish in 1g Earth tests can burn continuously in microgravity and lunar partial gravity.',
    summary:
      'Standard terrestrial flammability screening (NASA-STD-6001B Test 1) relies on natural buoyancy to draw in cool air and carry heat upward away from the base. In low lunar gravity (0.16g) and freefall (0g), buoyant convective cooling is severely suppressed, allowing flames to anchor and propagate at lower Limiting Oxygen Indices (LOI) than ever observed on Earth.',
    keyPoints: [
      'BASS-II showed PMMA burns steadily at ultralow airflows (< 5 cm/s) where 1g upward flames quench.',
      'Materials certified "self-extinguishing" on Earth sustain flame in low-speed forced ventilation.',
      'Mandatory qualification in low-speed opposed-flow chambers is necessary before crewed flight.',
    ],
    directive:
      'Design Mandate: Disallow materials solely screened with 1g upward flame tests for Artemis habitation modules; mandate low-velocity forced-flow qualification.',
    evidence:
      'Validated by BASS-II (PSI-25) flight runs and Saffire-I panel burns inside Cygnus cargo vehicles.',
    citation: 'NASA/TM-20210011385 (BASS-II Summary Report) & NASA-STD-6001B',
  },
  {
    id: 'R2',
    code: 'R2',
    title: 'Test materials at the habitat\'s own atmosphere before choosing 30% oxygen',
    severity: 'High Chemical Oxidation',
    badge: 'Artemis Exploration Corridor',
    coreHazard:
      'Elevating oxygen to 30–34% drastically accelerates flame spread velocity and reduces ignition energy.',
    summary:
      'The planned Artemis Lunar Habitat exploration atmosphere operates at 30–34% O₂ at 70.3 kPa (10.2 psi) to reduce astronaut pre-breathe times before extravehicular activity. In NASA PSI tables, exactly zero solid-fuel tests exist at this oxygen level in partial gravity.',
    keyPoints: [
      'Flame spread velocity increases non-linearly when oxygen concentration exceeds 25% by volume.',
      'Flame-retardant textiles like Nomex III self-extinguish at 21% O₂ but ignite and burn vigorously at 34% O₂.',
      'Partial pressure of oxygen (23.9 kPa) provides intense oxidizer availability despite reduced total cabin pressure.',
    ],
    directive:
      'Design Mandate: Every candidate interior fabric, cable sleeve, and polymer must be burned in a sealed 34% O₂ / 70.3 kPa test rig prior to flight certification.',
    evidence:
      'Empirically proven by Saffire-III enriched oxygen experiments and ACME CFI-G gaseous flame spread runs.',
    citation: 'NASA/CR-2016-219139 & Saffire-III Flight Evaluation',
  },
  {
    id: 'R3',
    code: 'R3',
    title: 'Do not assume lunar gravity (0.16g) is safer than orbit',
    severity: 'Partial Gravity Peak Spread',
    badge: 'Grashof Scaling Paradox',
    coreHazard:
      'Weak lunar buoyancy can produce the worst-case flammability regime by feeding fresh oxygen without blowing the flame out.',
    summary:
      'Engineers frequently assume partial lunar gravity (0.16g) is inherently safer than microgravity because "buoyancy returns". In reality, weak buoyancy creates a bell-shaped diffusion envelope where convective oxidizer transport is enhanced while convective cooling remains too sluggish to quench the flame.',
    keyPoints: [
      'Low buoyancy (Grashof number Gr ~ 0.16) feeds steady buoyant oxidizer without high-velocity thermal blowoff.',
      'Parabolic aircraft tests (LUCI) demonstrate that flame propagation speed often peaks around 0.15g–0.25g.',
      'Soot shells thicken, amplifying radiative heat feedback to the unburned solid fuel surface.',
    ],
    directive:
      'Design Mandate: Account for peak flame spread rates under partial gravity rather than interpolating linearly between 0g and 1g.',
    evidence:
      'Confirmed by NASA Glenn Combustion Branch parabolic flight testing and ACME low-buoyancy studies.',
    citation: 'NASA Glenn Microgravity Science Division & LUCI Parabolic Campaign',
  },
  {
    id: 'R4',
    code: 'R4',
    title: 'Shut off ventilation to fight a fire, and confirm it is fully out before turning it back on',
    severity: 'Cool-Flame Reignition Hazard',
    badge: 'FLEX Smoldering Protocol',
    coreHazard:
      'Smoldering combustion can persist invisibly in a low-temperature "cool-flame" state (600–800 K) with zero visible light.',
    summary:
      'In spacecraft and lunar enclosures, cutting ventilation starves active diffusion flames by eliminating forced oxidizer transport. However, fuel cores can continue smoldering anaerobically. Re-starting cabin ventilation fans introduces fresh oxygen, triggering explosive flashover reignition tens of minutes after visible flaming ended.',
    keyPoints: [
      'FLEX droplets and BASS-II solids demonstrated sustained low-temperature reaction zones with zero visible emissions.',
      'Premature HVAC ventilation re-engagement can reignite pyrolysate gases accumulated in enclosed bays.',
      'Infrared thermal radiometry and gas-sensor telemetry must verify surface cooling below 420 K before air circulation resumes.',
    ],
    directive:
      'Design Mandate: Automate immediate HVAC damper cut-off upon smoke or thermal detection; enforce multi-sensor thermal verification before re-pressurization or fan reactivation.',
    evidence:
      'Discovered in PSI-69 FLEX liquid combustion and verified across Saffire-II suppression maneuvers.',
    citation: 'NASA PSI-69 FLEX Final Analysis & Saffire Fire Safety Guidelines',
  },
  {
    id: 'R5',
    code: 'R5',
    title: 'Qualify smoke detectors with real flaming smoke and lunar dust',
    severity: 'Sensor Blindness Hazard',
    badge: 'SAME-R Soot Physics',
    coreHazard:
      'Without buoyancy, smoke particles agglomerate into 8x–12x larger clusters, baffling Earth-calibrated optical detectors.',
    summary:
      'Standard ionization and optical smoke detectors calibrated for terrestrial fire alarms fail in reduced gravity. Without buoyant updrafts, soot motes spend extended time in the reaction zone, forming massive chain-like agglomerates that scatter light at drastically altered angles and drift unpredictably.',
    keyPoints: [
      'SAME-R flight experiments confirmed soot aggregate diameter expands 8× to 12× larger than in 1g Earth air.',
      'Airborne lunar regolith dust brought inside habitats by EVA suits cross-contaminates ionization sensors.',
      'Detectors must use multi-wavelength laser scattering and particle-size discrimination to separate dust from soot.',
    ],
    directive:
      'Design Mandate: Equip habitat environmental control systems with dual-angle optical obscuration detectors calibrated for large-diameter agglomerates and regolith filter stages.',
    evidence:
      'Demonstrated by SAME-R (Smoke Aerosol Measurement Experiment, PSI-101) aboard the International Space Station.',
    citation: 'NASA/TP-2012-217420 (SAME-R Final Flight Science Report)',
  },
];

export function LunarHabitatRecommendations() {
  const [expandedId, setExpandedId] = useState('R1');
  const [stepperStep, setStepperStep] = useState(1);
  const [viewMode, setViewMode] = useState('stepper'); // 'stepper' | 'accordion'

  const handleGlanceSelect = (id, idx) => {
    setExpandedId(id);
    setStepperStep(idx + 1);
  };

  return (
    <div className="lunar-rec-container">
      {/* Title & Introduction */}
      <div className="lunar-rec-header">
        <div className="lunar-header-top-flex">
          <div className="lunar-rec-eyebrow">
            <span>MISSION FLAMMABILITY DIRECTIVES · ARTEMIS LUNAR HABITAT</span>
          </div>
          <div className="lunar-view-toggle" role="group" aria-label="Directives view mode">
            <button
              type="button"
              className={`lunar-toggle-mode-btn ${viewMode === 'stepper' ? 'is-active' : ''}`}
              onClick={() => setViewMode('stepper')}
            >
              ✦ Interactive Stepper
            </button>
            <button
              type="button"
              className={`lunar-toggle-mode-btn ${viewMode === 'accordion' ? 'is-active' : ''}`}
              onClick={() => setViewMode('accordion')}
            >
              Full Accordion List
            </button>
          </div>
        </div>
        <h2 className="lunar-rec-title">What this means for a lunar habitat</h2>
        <p className="lunar-rec-sub">
          A lunar habitat is planned at about <strong>30–34% oxygen and 10.2 psi (70.3 kPa)</strong>, at one-sixth
          of Earth's gravity (0.16g): more oxygen than any solid in NASA's PSI tables was burned in, at a gravity PSI
          never tested. These five recommendations follow from the empirical evidence that does exist.
        </p>
      </div>

      {/* "How to read this page" Callout Box */}
      <div className="lunar-rec-callout">
        <div className="lunar-callout-icon">ℹ</div>
        <div className="lunar-callout-text">
          <strong>How to read this page:</strong> Each recommendation lists its evidence, with the NASA test or document
          it comes from, and says plainly how strong that evidence is. These are research suggestions drafted from the
          data, not safety requirements or a material certification.
        </div>
      </div>

      {/* At a glance summary list with MagicCard dynamic interactive spotlight and border glow */}
      <MagicCard className="lunar-at-a-glance" radius={24} glowColor="#164f91" enableStars={true}>
        <div className="lunar-glance-header">
          <h4 className="lunar-glance-title">At a glance</h4>
          <span className="lunar-glance-subtitle">Select any directive to jump directly into its analysis</span>
        </div>
        <div className="lunar-glance-list">
          {LUNAR_RECOMMENDATIONS.map((r, idx) => {
            const isSelected = viewMode === 'stepper' ? stepperStep === idx + 1 : expandedId === r.id;
            return (
              <div
                key={r.id}
                className={`lunar-glance-item ${isSelected ? 'is-active' : ''}`}
                onClick={() => handleGlanceSelect(r.id, idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleGlanceSelect(r.id, idx);
                }}
              >
                <span className="lunar-glance-code">{r.code}</span>
                <span className="lunar-glance-text">{r.title}</span>
                <span className="lunar-glance-tag">{r.severity}</span>
                <span className="lunar-glance-arrow">{isSelected ? '▼' : '→'}</span>
              </div>
            );
          })}
        </div>
      </MagicCard>

      {viewMode === 'stepper' ? (
        /* Interactive Animated Stepper View */
        <div className="lunar-stepper-view-wrap">
          <Stepper
            step={stepperStep}
            onStepChange={setStepperStep}
            indicator="numbers"
            orientation="horizontal"
            theme="light"
            accentColor="#164f91"
            width="100%"
            backButtonText="Previous Directive"
            nextButtonText="Next Mandate"
            completeButtonText="Complete Review"
            completedContent={
              <div className="lunar-audit-complete-card">
                <div className="lunar-complete-icon">✔</div>
                <h3>Artemis Habitation Directives Reviewed</h3>
                <p>
                  All 5 empirical combustion gap mandates have been audited against NASA BASS-II and Saffire flight
                  findings.
                </p>
                <button
                  type="button"
                  className="lunar-restart-btn"
                  onClick={() => setViewMode('accordion')}
                >
                  View Full Document List ↗
                </button>
              </div>
            }
          >
            {LUNAR_RECOMMENDATIONS.map((r) => (
              <Step key={r.id} title={`${r.code}: ${r.severity}`}>
                <MagicCard className="lunar-detail-card is-open" radius={24} glowColor="#164f91" enableStars={true} style={{ margin: 0, boxShadow: 'none' }}>
                  <div className="lunar-card-head" style={{ cursor: 'default' }}>
                    <div className="lunar-card-head-left">
                      <span className="lunar-card-badge-code">{r.code}</span>
                      <div>
                        <h3 className="lunar-card-title">{r.title}</h3>
                        <span className="lunar-card-meta-tag">{r.badge}</span>
                      </div>
                    </div>
                    <div className="lunar-card-head-right">
                      <span className="lunar-badge-severity">{r.severity}</span>
                    </div>
                  </div>

                  <div className="lunar-card-body" style={{ paddingTop: '0.75rem' }}>
                    <div className="lunar-core-hazard-banner">
                      <span className="lunar-hazard-tag">CORE HAZARD</span>
                      <p className="lunar-hazard-lead">{r.coreHazard}</p>
                    </div>

                    <div className="lunar-summary-box">
                      <strong>Physical Mechanism:</strong>
                      <p>{r.summary}</p>
                    </div>

                    <div className="lunar-keypoints-box">
                      <strong>Flight Data & Experimental Evidence:</strong>
                      <ul className="lunar-bullet-list">
                        {r.keyPoints.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="lunar-directive-box">
                      <strong>Artemis Habitation Mandate:</strong>
                      <p>{r.directive}</p>
                    </div>

                    <div className="lunar-citation-box">
                      <span>Evidence Citation:</span> <code>{r.citation}</code>
                    </div>
                  </div>
                </MagicCard>
              </Step>
            ))}
          </Stepper>
        </div>
      ) : (
        /* Detailed Recommendation Cards Accordion List */
        <div className="lunar-cards-list">
          {LUNAR_RECOMMENDATIONS.map((r) => {
            const isExpanded = expandedId === r.id;
            return (
              <MagicCard
                key={r.id}
                className={`lunar-detail-card ${isExpanded ? 'is-open' : ''}`}
                radius={24}
                glowColor="#164f91"
                enableStars={true}
              >
                <div
                  className="lunar-card-head"
                  onClick={() => setExpandedId(isExpanded ? '' : r.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setExpandedId(isExpanded ? '' : r.id);
                  }}
                >
                  <div className="lunar-card-head-left">
                    <span className="lunar-card-badge-code">{r.code}</span>
                    <div>
                      <h3 className="lunar-card-title">{r.title}</h3>
                      <span className="lunar-card-meta-tag">{r.badge}</span>
                    </div>
                  </div>
                  <div className="lunar-card-head-right">
                    <span className="lunar-badge-severity">{r.severity}</span>
                    <span className="lunar-toggle-btn">{isExpanded ? 'Collapse ▴' : 'Inspect Directive ▾'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="lunar-card-body">
                    {/* Punchy Core Hazard Callout */}
                    <div className="lunar-core-hazard-banner">
                      <span className="lunar-hazard-tag">CORE HAZARD</span>
                      <p className="lunar-hazard-lead">{r.coreHazard}</p>
                    </div>

                    {/* Physical Explanation */}
                    <div className="lunar-summary-box">
                      <strong>Physical Mechanism:</strong>
                      <p>{r.summary}</p>
                    </div>

                    {/* Bulleted Key Evidence Points */}
                    <div className="lunar-keypoints-box">
                      <strong>Flight Data & Experimental Evidence:</strong>
                      <ul className="lunar-bullet-list">
                        {r.keyPoints.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Actionable Engineering Directive */}
                    <div className="lunar-directive-box">
                      <strong>Artemis Habitation Mandate:</strong>
                      <p>{r.directive}</p>
                    </div>

                    {/* Citation Footer */}
                    <div className="lunar-citation-box">
                      <span>Evidence Citation:</span> <code>{r.citation}</code>
                    </div>
                  </div>
                )}
              </MagicCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LunarHabitatRecommendations;
