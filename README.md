# Freefall Explorer

Vite multi-page research interface. Run npm ci, npm run dev, npm test, and npm run build. Production output is dist/.

## Pages
- / — introduction, 3D hero, how it works, About
- /explore/ — search and filters, compact investigation cards
- /compare/ — evidence comparison for up to two selected investigations
- /simulator/ — existing heuristic mission simulator (demo estimate)
- /chat/ — curated research chat demo

The shared shell lives in src/shell.js. Each page has its own src/pages entry; the 3D hero is only imported by Home. app.js initializes Explore or Compare according to the available DOM. Data is bundled from data.js.

Selection order and chat messages/draft use sessionStorage and remain within the current browser tab session. Explore filter values are URL parameters; id selects an exact investigation. /chat/?investigation=NAME prefills a question without sending it. Legacy #explore, #compare and #si-intelligence hashes redirect to the new pages. #about remains on Home.

## Verification
Automated session tests cover order/limit, corrupt storage and chat reset. Browser acceptance: Home → Explore → select two → Compare → swap/remove/clear; filter refresh/back; simulator links; chat prefill/draft/reset; direct routes; mobile menu Escape; 390px layout and reduced motion. These routes require directory index support (included in the Vite build for Vercel).

No live LLM or new database is introduced by this restructuring. Existing research content and simulator formulas remain unchanged.
