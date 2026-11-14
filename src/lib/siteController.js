/**
 * SiteController: Gives FLAME-SI autonomous programmatic control over the entire website
 * Can navigate, filter explore cards, toggle comparisons, clear filters, and manage UI state.
 */

export const SiteController = {
  // Smooth scroll to any section by ID
  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
    return false;
  },

  // Search in Explore Library (#search)
  searchExplore(query, targetO2) {
    this.scrollToSection('explore');
    const searchInput = document.getElementById('search');
    const o2Input = document.getElementById('oxygen');

    if (searchInput) {
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (o2Input && targetO2 !== undefined) {
      o2Input.value = targetO2;
      o2Input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  },

  // Filter fuel type in Explore Library (#fuel)
  filterFuel(fuelValue) {
    this.scrollToSection('explore');
    const fuelSelect = document.getElementById('fuel');
    if (fuelSelect) {
      fuelSelect.value = fuelValue;
      fuelSelect.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  },

  // Filter target oxygen (#oxygen)
  filterOxygen(o2Value) {
    this.scrollToSection('explore');
    const o2Input = document.getElementById('oxygen');
    if (o2Input) {
      o2Input.value = o2Value;
      o2Input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  },

  // Clear all filters
  clearFilters() {
    this.scrollToSection('explore');
    const clearBtn = document.getElementById('clear');
    if (clearBtn) {
      clearBtn.click();
      return true;
    }
    return false;
  },

  // Compare two investigations in Dual-Rack Compare mode (#compare)
  compareInvestigations(idA, idB) {
    this.scrollToSection('compare');
    const btnA = document.querySelector(`[data-compare-id="${idA}"]`);
    const btnB = document.querySelector(`[data-compare-id="${idB}"]`);

    if (btnA && !btnA.classList.contains('is-selected')) {
      btnA.click();
    }
    if (btnB && !btnB.classList.contains('is-selected')) {
      btnB.click();
    }
    return true;
  },
};
