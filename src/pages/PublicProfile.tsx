import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Globe,
  Instagram,
  Twitter,
  UserPlus,
  UserCheck,
  Clock,
  Calendar,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useConnectionStatus,
  useSendConnectionRequest,
  useRemoveConnection,
} from "@/hooks/useConnections";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  primary_role: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  created_at: string;
}

export default function PublicProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const connectionStatus = useConnectionStatus(profile?.id);
  const sendRequest = useSendConnectionRequest();
  const removeConnection = useRemoveConnection();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!handle) return;
    loadProfile();
  }, [handle]);

  const loadProfile = async () => {
    setLoading(true);
    // Try by handle first, then by id (auth user id)
    let { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url, bio, city, primary_role, website_url, instagram_handle, twitter_handle, created_at")
      .eq("handle", handle!)
      .maybeSingle();

    if (!data) {
      ({ data, error } = await supabase
        .from("profiles")
        .select("id, display_name, handle, avatar_url, bio, city, primary_role, website_url, instagram_handle, twitter_handle, created_at")
        .eq("id", handle!)
        .maybeSingle());
    }

    if (error) console.error("Error loading profile:", error);
    setProfile(data as ProfileData | null);
    setLoading(false);
  };

  const isOwnProfile = currentUserId && profile?.id === currentUserId;
  const connection = connectionStatus.data;

  const handleConnect = () => {
    if (!profile) return;
    sendRequest.mutate(profile.id, {
      onSuccess: () => toast({ title: "Connection request sent" }),
      onError: (err) =>
        toast({ title: "Could not send request", description: (err as Error).message, variant: "destructive" }),
    });
  };

  const handleDisconnect = () => {
    if (!connection) return;
    removeConnection.mutate(connection.id, {
      onSuccess: () => toast({ title: "Connection removed" }),
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground mb-6">This user doesn't exist or hasn't set up their profile yet.</p>
          <Button asChild>
            <Link to="/community">Browse Community</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const initials = (profile.display_name ?? "?").slice(0, 2).toUpperCase();
  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.display_name ?? "Unknown"}</h1>
                    {profile.handle && (
                      <p className="text-muted-foreground">@{profile.handle}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {profile.primary_role && profile.primary_role !== "user" && (
                        <Badge variant="secondary" className="capitalize">
                          {profile.primary_role.replace("_", " ")}
                        </Badge>
                      )}
                      {profile.city && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {profile.city}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined {joinDate}
                      </div>
                    </div>
                  </div>

                  {/* Connection Action */}
                  {!isOwnProfile && currentUserId && (
                    <div>
                      {!connection && (
                        <Button onClick={handleConnect} disabled={sendRequest.isPending}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      )}
                      {connection?.status === "pending" && connection.requester_id === currentUserId && (
                        <Button variant="outline" disabled>
                          <Clock className="w-4 h-4 mr-2" />
                          Request Sent
                        </Button>
                      )}
                      {connection?.status === "accepted" && (
                        <Button variant="outline" onClick={handleDisconnect}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Connected
                        </Button>
                      )}
                    </div>
                  )}
                  {isOwnProfile && (
                    <Button variant="outline" asChild>
                      <Link to="/profile">Edit Profile</Link>
                    </Button>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-foreground mt-4 leading-relaxed">{profile.bio}</p>
                )}

                {/* Social Links */}
                <div className="flex items-center gap-4 mt-4">
                  {profile.website_url && (profile.website_url.startsWith("https://") || profile.website_url.startsWith("http://")) && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {profile.instagram_handle && (
                    <a
                      href={`https://instagram.com/${profile.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      @{profile.instagram_handle}
                    </a>
                  )}
                  {profile.twitter_handle && (
                    <a
                      href={`https://twitter.com/${profile.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      @{profile.twitter_handle}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming events yet. Events this person hosts or collaborates on will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
