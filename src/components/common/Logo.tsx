/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';

interface LogoProps {
  className?: string;
  customWidth?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', customWidth }) => {
  const { data } = useSite();
  const settings = data.settings;
  const width = customWidth || settings?.logoWidth || 260;

  return (
    <Link
      to="/"
      className={`inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f] ${className}`}
      aria-label="İsmail Semih Habiboğulları Ana Sayfa"
    >
      {settings?.logoUrl ? (
        <img
          src={settings.logoUrl}
          alt={settings.siteTitle || 'İsmail Semih Habiboğulları'}
          style={{ width: `${width}px`, maxHeight: '56px' }}
          className="object-contain"
        />
      ) : (
        <div style={{ width: `${width}px` }} className="max-w-full">
          <svg
            viewBox="0 0 520 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto drop-shadow-sm select-none"
          >
            <defs>
              <linearGradient id="logoOrangeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff5a1f" />
                <stop offset="100%" stopColor="#ff8c42" />
              </linearGradient>
            </defs>
            {/* Theatrical Arch Emblem */}
            <g transform="translate(10, 10)">
              <rect
                x="0"
                y="2"
                width="56"
                height="56"
                rx="14"
                fill="#151520"
                stroke="#ff5a1f"
                strokeWidth="2.5"
              />
              <path
                d="M12 48 C 12 24, 44 24, 44 48"
                stroke="url(#logoOrangeGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="28" cy="22" r="5" fill="#ff5a1f" />
              <path
                d="M22 36 L 28 30 L 34 36"
                stroke="#f1f1f4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            {/* Typographic Wordmark: İSMAİL SEMİH HABİBOĞULLARI */}
            <g transform="translate(80, 20)">
              <text
                x="0"
                y="20"
                fontFamily="'Space Grotesk', 'Inter', sans-serif"
                fontWeight="700"
                fontSize="21"
                fill="#f1f1f4"
                letterSpacing="4.5"
              >
                İSMAİL SEMİH
              </text>
              <text
                x="0"
                y="42"
                fontFamily="'Space Grotesk', 'Inter', sans-serif"
                fontWeight="600"
                fontSize="14"
                fill="#ff5a1f"
                letterSpacing="7.5"
              >
                HABİBOĞULLARI
              </text>
            </g>
            <line
              x1="480"
              y1="24"
              x2="480"
              y2="56"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />
            <circle cx="500" cy="40" r="3.5" fill="#ff5a1f" />
          </svg>
        </div>
      )}
    </Link>
  );
};
