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
} from 'lucide-react';
import Magnet from './Magnet';
import './FlameSIChat.css';

// Curated NASA PSI Knowledge Base Responses for the Challenge
const KNOWLEDGE_BASE = {
  lunar: {
    title: 'Lunar Surface Base Fire Hazard Analysis',
    reasoning: `1. Parsing mission atmospheric inputs: 34% O₂ concentration, 10.2 psi (70.3 kPa), 1/6 g Lunar gravity.
2. Calculating Oxygen Partial Pressure: P_O2 = (0.34 * 10.2) = 3.47 psi (exceeds Earth sea level standard of 3.09 psi by +12.3%).
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
      'Evaluate oxygen partial pressure (P_O2 = 3.47 psi)',
      'Enforce strict NASA-STD-6001 Flammability Thresholds on habitat textiles',
      'Set automated ventilation cut-off threshold (<0.1 m/s) upon thermal alarm',
      'Prepare fine-water-mist and CO2 inert gas dilution protocols',
    ],
    sources: [
      { title: 'NASA PSI: ACME CFI-G Flight Data', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=7585' },
      { title: 'NASA ISS CIR: BASS-II Investigation', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=922' },
      { title: 'NASA Saffire Spacecraft Fire Safety Reports', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1738' },
    ],
    reply: `### 🔥 Lunar Surface Base (34% O₂ · 10.2 psi · 1/6 g) Fire Hazard Directive

Under the planned **Artemis Lunar Base Camp** atmospheric baseline, materials are substantially more flammable than on Earth:

* **Oxygen Partial Pressure ($P_{O2}$):** **3.47 psi** (vs. 3.09 psi Earth standard). The enriched 34% oxygen concentration reduces astronaut pre-breathing requirements for EVA, but lowers the ignition energy threshold of habitat fabrics and electronics insulation.
* **Flammability Multiplier:** Laboratory and flight data from <span class="inv-action-tag" data-inv="acme-cfig">ACME: CFI-G ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span> indicate an **~80% increase in flame propagation velocity** for common polymers (like PMMA and Nomex composites).
* **1/6th Lunar Gravity Physics:** Natural buoyancy is reduced to one-sixth. Hot gases do not rise rapidly to dissipate heat, allowing local pyrolysis zones to superheat surrounding materials without triggering traditional thermal sensors.
* **Critical Safety Protocol:** In the event of a thermal event, cabin ventilation fans must be instantly throttled below **0.1 m/s** (<span class="inv-action-tag" data-inv="saffire-iii">Saffire-III ↗</span> confirmed that forced airflow transitions smoldering into an open flashover).`,
  },

  spacesuit: {
    title: 'Spacesuit EVA (100% O₂ · 4.3 psi) Safety Limits',
    reasoning: `1. Parsing EVA parameters: 100% pure Oxygen at 4.3 psi (29.6 kPa) in 0g microgravity.
2. Oxygen partial pressure = 4.30 psi (+39% above Earth sea level).
3. Reviewing historical precedents: Apollo 1 (1967 pure oxygen launchpad flashover).
4. Evaluating microgravity ignition dynamics: Without natural convection, a static spark creates an instantaneous spherical flame envelope.
5. Cross-referencing ACME: s-Flame (Investigation #1627) and ACME: CFI-G.`,
    tools: [
      { cmd: 'psi-eval --o2=100 --pressure=4.3 --gravity=0', output: 'Extreme Fire Hazard: Pure O2 atmospheric classification' },
      { cmd: 'loi-check --materials=["Nylon", "Teflon", "Kevlar"]', output: 'Only fluoropolymers and polybenzimidazole (PBI) meet 100% O2 ignition criteria' },
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
    reply: `### 🧑‍🚀 Spacesuit EVA (100% O₂ · 4.3 psi) Critical Ignition Envelope

Spacesuits utilize **100% pure oxygen at 4.3 psi** to allow astronauts to bend glove fingers and joint bearings without fighting internal pressure. However, pure oxygen introduces extreme fire hazards:

* **Spontaneous Flammability:** In pure O₂, materials that are self-extinguishing in Earth air (such as heavy cotton or treated plastics) ignite instantaneously and burn explosively.
* **Diffusion Spheres in Freefall:** As proven by <span class="inv-action-tag" data-inv="acme-s-flame">ACME: s-Flame ↗</span>, stationary flames in 0g form spherical envelopes. Oxygen diffuses inward from all directions, creating very hot localized reaction zones.
* **NASA Safety Mandates:** Strict grounding to eliminate electrostatic discharge; all internal electronics are enclosed in inert nitrogen-purged channels, and fabrics are strictly limited to fluoropolymer composites and Teflon-jacketed wiring.`,
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
    reply: `### 🚨 Why Terrestrial Smoke Detectors Fail in Microgravity

Standard home and building smoke alarms rely on hot air rising to the ceiling. In space, fire detection requires a completely different physics model:

* **Absence of Buoyant Plumes:** Without gravity, hot smoke does not rise. It accumulates into a localized cloud around the overheating wire or device.
* **Particle Agglomeration (SAME-R Discovery):** <span class="inv-action-tag" data-inv="same-r">SAME-R ↗</span> discovered that because smoke particles aren't swept away, they collide with each other and form **clusters 8 to 12 times larger** than terrestrial soot particles. Terrestrial optical ionization sensors miscalculate their density.
* **Lunar Regolith Dust Interference (DAFT-2):** On Moon and Mars bases, abrasive surface dust brought inside by spacesuits triggers optical alarms. Multi-angle laser scattering is required to differentiate between jagged mineral dust and spherical pyrolysis smoke.`,
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
      { cmd: 'suppressant-efficiency --agent="CO2" --agent="Helium"', output: 'Helium conducts thermal energy away faster; CO2 acts as chemical heat capacity sink' },
    ],
    plan: [
      'Monitor post-extinction droplet temperature via infrared radiometry',
      'Maintain inert gas blanket (CO2/He) until fuel surface drops below pyrolysis temp',
      'Avoid premature cabin repressurization or ventilation reactivation',
    ],
    sources: [
      { title: 'NASA Glenn: FLEX Droplet Extinguishment Experiment', url: 'https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=144' },
      { title: 'Combustion Integrated Rack (CIR) Multi-user Droplet Apparatus', url: 'https://www.nasa.gov/' },
    ],
    reply: `### 🧯 Cool Flames Discovery (<span class="inv-action-tag" data-inv="flex">FLEX ↗</span>) & Extinguishment Protocols

One of the most profound discoveries from NASA’s Combustion Integrated Rack was the phenomenon of **Cool Flames**:

* **Invisible Low-Temperature Combustion:** During <span class="inv-action-tag" data-inv="flex">FLEX ↗</span> droplet burning tests, astronauts observed that after the visible yellow flame extinguished, the fuel droplet continued burning invisibly at **600 to 800 K** (normal flames burn at 1500–2000 K).
* **The Reignition Hazard:** Because cool flames produce no visible light and little soot, crew members would assume the fire was out. If fresh air is supplied, the cool flame can suddenly transition back into a raging high-temperature fire.
* **Inert Suppression Protocol:** Fire suppression in spacecraft cannot rely on briefly spraying an extinguishing agent. The compartment must remain saturated with **CO₂ or Helium diluent** until temperature sensors verify that all surfaces have cooled below their chemical reaction thresholds.`,
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
    reply: `### 🌍 From Orbit to Earth: How NASA Fire Science Protects Us Daily

NASA’s microgravity combustion research directly powers everyday life-safety technologies across the globe:

1. **Fine-Water-Mist Fire Extinguishers:**
   Developed for the ISS to avoid suffocating astronauts with CO₂ or damaging delicate avionics with water hoses. Today, fine-water-mist systems protect **hospital ICUs, nuclear power plants, historic museums, and data server facilities** on Earth.
2. **Advanced Firefighter Protective Gear:**
   The flame-resistant fabrics worn by municipal firefighters (PBI and Nomex blends) and their **lightweight carbon-composite breathing tanks** were originally developed for astronaut spacesuits following the Apollo fire investigation.
3. **Early-Warning Aviation Smoke Sensors:**
   Laser particle sensors refined during the <span class="inv-action-tag" data-inv="same-r">SAME ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS ↗</span> experiments are now standard in modern commercial airliner cargo holds and clean-room manufacturing plants.`,
  },
};

const SUGGESTIONS = [
  { label: '🌕 Evaluate Lunar Base Fire Hazard (34% O2)', key: 'lunar' },
  { label: '🧑‍🚀 Why is 100% O2 in spacesuits dangerous?', key: 'spacesuit' },
  { label: '🚨 Why do smoke detectors fail in 0g?', key: 'smoke' },
  { label: '🧯 What is a cool flame and how to extinguish it?', key: 'coolflames' },
  { label: '🌍 How does NASA fire research help Earth?', key: 'earth' },
];

export default function FlameSIChat() {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'assistant',
      reasoning: 'FLAME-SI v2.4 initialized with NASA Physical Science Informatics (PSI) knowledge base. Ready for mission combustion and spacecraft fire safety analysis.',
      tools: [{ cmd: 'init --dataset="NASA-PSI-CIR-MSG" --status="ready"', output: '10 flight investigations loaded' }],
      plan: ['Ready to assist with Artemis Moon Base, Spacesuit EVA, and ISS fire safety scenarios.'],
      sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
      text: `Hello! I am **FLAME-SI**, your interactive space fire safety co-pilot.

I synthesize findings from decades of NASA microgravity experiments—including **BASS-II**, **FLEX**, **ACME**, and **Saffire**—to help aerospace engineers evaluate ignition thresholds, flame propagation, and suppression protocols for missions to the Moon, Mars, and the ISS.

Pick a quick mission scenario below or ask me any question!`,
    },
  ]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState('flame-si-v2.4');
  const [effort, setEffort] = useState('deep');
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [expandedTrace, setExpandedTrace] = useState({ init: false });

  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Handle clickable tags inside text
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
    setIsStreaming(true);

    // Determine matching knowledge base or generate dynamic synthesis
    const qLower = query.toLowerCase();
    let matched = null;
    if (qLower.includes('lunar') || qLower.includes('oy') || qLower.includes('moon') || qLower.includes('34%')) {
      matched = KNOWLEDGE_BASE.lunar;
    } else if (qLower.includes('spacesuit') || qLower.includes('skafandr') || qLower.includes('eva') || qLower.includes('100%')) {
      matched = KNOWLEDGE_BASE.spacesuit;
    } else if (qLower.includes('smoke') || qLower.includes('tutun') || qLower.includes('detector') || qLower.includes('datchik') || qLower.includes('same')) {
      matched = KNOWLEDGE_BASE.smoke;
    } else if (qLower.includes('cool') || qLower.includes('flex') || qLower.includes('suppress') || qLower.includes("o'chirish") || qLower.includes('droplet')) {
      matched = KNOWLEDGE_BASE.coolflames;
    } else if (qLower.includes('earth') || qLower.includes('yer') || qLower.includes('firefighter') || qLower.includes('spinoff')) {
      matched = KNOWLEDGE_BASE.earth;
    } else {
      // Dynamic synthesis for custom questions
      matched = {
        title: `SI Combustion Synthesis: "${query.slice(0, 32)}..."`,
        reasoning: `1. Analyzing query: "${query}" across NASA Physical Science Informatics database.
2. Assessing gravitational environment parameters (0g microgravity vs Earth 1g).
3. In microgravity, absence of buoyancy creates spherical diffusion regimes without natural convective cooling.
4. Cross-referencing relevant combustion hardware: Combustion Integrated Rack (CIR) and Microgravity Science Glovebox (MSG).
5. Synthesizing safety implications for habitable spacecraft compartments.`,
        tools: [
          { cmd: `psi-search --query="${query.slice(0, 24)}"`, output: 'Found correlations across BASS-II, ACME, and Saffire experiments' },
          { cmd: 'evaluate-safety-envelope --standards="NASA-STD-6001"', output: 'Calculated safety thresholds and ventilation velocity limits' },
        ],
        plan: [
          'Examine buoyancy-free diffusion mechanics',
          'Evaluate oxygen flammability boundaries',
          'Determine suppression and ventilation control protocols',
        ],
        sources: [
          { title: 'NASA Physical Science Informatics (PSI) Database', url: 'https://psi.nasa.gov/' },
          { title: 'NASA Glenn Research Center Combustion Integrated Rack', url: 'https://www.nasa.gov/' },
        ],
        reply: `### 🔬 NASA SI Fire Safety Analysis

Regarding **"${query}"**:

In microgravity and enclosed space environments, fire behaves in ways counterintuitive to terrestrial experience:

* **Diffusion vs. Buoyancy:** Without gravity, heated gases do not rise. Flames lack the natural buoyancy-driven convective cooling of Earth, causing them to form **spherical, diffusion-limited reaction zones**.
* **Airflow Sensitivity:** Because diffusion is slow, any slight forced cabin ventilation (such as 0.1 to 0.5 m/s from life-support fans) supplies a continuous stream of oxygen, as demonstrated in the <span class="inv-action-tag" data-inv="saffire-i">Saffire-I ↗</span> and <span class="inv-action-tag" data-inv="bass-ii">BASS-II ↗</span> flight experiments.
* **Extinguishment & Prevention:** NASA standards require limiting flammable solids through strict **NASA-STD-6001** certification, keeping inert gas (CO₂/He) dilution reserves ready, and ensuring automatic air circulation shutdown upon thermal warning.`,
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
    };

    // Expand reasoning trace for the new message
    setExpandedTrace((prev) => ({ ...prev, [assistantMsgId]: true }));

    setTimeout(() => {
      setMessages((prev) => [...prev, partialAssistantMsg]);
      setIsStreaming(false);
    }, 900);
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
        plan: ['Ready to assist with Artemis Moon Base, Spacesuit EVA, and ISS fire safety scenarios.'],
        sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
        text: `Conversation reset. I am ready to evaluate new mission fire safety scenarios or answer questions regarding NASA's microgravity combustion research!`,
      },
    ]);
  };

  return (
    <div className="flame-chat-container">
      {/* Header */}
      <div className="flame-chat-header">
        <div className="flame-chat-title-group">
          <div className="flame-chat-avatar">🔥</div>
          <div className="flame-chat-title">
            <h3>
              FLAME-SI Co-Pilot
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

      {/* Message Body */}
      <div className="flame-chat-body" ref={chatBodyRef} onClick={handleTagClick}>
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="chat-msg user">
                <div className="bubble-user">{msg.text}</div>
              </div>
            );
          }

          const isTraceOpen = expandedTrace[msg.id] ?? false;

          return (
            <div key={msg.id} className="chat-msg assistant">
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
                    __html: msg.text.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>'),
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
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="flame-si-v2.4">FLAME-SI v2.4 (NASA PSI)</option>
                <option value="artemis-safety">Artemis Safety Model</option>
              </select>

              <select
                className="chat-option-select"
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
              >
                <option value="deep">Deep Scientific Reasoning</option>
                <option value="rapid">Rapid Summary</option>
              </select>
            </div>

            <Magnet padding={50} magnetStrength={2.5}>
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
    </div>
  );
}
