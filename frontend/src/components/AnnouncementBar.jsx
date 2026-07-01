import React from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";

export default function AnnouncementBar() {
  const { data: messages = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: publicApi.getAnnouncements,
  });

  if (!messages.length) return null;

  const items = [...messages, ...messages];
  return (
    <div className="w-full bg-black text-white text-[11px] tracking-[0.2em] overflow-hidden">
      <div className="flex whitespace-nowrap py-2 marquee">
        {items.map((msg, i) => (
          <span key={i} className="px-8 uppercase font-medium opacity-90">
            •&nbsp;&nbsp;{msg}
          </span>
        ))}
      </div>
    </div>
  );
}
