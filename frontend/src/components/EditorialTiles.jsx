import React from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";

export default function EditorialTiles() {
  const { data: editorialTiles = [] } = useQuery({
    queryKey: ["editorial-tiles"],
    queryFn: publicApi.getEditorialTiles,
  });

  if (!editorialTiles.length) return null;

  return (
    <section className="px-4 md:px-8 py-8 md:py-12 bg-white">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {editorialTiles.map((t) => (
          <a
            key={t.id}
            href="#"
            className="group relative aspect-[3/4] overflow-hidden bg-neutral-100 cursor-pointer"
          >
            <img
              src={t.image}
              alt={t.badge}
              loading="lazy"
              className="w-full h-full object-cover card-img"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-white text-[11px] md:text-[12px] tracking-[0.25em] font-semibold uppercase drop-shadow">
                {t.badge}
              </span>
              {t.tag && (
                <span className="bg-yellow-400 text-black text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center">
                  FC
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
