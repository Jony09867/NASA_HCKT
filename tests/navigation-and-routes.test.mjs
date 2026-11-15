import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('src/shell.js defines all 7 routes in the required order', () => {
  const code = fs.readFileSync('src/shell.js', 'utf8');
  
  // Extract routes definition
  const match = code.match(/const routes\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match, 'routes array must be defined in src/shell.js');
  
  const routes = eval(match[1]);
  assert.equal(routes.length, 7, 'Must have exactly 7 routes');

  const expectedSequence = [
    ['home', '/', 'Home'],
    ['explore', '/explore/', 'Explore'],
    ['compare', '/compare/', 'Compare'],
    ['simulator', '/simulator/', 'Simulator'],
    ['chat', '/chat/', 'SI Chat'],
    ['resources', '/resources/', 'Resources'],
    ['about', '/about/', 'About']
  ];

  assert.deepEqual(routes, expectedSequence, 'Routes must strictly follow: Home | Explore | Compare | Simulator | SI Chat | Resources | About');
  assert.equal(routes[5][0], 'resources', 'Resources must be immediately to the left of About');
  assert.equal(routes[6][0], 'about', 'About must be the rightmost navigation item');
});

test('vite.config.js includes resources and about in rollup inputs', () => {
  const code = fs.readFileSync('vite.config.js', 'utf8');
  assert.ok(code.includes("resources:resolve('resources/index.html')") || code.includes("resources: resolve('resources/index.html')"), 'vite.config.js must include resources entry point');
  assert.ok(code.includes("about:resolve('about/index.html')") || code.includes("about: resolve('about/index.html')"), 'vite.config.js must include about entry point');
});

test('resources and about HTML files exist and have valid structure', () => {
  assert.ok(fs.existsSync('resources/index.html'), 'resources/index.html must exist');
  assert.ok(fs.existsSync('about/index.html'), 'about/index.html must exist');

  const resHtml = fs.readFileSync('resources/index.html', 'utf8');
  assert.ok(resHtml.includes('data-page="resources"'), 'resources/index.html must have data-page="resources"');
  assert.ok(resHtml.includes('PSI-10') && resHtml.includes('PSI-159'), 'resources/index.html must contain PSI records');

  const aboutHtml = fs.readFileSync('about/index.html', 'utf8');
  assert.ok(aboutHtml.includes('data-page="about"'), 'about/index.html must have data-page="about"');
  assert.ok(aboutHtml.includes('about-hero'), 'about/index.html must contain about-hero');
});
