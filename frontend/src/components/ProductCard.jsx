import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { productPath } from "../lib/categorySlug";
import { useToast } from "../hooks/use-toast";

export default function ProductCard({ product, onAdd, compact = false }) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd?.(product);
    toast({ title: `${product.name} added to bag`, duration: 1600 });
  };

  const toggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked((v) => !v);
    toast({ title: !liked ? "Added to wishlist" : "Removed from wishlist", duration: 1500 });
  };

  return (
    <Link to={productPath(product.id)} className="group relative block">
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover card-img transition-opacity duration-500 group-hover:opacity-0"
        />
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {product.tag && (
          <span className="absolute top-3 left-3 bg-white text-black text-[9px] md:text-[10px] font-bold tracking-[0.2em] px-2 py-1">
            {product.tag}
          </span>
        )}

        <button
          onClick={toggleLike}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-all z-10"
          aria-label="Wishlist"
        >
          <Heart strokeWidth={1.5} className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-black"}`} />
        </button>

        {onAdd && (
          <button
            onClick={handleAdd}
            className="absolute inset-x-3 bottom-3 bg-black text-white text-[11px] tracking-[0.2em] font-semibold py-2.5 flex items-center justify-center gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-neutral-800 z-10"
          >
            <ShoppingBag strokeWidth={2} className="w-3.5 h-3.5" />
            ADD TO BAG
          </button>
        )}
      </div>

      <div className={`pt-3 ${compact ? "pb-1" : "pb-2"}`}>
        <h3 className="text-[13px] md:text-[14px] font-medium text-neutral-900 line-clamp-1 group-hover:underline">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="font-bold text-[13px] md:text-sm">₹{product.price}</span>
          <span className="text-[11px] md:text-xs text-neutral-500 line-through">₹{product.mrp}</span>
          <span className="text-[11px] md:text-xs font-semibold text-red-600">({product.discount}% OFF)</span>
        </div>
        {!compact && (
          <div className="flex items-center gap-1.5 mt-2">
            {(product.colors || []).slice(0, 4).map((c, i) => (
              <span key={i} className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ background: c }} />
            ))}
            <span className="text-[10px] text-neutral-500 ml-1">+{(product.sizes || []).length} sizes</span>
          </div>
        )}
      </div>
    </Link>
  );
}
