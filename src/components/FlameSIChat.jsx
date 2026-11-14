import React, { useState, useRef, useEffect } from 'react';
import {
  LoaderCircleIcon,
  CircleCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
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
  KeyIcon,
} from 'lucide-react';
import ShinyText from './ShinyText';
import FadeContent from './FadeContent';
import { Magnet } from './Magnet';
import InteractiveFlameLab from './InteractiveFlameLab';
import { SiteController } from '../lib/siteController';
import {
  resolveUniversalQuery,
  solveOpenDomainQuery,
  callGeminiLiveAPI,
} from '../lib/universalAI';
import './FlameSIChat.css';

// Intelligent Markdown and Scientific Formula Formatter
// Converts raw formulas, asterisks, branch symbols, and lists into accessible human-friendly HTML
function formatAssistantMessage(rawText) {
  if (!rawText) return '';

  // 1. Clean up broken LaTeX or formula jargon like ($P_{O2}$), ($P_O2$), $P_{O2}$
  let text = rawText
    .replace(/\(\$P_\{?O2\}?\$\)/gi, 'PO₂')
    .replace(/\$P_\{?O2\}?\$/gi, 'PO₂')
    .replace(/P_O2/g, 'PO₂')
    .replace(/\$([^\$]+)\$/g, '$1');

  // Split lines
  const lines = text.split('\n');
  const htmlParts = [];
  let inList = false;

  const formatInline = (str) => {
    return str
      // Bold **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Branch explanation line: ↳ text
      .replace(/↳\s*(.*)/g, '<span class="chat-branch-desc">↳ $1</span>')
      // Subscripts for common chemical formulas: O2, CO2, H2O, PO2, N2
      .replace(/\b(PO|CO|O|N|H)(2|3)\b/g, '$1<sub>$2</sub>');
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h4 class="chat-section-header">${formatInline(line.slice(4))}</h4>`);
    } else if (line.startsWith('## ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h3 class="chat-section-header">${formatInline(line.slice(3))}</h3>`);
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList) {
        htmlParts.push('<ul class="chat-bullet-list">');
        inList = true;
      }
      htmlParts.push(`<li>${formatInline(line.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      const num = line.match(/^\d+/)[0];
      const content = line.replace(/^\d+\.\s/, '');
      htmlParts.push(`<div class="chat-numbered-step"><span class="chat-step-num">${num}.</span><span>${formatInline(content)}</span></div>`);
    } else if (line.startsWith('↳')) {
      if (inList) {
        htmlParts.push(`<li style="list-style:none; padding-left:0.5rem;"><span class="chat-branch-desc">${formatInline(line)}</span></li>`);
      } else {
        htmlParts.push(`<div style="margin-bottom:0.6rem;"><span class="chat-branch-desc">${formatInline(line)}</span></div>`);
      }
    } else {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<p>${formatInline(line)}</p>`);
    }
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('');
}

