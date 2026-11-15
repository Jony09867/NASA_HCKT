import React, { useState, useRef, useEffect } from 'react';
import {
  LoaderCircleIcon,
  CircleCheckIcon,
  ChevronDownIcon,
  TerminalIcon,
  GlobeIcon,
  ArrowUpIcon,
  RotateCwIcon,
  CopyIcon,
  CheckIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  SparklesIcon,
  RouteIcon,
  PlusIcon,
  MessageCircleDashedIcon,
  ArrowDownIcon,
} from 'lucide-react';
import FadeContent from './FadeContent';
import { Magnet } from './Magnet';
import {
  CombustionSim3D,
  CombustionTelemetryChart,
  computeCombustionPhysics,
  GRAVITY_REGIMES,
  FUEL_MATERIALS,
} from './CombustionSim3D';
import './FlameSIChat.css';

// Curated NASA PSI Knowledge Base Scenarios with full 3D Simulation, Chart & Situational Report configs
const KNOWLEDGE_BASE = {
  lunar: {
    title: 'Lunar Surface Base Fire Hazard Analysis (1/6g · 34% O₂)',
    simConfig: {
      gravityKey: '1/6g',
      materialKey: 'pmma',
      oxygen: 34,
      ventilation: 0.08,
      pressure: 10.2,
      chartTab: 'o2-curve',
    },
    reasoning: `1. Parsing mission atmospheric inputs: 34% O₂ concentration, 10.2 psi (70.3 kPa), 1/6 g Lunar gravity.
2. Calculating Oxygen Partial Pressure: P_O2 = (0.34 * 10.2) = 3.47 psi (+12.3% above Earth sea-level standard).
3. Initializing 3D WebGL Partial-Buoyancy Plume Simulation (1/6g, PMMA Cast Rod, 34% O₂) + O₂ vs Spread Chart + Live SI Report.
4. Cross-referencing NASA PSI Investigations: ACME: CFI-G (#7585), BASS-II (#922), and Saffire-III (#7449).`,
    tools: [
      { cmd: 'psi-query --atmosphere="34% O2" --pressure="10.2 psi" --gravity="0.166g"', output: 'Found 3 applicable flight investigations: ACME-CFIG, BASS-II, Saffire-III' },
      { cmd: 'si-engine --mode="adaptive-3d-sim+chart+report" --gravity="1/6g" --o2=34', output: 'Mounted 3D Volumetric Plume, 4-mode Telemetry Visualizer & Live Situational Report' },
    ],
    plan: [
      'Evaluate oxygen partial pressure (P_O2 = 3.47 psi) and LOI margin',
      'Enforce strict NASA-STD-6001 Flammability Thresholds on habitat textiles',
      'Set automated ventilation cut-off threshold (<0.10 m/s) upon thermal alarm',
      'Prepare fine-water-mist and CO2 inert gas dilution protocols',
    ],
    sources: [
      { title: 'NASA PSI: ACME CFI-G Flight Data', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=7585' },
      { title: 'NASA ISS CIR: BASS-II Investigation', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=922' },
      { title: 'NASA Saffire Spacecraft Fire Safety Reports', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1738' },
    ],
    reply: `### Lunar Surface Base (34% O₂ · 10.2 psi · 1/6 g) Fire Hazard Directive

Under the planned **Artemis Lunar Base Camp** atmospheric baseline, materials are substantially more flammable than on Earth:

* **Oxygen Partial Pressure (P_O2):** **3.47 psi** (vs. 3.09 psi Earth standard). The enriched 34% oxygen concentration reduces astronaut pre-breathing requirements for EVA, but lowers the ignition energy threshold of habitat fabrics and electronics insulation.
* **Flammability Multiplier:** Flight data from <span class="inv-action-tag" data-inv="acme-cfig">ACME: CFI-G ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span> confirm an **~80% increase in flame propagation velocity** for common polymers.
* **Live Situational Adaptation:** Change the gravity, material, or sliders in the **3D Simulation** below — both the **Telemetry Chart** and the **Live Adaptive SI Situation Report** automatically recalculate to reflect your new scenario.`,
  },

  spacesuit: {
    title: 'Spacesuit EVA (100% O₂ · 4.3 psi · 0g) Safety Limits',
    simConfig: {
      gravityKey: '0g',
      materialKey: 'nomex',
      oxygen: 100,
      ventilation: 0.06,
      pressure: 4.3,
      chartTab: 'hazard-radar',
    },
    reasoning: `1. Parsing EVA parameters: 100% pure Oxygen at 4.3 psi (29.6 kPa) in 0g microgravity.
2. Oxygen partial pressure = 4.30 psi (+39% above Earth sea level).
3. Initializing 3D WebGL Spherical Diffusion Simulation at 0g, 100% O₂, 4.3 psi on Nomex III weave + Hazard Matrix Chart.
4. Cross-referencing ACME: s-Flame (Investigation #1627) and ACME: CFI-G.`,
    tools: [
      { cmd: 'psi-eval --o2=100 --pressure=4.3 --gravity=0', output: 'Extreme Fire Hazard: Pure O2 atmospheric classification' },
      { cmd: 'si-engine --mode="adaptive-3d-sim+chart+report" --gravity="0g" --fuel="nomex" --o2=100', output: '3D isotropic spherical reaction shell & Hazard Matrix initialized' },
    ],
    plan: [
      'Assess 100% O2 pure chemical oxidation kinetics',
      'Eliminate all static discharge and electrical ignition sources',
      'Mandate non-combustible fluoropolymer wire jacketing',
    ],
    sources: [
      { title: 'NASA Apollo 1 Fire Investigation Records', url: 'https://www.nasa.gov/' },
      { title: 'NASA PSI: ACME s-Flame Spherical Combustion', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1627' },
    ],
    reply: `### Spacesuit EVA (100% O₂ · 4.3 psi) Critical Ignition Envelope

Spacesuits utilize **100% pure oxygen at 4.3 psi** to allow astronauts to bend glove fingers and joint bearings without fighting internal pressure. However, pure oxygen introduces extreme fire hazards:

* **Spontaneous Flammability:** In pure O₂, materials that are self-extinguishing in Earth air ignite instantaneously and burn rapidly.
* **3D Diffusion Spheres in Freefall:** As proven by <span class="inv-action-tag" data-inv="acme-s-flame">ACME: s-Flame ↗</span>, stationary flames in 0g form spherical envelopes. Rotate the **3D Simulation** below to inspect the omnidirectional reaction boundary and live hazard report.`,
  },

  smoke: {
    title: 'Forced Convection Flashover (Saffire-III) & Smoke Agglomeration',
    simConfig: {
      gravityKey: '0g',
      materialKey: 'cotton',
      oxygen: 34,
      ventilation: 0.24,
      pressure: 10.2,
      chartTab: 'airflow-curve',
    },
    reasoning: `1. Analyzing cabin ventilation forced convection (0.24 m/s) and microgravity smoke agglomeration.
2. Initializing 3D Forced-Convection Wake Cone Simulation (0.24 m/s airflow across Cotton-Fiberglass composite) + Airflow Dome Chart.
3. Reviewing SAME-R (Investigation #247) and Saffire-III (Investigation #7449).`,
    tools: [
      { cmd: 'psi-query --experiment="SAME-R" --type="particle-size"', output: 'Soot agglomeration confirmed: particles average 8x-12x larger diameter in 0g' },
      { cmd: 'si-engine --mode="adaptive-3d-sim+chart+report" --gravity="0g" --fuel="cotton" --airflow=0.24', output: '3D aerodynamic trailing wake & Airflow Flashover Envelope active' },
    ],
    plan: [
      'Map cabin forced-air circulation vectors to detector locations',
      'Calibrate optical obscuration thresholds for large soot clusters',
      'Throttle ventilation below 0.10 m/s during fire alerts to prevent flashover',
    ],
    sources: [
      { title: 'NASA PSI: SAME-R Smoke & Aerosol Investigation', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=247' },
      { title: 'NASA Saffire-III Forced Convection Study', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=7449' },
    ],
    reply: `### Why Forced Ventilation Drives Flashover & Smoke Agglomerates in 0g

In microgravity, both smoke detection and flame spread are governed by cabin ventilation:

* **Forced Convection Flashover (<span class="inv-action-tag" data-inv="saffire-iii">Saffire-III ↗</span>):** When cabin ventilation exceeds **0.14 m/s**, fresh oxygen is forced into the pyrolysis zone, stretching the 3D flame into a trailing wake cone. Drag **Cabin Ventilation** below **0.08 m/s** in the 3D simulator below to watch the flashover alert clear and the flame return to a blue sphere.
* **Particle Agglomeration (<span class="inv-action-tag" data-inv="same-r">SAME-R ↗</span>):** Because smoke particles aren't swept away by buoyancy in 0g, they collide and form **clusters 6 to 9 times larger** than terrestrial soot particles.`,
  },

  coolflames: {
    title: 'Cool Flames Discovery (FLEX) & Temperature Timeline',
    simConfig: {
      gravityKey: '0g',
      materialKey: 'pmma',
      oxygen: 15,
      ventilation: 0.03,
      pressure: 10.2,
      chartTab: 'time-series',
    },
    reasoning: `1. Inquiring into fuel extinction in low gravity near the Limiting Oxygen Index (15% O₂).
2. Reviewing the FLEX (Flame Extinguishment Experiment, Investigation #144) dataset.
3. Initializing 3D Simulation in 0g Cool-Flame Regime (15% O₂, 660 K low-temperature oxidation shell) + Temp Timeline Chart.`,
    tools: [
      { cmd: 'psi-query --experiment="FLEX" --fuel="Heptane"', output: 'Cool flame persistence verified across 40+ ISS droplet burns' },
      { cmd: 'si-engine --mode="adaptive-3d-sim+chart+report" --gravity="0g" --o2=15 --chart="time-series"', output: '3D 660 K cool-flame pulsing shell & Temporal Trajectory active' },
    ],
    plan: [
      'Monitor post-extinction fuel temperature via infrared radiometry',
      'Maintain inert gas blanket (CO2/He) until fuel surface drops below pyrolysis temp',
      'Avoid premature cabin repressurization or ventilation reactivation',
    ],
    sources: [
      { title: 'NASA Glenn: FLEX Droplet Extinguishment Experiment', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=144' },
      { title: 'Combustion Integrated Rack (CIR) Multi-user Droplet Apparatus', url: 'https://www.nasa.gov/' },
    ],
    reply: `### Cool Flames Discovery (<span class="inv-action-tag" data-inv="flex">FLEX ↗</span>) & Extinguishment Timeline

One of the most profound discoveries from NASA’s Combustion Integrated Rack was the phenomenon of **Cool Flames**:

* **Invisible Low-Temperature Combustion:** Near **15% O₂**, after the visible flame extinguishes, fuel continues oxidizing invisibly at **600 to 800 K** (shown in the **Temp Timeline** chart and pulsing 3D UV-cyan sphere below).
* **Live Reignition Test:** Increase the **O₂ Concentration** slider from **15% to 34%** in the 3D simulator below — watch the cool flame re-ignite and see the **SI Situation Report** update its hazard score and directives automatically!`,
  },

  earth: {
    title: '1g Earth Buoyant Teardrop vs. 0g Orbital Spherical Flame Comparison',
    simConfig: {
      gravityKey: '1g',
      materialKey: 'pmma',
      oxygen: 21,
      ventilation: 0.05,
      pressure: 14.7,
      chartTab: 'o2-curve',
    },
    reasoning: `1. Comparing terrestrial 1g buoyant combustion (21% O₂, 14.7 psi) against 0g microgravity combustion.
2. Initializing 3D Simulation in 1g Earth Baseline (tall flickering buoyant teardrop plume).`,
    tools: [
      { cmd: 'nasa-spinoff --field="fire-safety"', output: 'Over 40 commercial spinoffs identified in municipal firefighting and building safety' },
      { cmd: 'si-engine --mode="adaptive-3d-sim+chart+report" --gravity="1g" --o2=21 --pressure=14.7', output: '3D 1g Earth buoyant teardrop plume initialized' },
    ],
    plan: [
      'Compare 1g buoyant teardrop plume vs 0g spherical diffusion shell',
      'Highlight fine-water-mist suppression systems',
      'Detail firefighter thermal gear derived from spacesuits',
    ],
    sources: [
      { title: 'NASA Spinoff: Space Station Fire Technology on Earth', url: 'https://spinoff.nasa.gov/' },
      { title: 'NFPA Standards for Water-Mist Fire Suppression', url: 'https://www.nfpa.org/' },
    ],
    reply: `### From Orbit to Earth: Comparing 1g Buoyant Flames to 0g Freefall

On Earth (**1g, 21% O₂, 14.7 psi**), gravity pulls cold dense air downward and drives hot combustion gases upward into a **tall, flickering teardrop plume**, as shown in the 3D simulator below:

* **Interactive Gravity Comparison:** Toggle between **1g Earth**, **1/6g Lunar**, and **0g Microgravity** in the 3D simulator below to watch the tall yellow teardrop transform into a compact blue diffusion sphere while the **SI Situational Report** logs every physical change.`,
  },
};

const SUGGESTIONS = [
  { label: 'Simulate 0g Spherical vs 1/6g Lunar Fire (34% O₂)', key: 'lunar' },
  { label: 'Simulate Spacesuit EVA 100% O₂ Hazard Matrix', key: 'spacesuit' },
  { label: 'Simulate Forced Convection Flashover (0.24 m/s)', key: 'smoke' },
  { label: 'Simulate FLEX Cool-Flame Timeline (15% O₂)', key: 'coolflames' },
  { label: 'Compare 1g Earth Teardrop vs 0g Spherical Flame', key: 'earth' },
];

// Smart Situational Query Parser (supports both English and Uzbek prompts!)
function parseCustomQueryToSimConfig(query) {
  const q = query.toLowerCase();

  let gravityKey = '0g';
  if (q.includes('1/6') || q.includes('lunar') || q.includes('moon') || q.includes('oy') || q.includes('mars')) {
    gravityKey = '1/6g';
  } else if (q.includes('1g') || q.includes('earth') || q.includes('yer') || q.includes('teardrop')) {
    gravityKey = '1g';
  }

  let materialKey = 'pmma';
  if (q.includes('cotton') || q.includes('paxta') || q.includes('fabric') || q.includes('saffire')) {
    materialKey = 'cotton';
  } else if (q.includes('silicone') || q.includes('silikon') || q.includes('rubber')) {
    materialKey = 'silicone';
  } else if (q.includes('nomex') || q.includes('suit') || q.includes('skafandr')) {
    materialKey = 'nomex';
  }

  const o2Match = q.match(/(\d{2,3})\s*%/);
  const oxygen = o2Match
    ? Math.max(12, Math.min(100, Number(o2Match[1])))
    : q.includes('cool') || q.includes('sovuq')
    ? 15
    : q.includes('eva') || q.includes('skafandr')
    ? 100
    : gravityKey === '1/6g'
    ? 34
    : 21;

  const flowMatch = q.match(/(\d+(?:\.\d+)?)\s*m\/s/);
  const ventilation = flowMatch
    ? Math.max(0, Math.min(0.55, Number(flowMatch[1])))
    : q.includes('forced') ||
      q.includes('wind') ||
      q.includes('vent') ||
      q.includes('flashover') ||
      q.includes('shamol') ||
      q.includes('oqim')
    ? 0.24
    : 0.08;

  const psiMatch = q.match(/(\d+(?:\.\d+)?)\s*psi/);
  const pressure = psiMatch
    ? Math.max(4.0, Math.min(14.7, Number(psiMatch[1])))
    : gravityKey === '1/6g'
    ? 10.2
    : gravityKey === '1g'
    ? 14.7
    : 4.3;

  let chartTab = 'o2-curve';
  if (ventilation >= 0.14 || q.includes('flow') || q.includes('vent') || q.includes('shamol')) {
    chartTab = 'airflow-curve';
  } else if (oxygen <= 16 || q.includes('cool') || q.includes('time') || q.includes('vaqt')) {
    chartTab = 'time-series';
  } else if (q.includes('hazard') || q.includes('risk') || q.includes('xavf') || q.includes('radar')) {
    chartTab = 'hazard-radar';
  }

  return { gravityKey, materialKey, oxygen, ventilation, pressure, chartTab };
}

function buildDynamicSituationalReply(query, simConfig) {
  const phys = computeCombustionPhysics(simConfig);
  const grav = GRAVITY_REGIMES[simConfig.gravityKey] || GRAVITY_REGIMES['0g'];
  const mat = FUEL_MATERIALS[simConfig.materialKey] || FUEL_MATERIALS.pmma;

  return `### FLAME-SI Dynamic Situational Report: ${phys.regimeTitle}

Based on your scenario (**"${query}"**), FLAME-SI configured the **3D WebGL Chamber**, **Telemetry Chart**, and **Live Situational Report** to **${grav.badge}** with **${mat.name}** at **${simConfig.oxygen}% O₂**, **${simConfig.pressure.toFixed(1)} psi**, and **${simConfig.ventilation.toFixed(2)} m/s** airflow:

* **Computed Flame Regime & Spread:** Spread rate is **${phys.spreadRate}x** baseline with a peak reaction temperature of **${phys.flameTemp} K** and oxygen partial pressure **P_O2 = ${phys.pO2} psi** (**${phys.o2Margin >= 0 ? `+${phys.o2Margin}% above` : `${phys.o2Margin}% below`}** the ${phys.effectiveLOI}% LOI threshold from <span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span>).
* **Convection & Soot Dynamics:** Under **${simConfig.ventilation.toFixed(2)} m/s** (${phys.ventilationRegime}), soot particles agglomerate to **${phys.sootClusterScale}× Earth diameter** (<span class="inv-action-tag" data-inv="same-r">SAME-R ↗</span>). ${
    phys.flashoverWarning
      ? 'Forced airflow exceeds 0.14 m/s, creating an active flashover wake hazard (<span class="inv-action-tag" data-inv="saffire-iii">Saffire-III ↗</span>).'
      : 'Low airflow keeps the reaction diffusion-dominated (<span class="inv-action-tag" data-inv="acme-s-flame">ACME: s-Flame ↗</span>).'
  }
* **Interactive Real-Time Recalculation:** Any adjustment you make to the gravity, material, or sliders in the 3D simulator below will immediately update the **Telemetry Chart** and the **Live SI Situational Report** at the bottom of the card.`;
}

function AssistantInteractiveBundle({ msg }) {
  const [activeModality, setActiveModality] = useState('all');
  const [liveSimState, setLiveSimState] = useState(
    msg.simConfig || {
      gravityKey: '0g',
      materialKey: 'pmma',
      oxygen: 34,
      ventilation: 0.08,
      pressure: 4.3,
      chartTab: 'o2-curve',
    }
  );

  return (
    <div className="chat-multimodal-bundle">
      {/* Modality Switcher */}
      <div className="chat-modality-bar" role="tablist" aria-label="Response Output Mode">
        {[
          { id: 'all', label: '✦ Text + Visualize + 3D Sim + SI Report' },
          { id: 'text', label: '📝 Text Analysis' },
          { id: 'visualize', label: '📊 Dynamic Charts' },
          { id: 'simulation', label: '🔥 3D Sim & Live Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeModality === tab.id}
            className={`chat-modality-btn ${activeModality === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveModality(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. TEXT MODALITY */}
      {(activeModality === 'all' || activeModality === 'text') && (
        <div className="assistant-text">
          <ChatText text={msg.text} />
        </div>
      )}

      {/* 2. DYNAMIC TELEMETRY VISUALIZATION MODALITY */}
      {(activeModality === 'all' || activeModality === 'visualize') && (
        <div className="chat-inline-viz-wrap">
          <CombustionTelemetryChart
            gravityKey={liveSimState.gravityKey}
            materialKey={liveSimState.materialKey}
            oxygen={liveSimState.oxygen}
            ventilation={liveSimState.ventilation}
            pressure={liveSimState.pressure}
            defaultTab={msg.simConfig?.chartTab || 'o2-curve'}
          />
        </div>
      )}

      {/* 3. INTERACTIVE 3D WEBGL SIMULATION + LIVE ADAPTIVE SI REPORT */}
      {(activeModality === 'all' || activeModality === 'simulation') && (
        <div className="chat-inline-sim-wrap">
          <div className="chat-inline-sim-banner">
            <span>INTERACTIVE 3D WEBGL COMBUSTION CHAMBER & ADAPTIVE SI REPORT</span>
            <small>Change any parameter below to dynamically update 3D flame, charts & report</small>
          </div>
          <CombustionSim3D
            initialGravity={msg.simConfig?.gravityKey || '0g'}
            initialMaterial={msg.simConfig?.materialKey || 'pmma'}
            initialOxygen={msg.simConfig?.oxygen ?? 34}
            initialVentilation={msg.simConfig?.ventilation ?? 0.08}
            initialPressure={msg.simConfig?.pressure ?? 4.3}
            compact
            showReport
            onStateChange={(nextState) => setLiveSimState((prev) => ({ ...prev, ...nextState }))}
          />
        </div>
      )}
    </div>
  );
}

export default function FlameSIChat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-user',
      role: 'user',
      text: 'Simulate 0g Spherical vs 1/6g Lunar Fire (34% O₂) on PMMA with dynamic charts and situational report',
    },
    {
      id: 'welcome-assistant',
      role: 'assistant',
      reasoning: KNOWLEDGE_BASE.lunar.reasoning,
      tools: KNOWLEDGE_BASE.lunar.tools,
      plan: KNOWLEDGE_BASE.lunar.plan,
      sources: KNOWLEDGE_BASE.lunar.sources,
      text: KNOWLEDGE_BASE.lunar.reply,
      simConfig: {
        gravityKey: '0g',
        materialKey: 'pmma',
        oxygen: 34,
        ventilation: 0.08,
        pressure: 4.3,
        chartTab: 'o2-curve',
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const sendTimer = useRef(null);
  const followLatest = useRef(true);
  useEffect(() => () => clearTimeout(sendTimer.current), []);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});

  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current && followLatest.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleTagClick = (e) => {
    const target = e.target.closest('.inv-action-tag');
    if (target) {
      const invId = target.getAttribute('data-inv');
      const exploreSection = document.querySelector('#explore');
      if (exploreSection) {
        exploreSection.scrollIntoView({ behavior: 'smooth' });
      }
      const searchInput = document.querySelector('#search');
      if (searchInput && invId) {
        searchInput.value = invId;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = { id: userMsgId, role: 'user', text: query };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    followLatest.current = true;
    setIsStreaming(true);

    const qLower = query.toLowerCase();
    let matched = null;

    // Check if the user specified custom numbers (e.g., "45% O2", "0.35 m/s", "8 psi")
    const hasCustomNumbers = /(\d{2,3})\s*%|\d+(?:\.\d+)?\s*(?:m\/s|psi)/.test(qLower) &&
      !SUGGESTIONS.some((s) => s.label.toLowerCase() === qLower);

    if (!hasCustomNumbers && (qLower.includes('lunar') || qLower.includes('34%'))) {
      matched = KNOWLEDGE_BASE.lunar;
    } else if (!hasCustomNumbers && (qLower.includes('spacesuit') || qLower.includes('eva') || qLower.includes('100%'))) {
      matched = KNOWLEDGE_BASE.spacesuit;
    } else if (!hasCustomNumbers && (qLower.includes('smoke') || qLower.includes('saffire') || qLower.includes('0.24'))) {
      matched = KNOWLEDGE_BASE.smoke;
    } else if (!hasCustomNumbers && (qLower.includes('cool') || qLower.includes('flex') || qLower.includes('15%'))) {
      matched = KNOWLEDGE_BASE.coolflames;
    } else if (!hasCustomNumbers && (qLower.includes('earth') || qLower.includes('teardrop'))) {
      matched = KNOWLEDGE_BASE.earth;
    } else {
      const customSim = parseCustomQueryToSimConfig(query);
      const customPhys = computeCombustionPhysics(customSim);
      matched = {
        title: `SI Situational Synthesis: ${customPhys.regimeTitle}`,
        simConfig: customSim,
        reasoning: `1. Parsing situational inputs from prompt: "${query}"
2. Extracted parameters: Gravity = ${customSim.gravityKey}, Material = ${customSim.materialKey.toUpperCase()}, O₂ = ${customSim.oxygen}%, Ventilation = ${customSim.ventilation.toFixed(2)} m/s, Pressure = ${customSim.pressure.toFixed(1)} psi.
3. Computed physical state: Regime = ${customPhys.regimeTitle}, Spread Rate = ${customPhys.spreadRate}x, Flame Temp = ${customPhys.flameTemp} K, Hazard Score = ${customPhys.hazardScore}/100.
4. Reconfiguring 3D WebGL shaders, ${customSim.chartTab} telemetry plot, and situational engineering report.`,
        tools: [
          { cmd: `psi-search --gravity="${customSim.gravityKey}" --material="${customSim.materialKey}" --o2=${customSim.oxygen}`, output: `LOI = ${customPhys.effectiveLOI}%, PO2 = ${customPhys.pO2} psi, Soot Cluster = ${customPhys.sootClusterScale}x` },
          { cmd: `si-adapt-sim --regime="${customPhys.regimeCode}" --chart="${customSim.chartTab}"`, output: 'Updated 3D volumetric flame shader, telemetry curve & situational report' },
        ],
        plan: [
          `Verify LOI flammability margin (${customPhys.o2Margin >= 0 ? '+' : ''}${customPhys.o2Margin}% relative to ${customPhys.effectiveLOI}% LOI)`,
          `Control cabin airflow (${customSim.ventilation.toFixed(2)} m/s active) below 0.10 m/s threshold`,
          `Calibrate optical smoke detection for ${customPhys.sootClusterScale}x soot agglomeration`,
        ],
        sources: [
          { title: 'NASA Physical Science Informatics (PSI) Database', url: 'https://psi.nasa.gov/' },
          { title: 'NASA ISS BASS-II & Saffire Combustion Data', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=922' },
        ],
        reply: buildDynamicSituationalReply(query, customSim),
      };
    }

    const assistantMsgId = `asst-${Date.now()}`;
    const partialAssistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      reasoning: matched.reasoning,
      tools: matched.tools,
      plan: matched.plan,
      sources: matched.sources,
      text: matched.reply,
      simConfig: matched.simConfig,
    };

    sendTimer.current = setTimeout(() => {
      setMessages((prev) => [...prev, partialAssistantMsg]);
      setIsStreaming(false);
    }, 550);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id, type) => {
    setFeedback((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const handleReset = () => {
    clearTimeout(sendTimer.current);
    setMessages([]);
    setInput('');
    setIsStreaming(false);
    setFeedback({});
    setShowLatest(false);
    followLatest.current = true;
  };

  return (
    <section className="flame-chat-container" aria-label="FLAME-SI research chat">
      <header className="flame-chat-header">
        <div>
          <span className="chat-eyebrow">
            FLAME-SI / ADAPTIVE CO-PILOT (TEXT · DYNAMIC CHARTS · 3D SIMULATION · SI REPORT)
          </span>
          <h3>Situational Combustion & Fire Safety Intelligence</h3>
          <p>
            Enter any mission parameters or scenario — FLAME-SI dynamically adapts the 3D WebGL simulation, telemetry graphs, and engineering report.
          </p>
        </div>
        <Magnet padding={35} maxOffset={5} magnetStrength={3}>
          <button
            className="flame-reset-btn"
            type="button"
            onClick={handleReset}
            aria-label="Reset conversation"
            title="Clear thread"
          >
            <RotateCwIcon size={17} />
          </button>
        </Magnet>
      </header>

      <div className="chat-scroll-shell">
        <div
          className="flame-chat-body"
          ref={chatBodyRef}
          aria-busy={isStreaming}
          onClick={handleTagClick}
          onScroll={(e) => {
            const el = e.currentTarget;
            const near = el.scrollHeight - el.scrollTop - el.clientHeight < 70;
            followLatest.current = near;
            setShowLatest(!near);
          }}
        >
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <MessageCircleDashedIcon size={28} />
              </div>
              <h4>What mission scenario would you like to simulate?</h4>
              <p>
                FLAME-SI dynamically reconfigures its 3D WebGL combustion chamber, 4-mode telemetry charts, and situational safety report for any input.
              </p>
              <div className="chat-starters">
                {SUGGESTIONS.map((item) => (
                  <Magnet key={item.key} padding={35} maxOffset={5} magnetStrength={3}>
                    <button type="button" onClick={() => handleSend(item.label)}>
                      {item.label}
                      <ArrowUpIcon size={14} />
                    </button>
                  </Magnet>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <FadeContent key={msg.id} trigger="mount" duration={0.2} blur={false}>
              {msg.role === 'user' ? (
                <div className="chat-msg user">
                  <div className="bubble-user">{msg.text}</div>
                </div>
              ) : (
                <article className="chat-msg assistant">
                  <div className="assistant-label">
                    <SparklesIcon size={14} /> FLAME-SI{' '}
                    <span>Adaptive Synthesis · Text + Dynamic Charts + 3D Sim + Live Report</span>
                  </div>

                  {msg.reasoning && (
                    <details className="chat-trace">
                      <summary>
                        <CircleCheckIcon size={15} /> View Chain-of-Thought & Situational Parameter Trace{' '}
                        <ChevronDownIcon size={14} />
                      </summary>
                      <div className="trace-content">
                        {msg.reasoning}
                        {msg.tools?.length > 0 && (
                          <div className="trace-steps-list">
                            <span className="trace-demo-label">
                              FLAME-SI adaptive simulation & PSI retrieval pipeline
                            </span>
                            {msg.tools.map((tool, i) => (
                              <details key={i} className="chat-tool">
                                <summary>
                                  <TerminalIcon size={14} />
                                  <code>{tool.cmd}</code>
                                </summary>
                                <pre>{tool.output}</pre>
                              </details>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  <AssistantInteractiveBundle msg={msg} />

                  {msg.plan?.length > 0 && (
                    <details className="chat-plan">
                      <summary>
                        <RouteIcon size={14} /> Review Situational Safety Directives{' '}
                        <ChevronDownIcon size={14} />
                      </summary>
                      <ul>
                        {msg.plan.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="sources-bar">
                    {msg.sources?.map((source, i) => (
                      <Magnet key={i} padding={35} maxOffset={5} magnetStrength={3}>
                        <a
                          className="source-pill"
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <GlobeIcon size={12} />
                          {source.title} ↗
                        </a>
                      </Magnet>
                    ))}
                  </div>

                  <div className="msg-footer">
                    <Magnet padding={35} maxOffset={5} magnetStrength={3}>
                      <button
                        type="button"
                        aria-label="Copy response"
                        onClick={() => handleCopy(msg.id, msg.text)}
                      >
                        {copiedId === msg.id ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                      </button>
                    </Magnet>
                    <Magnet padding={35} maxOffset={5} magnetStrength={3}>
                      <button
                        type="button"
                        aria-label="Helpful response"
                        aria-pressed={feedback[msg.id] === 'up'}
                        onClick={() => handleFeedback(msg.id, 'up')}
                      >
                        <ThumbsUpIcon size={15} />
                      </button>
                    </Magnet>
                    <Magnet padding={35} maxOffset={5} magnetStrength={3}>
                      <button
                        type="button"
                        aria-label="Unhelpful response"
                        aria-pressed={feedback[msg.id] === 'down'}
                        onClick={() => handleFeedback(msg.id, 'down')}
                      >
                        <ThumbsDownIcon size={15} />
                      </button>
                    </Magnet>
                  </div>
                </article>
              )}
            </FadeContent>
          ))}

          {isStreaming && (
            <div className="chat-loading" role="status">
              <LoaderCircleIcon size={16} className="chat-spin" />
              Adapting 3D WebGL shaders, telemetry curves & situational engineering report…
            </div>
          )}
        </div>

        {showLatest && (
          <button
            type="button"
            className="chat-scroll-latest"
            aria-label="Scroll to latest message"
            onClick={() => {
              const el = chatBodyRef.current;
              el.scrollTop = el.scrollHeight;
              followLatest.current = true;
              setShowLatest(false);
            }}
          >
            <ArrowDownIcon size={16} />
          </button>
        )}
      </div>

      <div className="chat-input-area">
        <div className="chat-quick-Chips">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="chat-quick-chip"
              onClick={() => handleSend(item.label)}
            >
              {item.label} ↗
            </button>
          ))}
        </div>
        <form
          className="chat-input-box"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <textarea
            className="chat-textarea"
            aria-label="Message FLAME-SI"
            placeholder="Type any scenario (e.g. '1/6g Lunar cotton fire at 45% O2 and 0.28 m/s airflow' or '0g cool flame 15% O2')…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form.requestSubmit();
              }
            }}
          />
          <div className="chat-input-footer">
            <details className="chat-context">
              <summary aria-label="Add mission context" title="Select simulation scenario">
                <PlusIcon size={18} />
              </summary>
              <div className="chat-context-menu">
                <span>SITUATIONAL 3D SCENARIOS</span>
                {SUGGESTIONS.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={(e) => {
                      e.currentTarget.closest('details').open = false;
                      handleSend(item.label);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </details>
            <span className="chat-mode">
              <GlobeIcon size={13} /> Adaptive 3D Sim · 4 Charts · Live Report
            </span>
            <Magnet
              padding={35}
              maxOffset={5}
              magnetStrength={3}
              disabled={isStreaming || !input.trim()}
            >
              <button
                type="submit"
                className="chat-send-btn"
                aria-label="Send message"
                disabled={isStreaming || !input.trim()}
              >
                {isStreaming ? (
                  <LoaderCircleIcon size={17} className="chat-spin" />
                ) : (
                  <ArrowUpIcon size={19} />
                )}
              </button>
            </Magnet>
          </div>
        </form>
        <p className="chat-input-hint">
          Situational AI Engine · Dynamically updates 3D WebGL Flame, Telemetry Graphs & Safety Report
        </p>
      </div>
    </section>
  );
}

function ChatText({ text }) {
  const inline = (value) =>
    value
      .split(/(\*\*[^*]+\*\*|<span class="inv-action-tag" data-inv="[^"]+">[^<]+<\/span>)/g)
      .map((part, i) => {
        if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        const match = part.match(
          /^<span class="inv-action-tag" data-inv="([^"]+)">([^<]+)<\/span>$/
        );
        return match ? (
          <button type="button" key={i} className="inv-action-tag" data-inv={match[1]}>
            {match[2]}
          </button>
        ) : (
          part
        );
      });

  return text.split(/\n\n+/).map((block, i) =>
    block.startsWith('### ') ? (
      <h4 key={i}>{inline(block.slice(4))}</h4>
    ) : block.startsWith('* ') ? (
      <ul key={i}>
        {block.split('\n').map((line, j) => (
          <li key={j}>{inline(line.replace(/^\* /, ''))}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{inline(block)}</p>
    )
  );
}
