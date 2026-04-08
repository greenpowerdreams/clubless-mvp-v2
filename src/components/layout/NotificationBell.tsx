import { useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string | null;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["notifications-unread-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      if (error) {
        // Table may not exist yet; degrade gracefully
        return 0;
      }
      return count ?? 0;
    },
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, read, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return [];
      return (data as Notification[]) ?? [];
    },
  });

  const refetchNotifications = () => {
    queryClient.invalidateQueries({
      queryKey: ["notifications-unread-count", user?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["notifications-list", user?.id],
    });
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("read", false);
    refetchNotifications();
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="flex flex-col">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-border last:border-0 ${
                  !n.read ? "bg-muted/40" : ""
                }`}
              >
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                {n.body && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {n.body}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {relativeTime(n.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && unreadCount === 0 && (
          <div className="px-4 py-2 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              All caught up
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
