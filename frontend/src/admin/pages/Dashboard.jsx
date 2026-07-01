import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Package, Tag, Image, Megaphone } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: "Products", value: stats?.products, icon: Package, path: "/admin/products" },
    { label: "Categories", value: stats?.categories, icon: Tag, path: "/admin/categories" },
    { label: "Hero Slides", value: stats?.heroSlides, icon: Image, path: "/admin/hero-slides" },
    { label: "Announcements", value: stats?.announcements, icon: Megaphone, path: "/admin/announcements" },
  ];

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
    </div>
  );
}
