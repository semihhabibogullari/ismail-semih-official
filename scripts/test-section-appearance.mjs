import assert from 'node:assert/strict';
import { buildSectionPresentation, cleanColor, safeFont } from '../src/utils/sectionAppearance.ts';

assert.equal(cleanColor('#ff5a1f'), '#ff5a1f');
assert.equal(cleanColor('red; background:url(x)'), undefined);
assert.equal(safeFont('Montserrat'), 'Montserrat');
assert.equal(safeFont('unexpected-font'), undefined);

const defaultSection = buildSectionPresentation();
assert.equal(defaultSection.className, 'studio-section');
assert.deepEqual(defaultSection.style, {});
assert.equal(defaultSection['data-style-heading'], undefined);

const custom = buildSectionPresentation({
  headingColor: '#ffffff',
  textColor: '#cccccc',
  backgroundColor: '#111111',
  accentColor: '#ff5a1f',
  cardColor: '#222222',
  borderColor: '#444444',
  buttonColor: '#123456',
  buttonTextColor: '#ffffff',
  shadowColor: '#AA3344',
  shadowOpacity: 45,
  shadowBlur: 40,
  headingFont: 'Montserrat',
  bodyFont: 'Roboto',
  headingSize: 48,
  cardTitleSize: 22,
  textSize: 17,
  radius: 20,
});
assert.equal(custom.style.backgroundColor, '#111111');
assert.equal(custom.style['--section-heading-color'], '#ffffff');
assert.equal(custom.style['--section-text-color'], '#cccccc');
assert.equal(custom.style['--accent'], '#ff5a1f');
assert.equal(custom.style['--section-card-color'], '#222222');
assert.equal(custom.style['--section-border-color'], '#444444');
assert.equal(custom.style['--section-button-color'], '#123456');
assert.equal(custom.style['--section-button-text-color'], '#ffffff');
assert.equal(custom.style['--section-heading-size'], '48px');
assert.equal(custom.style['--section-card-title-size'], '22px');
assert.equal(custom.style['--section-text-size'], '17px');
assert.equal(custom.style['--section-radius'], '20px');
assert.match(custom.style['--section-shadow'], /rgba\(170, 51, 68, 0\.45\)/);
assert.equal(custom['data-style-shadow'], 'true');

const limited = buildSectionPresentation({
  headingSize: 999,
  textSize: -5,
  shadowOpacity: 0,
  shadowBlur: 1000,
  shadowColor: 'not a color',
  backgroundColor: 'expression(1)',
  headingFont: 'x; url(bad)',
});
assert.equal(limited.style['--section-heading-size'], '64px');
assert.equal(limited.style['--section-text-size'], '11px');
assert.equal(limited.style['--section-shadow'], 'none');
assert.equal(limited.style.backgroundColor, undefined);
assert.equal(limited['data-style-heading-font'], undefined);

console.log('PASS: Per-section colors, text, shadows, button tokens and invalid inputs.');
