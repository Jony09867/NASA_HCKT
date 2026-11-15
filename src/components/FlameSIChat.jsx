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
  FlameIcon,
  LayersIcon,
  Maximize2Icon,
  MessageSquareIcon,
} from 'lucide-react';
import FadeContent from './FadeContent';
import { Magnet } from './Magnet';
import GlassSurface from './GlassSurface';
import CombustionSim3D, { CombustionTelemetryChart } from './CombustionSim3D';
import './FlameSIChat.css';
import { readSession, writeSession, CHAT_KEY } from '../session';

// Extract simulation parameters from any natural language query (English or Uzbek)
export function parseCustomQueryToSimConfig(query = '') {
  const q = String(query).toLowerCase();

  // 1. Gravity regime
  let gravityKey = '0g';
  if (
    q.includes('lunar') ||
    q.includes('oy') ||
    q.includes('moon') ||
    q.includes('1/6') ||
    q.includes('artemis')
  ) {
    gravityKey = '1/6g';
  } else if (
    q.includes('earth') ||
    q.includes('yer') ||
    q.includes('1g') ||
    q.includes('terrestrial') ||
    q.includes('buoyant plume') ||
    q.includes('sham')
  ) {
    gravityKey = '1g';
  } else if (
    q.includes('0g') ||
    q.includes('microgravity') ||
    q.includes('mikrogravitatsiya') ||
    q.includes('freefall') ||
    q.includes('iss') ||
    q.includes('orbital') ||
    q.includes('flex') ||
    q.includes('s-flame') ||
    q.includes('cool flame') ||
    q.includes('space')
  ) {
    gravityKey = '0g';
  }

  // 2. Fuel Material
  let materialKey = 'pmma';
  if (
    q.includes('cotton') ||
    q.includes('paxta') ||
    q.includes('fabric') ||
    q.includes('composite') ||
    q.includes('saffire')
  ) {
    materialKey = 'cotton';
  } else if (
    q.includes('silicone') ||
    q.includes('kauchuk') ||
    q.includes('rezina') ||
    q.includes('rubber') ||
    q.includes('elastomer')
  ) {
    materialKey = 'silicone';
  } else if (
    q.includes('nomex') ||
    q.includes('aramid') ||
    q.includes('spacesuit') ||
    q.includes('skafandr') ||
    q.includes('eva') ||
    q.includes('kevlar')
  ) {
    materialKey = 'nomex';
  } else if (
    q.includes('pmma') ||
    q.includes('plexiglass') ||
    q.includes('akril') ||
    q.includes('plastic') ||
    q.includes('plastmassa')
  ) {
    materialKey = 'pmma';
  }

  // 3. Oxygen Concentration (%)
  let oxygen = 34;
  const o2PercentMatch = q.match(/(\d{1,3})\s*%\s*(?:o2|oxygen|kislorod)?/);
  const o2WordMatch = q.match(
    /(?:o2|oxygen|kislorod)\s*(?:darajasi|miqdori|level|concentration)?\s*(?:of|=|:)?\s*(\d{1,3})/
  );
  if (o2PercentMatch) {
    oxygen = Math.max(12, Math.min(100, parseInt(o2PercentMatch[1], 10)));
  } else if (o2WordMatch) {
    oxygen = Math.max(12, Math.min(100, parseInt(o2WordMatch[1], 10)));
  } else if (
    q.includes('eva') ||
    q.includes('spacesuit') ||
    q.includes('skafandr') ||
    q.includes('pure o2') ||
    q.includes('100%')
  ) {
    oxygen = 100;
  } else if (q.includes('lunar') || q.includes('artemis')) {
    oxygen = 34;
  } else if (q.includes('iss') || q.includes('earth') || q.includes('yer') || q.includes('sea level')) {
    oxygen = 21;
  } else if (q.includes('cool flame') || q.includes('extinguish') || q.includes('quench')) {
    oxygen = 15;
  }

  // 4. Cabin Ventilation Velocity (m/s)
  let ventilation = 0.1;
  const ventMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:m\/s|mps)/);
  if (ventMatch) {
    ventilation = Math.max(0.0, Math.min(0.55, parseFloat(ventMatch[1])));
  } else if (
    q.includes('forced convection') ||
    q.includes('majburiy') ||
    q.includes('shamollatish') ||
    q.includes('wake') ||
    q.includes('wind') ||
    q.includes('fan')
  ) {
    ventilation = 0.22;
  } else if (
    q.includes('quiescent') ||
    q.includes('tinч') ||
    q.includes('harakatsiz') ||
    q.includes('no flow') ||
    q.includes('stagnant')
  ) {
    ventilation = 0.02;
  }

  // 5. Cabin Ambient Pressure (psi)
  let pressure = 4.3;
  const psiMatch = q.match(/(\d+(?:\.\d+)?)\s*psi/);
  const kpaMatch = q.match(/(\d+(?:\.\d+)?)\s*kpa/);
  if (psiMatch) {
    pressure = Math.max(4.0, Math.min(14.7, parseFloat(psiMatch[1])));
  } else if (kpaMatch) {
    pressure = Math.max(4.0, Math.min(14.7, parseFloat(kpaMatch[1]) / 6.895));
  } else if (q.includes('lunar') || q.includes('artemis')) {
    pressure = 8.2;
  } else if (q.includes('spacesuit') || q.includes('eva')) {
    pressure = 4.3;
  } else if (q.includes('iss') || q.includes('earth')) {
    pressure = 14.7;
  }

  return { gravityKey, materialKey, oxygen, ventilation, pressure };
}

