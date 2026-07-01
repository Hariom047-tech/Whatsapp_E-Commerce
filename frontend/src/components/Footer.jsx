import React from "react";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api";

export default function Footer() {
  const { data: footerSections = [] } = useQuery({
    queryKey: ["footer"],
    queryFn: publicApi.getFooter,
  });

  return (
    <footer className="bg-neutral-950 text-neutral-300 mt-12">
      <div className="px-6 md:px-16 py-10 md:py-14 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <div className="font-display text-3xl md:text-5xl text-white tracking-widest leading-tight">
              DOWNLOAD THE<br />FASHION VIRUS APP
            </div>
            <p className="mt-3 text-sm text-neutral-400">Get early access to new drops, exclusive offers and app-only styles.</p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="bg-white text-black px-4 py-2 text-[11px] tracking-[0.15em] font-semibold hover:opacity-80">APP STORE</a>
              <a href="#" className="bg-white text-black px-4 py-2 text-[11px] tracking-[0.15em] font-semibold hover:opacity-80">GOOGLE PLAY</a>
            </div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm tracking-widest">SUBSCRIBE TO OUR NEWSLETTER</div>
            <form onSubmit={(e) => e.preventDefault()} className="flex mt-3">
              <input
                placeholder="Enter your email"
                className="flex-1 bg-transparent border border-neutral-700 focus:border-white outline-none px-4 py-3 text-sm placeholder:text-neutral-500"
              />
              <button className="bg-white text-black px-6 text-[11px] tracking-[0.2em] font-semibold hover:opacity-80">SUBMIT</button>
            </form>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-16 py-10 md:py-14">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerSections.map((sec) => (
            <div key={sec.title}>
              <div className="text-white text-[12px] tracking-[0.2em] font-semibold mb-4">{sec.title}</div>
              <ul className="space-y-2.5">
                {sec.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13px] text-neutral-400 hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="text-white text-[12px] tracking-[0.2em] font-semibold mb-4">CONNECT</div>
            <div className="flex gap-3">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-neutral-700 flex items-center justify-center hover:border-white hover:text-white text-neutral-400 transition-colors">
                  <Icon strokeWidth={1.5} className="w-4 h-4" />
                </a>
              ))}
            </div>
            <div className="mt-6 text-[12px] text-neutral-500">
              Customer Support:<br />
              <span className="text-white">support@fashionvirus.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-800 px-6 md:px-16 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
            <circle cx="20" cy="20" r="6" fill="#e5e5e5" />
            <g stroke="#e5e5e5" strokeWidth="2" strokeLinecap="round">
              <line x1="20" y1="6" x2="20" y2="11" />
              <line x1="20" y1="29" x2="20" y2="34" />
              <line x1="6" y1="20" x2="11" y2="20" />
              <line x1="29" y1="20" x2="34" y2="20" />
              <line x1="10" y1="10" x2="13" y2="13" />
              <line x1="27" y1="27" x2="30" y2="30" />
              <line x1="30" y1="10" x2="27" y2="13" />
              <line x1="13" y1="27" x2="10" y2="30" />
            </g>
          </svg>
          <span className="tracking-widest text-neutral-300 font-semibold">FASHION <span className="text-red-500">VIRUS</span></span>
          <span>&copy; 2025 All rights reserved.</span>
        </div>
        <div className="tracking-wider">100% Secure Payment | Free Shipping | Easy Returns</div>
      </div>
    </footer>
  );
}
