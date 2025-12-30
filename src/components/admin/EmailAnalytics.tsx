import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Eye,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  MousePointerClick,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailStats {
  template_name: string;
  total_sent: number;
  total_opened: number;
  total_failed: number;
  open_rate: number;
  total_opens: number; // includes repeat opens
}

interface EmailLog {
  id: string;
  created_at: string;
  to_email: string;
  template_name: string;
  status: string;
  opened_at: string | null;
  open_count: number | null;
  tracking_id: string | null;
}

export function EmailAnalytics() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("id, created_at, to_email, template_name, status, opened_at, open_count, tracking_id")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs((data || []) as EmailLog[]);
    } catch (error) {
      console.error("Error fetching email logs:", error);
      toast({
        title: "Error",
        description: "Failed to load email analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const sentEmails = logs.filter(l => l.status === "sent");
    const openedEmails = sentEmails.filter(l => l.opened_at !== null);
    const totalOpens = sentEmails.reduce((sum, l) => sum + (l.open_count || 0), 0);
    
    return {
      totalSent: sentEmails.length,
      totalOpened: openedEmails.length,
      openRate: sentEmails.length > 0 ? (openedEmails.length / sentEmails.length) * 100 : 0,
      totalOpens,
      avgOpensPerEmail: openedEmails.length > 0 ? totalOpens / openedEmails.length : 0,
      failedCount: logs.filter(l => l.status === "failed").length,
    };
  }, [logs]);

  // Calculate per-template stats
  const templateStats = useMemo(() => {
    const statsMap = new Map<string, EmailStats>();

    logs.forEach(log => {
      if (!statsMap.has(log.template_name)) {
        statsMap.set(log.template_name, {
          template_name: log.template_name,
          total_sent: 0,
          total_opened: 0,
          total_failed: 0,
          open_rate: 0,
          total_opens: 0,
        });
      }

      const stats = statsMap.get(log.template_name)!;
      
      if (log.status === "sent") {
        stats.total_sent++;
        if (log.opened_at) {
          stats.total_opened++;
        }
        stats.total_opens += log.open_count || 0;
      } else if (log.status === "failed") {
        stats.total_failed++;
      }
    });

    // Calculate open rates
    statsMap.forEach(stats => {
      stats.open_rate = stats.total_sent > 0 
        ? (stats.total_opened / stats.total_sent) * 100 
        : 0;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.total_sent - a.total_sent);
  }, [logs]);

  // Recent opens (last 10)
  const recentOpens = useMemo(() => {
    return logs
      .filter(l => l.opened_at !== null)
      .sort((a, b) => new Date(b.opened_at!).getTime() - new Date(a.opened_at!).getTime())
      .slice(0, 10);
  }, [logs]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOpenRateColor = (rate: number) => {
    if (rate >= 50) return "text-green-400";
    if (rate >= 25) return "text-yellow-400";
    return "text-red-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-xs">Total Sent</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.totalSent}</p>
          </CardContent>
        </Card>

        <Card className="glass border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Unique Opens</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{overallStats.totalOpened}</p>
          </CardContent>
        </Card>

        <Card className="glass border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Open Rate</span>
            </div>
            <p className={`text-2xl font-bold ${getOpenRateColor(overallStats.openRate)}`}>
              {overallStats.openRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointerClick className="w-4 h-4" />
              <span className="text-xs">Total Opens</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{overallStats.totalOpens}</p>
          </CardContent>
        </Card>

        <Card className="glass border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Avg Opens/Email</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.avgOpensPerEmail.toFixed(1)}</p>
          </CardContent>
        </Card>

        <Card className="glass border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{overallStats.failedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Template Stats */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance by Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Template</TableHead>
                <TableHead className="text-muted-foreground text-right">Sent</TableHead>
                <TableHead className="text-muted-foreground text-right">Opened</TableHead>
                <TableHead className="text-muted-foreground">Open Rate</TableHead>
                <TableHead className="text-muted-foreground text-right">Total Opens</TableHead>
                <TableHead className="text-muted-foreground text-right">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No email data available
                  </TableCell>
                </TableRow>
              ) : (
                templateStats.map((stat) => (
                  <TableRow key={stat.template_name} className="border-border">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {stat.template_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{stat.total_sent}</TableCell>
                    <TableCell className="text-right text-blue-400">{stat.total_opened}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={stat.open_rate} 
                          className="h-2 w-20"
                        />
                        <span className={`text-sm font-medium ${getOpenRateColor(stat.open_rate)}`}>
                          {stat.open_rate.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-purple-400">{stat.total_opens}</TableCell>
                    <TableCell className="text-right">
                      {stat.total_failed > 0 ? (
                        <span className="text-red-400">{stat.total_failed}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Opens */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Recent Email Opens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Opened At</TableHead>
                <TableHead className="text-muted-foreground">Recipient</TableHead>
                <TableHead className="text-muted-foreground">Template</TableHead>
                <TableHead className="text-muted-foreground text-right">Open Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOpens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No opens recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                recentOpens.map((log) => (
                  <TableRow key={log.id} className="border-border">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.opened_at!)}
                    </TableCell>
                    <TableCell className="font-medium">{log.to_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.template_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {log.open_count || 1}x
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
