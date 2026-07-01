import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";

export default function HeroCarousel() {
  const { data: heroSlides = [] } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: publicApi.getHeroSlides,
  });

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const handler = () => setVisible(window.innerWidth < 768 ? 1 : 3);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!heroSlides.length) return;
    const t = setInterval(() => {
      setIdx((p) => (p + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  if (!heroSlides.length) {
    return <section className="h-64 bg-neutral-100 animate-pulse" />;
  }

  const items = [...heroSlides, ...heroSlides];
  const perc = 100 / visible;

  return (
    <section className="relative w-full bg-white">
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-[900ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ transform: `translateX(-${idx * perc}%)` }}
        >
          {items.map((s, i) => (
            <div
              key={i}
              className="shrink-0 relative"
              style={{ width: `${perc}%` }}
            >
              <div className="relative aspect-[3/4] md:aspect-[3/4] overflow-hidden bg-neutral-100">
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover card-img"
                  loading={i < 3 ? "eager" : "lazy"}
                />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-gradient-to-t from-black/50 via-black/10 to-transparent">
                  <div className="text-white font-display text-3xl md:text-5xl leading-none animate-slideup">
                    {s.title}
                  </div>
                  <div className="text-white/90 text-xs md:text-sm mt-2 tracking-widest uppercase">
                    {s.subtitle}
                  </div>
                  <button className="mt-4 inline-block bg-white text-black text-[11px] tracking-[0.2em] font-semibold px-5 py-2.5 hover:bg-black hover:text-white transition-colors">
                    {s.cta}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIdx((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center shadow-md transition-all"
          aria-label="Previous"
        >
          <ChevronLeft strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setIdx((p) => (p + 1) % heroSlides.length)}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center shadow-md transition-all"
          aria-label="Next"
        >
          <ChevronRight strokeWidth={1.5} />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`slide ${i}`}
              className={`h-[3px] rounded-full transition-all ${
                idx % heroSlides.length === i ? "w-6 bg-white" : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
