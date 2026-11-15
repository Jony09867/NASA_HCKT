import {readSelection,writeSelection} from './src/session';
/* ==========================================================================
   Flame in Freefall Explorer - Core Application Logic
   Experiment Finder & Side-by-Side Evidence Comparison
   ========================================================================== */

(function () {
  'use strict';

  // --- State & DOM References ---
  const data = Array.isArray(window.EXPERIMENTS) ? window.EXPERIMENTS : [];
  let selectedOrder = readSelection().filter(id=>data.some(item=>String(item.id)===id));
  writeSelection(selectedOrder); // Array of IDs in selected order (max 2)

  // Explore Controls
  const searchInput = document.querySelector('#search');
  const searchClearBtn = document.querySelector('#search-clear-btn');
  const sortSelect = document.querySelector('#sort-select');
  const fuelSelect = document.querySelector('#fuel');
  const topicSelect = document.querySelector('#topic');
  const platformSelect = document.querySelector('#platform');
  const oxygenInput = document.querySelector('#oxygen');

  // Advanced Filters
  const toggleAdvancedBtn = document.querySelector('#toggle-advanced');
  const advancedPanel = document.querySelector('#advanced-filters-panel');
  const facilitySelect = document.querySelector('#facility-filter');
  const gravitySelect = document.querySelector('#gravity-filter');
  const geometrySelect = document.querySelector('#geometry-filter');
  const rangeControls = Object.fromEntries(['airflow', 'pressure'].map(key => [key, {
    min: document.querySelector(`#${key}-min`), max: document.querySelector(`#${key}-max`),
    includeUnknown: document.querySelector(`#${key}-unknown`), includeQuiescent: document.querySelector(`#${key}-quiescent`), help: document.querySelector(`#${key}-help`)
  }]));

  // Numeric conditions are usable only after a reviewer supplies structured, sourced evidence.
  // Example: pressureRange: { verified: true, min: 90, max: 100, unit: 'kPa', basis: 'absolute', scope: 'test', sourceUrl: 'https://...' }
  function reviewedRange(item, key) {
    const value = item && item[`${key}Range`];
    if (!value || value.verified !== true || !isValidHttpUrl(value.sourceUrl) || !['test', 'investigation_range'].includes(value.scope) || !value.basis) return null;
    if (value.basis !== (key === 'pressure' ? 'absolute' : 'speed')) return null;
    const conversions = key === 'pressure' ? { kPa: 1, Pa: 0.001, atm: 101.325 } : { 'm/s': 1, 'cm/s': 0.01 };
    const factor = conversions[value.unit];
    if (factor === undefined || typeof value.min !== 'number' || typeof value.max !== 'number' || !Number.isFinite(value.min) || !Number.isFinite(value.max) || value.min < 0 || value.max < value.min) return null;
    return { min: value.min * factor, max: value.max * factor };
  }
  function gravityCategory(value) {
    const str = String(value || '').toLowerCase();
    if (/microgravity/.test(str)) return 'microgravity';
    if (/reduced gravity|partial gravity/.test(str)) return 'reduced';
    if (/normal gravity|earth gravity|(?:^|\s)1g(?:\s|$)/.test(str)) return 'normal';
    return 'unknown';
  }
  function getRangeFilter(key) {
    const c = rangeControls[key];
    return { min: c.min.value === '' ? null : Number(c.min.value), max: c.max.value === '' ? null : Number(c.max.value), includeUnknown: c.includeUnknown.checked, includeQuiescent: Boolean(c.includeQuiescent && c.includeQuiescent.checked) };
  }
  function rangeIsActive(range) { return range.min !== null || range.max !== null || !range.includeUnknown || range.includeQuiescent; }
  function matchesRange(item, key, filter) {
    if (filter.min !== null && filter.max !== null && filter.min > filter.max) return false;
    const range = reviewedRange(item, key);
    if (!range) return filter.includeUnknown || (key === 'airflow' && filter.includeQuiescent && /quiescent/i.test(String(item.airflow || '')));
    return (filter.min === null || range.max >= filter.min) && (filter.max === null || range.min <= filter.max);
  }
  function resetRange(key) {
    const c = rangeControls[key]; c.min.value = ''; c.max.value = ''; c.max.setCustomValidity(''); c.max.removeAttribute('aria-invalid'); c.help.textContent = c.min.disabled ? 'Numeric search is unavailable until values, units and sources are reviewed. Records remain visible.' : 'Matches overlap with reviewed reported ranges; unknown or unverified records can be included.'; c.includeUnknown.checked = true; if (c.includeQuiescent) c.includeQuiescent.checked = false;
  }
  function describeRange(key, filter) {
    const unit = key === 'pressure' ? 'kPa' : 'm/s';
    const bounds = filter.min !== null || filter.max !== null ? `${filter.min ?? 'any'}–${filter.max ?? 'any'} ${unit}` : 'any';
    return `${bounds}${filter.includeUnknown ? ' (includes unknown)' : filter.includeQuiescent ? ' (includes quiescent reports)' : ' (reviewed only)'}`;
  }

  // Feedback & Containers
  const activeFiltersContainer = document.querySelector('#active-filters');
  const matchNumberEl = document.querySelector('#match-number');
  const countEl = document.querySelector('#count');
  const countLabelEl = document.querySelector('#count-label');
  const clearBtn = document.querySelector('#clear');
  const cardsContainer = document.querySelector('#cards');
  const emptyContainer = document.querySelector('#empty');
  const toastContainer = document.querySelector('#toast-container');
  const exploreTitle = document.querySelector('#explore-title');

  // Compare Containers
  const compareToolbar = document.querySelector('#compare-toolbar');
  const comparisonContainer = document.querySelector('#comparison-container');
  const btnSwapColumns = document.querySelector('#btn-swap-columns');
  const btnClearCompare = document.querySelector('#btn-clear-compare');

  const filterControls={q:searchInput,sort:sortSelect,fuel:fuelSelect,topic:topicSelect,platform:platformSelect,oxygen:oxygenInput,facility:facilitySelect,gravity:gravitySelect,geometry:geometrySelect,airflow:airflowSelect,pressure:pressureSelect};
  let restoring=false;
  function restoreFilters(){
    const params=new URLSearchParams(location.search);
    Object.entries(filterControls).forEach(([key,el])=>{if(el)el.value=params.get(key)|| (key==='sort'?'relevant':'');});
  }
  function syncFilters(){
    if(!cardsContainer||restoring)return;
    const url=new URL(location.href);
    Object.entries(filterControls).forEach(([key,el])=>{if(el?.value && !(key==='sort'&&el.value==='relevant'))url.searchParams.set(key,el.value);else url.searchParams.delete(key);});
    history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  function updateSelection(){
    writeSelection(selectedOrder);
    const tray=document.getElementById('selection-summary');
    if(tray)tray.textContent=selectedOrder.length+' of 2 selected'+(selectedOrder.length?' · '+selectedOrder.map(id=>data.find(x=>String(x.id)===id)?.acronym||id).join(' / '):'');
  }
  window.addEventListener('popstate',()=>{restoring=true;restoreFilters();render();restoring=false;});
  window.addEventListener('pageshow',()=>{selectedOrder=readSelection().filter(id=>data.some(item=>String(item.id)===id));restoreFilters();render();});

  // --- Utilities ---
  function esc(value, fallback = 'Not available') {
    if (value === null || value === undefined || String(value).trim() === '') {
      return fallback;
    }
    return String(value).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function isValidHttpUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
      const parsed = new URL(string);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function parseOxygen(str) {
    if (!str || typeof str !== 'string') return null;
    const matches = str.match(/(\d+(?:\.\d+)?)/g);
    if (!matches || matches.length === 0) return null;
    const nums = matches.map(Number);
    return {
      min: Math.min(...nums),
      max: Math.max(...nums)
    };
  }

  function getOxygenDelta(item, target) {
    if (target === null || target === undefined || isNaN(target)) return null;
    const parsed = parseOxygen(item && item.oxygen);
    if (!parsed) return 9999;
    if (target >= parsed.min && target <= parsed.max) return 0;
    return Math.min(Math.abs(target - parsed.min), Math.abs(target - parsed.max));
  }

  // --- Dropdown Initialization from Actual Dataset ---
  function getUniqueValues(field) {
    return [...new Set(data.map(x => x && x[field]).filter(v => v && String(v).trim() !== ''))].sort();
  }

  function populateSelect(selectEl, values, defaultLabel) {
    if (!selectEl) return;
    const currentVal = selectEl.value;
    selectEl.innerHTML = `<option value="">${defaultLabel}</option>`;
    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });
    if (values.includes(currentVal)) {
      selectEl.value = currentVal;
    }
  }

  function initAllDropdowns() {
    populateSelect(fuelSelect, getUniqueValues('fuel'), 'All materials / fuels');
    populateSelect(topicSelect, getUniqueValues('topic'), 'All research topics');
    populateSelect(platformSelect, getUniqueValues('platform'), 'All platforms');
    populateSelect(facilitySelect, getUniqueValues('facility'), 'All facilities');
    const gravityLabels = { microgravity: 'Microgravity', reduced: 'Reduced gravity', normal: 'Normal gravity', unknown: 'Unknown' };
    const categories = [...new Set(data.map(item => gravityCategory(item.gravity)))];
    gravitySelect.innerHTML = '<option value="">All gravity conditions</option>';
    Object.entries(gravityLabels).filter(([key]) => categories.includes(key)).forEach(([key, label]) => {
      const option = document.createElement('option'); option.value = key; option.textContent = label; gravitySelect.appendChild(option);
    });
    populateSelect(geometrySelect, getUniqueValues('geometry'), 'All fuel geometries');
    Object.entries(rangeControls).forEach(([key, control]) => {
      const hasReviewed = data.some(item => reviewedRange(item, key));
      control.min.disabled = !hasReviewed; control.max.disabled = !hasReviewed;
      control.help.textContent = hasReviewed
        ? 'Matches overlap with reviewed reported ranges; unknown or unverified records can be included.'
        : 'Numeric search is unavailable until values, units and sources are reviewed. Records remain visible.';
    });
  }

  // --- Toast Notification ---
  let toastTimeout = null;
  function showCompareToast(message) {
    if (!toastContainer) {
      alert(message);
      return;
    }
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    toastContainer.innerHTML = `
      <div class="compare-toast" role="status" aria-live="polite">
        <div class="compare-toast-msg">
          <span class="compare-toast-icon" aria-hidden="true">✳</span>
          <span>${esc(message, '')}</span>
        </div>
        <button type="button" class="compare-toast-close" aria-label="Dismiss notification">✕</button>
      </div>
    `;
    const closeBtn = toastContainer.querySelector('.compare-toast-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        toastContainer.innerHTML = '';
      };
    }
    toastTimeout = setTimeout(() => {
      toastContainer.innerHTML = '';
    }, 4500);
  }

  // --- Transparent Match Analysis ---
  function analyzeMatch(item, queryWords) {
    if (!queryWords || queryWords.length === 0) return { score: 0, reason: null };

    let score = 0;
    const reasons = [];

    const nameStr = `${item.name || ''} ${item.acronym || ''}`.toLowerCase();
    const fuelStr = `${item.fuel || ''}`.toLowerCase();
    const topicStr = `${item.topic || ''}`.toLowerCase();
    const platformStr = `${item.platform || ''} ${item.facility || ''}`.toLowerCase();
    const objStr = `${item.objective || ''}`.toLowerCase();
    const findingsStr = `${item.findings || ''} ${item.measurements || ''}`.toLowerCase();

    queryWords.forEach(word => {
      if (nameStr.includes(word)) {
        score += 50;
        reasons.push(item.acronym || 'Name');
      }
      if (fuelStr.includes(word)) {
        score += 35;
        reasons.push(item.fuel);
      }
      if (topicStr.includes(word)) {
        score += 30;
        reasons.push(item.topic);
      }
      if (platformStr.includes(word)) {
        score += 20;
        reasons.push(item.platform ? 'Platform' : 'Facility');
      }
      if (objStr.includes(word)) {
        score += 15;
      }
      if (findingsStr.includes(word)) {
        score += 10;
      }
    });

    const uniqueReasons = [...new Set(reasons)].filter(Boolean);
    const reasonText = uniqueReasons.length > 0 ? `Matched: ${uniqueReasons.slice(0, 2).join(' · ')}` : 'Matched in objective';

    return { score, reason: reasonText };
  }

  // --- Active Filters Rendering ---
  function renderActiveFiltersBar(filters) {
    if (!activeFiltersContainer) return;

    const chips = [];
    if (filters.q) chips.push({ key: 'q', label: `Search: “${filters.q}”`, id: 'chip-q' });
    if (filters.fuel) chips.push({ key: 'fuel', label: `Material: ${filters.fuel}`, id: 'chip-fuel' });
    if (filters.topic) chips.push({ key: 'topic', label: `Topic: ${filters.topic}`, id: 'chip-topic' });
    if (filters.platform) chips.push({ key: 'platform', label: `Platform: ${filters.platform}`, id: 'chip-platform' });
    if (filters.targetOxygen !== null) chips.push({ key: 'oxygen', label: `Target O₂: ${filters.targetOxygen}% (nearest)`, id: 'chip-oxygen' });
    if (filters.facility) chips.push({ key: 'facility', label: `Facility: ${filters.facility}`, id: 'chip-facility' });
    if (filters.gravity) chips.push({ key: 'gravity', label: `Gravity: ${gravitySelect.selectedOptions[0].textContent}`, id: 'chip-gravity' });
    if (filters.geometry) chips.push({ key: 'geometry', label: `Geometry: ${filters.geometry}`, id: 'chip-geometry' });
    if (filters.airflow) chips.push({ key: 'airflow', label: `Airflow: ${filters.airflow}`, id: 'chip-airflow' });
    if (filters.pressure) chips.push({ key: 'pressure', label: `Pressure: ${filters.pressure}`, id: 'chip-pressure' });

    if (chips.length === 0) {
      activeFiltersContainer.hidden = true;
      activeFiltersContainer.innerHTML = '';
      return;
    }

    activeFiltersContainer.hidden = false;
    let html = '<span class="active-filters-label">Active filters:</span>';
    chips.forEach(c => {
      html += `
        <button type="button" class="filter-chip" data-remove-key="${c.key}" aria-label="Remove filter: ${esc(c.label)}">
          <span>${esc(c.label)}</span>
          <span class="chip-remove-icon" aria-hidden="true">✕</span>
        </button>
      `;
    });
    html += `<button type="button" class="clear-all-link" id="chip-clear-all">Clear all</button>`;

    activeFiltersContainer.innerHTML = html;

    activeFiltersContainer.querySelectorAll('[data-remove-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeIndividualFilter(btn.dataset.removeKey);
      });
    });

    const clearAll = activeFiltersContainer.querySelector('#chip-clear-all');
    if (clearAll) {
      clearAll.addEventListener('click', clearAllFilters);
    }
  }

  function removeIndividualFilter(key) {
    if (key === 'q' && searchInput) {
      searchInput.value = '';
      if (searchClearBtn) searchClearBtn.hidden = true;
      searchInput.focus();
    } else if (key === 'fuel' && fuelSelect) {
      fuelSelect.value = '';
      fuelSelect.focus();
    } else if (key === 'topic' && topicSelect) {
      topicSelect.value = '';
      topicSelect.focus();
    } else if (key === 'platform' && platformSelect) {
      platformSelect.value = '';
      platformSelect.focus();
    } else if (key === 'oxygen' && oxygenInput) {
      oxygenInput.value = '';
      oxygenInput.focus();
    } else if (key === 'facility' && facilitySelect) {
      facilitySelect.value = '';
      facilitySelect.focus();
    } else if (key === 'gravity' && gravitySelect) {
      gravitySelect.value = '';
      gravitySelect.focus();
    } else if (key === 'geometry' && geometrySelect) {
      geometrySelect.value = '';
      geometrySelect.focus();
    } else if (key === 'airflow' || key === 'pressure') {
      resetRange(key);
      rangeControls[key].includeUnknown.focus();
    }
    render();
  }

  function clearAllFilters() {
    const clean=new URL(location.href);clean.searchParams.delete('id');history.replaceState(null,'',clean.pathname+clean.search);
    if (searchInput) {
      searchInput.value = '';
      if (searchClearBtn) searchClearBtn.hidden = true;
    }
    if (fuelSelect) fuelSelect.value = '';
    if (topicSelect) topicSelect.value = '';
    if (platformSelect) platformSelect.value = '';
    if (oxygenInput) oxygenInput.value = '';
    if (facilitySelect) facilitySelect.value = '';
    if (gravitySelect) gravitySelect.value = '';
    if (geometrySelect) geometrySelect.value = '';
    resetRange('airflow'); resetRange('pressure');
    render();
    if (searchInput) searchInput.focus();
  }

  // --- Spotlight & Tilt Setup ---
  function initSpotlightCard(card) {
    const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;
    if (isReducedMotion || isTouch) return;

    card.addEventListener('pointermove', function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotX = -((y - centerY) / centerY) * 2.0;
      const rotY = ((x - centerX) / centerX) * 2.0;

      card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    });

    card.addEventListener('pointerleave', function () {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  }

  // --- Fade Content Entrance Observer ---
  let cardObserver = null;
  if ('IntersectionObserver' in window) {
    cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
  }

  // --- Main Render Function for Explore ---
  function render() {
    updateSelection();
    if(!cardsContainer){renderComparisonSection();return;}
    syncFilters();
    const qRaw = searchInput ? searchInput.value.trim() : '';
    const q = qRaw.toLowerCase();
    const queryWords = q.split(/\s+/).filter(Boolean);

    if (searchClearBtn) {
      searchClearBtn.hidden = !qRaw;
    }

    const currentFuel = fuelSelect ? fuelSelect.value : '';
    const currentTopic = topicSelect ? topicSelect.value : '';
    const currentPlatform = platformSelect ? platformSelect.value : '';
    const currentFacility = facilitySelect ? facilitySelect.value : '';
    const currentGravity = gravitySelect ? gravitySelect.value : '';
    const currentGeometry = geometrySelect ? geometrySelect.value : '';
    const currentAirflow = getRangeFilter('airflow');
    const currentPressure = getRangeFilter('pressure');

    const targetOxygen = (oxygenInput && oxygenInput.value.trim() !== '' && !isNaN(parseFloat(oxygenInput.value)))
      ? parseFloat(oxygenInput.value)
      : null;

    const sortMode = sortSelect ? sortSelect.value : 'relevant';

    // 1. Filtering
    let filtered = data.filter(item => {
      if (!item) return false;
      const exactId=new URLSearchParams(location.search).get('id');
      if(exactId && String(item.id)!==exactId)return false;

      // Search match across multiple verified fields
      if (queryWords.length > 0) {
        const fullSearchBlob = `${item.name || ''} ${item.acronym || ''} ${item.objective || ''} ${item.fuel || ''} ${item.topic || ''} ${item.platform || ''} ${item.facility || ''} ${item.findings || ''} ${item.measurements || ''}`.toLowerCase();
        const matchesAllWords = queryWords.every(word => fullSearchBlob.includes(word));
        if (!matchesAllWords) return false;
      }

      // Primary filters
      if (currentFuel && item.fuel !== currentFuel) return false;
      if (currentTopic && item.topic !== currentTopic) return false;
      if (currentPlatform && item.platform !== currentPlatform) return false;

      // Advanced filters
      if (currentFacility && item.facility !== currentFacility) return false;
      if (currentGravity && gravityCategory(item.gravity) !== currentGravity) return false;
      if (currentGeometry && item.geometry !== currentGeometry) return false;
      if (!matchesRange(item, 'airflow', currentAirflow)) return false;
      if (!matchesRange(item, 'pressure', currentPressure)) return false;

      return true;
    });

    // 2. Sorting
    filtered.sort((a, b) => {
      if (sortMode === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortMode === 'oxygen' && targetOxygen !== null) {
        const deltaA = getOxygenDelta(a, targetOxygen);
        const deltaB = getOxygenDelta(b, targetOxygen);
        return deltaA - deltaB;
      } else if (sortMode === 'platform') {
        return (a.platform || '').localeCompare(b.platform || '');
      } else {
        // Most relevant: prioritize text match score, then oxygen proximity, then name
        const matchA = analyzeMatch(a, queryWords);
        const matchB = analyzeMatch(b, queryWords);
        if (matchB.score !== matchA.score) {
          return matchB.score - matchA.score;
        }
        if (targetOxygen !== null) {
          const deltaA = getOxygenDelta(a, targetOxygen);
          const deltaB = getOxygenDelta(b, targetOxygen);
          if (deltaA !== deltaB) return deltaA - deltaB;
        }
        return (a.name || '').localeCompare(b.name || '');
      }
    });

    // 3. Telemetry Feedback & Counters
    const hasAnyFilter = Boolean(
      q || currentFuel || currentTopic || currentPlatform || targetOxygen !== null ||
      currentFacility || currentGravity || currentGeometry || rangeIsActive(currentAirflow) || rangeIsActive(currentPressure)
    );

    if (countEl) {
      countEl.textContent = String(filtered.length).padStart(2, '0');
    }
    if (countLabelEl) {
      countLabelEl.innerHTML = hasAnyFilter ? 'INVESTIGATIONS<br>MATCHING' : 'INVESTIGATIONS<br>AVAILABLE';
    }
    if (matchNumberEl) {
      matchNumberEl.textContent = String(filtered.length);
    }

    // 4. Render Active Filter Chips
    renderActiveFiltersBar({
      q: qRaw,
      fuel: currentFuel,
      topic: currentTopic,
      platform: currentPlatform,
      targetOxygen,
      facility: currentFacility,
      gravity: currentGravity,
      geometry: currentGeometry,
      airflow: rangeIsActive(currentAirflow) ? describeRange('airflow', currentAirflow) : '',
      pressure: rangeIsActive(currentPressure) ? describeRange('pressure', currentPressure) : ''
    });

    // 5. Empty States Handling
    if (!emptyContainer || !cardsContainer) return;

    if (data.length === 0) {
      emptyContainer.hidden = false;
      cardsContainer.innerHTML = '';
      emptyContainer.innerHTML = `
        <span class="empty-mark" aria-hidden="true">✳</span>
        <h3>No investigations to show yet</h3>
        <p>Verified experiment data will appear here as NASA sources are cataloged. Try checking back soon or consult the project overview.</p>
      `;
    } else if (filtered.length === 0) {
      emptyContainer.hidden = false;
      cardsContainer.innerHTML = '';
      emptyContainer.innerHTML = `
        <span class="empty-mark" aria-hidden="true">⌕</span>
        <h3>No matching investigations</h3>
        <p>No investigations matched your active filters${q ? ` for “<span class="empty-query-echo">${esc(qRaw)}</span>”` : ''}. Try broadening your search or resetting filters.</p>
        <div class="empty-actions">
          <button type="button" class="specular-button" id="empty-reset-btn">Reset all filters ↗</button>
        </div>
      `;
      const resetBtn = emptyContainer.querySelector('#empty-reset-btn');
      if (resetBtn) resetBtn.addEventListener('click', clearAllFilters);
    } else {
      emptyContainer.hidden = true;

      // 6. Render Investigation Cards
      cardObserver?.disconnect();
      cardsContainer.innerHTML = filtered.map(item => {
        const id = String(item.id || '');
        const isSelected = selectedOrder.includes(id);
        const hasValidUrl = isValidHttpUrl(item.sourceUrl);

        // Match reason explanation
        const matchInfo = analyzeMatch(item, queryWords);

        // Oxygen display
        let oxygenHtml = '';
        if (targetOxygen !== null) {
          const delta = getOxygenDelta(item, targetOxygen);
          const isExact = delta === 0;
          oxygenHtml = `
            <div class="spec-item oxygen-spec">
              <span class="spec-label">Oxygen Condition</span>
              <span class="spec-val ${isExact ? 'match' : ''}">
                ${esc(item.oxygen)} ${isExact ? '(In Range ✓)' : `(Δ ${delta.toFixed(0)}%)`}
              </span>
            </div>
          `;
        } else {
          oxygenHtml = `
            <div class="spec-item">
              <span class="spec-label">Oxygen Condition</span>
              <span class="spec-val">${esc(item.oxygen)}</span>
            </div>
          `;
        }

        return `
          <article class="spotlight-card fade-content-item ${isSelected ? 'is-selected' : ''}" data-id="${esc(id)}">
            <div class="card-content">
              <div class="card-top">
                <div class="card-badges-wrap">
                  <span class="card-eyebrow-badge">${esc(item.recordType || 'INVESTIGATION')}</span>
                  ${item.topic ? `<span class="card-topic-tag">${esc(item.topic)}</span>` : ''}
                </div>
                ${item.platform ? `<span class="card-platform-tag">${esc(item.platform)}</span>` : ''}
              </div>

              <h3>${esc(item.name)}</h3>

              ${matchInfo.reason && queryWords.length > 0 ? `
                <div class="card-match-reason">
                  <span aria-hidden="true">✓</span>
                  <span>${esc(matchInfo.reason)}</span>
                </div>
              ` : ''}

              <p class="card-objective">${esc(item.objective)}</p>

              <div class="card-specs-grid">
                <div class="spec-item">
                  <span class="spec-label">Fuel / Material</span>
                  <span class="spec-val">${esc(item.fuel)}</span>
                </div>
                ${oxygenHtml}
              </div>
              <details class="investigation-details"><summary>Details</summary>
                <dl><dt>Airflow velocity</dt><dd>${esc(item.airflow)}</dd><dt>Facility</dt><dd>${esc(item.facility)}</dd><dt>Measurements</dt><dd>${esc(item.measurements)}</dd><dt>Findings</dt><dd>${esc(item.findings)}</dd></dl>
              </details>

              <div class="card-footer">
                ${hasValidUrl 
                  ? `<a class="card-source-link" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener">NASA SOURCE ↗</a>` 
                  : `<span class="card-source-na">Source not available</span>`}
                <button type="button" class="btn-compare ${isSelected ? 'is-selected' : ''}" data-compare-id="${esc(id)}" aria-pressed="${isSelected}">
                  ${isSelected ? '✓ Selected' : '+ Compare'}
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('');

      // Attach card listeners
      cardsContainer.querySelectorAll('.spotlight-card').forEach(card => {

        if (cardObserver && card.getBoundingClientRect().top >= window.innerHeight) {
          cardObserver.observe(card);
        } else {
          card.classList.add('is-visible');
        }
        const compBtn = card.querySelector('[data-compare-id]');
        if (compBtn) {
          compBtn.onclick = (e) => {
            e.stopPropagation();
            toggleCompareSelection(compBtn.dataset.compareId);
          };
        }
      });
    }

    renderComparisonSection();
  }

  // --- Compare Toggling ---
  function toggleCompareSelection(id) {
    if (!id) return;
    const index = selectedOrder.indexOf(id);
    if (index > -1) {
      selectedOrder.splice(index, 1);
    } else if (selectedOrder.length < 2) {
      selectedOrder.push(id);
    } else {
      showCompareToast('Comparison limit reached (max 2). Please remove one investigation before adding another.');
      return;
    }
    render();
  }

  // --- Render Evidence Comparison Table ---
  function renderComparisonSection() {
    if (!comparisonContainer) return;

    const chosen = selectedOrder.map(id => data.find(x => String(x && x.id) === id)).filter(Boolean);

    // Update toolbar
    if (compareToolbar) {
      compareToolbar.hidden = chosen.length === 0;
    }

    // State 0: No items selected
    if (chosen.length === 0) {
      comparisonContainer.innerHTML = `
        <div class="compare-empty-guide">
          <span class="guide-mark" aria-hidden="true">✳</span>
          <h3>No investigations selected for comparison</h3>
          <p>Select up to two investigations from the library to analyze their experimental setups, conditions, observations, and findings side by side.</p>
          <a href="/explore/" class="specular-button">Explore investigations ↑</a>
        </div>
      `;
      return;
    }

    // State 1: One item selected
    if (chosen.length === 1) {
      const it1 = chosen[0];
      comparisonContainer.innerHTML = `
        <div class="evidence-table">
          <div class="evidence-header-grid">
            <div class="evidence-header-cell property-col">Investigation</div>
            <div class="evidence-header-cell investigation-col">
              <div class="evidence-card-head">
                <span class="inv-index">01 / SELECTED</span>
                <button type="button" class="btn-remove-item" data-remove-compare="${esc(it1.id)}">✕ Remove</button>
              </div>
              <h3>${esc(it1.name)}</h3>
              <div class="inv-topic">${esc(it1.topic)} · ${esc(it1.platform)}</div>
            </div>
            <div class="evidence-header-cell investigation-col slot-placeholder">
              <span><a href="/explore/">02 / SELECT SECOND INVESTIGATION ↗</a></span>
            </div>
          </div>
          ${renderCategoryRows(it1, null)}
        </div>
      `;
      attachCompareTableListeners();
      return;
    }

    // State 2: Two items selected (Full Aligned Evidence Table)
    const it1 = chosen[0];
    const it2 = chosen[1];

    comparisonContainer.innerHTML = `
      <div class="comparability-notice">
        <span class="notice-icon" aria-hidden="true">ℹ</span>
        <div>
          <strong>Scientific Comparability Note:</strong> Investigations in this library evaluate distinct combustion phenomena (solid slabs, liquid droplets, and gaseous coflow flames). Quantitative values like oxygen limits or air velocities cannot be compared as a monolithic fire-risk score because flammability boundaries depend on fuel phase, boundary layers, and convective velocities.
        </div>
      </div>

      <div class="evidence-table">
        <!-- Header Grid -->
        <div class="evidence-header-grid">
          <div class="evidence-header-cell property-col">Property / Evidence</div>
          <div class="evidence-header-cell investigation-col">
            <div class="evidence-card-head">
              <span class="inv-index">01 / INVESTIGATION</span>
              <button type="button" class="btn-remove-item" data-remove-compare="${esc(it1.id)}">✕ Remove</button>
            </div>
            <h3>${esc(it1.name)}</h3>
            <div class="inv-topic">${esc(it1.topic)} · ${esc(it1.platform)}</div>
          </div>
          <div class="evidence-header-cell investigation-col">
            <div class="evidence-card-head">
              <span class="inv-index">02 / INVESTIGATION</span>
              <button type="button" class="btn-remove-item" data-remove-compare="${esc(it2.id)}">✕ Remove</button>
            </div>
            <h3>${esc(it2.name)}</h3>
            <div class="inv-topic">${esc(it2.topic)} · ${esc(it2.platform)}</div>
          </div>
        </div>

        ${renderCategoryRows(it1, it2)}
      </div>
    `;

    attachCompareTableListeners();
  }

  function renderCategoryRows(it1, it2) {
    const categories = [
      {
        name: 'Overview',
        fields: [
          { label: 'Name & Acronym', val: x => x ? `${x.name || 'Not available'} (${x.acronym || 'N/A'})` : '' },
          { label: 'Record Type', val: x => x ? x.recordType : '' },
          { label: 'Research Topic', val: x => x ? x.topic : '' },
          { label: 'Platform / Environment', val: x => x ? x.platform : '' },
          { label: 'Facility / Module', val: x => x ? x.facility : '' },
          { label: 'Investigation ID', val: x => x ? x.id : '' },
          { label: 'Research Objective', val: x => x ? x.objective : '' }
        ]
      },
      {
        name: 'Material & Experimental Setup',
        fields: [
          { label: 'Fuel / Material', val: x => x ? x.fuel : '' },
          { label: 'Specimen Geometry', val: x => x ? x.geometry : '' },
          { label: 'Dimensions / Scale', val: x => x ? x.dimensions : '' },
          { label: 'Ignition Method', val: x => x ? x.ignition : '' },
          { label: 'Suppression / Extinction', val: x => x ? x.suppression : '' }
        ]
      },
      {
        name: 'Documented Environmental Conditions',
        fields: [
          { label: 'Gravity Condition', val: x => x ? x.gravity : '' },
          { 
            label: 'Oxygen Concentration', 
            val: x => x ? `${x.oxygen || 'Not available'}${x.oxygenBasis ? `<br><small style="color:#8c9794;">Basis: ${esc(x.oxygenBasis)}</small>` : ''}${x.oxygenTestedValues ? `<br><small style="color:#ff916a;">Discrete Tested: ${esc(x.oxygenTestedValues)}</small>` : ''}` : '' 
          },
          { label: 'Chamber Pressure', val: x => x ? x.pressure : '' },
          { label: 'Airflow Velocity', val: x => x ? x.airflow : '' },
          { label: 'Ambient Temperature', val: x => x ? x.temperature : '' }
        ]
      },
      {
        name: 'Results, Findings & Observations',
        fields: [
          { label: 'Key Measurements', val: x => x ? x.measurements : '' },
          { label: 'Physical Observations', val: x => x ? x.observations : '' },
          { label: 'Scientific Findings', val: x => x ? x.findings : '' },
          { label: 'Measurement Uncertainty', val: x => x ? x.uncertainty : '' },
          { label: 'Experimental Limitations', val: x => x ? x.limitations : '' }
        ]
      },
      {
        name: 'Verification & NASA Sources',
        fields: [
          { 
            label: 'NASA Verification Source', 
            val: x => {
              if (!x) return '';
              return isValidHttpUrl(x.sourceUrl)
                ? `<a href="${esc(x.sourceUrl)}" target="_blank" rel="noopener" class="card-source-link">VIEW OFFICIAL NASA RECORD ↗</a>`
                : '<span class="card-source-na">Source not available</span>';
            } 
          }
        ]
      }
    ];

    return categories.map(cat => `
      <div class="evidence-category-header">${esc(cat.name)}</div>
      ${cat.fields.map(f => {
        const val1 = it1 ? f.val(it1) : '';
        const val2 = it2 ? f.val(it2) : '';
        return `
          <div class="evidence-row">
            <div class="evidence-cell field-name">${esc(f.label)}</div>
            <div class="evidence-cell val-col ${!val1 || val1 === 'Not available' ? 'not-available' : ''}">${val1 || '<span class="not-available">Not available</span>'}</div>
            <div class="evidence-cell val-col ${!val2 || val2 === 'Not available' ? 'not-available' : ''}">${val2 || '<span class="not-available">Not available</span>'}</div>
          </div>
        `;
      }).join('')}
    `).join('');
  }

  function attachCompareTableListeners() {
    if (!comparisonContainer) return;
    comparisonContainer.querySelectorAll('[data-remove-compare]').forEach(b => {
      b.onclick = () => {
        toggleCompareSelection(b.dataset.removeCompare);
      };
    });
  }

  // --- Decrypted Text / Tech Reveal for Heading ---
  function initTechHeadingReveal() {
    if (!exploreTitle) return;
    const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    const originalText = exploreTitle.textContent || 'Explore the science';
    const glyphs = '01_/·✳✦X';
    let frame = 0;
    const maxFrames = 10;

    function decryptStep() {
      if (frame >= maxFrames) {
        exploreTitle.textContent = originalText;
        return;
      }
      const progress = frame / maxFrames;
      const revealedCount = Math.floor(progress * originalText.length);
      let output = originalText.slice(0, revealedCount);
      for (let i = revealedCount; i < originalText.length; i++) {
        output += originalText[i] === ' ' ? ' ' : glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      exploreTitle.textContent = output;
      frame++;
      setTimeout(decryptStep, 35);
    }

    if ('IntersectionObserver' in window) {
      const headingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            decryptStep();
            headingObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      headingObserver.observe(exploreTitle);
    } else {
      decryptStep();
    }
  }

  // --- Event Listeners Setup ---
  if (searchInput) searchInput.addEventListener('input', render);
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchClearBtn.hidden = true;
        render();
        searchInput.focus();
      }
    });
  }

  if (sortSelect) sortSelect.addEventListener('change', render);
  if (fuelSelect) fuelSelect.addEventListener('change', render);
  if (topicSelect) topicSelect.addEventListener('change', render);
  if (platformSelect) platformSelect.addEventListener('change', render);
  if (oxygenInput) oxygenInput.addEventListener('input', render);

  // Advanced Filters toggle
  if (toggleAdvancedBtn && advancedPanel) {
    toggleAdvancedBtn.addEventListener('click', () => {
      const isExpanded = toggleAdvancedBtn.getAttribute('aria-expanded') === 'true';
      toggleAdvancedBtn.setAttribute('aria-expanded', !isExpanded);
      advancedPanel.hidden = isExpanded;
    });
  }

  if (facilitySelect) facilitySelect.addEventListener('change', render);
  if (gravitySelect) gravitySelect.addEventListener('change', render);
  if (geometrySelect) geometrySelect.addEventListener('change', render);
  Object.values(rangeControls).forEach(control => {
    [control.min, control.max].forEach(input => input.addEventListener('input', () => {
      const invalid = control.min.value !== '' && control.max.value !== '' && Number(control.min.value) > Number(control.max.value);
      control.max.setCustomValidity(invalid ? 'Maximum must be greater than or equal to minimum.' : '');
      control.max.setAttribute('aria-invalid', String(invalid));
      control.help.textContent = invalid ? 'Maximum must be greater than or equal to minimum.' : 'Matches overlap with reviewed reported ranges; unknown or unverified records can be included.';
      render();
    }));
    control.includeUnknown.addEventListener('change', render);
    if (control.includeQuiescent) control.includeQuiescent.addEventListener('change', render);
  });

  if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);

  // Compare Toolbar Actions
  if (btnSwapColumns) {
    btnSwapColumns.addEventListener('click', () => {
      if (selectedOrder.length === 2) {
        selectedOrder.reverse();
        updateSelection();
        renderComparisonSection();
      }
    });
  }

  if (btnClearCompare) {
    btnClearCompare.addEventListener('click', () => {
      selectedOrder = [];
      render();
    });
  }

  // Initial Initialization
  initAllDropdowns();
  restoreFilters();
  render();


})();
