// Sprint 2: DJ + Scheduling types

export interface Schedule {
  id: string;
  user_id: string;
  event_id: string | null;
  title: string;
  schedule_type: "gig" | "availability" | "block" | "hold";
  start_at: string;
  end_at: string;
  city: string | null;
  venue_id: string | null;
  visibility: "public" | "connections" | "private";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  event_id: string;
  requester_id: string;
  target_id: string;
  booking_type: "dj" | "venue" | "vendor";
  status: "pending" | "accepted" | "declined" | "cancelled";
  proposed_rate_cents: number | null;
  agreed_rate_cents: number | null;
  set_start_at: string | null;
  set_end_at: string | null;
  notes: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventLineupEntry {
  id: string;
  event_id: string;
  user_id: string | null;
  artist_name: string;
  role: "dj" | "headliner" | "opener" | "mc" | "live_act";
  set_start_at: string | null;
  set_end_at: string | null;
  sort_order: number;
  confirmed: boolean;
  booking_id: string | null;
  created_at: string;
}

export interface DJProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  stage_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  home_city: string | null;
  genres: string[] | null;
  creator_type: string | null;
  booking_open: boolean;
  booking_rate_cents: number | null;
  booking_rate_type: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  soundcloud_url: string | null;
  spotify_url: string | null;
  mixcloud_url: string | null;
  website_url: string | null;
  verified: boolean;
  public_profile: boolean;
}

export interface ScheduleConflict {
  schedule_id: string;
  title: string;
  schedule_type: string;
  start_at: string;
  end_at: string;
  city: string | null;
  severity: "conflict" | "unavailable";
}

// UI Constants
export const GENRES = [
  "Afrohouse",
  "Amapiano",
  "Deep House",
  "Tech House",
  "Techno",
  "House",
  "Hip-Hop",
  "R&B",
  "Afrobeats",
  "Dancehall",
  "Reggaeton",
  "Latin",
  "EDM",
  "Drum & Bass",
  "UK Garage",
  "Disco",
  "Funk",
  "Jazz",
  "Open Format",
] as const;

export const SCHEDULE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  gig: { label: "Gig", color: "bg-primary/20 text-primary" },
  availability: { label: "Available", color: "bg-green-500/20 text-green-400" },
  block: { label: "Blocked", color: "bg-destructive/20 text-destructive" },
  hold: { label: "Hold", color: "bg-yellow-500/20 text-yellow-400" },
};
