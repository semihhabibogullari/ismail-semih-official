/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DetailModal, DetailModalItem } from '../common/DetailModal';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export const HeroSlider: React.FC = () => {
  const { data, t } = useSite();
  const slides = (data.heroSlides || []).filter((s) => s.active).sort((a, b) => a.order - b.order);
  const sliderSettings = data.settings?.sliderSettings || {
    transitionType: 'kenburns-crossfade',
    autoplayDuration: 5000,
    transitionDuration: 800,
    pauseOnHover: true,
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDetail, setSelectedDetail] = useState<DetailModalItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const slideCount = slides.length;

  const nextSlide = useCallback(() => {
    if (slideCount === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    if (slideCount === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  // Autoplay interval
  useEffect(() => {
    if ((isPaused && sliderSettings.pauseOnHover) || slideCount <= 1) return;
    const interval = setInterval(nextSlide, sliderSettings.autoplayDuration || 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, slideCount, sliderSettings.autoplayDuration, sliderSettings.pauseOnHover]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const openSlideDetails = (slide: typeof slides[number]) => {
    setSelectedDetail({
      title: t(slide.title, slide.title_en),
      category: t(slide.category, slide.category_en),
      description: t(slide.detailDescription || slide.subtitle, slide.detailDescription_en || slide.subtitle_en),
      imageUrl: slide.imageUrl,
      videoUrl: slide.detailVideoUrl,
      actions: slide.detailActions || [],
    });
  };

  if (slideCount === 0) return null;

  const transitionType = sliderSettings.transitionType || 'kenburns-crossfade';

  return (
    <section className="relative w-full pt-4 pb-8" aria-label="Öne Çıkan Slider">
      {/* Container: Centered, strictly max 1200px width */}
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: Math.max(600, Math.min(1920, data.sections?.find(x => x.type === 'hero')?.maxWidth || 1200)) }}>
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#121218] shadow-2xl group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Strict 1200x400 (3:1) Aspect Ratio on Desktop */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1] min-h-[340px] sm:min-h-[380px] lg:min-h-[400px]">
            {slides.map((slide, index) => {
              const isActive = index === currentIndex;

              // Compute image animation class based on transitionType
              let imageAnimationClass = 'w-full h-full object-cover object-center transition-transform duration-700';
              if (isActive) {
                if (transitionType === 'kenburns-crossfade') {
                  imageAnimationClass += ' animate-kenburns';
                } else if (transitionType === 'fade-zoom') {
                  imageAnimationClass += ' scale-105 transition-transform duration-1000';
                }
              }

              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {/* Slide Background Image */}
                  <img
                    src={slide.imageUrl}
                    alt={t(slide.title, slide.title_en)}
                    className={imageAnimationClass}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />

                  {/* Gradient Scrim for WCAG readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/60 to-transparent lg:bg-gradient-to-r lg:from-[#0b0b0f]/90 lg:via-[#0b0b0f]/60 lg:to-transparent" />

                  {/* Entire slide background opens its detail, not just the CTA. */}
                  <button type="button" onClick={() => openSlideDetails(slide)}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={`${t(slide.title, slide.title_en)} — ${t('Detayları Gör', 'View Details')}`}
                    className="absolute inset-0 z-[1] cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#ff5a1f]" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 z-[2] pointer-events-none flex flex-col justify-end lg:justify-center p-6 sm:p-10 lg:p-12 max-w-2xl">
                    {/* Category & Badge */}
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wider text-[#ff5a1f]">
                      {slide.badge && (
                        <span className="bg-[#ff5a1f] text-black px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest">
                          {t(slide.badge, slide.badge_en)}
                        </span>
                      )}
                      <span>{t(slide.category, slide.category_en)}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#f1f1f4] tracking-tight mb-2 sm:mb-3 leading-tight line-clamp-2">
                      {t(slide.title, slide.title_en)}
                    </h2>

                    {/* Subtitle / Description */}
                    <p className="text-gray-300 text-xs sm:text-sm lg:text-base line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-6 leading-relaxed max-w-xl">
                      {t(slide.subtitle, slide.subtitle_en)}
                    </p>

                    {/* CTA Button */}
                    {(slide.buttonText || slide.title) && (
                      <div>
                        <button type="button" onClick={() => openSlideDetails(slide)}
                          className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs sm:text-sm font-semibold transition-all transform hover:translate-x-0.5 shadow-lg shadow-[#ff5a1f]/20 focus:outline-none focus:ring-2 focus:ring-[#ff5a1f] cursor-pointer"
                        >
                          <span>{t('Detayları Gör', 'View Details')}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Navigation Arrows */}
            {slideCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#ff5a1f] text-white border border-white/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none cursor-pointer"
                  aria-label="Önceki Slayt"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#ff5a1f] text-white border border-white/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none cursor-pointer"
                  aria-label="Sonraki Slayt"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Slide Indicators */}
            {slideCount > 1 && (
              <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      idx === currentIndex
                        ? 'w-7 h-2 bg-[#ff5a1f]'
                        : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slayt ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <DetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </section>
  );
};
