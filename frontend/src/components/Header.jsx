import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, User, ShoppingBag, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";
import { categoryPath, nameToSlug } from "../lib/categorySlug";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const Logo = () => (
  <div className="flex items-center gap-2 select-none">
    <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="7" fill="#111" />
      <g stroke="#111" strokeWidth="2.5" strokeLinecap="round">
        <line x1="20" y1="4" x2="20" y2="10" />
        <line x1="20" y1="30" x2="20" y2="36" />
        <line x1="4" y1="20" x2="10" y2="20" />
        <line x1="30" y1="20" x2="36" y2="20" />
        <line x1="8" y1="8" x2="12.5" y2="12.5" />
        <line x1="27.5" y1="27.5" x2="32" y2="32" />
        <line x1="32" y1="8" x2="27.5" y2="12.5" />
        <line x1="12.5" y1="27.5" x2="8" y2="32" />
      </g>
      <g fill="#111">
        <circle cx="20" cy="4" r="1.6" />
        <circle cx="20" cy="36" r="1.6" />
        <circle cx="4" cy="20" r="1.6" />
        <circle cx="36" cy="20" r="1.6" />
        <circle cx="8" cy="8" r="1.4" />
        <circle cx="32" cy="32" r="1.4" />
        <circle cx="32" cy="8" r="1.4" />
        <circle cx="8" cy="32" r="1.4" />
      </g>
    </svg>
    <span className="font-black tracking-[0.25em] text-[15px] leading-none">
      FASHION <span className="text-red-600">VIRUS</span>
    </span>
  </div>
);

export default function Header({ cartCount = 0, onCartClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");

  const { data: menuLinks = { main: [] } } = useQuery({
    queryKey: ["menu-links"],
    queryFn: publicApi.getMenuLinks,
  });
  const { data: topNavCategories = [] } = useQuery({
    queryKey: ["top-nav-categories"],
    queryFn: publicApi.getTopNavCategories,
  });

  const currentSlug = location.pathname.startsWith("/category/")
    ? location.pathname.split("/category/")[1]
    : location.pathname === "/shop"
      ? null
      : location.pathname === "/"
        ? "discover"
        : null;

  const handleCategoryClick = (name) => {
    navigate(categoryPath(name));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQ.trim())}`);
    }
  };

  const isCatActive = (name) => {
    const slug = nameToSlug(name);
    if (!slug && (location.pathname === "/" || location.pathname === "/shop")) return name.toLowerCase() === "discover";
    return slug === currentSlug;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between px-4 md:px-8 h-14">
        <div className="flex-1 flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <button aria-label="Menu" className="p-2 -ml-2 hover:opacity-70 transition-opacity">
                <Menu strokeWidth={1.5} className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0 bg-white">
              <div className="px-6 py-6 border-b">
                <Logo />
              </div>
              <nav className="py-2">
                {menuLinks.main.map((l) => (
                  <Link
                    key={l.title}
                    to={categoryPath(l.title)}
                    className={`flex items-center justify-between px-6 py-3 text-[13px] tracking-[0.15em] hover:bg-neutral-100 transition-colors ${
                      l.accent ? "text-red-600 font-semibold" : "text-neutral-900"
                    }`}
                  >
                    {l.title}
                    <span className="opacity-40">›</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 flex justify-center">
          <Link to="/" aria-label="Fashion Virus home">
            <Logo />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-end gap-2">
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 border border-neutral-300 rounded-sm pl-3 pr-4 py-1.5 w-[220px] hover:border-black transition-colors">
            <Search strokeWidth={1.5} className="w-4 h-4 text-neutral-500" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder='Search "LINEN SHIRTS"'
              className="bg-transparent outline-none text-[12px] w-full placeholder:text-neutral-500"
            />
          </form>
          <button className="p-2 md:hidden hover:opacity-70">
            <Search strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <button className="p-2 hover:opacity-70 hidden sm:block" aria-label="Wishlist">
            <Heart strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <Link to="/admin" className="p-2 hover:opacity-70" aria-label="Admin">
            <User strokeWidth={1.5} className="w-5 h-5" />
          </Link>
          <button onClick={onCartClick} className="p-2 hover:opacity-70 relative" aria-label="Cart">
            <ShoppingBag strokeWidth={1.5} className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-neutral-100">
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-[11px] text-neutral-700 border-b border-neutral-100">
          <span className="font-medium">Enter Pincode -</span>
          <button className="underline decoration-neutral-400 hover:decoration-black">to check delivery</button>
        </div>
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex items-center justify-start md:justify-center gap-8 px-4 py-3 min-w-max">
            {topNavCategories.map((cat) => {
              const active = isCatActive(cat.name);
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`text-[13px] pb-0.5 border-b-2 transition-all whitespace-nowrap ${
                    active
                      ? "border-black font-semibold text-black"
                      : "border-transparent text-neutral-700 hover:text-black"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
