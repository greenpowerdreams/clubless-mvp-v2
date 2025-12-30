import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { RefreshCw, Mail, AlertTriangle, CheckCircle, Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailLog {
  id: string;
  created_at: string;
  to_email: string;
  template_name: string;
  status: string;
  provider_message_id: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
}

export function EmailLogsTab() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs((data || []) as EmailLog[]);
    } catch (error) {
      console.error("Error fetching email logs:", error);
      toast({
        title: "Error",
        description: "Failed to load email logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "attempted":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Attempted
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const failedCount = logs.filter((l) => l.status === "failed").length;
  const sentCount = logs.filter((l) => l.status === "sent").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Mail className="w-4 h-4" />
            <span className="text-sm">Total Emails</span>
          </div>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Sent</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{sentCount}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{failedCount}</p>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, template, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Time</TableHead>
              <TableHead className="text-muted-foreground">Recipient</TableHead>
              <TableHead className="text-muted-foreground">Template</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {isLoading ? "Loading..." : "No email logs found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className={`border-border ${
                    log.status === "failed" ? "bg-red-500/5" : ""
                  }`}
                >
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">{log.to_email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.template_name}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="max-w-xs">
                    {log.error ? (
                      <span className="text-sm text-red-400 truncate block">
                        {log.error}
                      </span>
                    ) : log.provider_message_id ? (
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.provider_message_id}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
