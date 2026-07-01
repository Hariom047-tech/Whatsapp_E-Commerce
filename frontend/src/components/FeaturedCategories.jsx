import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";
import { categoryPath } from "../lib/categorySlug";

export default function FeaturedCategories() {
  const { data: featuredCategories = [] } = useQuery({
    queryKey: ["featured-categories"],
    queryFn: publicApi.getFeaturedCategories,
  });

  if (!featuredCategories.length) return null;

  return (
    <section className="px-4 md:px-8 py-10 md:py-14 bg-white">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="font-display text-2xl md:text-3xl tracking-[0.15em]">FEATURED CATEGORIES</h2>
        <div className="w-10 h-[2px] bg-black mx-auto mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {featuredCategories.map((c) => (
          <Link
            key={c.id}
            to={categoryPath(c.name)}
            className="group border border-neutral-200 rounded-sm p-4 md:p-5 flex flex-col hover:shadow-lg hover:border-neutral-300 transition-all duration-300 cursor-pointer bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] md:text-[14px] font-semibold tracking-wide group-hover:underline">{c.name}</span>
              {c.badge && (
                <span className="text-[9px] md:text-[10px] font-semibold text-red-600 border border-red-500 rounded-full px-2 py-0.5">
                  {c.badge}
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center aspect-square overflow-hidden">
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="w-full h-full object-contain card-img"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
