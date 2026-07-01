import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";
import { categoryPath } from "../lib/categorySlug";

export default function StealsSection() {
  const { data: steals = [] } = useQuery({
    queryKey: ["steals"],
    queryFn: publicApi.getSteals,
  });

  if (!steals.length) return null;

  return (
    <section className="px-4 md:px-8 py-8 md:py-12 bg-white">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="font-display text-2xl md:text-3xl tracking-[0.15em]">STEALS</h2>
        <div className="w-10 h-[2px] bg-black mx-auto mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {steals.map((s) => (
          <Link
            key={s.id}
            to={categoryPath(s.label)}
            className="group relative aspect-[3/4] overflow-hidden bg-neutral-900 cursor-pointer block"
          >
            <img
              src={s.image}
              alt={s.label}
              loading="lazy"
              className="w-full h-full object-cover card-img"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute top-4 left-4 text-white">
              <div className="font-display text-xl md:text-2xl tracking-widest">{s.label}</div>
              <div className="text-[10px] md:text-xs tracking-[0.2em] mt-0.5 opacity-90">{s.prefix}</div>
              <div className="font-display text-3xl md:text-5xl leading-none mt-1 drop-shadow-md">{s.price}</div>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-4 bg-white/95 text-[8px] font-bold text-black flex items-center justify-around">
              {["B'DAY SALE", "B'DAY SALE", "B'DAY SALE", "B'DAY SALE"].map((t, i) => (
                <span key={i} className="tracking-[0.2em]">{t}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
