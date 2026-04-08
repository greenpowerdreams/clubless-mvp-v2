import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
  /** If provided, checks that the current user is the creator of this event */
  requireEventCreator?: string;
}

export function RequireAuth({ children, requireEventCreator }: RequireAuthProps) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      if (requireEventCreator) {
        const { data: event } = await supabase
          .from("events")
          .select("creator_id")
          .eq("id", requireEventCreator)
          .single();

        if (!event || event.creator_id !== session.user.id) {
          navigate("/", { replace: true });
          return;
        }
      }

      setAuthorized(true);
      setLoading(false);
    };

    check();
  }, [navigate, requireEventCreator]);

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
