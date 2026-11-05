/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSite } from '../context/SiteContext';
import { HeroSlider } from '../components/home/HeroSlider';
import { EventCalendar } from '../components/home/EventCalendar';
import { HighlightsSection } from '../components/home/HighlightsSection';
import { InstagramSection } from '../components/home/InstagramSection';
import { PodcastSection } from '../components/home/PodcastSection';
import { AiSection } from '../components/home/AiSection';
import { TrainingsSection } from '../components/home/TrainingsSection';
import { PressSection } from '../components/home/PressSection';
import { NewsletterSection } from '../components/home/NewsletterSection';

export const HomePage: React.FC = () => {
  const { data } = useSite();

  // Ordered sections from CMS settings
  const sortedSections = (data.sections || [])
    .filter((sec) => sec.visible)
    .sort((a, b) => a.order - b.order);

  // Map section types to their components
  const renderSection = (type: string, id: string) => {
    switch (type) {
      case 'hero':
        return <HeroSlider key={id} />;
      case 'calendar':
        return <EventCalendar key={id} />;
      case 'highlights':
        return <HighlightsSection key={id} />;
      case 'instagram':
        return <InstagramSection key={id} />;
      case 'podcast':
        return <PodcastSection key={id} />;
      case 'ai':
        return <AiSection key={id} />;
      case 'trainings':
        return <TrainingsSection key={id} />;
      case 'press':
        return <PressSection key={id} />;
      case 'newsletter':
        return <NewsletterSection key={id} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {sortedSections.map((sec) => (
        <div key={sec.id} style={{
          maxWidth: sec.maxWidth ? `${Math.max(600,Math.min(1920,sec.maxWidth))}px` : undefined,
          minHeight: sec.minHeight ? `${Math.max(0,Math.min(1200,sec.minHeight))}px` : undefined,
          paddingTop: sec.paddingY !== undefined ? `${Math.max(0,Math.min(160,sec.paddingY))}px` : undefined,
          paddingBottom: sec.paddingY !== undefined ? `${Math.max(0,Math.min(160,sec.paddingY))}px` : undefined,
          marginInline: sec.maxWidth ? 'auto' : undefined,
        }}>
          {renderSection(sec.type, sec.id)}
        </div>
      ))}
    </div>
  );
};
