import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { publicApi } from "../lib/api";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";
  const categorySlug = slug || null;
  const { addToCart } = useCart();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: publicApi.getCategories,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", categorySlug],
    queryFn: () => publicApi.getProducts(categorySlug),
  });

  const filtered = searchQuery
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery))
    : products;

  const category = categories.find((c) => c.slug === categorySlug);
  const title = searchQuery
    ? `SEARCH: "${searchQuery.toUpperCase()}"`
    : category?.name || (slug ? slug.replace(/-/g, " ").toUpperCase() : "ALL PRODUCTS");

  return (
    <div className="px-4 md:px-8 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-[11px] tracking-wider text-neutral-500 mb-6">
        <Link to="/" className="hover:text-black">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">{title}</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-4xl tracking-[0.15em]">{title}</h1>
        <p className="text-sm text-neutral-500 mt-2">
          {isLoading ? "Loading..." : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-500 mb-4">No products in this category yet.</p>
          <Link to="/shop" className="text-sm font-semibold tracking-widest border-b-2 border-black pb-0.5">
            BROWSE ALL PRODUCTS
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={(prod) => addToCart(prod)} />
          ))}
        </div>
      )}
    </div>
  );
}