// Curated NASA PSI Knowledge Base Responses
const KNOWLEDGE_BASE = {
  lunar: {
    title: 'Lunar Surface Base Fire Hazard Analysis',
    simConfig: {
      gravityKey: '1/6g',
      materialKey: 'pmma',
      oxygen: 34,
      ventilation: 0.08,
      pressure: 8.2,
    },
    reasoning: `1. Parsing mission atmospheric inputs: 34% O₂ concentration, 8.2 psi (56.5 kPa), 1/6 g Lunar gravity.
2. Calculating Oxygen Partial Pressure: P_O2 = (0.34 * 8.2) = 2.79 psi. Elevated oxygen concentration significantly accelerates oxidation kinetics.
3. Simulating material flammability: Materials show an estimated +82% upward flame spread rate compared to terrestrial norms.
4. Cross-referencing NASA PSI Investigations:
   - ACME: CFI-G (Investigation #7585) for elevated O₂ limits up to 85%.
   - BASS-II (Investigation #922) for PMMA and solid polymer extinction boundaries.
   - Saffire-I & III (Investigation #1738) for low-speed ventilation flashover thresholds.
5. Evaluating partial-gravity plume dynamics: 1/6 g creates a transitional weakly-convective boundary layer where buoyant heat loss is insufficient to self-extinguish flames without active intervention.`,
    tools: [
      {
        cmd: 'psi-query --atmosphere="34% O2" --pressure="8.2 psi" --gravity="0.166g"',
        output: 'Found 3 applicable flight investigations: ACME-CFIG (#7585), BASS-II (#922), Saffire-III (#1738)',
      },
      {
        cmd: 'calc-flammability-index --fuel="PMMA" --o2=34 --flow=0.08',
        output: 'Limiting Oxygen Index (LOI) exceeded; relative spread rate: 1.36x; flashover risk elevated',
      },
    ],
    plan: [
      'Evaluate oxygen partial pressure (P_O2 = 2.79 psi)',
      'Enforce strict NASA-STD-6001 Flammability Thresholds on habitat textiles',
      'Set automated ventilation cut-off threshold (<0.10 m/s) upon thermal alarm',
      'Prepare fine-water-mist and CO2 inert gas dilution protocols',
    ],
    sources: [
      {
        title: 'NASA PSI: ACME CFI-G Flight Data',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=7585',
      },
      {
        title: 'NASA ISS CIR: BASS-II Investigation',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=922',
      },
      {
        title: 'NASA Saffire Spacecraft Fire Safety Reports',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1738',
      },
    ],
    reply: `### Lunar Surface Base (34% O₂ · 8.2 psi · 1/6 g) Fire Hazard Directive

Under the planned **Artemis Lunar Base Camp** atmospheric baseline, materials are substantially more flammable than on Earth:

* **Oxygen Partial Pressure ($P_{O2}$):** **2.79 psi** at 8.2 psi total cabin pressure. The enriched 34% oxygen concentration reduces astronaut pre-breathing requirements for EVA, but lowers the ignition energy threshold of habitat fabrics and electronics insulation.
* **Flammability Multiplier:** Laboratory and flight data from <span class="inv-action-tag" data-inv="acme-cfig">ACME: CFI-G ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span> indicate an **~80% increase in flame propagation velocity (1.36x)** for common polymers (like PMMA and Nomex composites).
* **1/6th Lunar Gravity Physics:** Natural buoyancy is reduced to one-sixth. Hot gases do not rise rapidly to dissipate heat, allowing the flame to form a **3D hemispherical / bell-shaped plume** that superheats surrounding materials without triggering traditional ceiling smoke sensors.
* **Critical Safety Protocol:** In the event of a thermal event, cabin ventilation fans must be instantly throttled below **0.10 m/s** (<span class="inv-action-tag" data-inv="saffire-iii">Saffire-III ↗</span> confirmed that forced airflow transitions smoldering into an open flashover).`,
  },

  spacesuit: {
    title: 'Spacesuit EVA (100% O₂ · 4.3 psi) Safety Limits',
    simConfig: {
      gravityKey: '0g',
      materialKey: 'nomex',
      oxygen: 100,
      ventilation: 0.02,
      pressure: 4.3,
    },
    reasoning: `1. Parsing EVA parameters: 100% pure Oxygen at 4.3 psi (29.6 kPa) in 0g microgravity.
2. Oxygen partial pressure = 4.30 psi (+39% above Earth sea level).
3. Reviewing historical precedents: Apollo 1 (1967 pure oxygen launchpad flashover).
4. Evaluating microgravity ignition dynamics: Without natural convection, a static spark creates an instantaneous spherical flame envelope.
5. Cross-referencing ACME: s-Flame (Investigation #1627) and ACME: CFI-G.`,
    tools: [
      {
        cmd: 'psi-eval --o2=100 --pressure=4.3 --gravity=0',
        output: 'Extreme Fire Hazard: Pure O2 atmospheric classification',
      },
      {
        cmd: 'loi-check --materials=["Nylon", "Teflon", "Kevlar", "Nomex"]',
        output: 'Only fluoropolymers and polybenzimidazole (PBI) meet 100% O2 ignition criteria',
      },
    ],
    plan: [
      'Assess 100% O2 pure chemical oxidation kinetics',
      'Eliminate all static discharge and electrical ignition sources',
      'Mandate non-combustible fluoropolymer wire jacketing',
    ],
    sources: [
      { title: 'NASA Apollo 1 Fire Investigation Records', url: 'https://www.nasa.gov/' },
      {
        title: 'NASA PSI: ACME s-Flame Spherical Combustion',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1627',
      },
    ],
    reply: `### Spacesuit EVA (100% O₂ · 4.3 psi) Critical Ignition Envelope

Spacesuits utilize **100% pure oxygen at 4.3 psi** to allow astronauts to bend glove fingers and joint bearings without fighting internal pressure. However, pure oxygen introduces extreme fire hazards:

* **Spontaneous Flammability:** In pure O₂, materials that are self-extinguishing in Earth air ignite instantaneously and burn explosively.
* **Diffusion Spheres in Freefall:** As proven by <span class="inv-action-tag" data-inv="acme-s-flame">ACME: s-Flame ↗</span>, stationary flames in 0g form spherical envelopes. Oxygen diffuses inward from all directions, creating very hot localized reaction zones.
* **NASA Safety Mandates:** Strict grounding to eliminate electrostatic discharge; all internal electronics are enclosed in inert nitrogen-purged channels, and fabrics are strictly limited to fluoropolymer composites and Teflon-jacketed wiring.`,
  },

  smoke: {
    title: 'Microgravity Smoke & Particle Detection Dynamics',
    simConfig: {
      gravityKey: '0g',
      materialKey: 'cotton',
      oxygen: 21,
      ventilation: 0.12,
      pressure: 14.7,
    },
    reasoning: `1. Analyzing terrestrial vs microgravity smoke transport.
2. On Earth, hot buoyant plumes rapidly lift smoke aerosols to ceiling detectors.
3. In microgravity (0g), buoyant plumes do not exist. Aerosols drift only via slow diffusion and cabin air conditioning ventilation.
4. Reviewing SAME and SAME-R (Smoke and Aerosol Measurement Experiment, Investigation #247).
5. Reviewing DAFT-2 for distinguishing lunar regolith dust from fire aerosols.`,
    tools: [
      {
        cmd: 'psi-query --experiment="SAME-R" --type="particle-size"',
        output: 'Soot agglomeration confirmed: particles average 8x-12x larger diameter in 0g',
      },
      {
        cmd: 'daft2-spectral-analysis --aerosol="regolith-vs-pyrolysis"',
        output: 'Dual-wavelength optical discrimination calibrated',
      },
    ],
    plan: [
      'Map cabin forced-air circulation vectors to detector locations',
      'Calibrate optical obscuration thresholds for large soot clusters',
      'Deploy multi-spectral sensors to filter out ambient Lunar dust',
    ],
    sources: [
      {
        title: 'NASA PSI: SAME-R Smoke & Aerosol Investigation',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=247',
      },
      {
        title: 'NASA ISS DAFT Dust Measurement Study',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html',
      },
    ],
    reply: `### Why Terrestrial Smoke Detectors Fail in Microgravity

Standard home and building smoke alarms rely on hot air rising to the ceiling. In space, fire detection requires a completely different physics model:

* **Absence of Buoyant Plumes:** Without gravity, hot smoke does not rise. It accumulates into a localized cloud around the overheating wire or device.
* **Particle Agglomeration (SAME-R Discovery):** <span class="inv-action-tag" data-inv="same-r">SAME-R ↗</span> discovered that because smoke particles aren't swept away, they collide with each other and form **clusters 8 to 12 times larger** than terrestrial soot particles. Terrestrial optical ionization sensors miscalculate their density.
* **Lunar Regolith Dust Interference (DAFT-2):** On Moon and Mars bases, abrasive surface dust brought inside by spacesuits triggers optical alarms. Multi-angle laser scattering is required to differentiate between jagged mineral dust and spherical pyrolysis smoke.`,
  },

  coolflames: {
    title: 'Cool Flames Discovery & Suppression Architecture',
    simConfig: {
      gravityKey: '0g',
      materialKey: 'pmma',
      oxygen: 15,
      ventilation: 0.03,
      pressure: 14.7,
    },
    reasoning: `1. Inquiring into liquid fuel droplet extinction in low gravity.
2. Reviewing the FLEX (Flame Extinguishment Experiment, Investigation #144) and FLEX-2 datasets.
3. Phenomenon: Droplet burning apparent extinction (flame vanishes optically), yet fuel droplet continues evaporating at elevated rates.
4. Chemical mechanism: Low-temperature chemical oxidation (600 - 800 K) sustained by slow radical diffusion in spherical geometry.
5. Fire suppression impact: Extinguishing the visible flame does not guarantee safety; re-introducing oxygen can trigger explosive flash reignition.`,
    tools: [
      {
        cmd: 'psi-query --experiment="FLEX" --fuel="Heptane"',
        output: 'Cool flame persistence verified across 40+ ISS droplet burns',
      },
      {
        cmd: 'suppressant-efficiency --agent="CO2" --agent="Helium"',
        output: 'Helium conducts thermal energy away faster; CO2 acts as chemical heat capacity sink',
      },
    ],
    plan: [
      'Monitor post-extinction droplet temperature via infrared radiometry',
      'Maintain inert gas blanket (CO2/He) until fuel surface drops below pyrolysis temp',
      'Avoid premature cabin repressurization or ventilation reactivation',
    ],
    sources: [
      {
        title: 'NASA Glenn: FLEX Droplet Extinguishment Experiment',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=144',
      },
      {
        title: 'Combustion Integrated Rack (CIR) Multi-user Droplet Apparatus',
        url: 'https://www.nasa.gov/',
      },
    ],
    reply: `### Cool Flames Discovery (<span class="inv-action-tag" data-inv="flex">FLEX ↗</span>) & Extinguishment Protocols

One of the most profound discoveries from NASA’s Combustion Integrated Rack was the phenomenon of **Cool Flames**:

* **Invisible Low-Temperature Combustion:** During <span class="inv-action-tag" data-inv="flex">FLEX ↗</span> droplet burning tests, astronauts observed that after the visible yellow flame extinguished, the fuel droplet continued burning invisibly at **600 to 800 K** (normal flames burn at 1500–2000 K).
* **The Reignition Hazard:** Because cool flames produce no visible light and little soot, crew members would assume the fire was out. If fresh air is supplied, the cool flame can suddenly transition back into a raging high-temperature fire.
* **Inert Suppression Protocol:** Fire suppression in spacecraft cannot rely on briefly spraying an extinguishing agent. The compartment must remain saturated with **CO₂ or Helium diluent** until temperature sensors verify that all surfaces have cooled below their chemical reaction thresholds.`,
  },

  earth: {
    title: 'NASA Space Combustion Technologies Applied to Earth',
    simConfig: {
      gravityKey: '1g',
      materialKey: 'pmma',
      oxygen: 21,
      ventilation: 0.1,
      pressure: 14.7,
    },
    reasoning: `1. Identifying technology transfers from NASA Physical Science Informatics to terrestrial life.
2. Fine-water-mist fire suppression on the ISS replacing toxic Halon on Earth.
3. Commercial aviation cargo fire suppression without water damage or hazardous gas.
4. Firefighter personal protective equipment (PPE): PBI thermal suits and lightweight composite breathing tanks derived from astronaut life support systems.`,
    tools: [
      {
        cmd: 'nasa-spinoff --field="fire-safety"',
        output: 'Over 40 commercial spinoffs identified in municipal firefighting and building safety',
      },
    ],
    plan: [
      'Highlight fine-water-mist suppression systems',
      'Detail firefighter thermal gear derived from spacesuits',
      'Explain commercial clean-room optical smoke sensors',
    ],
    sources: [
      { title: 'NASA Spinoff: Space Station Fire Technology on Earth', url: 'https://spinoff.nasa.gov/' },
      { title: 'NFPA Standards for Water-Mist Fire Suppression', url: 'https://www.nfpa.org/' },
    ],
    reply: `### From Orbit to Earth: How NASA Fire Science Protects Us Daily

NASA’s microgravity combustion research directly powers everyday life-safety technologies across the globe:

1. **Fine-Water-Mist Fire Extinguishers:**
   Developed for the ISS to avoid suffocating astronauts with CO₂ or damaging delicate avionics with water hoses. Today, fine-water-mist systems protect **hospital ICUs, nuclear power plants, historic museums, and data server facilities** on Earth.
2. **Advanced Firefighter Protective Gear:**
   The flame-resistant fabrics worn by municipal firefighters (PBI and Nomex blends) and their **lightweight carbon-composite breathing tanks** were originally developed for astronaut spacesuits following the Apollo fire investigation.
3. **Early-Warning Aviation Smoke Sensors:**
   Laser particle sensors refined during the <span class="inv-action-tag" data-inv="same-r">SAME ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS ↗</span> experiments are now standard in modern commercial airliner cargo holds and clean-room manufacturing plants.`,
  },
};

