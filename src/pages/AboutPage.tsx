/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Film, Mic, Sparkles, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const AboutPage: React.FC = () => {
  const { data } = useSite();
  const settings = data.settings;

  const skills = [
    { title: 'Tiyatro & Sahne Oyunculuğu', desc: 'Klasik ve çağdaş metinlerde fiziksel tiyatro ve karakter inşası.' },
    { title: 'Tiyatro Rejisi & Dramaturji', desc: 'Metin analizi, sahne plastisi ve çok disiplinli reji kurgusu.' },
    { title: 'Podcast Yayıncılığı & Moderasyon', desc: 'Kültür-sanat odaklı uzun soluklu röportaj ve içerik üretimi.' },
    { title: 'Yapay Zekâ & Dijital Scenography', desc: 'Büyük dil modelleri ile metin inceleme ve dijital projeksiyon tasarımı.' },
    { title: 'Oyunculuk & Beden Eğitmenliği', desc: 'Konservatuar hazırlık, kamera önü ve beden farkındalığı atölyeleri.' },
  ];

  const plays = [
    { year: '2025 - Günümüz', title: 'Bütün Çılgınlar Sever Beni', role: 'Oyuncu / Reji Asistanı', venue: 'DasDas & Moda Sahnesi' },
    { year: '2024 - 2025', title: 'Karanlıkta Komedi', role: 'Yönetmen & Oyuncu', venue: 'Moda Sahnesi Büyük Salon' },
    { year: '2023 - 2024', title: 'Antigone’nin Sessizliği', role: 'Dramaturg & Oyuncu', venue: 'Alan Kadıköy' },
    { year: '2022 - 2023', title: 'Kıyı Boyu Dalgalar', role: 'Oyuncu', venue: 'İstanbul Bağımsız Tiyatro Festivali' },
  ];

  return (
    <div className="w-full py-12">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Biographic Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          {/* Portrait Column (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#121218] shadow-2xl group">
              <img
                src="/images/artist_portrait.svg"
                alt="İsmail Semih Habiboğulları"
                className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 right-4 bg-[#0b0b0f]/80 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <div className="text-xs font-bold text-white">İsmail Semih Habiboğulları</div>
                <div className="text-[11px] text-[#ff5a1f]">Tiyatro Sanatçısı · Yönetmen · Eğitmen</div>
              </div>
            </div>
          </div>

          {/* Biography Text (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5a1f]/15 border border-[#ff5a1f]/30 text-xs font-semibold text-[#ff8c42]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SANATÇI ÖZGEÇMİŞİ</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Sahne Büyüsü, Sözün Gücü ve Dijital Gelecek.
            </h1>

            <div className="space-y-4 text-gray-300 text-sm sm:text-base leading-relaxed">
              <p>
                İsmail Semih Habiboğulları; İstanbul çağdaş tiyatro hareketinin dinamik merkezlerinde
                oyunculuk, reji ve dramaturji çalışmalarını aktif olarak sürdüren bağımsız bir tiyatro sanatçısıdır.
              </p>
              <p>
                DasDas, Moda Sahnesi ve Alan Kadıköy gibi bağımsız sanat merkezlerindeki temsillerinin yanı sıra;
                geniş kitlelere ulaşan <strong>"Ben Bir İsmail"</strong> podcast serisiyle kültür-sanat dünyasında
                derinlikli ve sahici bir tartışma alanı açmıştır.
              </p>
              <p>
                Geleneksel sahne disiplinlerini modern teknoloji, yapay zekâ ve dijital scenography olanaklarıyla
                harmanlayarak yeni nesil tiyatro formları üretmekte; aynı zamanda genç oyuncular ve sahne meraklıları
                için beden, ses ve kamera önü atölyeleri yürütmektedir.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/etkinlikler"
                className="px-5 py-2.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-[#ff5a1f]/20"
              >
                Etkinlik Takvimini İncele
              </Link>
              <Link
                to="/iletisim"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold transition-all"
              >
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>

        {/* Areas of Practice / Competencies */}
        <div className="mb-16 pt-12 border-t border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">Sanatsal Yetkinlikler ve Odak Alanları</h2>
          <p className="text-gray-400 text-sm mb-8">
            Disiplinlerarası sahne üretimi ve pedagojik çalışmalar.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#121218] border border-white/10 hover:border-[#ff5a1f]/40 transition-all shadow-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-[#ff5a1f]/10 text-[#ff5a1f] flex items-center justify-center font-bold text-sm mb-4">
                  0{idx + 1}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{skill.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{skill.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Credits / Repertoire */}
        <div className="mb-16 pt-12 border-t border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">Seçilmiş Sahne & Reji Çalışmaları</h2>
          <p className="text-gray-400 text-sm mb-8">
            İstanbul sahnelerinde rol alınan ve yönetilen oyunlar.
          </p>

          <div className="space-y-4">
            {plays.map((play, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#121218] border border-white/5 hover:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <span className="text-xs font-mono text-[#ff5a1f] block mb-1">{play.year}</span>
                  <h3 className="text-base font-bold text-white">{play.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{play.role}</p>
                </div>
                <div className="text-xs font-medium text-gray-300 bg-[#151520] px-3 py-1.5 rounded-lg border border-white/5 sm:text-right shrink-0">
                  {play.venue}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Invitation Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#151520] via-[#121218] to-[#0b0b0f] border border-[#ff5a1f]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Birlikte Yeni Bir Sahne Projesi Üretelim
            </h3>
            <p className="text-gray-300 text-sm mt-1 max-w-lg">
              Tiyatro prodüksiyonları, konuşmacı davetleri, podcast konukluğu veya atölye işbirlikleri için mesaj bırakabilirsiniz.
            </p>
          </div>

          <Link
            to="/iletisim"
            className="px-6 py-3 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-sm font-semibold transition-all shadow-lg shadow-[#ff5a1f]/25 shrink-0 flex items-center gap-2"
          >
            <span>İletişim Formuna Git</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
