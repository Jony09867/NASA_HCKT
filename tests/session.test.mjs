import test from 'node:test';
import assert from 'node:assert/strict';
const memory=new Map();globalThis.sessionStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};globalThis.window=new EventTarget();
const {readSelection,writeSelection,readSession,writeSession,CHAT_KEY}=await import('../src/session.js');
test('selection preserves order, deduplicates and caps at two',()=>{writeSelection(['flex','bass-ii','flex','same-r']);assert.deepEqual(readSelection(),['flex','bass-ii']);writeSelection(readSelection().reverse());assert.deepEqual(readSelection(),['bass-ii','flex']);});
test('bad session data falls back without crashing',()=>{memory.set('freefall:selection:v1','broken JSON');assert.deepEqual(readSelection(),[]);memory.set('freefall:selection:v1','{}');assert.deepEqual(readSelection(),[]);});
test('chat draft and messages survive page module reads, reset clears both',()=>{writeSession(CHAT_KEY,{draft:'FLEX?',messages:[{id:'1',role:'user',text:'Explain FLEX'}]});assert.equal(readSession(CHAT_KEY,{}).draft,'FLEX?');writeSession(CHAT_KEY,{draft:'',messages:[]});assert.deepEqual(readSession(CHAT_KEY,{}),{draft:'',messages:[]});});