// Initial Pre-Seeded Multimodal Conversation
const PRE_SEEDED_MESSAGES = [
  {
    id: 'seed-user-1',
    role: 'user',
    text: 'Evaluate Lunar Base 34% O2 with PMMA fuel: compare 0g microgravity vs 1/6g Lunar partial buoyancy and open flashover risks.',
  },
  {
    id: 'seed-asst-1',
    role: 'assistant',
    query: 'Evaluate Lunar Base 34% O2 with PMMA fuel: compare 0g microgravity vs 1/6g Lunar partial buoyancy and open flashover risks.',
    reasoning: `1. Parsing query parameters: 34% O₂ enriched atmosphere, 8.2 psi (56.5 kPa), 1/6g Lunar gravity vs 0g baseline.
2. Calculating Oxygen Partial Pressure: P_O2 = (0.34 * 8.2) = 2.79 psi. Elevated oxygen concentration significantly accelerates oxidation kinetics.
3. Evaluating PMMA (Plexiglass, BASS-II #922) pyrolysis: Limiting Oxygen Index (LOI) drops to ~15.2% under low-gravity conditions.
4. Analyzing Partial-Gravity Plume Dynamics: In 1/6g Lunar gravity, weak buoyant convection stretches the spherical diffusion flame into a hemispherical bell. Unlike Earth (where 1g natural updraft rapidly cools the flame base), weak lunar buoyancy cannot disperse heat effectively, creating a superheated local pyrolysis zone.
5. Evaluating Forced Convection Flashover (NASA Saffire-III #1738): Cabin ventilation airflow >= 0.10 m/s supplies forced oxidizer flux, transitioning smoldering polymers into rapid open flashover.`,
    tools: [
      {
        cmd: 'psi-query --atmosphere="34% O2" --gravity="0.166g" --fuel="PMMA"',
        output: 'Found 3 applicable flight investigations: ACME-CFIG (#7585), BASS-II (#922), Saffire-III (#1738)',
      },
      {
        cmd: 'calc-spread-rate --g=0.166 --o2=34 --flow=0.08',
        output: 'Relative flame spread rate: 1.36x vs terrestrial baseline; flashover threshold: 0.10 m/s',
      },
    ],
    plan: [
      'Analyze 34% O₂ enriched partial pressure and ignition kinetics',
      'Compare 3D spherical diffusion (0g) with 3D hemispherical plume (1/6g)',
      'Inspect live telemetry: 1.36x spread rate, 1040 K flame temp at 34% O₂',
      'Establish automated ventilation shutdown threshold (<0.10 m/s) on thermal detection',
    ],
    sources: [
      {
        title: 'NASA PSI: ACME CFI-G Flight Data (#7585)',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=7585',
      },
      {
        title: 'NASA ISS CIR: BASS-II Flame Extinction (#922)',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=922',
      },
      {
        title: 'NASA Saffire-III Spacecraft Fire Safety (#1738)',
        url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1738',
      },
    ],
    simConfig: {
      gravityKey: '1/6g',
      materialKey: 'pmma',
      oxygen: 34,
      ventilation: 0.08,
      pressure: 8.2,
    },
    text: `### Artemis Lunar Base (34% O₂ · 1/6g Lunar · PMMA) Multimodal Safety Analysis

Under the planned **Artemis Lunar Base Camp** atmospheric baseline, combustion physics changes fundamentally compared to both Earth and ISS freefall:

* **3D Flame Geometry & Partial Buoyancy:** In 1/6th gravity, natural convection is too weak to create a rapid cooling updraft like on Earth, yet strong enough to deform the flame into a **3D hemispherical / bell-shaped plume** (documented in <span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span> and <span class="inv-action-tag" data-inv="acme-cfig">ACME: CFI-G ↗</span>).
* **34% O₂ Enriched Acceleration:** The elevated 34% oxygen concentration raises flame temperatures to **~1040 K** and accelerates flame spread rate to **1.36x** over standard terrestrial baseline.
* **Saffire-III Forced Flashover Warning:** Low-speed cabin airflow between **0.10–0.35 m/s** acts as a continuous oxidizer feeder. Life-support ventilation fans must automatically shut down immediately upon smoke detection to prevent open flashover.

*Use the 3D Combustion Studio on the right to orbit the flame 360°, inspect telemetry curves, and adjust environmental parameters in real time.*`,
  },
];

