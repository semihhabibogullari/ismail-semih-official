import type { CSSProperties } from 'react';
import type { SectionAppearance } from '../types';

type SectionStyles = CSSProperties & Record<`--section-${string}`, string> & { '--accent'?: string };
export type SectionPresentationProps = {
  className: string;
  style: SectionStyles;
  'data-style-heading'?: 'true';
  'data-style-text'?: 'true';
  'data-style-heading-font'?: 'true';
  'data-style-body-font'?: 'true';
  'data-style-heading-size'?: 'true';
  'data-style-card-title-size'?: 'true';
  'data-style-text-size'?: 'true';
  'data-style-card'?: 'true';
  'data-style-border'?: 'true';
  'data-style-button'?: 'true';
  'data-style-shadow'?: 'true';
  'data-style-radius'?: 'true';
};

const ALLOWED_FONTS = [
  'Inter', 'Space Grotesk', 'Montserrat', 'Poppins', 'Roboto',
  'Open Sans', 'Lato', 'Playfair Display', 'Merriweather', 'Oswald',
  'DM Sans', 'Source Sans 3', 'Georgia', 'Arial',
] as const;

export function cleanColor(value?: string): string | undefined {
  const color = value?.trim();
  return color && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : undefined;
}

export function safeFont(value?: string): string | undefined {
  return ALLOWED_FONTS.find(font => font === value);
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}

function hexToRgb(hex: string): string {
  const clean = hex.slice(1);
  const six = clean.length === 3 ? clean.split('').map(x => x + x).join('') : clean;
  return [
    Number.parseInt(six.slice(0, 2), 16),
    Number.parseInt(six.slice(2, 4), 16),
    Number.parseInt(six.slice(4, 6), 16),
  ].join(', ');
}

/**
 * Only validated design tokens reach inline styles. Existing blocks without
 * custom appearance remain visually identical to the original theme.
 */
export function buildSectionPresentation(appearance?: SectionAppearance): SectionPresentationProps {
  const style = {} as SectionStyles;
  const result: SectionPresentationProps = { className: 'studio-section', style };
  if (!appearance) return result;

  const heading = cleanColor(appearance.headingColor);
  const text = cleanColor(appearance.textColor);
  const background = cleanColor(appearance.backgroundColor);
  const accent = cleanColor(appearance.accentColor);
  const card = cleanColor(appearance.cardColor);
  const border = cleanColor(appearance.borderColor);
  const button = cleanColor(appearance.buttonColor);
  const buttonText = cleanColor(appearance.buttonTextColor);
  const headingFont = safeFont(appearance.headingFont);
  const bodyFont = safeFont(appearance.bodyFont);
  if (heading) { style['--section-heading-color'] = heading; result['data-style-heading'] = 'true'; }
  if (text) { style['--section-text-color'] = text; result['data-style-text'] = 'true'; }
  if (background) style.backgroundColor = background;
  if (accent) { style['--accent'] = accent; style['--section-accent'] = accent; }
  if (card) { style['--section-card-color'] = card; result['data-style-card'] = 'true'; }
  if (border) { style['--section-border-color'] = border; result['data-style-border'] = 'true'; }
  if (button || buttonText) {
    style['--section-button-color'] = button || accent || 'var(--accent)';
    style['--section-button-text-color'] = buttonText || '#ffffff';
    result['data-style-button'] = 'true';
  }
  if (headingFont) {
    style['--section-heading-font'] = `"${headingFont}", serif`;
    result['data-style-heading-font'] = 'true';
  }
  if (bodyFont) {
    style['--section-body-font'] = `"${bodyFont}", sans-serif`;
    result['data-style-body-font'] = 'true';
  }
  if (typeof appearance.headingSize === 'number') {
    style['--section-heading-size'] = `${clamp(appearance.headingSize, 18, 64, 32)}px`;
    result['data-style-heading-size'] = 'true';
  }
  if (typeof appearance.cardTitleSize === 'number') {
    style['--section-card-title-size'] = `${clamp(appearance.cardTitleSize, 14, 40, 20)}px`;
    result['data-style-card-title-size'] = 'true';
  }
  if (typeof appearance.textSize === 'number') {
    style['--section-text-size'] = `${clamp(appearance.textSize, 11, 24, 16)}px`;
    result['data-style-text-size'] = 'true';
  }
  if (typeof appearance.radius === 'number') {
    style['--section-radius'] = `${clamp(appearance.radius, 0, 36, 16)}px`;
    result['data-style-radius'] = 'true';
  }
  if (appearance.shadowColor || typeof appearance.shadowOpacity === 'number' ||
      typeof appearance.shadowBlur === 'number') {
    const color = cleanColor(appearance.shadowColor) || '#000000';
    const opacity = clamp(appearance.shadowOpacity, 0, 100, 25) / 100;
    const blur = clamp(appearance.shadowBlur, 0, 80, 28);
    style['--section-shadow'] = opacity === 0 ? 'none' :
      `0 12px ${blur}px rgba(${hexToRgb(color)}, ${opacity})`;
    result['data-style-shadow'] = 'true';
  }

  return result;
}
