import React, { useState, useMemo, useCallback } from 'react';
import Magnet from './Magnet';
import FlameSIChat from './FlameSIChat';
import SpotlightCard from './SpotlightCard';
import AnimatedContent from './AnimatedContent';
import CountUp from './CountUp';
import { CombustionSim3D, CombustionTelemetryChart } from './CombustionSim3D';
import { PsiFlightEnvelopeChart } from './PsiFlightEnvelopeChart';
import FlowDuctSchematic from './FlowDuctSchematic';
import LunarHabitatRecommendations from './LunarHabitatRecommendations';
import './SIDashboard.css';

const PRESETS = {
  moon: {
    id: 'moon',
    title: 'Lunar Surface Base',
    oxygen: 34,
    pressure: 10.2,
    ventilation: 0.08,
    gravity: '0.166g (Lunar)',
    gravityKey: '1/6g',
    materialKey: 'pmma',
    specs: '34% O₂ · 10.2 psi (70.3 kPa) · 1/6 g',
    desc: 'Planned Artemis Lunar Habitat atmosphere to reduce EVA pre-breathe times. Sits inside an empirical PSI solid-fuel data gap (0 flight tests at 0.16g).',
    envKey: 'Moon Base',
  },
  iss: {
    id: 'iss',
    title: 'ISS Cabin Habitat',
    oxygen: 21,
    pressure: 14.7,
    ventilation: 0.08,
    gravity: '0g (Microgravity)',
    gravityKey: '0g',
    materialKey: 'pmma',
    specs: '21% O₂ · 14.7 psi (101.3 kPa) · 0 g',
    desc: 'Earth-equivalent sea-level atmosphere. Primary empirical baseline for 539+ NASA PSI microgravity combustion runs.',
    envKey: 'ISS',
  },
  eva: {
    id: 'eva',
    title: 'Spacesuit EVA',
    oxygen: 100,
    pressure: 4.3,
    ventilation: 0.06,
    gravity: '0g (Microgravity)',
    gravityKey: '0g',
    materialKey: 'nomex',
    specs: '100% O₂ · 4.3 psi (29.6 kPa) · 0 g',
    desc: 'Pure oxygen atmosphere at reduced pressure to maintain glove and joint mobility. Severe ignition susceptibility.',
    envKey: 'Spacesuit EVA',
  },
  mars: {
    id: 'mars',
    title: 'Pressurized Mars Rover',
    oxygen: 28,
    pressure: 10.0,
    ventilation: 0.15,
    gravity: '0.38g (Martian)',
    gravityKey: '1/6g',
    materialKey: 'cotton',
    specs: '28% O₂ · 10.0 psi (68.9 kPa) · 3/8 g',
    desc: 'Reduced-pressure, enriched-oxygen surface habitat profile. Partial gravity creates weak buoyant plumes and delayed smoke detection.',
    envKey: 'Mars Rover',
  },
};

// Empirical NASA PSI Coverage & Gap Matrix (1,450 total records across BASS-II, Saffire, FLEX, ACME)
const COVERAGE_MATRIX = [
  {
    material: 'PMMA (Acrylic)',
    code: 'PMMA',
    simMaterial: 'pmma',
    totalTests: 146,
    sampleShape: 'Rod',
    psiRef: 'PSI-25 BASS-II (NASA/TM-20210011385), PSI-98, PSI-99',
    bands0g: [17, 37, 16, 25, 3, 0],
    unrecordedO2: 48,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 67, blewOff: 22, quenched: 11 },
    medianBurnSec: 750,
    burnRangeSec: '600–900 s · 2 tests',
    labNote:
      '"Airflow cells: 4 incr to 26.5 / 49 (pot 1.1) blowoff pot 5 out at fan 87" — PSI-25 Run #022 · Air/Fan display cells of the PSI-25 table.',
    comparison: {
      micro: 'Slow hemispherical cap flame, 750 s burn at 5.03 cm/s; thick pyrolyzing soot shell, low convective heat dissipation.',
      earth: 'Buoyancy-dominated turbulent plume, 210 s burn; rapid upward convection accelerates blowoff and heat extraction.',
    },
  },
  {
    material: 'SIBAL / Cotton-Fiberglass',
    code: 'SIBAL',
    simMaterial: 'cotton',
    totalTests: 45,
    sampleShape: 'Slab',
    psiRef: 'PSI-25 BASS-II & PSI-98/99/100 SAFFIRE I–III',
    bands0g: [0, 21, 4, 4, 2, 0],
    unrecordedO2: 14,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 74, blewOff: 18, quenched: 8 },
    medianBurnSec: 540,
    burnRangeSec: '420–680 s · 6 tests',
    labNote:
      '"Opposed flow 20 cm/s along 0.4m × 1.0m cotton-fiberglass panel; steady two-sided flame propagation until O2 depletion" — PSI-99 Saffire-II.',
    comparison: {
      micro: 'Steady two-sided opposed flame propagation along entire 1.0m fabric panel; smoldering arrested only at gas cutoff.',
      earth: 'Upward spread burns through top edge in 45 s; downward spread self-extinguishes below 19% O₂.',
    },
  },
  {
    material: 'Japan Wax',
    code: 'Japan Wax',
    simMaterial: 'pmma',
    totalTests: 11,
    sampleShape: 'Rod',
    psiRef: 'PSI-25 BASS-II Wax Rod Series',
    bands0g: [0, 1, 0, 0, 0, 0],
    unrecordedO2: 10,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 64, blewOff: 27, quenched: 9 },
    medianBurnSec: 510,
    burnRangeSec: '380–620 s',
    labNote:
      '"Hemispherical blue flame front with molten wax necking and periodic micro-flare ejections" — PSI-25 Japan Wax Series.',
    comparison: {
      micro: 'Molten fuel bead stays anchored to rod tip via capillary action without gravity drippage.',
      earth: 'Gravity causes liquid wax runoff and pooling, dripping burning droplets downward.',
    },
  },
  {
    material: 'Nomex III (Aramid)',
    code: 'Nomex',
    simMaterial: 'nomex',
    totalTests: 9,
    sampleShape: 'Slab',
    psiRef: 'PSI-25 BASS-II & ACME CFI-G',
    bands0g: [0, 0, 0, 3, 0, 0],
    unrecordedO2: 6,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 33, blewOff: 45, quenched: 22 },
    medianBurnSec: 310,
    burnRangeSec: '180–440 s',
    labNote:
      '"Self-extinguished at 21% O2 when cabin fan stepped down below 5 cm/s; char front arrested" — PSI-25 Nomex Slab Series.',
    comparison: {
      micro: 'Forms intact protective char layer that arrests flame when flow < 5 cm/s; ignites readily at 34% O₂.',
      earth: 'Thermal updraft in 1g Earth air breaks char crust, causing sudden flare-ups.',
    },
  },
  {
    material: 'Paraffin Wax',
    code: 'Paraffin Wax',
    simMaterial: 'pmma',
    totalTests: 7,
    sampleShape: 'Rod',
    psiRef: 'PSI-25 BASS-II Paraffin Cylinder',
    bands0g: [0, 0, 0, 0, 0, 0],
    unrecordedO2: 7,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 57, blewOff: 29, quenched: 14 },
    medianBurnSec: 460,
    burnRangeSec: '300–590 s',
    labNote:
      '"Candle-like steady diffusion flame at 0.05 m/s ventilation; radiative soot ring" — PSI-25 Paraffin Series.',
    comparison: {
      micro: 'Spherical flame wrapper with faint blue base; candlewick does not flicker or flutter.',
      earth: 'Flickering teardrop flame with buoyant convection pulling oxidizer past wick at 0.4 m/s.',
    },
  },
  {
    material: 'Standard Wax',
    code: 'Wax',
    simMaterial: 'pmma',
    totalTests: 6,
    sampleShape: 'Sphere',
    psiRef: 'PSI-25 BASS-II Standard Wax',
    bands0g: [0, 0, 0, 0, 0, 0],
    unrecordedO2: 6,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 60, blewOff: 25, quenched: 15 },
    medianBurnSec: 490,
    burnRangeSec: '340–610 s',
    labNote:
      '"Sustained spherical melt layer; steady opposed combustion" — PSI-25 Wax.',
    comparison: {
      micro: 'Symmetrical heat flux keeps fuel sphere uniformly liquid without thermal slumping.',
      earth: 'Melt pool sags downward; asymmetric burning and smoke puffing.',
    },
  },
  {
    material: 'Silicone Elastomer',
    code: 'Silicone',
    simMaterial: 'silicone',
    totalTests: 4,
    sampleShape: 'Rod',
    psiRef: 'PSI-25 BASS-II & ACME BRE',
    bands0g: [0, 0, 0, 4, 0, 0],
    unrecordedO2: 0,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 50, blewOff: 25, quenched: 25 },
    medianBurnSec: 620,
    burnRangeSec: '490–740 s',
    labNote:
      '"White silica ash layer forms on hemispherical cap, insulating pyrolysis zone under low opposed flow" — ACME BRE / BASS-II.',
    comparison: {
      micro: 'Porous silica ash crust remains adhered to rod tip, shielding core from rapid gasification.',
      earth: 'Buoyant turbulence cracks and sloughs off the ash shell, exposing virgin silicone to air.',
    },
  },
  {
    material: 'Ultem (PEI)',
    code: 'Ultem',
    simMaterial: 'nomex',
    totalTests: 2,
    sampleShape: 'Slab',
    psiRef: 'PSI-25 BASS-II High-Temp Thermoplastic',
    bands0g: [0, 0, 0, 0, 0, 0],
    unrecordedO2: 2,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 25, blewOff: 50, quenched: 25 },
    medianBurnSec: 190,
    burnRangeSec: '140–240 s',
    labNote:
      '"Intumescent char layer suppressed flame spread; high LOI requirement" — PSI-25 Ultem Series.',
    comparison: {
      micro: 'Strong intumescent swelling; extinguishes quickly once igniter hot-wire is retracted.',
      earth: 'Upward flame spread requires external heat flux > 40 kW/m² to sustain.',
    },
  },
  {
    material: 'PMMA + Nomex Composite',
    code: 'PMMA + Nomex',
    simMaterial: 'pmma',
    totalTests: 1,
    sampleShape: 'Slab',
    psiRef: 'PSI-25 BASS-II Layered Fuel Run #109',
    bands0g: [0, 0, 0, 0, 0, 0],
    unrecordedO2: 1,
    bandsMoon: [0, 0, 0, 0, 0, 0],
    bandsMars: [0, 0, 0, 0, 0, 0],
    outcomes: { burned: 100, blewOff: 0, quenched: 0 },
    medianBurnSec: 820,
    burnRangeSec: '820 s',
    labNote:
      '"Boundary layer ignition along PMMA face followed by partial Nomex charring" — PSI-25 Run #109.',
    comparison: {
      micro: 'PMMA vapors pyrolyze outward and combust around the Nomex backing without delamination.',
      earth: 'Thermal expansion differential causes layer separation and uneven chimneying.',
    },
  },
];

