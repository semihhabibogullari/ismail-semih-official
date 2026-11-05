/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id: string;
  label: string;
  label_en?: string;
  path: string;
  isExternal?: boolean;
  order: number;
  visible: boolean;
}

export interface SocialLinks {
  instagram: string;
  youtube: string;
  spotify: string;
  twitter?: string;
  linkedin?: string;
  email: string;
}

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  panelBg: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  borderColor: string;
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  baseSize: string; // e.g. '16px'
  headingWeight: string; // e.g. '700'
  bodyWeight: string; // e.g. '400'
  letterSpacing: string; // e.g. '-0.02em'
}

export interface SliderSettings {
  transitionType: 'kenburns-crossfade' | 'crossfade' | 'fade-zoom' | 'soft-slide' | 'minimal-fade';
  autoplayDuration: number; // e.g. 5000 (ms)
  transitionDuration: number; // e.g. 800 (ms)
  pauseOnHover: boolean;
}

export interface InstagramSettings {
  connected: boolean;
  username: string;
  accountType?: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  accessToken?: string;
  tokenExpiresAt?: string;
  autoSync: boolean;
  showLikes: boolean;
  postCountDesktop: number; // default 5
  postCountTablet: number; // default 3
  postCountMobile: number; // default 1.5
}

export interface InstagramPost {
  id: string;
  mediaUrl: string;
  permalink: string;
  caption: string;
  caption_en?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  timestamp: string;
  likesCount?: number;
  commentsCount?: number;
  order: number;
  published: boolean;
}

export interface SiteSettings {
  siteTitle: string;
  siteTitle_en?: string;
  siteSubtitle: string;
  siteSubtitle_en?: string;
  logoType: 'svg' | 'image';
  logoUrl?: string;
  lightLogoUrl?: string;
  darkLogoUrl?: string;
  mobileLogoUrl?: string;
  logoWidth: number; // in pixels
  faviconUrl?: string;
  primaryColor: string;
  bgColor: string;
  panelColor: string;
  textColor: string;
  socialLinks: SocialLinks;
  contactEmail: string;
  contactPhone?: string;
  address: string;
  address_en?: string;
  bioSummary: string;
  bioSummary_en?: string;
  copyrightText: string;
  copyrightText_en?: string;
  darkTheme: ThemeColors;
  lightTheme: ThemeColors;
  typography: TypographySettings;
  sliderSettings: SliderSettings;
  instagramSettings: InstagramSettings;
  borderRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-none';
  cardShadow: 'none' | 'sm' | 'md' | 'lg' | '2xl';
}

export interface DetailAction {
  id: string;
  kind: 'ticket' | 'contact' | 'custom';
  label: string;
  label_en?: string;
  url: string;
  enabled: boolean;
}

export interface DetailFields {
  detailDescription?: string;
  detailDescription_en?: string;
  detailVideoUrl?: string;
  detailActions?: DetailAction[];
}

export interface HeroSlide extends DetailFields {
  id: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  category: string;
  category_en?: string;
  badge?: string;
  badge_en?: string;
  imageUrl: string;
  buttonText: string;
  buttonText_en?: string;
  buttonLink: string;
  order: number;
  active: boolean;
}

export type TicketStatus = 'available' | 'sold_out' | 'free' | 'soon';

export interface EventItem extends DetailFields {
  id: string;
  title: string;
  title_en?: string;
  category: 'Tiyatro' | 'Performans' | 'Atölye' | 'Panel' | 'Diğer';
  category_en?: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  time: string; // HH:mm
  venue: string;
  venue_en?: string;
  address: string;
  address_en?: string;
  description: string;
  description_en?: string;
  imageUrl: string;
  ticketUrl: string;
  ticketStatus: TicketStatus;
  price?: string;
  isFeatured?: boolean;
  published: boolean;
}

export interface HighlightItem extends DetailFields {
  id: string;
  title: string;
  title_en?: string;
  category: string;
  category_en?: string;
  description: string;
  description_en?: string;
  videoUrl?: string;
  embedUrl?: string;
  mediaType: 'video' | 'image';
  imageUrl: string;
  linkUrl: string;
  linkText: string;
  linkText_en?: string;
  order: number;
  published: boolean;
}

export interface PodcastEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  title_en?: string;
  guest?: string;
  guest_en?: string;
  duration: string;
  publishDate: string;
  description: string;
  description_en?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  appleUrl?: string;
  imageUrl: string;
  audioUrl?: string;
  featured?: boolean;
  published: boolean;
}

export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  title_en?: string;
  category: string;
  category_en?: string;
  tags: string[];
  readTime: string;
  readTime_en?: string;
  publishDate: string;
  excerpt: string;
  excerpt_en?: string;
  content: string; // Markdown or rich text
  content_en?: string;
  imageUrl: string;
  featured?: boolean;
  published: boolean;
}

export interface TrainingItem {
  id: string;
  title: string;
  title_en?: string;
  instructor: string;
  instructor_en?: string;
  startDate: string;
  startDate_en?: string;
  duration: string;
  duration_en?: string;
  quota: string;
  quota_en?: string;
  price: string;
  location: string;
  location_en?: string;
  description: string;
  description_en?: string;
  syllabus?: string[];
  syllabus_en?: string[];
  imageUrl: string;
  applyUrl: string;
  status: 'active' | 'soon' | 'completed';
  published: boolean;
}

export interface PressItem {
  id: string;
  title: string;
  title_en?: string;
  outlet: string;
  publishDate: string;
  quote: string;
  quote_en?: string;
  imageUrl?: string;
  articleUrl: string;
  order: number;
  published: boolean;
}

export interface SectionConfig {
  id: string;
  type:
    | 'hero'
    | 'calendar'
    | 'highlights'
    | 'instagram'
    | 'podcast'
    | 'ai'
    | 'trainings'
    | 'press'
    | 'newsletter';
  title: string;
  title_en?: string;
  subtitle?: string;
  subtitle_en?: string;
  visible: boolean;
  order: number;
  maxWidth?: number;
  minHeight?: number;
  paddingY?: number;
}

export interface SeoSettings {
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  keywords: string;
  keywords_en?: string;
  ogImage: string;
  canonicalUrl: string;
  robotsIndex: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  date: string;
  confirmed: boolean;
}

export interface AiProposal {
  id: string;
  timestamp: string;
  commandText: string;
  intent: string;
  targetComponent: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  status: 'pending' | 'applied' | 'rejected';
}

export interface AiConfig {
  provider: 'openai' | 'gemini';
  openaiApiKey?: string;
  model: string;
  costLimitDaily?: number;
  enabledCapabilities: {
    designAssistant: boolean;
    contentAssistant: boolean;
    translationAssistant: boolean;
    seoAssistant: boolean;
  };
}

export interface SiteVersion {
  id: string;
  timestamp: string;
  versionNumber: number;
  note: string;
  data: SiteData;
}

export interface SiteData {
  version: number;
  updatedAt: string;
  settings: SiteSettings;
  sections: SectionConfig[];
  menu: MenuItem[];
  heroSlides: HeroSlide[];
  events: EventItem[];
  highlights: HighlightItem[];
  instagramPosts: InstagramPost[];
  podcasts: PodcastEpisode[];
  articles: ArticleItem[];
  trainings: TrainingItem[];
  press: PressItem[];
  seo: SeoSettings;
}
