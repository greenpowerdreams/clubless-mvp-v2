export interface Collaboration {
  id: string;
  event_id: string;
  initiator_id: string;
  collaborator_id: string;
  role: "co-host" | "promoter" | "dj" | "mc" | "manager";
  revenue_split_percent: number | null;
  status: "invited" | "accepted" | "declined" | "removed";
  accepted_at: string | null;
  created_at: string;
}

export interface Connection {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  stage_name: string | null;
  slug: string | null;
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

export interface ConnectionCounts {
  followers_count: number;
  following_count: number;
}

export interface CollaboratorInfo {
  collaboration_id: string;
  user_id: string;
  display_name: string | null;
  stage_name: string | null;
  avatar_url: string | null;
  role: string;
  revenue_split_percent: number | null;
  status: string;
}

export const COLLAB_ROLES = [
  { value: "co-host", label: "Co-Host" },
  { value: "promoter", label: "Promoter" },
  { value: "dj", label: "DJ" },
  { value: "mc", label: "MC" },
  { value: "manager", label: "Manager" },
] as const;
