import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { Separator } from "../../components/ui/separator";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
} from "recharts";
import {
  Activity, Brain, Phone, Volume2, MessageSquare,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Zap, Clock, PhoneCall, WifiOff, Loader2,
} from "lucide-react";
import {
  leadsApi, formatDuration, formatPhone, formatDate, timeAgo, statusBadgeClass,
} from "../../lib/leadsApi";

const SERVICES = [
  { key: "hypersender_configured", label: "WhatsApp Bot", icon: MessageSquare, onLabel: "Online", offLabel: "Offline" },
  { key: "openai_configured", label: "AI Intent Engine", icon: Brain, onLabel: "Online", offLabel: "Offline" },
  { key: "twilio_configured", label: "Twilio Calling", icon: Phone, onLabel: "Configured", offLabel: "Not Configured" },
  { key: "elevenlabs_configured", label: "ElevenLabs Voice AI", icon: Volume2, onLabel: "Configured", offLabel: "Not Configured" },
  { key: "lead_scoring", label: "Lead Scoring Engine", icon: Activity, onLabel: "Active", offLabel: "Inactive" },
];

const PIE_COLORS = { completed: "#22c55e", failed: "#ef4444", "no-answer": "#9ca3af", "no_answer": "#9ca3af", busy: "#f97316", canceled: "#6b7280", other: "#a3a3a3" };
const DURATION_RANGES = ["0-30s", "30s-1m", "1-2m", "2-3m", "3m+"];

function getDurationBucket(seconds) {
  if (seconds <= 30) return "0-30s";
  if (seconds <= 60) return "30s-1m";
  if (seconds <= 120) return "1-2m";
  if (seconds <= 180) return "2-3m";
  return "3m+";
}