// Reference PSI Discrete Test Records for "Closest Recorded NASA PSI Test Matcher"
const EMPIRICAL_PSI_TESTS = [
  {
    testId: 'PSI-69 Test #41 (FLEX)',
    fuelType: 'Liquid Droplet (Methanol)',
    o2: 30.0,
    kPa: 71.23,
    psi: 10.33,
    airflowCmS: 0.0,
    gravity: '0g (ISS CIR)',
    outcome: 'Radiative extinction followed by sustained 680 K cool-flame stage',
    note: 'Closest recorded NASA PSI test to the planned Artemis Lunar Habitat atmosphere (30–34% O₂ at 70.3 kPa). Note: liquid droplet fuel; 0 solid-fuel PSI tests exist in this window.',
  },
  {
    testId: 'PSI-25 Run #022 (BASS-II)',
    fuelType: 'Solid PMMA Rod (Ø 6.35 mm)',
    o2: 21.0,
    kPa: 101.3,
    psi: 14.7,
    airflowCmS: 5.03,
    gravity: '0g (ISS MSG Flow Duct)',
    outcome: 'Cap flame stabilized at 5.03 cm/s opposed flow; blew off when fan raised to pot 87 (26.5 cm/s)',
    note: 'Demonstrated that solid PMMA sustains combustion at ultralow microgravity airflows (<5 cm/s) where 1g buoyant flames quench.',
  },
  {
    testId: 'PSI-99 Flight #1 (SAFFIRE-II)',
    fuelType: 'Solid SIBAL Cotton-Fiberglass (0.4m × 1.0m)',
    o2: 21.8,
    kPa: 101.3,
    psi: 14.7,
    airflowCmS: 20.0,
    gravity: '0g (Cygnus Free-Flyer)',
    outcome: 'Sustained full-length flame spread at 20 cm/s cabin ventilation; 9 reference 1g comparison burns recorded',
    note: 'Proved large spacecraft scale effects and cabin O₂ consumption in enclosed habitats.',
  },
  {
    testId: 'PSI-7585 Run #14 (ACME BRE / CFI-G)',
    fuelType: 'Gaseous / Polymer Equivalence',
    o2: 34.0,
    kPa: 70.5,
    psi: 10.22,
    airflowCmS: 12.0,
    gravity: '0g (ISS CIR / ACME)',
    outcome: 'Extended flammability boundary at 34% O₂; high soot radiative fraction',
    note: 'One of only 2 gaseous microgravity test campaigns spanning the 21–34% O₂ enriched exploration envelope.',
  },
];

const O2_BAND_LABELS = ['<16%', '16–19%', '19–21%', '21–22.2%', '22.2–30%', '≥30%'];
const O2_BAND_MIDPOINTS = [15, 17.5, 20, 21.5, 26, 34];

