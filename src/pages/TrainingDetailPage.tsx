/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Users, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const TrainingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data } = useSite();

  const training = (data.trainings || []).find((t) => t.id === id);

  if (!training) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Eğitim Bulunamadı</h1>
        <p className="text-gray-400 mb-6">Aradığınız eğitim programı mevcut değil veya kaldırılmış olabilir.</p>
        <Link to="/egitimler" className="px-5 py-2.5 rounded-xl bg-[#ff5a1f] text-white text-sm font-semibold">
          Tüm Eğitimlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full py-12">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6">
        <Link
          to="/egitimler"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#ff5a1f] mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Tüm Eğitim Programlarına Dön</span>
        </Link>

        {/* Hero Card */}
        <div className="rounded-2xl bg-[#121218] border border-white/10 overflow-hidden shadow-2xl mb-10">
          <div className="aspect-[21/9] w-full bg-[#151520]">
            <img
              src={training.imageUrl}
              alt={training.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {training.title}
              </h1>
              <div className="text-xl sm:text-2xl font-bold text-[#ff5a1f] shrink-0">
                {training.price}
              </div>
            </div>

            <p className="text-gray-300 text-base leading-relaxed mb-8">
              {training.description}
            </p>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-[#151520] border border-white/5 text-xs text-gray-300">
              <div>
                <span className="text-gray-500 block mb-1">Eğitmen</span>
                <strong className="text-white text-sm">{training.instructor}</strong>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Başlangıç</span>
                <strong className="text-white text-sm">{training.startDate}</strong>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Süre</span>
                <strong className="text-white text-sm">{training.duration}</strong>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Kontenjan</span>
                <strong className="text-white text-sm">{training.quota}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Syllabus Breakdown */}
        {training.syllabus && training.syllabus.length > 0 && (
          <div className="bg-[#121218] border border-white/10 rounded-2xl p-6 sm:p-10 mb-10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>Haftalık Atölye Müfredatı</span>
            </h2>

            <div className="space-y-4">
              {training.syllabus.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-xl bg-[#151520] border border-white/5"
                >
                  <CheckCircle className="w-5 h-5 text-[#ff5a1f] shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-200 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrollment Card CTA */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-[#151520] to-[#121218] border border-[#ff5a1f]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold text-white">Bu Atölyeye Başvurmak İster misiniz?</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              Kontenjanlar sınırlıdır. Ön kayıt oluşturduktan sonra ekibimiz sizinle iletişime geçecektir.
            </p>
          </div>

          <Link
            to={training.applyUrl || `/iletisim?egitim=${encodeURIComponent(training.title)}`}
            className="px-6 py-3 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-sm font-semibold transition-all shadow-lg shadow-[#ff5a1f]/25 shrink-0 flex items-center gap-2"
          >
            <span>Kayıt &amp; Başvuru Formu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
