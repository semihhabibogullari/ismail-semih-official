/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Ticket,
  ExternalLink,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { EventItem, TicketStatus } from '../../types';
import { DetailModal, DetailModalItem } from '../common/DetailModal';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const EventCalendar: React.FC = () => {
  const { data, t, language } = useSite();
  const monthNames = language === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_TR;
  const dayNames = language === 'en' ? DAY_NAMES_EN : DAY_NAMES_TR;
  const allEvents = useMemo(() => {
    return (data.events || [])
      .filter((ev) => ev.published)
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }, [data.events]);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailModalItem | null>(null);

  const showEventDetails = (event: EventItem) => {
    setSelectedDetail({
      title: t(event.title, event.title_en),
      category: t(event.category, event.category_en),
      description: t(event.detailDescription || event.description, event.detailDescription_en || event.description_en),
      imageUrl: event.imageUrl,
      videoUrl: event.detailVideoUrl,
      meta: [
        { label: 'Tarih', value: event.date, icon: 'date' },
        { label: 'Saat', value: event.time, icon: 'time' },
        { label: 'Mekân', value: t(event.venue, event.venue_en), icon: 'place' },
        ...(event.price ? [{ label: 'Fiyat', value: event.price }] : []),
      ] as DetailModalItem['meta'],
      actions: event.detailActions || [],
    });
  };

  // Unconditionally defaults to 'week' (Haftalık) on every mount/refresh
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const dateFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDateStr(dateFormatted);
  };

  // Month grid calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Monday as index 0: getDay() gives 0 for Sunday
    const startDayIndex = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding to fill weeks
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  // Week days calculation (Pazartesi'den Pazar'a 7 gün)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = (curr.getDay() + 6) % 7; // Monday is 0, Sunday is 6
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        dayNumber: d.getDate(),
        dateStr,
        isCurrentMonth: m === currentMonth,
        dayName: dayNames[i],
        monthIndex: m,
        year: y,
      });
    }
    return days;
  }, [currentDate, currentMonth, dayNames]);

  // Weekly title range text
  const weekRangeTitle = useMemo(() => {
    if (weekDays.length < 7) return '';
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const firstMonthName = monthNames[firstDay.monthIndex];
    const lastMonthName = monthNames[lastDay.monthIndex];

    if (firstDay.monthIndex === lastDay.monthIndex) {
      return `${firstDay.dayNumber} - ${lastDay.dayNumber} ${firstMonthName} ${firstDay.year}`;
    } else {
      return `${firstDay.dayNumber} ${firstMonthName} - ${lastDay.dayNumber} ${lastMonthName} ${lastDay.year}`;
    }
  }, [weekDays, monthNames]);

  // Map events to date strings
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    allEvents.forEach((ev) => {
      const existing = map.get(ev.date) || [];
      existing.push(ev);
      map.set(ev.date, existing);
    });
    return map;
  }, [allEvents]);

  // Filtered events to display below calendar
  const displayedEvents = useMemo(() => {
    if (selectedDateStr) {
      const forSelected = eventsByDate.get(selectedDateStr) || [];
      if (forSelected.length > 0) return forSelected;
    }
    // If in week view and no specific day selected, show events in current week
    if (calendarView === 'week') {
      const weekDateSet = new Set(weekDays.map((d) => d.dateStr));
      const inThisWeek = allEvents.filter((ev) => weekDateSet.has(ev.date));
      if (inThisWeek.length > 0) return inThisWeek;
    }
    // Fallback: show upcoming events
    return allEvents.slice(0, 4);
  }, [selectedDateStr, eventsByDate, calendarView, weekDays, allEvents]);

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
    <section id="etkinlik-takvimi" className="w-full py-12" aria-label="Etkinlik Takvimi">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-1">
              <CalendarIcon className="w-4 h-4" />
              <span>SAHNE PROGRAMI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f4] tracking-tight">
              Etkinlik Takvimi
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              DasDas, Moda Sahnesi ve turne temsilleri için haftalık ve aylık gösterim takvimi.
            </p>
          </div>

          {/* View switch: [ Haftalık ] [ Aylık ] and navigation */}
          <div className="flex items-center gap-3">
            {/* View Mode buttons: Default to Haftalık */}
            <div className="flex items-center bg-[#151520] p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setCalendarView('week')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  calendarView === 'week'
                    ? 'bg-[#ff5a1f] text-white shadow-sm font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Haftalık
              </button>
              <button
                type="button"
                onClick={() => setCalendarView('month')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  calendarView === 'month'
                    ? 'bg-[#ff5a1f] text-white shadow-sm font-semibold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Aylık
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1 bg-[#151520] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={calendarView === 'week' ? 'Önceki Hafta' : 'Önceki Ay'}
                title={calendarView === 'week' ? 'Önceki Hafta' : 'Önceki Ay'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={calendarView === 'week' ? 'Sonraki Hafta' : 'Sonraki Ay'}
                title={calendarView === 'week' ? 'Sonraki Hafta' : 'Sonraki Ay'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Current Period Title (Week range in week mode, Month in month mode) */}
        <div className="flex items-center justify-between py-3 px-4 bg-[#121218] rounded-t-2xl border-t border-x border-white/10 text-sm font-semibold text-white">
          <div className="flex items-center gap-2">
            <span className="text-base text-[#f1f1f4]">
              {calendarView === 'week'
                ? weekRangeTitle
                : `${monthNames[currentMonth]} ${currentYear}`}
            </span>
            <span className="text-xs text-[#ff5a1f] font-mono font-normal">
              ({calendarView === 'week' ? t('Haftalık Görünüm', 'Weekly View') : t('Aylık Görünüm', 'Monthly View')})
            </span>
          </div>

          {selectedDateStr && (
            <button
              type="button"
              onClick={() => setSelectedDateStr(null)}
              className="text-xs text-[#ff5a1f] hover:underline cursor-pointer"
            >
              Filtreyi Temizle
            </button>
          )}
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-[#151520] border border-white/10 rounded-b-2xl p-3 sm:p-5 shadow-xl overflow-x-auto">
          {calendarView === 'week' ? (
            /* Weekly View (DEFAULT) */
            <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-[620px]">
              {weekDays.map((dayItem, idx) => {
                const dayEvents = eventsByDate.get(dayItem.dateStr) || [];
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDateStr === dayItem.dateStr;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDateStr(dayItem.dateStr)}
                    className={`min-h-[100px] sm:min-h-[110px] p-2.5 sm:p-3 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#ff5a1f]/20 border-[#ff5a1f] ring-1 ring-[#ff5a1f] shadow-md'
                        : hasEvents
                        ? 'bg-[#181824] hover:bg-[#1e1e2d] border-white/10 hover:border-[#ff5a1f]/40'
                        : 'bg-[#121218]/60 hover:bg-[#181822] border-white/5'
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 uppercase font-semibold">
                          {dayItem.dayName}
                        </span>
                        {hasEvents && (
                          <span className="w-2 h-2 rounded-full bg-[#ff5a1f] shadow-[0_0_8px_#ff5a1f]" />
                        )}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-white mt-1">
                        {dayItem.dayNumber}
                      </div>
                    </div>
                    {hasEvents ? (
                      <div className="w-full mt-2">
                        <div className="text-[10px] text-[#ff8c42] bg-[#ff5a1f]/10 px-1.5 py-0.5 rounded truncate font-medium">
                          {dayEvents[0].title}
                        </div>
                        {dayEvents.length > 1 && (
                          <span className="text-[9px] text-gray-400 block mt-0.5">
                            +{dayEvents.length - 1} oyun daha
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-600">Temsil yok</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Monthly View */
            <div className="min-w-[620px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-gray-400">
                {dayNames.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((dayItem, idx) => {
                  const dayEvents = eventsByDate.get(dayItem.dateStr) || [];
                  const hasEvents = dayEvents.length > 0;
                  const isSelected = selectedDateStr === dayItem.dateStr;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDateStr(dayItem.dateStr)}
                      className={`relative min-h-[64px] sm:min-h-[76px] p-2 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                        !dayItem.isCurrentMonth
                          ? 'opacity-30 border-transparent bg-transparent'
                          : isSelected
                          ? 'bg-[#ff5a1f]/20 border-[#ff5a1f] shadow-md ring-1 ring-[#ff5a1f]'
                          : hasEvents
                          ? 'bg-[#181824] hover:bg-[#1e1e2d] border-white/10 hover:border-[#ff5a1f]/50'
                          : 'bg-[#121218]/60 hover:bg-[#181822] border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-semibold ${
                            isSelected
                              ? 'text-[#ff5a1f]'
                              : dayItem.isCurrentMonth
                              ? 'text-gray-200'
                              : 'text-gray-600'
                          }`}
                        >
                          {dayItem.dayNumber}
                        </span>
                        {hasEvents && (
                          <span className="w-2 h-2 rounded-full bg-[#ff5a1f] shadow-[0_0_8px_#ff5a1f]" />
                        )}
                      </div>

                      {hasEvents && (
                        <div className="w-full mt-1">
                          <span className="text-[10px] line-clamp-1 font-medium text-[#ff8c42] bg-[#ff5a1f]/10 px-1 py-0.5 rounded">
                            {dayEvents[0].title}
                          </span>
                          {dayEvents.length > 1 && (
                            <span className="text-[9px] text-gray-400 block mt-0.5">
                              +{dayEvents.length - 1} oyun daha
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected or Upcoming Events List */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#f1f1f4] flex items-center gap-2">
              <span>
                {selectedDateStr
                  ? `${selectedDateStr} Tarihindeki Temsiller`
                  : calendarView === 'week'
                  ? 'Bu Haftanın Temsilleri & Bilet Satışı'
                  : 'Yaklaşan Temsiller & Bilet Satışı'}
              </span>
              <span className="text-xs text-gray-400 font-normal">
                ({displayedEvents.length} etkinlik)
              </span>
            </h3>
            <Link
              to="/etkinlikler"
              className="text-xs font-medium text-[#ff5a1f] hover:text-[#ff8c42] flex items-center gap-1 transition-colors"
            >
              <span>Tüm Sezon Takvimini Gör</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {displayedEvents.length === 0 ? (
            <div className="p-8 text-center bg-[#121218] rounded-2xl border border-white/10 text-gray-400">
              <CalendarIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm">
                {selectedDateStr
                  ? 'Seçilen tarihte planlanmış bir etkinlik bulunmamaktadır.'
                  : 'Bu haftada planlanmış bir etkinlik bulunmamaktadır.'}
              </p>
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                className="mt-3 text-xs text-[#ff5a1f] hover:underline cursor-pointer"
              >
                Yaklaşan diğer etkinlikleri göster
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 transition-all group"
                >
                  {/* Poster Image */}
                  <div className="w-full sm:w-32 h-36 sm:h-auto rounded-xl overflow-hidden shrink-0 bg-[#151520] relative">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-[#ff5a1f] backdrop-blur-sm">
                        {t(event.category, event.category_en)}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-[#ff5a1f] tracking-wide font-mono">
                          {event.date}
                        </span>
                        {getStatusBadge(event.ticketStatus)}
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-[#ff5a1f] transition-colors line-clamp-1">
                        {t(event.title, event.title_en)}
                      </h4>

                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {t(event.description, event.description_en)}
                      </p>

                      <div className="mt-3 space-y-1 text-xs text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#ff5a1f]" />
                          <span>{event.time}</span>
                          {event.price && (
                            <>
                              <span className="text-gray-500">·</span>
                              <span className="font-semibold text-gray-200">{event.price}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#ff5a1f] shrink-0" />
                          <span className="truncate">{t(event.venue, event.venue_en)}</span>
                        </div>
                      </div>
                    </div>

                    {/* All CTA links are configured inside the popup by the admin. */}
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <button type="button" onClick={() => showEventDetails(event)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff5a1f] text-white text-xs font-semibold hover:bg-[#ff733b] cursor-pointer">
                        {t('Detayları Gör', 'View Details')}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <DetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </section>
  );
};
