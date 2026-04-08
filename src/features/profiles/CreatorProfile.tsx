import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicProfile } from "./hooks/useProfile";
import { useConnectionCounts, useIsFollowing, useToggleFollow } from "@/features/collaboration/hooks/useConnections";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Music,
  Instagram,
  Globe,
  CheckCircle2,
  UserPlus,
  UserMinus,
  Users,
  ExternalLink,
} from "lucide-react";

export default function CreatorProfile() {
  const { identifier } = useParams<{ identifier: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: profile, isLoading } = usePublicProfile(identifier);
  const { data: counts } = useConnectionCounts(profile?.user_id);
  const { data: isFollowing } = useIsFollowing(user?.id, profile?.user_id);
  const toggleFollow = useToggleFollow();

  const handleFollow = async () => {
    if (!user) {
      toast({ title: "Sign in to follow creators", variant: "destructive" });
      return;
    }
    if (!profile) return;

    try {
      await toggleFollow.mutateAsync({
        followerId: user.id,
        followingId: profile.user_id,
        isCurrentlyFollowing: !!isFollowing,
      });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing
          ? `You unfollowed ${profile.stage_name || profile.display_name}`
          : `You're now following ${profile.stage_name || profile.display_name}`,
      });
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="pt-20 pb-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <Skeleton className="h-32 w-32 rounded-full mx-auto mb-6" />
              <Skeleton className="h-8 w-48 mx-auto mb-4" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <section className="pt-20 pb-20">
          <div className="container px-4 text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Profile not found</h1>
            <p className="text-muted-foreground">This creator doesn't exist or their profile is private.</p>
          </div>
        </section>
      </Layout>
    );
  }

  const displayName = profile.stage_name || profile.display_name || "Creator";
  const isOwnProfile = user?.id === profile.user_id;

  const socialLinks = [
    profile.instagram_handle && {
      icon: <Instagram className="w-4 h-4" />,
      label: `@${profile.instagram_handle}`,
      url: `https://instagram.com/${profile.instagram_handle}`,
    },
    profile.website_url && {
      icon: <Globe className="w-4 h-4" />,
      label: "Website",
      url: profile.website_url,
    },
    profile.soundcloud_url && {
      icon: <Music className="w-4 h-4" />,
      label: "SoundCloud",
      url: profile.soundcloud_url,
    },
    profile.spotify_url && {
      icon: <Music className="w-4 h-4" />,
      label: "Spotify",
      url: profile.spotify_url,
    },
    profile.mixcloud_url && {
      icon: <Music className="w-4 h-4" />,
      label: "Mixcloud",
      url: profile.mixcloud_url,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; url: string }[];

  return (
    <Layout>
      <section className="pt-20 pb-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            {/* Profile Header */}
            <div className="text-center mb-10">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-6 ring-4 ring-primary/20"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Music className="w-12 h-12 text-primary" />
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="font-display text-3xl md:text-4xl font-bold">{displayName}</h1>
                {profile.verified && (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                )}
              </div>

              {profile.stage_name && profile.display_name && profile.stage_name !== profile.display_name && (
                <p className="text-muted-foreground mb-2">{profile.display_name}</p>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                {(profile.home_city || profile.city) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.home_city || profile.city}
                  </span>
                )}
                {profile.creator_type && (
                  <Badge variant="secondary" className="capitalize">
                    {profile.creator_type}
                  </Badge>
                )}
              </div>

              {/* Follower counts */}
              <div className="flex items-center justify-center gap-6 text-sm mb-6">
                <div>
                  <span className="font-bold">{counts?.followers_count ?? 0}</span>{" "}
                  <span className="text-muted-foreground">followers</span>
                </div>
                <div>
                  <span className="font-bold">{counts?.following_count ?? 0}</span>{" "}
                  <span className="text-muted-foreground">following</span>
                </div>
              </div>

              {/* Follow / Edit button */}
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={toggleFollow.isPending}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="glass rounded-2xl p-6 mb-6">
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Genres */}
            {profile.genres && profile.genres.length > 0 && (
              <div className="glass rounded-2xl p-6 mb-6">
                <h3 className="font-display text-lg font-semibold mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="px-3 py-1">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Info */}
            {profile.booking_open && profile.booking_rate_cents && (
              <div className="glass rounded-2xl p-6 mb-6">
                <h3 className="font-display text-lg font-semibold mb-3">Booking</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      ${(profile.booking_rate_cents / 100).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {profile.booking_rate_type || "per gig"}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Open for bookings</Badge>
                </div>
              </div>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold mb-3">Links</h3>
                <div className="space-y-2">
                  {socialLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-sm"
                    >
                      {link.icon}
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
