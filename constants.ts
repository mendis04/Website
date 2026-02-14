import { StudioPackage, BookingStatus, CMSConfig } from './types';

export const INITIAL_CMS_CONFIG: CMSConfig = {
  heroTitle: "Dream Education Studio",
  heroSubtitle: "Premium Digital Studio",
  aboutText: "Dream Education is a high-end digital studio. We provide a professional space where teachers can record high-quality lessons. Our studio has the best 4K cameras and lighting to make your teaching look world-class. We handle all the technical parts so you can focus on teaching your students.",
  bannerImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1600&auto=format&fit=crop",
  strategyImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000",
  studioIntelligence: "Get broadcast-quality video with our professional cinema cameras and expert lighting setup. We ensure your educational content looks sharp, clear, and authoritative.",
  features: [
    "Sony 4K Cinema Cameras",
    "Soundproof Recording Space",
    "Professional Studio Lighting",
    "High-Speed Live Streaming"
  ],
  pricing: {
    oneHour: 1000,
    twoHours: 1500,
    threePlusHours: 2000
  },
  studioLogo: "", // Empty means use default stylized 'D'
  footerBrandName: "Dream Studio",
  directorName: "B.A.M. Mendis",
  contactNumber: "078 639 8066",
  footerTagline: "Premium Studio Hub | Sri Lanka | 2026"
};

export const INITIAL_PACKAGES: StudioPackage[] = [
  {
    id: 'pkg-starter',
    name: 'Starter Plan',
    hours: 1,
    price: 1000,
    description: '1 Hour recording session. Best for short lessons or high-impact social media videos.',
    thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop',
    badge: '1 HOUR'
  },
  {
    id: 'pkg-pro',
    name: 'Professional Plan',
    hours: 5,
    price: 4500,
    description: '5 Hour recording bundle. Perfect for creating a full course or several educational modules.',
    thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop',
    badge: '5 HOURS'
  },
  {
    id: 'pkg-ultimate',
    name: 'Master Plan',
    hours: 12,
    price: 10000,
    description: '12 Hour recording bundle. The best value for professional teachers building a complete digital academy.',
    thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=600&auto=format&fit=crop',
    badge: '12 HOURS'
  }
];

export const STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20',
  [BookingStatus.CONFIRMED]: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  [BookingStatus.PACKED]: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  [BookingStatus.COMPLETED]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20',
  [BookingStatus.CANCELLED]: 'bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20',
};