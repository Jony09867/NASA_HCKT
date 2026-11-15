const SELECTION_KEY = 'freefall:selection:v1';
export function readSession(key, fallback) { try { const raw=sessionStorage.getItem(key); return raw===null?fallback:JSON.parse(raw); } catch { return fallback; } }
export function writeSession(key,value) { try { sessionStorage.setItem(key,JSON.stringify(value)); } catch {} }
export function readSelection() { const ids=readSession(SELECTION_KEY,[]); return Array.isArray(ids)?[...new Set(ids.filter(x=>typeof x==='string'))].slice(0,2):[]; }
export function writeSelection(ids) { const clean=[...new Set(ids)].slice(0,2);writeSession(SELECTION_KEY,clean);window.dispatchEvent(new CustomEvent('freefall:selection',{detail:clean}));return clean; }
export const CHAT_KEY='freefall:chat:v1';
