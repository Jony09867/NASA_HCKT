/* ==========================================================================
   Flame in Freefall Explorer - Core Application Logic
   ========================================================================== */

(function () {
  'use strict';

  // --- State & DOM References ---
  const data = Array.isArray(window.EXPERIMENTS) ? window.EXPERIMENTS : [];
  const selected = new Set();

  const searchInput = document.querySelector('#search');
  const fuelSelect = document.querySelector('#fuel');
  const oxygenInput = document.querySelector('#oxygen');
  const clearBtn = document.querySelector('#clear');
  const cardsContainer = document.querySelector('#cards');
  const emptyContainer = document.querySelector('#empty');
  const countEl = document.querySelector('#count');
  const countLabelEl = document.querySelector('#count-label');
  const comparisonEl = document.querySelector('#comparison');
  const activeFiltersContainer = document.querySelector('#active-filters');
  const toastContainer = document.querySelector('#toast-container');
  const exploreTitle = document.querySelector('#explore-title');

  // --- Utilities ---
  /**
   * Safely escapes strings for HTML injection.
   * Fallback to 'Not available' for missing/empty values where appropriate.
   */
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

  /**
   * Validates if a string is a safe HTTP or HTTPS URL.
   */
  function isValidHttpUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
      const parsed = new URL(string);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  /**
   * Extracts numerical oxygen bounds from string e.g. "16% - 21%", "21%", "15% - 30%"
   */
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

  /**
   * Returns distance between target oxygen % and investigation oxygen condition.
   * Returns 0 for exact match within range.
   */
  function getOxygenDelta(item, target) {
    if (target === null || target === undefined || isNaN(target)) return null;
    const parsed = parseOxygen(item && item.oxygen);
    if (!parsed) return 9999;
    if (target >= parsed.min && target <= parsed.max) return 0;
    return Math.min(Math.abs(target - parsed.min), Math.abs(target - parsed.max));
  }

  // --- Dynamic Fuel Dropdown Options Initialization ---
  const uniqueFuels = [...new Set(data.map(x => x && x.fuel).filter(f => f && String(f).trim() !== ''))].sort();

  function populateFuelDropdown() {
    if (!fuelSelect) return;
    fuelSelect.innerHTML = '<option value="">All fuel types</option>';
    uniqueFuels.forEach(fuel => {
      const opt = document.createElement('option');
      opt.value = fuel;
      opt.textContent = fuel;
      fuelSelect.appendChild(opt);
    });
  }

  // --- Accessible Inline Notification Toast ---
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

  // --- Active Filters Chips ---
  function renderActiveFiltersBar(query, activeFuel, targetOxygen) {
    if (!activeFiltersContainer) return;

    const hasQuery = Boolean(query && query.trim());
    const hasFuel = Boolean(activeFuel && activeFuel.trim());
    const hasOxygen = targetOxygen !== null;

    if (!hasQuery && !hasFuel && !hasOxygen) {
      activeFiltersContainer.hidden = true;
      activeFiltersContainer.innerHTML = '';
      return;
    }

    activeFiltersContainer.hidden = false;
    let html = '<span class="active-filters-label">Active filters:</span>';

    if (hasQuery) {
      html += `
        <button type="button" class="filter-chip" id="chip-remove-search" aria-label="Remove search filter: ${esc(query)}">
          <span>Search: “${esc(query)}”</span>
          <span class="chip-remove-icon" aria-hidden="true">✕</span>
        </button>
      `;
    }

    if (hasFuel) {
      html += `
        <button type="button" class="filter-chip" id="chip-remove-fuel" aria-label="Remove fuel filter: ${esc(activeFuel)}">
          <span>Fuel: ${esc(activeFuel)}</span>
          <span class="chip-remove-icon" aria-hidden="true">✕</span>
        </button>
      `;
    }

    if (hasOxygen) {
      html += `
        <button type="button" class="filter-chip" id="chip-remove-oxygen" aria-label="Remove target oxygen filter: ${targetOxygen}%">
          <span>Target O₂: ${targetOxygen}% (nearest)</span>
          <span class="chip-remove-icon" aria-hidden="true">✕</span>
        </button>
      `;
    }

    html += `<button type="button" class="clear-all-link" id="chip-clear-all">Clear all</button>`;

    activeFiltersContainer.innerHTML = html;

    const removeSearch = activeFiltersContainer.querySelector('#chip-remove-search');
    if (removeSearch) {
      removeSearch.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        render();
        if (searchInput) searchInput.focus();
      });
    }

    const removeFuel = activeFiltersContainer.querySelector('#chip-remove-fuel');
    if (removeFuel) {
      removeFuel.addEventListener('click', () => {
        if (fuelSelect) fuelSelect.value = '';
        render();
        if (fuelSelect) fuelSelect.focus();
      });
    }

    const removeOxygen = activeFiltersContainer.querySelector('#chip-remove-oxygen');
    if (removeOxygen) {
      removeOxygen.addEventListener('click', () => {
        if (oxygenInput) oxygenInput.value = '';
        render();
        if (oxygenInput) oxygenInput.focus();
      });
    }

    const clearAll = activeFiltersContainer.querySelector('#chip-clear-all');
    if (clearAll) {
      clearAll.addEventListener('click', () => {
        clearAllFilters();
      });
    }
  }

  function clearAllFilters() {
    if (searchInput) searchInput.value = '';
    if (fuelSelect) fuelSelect.value = '';
    if (oxygenInput) oxygenInput.value = '';
    render();
    if (searchInput) searchInput.focus();
  }

  // --- Spotlight & Tilt Interaction Setup ---
  function initSpotlightCard(card) {
    const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) return;

    card.addEventListener('pointermove', function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Micro tilt (subtle 2.2 degrees max)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotX = -((y - centerY) / centerY) * 2.2;
      const rotY = ((x - centerX) / centerX) * 2.2;

      card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    });

    card.addEventListener('pointerleave', function () {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  }

  // --- Card Entrance Observer (Fade Content inspired) ---
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

  function renderOxygenBadge(item, target) {
    if (!item || !item.oxygen) {
      return '<span class="card-oxygen-tag">O₂: Not available</span>';
    }
    if (target === null) {
      return `<span class="card-oxygen-tag">O₂: ${esc(item.oxygen)}</span>`;
    }
    const delta = getOxygenDelta(item, target);
    if (delta === 0) {
      return `<span class="card-oxygen-tag exact-match">O₂: ${esc(item.oxygen)} (Match ✓)</span>`;
    } else if (delta < 9000) {
      return `<span class="card-oxygen-tag">O₂: ${esc(item.oxygen)} (Δ ${delta.toFixed(0)}%)</span>`;
    } else {
      return `<span class="card-oxygen-tag">O₂: ${esc(item.oxygen)}</span>`;
    }
  }

  // --- Main Render Function ---
  function render() {
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const currentFuel = fuelSelect ? fuelSelect.value : '';
    const targetOxygen = (oxygenInput && oxygenInput.value.trim() !== '' && !isNaN(parseFloat(oxygenInput.value)))
      ? parseFloat(oxygenInput.value)
      : null;

    // Filter by search query and fuel
    let filtered = data.filter(item => {
      if (!item) return false;
      const name = item.name || '';
      const objective = item.objective || '';
      const matchesSearch = !q || `${name} ${objective}`.toLowerCase().includes(q);
      const matchesFuel = !currentFuel || item.fuel === currentFuel;
      return matchesSearch && matchesFuel;
    });

    // Rank / Sort by nearest oxygen percentage if a target is provided
    if (targetOxygen !== null) {
      filtered.sort((a, b) => {
        const deltaA = getOxygenDelta(a, targetOxygen);
        const deltaB = getOxygenDelta(b, targetOxygen);
        return deltaA - deltaB;
      });
    }

    // Update count display
    if (countEl) {
      countEl.textContent = String(filtered.length).padStart(2, '0');
    }
    if (countLabelEl) {
      const hasFilter = Boolean(q || currentFuel || targetOxygen !== null);
      countLabelEl.innerHTML = hasFilter ? 'INVESTIGATIONS<br>MATCHING' : 'INVESTIGATIONS<br>AVAILABLE';
    }

    // Render Active Filters Bar
    renderActiveFiltersBar(searchInput ? searchInput.value.trim() : '', currentFuel, targetOxygen);

    // Empty state handling
    if (!emptyContainer || !cardsContainer) return;

    if (data.length === 0) {
      // Situation A: No experiment data in library yet
      emptyContainer.hidden = false;
      cardsContainer.innerHTML = '';
      emptyContainer.innerHTML = `
        <span class="empty-mark" aria-hidden="true">✳</span>
        <h3>No investigations to show yet</h3>
        <p>Verified experiment data will appear here as NASA sources are cataloged. Try checking back soon or consult the project overview.</p>
      `;
    } else if (filtered.length === 0) {
      // Situation B: Data exists, but current filters yielded no matches
      emptyContainer.hidden = false;
      cardsContainer.innerHTML = '';

      emptyContainer.innerHTML = `
        <span class="empty-mark" aria-hidden="true">⌕</span>
        <h3>No matching investigations</h3>
        <p>No investigations found${q ? ` for “<span class="empty-query-echo">${esc(searchInput.value.trim())}</span>”` : ''}${currentFuel ? ` with fuel <b>${esc(currentFuel)}</b>` : ''}${targetOxygen !== null ? ` near target oxygen <b>${targetOxygen}%</b>` : ''}. Try adjusting your keywords or reset filters.</p>
        <div class="empty-actions">
          <button type="button" class="specular-button" id="empty-reset-btn">Reset all filters ↗</button>
        </div>
      `;

      const resetBtn = emptyContainer.querySelector('#empty-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', clearAllFilters);
      }
    } else {
      // Results exist: Render Cards
      emptyContainer.hidden = true;

      cardsContainer.innerHTML = filtered.map(item => {
        const id = String(item.id || '');
        const isSelected = selected.has(id);
        const hasValidUrl = isValidHttpUrl(item.sourceUrl);

        return `
          <article class="spotlight-card fade-content-item ${isSelected ? 'is-selected' : ''}" data-id="${esc(id)}">
            <div class="card-content">
              <div class="card-top">
                <span class="eyebrow">INVESTIGATION</span>
                <div class="card-tags">
                  <span class="card-fuel-tag">${esc(item.fuel, 'Fuel: Not available')}</span>
                  ${renderOxygenBadge(item, targetOxygen)}
                </div>
              </div>
              <h3>${esc(item.name)}</h3>
              <p class="card-objective">${esc(item.objective)}</p>
              <div class="card-footer">
                ${hasValidUrl 
                  ? `<a class="card-source-link" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener">SOURCE ↗</a>` 
                  : `<span class="card-source-na">Source not available</span>`}
                <button type="button" class="btn-compare ${isSelected ? 'is-selected' : ''}" data-compare-id="${esc(id)}" aria-pressed="${isSelected}">
                  ${isSelected ? '✓ Selected' : '+ Compare'}
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('');

      // Attach card listeners (spotlight + compare toggling + fade reveal)
      const renderedCards = cardsContainer.querySelectorAll('.spotlight-card');
      renderedCards.forEach(card => {
        initSpotlightCard(card);

        if (cardObserver) {
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

  // --- Compare Toggle Handler ---
  function toggleCompareSelection(id) {
    if (!id) return;
    if (selected.has(id)) {
      selected.delete(id);
    } else if (selected.size < 2) {
      selected.add(id);
    } else {
      showCompareToast('Comparison limit reached (max 2). Please deselect an investigation before adding another.');
      return;
    }
    render();
  }

  // --- Compare Section Rendering ---
  function renderComparisonSection() {
    if (!comparisonEl) return;

    const chosen = [...selected].map(id => data.find(x => String(x && x.id) === id)).filter(Boolean);

    comparisonEl.innerHTML = [0, 1].map(i => {
      const item = chosen[i];
      if (item) {
        return `
          <div class="slot filled">
            <span>0${i + 1} / INVESTIGATION</span>
            <h3>${esc(item.name)}</h3>
            ${[
              ['Objective', 'objective'],
              ['Fuel', 'fuel'],
              ['Oxygen', 'oxygen'],
              ['Airflow', 'airflow'],
              ['Measurements', 'measurements']
            ].map(([label, key]) => `
              <div class="row">
                <b>${label}</b>
                <span>${esc(item[key])}</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        return `
          <div class="slot">
            0${i + 1} <span>SELECT AN INVESTIGATION ABOVE ↗</span>
          </div>
        `;
      }
    }).join('');
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
        if (originalText[i] === ' ') {
          output += ' ';
        } else {
          output += glyphs[Math.floor(Math.random() * glyphs.length)];
        }
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

  // --- Event Listeners Initialization ---
  if (searchInput) {
    searchInput.addEventListener('input', render);
  }

  if (fuelSelect) {
    fuelSelect.addEventListener('change', render);
  }

  if (oxygenInput) {
    oxygenInput.addEventListener('input', render);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllFilters);
  }

  // Initial setup
  populateFuelDropdown();
  render();
  initTechHeadingReveal();

})();
