import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Image, Package, Tag, Megaphone, Menu, Footprints,
  Sparkles, Grid3x3, Percent, LogOut, ChevronRight, Shirt
} from "lucide-react";
import { Button } from "../components/ui/button";

const nav = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/hero-slides", label: "Hero Carousel", icon: Image },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/categories", label: "Categories", icon: Tag },
  { path: "/admin/featured-categories", label: "Featured Categories", icon: Grid3x3 },
  { path: "/admin/editorial-tiles", label: "Editorial Tiles", icon: Sparkles },
  { path: "/admin/steals", label: "Steals Section", icon: Percent },
  { path: "/admin/promo-banner", label: "Promo Banner", icon: Shirt },
  { path: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { path: "/admin/top-nav-categories", label: "Nav Categories", icon: Menu },
  { path: "/admin/menu-links", label: "Menu Links", icon: Menu },
  { path: "/admin/footer", label: "Footer", icon: Footprints },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("fv_admin_token");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <aside className="w-64 bg-neutral-950 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-neutral-800">
          <div className="font-black tracking-widest text-sm">
            FASHION <span className="text-red-500">VIRUS</span>
          </div>
          <div className="text-[10px] text-neutral-500 tracking-wider mt-1">ADMIN PANEL</div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map(({ path, label, icon: Icon, exact }) => {
            const isActive = exact
              ? location.pathname === path
              : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-5 py-2.5 text-[13px] transition-colors ${
                  isActive ? "bg-white/10 text-white border-r-2 border-red-500" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-neutral-800 space-y-2">
          <Link to="/" className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white">
            <ChevronRight className="w-3 h-3" /> View Website
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white w-full">
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-neutral-900">Website Management</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>Preview Site</Button>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
