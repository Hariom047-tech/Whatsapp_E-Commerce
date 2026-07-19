import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../lib/api";
import { leadsApi } from "../../lib/leadsApi";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { Package, Tag, Image, Megaphone, Brain, Flame, Phone, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [aiError, setAiError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => {});
    leadsApi.getLeadStats().then(setAiStats).catch(() => setAiError(true));
  }, []);

  const cards = [
    { label: "Products", value: stats?.products, icon: Package, path: "/admin/products" },
    { label: "Categories", value: stats?.categories, icon: Tag, path: "/admin/categories" },
    { label: "Hero Slides", value: stats?.heroSlides, icon: Image, path: "/admin/hero-slides" },
    { label: "Announcements", value: stats?.announcements, icon: Megaphone, path: "/admin/announcements" },
  ];

  const conversionRate = aiStats && aiStats.total_leads > 0
    ? ((aiStats.converted / aiStats.total_leads) * 100).toFixed(1)
    : "0";

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
      <p className="text-neutral-500 mb-8">Manage your Fashion Virus website content from here.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, path }) => (
          <Link key={label} to={path}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500">{label}</CardTitle>
                <Icon className="w-4 h-4 text-neutral-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{value ?? "—"}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Quick Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600 space-y-2">
          <p><strong>Hero Carousel</strong> — Manage homepage hero banner images and text.</p>
          <p><strong>Products</strong> — Add, edit, or remove product items shown in New Drops.</p>
          <p><strong>Featured Categories</strong> — Control the category grid on the homepage.</p>
          <p><strong>Announcements</strong> — Edit the scrolling top bar messages.</p>
          <p><strong>Promo Banner</strong> — Customize the sale/promo section.</p>
        </CardContent>
      </Card>

      {/* AI Agent Status */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-red-500" /> AI Agent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiError ? (
            <div className="text-center py-4">
              <p className="text-neutral-500 text-sm">AI Agent not connected. Make sure WhatsApp API server is running.</p>
            </div>
          ) : aiStats ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-red-50">
                  <Flame className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-600">{aiStats.hot_leads}</div>
                  <div className="text-xs text-neutral-500">Hot Leads</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-violet-50">
                  <Phone className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-violet-600">{aiStats.calls_made}</div>
                  <div className="text-xs text-neutral-500">Calls Made</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50">
                  <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-emerald-600">{conversionRate}%</div>
                  <div className="text-xs text-neutral-500">Conversion</div>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate("/admin/ai-dashboard")}>
                Open Command Center →
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