export default function AgentHealthPage() {
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const h = await leadsApi.getHealth();
      setHealth(h);
      setHealthError(false);
    } catch {
      setHealthError(true);
    }
    setLastChecked(new Date());
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [, leadsData] = await Promise.allSettled([
        fetchHealth(),
        leadsApi.getLeads({ limit: 500 }),
      ]);
      if (leadsData.status === "fulfilled") setLeads(leadsData.value.leads || []);
    } catch { /* partial OK */ }
    setLoading(false);
  }, [fetchHealth]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchHealth, 15000);
    return () => clearInterval(iv);
  }, [fetchAll, fetchHealth]);

  // Call analytics
  const callLeads = useMemo(() => leads.filter((l) => l.call_sid || l.call_status), [leads]);

  const outcomeData = useMemo(() => {
    const counts = {};
    callLeads.forEach((l) => {
      const s = l.call_status || "other";
      const key = ["no-answer", "no_answer"].includes(s) ? "no-answer" : s;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name === "no-answer" ? "No Answer" : name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: PIE_COLORS[name] || PIE_COLORS.other,
    }));
  }, [callLeads]);

  const successRate = useMemo(() => {
    if (callLeads.length === 0) return null;
    const completed = callLeads.filter((l) => l.call_status === "completed").length;
    return ((completed / callLeads.length) * 100).toFixed(0);
  }, [callLeads]);

  const durationData = useMemo(() => {
    const buckets = {};
    DURATION_RANGES.forEach((r) => { buckets[r] = 0; });
    callLeads
      .filter((l) => l.call_status === "completed" && l.call_duration)
      .forEach((l) => { buckets[getDurationBucket(l.call_duration)]++; });
    return DURATION_RANGES.map((r) => ({ range: r, count: buckets[r] }));
  }, [callLeads]);

  // Recent call timeline
  const recentCalls = useMemo(
    () => [...callLeads].sort((a, b) => new Date(b.called_at || 0) - new Date(a.called_at || 0)).slice(0, 20),
    [callLeads]
  );

  // Failure analysis
  const failures = useMemo(() => {
    const groups = {};
    callLeads.forEach((l) => {
      if (["failed", "no-answer", "no_answer", "busy", "canceled"].includes(l.call_status)) {
        const key = l.call_status === "no_answer" ? "no-answer" : l.call_status;
        groups[key] = (groups[key] || 0) + 1;
      }
    });
    return groups;
  }, [callLeads]);

  const handleTestCall = async () => {
    if (!testPhone.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await leadsApi.triggerCall(testPhone.trim());
      setTestResult({ success: true, message: `Call initiated! SID: ${res.call_sid}` });
    } catch (e) {
      setTestResult({ success: false, message: e.response?.data?.detail || "Failed to initiate call" });
    }
    setTestLoading(false);
  };

  const dotColor = (s) => ({ completed: "bg-emerald-500", failed: "bg-red-500", calling: "bg-yellow-500", pending: "bg-yellow-500", "in-progress": "bg-yellow-500" }[s] || "bg-neutral-400");

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 rounded-lg mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="w-6 h-6 text-red-500" /> Agent Health
          </h2>
          <p className="text-neutral-500 text-sm mt-1">Monitor calling agent status &amp; performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Service Status */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Service Status</CardTitle>
            <CardDescription>Real-time monitoring of all AI agent services</CardDescription>
          </div>
          {lastChecked && <span className="text-xs text-neutral-400">Last checked: {timeAgo(lastChecked.toISOString())}</span>}
        </CardHeader>
        <CardContent>
          {healthError ? (
            <div className="flex flex-col items-center py-8 text-red-500">
              <WifiOff className="w-8 h-8 mb-2" />
              <p className="font-medium">Unable to connect to WhatsApp API server</p>
              <p className="text-sm text-neutral-400 mt-1">Make sure the server is running at the configured URL</p>
            </div>
          ) : (
            <div>
              {SERVICES.map(({ key, label, icon: Icon, onLabel, offLabel }) => {
                const isOn = key === "lead_scoring" ? !!health?.[key] : health?.[key] === true;
                return (
                  <div key={key} className="flex items-center gap-4 py-3 border-b last:border-0">
                    <div className={`w-3 h-3 rounded-full ${isOn ? "bg-emerald-500" : "bg-red-500"}`} />
                    <Icon className="w-5 h-5 text-neutral-400" />
                    <span className="font-medium text-sm flex-1">{label}</span>
                    <span className={`text-sm font-medium ${isOn ? "text-emerald-600" : "text-red-500"}`}>
                      {isOn ? onLabel : offLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Call Outcomes Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            {outcomeData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {outcomeData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                {successRate !== null && (
                  <div className="text-center mt-2">
                    <span className="text-sm text-neutral-500">Success Rate: </span>
                    <span className={`text-2xl font-bold ${Number(successRate) >= 70 ? "text-emerald-600" : Number(successRate) >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                      {successRate}%
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-neutral-400 py-12">No calls made yet</p>
            )}
          </CardContent>
        </Card>

        {/* Duration Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Duration Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {durationData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={durationData}>
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-neutral-400 py-12">No completed calls to analyze</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Call Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Recent Call Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCalls.length > 0 ? (
            <div className="border-l-2 border-neutral-200 ml-3 space-y-4">
              {recentCalls.map((lead) => (
                <div key={lead.id} className="flex items-start gap-3 -ml-[7px]">
                  <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${dotColor(lead.call_status)}`} />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{lead.name || formatPhone(lead.phone_number)}</span>
                      <span className="text-neutral-500"> — </span>
                      <Badge className={`${statusBadgeClass(lead.call_status || "pending")} text-[10px]`}>
                        {lead.call_status || "pending"}
                      </Badge>
                      {lead.call_status === "completed" && lead.call_duration && (
                        <span className="text-neutral-500 ml-1">{formatDuration(lead.call_duration)}</span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400">{timeAgo(lead.called_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-400 py-8">No call activity yet</p>
          )}
        </CardContent>
      </Card>

      {/* Failure Analysis */}
      {Object.keys(failures).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Failure Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(failures).map(([status, count]) => (
              <div key={status} className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium">{count} call{count > 1 ? "s" : ""} — {status}</div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {status === "no-answer" && "Consider adjusting call timing — customers may be unavailable during current hours"}
                    {status === "failed" && "Check Twilio configuration and phone number validity"}
                    {status === "busy" && "Customers were on other calls — system will retry automatically"}
                    {status === "canceled" && "Calls were canceled before connecting"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Testing Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Test Call
          </CardTitle>
          <CardDescription>Verify the calling system works end-to-end</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-lg">
            <Input
              placeholder="Enter lead chat_id (e.g., 919876543210@c.us)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Button onClick={handleTestCall} disabled={testLoading || !testPhone.trim()}>
              {testLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <PhoneCall className="w-4 h-4 mr-1" />}
              Make Test Call
            </Button>
          </div>
          {testResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${testResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
