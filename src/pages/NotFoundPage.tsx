/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl sm:text-8xl font-black text-[#ff5a1f] font-mono tracking-tight mb-2">
          404
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Perde Kapandı — Sayfa Bulunamadı
        </h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Aradığınız sayfa sahneden kaldırılmış ya da adresi değişmiş olabilir. Ana sayfaya dönerek etkinlik takvimini veya podcast bölümlerini inceleyebilirsiniz.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-sm font-semibold transition-all shadow-lg shadow-[#ff5a1f]/20"
        >
          <Home className="w-4 h-4" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    </div>
  );
};
