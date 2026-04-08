/**
 * Central image configuration for Clubless
 * All images are from Unsplash with proper licensing
 * Images can be swapped by updating URLs here
 */

export const IMAGES = {
  // Hero & Background Images
  hero: {
    main: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=80",
    overlay: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80",
    crowd: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1920&q=80",
  },

  // Event & Nightlife Imagery
  events: {
    concert: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    party: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    dj: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
    rooftop: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    lounge: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
    festival: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
    club: "https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80",
    dance: "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800&q=80",
  },

  // Vendor Category Images
  vendors: {
    bartending: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
    catering: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80",
    security: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&q=80",
    dj: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&q=80",
    photoVideo: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80",
    decor: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&q=80",
    staffing: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    av: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80",
  },

  // How It Works / Feature Images
  features: {
    planning: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80",
    profit: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
    hosting: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
    teamwork: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
    celebration: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80",
  },

  // Testimonial Avatars (placeholder profiles)
  testimonials: {
    avatar1: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    avatar2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    avatar3: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    avatar4: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  },

  // Premium / Lifestyle
  lifestyle: {
    cocktails: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80",
    bar: "https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=800&q=80",
    vip: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80",
    nightCity: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&q=80",
    champagne: "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=800&q=80",
  },

  // Fallback / Placeholder
  placeholder: {
    event: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    vendor: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    profile: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80",
  },
} as const;

// FEATURED_EVENTS_MOCK removed — fake cities/dates. Fetch real events from Supabase instead.

// Vendor categories with images
export const VENDOR_CATEGORIES_WITH_IMAGES = [
  {
    id: "bartending",
    label: "Bartending",
    description: "Professional mixologists & bar service",
    image: IMAGES.vendors.bartending,
    count: 24,
  },
  {
    id: "catering",
    label: "Catering",
    description: "Gourmet food & hospitality",
    image: IMAGES.vendors.catering,
    count: 18,
  },
  {
    id: "security",
    label: "Security",
    description: "Licensed event security teams",
    image: IMAGES.vendors.security,
    count: 15,
  },
  {
    id: "dj_equipment",
    label: "DJ & Sound",
    description: "Audio equipment & DJ services",
    image: IMAGES.vendors.dj,
    count: 32,
  },
  {
    id: "photo_video",
    label: "Photo & Video",
    description: "Professional event coverage",
    image: IMAGES.vendors.photoVideo,
    count: 28,
  },
  {
    id: "decor",
    label: "Decor & Design",
    description: "Event styling & decoration",
    image: IMAGES.vendors.decor,
    count: 12,
  },
  {
    id: "florist",
    label: "Florist",
    description: "Floral arrangements & design",
    image: "https://images.unsplash.com/photo-1487530811015-780f08dcb84d?w=600&q=80",
    count: 0,
  },
  {
    id: "photographer",
    label: "Photography",
    description: "Professional event photographers",
    image: "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=600&q=80",
    count: 0,
  },
  {
    id: "lighting",
    label: "Lighting",
    description: "Event lighting & ambiance design",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80",
    count: 0,
  },
  {
    id: "entertainment",
    label: "Entertainment",
    description: "Live acts, performers & more",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
    count: 0,
  },
  {
    id: "transportation",
    label: "Transportation",
    description: "Shuttles, limos & event transit",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80",
    count: 0,
  },
  {
    id: "furniture_rental",
    label: "Furniture Rental",
    description: "Tables, chairs, lounge furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    count: 0,
  },
];

// Testimonials — empty until real creator quotes are collected
export const TESTIMONIALS: Array<{
  id: string;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
}> = [];
