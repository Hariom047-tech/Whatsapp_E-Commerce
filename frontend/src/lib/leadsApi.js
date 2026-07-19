import axios from "axios";

// ─── WhatsApp API (separate FastAPI server) ────────────────
const WA_API_BASE = process.env.REACT_APP_WA_API_URL || "http://3.108.126.237";

const waApi = axios.create({
  baseURL: WA_API_BASE,
  timeout: 15000,
});

// ─── Utility helpers ───────────────────────────────────────

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatPhone(phone) {
  if (!phone) return "—";
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("+91") && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
  }
  return cleaned;
}

export function timeAgo(dateString) {
  if (!dateString) return "—";
  const now = new Date();
  const then = new Date(dateString);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 0) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return then.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-IN", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export function scoreColor(score) {
  if (score >= 61) return "text-red-500";
  if (score >= 31) return "text-orange-500";
  return "text-blue-500";
}

export function scoreBg(score) {
  if (score >= 61) return "bg-red-500";
  if (score >= 31) return "bg-orange-500";
  return "bg-blue-500";
}

export function statusColor(status) {
  const map = {
    hot: "text-red-500",
    warm: "text-orange-500",
    cold: "text-blue-500",
    converted: "text-emerald-500",
    lost: "text-neutral-400",
    calling: "text-yellow-500",
    completed: "text-emerald-500",
    failed: "text-red-500",
    pending: "text-yellow-500",
    "no-answer": "text-neutral-400",
    "no_answer": "text-neutral-400",
    busy: "text-orange-500",
    canceled: "text-neutral-400",
    initiated: "text-blue-500",
    ringing: "text-yellow-500",
    "in-progress": "text-yellow-500",
  };
  return map[status] || "text-neutral-500";
}

export function statusBadgeClass(status) {
  const map = {
    hot: "bg-red-500/10 text-red-600 border-red-200",
    warm: "bg-orange-500/10 text-orange-600 border-orange-200",
    cold: "bg-blue-500/10 text-blue-600 border-blue-200",
    converted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    lost: "bg-neutral-500/10 text-neutral-500 border-neutral-200",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    failed: "bg-red-500/10 text-red-600 border-red-200",
    calling: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    "no-answer": "bg-neutral-500/10 text-neutral-500 border-neutral-200",
    "no_answer": "bg-neutral-500/10 text-neutral-500 border-neutral-200",
    initiated: "bg-blue-500/10 text-blue-600 border-blue-200",
    ringing: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    "in-progress": "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    busy: "bg-orange-500/10 text-orange-600 border-orange-200",
    canceled: "bg-neutral-500/10 text-neutral-500 border-neutral-200",
  };
  return map[status] || "bg-neutral-100 text-neutral-500 border-neutral-200";
}

export function parseCategories(jsonString) {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── API Functions ─────────────────────────────────────────

export const leadsApi = {
  getLeads: (params) => waApi.get("/api/leads", { params }).then((r) => r.data),
  getHotLeads: () => waApi.get("/api/leads/hot").then((r) => r.data),
  getLeadStats: () => waApi.get("/api/leads/stats").then((r) => r.data),
  getLead: (chatId) => waApi.get(`/api/leads/${encodeURIComponent(chatId)}`).then((r) => r.data),
  getLeadCalls: (chatId) => waApi.get(`/api/leads/${encodeURIComponent(chatId)}/calls`).then((r) => r.data),
  triggerCall: (chatId) => waApi.post(`/api/leads/${encodeURIComponent(chatId)}/call`).then((r) => r.data),
  getHealth: () => waApi.get("/health").then((r) => r.data),
};
