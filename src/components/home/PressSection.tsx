/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Newspaper, ExternalLink, Quote } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export const PressSection: React.FC = () => {
  const { data } = useSite();
  const pressItems = (data.press || [])
    .filter((p) => p.published)
    .sort((a, b) => a.order - b.order);

  if (pressItems.length === 0) return null;

  return (
    <section id="basin" className="w-full py-12" aria-label="Basında İsmail Semih">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-1">
            <Newspaper className="w-4 h-4" />
            <span>MEDYA VE ELEŞTİRİLER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f4] tracking-tight">
            Basında İsmail Semih
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Sahne performansları, podcast yayınları ve projeler hakkında yazılan değerlendirmeler.
          </p>
        </div>

        {/* Press Quotes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pressItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between p-6 rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 transition-all shadow-xl group"
            >
              <div>
                <Quote className="w-8 h-8 text-[#ff5a1f]/30 mb-3 group-hover:text-[#ff5a1f] transition-colors" />

                <blockquote className="text-sm sm:text-base font-medium text-gray-200 italic leading-relaxed mb-4">
                  "{item.quote}"
                </blockquote>

                <h4 className="text-xs font-semibold text-white line-clamp-2">
                  {item.title}
                </h4>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#ff8c42] block">
                    {item.outlet}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {item.publishDate}
                  </span>
                </div>

                {item.articleUrl && (
                  <a
                    href={item.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={`${item.outlet} haberini oku`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
