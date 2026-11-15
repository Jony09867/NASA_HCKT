import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('app.js runs safely on /compare/ page without crashing on explore elements', () => {
  const code = fs.readFileSync('app.js', 'utf8');

  class Element {
    constructor(id, tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.innerHTML = '';
      this.value = '';
      this.hidden = false;
      this.children = [];
      this._attrs = {};
      this.listeners = {};
    }
    getAttribute(k) { return this._attrs[k] || null; }
    setAttribute(k, v) { this._attrs[k] = String(v); }
    removeAttribute(k) { delete this._attrs[k]; }
    addEventListener(ev, fn) { this.listeners[ev] = fn; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    focus() {}
    setCustomValidity() {}
  }

  const compContainer = new Element('comparison-container');
  const compToolbar = new Element('compare-toolbar');
  const swapBtn = new Element('btn-swap-columns', 'button');
  const clearBtn = new Element('btn-clear-compare', 'button');

  const elements = {
    '#comparison-container': compContainer,
    '#compare-toolbar': compToolbar,
    '#btn-swap-columns': swapBtn,
    '#btn-clear-compare': clearBtn
  };

  globalThis.location = { search: '', href: 'http://localhost:3000/compare/' };
  globalThis.history = { replaceState: () => {} };
  globalThis.window = {
    EXPERIMENTS: [
      { id: 'flex', name: 'Flame Extinction Experiment', acronym: 'FLEX', topic: 'Extinction', platform: 'ISS' },
      { id: 'cfi', name: 'Coflow Flame Extinction', acronym: 'CFI', topic: 'Extinction', platform: 'ISS' }
    ],
    addEventListener: () => {},
    location: globalThis.location,
    history: globalThis.history
  };
  globalThis.document = {
    querySelector: (sel) => elements[sel] || null,
    querySelectorAll: () => [],
    getElementById: (id) => elements['#' + id] || null
  };

  let storedSelection = [];
  globalThis.readSelection = () => storedSelection;
  globalThis.writeSelection = (arr) => { storedSelection = arr; };

  const runnable = code.replace(/import\s+[^;]+;/, 'const {readSelection,writeSelection} = globalThis;');

  assert.doesNotThrow(() => {
    // eslint-disable-next-line no-eval
    eval(runnable);
  });

  assert.ok(compContainer.innerHTML.includes('compare-empty-guide'), 'Empty guide should render when 0 items selected');
});