const SUGGESTIONS = [
  { label: 'Evaluate Lunar Base Fire Hazard (34% O2)', key: 'lunar' },
  { label: 'Why is 100% O2 in spacesuits dangerous?', key: 'spacesuit' },
  { label: 'Why do smoke detectors fail in 0g?', key: 'smoke' },
  { label: 'What is a cool flame and how to extinguish it?', key: 'coolflames' },
  { label: 'How does NASA fire research help Earth?', key: 'earth' },
];

export default function FlameSIChat() {
  const [messages, setMessages] = useState(() => {
    const saved = readSession(CHAT_KEY, {});
    if (Array.isArray(saved?.messages) && saved.messages.length > 0) {
      return saved.messages.filter(
        (m) => m && typeof m.text === 'string' && ['user', 'assistant'].includes(m.role)
      );
    }
    return PRE_SEEDED_MESSAGES;
  });

  const [input, setInput] = useState(() => {
    const name = new URLSearchParams(location.search).get('investigation');
    return name
      ? 'Explain the findings and documented conditions of ' + name + '.'
      : String(readSession(CHAT_KEY, {})?.draft || '');
  });

  // Current active simulation state loaded on the large 3D Studio Stage
  const [activeSim, setActiveSim] = useState(() => {
    const lastAsst = PRE_SEEDED_MESSAGES.find((m) => m.role === 'assistant');
    return (
      lastAsst?.simConfig || {
        gravityKey: '1/6g',
        materialKey: 'pmma',
        oxygen: 34,
        ventilation: 0.08,
        pressure: 8.2,
      }
    );
  });

  // View Mode: 'studio' (Split Chat + 3D Stage), 'chat' (Chat Focus), 'stage' (3D Stage Focus)
  const [viewMode, setViewMode] = useState('studio');

  useEffect(() => {
    writeSession(CHAT_KEY, { messages, draft: input });
  }, [messages, input]);

  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.delete('investigation');
    history.replaceState(null, '', url.pathname + url.search);
  }, []);

  const [isStreaming, setIsStreaming] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const sendTimer = useRef(null);
  const followLatest = useRef(true);
  useEffect(() => () => clearTimeout(sendTimer.current), []);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});

  const chatBodyRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = 0;
      }
      return;
    }
    if (chatBodyRef.current && followLatest.current && isStreaming) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleTagClick = (e) => {
    const target = e.target.closest('.inv-action-tag');
    if (target) {
      const invId = target.getAttribute('data-inv');
      if (invId) window.location.assign('/explore/?id=' + encodeURIComponent(invId));
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
    if (
      qLower.includes('lunar') ||
      qLower.includes('oy') ||
      qLower.includes('moon') ||
      qLower.includes('34%')
    ) {
      matched = KNOWLEDGE_BASE.lunar;
    } else if (
      qLower.includes('spacesuit') ||
      qLower.includes('skafandr') ||
      qLower.includes('eva') ||
      qLower.includes('100%')
    ) {
      matched = KNOWLEDGE_BASE.spacesuit;
    } else if (
      qLower.includes('smoke') ||
      qLower.includes('tutun') ||
      qLower.includes('detector') ||
      qLower.includes('datchik') ||
      qLower.includes('same')
    ) {
      matched = KNOWLEDGE_BASE.smoke;
    } else if (
      qLower.includes('cool') ||
      qLower.includes('flex') ||
      qLower.includes('suppress') ||
      qLower.includes("o'chirish") ||
      qLower.includes('droplet')
    ) {
      matched = KNOWLEDGE_BASE.coolflames;
    } else if (
      qLower.includes('earth') ||
      qLower.includes('yer') ||
      qLower.includes('firefighter') ||
      qLower.includes('spinoff')
    ) {
      matched = KNOWLEDGE_BASE.earth;
    } else {
      const dynamicConfig = parseCustomQueryToSimConfig(query);
      matched = {
        title: `SI Combustion Synthesis: "${query.slice(0, 32)}..."`,
        simConfig: dynamicConfig,
        reasoning: `1. Analyzing query: "${query}" across NASA Physical Science Informatics database.
2. Assessing gravitational environment parameters (${dynamicConfig.gravityKey} gravity at ${dynamicConfig.oxygen}% O₂).
3. In reduced gravity, absence or weakening of buoyancy suppresses natural convective cooling, allowing diffusion flame envelopes to dominate.
4. Cross-referencing relevant combustion hardware: Combustion Integrated Rack (CIR) and Microgravity Science Glovebox (MSG).
5. Synthesizing safety implications for habitable spacecraft compartments.`,
        tools: [
          {
            cmd: `psi-search --query="${query.slice(0, 24)}" --g="${dynamicConfig.gravityKey}"`,
            output: 'Found correlations across BASS-II, ACME, and Saffire experiments',
          },
          {
            cmd: `evaluate-safety-envelope --oxygen=${dynamicConfig.oxygen} --ventilation=${dynamicConfig.ventilation}`,
            output: 'Calculated safety thresholds and ventilation velocity limits',
          },
        ],
        plan: [
          'Examine buoyancy-free diffusion mechanics',
          'Evaluate oxygen flammability boundaries and Limiting Oxygen Index (LOI)',
          'Determine suppression and ventilation control protocols',
        ],
        sources: [
          {
            title: 'NASA Physical Science Informatics (PSI) Database',
            url: 'https://psi.nasa.gov/',
          },
          {
            title: 'NASA Glenn Research Center Combustion Integrated Rack',
            url: 'https://www.nasa.gov/',
          },
        ],
        reply: `### NASA SI Multimodal Fire Safety Analysis

Regarding **"${query}"**:

In microgravity and enclosed space environments, fire behaves in ways counterintuitive to terrestrial experience:

* **Diffusion vs. Buoyancy:** Without gravity, heated gases do not rise. Flames lack the natural buoyancy-driven convective cooling of Earth, causing them to form **spherical or hemispherical diffusion-limited reaction zones**.
* **Airflow Sensitivity:** Because diffusion is slow, any slight forced cabin ventilation (such as 0.1 to 0.5 m/s from life-support fans) supplies a continuous stream of oxidizer, as demonstrated in the <span class="inv-action-tag" data-inv="saffire-i">Saffire-I ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span> flight experiments.
* **Extinguishment & Prevention:** NASA standards require limiting flammable solids through strict **NASA-STD-6001** certification, keeping inert gas (CO₂/He) dilution reserves ready, and ensuring automatic air circulation shutdown upon thermal warning.`,
      };
    }

    const nextConfig = matched.simConfig || parseCustomQueryToSimConfig(query);
    setActiveSim(nextConfig);

    const assistantMsgId = `asst-${Date.now()}`;
    const partialAssistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      query: query,
      simConfig: nextConfig,
      reasoning: matched.reasoning,
      tools: matched.tools,
      plan: matched.plan,
      sources: matched.sources,
      text: matched.reply,
    };

    sendTimer.current = setTimeout(() => {
      setMessages((prev) => [...prev, partialAssistantMsg]);
      setIsStreaming(false);
    }, 700);
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
    writeSession(CHAT_KEY, { messages: [], draft: '' });
    setMessages([]);
    setInput('');
    setIsStreaming(false);
    setFeedback({});
    setShowLatest(false);
    followLatest.current = true;
  };

  const handleStageSimChange = (params) => {
    setActiveSim((prev) => ({
      ...prev,
      gravityKey: params.gravityKey || prev.gravityKey,
      materialKey: params.materialKey || prev.materialKey,
      oxygen: params.oxygen !== undefined ? params.oxygen : prev.oxygen,
      ventilation: params.ventilation !== undefined ? params.ventilation : prev.ventilation,
      pressure: params.pressure !== undefined ? params.pressure : prev.pressure,
    }));
  };

  return (
    <div className={`flame-studio-workspace view--${viewMode}`}>
      {/* ══════════════════════════════════════════════════════════════════════
         LEFT PANE: Research Dialogue & Text Analysis Thread
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="flame-chat-pane flame-chat-container" aria-label="FLAME-SI Research Chat">
        <header className="flame-chat-header">
          <div>
            <span className="chat-eyebrow">FLAME-SI / RESEARCH AI</span>
            <h3>Combustion Dialogue</h3>
            <p>Multimodal Text + Live 3D Simulation Sync</p>
          </div>

          <div className="chat-header-actions">
            <div className="stage-view-toggles" role="group" aria-label="Studio View Toggles">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'studio' ? 'is-active' : ''}`}
                onClick={() => setViewMode('studio')}
                title="Split Studio View (Chat on left, 3D on right)"
              >
                <LayersIcon size={13} /> Studio
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'chat' ? 'is-active' : ''}`}
                onClick={() => setViewMode('chat')}
                title="Chat Only View"
              >
                <MessageSquareIcon size={13} /> Chat
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'stage' ? 'is-active' : ''}`}
                onClick={() => setViewMode('stage')}
                title="Full 3D Stage"
              >
                <Maximize2Icon size={13} /> 3D Stage
              </button>
            </div>

            <GlassSurface
              as="button"
              type="button"
              onClick={handleReset}
              aria-label="Reset conversation"
              title="Reset conversation"
              className="flame-reset-btn"
              borderRadius={8}
            >
              <RotateCwIcon size={16} />
            </GlassSurface>
          </div>
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
                <h4>What would you like to explore?</h4>
                <p>
                  Discover NASA microgravity combustion experiments, compare mission envelopes,
                  and watch the 3D chamber on the right react live.
                </p>
                <div className="chat-starters">
                  {SUGGESTIONS.slice(0, 3).map((item) => (
                    <GlassSurface
                      as="button"
                      key={item.key}
                      type="button"
                      onClick={() => handleSend(item.label)}
                      borderRadius={8}
                    >
                      {item.label}
                      <ArrowUpIcon size={14} />
                    </GlassSurface>
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
                      <SparklesIcon size={14} /> FLAME-SI <span>Multimodal Intelligence</span>
                    </div>

                    {/* Active In 3D Stage Sync Pill */}
                    {msg.simConfig && (
                      <button
                        type="button"
                        className="stage-sync-pill"
                        onClick={() => {
                          setActiveSim(msg.simConfig);
                          if (window.innerWidth < 1024) setViewMode('stage');
                        }}
                        title="Load these exact parameters onto the 3D Stage"
                      >
                        <FlameIcon size={13} />
                        <span>
                          Synced in 3D Stage: {msg.simConfig.gravityKey} · {msg.simConfig.oxygen}% O₂ ·{' '}
                          {msg.simConfig.materialKey.toUpperCase()}
                        </span>
                        <ArrowUpIcon size={12} style={{ transform: 'rotate(45deg)' }} />
                      </button>
                    )}

                    {/* Chain of Thought / PSI Derivation Notes */}
                    {msg.reasoning && (
                      <details className="chat-trace">
                        <summary>
                          <CircleCheckIcon size={15} /> Chain-of-Thought & PSI Derivation{' '}
                          <ChevronDownIcon size={14} />
                        </summary>
                        <div className="trace-content">
                          {msg.reasoning}
                          {msg.tools?.length > 0 && (
                            <div className="trace-steps-list">
                              <span className="trace-demo-label">
                                NASA PSI Engine Query · Telemetry Sync
                              </span>
                              {msg.tools.map((tool, i) => (
                                <details key={i} className="chat-tool" open>
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

                    {/* Scientific Explanation Text */}
                    <div className="assistant-text">
                      <ChatText text={msg.text} />
                    </div>

                    {/* Discussion Points */}
                    {msg.plan?.length > 0 && (
                      <details className="chat-plan">
                        <summary>
                          <RouteIcon size={14} /> Review discussion points{' '}
                          <ChevronDownIcon size={14} />
                        </summary>
                        <ul>
                          {msg.plan.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </details>
                    )}

                    {/* Verified NASA PSI Citations */}
                    <div className="sources-bar">
                      {msg.sources?.map((source, i) => (
                        <a
                          key={i}
                          className="source-pill"
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <GlobeIcon size={12} />
                          {source.title} ↗
                        </a>
                      ))}
                    </div>

                    <div className="msg-footer">
                      <button
                        type="button"
                        aria-label="Copy response"
                        onClick={() => handleCopy(msg.id, msg.text)}
                      >
                        {copiedId === msg.id ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
                      </button>
                      <button
                        type="button"
                        aria-label="Helpful response"
                        aria-pressed={feedback[msg.id] === 'up'}
                        onClick={() => handleFeedback(msg.id, 'up')}
                      >
                        <ThumbsUpIcon size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Unhelpful response"
                        aria-pressed={feedback[msg.id] === 'down'}
                        onClick={() => handleFeedback(msg.id, 'down')}
                      >
                        <ThumbsDownIcon size={15} />
                      </button>
                    </div>
                  </article>
                )}
              </FadeContent>
            ))}

            {isStreaming && (
              <div className="chat-loading" role="status">
                <LoaderCircleIcon size={16} className="chat-spin" />
                Synthesizing NASA research & 3D WebGL physics…
              </div>
            )}
          </div>

          {showLatest && (
            <GlassSurface
              as="button"
              type="button"
              className="chat-scroll-latest"
              aria-label="Scroll to latest message"
              borderRadius={8}
              onClick={() => {
                const el = chatBodyRef.current;
                el.scrollTop = el.scrollHeight;
                followLatest.current = true;
                setShowLatest(false);
              }}
            >
              <ArrowDownIcon size={16} />
            </GlassSurface>
          )}
        </div>

        {/* Input Bar */}
        <div className="chat-input-area">
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
              placeholder="Ask about microgravity, 34% O2, cool flames, or lunar combustion…"
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
                <summary aria-label="Add mission context" title="Add mission context">
                  <PlusIcon size={18} />
                </summary>
                <div className="chat-context-menu">
                  <span>MISSION SCENARIOS</span>
                  {SUGGESTIONS.map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      onClick={(e) => {
                        setInput(item.label);
                        e.currentTarget.closest('details').open = false;
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </details>

              <span className="chat-mode">
                <GlobeIcon size={13} /> NASA PSI · 3D WebGL
              </span>

              <Magnet padding={35} maxOffset={5} magnetStrength={3} disabled={isStreaming || !input.trim()}>
                <GlassSurface
                  as="button"
                  type="submit"
                  className="chat-send-btn"
                  aria-label="Send message"
                  disabled={isStreaming || !input.trim()}
                  borderRadius={8}
                >
                  {isStreaming ? (
                    <LoaderCircleIcon size={17} className="chat-spin" />
                  ) : (
                    <ArrowUpIcon size={19} />
                  )}
                </GlassSurface>
              </Magnet>
            </div>
          </form>

          <p className="chat-input-hint">
            Enter to send · Shift + Enter for newline · Live synced with 3D Stage
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
         RIGHT PANE: Full-Page 3D WebGL Combustion Chamber & Telemetry Studio
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="flame-stage-pane" aria-label="3D Combustion Chamber and Telemetry Studio">
        <div className="stage-top-bar">
          <div className="stage-title-wrap">
            <span className="stage-badge">
              <span className="pulse-dot" />
              COMBUSTION INTEGRATED RACK (CIR) · 3D WEBGL STUDIO
            </span>
            <h3>Microgravity Combustion Simulation & PSI Telemetry</h3>
          </div>

          <div className="stage-view-toggles" role="group" aria-label="Studio View Toggles">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'studio' ? 'is-active' : ''}`}
              onClick={() => setViewMode('studio')}
              title="Split Studio View (Chat on left, 3D on right)"
            >
              <LayersIcon size={13} /> Studio
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'chat' ? 'is-active' : ''}`}
              onClick={() => setViewMode('chat')}
              title="Chat Only View"
            >
              <MessageSquareIcon size={13} /> Chat
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'stage' ? 'is-active' : ''}`}
              onClick={() => setViewMode('stage')}
              title="Full 3D Stage"
            >
              <Maximize2Icon size={13} /> 3D Stage
            </button>
          </div>
        </div>

        <div className="stage-scroll-body">
          {/* Full-Scale 3D WebGL Combustion Chamber */}
          <CombustionSim3D
            initialGravity={activeSim.gravityKey}
            initialMaterial={activeSim.materialKey}
            initialOxygen={activeSim.oxygen}
            initialVentilation={activeSim.ventilation}
            initialPressure={activeSim.pressure}
            compact={false}
            onStateChange={handleStageSimChange}
          />

          {/* Interactive Scientific Telemetry Curves & Extinction Envelopes */}
          <div className="stage-chart-wrap">
            <CombustionTelemetryChart
              gravityKey={activeSim.gravityKey}
              materialKey={activeSim.materialKey}
              oxygen={activeSim.oxygen}
              ventilation={activeSim.ventilation}
              pressure={activeSim.pressure}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// Render curated message markup as safe React nodes
function ChatText({ text }) {
  const inline = (value) =>
    value
      .split(/(\*\*[^*]+\*\*|<span class="inv-action-tag" data-inv="[^"]+">[^<]+<\/span>)/g)
      .map((part, i) => {
        if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        const match = part.match(/^<span class="inv-action-tag" data-inv="([^"]+)">([^<]+)<\/span>$/);
        return match ? (
          <button type="button" key={i} className="inv-action-tag" data-inv={match[1]}>
            {match[2]}
          </button>
        ) : (
          part
        );
      });

  return text
    .split(/\n\n+/)
    .map((block, i) =>
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
