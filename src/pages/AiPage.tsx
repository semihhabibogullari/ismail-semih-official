/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Search, ArrowRight, Tag } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const AiPage: React.FC = () => {
  const { data } = useSite();
  const [selectedTag, setSelectedTag] = useState<string>('Hepsi');
  const [search, setSearch] = useState('');

  const allArticles = (data.articles || []).filter((a) => a.published);

  // Extract tags
  const tags = [
    'Hepsi',
    ...Array.from(new Set(allArticles.flatMap((a) => a.tags || []))),
  ];

  const filteredArticles = allArticles.filter((art) => {
    const matchTag = selectedTag === 'Hepsi' || (art.tags && art.tags.includes(selectedTag));
    const matchSearch =
      !search ||
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      art.category.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div className="w-full py-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Hero */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-2">
            <Cpu className="w-4 h-4" />
            <span>DİJİTAL SAHNE & YAPAY ZEKÂ ARAŞTIRMALARI</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Yapay Zekâ ve Dijital Sanatlar
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Algoritmik dramaturgi, üretken yapay zekâ, video mapping, dijital scenography ve
            teknolojinin sahne sanatlarına kattığı estetik dönüşüm üzerine makaleler, denemeler ve saha notları.
          </p>

          {/* Search bar & Tag filters */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Makale veya kavram ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151520] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-[#ff5a1f] text-white shadow-sm'
                      : 'bg-[#151520] text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <Link
              key={art.id}
              to={`/yapay-zeka/${art.id}`}
              className="flex flex-col rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 overflow-hidden shadow-xl transition-all group"
            >
              <div className="relative aspect-[16/10] w-full bg-[#151520] overflow-hidden">
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-bold text-[#ff5a1f] border border-white/10">
                  {art.category}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mb-2">
                    <span>{art.publishDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>{art.readTime}</span>
                  </div>

                  <h2 className="text-lg font-bold text-white group-hover:text-[#ff5a1f] transition-colors mb-2 line-clamp-2">
                    {art.title}
                  </h2>

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-4">
                    {art.excerpt}
                  </p>

                  {/* Tags */}
                  {art.tags && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {art.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#ff5a1f]">
                  <span>Yazının Tamamını Oku</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
