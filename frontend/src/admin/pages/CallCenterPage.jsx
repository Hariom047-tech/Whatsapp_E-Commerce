import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../../components/ui/dialog";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Phone, CheckCircle2, XCircle, Clock, FileText, Database,
  ExternalLink, RefreshCw, PhoneOff,
} from "lucide-react";
import {
  leadsApi, formatPhone, formatDuration, formatDate, statusBadgeClass,
} from "../../lib/leadsApi";

const STATUS_FILTERS = ["all", "completed", "failed", "no-answer", "calling"];

function statusLabel(s) {
  return ({ "no-answer": "No Answer", "no_answer": "No Answer", calling: "In Progress" }[s] || s);
}

export default function CallCenterPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [transcriptDialog, setTranscriptDialog] = useState({ open: false, text: "", name: "" });
  const [dataDialog, setDataDialog] = useState({ open: false, lead: null, name: "" });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadsApi.getLeads({ limit: 500 });
      setLeads(data.leads || []);
    } catch {
      setError("Failed to connect to WhatsApp API server.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const callLeads = useMemo(
    () => leads.filter((l) => l.call_sid || l.call_status),
    [leads]
  );

  const filtered = useMemo(() => {
    let list = [...callLeads];
    if (statusFilter !== "all") {
      list = list.filter((l) => {
        const s = l.call_status || "";
        if (statusFilter === "failed") return ["failed", "busy", "canceled"].includes(s);
        if (statusFilter === "no-answer") return ["no-answer", "no_answer"].includes(s);
        if (statusFilter === "calling") return ["calling", "in-progress", "initiated", "ringing", "pending"].includes(s);
        return s === statusFilter;
      });
    }
    list.sort((a, b) => new Date(b.called_at || 0) - new Date(a.called_at || 0));
    return list;
  }, [callLeads, statusFilter]);

  const stats = useMemo(() => {
    const total = callLeads.length;
    const completed = callLeads.filter((l) => l.call_status === "completed").length;
    const failed = callLeads.filter((l) => ["failed", "no-answer", "no_answer", "busy", "canceled"].includes(l.call_status)).length;
    const durations = callLeads.filter((l) => l.call_status === "completed" && l.call_duration).map((l) => l.call_duration);
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    return { total, completed, failed, avgDuration };
  }, [callLeads]);

  const statCards = [
    { label: "Total Calls", value: stats.total, icon: Phone, bg: "bg-violet-100", color: "text-violet-600" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, bg: "bg-emerald-100", color: "text-emerald-600" },
    { label: "Failed / No Answer", value: stats.failed, icon: XCircle, bg: "bg-red-100", color: "text-red-600" },
    { label: "Avg Duration", value: formatDuration(stats.avgDuration), icon: Clock, bg: "bg-blue-100", color: "text-blue-600" },
  ];

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Phone className="w-6 h-6 text-red-500" /> Call Center
          </h2>
          <p className="text-neutral-500 text-sm mt-1">AI calling agent activity &amp; call history</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, bg, color }) => (
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

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="capitalize text-xs"
          >
            {s === "all" ? "All" : statusLabel(s)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <PhoneOff className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">No calls found</p>
              <p className="text-neutral-400 text-sm mt-1">
                Calls will appear here once the AI calling agent starts contacting leads.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Call SID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead, idx) => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-neutral-400 text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{lead.name || lead.collected_name || "—"}</TableCell>
                    <TableCell className="text-sm text-neutral-500">{formatPhone(lead.phone_number)}</TableCell>
                    <TableCell className="text-xs font-mono text-neutral-500">
                      {lead.call_sid ? `${lead.call_sid.slice(0, 15)}...` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(lead.call_status || "pending")}>
                        {["calling", "in-progress", "pending", "initiated", "ringing"].includes(lead.call_status) && (
                          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse inline-block mr-1.5" />
                        )}
                        {statusLabel(lead.call_status || "pending")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDuration(lead.call_duration)}</TableCell>
                    <TableCell className="text-sm text-neutral-500">{formatDate(lead.called_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="sm" title="View Transcript"
                          disabled={!lead.call_summary}
                          onClick={() => setTranscriptDialog({ open: true, text: lead.call_summary || "", name: lead.name || lead.collected_name || "Lead" })}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" title="View Collected Data"
                          disabled={!lead.collected_name && !lead.collected_address && !lead.collected_product_interest}
                          onClick={() => setDataDialog({ open: true, lead, name: lead.name || lead.collected_name || "Lead" })}
                        >
                          <Database className="w-4 h-4" />
                        </Button>
                        {lead.call_recording_url && (
                          <Button variant="ghost" size="sm" title="Recording" onClick={() => window.open(lead.call_recording_url, "_blank")}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog open={transcriptDialog.open} onOpenChange={(v) => setTranscriptDialog((s) => ({ ...s, open: v }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Call Transcript — {transcriptDialog.name}</DialogTitle>
            <DialogDescription>Full conversation transcript from the AI call</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="bg-neutral-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
              {transcriptDialog.text || "No transcript available for this call."}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Collected Data Dialog */}
      <Dialog open={dataDialog.open} onOpenChange={(v) => setDataDialog((s) => ({ ...s, open: v }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collected Data — {dataDialog.name}</DialogTitle>
            <DialogDescription>Information gathered during the AI call</DialogDescription>
          </DialogHeader>
          {dataDialog.lead && (
            <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
              {[
                ["Name", dataDialog.lead.collected_name],
                ["Address", dataDialog.lead.collected_address],
                ["Product Interest", dataDialog.lead.collected_product_interest],
                ["Call Summary", dataDialog.lead.call_summary],
                ["Duration", formatDuration(dataDialog.lead.call_duration)],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <span className="font-medium text-neutral-500">{label}</span>
                  <span className="text-neutral-900">{value || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
