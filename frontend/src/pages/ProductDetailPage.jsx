import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Heart, ShoppingBag, Truck, RotateCcw, Shield } from "lucide-react";
import { publicApi } from "../lib/api";
import { categoryPath } from "../lib/categorySlug";
import { useCart } from "../context/CartContext";
import { useToast } from "../hooks/use-toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [liked, setLiked] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => publicApi.getProduct(id),
  });

  if (isLoading) {
    return (
      <div className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-[3/4] bg-neutral-100 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-100 animate-pulse w-3/4" />
            <div className="h-6 bg-neutral-100 animate-pulse w-1/2" />
            <div className="h-32 bg-neutral-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-neutral-500 mb-4">Product not found.</p>
        <Link to="/shop" className="text-sm font-semibold tracking-widest border-b-2 border-black pb-0.5">
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  const sizes = product.sizes?.length ? product.sizes : ["S", "M", "L", "XL"];
  const colors = product.colors?.length ? product.colors : ["#1B1B1B"];
  const size = selectedSize || sizes[0];
  const color = selectedColor || colors[0];

  const handleAddToBag = () => {
    addToCart(product, { size, color });
    toast({ title: `${product.name} added to bag` });
  };

  const handleBuyNow = () => {
    addToCart(product, { size, color });
    navigate("/checkout");
  };

  return (
    <div className="px-4 md:px-8 py-8 md:py-12 max-w-6xl mx-auto">
      <nav className="flex items-center gap-2 text-[11px] tracking-wider text-neutral-500 mb-8 flex-wrap">
        <Link to="/" className="hover:text-black">Home</Link>
        <ChevronRight className="w-3 h-3" />
        {product.categorySlug && (
          <>
            <Link to={categoryPath(product.categorySlug)} className="hover:text-black">
              {product.categoryName}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-black font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          {product.tag && (
            <span className="absolute top-4 left-4 bg-white text-black text-[10px] font-bold tracking-[0.2em] px-3 py-1.5">
              {product.tag}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-neutral-900">{product.name}</h1>
          {product.categoryName && (
            <p className="text-xs text-neutral-500 tracking-widest mt-1 uppercase">{product.categoryName}</p>
          )}

          <div className="flex items-center gap-3 mt-4">
            <span className="text-2xl font-bold">₹{product.price}</span>
            <span className="text-neutral-400 line-through">₹{product.mrp}</span>
            <span className="text-red-600 font-semibold text-sm">({product.discount}% OFF)</span>
          </div>

          <p className="text-sm text-green-700 font-medium mt-2">Inclusive of all taxes</p>

          <div className="mt-6">
            <p className="text-xs tracking-widest font-semibold mb-3">SELECT COLOR</p>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? "border-black scale-110" : "border-neutral-300"
                  }`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs tracking-widest font-semibold mb-3">SELECT SIZE</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`min-w-[44px] px-3 py-2 text-sm border transition-all ${
                    size === s
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 hover:border-black"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={handleAddToBag}
              className="flex-1 bg-black text-white text-[12px] tracking-[0.2em] font-semibold py-4 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              ADD TO BAG
            </button>
            <button
              onClick={() => setLiked((v) => !v)}
              className="w-14 border border-neutral-300 flex items-center justify-center hover:border-black transition-colors"
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>

          <button
            onClick={handleBuyNow}
            className="w-full mt-3 border-2 border-black text-black text-[12px] tracking-[0.2em] font-semibold py-4 hover:bg-black hover:text-white transition-colors"
          >
            BUY NOW
          </button>

          <div className="mt-8 space-y-3 border-t pt-6">
            {[
              { icon: Truck, text: "Free shipping on prepaid orders" },
              { icon: RotateCcw, text: "Easy 15 days returns & exchange" },
              { icon: Shield, text: "100% secure payment" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-neutral-600">
                <Icon className="w-4 h-4 shrink-0" />
                {text}
              </div>
            ))}
          </div>

          <div className="mt-6 text-sm text-neutral-600 leading-relaxed">
            <p className="font-semibold text-black mb-2">Product Details</p>
            <p>
              Premium quality {product.name.toLowerCase()} crafted for everyday comfort and style.
              Perfect for casual and semi-formal occasions. Machine washable. Model is 6&apos;1&quot; and wears size {sizes[Math.floor(sizes.length / 2)] || "M"}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
