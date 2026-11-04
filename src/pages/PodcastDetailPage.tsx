/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Mic, Play, ExternalLink, Share2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const PodcastDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data } = useSite();

  const episode = (data.podcasts || []).find((p) => p.id === id);

  if (!episode) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Podcast Bölümü Bulunamadı</h1>
        <p className="text-gray-400 mb-6">Aradığınız bölüm mevcut değil veya yayından kaldırılmış olabilir.</p>
        <Link to="/podcast" className="px-5 py-2.5 rounded-xl bg-[#ff5a1f] text-white text-sm font-semibold">
          Podcast Listesine Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full py-12">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        {/* Back navigation */}
        <Link
          to="/podcast"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#ff5a1f] mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Tüm Podcast Bölümlerine Dön</span>
        </Link>

        {/* Episode Card Header */}
        <div className="rounded-2xl bg-[#121218] border border-white/10 p-6 sm:p-8 mb-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full sm:w-56 aspect-square rounded-xl overflow-hidden bg-[#151520] shrink-0 border border-white/10">
              <img
                src={episode.imageUrl}
                alt={episode.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="inline-block bg-[#ff5a1f]/15 border border-[#ff5a1f]/30 px-2.5 py-1 rounded text-xs font-bold text-[#ff8c42] mb-3">
                BÖLÜM #{episode.episodeNumber}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                {episode.title}
              </h1>

              {episode.guest && (
                <div className="text-sm font-semibold text-[#ff5a1f] mb-4">
                  Konuk: {episode.guest}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-400 font-mono mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#ff5a1f]" />
                  {episode.publishDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#ff5a1f]" />
                  {episode.duration}
                </span>
              </div>

              {/* Streaming CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                {episode.spotifyUrl && (
                  <a
                    href={episode.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold text-xs transition-colors"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    <span>Spotify’da Dinle</span>
                  </a>
                )}
                {episode.youtubeUrl && (
                  <a
                    href={episode.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff0000] hover:bg-[#ff2020] text-white font-semibold text-xs transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>YouTube’da İzle</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show Notes Content */}
        <div className="bg-[#121218] border border-white/10 rounded-2xl p-6 sm:p-10 text-gray-300 leading-relaxed space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-3">
            Bölüm Notları ve Detaylar
          </h2>
          <p className="text-base whitespace-pre-line text-gray-300">
            {episode.description}
          </p>

          <div className="pt-6 border-t border-white/10 text-xs text-gray-400">
            <p>
              Ben Bir İsmail Podcast, tiyatro sanatçısı ve yönetmen İsmail Semih Habiboğulları tarafından
              hazırlanmaktadır. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
