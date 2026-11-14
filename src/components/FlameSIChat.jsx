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
import ShinyText from './ShinyText';
import FadeContent from './FadeContent';
import { Magnet } from './Magnet';
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
  };
}

const SUGGESTIONS = [
  { label: 'Evaluate Lunar Base Fire Hazard (34% O2)', key: 'lunar' },
  { label: 'Why is 100% O2 in spacesuits dangerous?', key: 'spacesuit' },
  { label: 'Why do smoke detectors fail in 0g?', key: 'smoke' },
  { label: 'What is a cool flame and how to extinguish it?', key: 'coolflames' },
  { label: 'How does NASA fire research help Earth?', key: 'earth' },
];

export default function FlameSIChat() {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'assistant',
      reasoning: 'FLAME-SI v2.4 initialized with NASA Physical Science Informatics (PSI) flight investigations. Real-time microgravity combustion model active.',
      tools: [{ cmd: 'init --dataset="NASA-PSI-CIR-MSG" --status="ready"', output: '10 flight investigations verified' }],
      plan: ['Artemis Oy bazasi, Skafandr EVA va ISS yong\'in xavfsizligi stsenariylariga tayyor.'],
      sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
      text: `Salom! Men **FLAME-SI** — NASA mikrogravitatsiya tadqiqotlari asosida ishlovchi kosmik yong'in xavfsizligi intellektual tizimiman.

Men NASAning o'nlab yillik parvoz tajribalari—jumladan **BASS-II**, **FLEX**, **ACME** va **Saffire**—kashfiyotlarini tahlil qilib, Oy, Mars va ISS missiyalari uchun alanga dinamikasi hamda xavfsizlik protokollarini baholayman.

* **Fizik hisoblar:** Kislorod parsial bosimi (PO₂), gravitatsiya rejimi va konveksiya yo'qligi hisobga olinadi.
* **Tushunarli tahlil:** Quruq formulalar o'rniga har bir ko'rsatkich inson tushunadigan ma'nosi bilan birga taqdim etiladi.

Quyidagi stsenariylardan birini tanlang yoki istalgan savolingizni bering!`,
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
      matched = generateDynamicSynthesis(query);
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
        plan: ['Artemis Oy bazasi, Skafandr EVA va ISS yong\'in xavfsizligi stsenariylariga tayyor.'],
        sources: [{ title: 'NASA Physical Science Informatics (PSI)', url: 'https://psi.nasa.gov/' }],
        text: `Muloqot yangilandi. Yangi missiya yong'in xavfsizligi stsenariylarini tahlil qilishga yoki NASA mikrogravitatsiya tajribalari bo'yicha savollaringizga javob berishga tayyorman!`,
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
    </div>
  );
}
