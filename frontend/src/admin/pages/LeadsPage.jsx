import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { Progress } from "../../components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../../components/ui/sheet";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import {
  Users, Search, RefreshCw, Phone, Eye, ChevronLeft, ChevronRight,
  Flame, Thermometer, Snowflake, CheckCircle2, XCircle, Clock,
  MapPin, ShoppingBag, MessageSquare, Loader2,
} from "lucide-react";
import {
  leadsApi, formatPhone, formatDuration, timeAgo, formatDate,
  scoreColor, scoreBg, statusBadgeClass, parseCategories,
} from "../../lib/leadsApi";

const PAGE_SIZE = 20;

const TAB_FILTERS = [
  { value: "all", label: "All", icon: null },
  { value: "hot", label: "Hot", icon: Flame },
  { value: "warm", label: "Warm", icon: Thermometer },
  { value: "cold", label: "Cold", icon: Snowflake },
  { value: "converted", label: "Converted", icon: CheckCircle2 },
  { value: "lost", label: "Lost", icon: XCircle },
];

function DetailField({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />}
      <div>
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="text-sm font-medium text-neutral-800">{value || "—"}</div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selectedLead, setSelectedLead] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [callLogs, setCallLogs] = useState([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [callingLeadId, setCallingLeadId] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadsApi.getLeads({ limit: 500 });
      setLeads(data.leads || []);
    } catch (e) {
      setError("Failed to load leads. Is the WhatsApp API server running?");
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const { filteredLeads, totalFiltered } = useMemo(() => {
    let filtered = [...leads];
    if (activeTab !== "all") {
      filtered = filtered.filter((l) => l.lead_status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.phone_number && l.phone_number.includes(q)) ||
          (l.collected_name && l.collected_name.toLowerCase().includes(q))
      );
    }
    filtered.sort((a, b) => b.lead_score - a.lead_score);
    return { filteredLeads: filtered, totalFiltered: filtered.length };
  }, [leads, activeTab, searchQuery]);

  const pageLeads = useMemo(
    () => filteredLeads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredLeads, page]
  );
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

  useEffect(() => { setPage(0); }, [activeTab, searchQuery]);

  const openDrawer = async (lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
    setCallLogs([]);
    setCallLogsLoading(true);
    try {
      const logs = await leadsApi.getLeadCalls(lead.chat_id);
      setCallLogs(logs || []);
    } catch { setCallLogs([]); }
    setCallLogsLoading(false);
  };

  const handleCall = async (chatId) => {
    setCallingLeadId(chatId);
    try {
      await leadsApi.triggerCall(chatId);
      await fetchLeads();
    } catch { /* ignore */ }
    setCallingLeadId(null);
  };

  if (error && leads.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <Users className="w-6 h-6 text-red-500" /> Lead Management
        </h2>
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-neutral-600 mb-4">{error}</p>
            <Button onClick={fetchLeads}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6 text-red-500" /> Lead Management
          </h2>
          <p className="text-neutral-500 text-sm mt-1">Track and manage all WhatsApp leads</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLeads}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {TAB_FILTERS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="text-xs gap-1">
                {Icon && <Icon className="w-3 h-3" />}
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : pageLeads.length === 0 ? (
            <p className="text-center text-neutral-400 py-12">
              No leads found matching your filters.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Msgs</TableHead>
                    <TableHead>Searches</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageLeads.map((lead, idx) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-neutral-400 text-xs">{page * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="font-medium max-w-[140px] truncate">
                        {lead.name || lead.collected_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">{formatPhone(lead.phone_number)}</TableCell>
                      <TableCell>
                        <span className={`font-bold text-sm ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</span>
                        <div className="w-14 mt-1">
                          <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                            <div className={`h-full rounded-full ${scoreBg(lead.lead_score)}`} style={{ width: `${lead.lead_score}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(lead.lead_status)}>
                          {lead.lead_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{lead.total_messages}</TableCell>
                      <TableCell className="text-sm">{lead.product_searches}</TableCell>
                      <TableCell className="text-sm">{lead.products_viewed}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {parseCategories(lead.categories_interested).slice(0, 2).map((c) => (
                            <span key={c} className="bg-neutral-100 text-neutral-600 text-[10px] px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                          {parseCategories(lead.categories_interested).length > 2 && (
                            <span className="text-[10px] text-neutral-400">+{parseCategories(lead.categories_interested).length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-500">{timeAgo(lead.last_activity_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDrawer(lead)} title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCall(lead.chat_id)}
                            disabled={lead.call_status === "calling" || callingLeadId === lead.chat_id}
                            title="Call"
                          >
                            {callingLeadId === lead.chat_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-neutral-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalFiltered)} of {totalFiltered} leads
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-xl">{selectedLead.name || selectedLead.collected_name || "Lead"}</SheetTitle>
                <SheetDescription>{formatPhone(selectedLead.phone_number)}</SheetDescription>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={statusBadgeClass(selectedLead.lead_status)}>
                    {selectedLead.lead_status}
                  </Badge>
                  <span className={`text-2xl font-bold ${scoreColor(selectedLead.lead_score)}`}>
                    {selectedLead.lead_score}
                  </span>
                  <span className="text-neutral-400 text-sm">/100</span>
                </div>
                <div className="w-full mt-2">
                  <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBg(selectedLead.lead_score)}`} style={{ width: `${selectedLead.lead_score}%` }} />
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="profile">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
                  <TabsTrigger value="callback" className="text-xs">Callback</TabsTrigger>
                  <TabsTrigger value="collected" className="text-xs">Data</TabsTrigger>
                  <TabsTrigger value="calls" className="text-xs">Calls</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">Engagement Signals</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="Messages" value={selectedLead.total_messages} icon={MessageSquare} />
                    <DetailField label="Product Searches" value={selectedLead.product_searches} icon={Search} />
                    <DetailField label="Products Viewed" value={selectedLead.products_viewed} icon={ShoppingBag} />
                    <DetailField label="Purchase Intents" value={selectedLead.purchase_intent_count} icon={Flame} />
                    <DetailField label="Price Queries" value={selectedLead.price_queries} icon={null} />
                    <DetailField label="Size Queries" value={selectedLead.size_queries} icon={null} />
                  </div>
                  <Separator className="my-4" />
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">Interests</h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {parseCategories(selectedLead.categories_interested).map((c) => (
                      <Badge key={c} className="bg-neutral-100 text-neutral-700 border-neutral-200 text-xs">{c}</Badge>
                    ))}
                    {parseCategories(selectedLead.categories_interested).length === 0 && <span className="text-sm text-neutral-400">No categories yet</span>}
                  </div>
                  <DetailField label="Last Category" value={selectedLead.last_category} />
                  <DetailField label="Last Price Range" value={selectedLead.last_price_range} />
                  <Separator className="my-4" />
                  <DetailField label="First Contact" value={formatDate(selectedLead.first_contact_at)} icon={Clock} />
                  <DetailField label="Last Activity" value={formatDate(selectedLead.last_activity_at)} icon={Clock} />
                </TabsContent>

                <TabsContent value="callback" className="mt-4 space-y-3">
                  <DetailField label="Callback Offered" value={selectedLead.callback_offered ? `Yes — ${formatDate(selectedLead.callback_offered_at)}` : "No"} />
                  <DetailField label="Callback Accepted" value={selectedLead.callback_accepted ? "Yes ✅" : "No"} />
                  <DetailField label="Callback Declined" value={selectedLead.callback_declined ? "Yes ❌" : "No"} />
                  <Separator />
                  <DetailField label="Call Status" value={selectedLead.call_status || "No call"} />
                  {selectedLead.call_status === "completed" && (
                    <>
                      <DetailField label="Duration" value={formatDuration(selectedLead.call_duration)} icon={Clock} />
                      <DetailField label="Call SID" value={selectedLead.call_sid} />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="collected" className="mt-4 space-y-3">
                  <DetailField label="Collected Name" value={selectedLead.collected_name} />
                  <DetailField label="Collected Address" value={selectedLead.collected_address} icon={MapPin} />
                  <DetailField label="Product Interest" value={selectedLead.collected_product_interest} icon={ShoppingBag} />
                  <DetailField label="Call Summary" value={selectedLead.call_summary} />
                  <DetailField label="Call Duration" value={formatDuration(selectedLead.call_duration)} icon={Clock} />
                  {selectedLead.call_recording_url && (
                    <a href={selectedLead.call_recording_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      🔗 Open Recording
                    </a>
                  )}
                </TabsContent>

                <TabsContent value="calls" className="mt-4">
                  {callLogsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : callLogs.length === 0 ? (
                    <p className="text-center text-neutral-400 py-6">No calls have been made to this lead yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {callLogs.map((log) => (
                        <div key={log.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-neutral-500">{log.call_sid?.slice(0, 15)}...</span>
                            <Badge className={statusBadgeClass(log.status)}>{log.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span>Duration: {formatDuration(log.duration)}</span>
                            <span>{formatDate(log.initiated_at)}</span>
                          </div>
                          {(log.transcript || log.collected_data_json) && (
                            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                              {expandedLog === log.id ? "Hide Details" : "Show Details"}
                            </Button>
                          )}
                          {expandedLog === log.id && (
                            <div className="mt-2 space-y-2">
                              {log.transcript && (
                                <div className="bg-neutral-50 rounded p-3 text-xs whitespace-pre-wrap">{log.transcript}</div>
                              )}
                              {log.collected_data_json && (() => {
                                try {
                                  const d = JSON.parse(log.collected_data_json);
                                  return (
                                    <div className="bg-neutral-50 rounded p-3 text-xs space-y-1">
                                      {Object.entries(d).map(([k, v]) => (
                                        <div key={k}><span className="font-medium">{k}:</span> {String(v)}</div>
                                      ))}
                                    </div>
                                  );
                                } catch { return null; }
                              })()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