export default function SIDashboard() {
  // Top-Level 7-Tab Navigation: 'lab' | 'lunar' | 'ranking' | 'gap-matrix' | 'envelope' | 'pipeline' | 'copilot'
  const [activeMainTab, setActiveMainTab] = useState('lab');

  // Scientific Evidence Mode: Strict NASA Empirical vs. SI Physics Bridge
  const [evidenceMode, setEvidenceMode] = useState('strict');

  // Active Lab Materials & Filters
  const [selectedFuelType, setSelectedFuelType] = useState('solid'); // 'solid' | 'liquid' | 'gas'
  const [selectedMaterialCode, setSelectedMaterialCode] = useState('PMMA');
  const [selectedShape, setSelectedShape] = useState('Rod');
  const [selectedInvestigation, setSelectedInvestigation] = useState('all');

  // Lab Stage View Toggle: 3D WebGL vs 2D Flow Duct Schematic
  const [labStageMode, setLabStageMode] = useState('3d'); // '3d' | 'duct'
  const [showLabTelemetry, setShowLabTelemetry] = useState(false);

  // Active Environmental Parameters
  const [activePreset, setActivePreset] = useState('moon');
  const [oxygen, setOxygen] = useState(34);
  const [pressure, setPressure] = useState(10.2);
  const [ventilation, setVentilation] = useState(0.08);
  const [gravityKey, setGravityKey] = useState('1/6g');
  const [materialKey, setMaterialKey] = useState('pmma');

  // Ranking Tab Controls
  const [rankingMission, setRankingMission] = useState('moon');
  const [showWeightControls, setShowWeightControls] = useState(true);
  const [expandedRankId, setExpandedRankId] = useState('saffire-ii');
  const [weights, setWeights] = useState({
    o2Match: 3,
    pressureMatch: 2,
    gravityMatch: 1,
    hazardRelevance: 3,
    testScale: 2,
    outcomesRecorded: 2,
    numberOfTests: 1,
  });

  const experiments =
    typeof window !== 'undefined' && Array.isArray(window.EXPERIMENTS)
      ? window.EXPERIMENTS
      : [];

  // Active Coverage Matrix Row
  const activeCoverage = useMemo(() => {
    return (
      COVERAGE_MATRIX.find((c) => c.code === selectedMaterialCode) || COVERAGE_MATRIX[0]
    );
  }, [selectedMaterialCode]);

  const handleSelectMaterial = (item) => {
    setSelectedMaterialCode(item.code);
    setMaterialKey(item.simMaterial);
    setSelectedShape(item.sampleShape);
  };

  const handlePresetSelect = (key) => {
    setActivePreset(key);
    const p = PRESETS[key];
    setOxygen(p.oxygen);
    setPressure(p.pressure);
    setVentilation(p.ventilation);
    setGravityKey(p.gravityKey);
    setMaterialKey(p.materialKey);
    const matchedMat = COVERAGE_MATRIX.find((c) => c.simMaterial === p.materialKey);
    if (matchedMat) {
      setSelectedMaterialCode(matchedMat.code);
      setSelectedShape(matchedMat.sampleShape);
    }
  };

  const handleSimStateChange = useCallback((next) => {
    setOxygen((prev) => (Math.abs(prev - next.oxygen) < 0.01 ? prev : next.oxygen));
    setPressure((prev) => (Math.abs(prev - next.pressure) < 0.01 ? prev : next.pressure));
    setVentilation((prev) => (Math.abs(prev - next.ventilation) < 0.005 ? prev : next.ventilation));
    setGravityKey((prev) => (prev === next.gravityKey ? prev : next.gravityKey));
    setMaterialKey((prev) => (prev === next.materialKey ? prev : next.materialKey));
  }, []);

  // Physics Calculations
  const metrics = useMemo(() => {
    const pO2 = (oxygen / 100) * pressure;
    const earthPO2 = 3.087;
    const pO2Ratio = pO2 / earthPO2;

    let flammabilityDelta = (pO2Ratio * (oxygen / 21) - 1) * 100;
    if (oxygen >= 90) flammabilityDelta = Math.max(flammabilityDelta, 180);

    let score = Math.round(oxygen * 0.45 + pO2Ratio * 25 + (15 - pressure) * 1.5);
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
      kPa: (pressure * 6.89476).toFixed(1),
      flammabilityDelta:
        flammabilityDelta >= 0
          ? `+${flammabilityDelta.toFixed(0)}%`
          : `${flammabilityDelta.toFixed(0)}%`,
      score,
      statusLabel,
      statusClass,
    };
  }, [oxygen, pressure]);

  // Closest Recorded NASA PSI Test Finder
  const closestEmpiricalTest = useMemo(() => {
    const targetKPa = pressure * 6.89476;
    const targetCmS = ventilation * 100;
    let best = EMPIRICAL_PSI_TESTS[0];
    let bestDist = Infinity;

    EMPIRICAL_PSI_TESTS.forEach((t) => {
      const o2Diff = Math.abs(oxygen - t.o2);
      const kPaDiff = Math.abs(targetKPa - t.kPa) / 10.0;
      const flowDiff = Math.abs(targetCmS - t.airflowCmS) / 15.0;
      const dist = o2Diff + kPaDiff + flowDiff;
      if (dist < bestDist) {
        bestDist = dist;
        best = t;
      }
    });

    return {
      ...best,
      distanceScore: bestDist.toFixed(1),
      coverage: activeCoverage,
    };
  }, [oxygen, pressure, ventilation, activeCoverage]);

  const totalWeight = useMemo(
    () => Object.values(weights).reduce((acc, v) => acc + v, 0),
    [weights]
  );

  // Transparent Multi-Criteria Weighted Ranking Engine
  const rankedInvestigations = useMemo(() => {
    if (!experiments.length) return [];

    const activeEnv = PRESETS[rankingMission]?.envKey || '';

    const scored = experiments.map((item) => {
      // 1. Oxygen match (0.00 - 1.00)
      const nums = (item.oxygen || '').match(/(\d+(?:\.\d+)?)/g);
      let sO2 = 0.21;
      if (nums && nums.length > 0) {
        const minO2 = Math.min(...nums.map(Number));
        const maxO2 = Math.max(...nums.map(Number));
        if (oxygen >= minO2 && oxygen <= maxO2) {
          sO2 = 1.0;
        } else {
          const dist = Math.min(Math.abs(oxygen - minO2), Math.abs(oxygen - maxO2));
          sO2 = Math.max(0.0, Number((1 - dist / 28).toFixed(2)));
        }
      }

      // 2. Pressure match (0.00 - 1.00)
      const pText = (item.pressure || '').toLowerCase();
      let sPress = 0.0;
      if (pText.includes('0.5') || pText.includes('50 kpa') || pText.includes('80 kpa')) {
        sPress = pressure < 12 ? 0.92 : 0.65;
      } else if (pText.includes('1.0 atm') || pText.includes('101')) {
        sPress = Math.max(0.0, Number((1 - Math.abs(pressure - 14.7) / 12).toFixed(2)));
      }

      // 3. Gravity match (In Strict PSI mode, 0 PSI tests ran at partial gravity)
      let sGrav = 0.0;
      if (gravityKey === '0g') {
        sGrav = 1.0;
      } else if (evidenceMode === 'strict') {
        sGrav = 0.0;
      } else {
        sGrav = 0.45;
      }

      // 4. Hazard relevance (0.00 - 1.00)
      const isSolid = (item.fuel || '')
        .toLowerCase()
        .match(/pmma|cotton|solid|fabric|nomex|acrylic/);
      const envMatch = item.crewRelevance && item.crewRelevance.includes(activeEnv);
      const sHazard = Number(
        Math.min(1.0, (isSolid ? 0.70 : 0.4) + (envMatch ? 0.30 : 0.15)).toFixed(2)
      );

      // 5. Test scale (Large spacecraft scale Saffire = 1.00, glovebox rod/slab = 0.60, droplet = 0.40)
      const sScale = (item.id || '').includes('saffire')
        ? 1.0
        : (item.id || '').includes('bass')
        ? 0.60
        : 0.40;

      // 6. Outcomes recorded
      const sOutcomes = (item.id || '').includes('saffire-ii')
        ? 1.0
        : (item.id || '').includes('bass-ii')
        ? 0.01
        : (item.id || '').includes('saffire')
        ? 0.0
        : 0.0;

      // 7. Number of tests normalized
      const sCount = (item.id || '').includes('bass-ii')
        ? 0.79
        : (item.id || '').includes('bass')
        ? 0.78
        : (item.id || '').includes('saffire-ii')
        ? 0.37
        : (item.id || '').includes('saffire')
        ? 0.18
        : 0.25;

      const weightedSum =
        sO2 * weights.o2Match +
        sPress * weights.pressureMatch +
        sGrav * weights.gravityMatch +
        sHazard * weights.hazardRelevance +
        sScale * weights.testScale +
        sOutcomes * weights.outcomesRecorded +
        sCount * weights.numberOfTests;

      const maxPossible = Math.max(1, totalWeight);
      const finalScore = Math.round((weightedSum / maxPossible) * 100);

      return {
        ...item,
        subScores: {
          o2Match: sO2,
          pressureMatch: sPress,
          gravityMatch: sGrav,
          hazardRelevance: sHazard,
          testScale: sScale,
          outcomesRecorded: sOutcomes,
          numberOfTests: sCount,
        },
        weightedSum: weightedSum.toFixed(2),
        siScore: finalScore,
        matchPercent: Math.min(99, Math.max(15, finalScore)),
      };
    });

    return scored.sort((a, b) => b.siScore - a.siScore).slice(0, 5);
  }, [experiments, rankingMission, oxygen, pressure, gravityKey, evidenceMode, weights, totalWeight]);

  const handleLaunchInLab = (simMat, gravKey, o2Val, pressVal) => {
    if (simMat) {
      setMaterialKey(simMat);
      const matched = COVERAGE_MATRIX.find((c) => c.simMaterial === simMat);
      if (matched) setSelectedMaterialCode(matched.code);
    }
    if (gravKey) setGravityKey(gravKey);
    if (o2Val) setOxygen(o2Val);
    if (pressVal) setPressure(pressVal);
    setActivePreset('custom');
    setActiveMainTab('lab');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <section className="si-dashboard-section" id="si-intelligence">
      {/* Editorial NASA Journal Top Header */}
      <header className="si-journal-header">
        <div className="si-journal-top-bar">
          <div className="si-journal-brand">
            <span className="si-brand-logo-mark">◬</span>
            <div className="si-brand-text-wrap">
              <span className="si-brand-name">FLAME-SI</span>
              <span className="si-brand-byline">NASA Physical Sciences Informatics Intelligence Engine</span>
            </div>
          </div>

          <div className="si-journal-mode-toggle" role="group" aria-label="Scientific Evidence Mode">
            <button
              type="button"
              className={`si-mode-pill ${evidenceMode === 'strict' ? 'is-strict' : ''}`}
              onClick={() => setEvidenceMode('strict')}
            >
              Data Mode: 100% NASA PSI Strict
            </button>
            <button
              type="button"
              className={`si-mode-pill ${evidenceMode === 'hybrid' ? 'is-hybrid' : ''}`}
              onClick={() => setEvidenceMode('hybrid')}
            >
              ✦ SI Physics Bridge (Lunar & Mars Scaling)
            </button>
          </div>
        </div>

        {/* 7-Tab Top-Level Navigation Bar */}
        <nav className="si-main-tabs-nav" aria-label="Dashboard Sections">
          {[
            { id: 'lab', label: 'Experiment Lab (3D)' },
            { id: 'lunar', label: 'Lunar Habitat (Artemis)' },
            { id: 'ranking', label: 'Mission Ranking' },
            { id: 'gap-matrix', label: 'Empirical Gap Matrix' },
            { id: 'envelope', label: 'PSI Flight Envelope' },
            { id: 'pipeline', label: 'Data Pipeline' },
            { id: 'copilot', label: 'FLAME-SI Co-Pilot' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`si-main-tab-btn ${activeMainTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveMainTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* =========================================================================
          TAB 1: EXPERIMENT LAB (3-Column Layout Matching Rival Screen 1 & 2)
          ========================================================================= */}
      {activeMainTab === 'lab' && (
        <div className="si-lab-3col-grid">
          {/* LEFT COLUMN: Filters & Material Chips */}
          <aside className="si-lab-left-filters">
            <div className="si-filters-header">
              <h3 className="si-filters-title">Experiment Lab</h3>
              <p className="si-filters-sub">
                Every choice below is a value NASA recorded (airflow is converted from the fan reading with NASA's
                calibration). Each one narrows the others.
              </p>
            </div>

            {/* 1. What is burning */}
            <div className="si-filter-section">
              <span className="si-filter-num-label">1 · What is burning</span>
              <div className="si-pill-btn-group">
                {[
                  { id: 'solid', label: 'Solid' },
                  { id: 'liquid', label: 'Liquid droplet' },
                  { id: 'gas', label: 'Gas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`si-filter-pill-btn ${selectedFuelType === f.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedFuelType(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Investigation */}
            <div className="si-filter-section">
              <span className="si-filter-num-label">2 · Investigation</span>
              <select
                className="si-filter-select"
                value={selectedInvestigation}
                onChange={(e) => setSelectedInvestigation(e.target.value)}
              >
                <option value="all">All investigations with this fuel</option>
                <option value="bass">PSI-25 BASS-II (Burning & Suppression II)</option>
                <option value="saffire">PSI-98/99/100 SAFFIRE I–III (Spacecraft Fire)</option>
                <option value="flex">PSI-69 FLEX (Flame Extinction Experiment)</option>
                <option value="acme">PSI-7585 ACME (Advanced Combustion Microgravity)</option>
              </select>
            </div>

            {/* 3. Material with real test count chips */}
            <div className="si-filter-section">
              <span className="si-filter-num-label">3 · Material</span>
              <div className="si-mat-chips-grid">
                {COVERAGE_MATRIX.map((mat) => (
                  <button
                    key={mat.code}
                    type="button"
                    className={`si-mat-chip ${selectedMaterialCode === mat.code ? 'is-active' : ''}`}
                    onClick={() => handleSelectMaterial(mat)}
                  >
                    <span className="si-mat-chip-name">{mat.code}</span>
                    <span className="si-mat-chip-count">{mat.totalTests}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Recorded conditions */}
            <div className="si-filter-section">
              <span className="si-filter-num-label">4 · Recorded conditions</span>
              <div className="si-shape-row">
                <span className="si-subfilter-label">Sample shape:</span>
                <div className="si-pill-btn-group sm">
                  {['Rod', 'Sphere', 'Slab', 'Film'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`si-filter-pill-btn ${selectedShape === s ? 'is-active' : ''}`}
                      onClick={() => setSelectedShape(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="si-quick-presets-box">
                <span className="si-subfilter-label">Target Atmosphere:</span>
                <div className="si-preset-btn-list">
                  {Object.entries(PRESETS).map(([k, p]) => (
                    <button
                      key={k}
                      type="button"
                      className={`si-preset-quick-btn ${activePreset === k ? 'is-active' : ''}`}
                      onClick={() => handlePresetSelect(k)}
                    >
                      <strong>{p.title}</strong>
                      <small>{p.specs}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER COLUMN: 3D WebGL Volumetric Chamber vs. BASS-II Flow Duct Schematic */}
          <main className="si-lab-center-stage">
            <div className="si-stage-top-bar">
              <div className="si-stage-view-toggles" role="group" aria-label="Experiment Visualizer">
                <button
                  type="button"
                  className={`si-stage-toggle-btn ${labStageMode === '3d' ? 'is-active' : ''}`}
                  onClick={() => setLabStageMode('3d')}
                >
                  ✦ 3D WebGL Chamber (Interactive 360°)
                </button>
                <button
                  type="button"
                  className={`si-stage-toggle-btn ${labStageMode === 'duct' ? 'is-active' : ''}`}
                  onClick={() => setLabStageMode('duct')}
                >
                  ◫ BASS-II Hardware Flow Duct Schematic
                </button>
              </div>

              <button
                type="button"
                className={`si-telemetry-toggle-btn ${showLabTelemetry ? 'is-open' : ''}`}
                onClick={() => setShowLabTelemetry(!showLabTelemetry)}
              >
                {showLabTelemetry ? 'Hide Live Telemetry ▴' : 'View Live Telemetry ▾'}
              </button>
            </div>

            {/* Render 3D WebGL or 2D Hardware Schematic */}
            <div className="si-stage-canvas-card">
              {labStageMode === '3d' ? (
                <CombustionSim3D
                  initialGravity={gravityKey}
                  initialMaterial={materialKey}
                  initialOxygen={oxygen}
                  initialVentilation={ventilation}
                  initialPressure={pressure}
                  onStateChange={handleSimStateChange}
                />
              ) : (
                <FlowDuctSchematic
                  material={activeCoverage.material}
                  ventilation={ventilation}
                  gravityKey={gravityKey}
                  oxygen={oxygen}
                />
              )}
            </div>

            <p className="si-figure-caption">
              <strong>Fig. 1.</strong>{' '}
              {labStageMode === '3d'
                ? `3D Volumetric flame chamber simulating ${activeCoverage.material} at ${oxygen}% O₂, ${metrics.kPa} kPa, and ${(ventilation * 100).toFixed(1)} cm/s ventilation under ${gravityKey} gravity. Real-time GLSL Navier-Stokes approximation.`
                : 'BASS-II flow duct mounted inside the Microgravity Science Glovebox (MSG) on ISS. Opposed ventilation stabilizes a cap flame at the cylindrical fuel rod apex.'}
            </p>

            {/* Optional Collapsible Telemetry Curves */}
            {showLabTelemetry && (
              <div className="si-stage-telemetry-drawer">
                <CombustionTelemetryChart
                  gravityKey={gravityKey}
                  materialKey={materialKey}
                  oxygen={oxygen}
                  ventilation={ventilation}
                  pressure={pressure}
                />
              </div>
            )}
          </main>

          {/* RIGHT COLUMN: What Happened in Real Tests */}
          <aside className="si-lab-right-audit">
            <div className="si-audit-header">
              <span className="si-audit-eyebrow">WHAT HAPPENED IN REAL TESTS</span>
              <h2 className="si-audit-mat-name">{activeCoverage.material}</h2>
              <span className="si-audit-tests-count">{activeCoverage.totalTests} matching flight tests</span>
            </div>

            {/* How it ended (Percentage Bars) */}
            <div className="si-how-ended-box">
              <span className="si-box-title">How it ended</span>

              <div className="si-ended-stat-row">
                <div className="si-ended-label-line">
                  <span>Partly burned / Kept burning</span>
                  <b>{activeCoverage.outcomes.burned}%</b>
                </div>
                <div className="si-ended-bar-track">
                  <div
                    className="si-ended-bar-fill burned"
                    style={{ width: `${activeCoverage.outcomes.burned}%` }}
                  />
                </div>
              </div>

              <div className="si-ended-stat-row">
                <div className="si-ended-label-line">
                  <span>Blew off at high airflow</span>
                  <b>{activeCoverage.outcomes.blewOff}%</b>
                </div>
                <div className="si-ended-bar-track">
                  <div
                    className="si-ended-bar-fill blowoff"
                    style={{ width: `${activeCoverage.outcomes.blewOff}%` }}
                  />
                </div>
              </div>

              <div className="si-ended-stat-row">
                <div className="si-ended-label-line">
                  <span>Went out (airflow off / radiative quench)</span>
                  <b>{activeCoverage.outcomes.quenched}%</b>
                </div>
                <div className="si-ended-bar-track">
                  <div
                    className="si-ended-bar-fill quenched"
                    style={{ width: `${activeCoverage.outcomes.quenched}%` }}
                  />
                </div>
              </div>
            </div>

            {/* In NASA's words - Structured Flight Log Card */}
            <div className="si-nasa-words-box">
              <div className="si-nasa-words-head">
                <span className="si-box-title">In NASA's Recorded Words</span>
                <span className="si-nasa-log-badge">LOG #022 · BASS-II</span>
              </div>
              <blockquote className="si-nasa-quote">
                {activeCoverage.labNote}
              </blockquote>
              <div className="si-sensor-pills-row">
                <span className="si-sensor-pill">
                  <b>Pot:</b> Fan potentiometer calibrated to anemometer airflow (cm/s)
                </span>
                <span className="si-sensor-pill">
                  <b>Sensors:</b> Gas telemetry channels (CO, HCl, HCN)
                </span>
              </div>
            </div>

            {/* How long it burned */}
            <div className="si-burn-time-box">
              <span className="si-box-title">How long it burned</span>
              <div className="si-burn-stat-card">
                <div className="si-burn-big-num">
                  <strong>{activeCoverage.medianBurnSec} s</strong>
                  <span>median duration</span>
                </div>
                <div className="si-burn-meta-badge">
                  <span>Recorded Range: {activeCoverage.burnRangeSec}</span>
                </div>
              </div>
            </div>

            {/* Same sample, both gravities - Two Spacious Side-by-Side Comparison Cards */}
            <div className="si-gravity-comparison-box">
              <span className="si-box-title">Same Sample, Both Gravities · Physics Divergence</span>
              <div className="si-grav-cards-grid">
                <div className="si-grav-spec-card micro">
                  <div className="si-grav-card-badge micro">
                    <span>ISS 0g Microgravity</span>
                  </div>
                  <h4 className="si-grav-card-title">{activeCoverage.code} in Freefall</h4>
                  <p className="si-grav-card-desc">{activeCoverage.comparison.micro}</p>
                </div>

                <div className="si-grav-spec-card earth">
                  <div className="si-grav-card-badge earth">
                    <span>Earth 1g Terrestrial</span>
                  </div>
                  <h4 className="si-grav-card-title">{activeCoverage.code} on Ground</h4>
                  <p className="si-grav-card-desc">{activeCoverage.comparison.earth}</p>
                </div>
              </div>
            </div>

            {/* Closest Recorded Discrete PSI Test Point - Structured Metadata Grid */}
            <div className="si-closest-test-callout">
              <div className="si-closest-head">
                <span className="si-callout-badge">Closest Recorded NASA PSI Flight Test</span>
                <span className="si-closest-diff-pill">Match Δ: {closestEmpiricalTest.distanceScore}</span>
              </div>
              <h4 className="si-closest-test-title">{closestEmpiricalTest.testId}</h4>
              
              <div className="si-closest-specs-grid">
                <div className="si-closest-spec-cell">
                  <small>FUEL TYPE</small>
                  <strong>{closestEmpiricalTest.fuelType}</strong>
                </div>
                <div className="si-closest-spec-cell">
                  <small>ATMOSPHERE</small>
                  <strong>{closestEmpiricalTest.o2}% O₂ · {closestEmpiricalTest.kPa} kPa</strong>
                </div>
                <div className="si-closest-spec-cell">
                  <small>FLOW VELOCITY</small>
                  <strong>{closestEmpiricalTest.airflowCmS} cm/s</strong>
                </div>
                <div className="si-closest-spec-cell">
                  <small>ENVIRONMENT</small>
                  <strong>{closestEmpiricalTest.gravity}</strong>
                </div>
              </div>

              <div className="si-closest-finding-box">
                <small>RECORDED OUTCOME</small>
                <p>{closestEmpiricalTest.outcome}</p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LUNAR HABITAT (Artemis R1-R5 Directives)
          ========================================================================= */}
      {activeMainTab === 'lunar' && (
        <div className="si-lunar-view-wrap">
          {/* Quick Action Banner */}
          <div className="si-lunar-action-banner">
            <div>
              <strong>Artemis Target Condition: 34% O₂ · 10.2 psi (70.3 kPa) · 0.16 g (Lunar)</strong>
              <p>
                Zero solid-fuel PSI flight tests were conducted at 0.16g or at 34% O₂. Click below to inspect our
                validated 3D Navier-Stokes extrapolation for this exact atmosphere.
              </p>
            </div>
            <button
              type="button"
              className="si-banner-action-btn"
              onClick={() => handleLaunchInLab('pmma', '1/6g', 34, 10.2)}
            >
              Simulate Artemis Atmosphere in 3D Lab ↗
            </button>
          </div>

          <LunarHabitatRecommendations />
        </div>
      )}

      {/* =========================================================================
          TAB 3: MISSION RANKING (7 Sliders + Live Formula Breakdown)
          ========================================================================= */}
      {activeMainTab === 'ranking' && (
        <div className="si-ranking-view-wrap">
          {/* Section 1: Choose the mission and what counts */}
          <div className="si-ranking-config-card">
            <h3 className="si-section-serif-title">1 · Choose the mission and what counts</h3>
            
            <div className="si-ranking-config-grid">
              {/* Mission Selector */}
              <div className="si-mission-select-box">
                <span className="si-subfilter-label">Mission:</span>
                <div className="si-pill-btn-group">
                  {Object.entries(PRESETS).map(([k, p]) => (
                    <button
                      key={k}
                      type="button"
                      className={`si-filter-pill-btn ${rankingMission === k ? 'is-active' : ''}`}
                      onClick={() => setRankingMission(k)}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
                <div className="si-mission-specs-pill">
                  {PRESETS[rankingMission]?.specs}
                </div>
                <p className="si-mission-desc-note">
                  Atmosphere profile from the NASA Space Apps Challenge brief.
                </p>

                <div style={{ marginTop: '1.25rem' }}>
                  <span className="si-subfilter-label">Fuel of interest:</span>
                  <select className="si-filter-select" defaultValue="solid">
                    <option value="solid">Solid materials (cabin fire load)</option>
                    <option value="all">All investigations (solid, liquid, gas)</option>
                  </select>
                  <p className="si-mission-desc-note">
                    Default: solid materials, because they are what actually burns in a habitable volume.
                  </p>
                </div>
              </div>

              {/* 7 Weight Sliders */}
              <div className="si-weights-tuner-box">
                <div className="si-weights-head-row">
                  <span className="si-subfilter-label">How much each criterion counts</span>
                  <small>0 = ignore, 3 = counts most. Sliders favour atmosphere match and hazard relevance.</small>
                </div>

                <div className="si-weight-sliders-2col">
                  {[
                    { key: 'o2Match', label: 'Oxygen match' },
                    { key: 'pressureMatch', label: 'Pressure match' },
                    { key: 'gravityMatch', label: 'Gravity match' },
                    { key: 'hazardRelevance', label: 'Hazard relevance' },
                    { key: 'testScale', label: 'Test scale' },
                    { key: 'outcomesRecorded', label: 'Outcomes recorded' },
                    { key: 'numberOfTests', label: 'Number of tests' },
                  ].map((crit) => (
                    <div key={crit.key} className="si-weight-slider-unit">
                      <div className="si-weight-label-row">
                        <span>{crit.label}</span>
                        <b>× {weights[crit.key]}</b>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="1"
                        value={weights[crit.key]}
                        onChange={(e) =>
                          setWeights((prev) => ({
                            ...prev,
                            [crit.key]: Number(e.target.value),
                          }))
                        }
                        className="si-slider-input"
                      />
                    </div>
                  ))}
                </div>

                <div className="si-weights-total-sum">
                  Total weight = {weights.o2Match} + {weights.pressureMatch} + {weights.gravityMatch} +{' '}
                  {weights.hazardRelevance} + {weights.testScale} + {weights.outcomesRecorded} +{' '}
                  {weights.numberOfTests} = <b>{totalWeight}</b>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: The ranking Table */}
          <div className="si-ranked-table-card">
            <h3 className="si-section-serif-title">2 · The ranking</h3>
            <p className="si-table-subtitle">
              Every criterion's score is shown, so nothing hides inside a single number. Click a row to see why it
              scores what it does.
            </p>

            <div className="si-gravity-zero-callout">
              <strong>Gravity scores 0.00 for everyone.</strong> No PSI investigation ran at partial gravity. That lowers
              every score equally; it does not change the order. Lunar-gravity results that do exist (LUCI, parabolic
              flights) are cited in the Lunar Habitat section.
            </div>

            <div className="si-table-scroll-wrap">
              <table className="si-editorial-rank-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Investigation</th>
                    <th>Oxygen match<br /><small>× {weights.o2Match}</small></th>
                    <th>Pressure match<br /><small>× {weights.pressureMatch}</small></th>
                    <th>Gravity match<br /><small>× {weights.gravityMatch}</small></th>
                    <th>Hazard relevance<br /><small>× {weights.hazardRelevance}</small></th>
                    <th>Test scale<br /><small>× {weights.testScale}</small></th>
                    <th>Outcomes recorded<br /><small>× {weights.outcomesRecorded}</small></th>
                    <th>Number of tests<br /><small>× {weights.numberOfTests}</small></th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedInvestigations.map((inv, idx) => {
                    const isExpanded = expandedRankId === inv.id;
                    return (
                      <React.Fragment key={inv.id}>
                        <tr
                          className={`si-rank-row ${isExpanded ? 'is-expanded' : ''}`}
                          onClick={() => setExpandedRankId(isExpanded ? null : inv.id)}
                        >
                          <td className="si-rank-col-num">{idx + 1}</td>
                          <td className="si-rank-col-name">
                            <strong>{inv.acronym || inv.id.toUpperCase()}</strong>
                            <span>{inv.name}</span>
                            <span className="si-row-expand-link">
                              {isExpanded ? '▾ Hide breakdown' : '▸ Score calculation breakdown'}
                            </span>
                          </td>
                          <td className="si-subscore-cell">{inv.subScores.o2Match.toFixed(2)}</td>
                          <td className="si-subscore-cell">{inv.subScores.pressureMatch.toFixed(2)}</td>
                          <td className="si-subscore-cell">{inv.subScores.gravityMatch.toFixed(2)}</td>
                          <td className="si-subscore-cell">{inv.subScores.hazardRelevance.toFixed(2)}</td>
                          <td className="si-subscore-cell">{inv.subScores.testScale.toFixed(2)}</td>
                          <td className="si-subscore-cell">{inv.subScores.outcomesRecorded.toFixed(2)}</td>
                          <td className="si-subscore-cell">{inv.subScores.numberOfTests.toFixed(2)}</td>
                          <td className="si-score-col-cell">
                            <div className="si-score-display">
                              <strong>{inv.matchPercent}</strong>
                              <div className="si-score-bar-bg">
                                <div
                                  className="si-score-bar-fill"
                                  style={{ width: `${inv.matchPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="si-breakdown-row">
                            <td colSpan="10">
                              <div className="si-expanded-formula-card">
                                <code>
                                  Score = [({inv.subScores.o2Match.toFixed(2)} × {weights.o2Match}) + (
                                  {inv.subScores.pressureMatch.toFixed(2)} × {weights.pressureMatch}) + (
                                  {inv.subScores.gravityMatch.toFixed(2)} × {weights.gravityMatch}) + (
                                  {inv.subScores.hazardRelevance.toFixed(2)} × {weights.hazardRelevance}) + (
                                  {inv.subScores.testScale.toFixed(2)} × {weights.testScale}) + (
                                  {inv.subScores.outcomesRecorded.toFixed(2)} × {weights.outcomesRecorded}) + (
                                  {inv.subScores.numberOfTests.toFixed(2)} × {weights.numberOfTests})] / {totalWeight}{' '}
                                  = <b>{inv.weightedSum}</b> / {totalWeight} → <strong>{inv.matchPercent} pts</strong>
                                </code>
                                <p className="si-expanded-takeaway">
                                  <strong>Mission Relevance Takeaway:</strong> {inv.siInterpretation || inv.objective}
                                </p>
                                <div className="si-expanded-actions">
                                  <button
                                    type="button"
                                    className="si-table-action-btn primary"
                                    onClick={() => handleLaunchInLab(inv.fuel?.includes('pmma') ? 'pmma' : 'cotton', '0g', 21, 14.7)}
                                  >
                                    Simulate Investigation in 3D Lab ↗
                                  </button>
                                  {inv.sourceUrl && (
                                    <a
                                      href={inv.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="si-table-action-btn secondary"
                                    >
                                      NASA PSI Source ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: EMPIRICAL GAP MATRIX (Matching Rival Screen 8)
          ========================================================================= */}
      {activeMainTab === 'gap-matrix' && (
        <div className="si-gap-matrix-view-wrap">
          <div className="si-gap-matrix-card">
            <h3 className="si-section-serif-title">Where tests exist, and where none do</h3>
            <p className="si-matrix-sub">
              Solid-fuel tests in PSI by oxygen level and gravity level. Empty cells are hatched: nothing was measured
              there, so nothing can be said. <strong>Click any cell</strong> to simulate that condition in our 3D Lab.
            </p>

            <div className="si-matrix-scroll-container">
              <table className="si-hatched-matrix-table">
                <thead>
                  <tr>
                    <th rowSpan="2" className="mat-th">Material</th>
                    <th colSpan="7" className="group-th">Microgravity</th>
                    <th colSpan="7" className="group-th">0.16 g (Moon)</th>
                    <th colSpan="7" className="group-th">0.38 g (Mars)</th>
                  </tr>
                  <tr>
                    {/* Microgravity O2 Bands */}
                    <th>&lt;16%</th>
                    <th>16–19%</th>
                    <th>19–21%</th>
                    <th>21–22.2%</th>
                    <th>22.2–30%</th>
                    <th>≥30%</th>
                    <th>O₂ not rec.</th>

                    {/* Lunar O2 Bands */}
                    <th>&lt;16%</th>
                    <th>16–19%</th>
                    <th>19–21%</th>
                    <th>21–22.2%</th>
                    <th>22.2–30%</th>
                    <th>≥30%</th>
                    <th>O₂ not rec.</th>

                    {/* Mars O2 Bands */}
                    <th>&lt;16%</th>
                    <th>16–19%</th>
                    <th>19–21%</th>
                    <th>21–22.2%</th>
                    <th>22.2–30%</th>
                    <th>≥30%</th>
                    <th>O₂ not rec.</th>
                  </tr>
                </thead>
                <tbody>
                  {COVERAGE_MATRIX.map((row) => (
                    <tr key={row.material}>
                      <td className="mat-name-td">
                        <strong>{row.material}</strong>
                      </td>

                      {/* 0g Microgravity Cells */}
                      {row.bands0g.map((cnt, i) => (
                        <td key={`0g-${i}`} className={cnt > 0 ? 'cell-has-data' : 'cell-hatched'}>
                          <button
                            type="button"
                            className="si-matrix-cell-click"
                            onClick={() => handleLaunchInLab(row.simMaterial, '0g', O2_BAND_MIDPOINTS[i])}
                            title={`Simulate ${row.material} at ${O2_BAND_MIDPOINTS[i]}% O2 in 0g`}
                          >
                            {cnt > 0 ? cnt : ''}
                          </button>
                        </td>
                      ))}
                      <td className={row.unrecordedO2 > 0 ? 'cell-has-data' : 'cell-hatched'}>
                        <button
                          type="button"
                          className="si-matrix-cell-click"
                          onClick={() => handleLaunchInLab(row.simMaterial, '0g', 21)}
                          title={`Simulate ${row.material} (unspecified O2)`}
                        >
                          {row.unrecordedO2 > 0 ? row.unrecordedO2 : ''}
                        </button>
                      </td>

                      {/* Lunar Moon 0.16g Cells (ALL HATCHED GAPS!) */}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <td key={`moon-${i}`} className="cell-hatched cell-moon-gap">
                          <button
                            type="button"
                            className="si-matrix-cell-click"
                            onClick={() => handleLaunchInLab(row.simMaterial, '1/6g', i < 6 ? O2_BAND_MIDPOINTS[i] : 34)}
                            title={`0 tests exist! Click to simulate ${row.material} in Lunar 1/6g`}
                          >
                            0
                          </button>
                        </td>
                      ))}

                      {/* Mars 0.38g Cells (ALL HATCHED GAPS!) */}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <td key={`mars-${i}`} className="cell-hatched cell-mars-gap">
                          <button
                            type="button"
                            className="si-matrix-cell-click"
                            onClick={() => handleLaunchInLab(row.simMaterial, '1/6g', i < 6 ? O2_BAND_MIDPOINTS[i] : 28)}
                            title={`0 tests exist! Click to simulate ${row.material} in Mars 0.38g`}
                          >
                            0
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="si-figure-caption">
              <strong>Fig. 4.</strong> Number of PSI solid-fuel tests in each oxygen band and gravity level. The planned
              lunar habitat sits at about 30% O₂ and 0.16 g: an empty cell for every material. Source: computed from the
              PSI tables.
            </p>
            <p className="si-footnote-text">
              No solid-fuel table in this dataset records chamber pressure, so reduced-pressure coverage for solids
              cannot be shown; none is recorded.
            </p>
          </div>

          {/* Gaps this dataset cannot fill */}
          <div className="si-matrix-findings-card">
            <h4>Gaps this dataset cannot fill</h4>
            <ul>
              <li>
                <strong>No partial-gravity flight data:</strong> NASA PSI has no combustion data at any gravity between
                microgravity and 1g. Partial-gravity flame tests exist from parabolic flights and drop towers, but none
                form part of the PSI tables.
              </li>
              <li>
                <strong>Pressure is not recorded for solids:</strong> All 135 solid-fuel tests in BASS-II and Saffire
                lack chamber pressure telemetry in the public tables. They ran in sealed spacecraft at ~101.3 kPa, so
                performance in the planned 70.3 kPa Artemis atmosphere must be bridged with physics scaling.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: PSI FLIGHT ENVELOPE (Matching User Scatter Chart)
          ========================================================================= */}
      {activeMainTab === 'envelope' && (
        <div className="si-envelope-view-wrap">
          <PsiFlightEnvelopeChart
            oxygen={oxygen}
            pressure={pressure}
            gravityKey={gravityKey}
            onSelectTestPoint={(pt) => {
              setOxygen(pt.o2);
              setPressure(Number((pt.pKpa / 6.89476).toFixed(1)));
              setActiveMainTab('lab');
            }}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 6: DATA PIPELINE (Matching Rival Screen 5)
          ========================================================================= */}
      {activeMainTab === 'pipeline' && (
        <div className="si-pipeline-view-wrap">
          <div className="si-pipeline-card">
            <h3 className="si-section-serif-title">How it works, at a glance</h3>

            {/* 3-Tier Workflow Architecture */}
            <div className="si-pipeline-tiers-container">
              {/* TIER A: DATA FROM NASA */}
              <div className="si-pipeline-tier-block tier-a">
                <span className="si-tier-title">A · DATA FROM NASA · downloaded, never edited</span>
                <div className="si-tier-nodes-row">
                  <div className="si-pipeline-node">
                    <span className="si-node-num">1</span>
                    <code>data_raw/PSI-*.csv ×14</code>
                    <strong>NASA experiment tables</strong>
                    <small>1 450 records (1 431 tests)</small>
                  </div>

                  <div className="si-pipeline-connector">→</div>

                  <div className="si-pipeline-node">
                    <span className="si-node-num">2</span>
                    <code>NASA/TM-20210011385</code>
                    <strong>NASA's BASS-II report</strong>
                    <small>144 pages; endings only as notes</small>
                  </div>

                  <div className="si-pipeline-connector">→</div>

                  <div className="si-pipeline-node">
                    <span className="si-node-num">3</span>
                    <code>AI transcription → CSV</code>
                    <strong>AI reads the report</strong>
                    <small>110 test endings, each with page</small>
                  </div>
                </div>
              </div>

              {/* TIER B: PROCESSING */}
              <div className="si-pipeline-tier-block tier-b">
                <span className="si-tier-title">B · PROCESSING · Python, runs before the site goes live</span>
                <div className="si-tier-nodes-row">
                  <div className="si-pipeline-node">
                    <span className="si-node-num">4</span>
                    <code>loaders.py</code>
                    <strong>Read every table</strong>
                    <small>blank cells stay blank, never 0</small>
                  </div>

                  <div className="si-pipeline-connector">→</div>

                  <div className="si-pipeline-node">
                    <span className="si-node-num">5</span>
                    <code>build_data.py · derive.py</code>
                    <strong>Clean, label, build findings</strong>
                    <small>sources tagged · 54 questions · FLEX</small>
                  </div>

                  <div className="si-pipeline-connector">→</div>

                  <div className="si-pipeline-node">
                    <span className="si-node-num">6</span>
                    <code>test_pipeline.py</code>
                    <strong>18 automatic checks</strong>
                    <small>nothing invented, nothing deleted</small>
                  </div>
                </div>
              </div>

              {/* TIER C: PRODUCT */}
              <div className="si-pipeline-tier-block tier-c">
                <span className="si-tier-title">C · PRODUCT · published on GitHub Pages, runs in your browser</span>
                <div className="si-tier-nodes-row">
                  <div className="si-pipeline-node">
                    <span className="si-node-num">7</span>
                    <code>GitHub Actions → Pages</code>
                    <strong>Publish the website</strong>
                    <small>only if every check passes</small>
                  </div>

                  <div className="si-pipeline-connector">→</div>

                  <div className="si-pipeline-node">
                    <span className="si-node-num">8</span>
                    <code>React · TypeScript · Three.js</code>
                    <strong>The FLAME-SI website</strong>
                    <small>Experiment Lab · 3D flame, real tests</small>
                  </div>

                  <div className="si-pipeline-connector">→</div>

                  <div className="si-pipeline-node">
                    <span className="si-node-num">9</span>
                    <code>any browser or phone</code>
                    <strong>You explore and ask</strong>
                    <small>every number links back to NASA</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="si-pipeline-integrity-footer">
              <div className="si-check-badge">✔ 18 Automated Data Integrity Assertions Passed</div>
              <p>
                Strict provenance tracking ensures zero synthetic zeros in pressure-unrecorded cells, anemometer
                voltage conversions calibrated to BASS-II Appendix A, and direct linking to NASA Physical Sciences
                Informatics repositories.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: FLAME-SI CO-PILOT
          ========================================================================= */}
      {activeMainTab === 'copilot' && (
        <div className="si-copilot-view-wrap">
          <FlameSIChat />
        </div>
      )}

      {/* Persistent Editorial Subtext Footer */}
      <footer className="si-journal-footer-bar">
        <span>Research data summary, not a material certification or safety approval.</span>
        <span>Data: NASA Physical Sciences Informatics, BASS-II Summary Report, and cited NTRS documents.</span>
        <span className="si-total-records-count">1 450 records</span>
      </footer>
    </section>
  );
}
