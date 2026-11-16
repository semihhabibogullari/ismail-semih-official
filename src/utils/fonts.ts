/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fonts selectable in the studio (Ayarlar → Yazı tipleri). Inter, Space Grotesk and JetBrains Mono are
// self-hosted and always declared in src/fonts.css; the others are loaded on demand, only when a page
// actually uses them, from files bundled with the site (no Google Fonts request).
const loaders: Record<string, () => Promise<unknown>> = {
  'Montserrat': () => import('../fonts/montserrat.css'),
  'Poppins': () => import('../fonts/poppins.css'),
  'Roboto': () => import('../fonts/roboto.css'),
  'Open Sans': () => import('../fonts/open-sans.css'),
  'Lato': () => import('../fonts/lato.css'),
  'Playfair Display': () => import('../fonts/playfair-display.css'),
  'Merriweather': () => import('../fonts/merriweather.css'),
  'Oswald': () => import('../fonts/oswald.css'),
  'DM Sans': () => import('../fonts/dm-sans.css'),
  'Source Sans 3': () => import('../fonts/source-sans-3.css'),
};
const requested = new Set<string>();

export function loadSelectableFont(family: string): void {
  if (requested.has(family)) return;
  const load = loaders[family];
  if (!load) return;
  requested.add(family);
  load().catch(() => requested.delete(family));
}
