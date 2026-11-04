/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Search, Play, ArrowRight, ExternalLink } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const PodcastPage: React.FC = () => {
  const { data } = useSite();
  const [search, setSearch] = useState('');

  const podcasts = (data.podcasts || [])
    .filter((p) => p.published)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.guest && p.guest.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.episodeNumber - a.episodeNumber);

  return (
    <div className="w-full py-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Hero */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-2">
            <Mic className="w-4 h-4" />
            <span>KÜLTÜR, SANAT & SAHNE SÖYLEŞİLERİ</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Ben Bir İsmail Podcast
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            İsmail Semih Habiboğulları’nın hazırlayıp sunduğu; tiyatro, bağımsız sanat üretimi,
            oyunculuk sırları ve çağdaş kültür tartışmalarını samimi bir sohbet masasında buluşturan podcast serisi.
          </p>

          {/* Search bar */}
          <div className="mt-8 relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Bölüm veya konuk ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151520] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]"
            />
          </div>
        </div>

        {/* Podcast List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((ep) => (
            <div
              key={ep.id}
              className="flex flex-col rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 overflow-hidden shadow-xl transition-all group"
            >
              <div className="relative aspect-video w-full bg-[#151520] overflow-hidden">
                <img
                  src={ep.imageUrl}
                  alt={ep.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-bold text-[#ff5a1f] border border-white/10">
                  BÖLÜM #{ep.episodeNumber}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-xs text-gray-300">
                  {ep.duration}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-gray-400 font-mono mb-1">{ep.publishDate}</div>
                  <h2 className="text-lg font-bold text-white group-hover:text-[#ff5a1f] transition-colors mb-2 line-clamp-2">
                    {ep.title}
                  </h2>
                  {ep.guest && (
                    <div className="text-xs text-[#ff8c42] font-medium mb-3">
                      Konuk: {ep.guest}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {ep.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ep.spotifyUrl && (
                      <a
                        href={ep.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-[#151520] hover:bg-[#1db954]/20 text-gray-400 hover:text-[#1db954] transition-colors"
                        title="Spotify"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                      </a>
                    )}
                    {ep.youtubeUrl && (
                      <a
                        href={ep.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-[#151520] hover:bg-[#ff0000]/20 text-gray-400 hover:text-[#ff0000] transition-colors"
                        title="YouTube"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </a>
                    )}
                  </div>

                  <Link
                    to={`/podcast/${ep.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff5a1f] hover:text-[#ff8c42]"
                  >
                    <span>Bölüm Detayı</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
