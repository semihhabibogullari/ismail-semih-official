/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Calendar, Clock, Users, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const TrainingsPage: React.FC = () => {
  const { data } = useSite();
  const trainings = (data.trainings || []).filter((t) => t.published);

  return (
    <div className="w-full py-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Hero */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>SAHNE SANATLARI EĞİTİM PROGRAMI</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Eğitimler &amp; Atölyeler
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            İsmail Semih Habiboğulları yürütücülüğünde; oyuncular, tiyatro öğrencileri,
            sahneye ilgi duyanlar ve kurumsal ekipler için hazırlanmış beden, ses, metin ve kamera önü atölyeleri.
          </p>
        </div>

        {/* Trainings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainings.map((tr) => (
            <div
              key={tr.id}
              className="flex flex-col rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 overflow-hidden shadow-xl transition-all group"
            >
              <div className="relative aspect-[16/10] w-full bg-[#151520] overflow-hidden">
                <img
                  src={tr.imageUrl}
                  alt={tr.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-bold text-white border border-white/10">
                  {tr.price}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white group-hover:text-[#ff5a1f] transition-colors mb-3 leading-snug">
                    {tr.title}
                  </h2>

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-6">
                    {tr.description}
                  </p>

                  <div className="space-y-2 text-xs text-gray-300 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      <span>Başlangıç: <strong>{tr.startDate}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      <span>Süre: <strong>{tr.duration}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      <span>Kontenjan: <strong>{tr.quota}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#ff5a1f]" />
                      <span className="truncate">{tr.location}</span>
                    </div>
                  </div>

                  {/* Syllabus Preview */}
                  {tr.syllabus && tr.syllabus.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Müfredat Başlıkları
                      </div>
                      <ul className="space-y-1 text-xs text-gray-400">
                        {tr.syllabus.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 truncate">
                            <CheckCircle2 className="w-3 h-3 text-[#ff5a1f] shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                  <Link
                    to={`/egitimler/${tr.id}`}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Detaylı İncele
                  </Link>

                  <Link
                    to={tr.applyUrl || `/iletisim?egitim=${encodeURIComponent(tr.title)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold transition-colors shadow-md"
                  >
                    <span>Kayıt Ol &amp; Başvur</span>
                    <ArrowRight className="w-3 h-3" />
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
