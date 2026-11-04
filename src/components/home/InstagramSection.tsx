/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Instagram,
  Heart,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Layers,
  X,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { InstagramPost } from '../../types';

export const InstagramSection: React.FC = () => {
  const { data, t } = useSite();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  const posts = (data.instagramPosts || [])
    .filter((p) => p.published)
    .sort((a, b) => a.order - b.order);

  const settings = data.settings?.instagramSettings || {
    username: 'ismailsemihhabibogullari',
    showLikes: true,
  };

  const username = settings.username || 'ismailsemihhabibogullari';
  const profileUrl = `https://instagram.com/${username}`;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (posts.length === 0) return null;

  return (
    <section
      id="instagram"
      className="w-full py-14 bg-[#0e0e14] border-t border-b border-white/5"
      aria-label="Instagram Akışı"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-1">
              <Instagram className="w-4 h-4 text-[#e1306c]" />
              <span>{t("INSTAGRAM'DA İSMAİL SEMİH", 'ISMAIL SEMIH ON INSTAGRAM')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f4] tracking-tight">
              {t('Sahne Arkası & Güncel Paylaşımlar', 'Backstage & Recent Posts')}
            </h2>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
              <span>@{username}</span>
              <span>·</span>
              <span>{t('Prova süreçleri, turne anları ve özel içerikler', 'Rehearsal logs, tour moments, and behind-the-scenes')}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#e1306c]/20 via-[#fd1d1d]/20 to-[#f56040]/20 hover:from-[#e1306c]/30 hover:to-[#f56040]/30 border border-[#e1306c]/40 text-[#f1f1f4] text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm"
            >
              <Instagram className="w-3.5 h-3.5 text-[#e1306c]" />
              <span>{t("Instagram'da Takip Et", 'Follow on Instagram')}</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>

            {/* Carousel navigation buttons */}
            <div className="hidden sm:flex items-center gap-1 bg-[#151520] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Önceki paylaşımlar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Sonraki paylaşımlar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Touch / Scroll Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-thin focus:outline-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {posts.map((post) => {
            const isVideo = post.mediaType === 'VIDEO';
            const isCarousel = post.mediaType === 'CAROUSEL_ALBUM';

            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group relative flex-none w-[260px] sm:w-[280px] lg:w-[230px] aspect-[4/5] rounded-2xl overflow-hidden bg-[#151520] border border-white/10 hover:border-[#ff5a1f]/60 transition-all duration-300 snap-start cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Media Image */}
                <img
                  src={post.mediaUrl}
                  alt={post.caption || 'Instagram Post'}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Media Type Icon Badge (Top Right) */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow">
                    {isVideo ? (
                      <Play className="w-3.5 h-3.5 fill-white" />
                    ) : isCarousel ? (
                      <Layers className="w-3.5 h-3.5" />
                    ) : (
                      <Instagram className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                {/* Default bottom caption preview strip */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:opacity-0 transition-opacity duration-200">
                  <p className="text-[11px] text-gray-200 line-clamp-1">
                    {t(post.caption, post.caption_en)}
                  </p>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                    {post.timestamp}
                  </span>
                </div>

                {/* Hover Details Overlay */}
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-white/80">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Instagram className="w-3.5 h-3.5 text-[#e1306c]" />
                      <span className="text-[11px]">@{username}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{post.timestamp}</span>
                  </div>

                  <p className="text-xs text-[#f1f1f4] line-clamp-4 leading-relaxed">
                    {t(post.caption, post.caption_en)}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-3 text-white">
                      {settings.showLikes && (
                        <div className="flex items-center gap-1 text-red-400">
                          <Heart className="w-3.5 h-3.5 fill-red-400" />
                          <span className="text-[11px] font-semibold">
                            {post.likesCount ? post.likesCount.toLocaleString() : '1.2k'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-300">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-[11px]">
                          {post.commentsCount ? post.commentsCount : '48'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-[#ff5a1f] flex items-center gap-0.5">
                      {t('Görüntüle', 'View')}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative bg-[#151520] border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col sm:flex-row">
            {/* Media side */}
            <div className="sm:w-1/2 aspect-square bg-black relative">
              <img
                src={selectedPost.mediaUrl}
                alt={selectedPost.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-white border border-white/10">
                  {selectedPost.mediaType === 'VIDEO' ? 'Reels' : 'Instagram Post'}
                </span>
              </div>
            </div>

            {/* Content side */}
            <div className="sm:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-[#151520] flex items-center justify-center text-[10px] font-bold text-white">
                        İSH
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">@{username}</h4>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {selectedPost.timestamp}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                    aria-label="Kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs text-gray-200 leading-relaxed">
                  <p>{t(selectedPost.caption, selectedPost.caption_en)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 space-y-4">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-red-400">
                    <Heart className="w-4 h-4 fill-red-400" />
                    <span className="font-semibold">
                      {selectedPost.likesCount ? selectedPost.likesCount.toLocaleString() : '1,240'}{' '}
                      {t('beğeni', 'likes')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      {selectedPost.commentsCount || 48} {t('yorum', 'comments')}
                    </span>
                  </div>
                </div>

                <a
                  href={selectedPost.permalink || profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#e1306c] to-[#f56040] hover:from-[#c8235a] hover:to-[#e04f32] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#e1306c]/20"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{t("Instagram'da Aç ve Yorum Yap", 'Open on Instagram & Comment')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
