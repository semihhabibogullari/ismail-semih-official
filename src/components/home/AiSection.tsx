/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ArrowRight } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export const AiSection: React.FC = () => {
  const { data } = useSite();
  const articles = (data.articles || [])
    .filter((a) => a.published)
    .slice(0, 3); // show 3 on homepage

  if (articles.length === 0) return null;

  return (
    <section id="yapay-zeka" className="w-full py-12" aria-label="Yapay Zekâ ve Dijital Sanatlar">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-1">
              <Cpu className="w-4 h-4" />
              <span>TEKNOLOJİ & SAHNE ARAŞTIRMALARI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f4] tracking-tight">
              Yapay Zekâ &amp; Dijital Sanatlar
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Algoritmik tiyatro, metin üretimi, video mapping ve dijital sahne pratikleri üzerine denemeler.
            </p>
          </div>

          <Link
            to="/yapay-zeka"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff5a1f] hover:text-[#ff8c42] transition-colors"
          >
            <span>Tüm Makaleleri Oku</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/yapay-zeka/${article.id}`}
              className="group flex flex-col rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 overflow-hidden shadow-xl transition-all"
            >
              {/* Cover */}
              <div className="relative aspect-[16/10] w-full bg-[#151520] overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-transparent opacity-80" />
                <div className="absolute top-3 left-3 text-[11px] font-bold text-[#ff5a1f] bg-black/80 px-2 py-0.5 rounded border border-white/10">
                  {article.category}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Clean unboxed metadata with typographic separators */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-mono">
                    <span>{article.publishDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.readTime}</span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[#ff5a1f] transition-colors line-clamp-2 mb-2 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#ff5a1f]">
                  <span>Yazıyı İncele</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
