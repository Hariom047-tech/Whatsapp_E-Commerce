import React from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";

export default function PromoBanner() {
  const { data: banner } = useQuery({
    queryKey: ["promo-banner"],
    queryFn: publicApi.getPromoBanner,
  });

  if (!banner) return null;

  return (
    <section className="px-4 md:px-8 py-8 md:py-10 bg-white">
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl md:text-3xl tracking-[0.15em]">{banner.sectionTitle || "SHOP YOUR SIZE"}</h2>
        <div className="w-10 h-[2px] bg-black mx-auto mt-2" />
      </div>
      <a
        href={banner.href || "#"}
        className="block relative w-full aspect-[16/6] md:aspect-[16/5] rounded-sm overflow-hidden group bg-neutral-900"
      >
        {banner.image && (
          <img
            src={banner.image}
            alt="Sale"
            className="absolute inset-0 w-full h-full object-cover card-img"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/45" />
        <div className="absolute left-6 md:left-16 top-1/2 -translate-y-1/2 text-white">
          <div className="font-display text-4xl md:text-7xl leading-[0.9] text-yellow-300 drop-shadow-[3px_3px_0_rgba(220,38,38,0.9)]">
            {banner.leftText1}
          </div>
          <div className="font-display text-4xl md:text-7xl leading-[0.9] text-yellow-300 drop-shadow-[3px_3px_0_rgba(220,38,38,0.9)]">
            {banner.leftText2}
          </div>
        </div>
        <div className="absolute right-6 md:right-16 top-1/2 -translate-y-1/2 text-right text-white">
          <div className="flex items-baseline justify-end gap-2">
            <span className="font-display text-3xl md:text-6xl leading-none">{banner.rightMain}</span>
            <span className="text-yellow-300 text-2xl md:text-4xl">*</span>
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-yellow-300 font-display text-2xl md:text-4xl">+</span>
            <span className="font-display text-2xl md:text-4xl">{banner.rightSub || "10% Extra*"}</span>
          </div>
          {banner.dateText && (
            <div className="mt-2 md:mt-3 text-[10px] md:text-sm tracking-wider">
              {banner.dateText}
            </div>
          )}
          {banner.noteText && (
            <div className="text-[9px] md:text-xs opacity-80 mt-1">
              {banner.noteText}
            </div>
          )}
        </div>
      </a>
    </section>
  );
}
