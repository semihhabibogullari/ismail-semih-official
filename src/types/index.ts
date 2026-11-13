/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id: string;
  label: string;
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
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  timestamp: string;
  likesCount?: number;
  commentsCount?: number;
  order: number;
  published: boolean;
}

export interface SiteSettings {
  siteTitle: string;
  siteSubtitle: string;
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
  bioSummary: string;
  copyrightText: string;
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
  url: string;
  enabled: boolean;
}

export interface DetailFields {
  detailDescription?: string;
  detailVideoUrl?: string;
  detailActions?: DetailAction[];
}

export interface HeroSlide extends DetailFields {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge?: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  active: boolean;
}

export type TicketStatus = 'available' | 'sold_out' | 'free' | 'soon';

export interface EventItem extends DetailFields {
  id: string;
  title: string;
  category: 'Tiyatro' | 'Performans' | 'Atölye' | 'Panel' | 'Diğer';
  date: string; // YYYY-MM-DD
  endDate?: string;
  time: string; // HH:mm
  venue: string;
  address: string;
  description: string;
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
  category: string;
  description: string;
  videoUrl?: string;
  embedUrl?: string;
  mediaType: 'video' | 'image';
  imageUrl: string;
  linkUrl: string;
  linkText: string;
  order: number;
  published: boolean;
}

export interface PodcastEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  guest?: string;
  duration: string;
  publishDate: string;
  description: string;
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
  category: string;
  tags: string[];
  readTime: string;
  publishDate: string;
  excerpt: string;
  content: string; // Markdown or rich text
  imageUrl: string;
  featured?: boolean;
  published: boolean;
}

export interface TrainingItem {
  id: string;
  title: string;
  instructor: string;
  startDate: string;
  duration: string;
  quota: string;
  price: string;
  location: string;
  description: string;
  syllabus?: string[];
  imageUrl: string;
  applyUrl: string;
  status: 'active' | 'soon' | 'completed';
  published: boolean;
}

export interface PressItem {
  id: string;
  title: string;
  outlet: string;
  publishDate: string;
  quote: string;
  imageUrl?: string;
  articleUrl: string;
  order: number;
  published: boolean;
}

export interface SectionAppearance {
  headingColor?: string;
  textColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  cardColor?: string;
  borderColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowBlur?: number;
  headingFont?: string;
  bodyFont?: string;
  headingSize?: number;
  cardTitleSize?: number;
  textSize?: number;
  radius?: number;
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
  subtitle?: string;
  visible: boolean;
  order: number;
  maxWidth?: number;
  minHeight?: number;
  paddingY?: number;
  appearance?: SectionAppearance;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
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

export interface AboutSkill {
  id: string;
  title: string;
  desc: string;
}

export interface AboutPlay {
  id: string;
  year: string;
  title: string;
  role: string;
  venue: string;
}

/** Content of the "Hakkımda" page. Paragraphs in `biography` are separated by a blank line; **text** renders bold. */
export interface AboutContent {
  portraitUrl: string;
  portraitName: string;
  portraitRole: string;
  badge: string;
  heading: string;
  biography: string;
  skillsTitle: string;
  skillsSubtitle: string;
  skills: AboutSkill[];
  playsTitle: string;
  playsSubtitle: string;
  plays: AboutPlay[];
  ctaTitle: string;
  ctaText: string;
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
  about: AboutContent;
}
