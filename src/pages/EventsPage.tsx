/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Ticket, ExternalLink, Filter } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { EventCalendar } from '../components/home/EventCalendar';
import { TicketStatus } from '../types';

export const EventsPage: React.FC = () => {
  const { data } = useSite();
  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi');

  const categories = ['Hepsi', 'Tiyatro', 'Performans', 'Atölye', 'Panel'];

  const allEvents = (data.events || [])
    .filter((e) => e.published)
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const filteredEvents = allEvents.filter((ev) => {
    if (selectedCategory === 'Hepsi') return true;
    return ev.category === selectedCategory;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#ff5a1f]/15 text-[#ff8c42] border border-[#ff5a1f]/30">
            Biletler Satışta
          </span>
        );
      case 'sold_out':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-950/40 text-red-400 border border-red-800/40">
            Tükendi
          </span>
        );
      case 'free':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            Ücretsiz Giriş
          </span>
        );
      case 'soon':
      default:
        return (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10">
            Yakında Satışta
          </span>
        );
    }
  };

  return (
    <div className="w-full py-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Hero */}
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-2">
            <Calendar className="w-4 h-4" />
            <span>2026 - 2027 TİYATRO SEZONU</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Etkinlikler &amp; Tiyatro Takvimi
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            DasDas Sahne, Moda Sahnesi ve turne temsillerinin tam programı. Tarihleri inceleyebilir,
            biletlerinizi doğrudan resmi bilet gişelerinden temin edebilirsiniz.
          </p>
        </div>

        {/* Embedded Dynamic Interactive Calendar */}
        <div className="mb-16">
          <EventCalendar />
        </div>

        {/* All Events Full List with Category Filter */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold text-white">
              Tüm Sezon Repertuarı ({filteredEvents.length})
            </h2>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 overflow-hidden shadow-xl transition-all group"
              >
                <div className="relative aspect-[4/3] w-full bg-[#151520] overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-bold text-[#ff5a1f] border border-white/10">
                    {event.category}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    {getStatusBadge(event.ticketStatus)}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#ff5a1f] mb-1 font-mono">
                      {event.date} · {event.time}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#ff5a1f] transition-colors mb-2">
                      {event.title}
                    </h3>

                    <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-4">
                      {event.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-gray-300 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#ff5a1f] shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      {event.price && (
                        <div className="flex items-center gap-2">
                          <Ticket className="w-3.5 h-3.5 text-[#ff5a1f] shrink-0" />
                          <span>Fiyat: <strong>{event.price}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    {event.ticketUrl ? (
                      <a
                        href={event.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold transition-colors shadow-md w-full justify-center"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Bilet Satın Al</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 text-center w-full py-2">
                        Bilet Satışı Çok Yakında
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
