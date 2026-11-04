/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Tag, Share2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data } = useSite();

  const article = (data.articles || []).find((a) => a.id === id || a.slug === id);

  if (!article) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Makale Bulunamadı</h1>
        <p className="text-gray-400 mb-6">Aradığınız makale mevcut değil veya yayından kaldırılmış olabilir.</p>
        <Link to="/yapay-zeka" className="px-5 py-2.5 rounded-xl bg-[#ff5a1f] text-white text-sm font-semibold">
          Tüm Yazılara Dön
        </Link>
      </div>
    );
  }

  return (
    <article className="w-full py-12">
      <div className="max-w-[860px] mx-auto px-4 sm:px-6">
        {/* Back navigation */}
        <Link
          to="/yapay-zeka"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#ff5a1f] mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Yapay Zekâ & Dijital Sanatlar Arşivine Dön</span>
        </Link>

        {/* Category & Date */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 font-mono">
          <span className="font-bold text-[#ff5a1f] bg-[#ff5a1f]/10 px-2 py-0.5 rounded">
            {article.category}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {article.publishDate}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {article.readTime}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">
          {article.title}
        </h1>

        {/* Excerpt Lead */}
        <p className="text-lg text-gray-300 font-medium leading-relaxed mb-8 border-l-2 border-[#ff5a1f] pl-4 italic">
          {article.excerpt}
        </p>

        {/* Cover Image */}
        <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden mb-10 border border-white/10 bg-[#151520] shadow-2xl">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-6 text-base sm:text-lg">
          {article.content.split('\n\n').map((block, idx) => {
            if (block.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-2xl font-bold text-white pt-6 border-t border-white/5">
                  {block.replace('## ', '')}
                </h2>
              );
            }
            if (block.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-xl font-bold text-[#ff8c42] pt-4">
                  {block.replace('### ', '')}
                </h3>
              );
            }
            return (
              <p key={idx} className="text-gray-300 leading-relaxed">
                {block}
              </p>
            );
          })}
        </div>

        {/* Tags & Author bio */}
        <div className="mt-12 pt-8 border-t border-white/10">
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-xs text-gray-400 mr-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Etiketler:
              </span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-300 bg-[#151520] border border-white/10 px-3 py-1 rounded-lg"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author Card */}
          <div className="p-6 rounded-2xl bg-[#121218] border border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#151520] border border-[#ff5a1f] overflow-hidden shrink-0">
              <img
                src="/images/artist_portrait.svg"
                alt="İsmail Semih Habiboğulları"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">İsmail Semih Habiboğulları</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Tiyatro Sanatçısı, Yönetmen, Eğitmen ve Podcast Yayıncısı
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
