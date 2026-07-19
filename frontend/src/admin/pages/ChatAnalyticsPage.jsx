import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { Progress } from "../../components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  MessageSquare, Search, ShoppingBag, TrendingUp, BarChart3,
  RefreshCw, Users,
} from "lucide-react";
import {
  leadsApi, scoreColor, scoreBg, statusBadgeClass,
  parseCategories, formatPhone, timeAgo,
} from "../../lib/leadsApi";

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

function scoreRangeColor(range) {
  const low = parseInt(range.split("-")[0]);
  if (low >= 61) return "#ef4444";
  if (low >= 31) return "#f97316";
  return "#3b82f6";
}

export default function ChatAnalyticsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getLeads({ limit: 500 });
      setLeads(data.leads || []);
    } catch {
      setError("Failed to connect to WhatsApp API server.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Overview stats
  const overview = useMemo(() => {
    const total = leads.length;
    const totalMsgs = leads.reduce((s, l) => s + (l.total_messages || 0), 0);
    const totalSearches = leads.reduce((s, l) => s + (l.product_searches || 0), 0);
    const avg = total ? (totalMsgs / total).toFixed(1) : "0";
    const searchRate = totalMsgs ? ((totalSearches / totalMsgs) * 100).toFixed(1) : "0";
    return { total, totalMsgs, avg, searchRate };
  }, [leads]);

  // Score distribution histogram
  const scoreDistribution = useMemo(() => {
    const buckets = {};
    const ranges = ["0-10", "11-20", "21-30", "31-40", "41-50", "51-60", "61-70", "71-80", "81-90", "91-100"];
    ranges.forEach((r) => { buckets[r] = 0; });
    leads.forEach((l) => {
      const s = l.lead_score || 0;
      if (s <= 10) buckets["0-10"]++;
      else if (s <= 20) buckets["11-20"]++;
      else if (s <= 30) buckets["21-30"]++;
      else if (s <= 40) buckets["31-40"]++;
      else if (s <= 50) buckets["41-50"]++;
      else if (s <= 60) buckets["51-60"]++;
      else if (s <= 70) buckets["61-70"]++;
      else if (s <= 80) buckets["71-80"]++;
      else if (s <= 90) buckets["81-90"]++;
      else buckets["91-100"]++;
    });
    return ranges.map((r) => ({ range: r, count: buckets[r], fill: scoreRangeColor(r) }));
  }, [leads]);

  // Category popularity
  const categoryData = useMemo(() => {
    const freq = {};
    leads.forEach((l) => {
      parseCategories(l.categories_interested).forEach((c) => {
        freq[c] = (freq[c] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Intent distribution
  const intentData = useMemo(() => [
    { name: "Product Searches", value: leads.reduce((s, l) => s + (l.product_searches || 0), 0) },
    { name: "Purchase Intents", value: leads.reduce((s, l) => s + (l.purchase_intent_count || 0), 0) },
    { name: "Price Queries", value: leads.reduce((s, l) => s + (l.price_queries || 0), 0) },
    { name: "Size Queries", value: leads.reduce((s, l) => s + (l.size_queries || 0), 0) },
  ], [leads]);

  // Top 10 leads
  const topLeads = useMemo(
    () => [...leads].sort((a, b) => b.lead_score - a.lead_score).slice(0, 10),
    [leads]
  );

  const overviewCards = [
    { label: "Total Conversations", value: overview.total, icon: Users, bg: "bg-blue-100", color: "text-blue-600" },
    { label: "Total Messages", value: overview.totalMsgs.toLocaleString(), icon: MessageSquare, bg: "bg-violet-100", color: "text-violet-600" },
    { label: "Avg Msgs/Lead", value: overview.avg, icon: TrendingUp, bg: "bg-emerald-100", color: "text-emerald-600" },
    { label: "Search Rate", value: `${overview.searchRate}%`, icon: Search, bg: "bg-amber-100", color: "text-amber-600" },
  ];

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-80 rounded-lg mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-500" /> Chat Analytics
          </h2>
          <p className="text-neutral-500 text-sm mt-1">WhatsApp chatbot performance &amp; customer insights</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {overviewCards.map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4 px-4">
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{value}</div>
              <div className="text-sm text-neutral-500 mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Lead Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                  {scoreDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-neutral-400 py-12">No data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Category Popularity + Intent Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Popular Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-neutral-400 py-12">No category data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Intent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Intent Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={intentData} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 Leads by Score</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topLeads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Categories</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLeads.map((lead, idx) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="bg-neutral-200 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{lead.name || lead.collected_name || "—"}</TableCell>
                    <TableCell className="text-sm text-neutral-500">{formatPhone(lead.phone_number)}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</span>
                      <div className="w-14 mt-1">
                        <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                          <div className={`h-full rounded-full ${scoreBg(lead.lead_score)}`} style={{ width: `${lead.lead_score}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(lead.lead_status)}>{lead.lead_status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{lead.total_messages}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {parseCategories(lead.categories_interested).slice(0, 3).map((c) => (
                          <span key={c} className="bg-neutral-100 text-neutral-600 text-[10px] px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-neutral-400 py-8">No data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
