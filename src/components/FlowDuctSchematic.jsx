import React, { useState } from 'react';
import './FlowDuctSchematic.css';

export function FlowDuctSchematic({
  material = 'PMMA',
  ventilation = 0.08, // in m/s
  gravityKey = '0g',
  oxygen = 34,
}) {
  const [showSupplemental, setShowSupplemental] = useState(false);

  const cmSpeed = (ventilation * 100).toFixed(2);
  const isOpposed = true; // BASS-II uses opposed flow configuration

  return (
    <div className="flow-duct-card">
      <div className="flow-duct-header">
        <div>
          <span className="flow-duct-eyebrow">NASA HARDWARE APPARATUS · BASS-II FLOW DUCT</span>
          <h4 className="flow-duct-title">
            Why this flame looks like this: Cap flame on the rod tip
          </h4>
        </div>
        <span className="flow-duct-g-badge">
          {gravityKey === '0g' ? 'Microgravity Glovebox' : gravityKey === '1/6g' ? 'Lunar Partial Gravity' : '1g Terrestrial'}
        </span>
      </div>

      {/* Supplemental NTRS Context Accordion */}
      <div className="flow-duct-accordion">
        <button
          type="button"
          className="flow-duct-accordion-btn"
          onClick={() => setShowSupplemental(!showSupplemental)}
          aria-expanded={showSupplemental}
        >
          <span className="flow-duct-acc-icon">{showSupplemental ? '▼' : '▶'}</span>
          <span>Supplemental Non-PSI Context (NTRS - Excluded from Strict Mode) · what NASA reports say about this behaviour</span>
        </button>
        {showSupplemental && (
          <div className="flow-duct-accordion-body">
            <p>
              In BASS-II (Burning and Suppression of Solids-II), cylindrical fuel rods (6.35 mm diameter) are mounted
              along the centerline of a transparent flow duct inside the Microgravity Science Glovebox (MSG).
              Because natural buoyancy is absent in freefall, forced airflow past the rod creates an opposed-flow
              diffusion flame that wraps the hemispherical pyrolyzing tip (a "cap flame").
            </p>
            <p>
              When flow speed drops below ~5 cm/s, oxygen transport starves and radiative cooling extinguishes the flame.
              When flow exceeds ~25 cm/s, convective cooling and blowoff occur. At intermediate speeds with {oxygen}% O₂,
              steady stoichiometric burning continues until fuel depletion.
            </p>
            <div className="flow-duct-ntrs-cite">
              Source: NASA/TM-20210011385 (BASS-II Summary Report, NASA Glenn Research Center).
            </div>
          </div>
        )}
      </div>

      {/* Schematic SVG Diagram */}
      <div className="flow-duct-canvas-wrap">
        <svg
          viewBox="0 0 540 320"
          className="flow-duct-svg"
          role="img"
          aria-label="BASS-II Flow Duct Schematic in Microgravity Science Glovebox"
        >
          {/* Glovebox / Duct Outer Frame */}
          <rect
            x="110"
            y="25"
            width="320"
            height="250"
            rx="4"
            className="duct-boundary-box"
          />
          <text x="122" y="44" className="duct-label-dim">
            flow duct
          </text>
          <text x="365" y="160" className="duct-label-state">
            {gravityKey === '0g' ? 'microgravity' : gravityKey === '1/6g' ? 'lunar 0.16g' : 'earth 1g'}
          </text>

          {/* Airflow Velocity Vectors (Blue Arrows on left and right) */}
          {/* Left Arrow */}
          <line x1="150" y1="230" x2="150" y2="70" className="duct-flow-arrow" />
          <polygon points="150,56 144,72 156,72" className="duct-arrow-head" />

          {/* Right Arrow */}
          <line x1="330" y1="230" x2="330" y2="70" className="duct-flow-arrow" />
          <polygon points="330,56 324,72 336,72" className="duct-arrow-head" />

          {/* Airflow Speed Text */}
          <text x="345" y="130" className="duct-speed-text">
            {cmSpeed} cm/s
          </text>
          <text x="345" y="145" className="duct-speed-sub">
            {isOpposed ? 'opposed' : 'concurrent'}
          </text>

          {/* Retractable Hot-Wire Igniter Coil at the Top */}
          <line x1="210" y1="72" x2="295" y2="72" className="duct-igniter-wire" />
          <text x="302" y="75" className="duct-igniter-label">
            igniter (top)
          </text>

          {/* Fuel Rod Centerline */}
          <line x1="270" y1="70" x2="270" y2="245" className="duct-centerline" />

          {/* Cylindrical Fuel Rod Sample (6.35 mm / 0.25 inch standard BASS-II rod) */}
          <rect
            x="254"
            y="88"
            width="32"
            height="145"
            rx="3"
            className="duct-rod-sample"
          />

          {/* Pyrolyzing Tip / Flame Cap at Top of Rod */}
          <path
            d="M 254 94 Q 270 78 286 94 Z"
            className="duct-flame-cap"
          />
          <circle cx="270" cy="88" r="3" fill="#ff7b39" />

          {/* Diameter Dimension Measurement */}
          <line x1="250" y1="242" x2="290" y2="242" className="duct-dim-line" />
          <line x1="254" y1="238" x2="254" y2="246" className="duct-dim-tick" />
          <line x1="286" y1="238" x2="286" y2="246" className="duct-dim-tick" />
          <text x="270" y="260" textAnchor="middle" className="duct-dim-text">
            Ø 6.35 mm
          </text>

          {/* Stand / Mount Clamp at the base */}
          <rect x="246" y="228" width="48" height="8" rx="2" className="duct-mount-clamp" />
          <rect x="264" y="236" width="12" height="35" className="duct-mount-post" />
        </svg>
      </div>

      {/* Schematic Footer Reference */}
      <div className="flow-duct-footer">
        <span>BASS-II: flow duct in the Microgravity Science Glovebox, ISS</span>
        <span>BASS: flow duct in the Microgravity Science Glovebox, ISS</span>
      </div>
    </div>
  );
}

export default FlowDuctSchematic;
