/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, ArrowRight, Play, ExternalLink } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export const PodcastSection: React.FC = () => {
  const { data } = useSite();
  const podcasts = (data.podcasts || [])
    .filter((p) => p.published)
    .sort((a, b) => b.episodeNumber - a.episodeNumber)
    .slice(0, 3); // show latest 3 on homepage

  if (podcasts.length === 0) return null;

  return (
    <section id="podcast" className="w-full py-12" aria-label="Ben Bir İsmail Podcast">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-1">
              <Mic className="w-4 h-4" />
              <span>KÜLTÜR, SANAT & SAHNE SÖYLEŞİLERİ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f4] tracking-tight">
              Ben Bir İsmail Podcast
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Tiyatronun kulisi, bağımsız sanat üretimi ve yaratıcılık üzerine her hafta yeni bir konuk.
            </p>
          </div>

          <Link
            to="/podcast"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff5a1f] hover:text-[#ff8c42] transition-colors"
          >
            <span>Tüm Bölümleri Keşfet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Podcast Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {podcasts.map((ep) => (
            <div
              key={ep.id}
              className="group flex flex-col rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 overflow-hidden shadow-xl transition-all"
            >
              {/* Cover Art */}
              <div className="relative aspect-square w-full bg-[#151520] overflow-hidden">
                <img
                  src={ep.imageUrl}
                  alt={ep.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-transparent opacity-80" />

                {/* Episode Tag */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-[#ff5a1f] border border-white/10">
                  BÖLÜM #{ep.episodeNumber}
                </div>

                <div className="absolute bottom-3 left-3 text-xs text-gray-300 font-medium flex items-center gap-2">
                  <span>{ep.duration}</span>
                  <span>·</span>
                  <span>{ep.publishDate}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#ff5a1f] transition-colors line-clamp-2 mb-1.5">
                    {ep.title}
                  </h3>

                  {ep.guest && (
                    <div className="text-xs text-[#ff8c42] font-medium line-clamp-1 mb-2">
                      Konuk: {ep.guest}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {ep.description}
                  </p>
                </div>

                {/* Streaming Platform Links */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ep.spotifyUrl && (
                      <a
                        href={ep.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#1db954]/20 text-gray-300 hover:text-[#1db954] transition-colors"
                        title="Spotify'da Dinle"
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
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#ff0000]/20 text-gray-300 hover:text-[#ff0000] transition-colors"
                        title="YouTube'da İzle"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </a>
                    )}
                  </div>

                  <Link
                    to={`/podcast/${ep.id}`}
                    className="text-xs text-[#ff5a1f] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Detay &amp; Notlar</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
