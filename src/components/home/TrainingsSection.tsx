/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { useSite } from '../../context/SiteContext';

export const TrainingsSection: React.FC = () => {
  const { data } = useSite();
  const trainings = (data.trainings || []).filter((t) => t.published).slice(0, 3);

  if (trainings.length === 0) return null;

  return (
    <section id="egitimler" className="w-full py-12" aria-label="Eğitimler ve Atölyeler">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>ATÖLYE & MASTERCLASS PROGRAMI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f4] tracking-tight">
              Eğitimler &amp; Atölyeler
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Oyunculuk, sahne duruşu, ses-nefes ve kamera önü için pratik odaklı stüdyo programları.
            </p>
          </div>

          <Link
            to="/egitimler"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff5a1f] hover:text-[#ff8c42] transition-colors"
          >
            <span>Tüm Atölye Programlarını Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Trainings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainings.map((tr) => (
            <div
              key={tr.id}
              className="flex flex-col rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 overflow-hidden shadow-xl transition-all group"
            >
              {/* Image banner */}
              <div className="relative aspect-[16/10] w-full bg-[#151520] overflow-hidden">
                <img
                  src={tr.imageUrl}
                  alt={tr.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-bold text-white border border-white/10">
                  {tr.price}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#ff5a1f] transition-colors line-clamp-2 mb-2">
                    {tr.title}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-4">
                    {tr.description}
                  </p>

                  {/* Workshop Metadata */}
                  <div className="space-y-1.5 text-xs text-gray-300 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      <span>{tr.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      <span>{tr.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      <span>{tr.quota}</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Eğitmen: <strong className="text-gray-200">{tr.instructor}</strong>
                  </span>
                  <Link
                    to={tr.applyUrl || `/egitimler/${tr.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold transition-colors"
                  >
                    <span>Kayıt &amp; Başvuru</span>
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
