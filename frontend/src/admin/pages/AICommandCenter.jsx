import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Progress } from "../../components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  Flame, Thermometer, Snowflake, Phone, CheckCircle2, DollarSign,
  Users, RefreshCw, Brain, Activity, Volume2, MessageSquare, WifiOff,
} from "lucide-react";
import {
  leadsApi, formatPhone, timeAgo, scoreColor, scoreBg, statusBadgeClass,
  parseCategories,
} from "../../lib/leadsApi";

const KPI_CARDS = [
  { key: "total_leads", label: "Total Leads", icon: Users, bg: "bg-neutral-100", color: "text-neutral-700" },
  { key: "hot_leads", label: "Hot", icon: Flame, bg: "bg-red-100", color: "text-red-600" },
  { key: "warm_leads", label: "Warm", icon: Thermometer, bg: "bg-orange-100", color: "text-orange-600" },
  { key: "cold_leads", label: "Cold", icon: Snowflake, bg: "bg-blue-100", color: "text-blue-600" },
  { key: "calls_made", label: "Calls Made", icon: Phone, bg: "bg-violet-100", color: "text-violet-600" },
  { key: "calls_completed", label: "Completed", icon: CheckCircle2, bg: "bg-emerald-100", color: "text-emerald-600" },
  { key: "converted", label: "Converted", icon: DollarSign, bg: "bg-amber-100", color: "text-amber-600" },
];

const FUNNEL_COLORS = ["#3b82f6", "#f97316", "#ef4444", "#8b5cf6", "#10b981", "#f59e0b"];

const SERVICES = [
  { key: "hypersender_configured", label: "WhatsApp Bot", icon: MessageSquare, onLabel: "Online", offLabel: "Offline" },
  { key: "openai_configured", label: "AI Intent Engine", icon: Brain, onLabel: "Online", offLabel: "Offline" },
  { key: "twilio_configured", label: "Twilio Calling", icon: Phone, onLabel: "Configured", offLabel: "Not Configured" },
  { key: "elevenlabs_configured", label: "ElevenLabs Voice", icon: Volume2, onLabel: "Configured", offLabel: "Not Configured" },
  { key: "lead_scoring", label: "Lead Scoring", icon: Activity, onLabel: "Active", offLabel: "Inactive" },
];

export default function AICommandCenter() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [hotLeads, setHotLeads] = useState(null);
  const [health, setHealth] = useState(null);
  const [allLeads, setAllLeads] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const results = await Promise.allSettled([
        leadsApi.getLeadStats(),
        leadsApi.getHotLeads(),
        leadsApi.getHealth(),
        leadsApi.getLeads({ limit: 100 }),
      ]);
      if (results[0].status === "fulfilled") setStats(results[0].value);
      if (results[1].status === "fulfilled") setHotLeads(results[1].value);
      if (results[2].status === "fulfilled") setHealth(results[2].value);
      if (results[3].status === "fulfilled") setAllLeads(results[3].value);
      setLastUpdated(new Date());
    } catch { /* partial OK */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(() => fetchAll(), 30000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const funnelData = stats
    ? [
        { name: "Total Leads", value: stats.total_leads },
        { name: "Warm", value: stats.warm_leads },
        { name: "Hot", value: stats.hot_leads },
        { name: "Calls Made", value: stats.calls_made },
        { name: "Completed", value: stats.calls_completed },
        { name: "Converted", value: stats.converted },
      ]
    : [];

  const recentLeads = allLeads?.leads
    ? [...allLeads.leads]
        .sort((a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at))
        .slice(0, 10)
    : [];

  const dotColor = (s) =>
    ({ hot: "bg-red-500", warm: "bg-orange-500", cold: "bg-blue-500", converted: "bg-emerald-500" }[s] || "bg-neutral-400");

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg mt-6" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-semibold">AI Command Center</h2>
          </div>
          <p className="text-neutral-500 text-sm mt-1">
            Real-time lead qualification &amp; calling agent dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-neutral-400">Updated {timeAgo(lastUpdated.toISOString())}</span>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchAll(true)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {KPI_CARDS.map(({ key, label, icon: Icon, bg, color }) => (
          <Card key={key} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => key === "hot_leads" ? navigate("/admin/leads") : null}>
            <CardContent className="pt-5 pb-4 px-4">
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-3xl font-bold text-neutral-900">
                {stats?.[key] ?? "—"}
              </div>
              <div className="text-sm text-neutral-500 mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28} label={{ position: "right", fontSize: 13, fontWeight: 600 }}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-neutral-400 py-12">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {health ? (
              <div className="space-y-0">
                {SERVICES.map(({ key, label, icon: Icon, onLabel, offLabel }) => {
                  const isOn = key === "lead_scoring" ? !!health[key] : health[key] === true;
                  return (
                    <div key={key} className="flex items-center gap-3 py-3 border-b last:border-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${isOn ? "bg-emerald-500" : "bg-red-500"}`} />
                      <Icon className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium text-sm flex-1">{label}</span>
                      <span className={`text-sm ${isOn ? "text-emerald-600" : "text-red-500"}`}>
                        {isOn ? onLabel : offLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                <WifiOff className="w-8 h-8 mb-2" />
                <p className="text-sm">Unable to connect to WhatsApp API server</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hot Leads Table */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Hot Leads</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/leads")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {hotLeads?.leads?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotLeads.leads.slice(0, 5).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name || lead.collected_name || "—"}</TableCell>
                    <TableCell className="text-sm text-neutral-500">{formatPhone(lead.phone_number)}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</span>
                      <Progress value={lead.lead_score} className="h-1.5 mt-1 w-16" />
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(lead.lead_status)}>
                        {lead.lead_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {parseCategories(lead.categories_interested).slice(0, 2).map((c) => (
                          <span key={c} className="bg-neutral-100 text-neutral-600 text-[10px] px-1.5 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">{timeAgo(lead.last_activity_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => leadsApi.triggerCall(lead.chat_id).catch(() => {})}
                        disabled={lead.call_status === "calling"}
                      >
                        <Phone className="w-3.5 h-3.5 mr-1" /> Call
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-neutral-400 py-8">
              No hot leads yet. Leads will appear as customers engage with the WhatsApp bot.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeads.length > 0 ? (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-3 py-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor(lead.lead_status)}`} />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{lead.name || formatPhone(lead.phone_number)}</span>
                    <span className="text-neutral-500">
                      {" "}— Score: {lead.lead_score} ({lead.lead_status})
                      {lead.call_status === "completed" && " • Call completed"}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">{timeAgo(lead.last_activity_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-400 py-6">No activity yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
