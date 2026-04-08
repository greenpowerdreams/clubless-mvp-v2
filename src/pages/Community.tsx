import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Search, UserPlus, UserCheck, UserX, Clock, MapPin, Users } from "lucide-react";
import {
  useConnections,
  usePendingRequests,
  useRespondToConnection,
  useRemoveConnection,
  useSendConnectionRequest,
} from "@/hooks/useConnections";
import { useUserSearch, type SearchResult } from "@/hooks/useUserSearch";
import { useToast } from "@/hooks/use-toast";

function UserCard({
  userId,
  displayName,
  handle,
  avatarUrl,
  bio,
  city,
  primaryRole,
  action,
}: {
  userId: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  primaryRole: string | null;
  action?: React.ReactNode;
}) {
  const initials = (displayName ?? "?").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
      <Link to={handle ? `/u/${handle}` : `/u/${userId}`}>
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={handle ? `/u/${handle}` : `/u/${userId}`}
            className="font-semibold text-foreground hover:underline truncate"
          >
            {displayName ?? "Unknown"}
          </Link>
          {primaryRole && primaryRole !== "user" && (
            <Badge variant="secondary" className="text-xs capitalize">
              {primaryRole.replace("_", " ")}
            </Badge>
          )}
        </div>
        {handle && <p className="text-sm text-muted-foreground">@{handle}</p>}
        {bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bio}</p>}
        {city && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {city}
          </div>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export default function Community() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("connections");
  const { toast } = useToast();

  const { data: connections = [], isLoading: loadingConnections } = useConnections();
  const { data: pending, isLoading: loadingPending } = usePendingRequests();
  const { data: searchResults = [], isLoading: searching } = useUserSearch(searchQuery);
  const respond = useRespondToConnection();
  const remove = useRemoveConnection();
  const sendRequest = useSendConnectionRequest();

  const incomingCount = pending?.incoming?.length ?? 0;

  const handleAccept = (connectionId: string) => {
    respond.mutate(
      { connectionId, response: "accepted" },
      { onSuccess: () => toast({ title: "Connection accepted" }) }
    );
  };

  const handleDecline = (connectionId: string) => {
    respond.mutate(
      { connectionId, response: "declined" },
      { onSuccess: () => toast({ title: "Request declined" }) }
    );
  };

  const handleRemove = (connectionId: string) => {
    remove.mutate(connectionId, {
      onSuccess: () => toast({ title: "Connection removed" }),
    });
  };

  const handleConnect = (userId: string) => {
    sendRequest.mutate(userId, {
      onSuccess: () => toast({ title: "Connection request sent" }),
      onError: (err) =>
        toast({ title: "Could not send request", description: (err as Error).message, variant: "destructive" }),
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community</h1>
            <p className="text-muted-foreground mt-1">Connect with DJs, promoters, and venue managers in the scene</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5" />
            <span className="font-medium">{connections.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search people by name, handle, or city..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {searching ? "Searching..." : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {searchResults.map((user: SearchResult) => (
                <UserCard
                  key={user.user_id}
                  userId={user.user_id}
                  displayName={user.display_name}
                  handle={user.handle}
                  avatarUrl={user.avatar_url}
                  bio={user.bio}
                  city={user.city}
                  primaryRole={user.primary_role}
                  action={
                    <Button size="sm" variant="outline" onClick={() => handleConnect(user.user_id)}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  }
                />
              ))}
              {!searching && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found matching "{searchQuery}"</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="connections">
              Connections ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Requests
              {incomingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                  {incomingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Connections List */}
          <TabsContent value="connections" className="space-y-2">
            {loadingConnections ? (
              <p className="text-center text-muted-foreground py-8">Loading connections...</p>
            ) : connections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Search for DJs, promoters, and venue managers to start building your network.
                  </p>
                </CardContent>
              </Card>
            ) : (
              connections.map((c) => (
                <UserCard
                  key={c.connection_id}
                  userId={c.connected_user_id}
                  displayName={c.display_name}
                  handle={c.handle}
                  avatarUrl={c.avatar_url}
                  bio={c.bio}
                  city={c.city}
                  primaryRole={c.primary_role}
                  action={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemove(c.connection_id)}
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  }
                />
              ))
            )}
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="pending" className="space-y-6">
            {/* Incoming */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Incoming Requests ({pending?.incoming?.length ?? 0})
              </h3>
              {loadingPending ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (pending?.incoming?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {pending!.incoming.map((req) => (
                    <UserCard
                      key={req.id}
                      userId={req.requester_id}
                      displayName={req.requester_profile?.display_name ?? null}
                      handle={req.requester_profile?.handle ?? null}
                      avatarUrl={req.requester_profile?.avatar_url ?? null}
                      bio={null}
                      city={req.requester_profile?.city ?? null}
                      primaryRole={req.requester_profile?.primary_role ?? null}
                      action={
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAccept(req.id)}>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDecline(req.id)}>
                            Decline
                          </Button>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Outgoing */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Sent Requests ({pending?.outgoing?.length ?? 0})
              </h3>
              {(pending?.outgoing?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No outgoing requests</p>
              ) : (
                <div className="space-y-2">
                  {pending!.outgoing.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Request sent — waiting for response
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