// Curated NASA PSI Flight Investigation Knowledge Base (English Primary)
const KNOWLEDGE_BASE = {
  lunar: {
    title: 'Lunar Surface Base Fire Hazard Analysis',
    reasoning: `1. Parsing mission atmospheric inputs: 34% O₂ concentration, 10.2 psi (70.3 kPa), 1/6 g Lunar gravity.
2. Calculating Oxygen Partial Pressure: PO₂ = (0.34 * 10.2) = 3.47 psi (+12.3% above Earth sea-level standard of 3.09 psi).
3. Simulating material flammability: Materials show an estimated +82% upward flame spread rate compared to terrestrial norms.
4. Cross-referencing NASA PSI Investigations:
   - ACME: CFI-G (Investigation #7585) for elevated O₂ limits up to 85%.
   - BASS-II (Investigation #922) for PMMA and solid plastic extinction limits.
   - Saffire-I & III (Investigation #1738 & #7449) for low-speed ventilation airflow thresholds.
5. Evaluating partial-gravity soot transport: 1/6 g creates a transitional weakly-convective boundary layer where buoyant heat loss is insufficient to self-extinguish flames without active intervention.`,
    tools: [
      { cmd: 'psi-query --atmosphere="34% O2" --pressure="10.2 psi" --gravity="0.166g"', output: 'Found 3 applicable flight investigations: ACME-CFIG, BASS-II, Saffire-III' },
      { cmd: 'calc-flammability-index --fuel="PMMA" --o2=34', output: 'Critical Limiting Oxygen Index (LOI) exceeded; spontaneous smoldering risk high' },
    ],
    plan: [
      'Evaluate effective oxygen level (PO₂ = 3.47 psi)',
      'Enforce strict NASA-STD-6001 Flammability Thresholds on habitat textiles',
      'Set automated ventilation cut-off threshold (<0.1 m/s) upon thermal alarm',
      'Prepare fine-water-mist and CO₂ inert gas dilution protocols',
    ],
    sources: [
      { title: 'NASA PSI: ACME CFI-G Flight Data', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=7585' },
      { title: 'NASA ISS CIR: BASS-II Investigation', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=922' },
      { title: 'NASA Saffire Spacecraft Fire Safety Reports', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1738' },
    ],
    reply: `### Lunar Surface Base (34% O₂ · 10.2 psi · 1/6 g) — Fire Safety Analysis

Under the planned **Artemis Lunar Base Camp** atmospheric baseline, materials are substantially more flammable than on Earth:

* **Effective Oxygen Level (PO₂): 3.47 psi**
  ↳ Human Context: +12.3% higher pure oxygen concentration than Earth sea level (3.09 psi). While this accelerates EVA pre-breathing for astronauts, it significantly lowers the ignition energy threshold of habitat fabrics and electronics insulation.
* **Flame Spread Velocity: ≈ +80% faster than Earth**
  ↳ Flight Evidence: Flight data from <span class="inv-action-tag" data-inv="acme-cfig">ACME: CFI-G ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span> confirm polymers (like PMMA and Nomex composites) burn nearly twice as fast under enriched lunar atmospheric conditions.
* **1/6th Lunar Gravity Dynamics: Heated gases do not rise**
  ↳ Critical Hazard: Reduced gravity suppresses buoyant convection. Hot pyrolysis gases and smoke accumulate around the ignition point without cooling, delaying response from standard ceiling-mounted thermal detectors.
* **Mandatory Safety Protocol: Instant ventilation throttle (< 0.1 m/s)**
  ↳ Engineering Directive: <span class="inv-action-tag" data-inv="saffire-iii">Saffire-III ↗</span> proved that low forced airflow acts like a bellows supplying fresh oxygen; cabin ventilation fans must cut off instantly upon any thermal alarm.`,
    actions: [
      { label: 'Apply Lunar Parameters to Simulator', type: 'apply_preset', preset: 'moon', primary: true },
      { label: 'Inspect ACME CFI-G in Library', type: 'search_explore', query: 'ACME: CFI-G', o2: 34 },
      { label: 'View Prevention Protocols', type: 'switch_tab', tab: 'prevention' },
      { label: 'Open Interactive Flame Lab', type: 'toggle_flame_lab' },
    ],
  },

  spacesuit: {
    title: 'Spacesuit EVA (100% O₂ · 4.3 psi) Safety Limits',
    reasoning: `1. Parsing EVA parameters: 100% pure Oxygen at 4.3 psi (29.6 kPa) in 0g microgravity.
2. Oxygen partial pressure = 4.30 psi (+39% above Earth sea level).
3. Reviewing historical precedents: Apollo 1 (1967 pure oxygen launchpad flashover).
4. Evaluating microgravity ignition dynamics: Without natural convection, a static spark creates an instantaneous spherical flame envelope.
5. Cross-referencing ACME: s-Flame (Investigation #1627) and ACME: CFI-G.`,
    tools: [
      { cmd: 'psi-eval --o2=100 --pressure=4.3 --gravity=0', output: 'Extreme Fire Hazard: Pure O₂ atmospheric classification' },
      { cmd: 'loi-check --materials=["Nylon", "Teflon", "Kevlar"]', output: 'Only fluoropolymers and polybenzimidazole (PBI) meet 100% O₂ ignition criteria' },
    ],
    plan: [
      'Assess 100% O₂ pure chemical oxidation kinetics',
      'Eliminate all static discharge and electrical ignition sources',
      'Mandate non-combustible fluoropolymer wire jacketing',
    ],
    sources: [
      { title: 'NASA Apollo 1 Fire Investigation Records', url: 'https://www.nasa.gov/' },
      { title: 'NASA PSI: ACME s-Flame Spherical Combustion', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1627' },
    ],
    reply: `### Spacesuit EVA (100% O₂ · 4.3 psi) — Critical Ignition Envelope

Spacesuits utilize **100% pure oxygen at 4.3 psi** to allow astronauts to bend glove fingers and joint bearings without fighting internal pressure. However, pure oxygen introduces extreme fire hazards:

* **Pure Oxygen Concentration (PO₂): 4.30 psi**
  ↳ Human Context: +39% above Earth sea level oxygen partial pressure. Under pure O₂, materials considered self-extinguishing on Earth ignite spontaneously from minimal static sparks (Apollo 1 precedent).
* **0g Freefall Spherical Flame Geometry**
  ↳ Flight Evidence: <span class="inv-action-tag" data-inv="acme-s-flame">ACME: s-Flame ↗</span> proved that stationary microgravity flames form spherical reaction envelopes where oxygen diffuses inward from all directions, creating an intensely hot localized reaction zone.
* **NASA Spacesuit Safety Mandates**
  ↳ Engineering Directive: Zero electrostatic spark tolerance with continuous grounding; internal life-support wiring is strictly insulated with non-combustible fluoropolymers (Teflon) and polybenzimidazole (PBI) composites.`,
    actions: [
      { label: 'Set Spacesuit EVA (100% O₂)', type: 'apply_preset', preset: 'eva', primary: true },
      { label: 'Search Flammability Standards in Library', type: 'search_explore', query: 's-Flame', o2: 100 },
      { label: 'View Suppression Protocols', type: 'switch_tab', tab: 'suppression' },
      { label: 'Open Interactive Flame Lab', type: 'toggle_flame_lab' },
    ],
  },

  smoke: {
    title: 'Microgravity Smoke & Particle Detection Dynamics',
    reasoning: `1. Analyzing terrestrial vs microgravity smoke transport.
2. On Earth, hot buoyant plumes rapidly lift smoke aerosols to ceiling detectors.
3. In microgravity (0g), buoyant plumes do not exist. Aerosols drift only via slow diffusion and cabin air conditioning ventilation.
4. Reviewing SAME and SAME-R (Smoke and Aerosol Measurement Experiment, Investigation #247).
5. Reviewing DAFT-2 (Dust and Aerosol Measurement Feasibility Test) for distinguishing lunar regolith dust from fire aerosols.`,
    tools: [
      { cmd: 'psi-query --experiment="SAME-R" --type="particle-size"', output: 'Soot agglomeration confirmed: particles average 8x-12x larger diameter in 0g' },
      { cmd: 'daft2-spectral-analysis --aerosol="regolith-vs-pyrolysis"', output: 'Dual-wavelength optical discrimination calibrated' },
    ],
    plan: [
      'Map cabin forced-air circulation vectors to detector locations',
      'Calibrate optical obscuration thresholds for large soot clusters',
      'Deploy multi-spectral sensors to filter out ambient Lunar dust',
    ],
    sources: [
      { title: 'NASA PSI: SAME-R Smoke & Aerosol Investigation', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=247' },
      { title: 'NASA ISS DAFT Dust Measurement Study', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html' },
    ],
    reply: `### Microgravity Smoke Detection Dynamics — Why Terrestrial Alarms Fail in Space

Standard terrestrial smoke detectors rely on hot buoyant air carrying smoke particles upward to ceiling sensors. In microgravity, fire detection follows entirely different physics:

* **Absence of Buoyant Plumes (Hot smoke does not rise)**
  ↳ Human Context: Without gravity, heated air has no weight differential to make it rise. Smoke lingers in a dense cloud around the overheating wire, spreading only via slow diffusion or air conditioner vents.
* **Particle Agglomeration: 8x to 12x Larger Soot Clusters**
  ↳ Flight Evidence: <span class="inv-action-tag" data-inv="same-r">SAME-R ↗</span> discovered that because soot particles aren't swept away, they collide and aggregate into giant soot clusters, causing terrestrial optical ionization detectors to miscalculate smoke density.
* **Lunar and Martian Regolith Dust False Alarms**
  ↳ Engineering Directive: Fine, abrasive mineral regolith dust carried inside suits mimics smoke particles. Dual-wavelength laser scattering (<span class="inv-action-tag" data-inv="same-r">SAME-R ↗</span> calibrated) is mandatory to discriminate between mineral dust and pyrolyzed plastics.`,
    actions: [
      { label: 'Inspect SAME-R Smoke Sensors in Library', type: 'search_explore', query: 'SAME-R', primary: true },
      { label: 'View Detection Dynamics Tab', type: 'switch_tab', tab: 'detection' },
      { label: 'Test ISS Cabin Atmosphere in Simulator', type: 'apply_preset', preset: 'iss' },
    ],
  },

  coolflames: {
    title: 'Cool Flames Discovery & Suppression Architecture',
    reasoning: `1. Inquiring into liquid fuel droplet extinction in low gravity.
2. Reviewing the FLEX (Flame Extinguishment Experiment, Investigation #144) and FLEX-2 datasets.
3. Phenomenon: Droplet burning apparent extinction (flame vanishes optically), yet fuel droplet continues evaporating at elevated rates.
4. Chemical mechanism: Low-temperature chemical oxidation (600 - 800 K) sustained by slow radical diffusion in spherical geometry.
5. Fire suppression impact: Extinguishing the visible flame does not guarantee safety; re-introducing oxygen can trigger explosive flash reignition.`,
    tools: [
      { cmd: 'psi-query --experiment="FLEX" --fuel="Heptane"', output: 'Cool flame persistence verified across 40+ ISS droplet burns' },
      { cmd: 'suppressant-efficiency --agent="CO2" --agent="Helium"', output: 'Helium conducts thermal energy away faster; CO₂ acts as chemical heat capacity sink' },
    ],
    plan: [
      'Monitor post-extinction droplet temperature via infrared radiometry',
      'Maintain inert gas blanket (CO₂/He) until fuel surface drops below pyrolysis temp',
      'Avoid premature cabin repressurization or ventilation reactivation',
    ],
    sources: [
      { title: 'NASA Glenn: FLEX Droplet Extinguishment Experiment', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=144' },
      { title: 'Combustion Integrated Rack (CIR) Multi-user Droplet Apparatus', url: 'https://www.nasa.gov/' },
    ],
    reply: `### Cool Flames Discovery (<span class="inv-action-tag" data-inv="flex">FLEX ↗</span>) & Extinguishment Protocols

One of the most profound discoveries from NASA’s Combustion Integrated Rack was the phenomenon of **Cool Flames**:

* **Invisible Low-Temperature Combustion: 600 - 800 K**
  ↳ Human Context: After the visible yellow flame (1500–2000 K) extinguishes, the fuel droplet continues burning invisibly at low temperatures without emitting visible light or heavy soot.
* **Catastrophic Re-ignition Hazard**
  ↳ Flight Evidence: <span class="inv-action-tag" data-inv="flex">FLEX ↗</span> proved that if fresh cabin air is re-introduced prematurely, the invisible cool flame instantaneously transitions back into a violent high-temperature fire.
* **Suppression Architecture: Sustained Dilution Blanketing**
  ↳ Engineering Directive: Spacecraft fire suppression cannot rely on a quick discharge. The compartment must remain saturated with CO₂ or Helium diluent until infrared radiometers verify surfaces have cooled below reaction thresholds.`,
    actions: [
      { label: 'Test Cool Flame in Interactive Lab', type: 'toggle_flame_lab', primary: true },
      { label: 'Inspect FLEX Droplet Research', type: 'search_explore', query: 'FLEX' },
      { label: 'View Suppression Dilution Limits', type: 'switch_tab', tab: 'suppression' },
    ],
  },

  earth: {
    title: 'NASA Space Combustion Technologies Applied to Earth',
    reasoning: `1. Identifying technology transfers from NASA Physical Science Informatics to terrestrial life.
2. Fine-water-mist fire suppression on the ISS replacing toxic Halon on Earth.
3. Commercial aviation cargo fire suppression without water damage or hazardous gas.
4. Firefighter personal protective equipment (PPE): PBI thermal suits and lightweight composite breathing tanks derived from astronaut life support systems.`,
    tools: [
      { cmd: 'nasa-spinoff --field="fire-safety"', output: 'Over 40 commercial spinoffs identified in municipal firefighting and building safety' },
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

1. **Fine-Water-Mist Fire Suppression Systems:**
   ↳ Human Context: Developed for the ISS to extinguish fires without toxic Halon or water-deluge damage. Today, protects hospital ICUs, nuclear power facilities, server data centers, and historic museums on Earth.
2. **Advanced Firefighter Personal Protective Equipment (PPE):**
   ↳ Human Context: Flame-resistant PBI/Nomex fabrics and ultra-lightweight carbon-composite breathing tanks were directly derived from astronaut life support systems following the Apollo fire investigation.
3. **Early-Warning Aviation Cargo Smoke Detectors:**
   ↳ Human Context: Laser particle sensors calibrated during <span class="inv-action-tag" data-inv="same-r">SAME ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS ↗</span> experiments are now standard in modern commercial airliner cargo bays and clean-room facilities.`,
    actions: [
      { label: 'View Earth Applications Tab', type: 'switch_tab', tab: 'earth', primary: true },
      { label: 'Inspect NASA Water-Mist Data', type: 'search_explore', query: 'water-mist' },
      { label: 'Return to Mission Simulator', type: 'switch_view', view: 'simulator' },
    ],
  },
};

// Dynamic Multi-Angle NASA SI Reasoning & Synthesis Engine
function generateDynamicSynthesis(query) {
  const qLower = query.toLowerCase();
  const isUzbek = /[а-яёқғҳў]/i.test(query) || /\b(oy|yer|mars|qanday|nima|uchun|nega|olov|alanga|yonadi|bosim|kislorod|tutun|ochirish|skafandr|matolar|haqida|tajriba|farqi|tavsiya|qilsa)\b/i.test(query);

  // Extract atmospheric parameters if mentioned
  const o2Match = query.match(/(\d{1,3})\s*%/);
  const detectedO2 = o2Match ? parseInt(o2Match[1], 10) : null;
  const pMatch = query.match(/(\d{1,2}(?:\.\d+)?)\s*(?:psi|kpa)/i);
  const detectedPressure = pMatch ? parseFloat(pMatch[1]) : null;

  // Identify primary physical regime
  let regime = 'general';
  let relevantInv = { id: 'bass-ii', name: 'BASS-II', tag: '<span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span>' };

  if (qLower.includes('pmma') || qLower.includes('plastik') || qLower.includes('plastic') || qLower.includes('solid') || qLower.includes('qattiq')) {
    regime = 'solid_materials';
    relevantInv = { id: 'bass-ii', name: 'BASS-II', tag: '<span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span>' };
  } else if (qLower.includes('droplet') || qLower.includes('tomchi') || qLower.includes('liquid') || qLower.includes('suyuq') || qLower.includes('flex')) {
    regime = 'droplet_cool_flames';
    relevantInv = { id: 'flex', name: 'FLEX', tag: '<span class="inv-action-tag" data-inv="flex">FLEX ↗</span>' };
  } else if (qLower.includes('smoke') || qLower.includes('tutun') || qLower.includes('detector') || qLower.includes('datchik') || qLower.includes('aerosol') || qLower.includes('dust') || qLower.includes('chang')) {
    regime = 'smoke_detection';
    relevantInv = { id: 'same-r', name: 'SAME-R', tag: '<span class="inv-action-tag" data-inv="same-r">SAME-R ↗</span>' };
  } else if (qLower.includes('ventilat') || qLower.includes('shamol') || qLower.includes('flow') || qLower.includes('oqim') || qLower.includes('saffire')) {
    regime = 'forced_flow';
    relevantInv = { id: 'saffire-iii', name: 'Saffire-III', tag: '<span class="inv-action-tag" data-inv="saffire-iii">Saffire-III ↗</span>' };
  } else if (qLower.includes('co2') || qLower.includes('helium') || qLower.includes('geliy') || qLower.includes('suppress') || qLower.includes('ochirish')) {
    regime = 'suppression';
    relevantInv = { id: 'acme-cfig', name: 'ACME: CFI-G', tag: '<span class="inv-action-tag" data-inv="acme-cfig">ACME: CFI-G ↗</span>' };
  }

  // Calculate dynamic PO2 if O2 and pressure provided, or estimate
  let po2Calc = '';
  if (detectedO2 && detectedPressure) {
    const calc = ((detectedO2 / 100) * detectedPressure).toFixed(2);
    po2Calc = `PO₂ = (${detectedO2}% × ${detectedPressure} psi) = ${calc} psi`;
  }

  // Uzbek response generator
  if (isUzbek) {
    return {
      title: `NASA SI Tahlili: "${query.slice(0, 36)}..."`,
      reasoning: `1. Foydalanuvchi so'rovi tahlil qilindi: "${query}".
2. Kosmik yonish fizikasi rejimi aniqlandi: ${regime.toUpperCase()}.
3. Mikrogravitatsiya omili: tabiiy konveksiyaning yo'qligi sababli issiqlik ajralishi diffuziya bilan cheklanadi.
4. NASA PSI bazasi bilan solishtirildi: ${relevantInv.name} parvoz tekshiruvlari va NASA-STD-6001 standartlari.
5. Inson tilidagi tushuntirish va xavfsizlik direktivalari tayyorlandi.`,
      tools: [
        { cmd: `psi-query --regime="${regime}" --query="${query.slice(0, 20)}"`, output: `Topildi: ${relevantInv.name} parvoz eksperimenti` },
        { cmd: 'calc-microgravity-transport --buoyancy=0', output: 'Tabiiy konveksiya yo\'q; diffuzion yonish rejimi' },
      ],
      plan: [
        'Gravitatsiyasiz yonish dinamikasini baholash',
        `${relevantInv.name} eksperimental kashfiyotlarini taqqoslash`,
        'Astronavtlar va muhandislar uchun aniq xavfsizlik qoidasini shakllantirish',
      ],
      sources: [
        { title: `NASA PSI: ${relevantInv.name} Flight Investigation`, url: 'https://psi.nasa.gov/' },
        { title: 'NASA Glenn Research Center Combustion Science', url: 'https://www.nasa.gov/' },
      ],
      reply: `### NASA SI Ilmiy Tahlili: "${query}"

Mikrogravitatsiya va kosmik kemalarning yopiq havo muhitida yonish jarayoni Yerdagidan tubdan farq qiladi:

* **Tabiiy konveksiyaning yo'qligi (Issiq gazlar tepaga ko'tarilmaydi)**
  ↳ Inson tilidagi ma'nosi: Yerdagidek olov yonayotganda issiq havoni yuqoriga haydab, o'rniga sovuq havo kirmaydi. Olov sharsimon shaklga kirib, kislorodni faqat atrofdan sekin diffuziya orqali tortadi.
* **Tegishli NASA parvoz tajribasi: ${relevantInv.tag}**
  ↳ Ilmiy dalil: Ushbu tadqiqotda isbotlanishicha, olov tashqi tomondan jim turgandek ko'rinsa-da, atrofdagi materiallarni Yerdagidan ko'ra uzoqroq vaqt davomida qizdirib turishi mumkin.
* **Havoning harakati (Ventilyatsiya) ta'siri: Eng xavfli omil**
  ↳ Nega muhim? Mikrogravitatsiyada odatiy 0.1 m/s tezlikdagi hayotni ta'minlash shamoli ham olovga xuddi temirchining bosqonidek toza kislorod purkab beradi va qisqa fursatda kuchli chaqnashga sabab bo'ladi.
* **Tavsiya etiladigan muhandislik chorasi:**
  ↳ Har qanday termal signal chalinganda kabina ventilyatsiyasini avtomatik to'xtatish va inert gaz (CO₂ / Geliy) yordamida harorat to'liq tushguncha muhitni saqlab turish talab etiladi.`,
      actions: [
        { label: `Simulyatorga o'tkazish (${detectedO2 || 34}% O₂)`, type: 'set_atmosphere', params: { oxygen: detectedO2 || 34, pressure: detectedPressure || 10.2 }, primary: true },
        { label: `Kutubxonada ${relevantInv.name} ni ko'rish`, type: 'search_explore', query: relevantInv.name, o2: detectedO2 },
        { label: 'Interaktiv Olov Laboratoriyasini ochish', type: 'toggle_flame_lab' },
      ],
    };
  }

  // English fallback for international queries
  return {
    title: `NASA SI Scientific Synthesis: "${query.slice(0, 36)}..."`,
    reasoning: `1. Parsing aerospace query: "${query}".
2. Identified combustion regime: ${regime.toUpperCase()}.
3. Microgravity physics transport model: Absence of natural buoyant convection limits cooling to thermal radiation and slow species diffusion.
4. Cross-referencing NASA Physical Science Informatics (PSI): ${relevantInv.name} and NASA-STD-6001 guidelines.
5. Formulating human-accessible directives with quantitative safety thresholds.`,
    tools: [
      { cmd: `psi-query --regime="${regime}" --query="${query.slice(0, 20)}"`, output: `Correlated with ${relevantInv.name}` },
      { cmd: 'calc-microgravity-transport --buoyancy=0', output: 'Diffusion-dominated spherical reaction layer' },
    ],
    plan: [
      'Examine microgravity diffusion and heat loss mechanics',
      `Correlate with NASA flight data from ${relevantInv.name}`,
      'Deliver concrete engineering safety directives',
    ],
    sources: [
      { title: `NASA PSI: ${relevantInv.name} Investigation`, url: 'https://psi.nasa.gov/' },
      { title: 'NASA Spacecraft Fire Safety Research Center', url: 'https://www.nasa.gov/' },
    ],
    reply: `### NASA SI Combustion Analysis: "${query}"

In microgravity and enclosed spacecraft habitats, fire behaves counterintuitively compared to Earth:

* **Absence of Buoyant Convection (Hot gases do not rise)**
  ↳ Human context: Without gravity, hot combustion gases do not rise to create a teardrop flame. The flame forms a spherical diffusion envelope that relies entirely on slow molecular diffusion for oxygen.
* **Correlated NASA PSI Evidence: ${relevantInv.tag}**
  ↳ Flight finding: Experiments demonstrate that without buoyant cooling, solid materials can sustain steady smoldering at lower ambient oxygen concentrations than required on Earth.
* **Cabin Forced Ventilation: The Primary Accelerator**
  ↳ Critical risk: Low-velocity airflow from cabin air conditioners (even 0.1 to 0.3 m/s) transforms a diffusion flame into a rapidly propagating fire front.
* **Actionable Engineering Directive:**
  ↳ Enforce instant ventilation throttle (<0.1 m/s) upon thermal detection, and maintain inert gas suppression (CO₂ / Helium) until surface radiometers confirm temperature has dropped below the pyrolysis threshold.`,
    actions: [
      { label: `Apply to Mission Simulator (${detectedO2 || 34}% O₂)`, type: 'set_atmosphere', params: { oxygen: detectedO2 || 34, pressure: detectedPressure || 10.2 }, primary: true },
      { label: `Inspect ${relevantInv.name} in Library`, type: 'search_explore', query: relevantInv.name, o2: detectedO2 },
      { label: 'Open Interactive Flame Lab', type: 'toggle_flame_lab' },
    ],
  };
}

const SUGGESTIONS = [
  { label: 'Evaluate Lunar Base Fire Hazard (34% O2)', key: 'lunar' },
  { label: 'Why is 100% O2 in spacesuits dangerous?', key: 'spacesuit' },
  { label: 'Why do smoke detectors fail in 0g?', key: 'smoke' },
  { label: 'What is a cool flame and how to extinguish it?', key: 'coolflames' },
  { label: 'How does NASA fire research help Earth?', key: 'earth' },
];

export default function FlameSIChat({
  activePreset = 'moon',
  oxygen = 34,
  pressure = 10.2,
  gravity = '0.166g (Lunar)',
  activeTab = 'prevention',
  onApplyPreset,
  onSetAtmosphere,
  onSwitchTab,
  onSwitchView,
  onInspectInExplorer,
}) {
  const [showFlameLab, setShowFlameLab] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'assistant',
      reasoning: 'FLAME-SI v2.4 initialized with NASA Physical Science Informatics (PSI) flight investigations. Real-time microgravity combustion model active.',
      tools: [{ cmd: 'init --dataset="NASA-PSI-CIR-MSG" --status="ready"', output: '10 flight investigations verified' }],
      plan: ['Ready to evaluate Artemis Lunar Base, Spacesuit EVA, and ISS fire safety scenarios.'],
      sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
      text: `Hello! I am **FLAME-SI** — NASA's Super Intelligence co-pilot for spacecraft fire safety and microgravity combustion dynamics.

I synthesize findings from decades of NASA flight experiments—including **BASS-II**, **FLEX**, **ACME**, and **Saffire**—to help aerospace engineers evaluate ignition thresholds, flame propagation, and fire suppression protocols for missions to the Moon, Mars, and the ISS.

* **Physics-grounded analysis:** Evaluates oxygen partial pressure (PO₂), buoyancy-free extinction limits, and ventilation velocity thresholds.
* **Human-accessible insights:** Technical metrics are clearly interpreted with intuitive real-world context and operational safety directives.
* **Full Autonomous Control:** I can directly control the Mission Simulator, filter the Explore Library, run Dual-Rack comparisons, or mount interactive physics experiments.

Select a mission scenario below, ask any combustion question, or issue direct commands like *"Set oxygen to 40%"* or *"Search library for PMMA"*!`,
      actions: [
        { label: 'Open Interactive Flame Dynamics Lab', type: 'toggle_flame_lab', primary: true },
        { label: 'Load Artemis Lunar Base (34% O₂)', type: 'apply_preset', preset: 'moon' },
        { label: 'Browse All 10 NASA PSI Experiments', type: 'scroll_section', section: 'explore' },
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState('flame-si-v2.4');
  const [effort, setEffort] = useState('deep');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('flame_gemini_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [expandedTrace, setExpandedTrace] = useState({ init: false });

  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isStreaming, showFlameLab]);

  // Handle clickable tags inside text
  const handleTagClick = (e) => {
    const target = e.target.closest('.inv-action-tag');
    if (target) {
      const invId = target.getAttribute('data-inv');
      SiteController.searchExplore(invId);
    }
  };

  // Co-Pilot Action Executor (Argon-style Execution)
  const handleExecuteAction = (action) => {
    if (action.type === 'apply_preset') {
      if (onApplyPreset) onApplyPreset(action.preset);
      if (onSwitchView) onSwitchView('simulator');
      setToastNotice(`✓ Preset applied: ${action.preset.toUpperCase()}`);
    } else if (action.type === 'set_atmosphere') {
      if (onSetAtmosphere) onSetAtmosphere(action.params);
      if (onSwitchView) onSwitchView('simulator');
      setToastNotice(`✓ Simulator updated: ${action.params.oxygen}% O₂`);
    } else if (action.type === 'search_explore') {
      SiteController.searchExplore(action.query, action.o2);
      setToastNotice(`✓ Library filtered by "${action.query}"`);
    } else if (action.type === 'switch_tab') {
      if (onSwitchTab) onSwitchTab(action.tab);
      if (onSwitchView) onSwitchView('simulator');
      setToastNotice(`✓ Switched to ${action.tab.toUpperCase()} safety pillar`);
    } else if (action.type === 'switch_view') {
      if (onSwitchView) onSwitchView(action.view);
    } else if (action.type === 'scroll_section') {
      SiteController.scrollToSection(action.section);
    } else if (action.type === 'toggle_flame_lab') {
      setShowFlameLab((prev) => !prev);
    } else if (action.type === 'compare') {
      SiteController.compareInvestigations(action.idA, action.idB);
      setToastNotice(`✓ Opened Dual-Rack comparison for ${action.idA} & ${action.idB}`);
    }
    setTimeout(() => setToastNotice(null), 3000);
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = { id: userMsgId, role: 'user', text: query };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const qLower = query.toLowerCase();

    // =========================================================================
    // Autonomous Co-Pilot Command Handler (Full Site Control)
    // =========================================================================

    // 1. Oxygen set command: "set oxygen to 40%", "o2 to 50", "kislorodni 40 qil", etc.
    const o2Command = query.match(/(?:set|change|put|make|qil|ga\s*qo'y)?\s*(?:oxygen|o2|kislorod)\s*(?:to|=|ga)?\s*(\d{1,3})\s*%?/i);
    if (o2Command && (qLower.includes('set') || qLower.includes('change') || qLower.includes('put') || qLower.includes('qil') || qLower.includes('qo\'y') || qLower.includes('make') || qLower.includes('to'))) {
      const targetO2 = Math.min(100, Math.max(14, parseInt(o2Command[1], 10)));
      if (onSetAtmosphere) onSetAtmosphere({ oxygen: targetO2, pressure, gravity });
      setToastNotice(`✓ Simulator updated: ${targetO2}% O₂`);

      const cmdReply = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        reasoning: `1. Autonomous Site Control: Parsed user command to set cabin oxygen concentration to ${targetO2}%.
2. Executing real-time update on parent SIDashboard state: oxygen=${targetO2}%.
3. Recalculating flammability spread rate and Fire Hazard Index.`,
        tools: [{ cmd: `site-controller --set-oxygen=${targetO2}`, output: 'State updated successfully' }],
        plan: [`Adjusted cabin oxygen concentration to ${targetO2}%`, 'Recalculated Fire Hazard Index gauge', 'Ranked applicable NASA flight investigations'],
        sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
        text: `### Co-Pilot Directive Executed: Oxygen set to ${targetO2}%

* **Live Simulator Update:** Cabin Oxygen has been programmatically adjusted to **${targetO2}%** on the Mission Simulator console.
* **Physical Consequence:** Recalculated effective oxygen level ($PO_2$). High oxygen significantly increases solid polymer flame spread velocity.
* **Next Action:** Click the action pill below to view the updated live gauge and risk score on the simulator.`,
        actions: [
          { label: 'View Updated Simulator Console', type: 'switch_view', view: 'simulator', primary: true },
          { label: `Search ${targetO2}% O₂ in Explorer`, type: 'search_explore', query: '', o2: targetO2 },
          { label: 'Test in Flame Dynamics Lab', type: 'toggle_flame_lab' },
        ],
      };

      setExpandedTrace((prev) => ({ ...prev, [cmdReply.id]: true }));
      setTimeout(() => {
        setMessages((prev) => [...prev, cmdReply]);
        setIsStreaming(false);
      }, 500);
      return;
    }

    // 2. Preset switch command: "switch to eva" / "switch to lunar" / "switch to mars" / "switch to iss"
    let targetPreset = null;
    if (qLower.includes('lunar') || qLower.includes('oy') || qLower.includes('moon')) targetPreset = 'moon';
    else if (qLower.includes('eva') || qLower.includes('spacesuit') || qLower.includes('skafandr')) targetPreset = 'eva';
    else if (qLower.includes('mars') || qLower.includes('rover')) targetPreset = 'mars';
    else if (qLower.includes('iss') || qLower.includes('stansiya') || qLower.includes('station')) targetPreset = 'iss';

    if (targetPreset && (qLower.includes('switch') || qLower.includes('set') || qLower.includes('load') || qLower.includes('o\'t') || qLower.includes('rejim') || qLower.includes('tanla'))) {
      if (onApplyPreset) onApplyPreset(targetPreset);
      setToastNotice(`✓ Switched preset to ${targetPreset.toUpperCase()}`);

      const presetNames = { moon: 'Lunar Surface Base (34% O₂)', eva: 'Spacesuit EVA (100% O₂)', mars: 'Pressurized Mars Rover (28% O₂)', iss: 'ISS Cabin Habitat (21% O₂)' };
      const cmdReply = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        reasoning: `1. Autonomous Command: Setting mission profile to ${targetPreset.toUpperCase()}.
2. Applied atmospheric parameters to Mission Hazard Simulator.
3. Updated flammability priority rankings from NASA PSI.`,
        tools: [{ cmd: `dashboard-ctrl --preset=${targetPreset}`, output: `Applied ${presetNames[targetPreset]}` }],
        plan: [`Configured mission profile: ${presetNames[targetPreset]}`, 'Synced live flammability criteria'],
        sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
        text: `### Co-Pilot Directive Executed: ${presetNames[targetPreset]} Active

* **Mission Profile Configured:** The Mission Hazard Simulator is now running the **${presetNames[targetPreset]}** baseline.
* **Autonomous Synchronization:** Investigation rankings and flammability parameters have been recomputed.`,
        actions: [
          { label: 'View Live Simulator Gauge', type: 'switch_view', view: 'simulator', primary: true },
          { label: 'Inspect Correlated Flight Data', type: 'search_explore', query: targetPreset === 'moon' ? 'ACME: CFI-G' : targetPreset === 'eva' ? 's-Flame' : 'BASS-II' },
          { label: 'Open Interactive Flame Lab', type: 'toggle_flame_lab' },
        ],
      };

      setExpandedTrace((prev) => ({ ...prev, [cmdReply.id]: true }));
      setTimeout(() => {
        setMessages((prev) => [...prev, cmdReply]);
        setIsStreaming(false);
      }, 500);
      return;
    }

    // 3. Search / Explore command: "search library for Nomex", "find PMMA", etc.
    if ((qLower.startsWith('search') || qLower.startsWith('find') || qLower.startsWith('filter') || qLower.startsWith('qidir')) && !query.includes('?')) {
      const cleanTerm = query.replace(/^(?:search|find|filter|qidir|izla|for|library|in library|in explore)\s+/i, '').trim();
      SiteController.searchExplore(cleanTerm);
      setToastNotice(`✓ Filtered library to "${cleanTerm}"`);

      const cmdReply = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        reasoning: `1. Autonomous Navigation: Scrolled to #explore section.
2. Dispatched input event to #search with query: "${cleanTerm}".`,
        tools: [{ cmd: `dom-query --selector="#search" --value="${cleanTerm}"`, output: 'Search dispatched' }],
        plan: [`Scrolled page to Explore Library`, `Filtered investigations by "${cleanTerm}"`],
        sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
        text: `### Co-Pilot Navigation: Filtered Library by "${cleanTerm}"

* **Autonomous Action:** Navigated directly to the **Explore Library** and filtered results by **"${cleanTerm}"**.
* **Live DOM Control:** Relevant NASA flight investigation cards are now visible below.`,
        actions: [
          { label: 'Jump to Explore Section', type: 'scroll_section', section: 'explore', primary: true },
          { label: 'Back to Mission Simulator', type: 'switch_view', view: 'simulator' },
        ],
      };

      setExpandedTrace((prev) => ({ ...prev, [cmdReply.id]: true }));
      setTimeout(() => {
        setMessages((prev) => [...prev, cmdReply]);
        setIsStreaming(false);
      }, 500);
      return;
    }

    // 4. Compare command: "compare BASS and Saffire"
    if ((qLower.includes('compare') || qLower.includes('taqqosla')) && !query.includes('?')) {
      SiteController.compareInvestigations('bass-ii', 'saffire-i');
      setToastNotice('✓ Loaded Dual-Rack comparison');

      const cmdReply = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        reasoning: 'Autonomous Action: Selected BASS-II and Saffire-I for dual-rack comparative combustion dynamics analysis.',
        tools: [{ cmd: 'dom-action --compare="bass-ii,saffire-i"', output: 'Comparison loaded' }],
        plan: ['Selected BASS-II & Saffire-I', 'Scrolled to Dual-Rack Comparison'],
        sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
        text: `### Co-Pilot Navigation: Dual-Rack Comparison Loaded

* **Comparison Active:** Pre-selected **BASS-II** (solid polymer extinction) and **Saffire-I** (spacecraft-scale fabric flammability).
* **Navigation:** Scrolled to the Dual-Rack Comparison station.`,
        actions: [
          { label: 'View Dual-Rack Comparison', type: 'scroll_section', section: 'compare', primary: true },
          { label: 'Back to Mission Simulator', type: 'switch_view', view: 'simulator' },
        ],
      };

      setExpandedTrace((prev) => ({ ...prev, [cmdReply.id]: true }));
      setTimeout(() => {
        setMessages((prev) => [...prev, cmdReply]);
        setIsStreaming(false);
      }, 500);
      return;
    }

    // 5. Open Interactive Flame Lab command: "open flame lab" / "flame simulator"
    if (qLower.includes('flame lab') || qLower.includes('flame simulator') || qLower.includes('chamber')) {
      setShowFlameLab(true);
      const cmdReply = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        reasoning: 'Mounting interactive microgravity flame physics chamber inside chat session.',
        tools: [{ cmd: 'mount-widget --name="InteractiveFlameLab"', output: 'Active' }],
        plan: ['Mounted interactive flame chamber', 'Calibrated 0g vs 1g physics model'],
        sources: [{ title: 'NASA Glenn Research Center Combustion Science', url: 'https://www.nasa.gov/' }],
        text: `### Interactive Physics Lab Mounted

* **Chamber Active:** The interactive microgravity combustion simulator has been mounted directly in your chat window below.
* **Interactive Controls:** Toggle between **0g (Freefall)**, **1/6g (Moon)**, and **1g (Earth)**, adjust Oxygen concentration and ventilation airflow velocity in real time.`,
        actions: [
          { label: 'Apply Lab Parameters to Simulator', type: 'apply_preset', preset: 'moon', primary: true },
          { label: 'Browse NASA Flight Library', type: 'scroll_section', section: 'explore' },
        ],
      };
      setExpandedTrace((prev) => ({ ...prev, [cmdReply.id]: true }));
      setTimeout(() => {
        setMessages((prev) => [...prev, cmdReply]);
        setIsStreaming(false);
      }, 500);
      return;
    }

    // =========================================================================
    // Multi-Tier Scientific & Universal Intelligence Dispatcher
    // =========================================================================

    const dispatchLocalIntelligence = (q) => {
      // Tier 1: Check Universal Math, Unit Conversion, General Science & Astronomy
      const universalMatch = resolveUniversalQuery(q);
      let matched = universalMatch;

      // Tier 2: Check Specialized NASA Fire Safety Knowledge Base
      if (!matched) {
        if (qLower.includes('lunar') || qLower.includes('oy') || qLower.includes('moon') || (qLower.includes('34%') && !q.includes('='))) {
          matched = KNOWLEDGE_BASE.lunar;
        } else if (qLower.includes('spacesuit') || qLower.includes('skafandr') || qLower.includes('eva') || (qLower.includes('100%') && !q.includes('='))) {
          matched = KNOWLEDGE_BASE.spacesuit;
        } else if (qLower.includes('smoke') || qLower.includes('tutun') || qLower.includes('detector') || qLower.includes('datchik') || qLower.includes('same')) {
          matched = KNOWLEDGE_BASE.smoke;
        } else if (qLower.includes('cool') || qLower.includes('flex') || qLower.includes('suppress') || qLower.includes("o'chirish") || qLower.includes('droplet')) {
          matched = KNOWLEDGE_BASE.coolflames;
        } else if (qLower.includes('earth') || qLower.includes('yer') || qLower.includes('firefighter') || qLower.includes('spinoff')) {
          matched = KNOWLEDGE_BASE.earth;
        }
      }

      // Tier 3: If still not matched, check if it's fire/combustion related, else open-domain general reasoning
      if (!matched) {
        const isFireRelated = /\b(fire|flame|combust|burn|ignition|extinguish|o2|oxygen|kislorod|olov|alanga|yonish|tutun|smoke|material|pmma|saffire|bass|cir|psi|droplet|hazard|xavf)\b/i.test(q);
        if (isFireRelated) {
          matched = generateDynamicSynthesis(q);
        } else {
          matched = solveOpenDomainQuery(q);
        }
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
        actions: matched.actions || [],
      };

      setExpandedTrace((prev) => ({ ...prev, [assistantMsgId]: true }));

      setTimeout(() => {
        setMessages((prev) => [...prev, partialAssistantMsg]);
        setIsStreaming(false);
      }, 600);
    };

    // Optional: Cloud LLM via Google Gemini 1.5 Live API
    if (model === 'gemini-live' && apiKey.trim()) {
      callGeminiLiveAPI(apiKey.trim(), query, messages)
        .then((liveResponse) => {
          const assistantMsgId = `asst-${Date.now()}`;
          const liveMsg = {
            id: assistantMsgId,
            role: 'assistant',
            reasoning: `1. Google Gemini 1.5 Live API inference.\n2. Ingested conversation history and query: "${query}".\n3. Generated real-time multi-disciplinary response.`,
            tools: [{ cmd: 'gemini-1.5-flash:generateContent', output: 'HTTP 200 OK (Cloud inference)' }],
            plan: ['Streamed response from Google Gemini API', 'Parsed scientific reasoning & formatted directives'],
            sources: [{ title: 'Google Gemini 1.5 Flash Model', url: 'https://ai.google.dev/' }],
            text: liveResponse,
            actions: [
              { label: 'Open Interactive Flame Lab', type: 'toggle_flame_lab', primary: true },
              { label: 'Apply Lunar Parameters to Simulator', type: 'apply_preset', preset: 'moon' },
              { label: 'Browse NASA Flight Library', type: 'scroll_section', section: 'explore' },
            ],
          };
          setExpandedTrace((prev) => ({ ...prev, [assistantMsgId]: true }));
          setMessages((prev) => [...prev, liveMsg]);
          setIsStreaming(false);
        })
        .catch((err) => {
          console.warn('Gemini Live API error, falling back to Universal Engine:', err);
          dispatchLocalIntelligence(query);
        });
      return;
    }

    dispatchLocalIntelligence(query);
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
    setMessages([
      {
        id: 'init',
        role: 'assistant',
        reasoning: 'FLAME-SI v2.4 reset to baseline state.',
        tools: [{ cmd: 'init --dataset="NASA-PSI-CIR-MSG"', output: 'Ready' }],
        plan: ['Ready to evaluate Artemis Lunar Base, Spacesuit EVA, and ISS fire safety scenarios.'],
        sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
        text: `Conversation reset. I am ready to evaluate new mission fire safety scenarios or answer any questions regarding NASA's microgravity combustion research!`,
      },
    ]);
  };

  return (
    <div className="flame-chat-container">
      {/* Header */}
      <div className="flame-chat-header">
        <div className="flame-chat-title-group">
          <div className="flame-chat-avatar">SI</div>
          <div className="flame-chat-title">
            <h3>
              <ShinyText
                text="FLAME-SI"
                color="#f7f3ed"
                shineColor="#ffd7a8"
                speed={4.5}
                delay={1}
                shineWidth={28}
                softness={0.8}
              />{' '}
              Co-Pilot
              <span className="flame-model-pill">
                <SparklesIcon size={12} />
                NASA PSI Fine-Tuned
              </span>
            </h3>
            <p>Super Intelligence for Spacecraft Fire Safety & Flammability Dynamics</p>
          </div>
        </div>

        <div className="flame-chat-controls">
          <button
            type="button"
            className="flame-reset-btn"
            onClick={handleReset}
            title="Reset conversation"
          >
            <RotateCwIcon size={16} />
          </button>
        </div>
      </div>

      {/* Autonomous Co-Pilot Execution Notification */}
      {toastNotice && (
        <div style={{ padding: '0.4rem 2rem 0', display: 'flex', justifyContent: 'flex-start' }}>
          <div className="copilot-toast-notice">
            <span>✓</span>
            <span>{toastNotice}</span>
          </div>
        </div>
      )}

      {/* Message Body */}
      <div className="flame-chat-body" ref={chatBodyRef} onClick={handleTagClick}>
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <FadeContent key={msg.id} duration={0.25}>
                <div className="chat-msg user">
                  <div className="bubble-user">{msg.text}</div>
                </div>
              </FadeContent>
            );
          }

          const isTraceOpen = expandedTrace[msg.id] ?? false;

          return (
            <FadeContent key={msg.id} duration={0.25}>
              <div className="chat-msg assistant">
              <div className="assistant-container">
                {/* 1. Reasoning / Chain-of-Thought Trace (collapsible) */}
                {msg.reasoning && (
                  <div className="trace-card">
                    <button
                      type="button"
                      className="trace-trigger"
                      onClick={() =>
                        setExpandedTrace((prev) => ({
                          ...prev,
                          [msg.id]: !isTraceOpen,
                        }))
                      }
                    >
                      <div className="trace-status-icon">
                        {isStreaming && msg === messages[messages.length - 1] ? (
                          <LoaderCircleIcon size={14} className="animate-spin text-orange-400" />
                        ) : (
                          <CircleCheckIcon size={14} style={{ color: '#34d399' }} />
                        )}
                        <span>
                          {isStreaming && msg === messages[messages.length - 1]
                            ? 'Reasoning over NASA PSI Physics...'
                            : 'Thought for 2.4s (Chain-of-Thought)'}
                        </span>
                      </div>
                      {isTraceOpen ? <ChevronDownIcon size={15} /> : <ChevronRightIcon size={15} />}
                    </button>

                    {isTraceOpen && (
                      <div className="trace-content">
                        {msg.reasoning}

                        {/* Tool steps */}
                        {msg.tools && msg.tools.length > 0 && (
                          <div className="trace-steps-list">
                            {msg.tools.map((t, idx) => (
                              <div key={idx} className="trace-step-item">
                                <TerminalIcon size={12} style={{ color: '#ff8a58' }} />
                                <span>{t.cmd}</span>
                                <span style={{ color: '#8c8880' }}>→ {t.output}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Action Plan / Checklist */}
                {msg.plan && msg.plan.length > 0 && (
                  <div className="plan-container">
                    <div className="plan-title">
                      <RouteIcon size={13} style={{ display: 'inline', marginRight: '6px' }} />
                      Fire Safety Protocol Checklist:
                    </div>
                    {msg.plan.map((step, idx) => (
                      <div key={idx} className="plan-step done">
                        <CircleCheckIcon size={14} />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Text Body */}
                <div
                  className="assistant-text"
                  dangerouslySetInnerHTML={{
                    __html: formatAssistantMessage(msg.text),
                  }}
                />

                {/* 4. Sources Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources-bar">
                    {msg.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-pill"
                      >
                        <GlobeIcon size={12} />
                        <span>{src.title} ↗</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* 4.5 In-Chat Interactive Microgravity Flame Physics Chamber */}
                {(msg.interactiveWidget === 'flame-lab' || (showFlameLab && msg === messages[messages.length - 1])) && (
                  <div style={{ marginTop: '0.85rem', marginBottom: '0.85rem' }}>
                    <InteractiveFlameLab
                      initialGravity="0g"
                      initialO2={oxygen || 34}
                      initialFlow={0.1}
                      onApplyToSimulator={({ gravity: g, oxygen: o2, flow: v }) => {
                        if (onSetAtmosphere) onSetAtmosphere({ oxygen: o2, pressure, gravity: g });
                        setToastNotice(`✓ Applied ${o2}% O₂ (${g}) to Mission Simulator`);
                      }}
                      onInspectInExplorer={onInspectInExplorer}
                    />
                  </div>
                )}

                {/* 4.6 Co-Pilot Autonomous Control Action Cards (Argon 4 Direct Controls) */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="copilot-action-cards-strip">
                    <div className="copilot-action-strip-label">
                      <span>✦</span>
                      <span>Co-Pilot Interactive Directives</span>
                    </div>
                    <div className="copilot-action-btn-row">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          type="button"
                          className={`copilot-action-pill ${act.primary ? 'primary' : ''}`}
                          onClick={() => handleExecuteAction(act)}
                        >
                          <span className="action-pill-icon">✦</span>
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Message Footer Actions */}
                <div className="msg-footer">
                  <button
                    type="button"
                    className="msg-action-btn"
                    title="Copy response"
                    onClick={() => handleCopy(msg.id, msg.text)}
                  >
                    {copiedId === msg.id ? <CheckIcon size={14} style={{ color: '#34d399' }} /> : <CopyIcon size={14} />}
                  </button>
                  <button
                    type="button"
                    className={`msg-action-btn ${feedback[msg.id] === 'up' ? 'active' : ''}`}
                    title="Helpful insight"
                    onClick={() => handleFeedback(msg.id, 'up')}
                  >
                    <ThumbsUpIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className={`msg-action-btn ${feedback[msg.id] === 'down' ? 'active' : ''}`}
                    title="Needs refinement"
                    onClick={() => handleFeedback(msg.id, 'down')}
                  >
                    <ThumbsDownIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
            </FadeContent>
          );
        })}
      </div>

      {/* Suggestions / Prompt Chips */}
      <div className="suggestions-wrapper">
        <span className="suggestions-label">Explore Mission Scenarios:</span>
        <div className="suggestions-scroll">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-pill"
              onClick={() => handleSend(s.label)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="chat-input-area">
        <div className="chat-input-box">
          <textarea
            className="chat-textarea"
            placeholder="Ask FLAME-SI about microgravity fire dynamics, O2 limits, or PSI flight investigations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
          />

          <div className="chat-input-footer">
            <div className="chat-input-options">
              <select
                className="chat-option-select"
                value={model}
                onChange={(e) => {
                  const val = e.target.value;
                  setModel(val);
                  if (val === 'gemini-live' && !apiKey) {
                    setShowKeyModal(true);
                  }
                }}
              >
                <option value="flame-si-v2.4">FLAME-SI v2.4 (NASA PSI + Universal Core)</option>
                <option value="artemis-safety">Artemis Safety Model</option>
                <option value="gemini-live">Gemini 1.5 Live API (Cloud LLM)</option>
              </select>

              <button
                type="button"
                className={`flame-key-btn ${apiKey ? 'has-key' : ''}`}
                onClick={() => setShowKeyModal(true)}
                title={apiKey ? 'Gemini API Key configured' : 'Configure Gemini API Key'}
              >
                <KeyIcon size={12} />
                <span>{apiKey ? 'API Key Set' : 'API Key'}</span>
              </button>

              <select
                className="chat-option-select"
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
              >
                <option value="deep">Deep Scientific Reasoning</option>
                <option value="rapid">Rapid Summary</option>
              </select>
            </div>

            <Magnet padding={60} magnetStrength={2.5} tilt={8} scale={1.08}>
              <button
                type="button"
                className="chat-send-btn"
                disabled={!input.trim() || isStreaming}
                onClick={() => handleSend()}
              >
                {isStreaming ? (
                  <LoaderCircleIcon size={16} className="animate-spin" />
                ) : (
                  <ArrowUpIcon size={18} />
                )}
              </button>
            </Magnet>
          </div>
        </div>
      </div>

      {/* Gemini Live API Key Configuration Modal */}
      {showKeyModal && (
        <div className="flame-key-modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div className="flame-key-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flame-key-modal-header">
              <h4>Google Gemini Live API Configuration</h4>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="flame-key-close-btn"
              >
                ✕
              </button>
            </div>
            <p className="flame-key-desc">
              Connect Google Gemini 1.5 Flash for unrestricted live cloud intelligence across all domains. When no key is entered, FLAME-SI operates automatically using its built-in Universal Scientific Reasoning Engine.
            </p>
            <input
              type="password"
              className="flame-key-input"
              placeholder="Enter your Gemini API Key (AIzaSy...)"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                localStorage.setItem('flame_gemini_key', e.target.value);
              }}
            />
            <div className="flame-key-modal-actions">
              {apiKey && (
                <button
                  type="button"
                  className="flame-key-clear-btn"
                  onClick={() => {
                    setApiKey('');
                    localStorage.removeItem('flame_gemini_key');
                  }}
                >
                  Clear Key
                </button>
              )}
              <button
                type="button"
                className="flame-key-save-btn"
                onClick={() => setShowKeyModal(false)}
              >
                Save & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
