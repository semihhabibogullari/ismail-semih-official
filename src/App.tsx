/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SiteProvider, useSite } from './context/SiteContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { PodcastPage } from './pages/PodcastPage';
import { PodcastDetailPage } from './pages/PodcastDetailPage';
import { AiPage } from './pages/AiPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { EventsPage } from './pages/EventsPage';
import { TrainingsPage } from './pages/TrainingsPage';
import { TrainingDetailPage } from './pages/TrainingDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// App Layout Controller
function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0f] text-[#f1f1f4]">
      <ScrollToTop />
      {!isAdminRoute && <Navbar />}
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/podcast" element={<PodcastPage />} />
          <Route path="/podcast/:id" element={<PodcastDetailPage />} />
          <Route path="/yapay-zeka" element={<AiPage />} />
          <Route path="/yapay-zeka/:id" element={<ArticleDetailPage />} />
          <Route path="/etkinlikler" element={<EventsPage />} />
          <Route path="/egitimler" element={<TrainingsPage />} />
          <Route path="/egitimler/:id" element={<TrainingDetailPage />} />
          <Route path="/hakkimda" element={<AboutPage />} />
          <Route path="/iletisim" element={<ContactPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </SiteProvider>
  );
}
