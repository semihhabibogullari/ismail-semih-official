/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { Play, Sparkles, ArrowRight, Eye, Film } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { HighlightItem } from '../../types';
import { DetailModal, DetailModalItem } from '../common/DetailModal';

export const HighlightsSection: React.FC = () => {
  const { data, t } = useSite();
  const allHighlights = (data.highlights || [])
    .filter((h) => h.published)
    .sort((a, b) => a.order - b.order);

  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi');
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailModalItem | null>(null);
  const showDetails = (item: HighlightItem) => {
    setSelectedDetail({
      title: t(item.title, item.title_en),
      category: t(item.category, item.category_en),
      description: t(item.detailDescription || item.description, item.detailDescription_en || item.description_en),
      imageUrl: item.imageUrl,
      videoUrl: item.detailVideoUrl || item.videoUrl,
      embedUrl: item.detailVideoUrl ? undefined : item.embedUrl,
      actions: item.detailActions || [],
    });
  };

  // Extract unique categories
  const categories = ['Hepsi', ...Array.from(new Set(allHighlights.map((h) => h.category.split('/')[0].trim())))];

  // Filtered items
  const filteredHighlights = allHighlights.filter((h) => {
    if (selectedCategory === 'Hepsi') return true;
    return h.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  // Current active highlight for left spotlight panel
  const activeHighlight =
    filteredHighlights.find((h) => h.id === activeHighlightId) ||
    filteredHighlights[0] ||
    allHighlights[0];


  if (allHighlights.length === 0) return null;

  return (
    <section id="one-cikanlar" className="w-full py-12" aria-label="Öne Çıkanlar">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>SEÇİLMİŞ ÇALIŞMALAR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f4] tracking-tight">
              Öne Çıkanlar
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Tiyatro temsilleri, video fragmanları ve sanat projelerinden oluşan özel seçki.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveHighlightId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#ff5a1f] text-white shadow-sm'
                    : 'bg-[#151520] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* DasDas Style 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Big Spotlight Poster / Video Frame (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative w-full h-[380px] sm:h-[450px] lg:h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-[#121218] shadow-2xl group flex flex-col justify-end">
              {activeHighlight ? (
                <>
                  {/* Poster / Video Thumbnail Image */}
                  <img
                    src={activeHighlight.imageUrl}
                    alt={activeHighlight.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Cinematic gradient scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/50 to-transparent" />
                  <button type="button" onClick={() => showDetails(activeHighlight)}
                    className="absolute inset-0 z-[5] cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#ff5a1f]"
                    aria-label={`${t(activeHighlight.title, activeHighlight.title_en)} — ${t('Detayları Gör', 'View Details')}`} />

                  {/* Play button overlay if item has video */}
                  {activeHighlight.mediaType === 'video' && activeHighlight.videoUrl && (
                    <button
                      onClick={() => showDetails(activeHighlight)}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#ff5a1f]/90 hover:bg-[#ff5a1f] text-white flex items-center justify-center shadow-2xl shadow-[#ff5a1f]/50 transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#ff5a1f]/40 z-20"
                      aria-label="Videoyu İzle"
                    >
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </button>
                  )}

                  {/* Overlay text at bottom */}
                  <div className="relative z-10 p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#ff5a1f]">
                      <span className="w-2 h-2 rounded-full bg-[#ff5a1f]" />
                      <span>{t(activeHighlight.category, activeHighlight.category_en)}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                      {t(activeHighlight.title, activeHighlight.title_en)}
                    </h3>

                    <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 max-w-xl mb-4 leading-relaxed">
                      {t(activeHighlight.description, activeHighlight.description_en)}
                    </p>

                    <div className="flex items-center gap-3">
                      {(activeHighlight.videoUrl || activeHighlight.embedUrl) ? (
                        <button
                          onClick={() => showDetails(activeHighlight)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
                        >
                          <Film className="w-4 h-4" />
                          <span>{t('Fragmanı / Önizlemeyi İzle', 'Watch Trailer / Preview')}</span>
                        </button>
                      ) : null}

                      {(
                        <button type="button" onClick={() => showDetails(activeHighlight)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                        >
                          <span>{t(activeHighlight.linkText || 'Detayları İncele', activeHighlight.linkText_en || 'View Details')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  İçerik seçilmedi
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive List of Highlights (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
            {filteredHighlights.map((item, index) => {
              const isSelected = activeHighlight?.id === item.id;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveHighlightId(item.id)}
                  onClick={() => {
                    setActiveHighlightId(item.id);
                    showDetails(item);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#151520] border-[#ff5a1f]/80 shadow-lg'
                      : 'bg-[#121218] hover:bg-[#151520] border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Active orange left highlight indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff5a1f]" />
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 mb-1">
                        <span className="text-[#ff5a1f] font-mono">0{index + 1}.</span>
                        <span>{t(item.category, item.category_en)}</span>
                      </div>

                      <h4
                        className={`text-sm sm:text-base font-bold transition-colors line-clamp-1 ${
                          isSelected ? 'text-[#ff5a1f]' : 'text-gray-200 group-hover:text-white'
                        }`}
                      >
                        {t(item.title, item.title_en)}
                      </h4>

                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {t(item.description, item.description_en)}
                      </p>
                    </div>

                    <div className="shrink-0 pt-1">
                      {item.mediaType === 'video' ? (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#ff5a1f] text-white'
                              : 'bg-white/5 text-gray-400 group-hover:text-white'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#ff5a1f] text-white'
                              : 'bg-white/5 text-gray-400 group-hover:text-white'
                          }`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </section>
  );
};
