import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";
import ProductCard from "./ProductCard";

export default function ProductGrid({ onAdd, limit }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => publicApi.getProducts(),
  });

  const displayProducts = limit ? products.slice(0, limit) : products;

  if (isLoading) {
    return (
      <section className="px-4 md:px-8 py-10 md:py-14 bg-white">
        <div className="h-8 w-48 bg-neutral-100 animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-8 py-10 md:py-14 bg-white">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl tracking-[0.15em]">NEW DROPS</h2>
          <p className="text-xs md:text-sm text-neutral-500 mt-1 tracking-wide">Freshly landed this week</p>
        </div>
        <Link to="/shop" className="text-[11px] md:text-xs tracking-[0.2em] font-semibold border-b-2 border-black pb-0.5 hover:opacity-70">
          VIEW ALL
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {displayProducts.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}
