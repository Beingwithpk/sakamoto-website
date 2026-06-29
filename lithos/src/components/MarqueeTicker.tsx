export default function MarqueeTicker() {
  const phrases = [
    "NEW ARRIVALS",
    "SUMMER 2025",
    "FREE SHIPPING OVER ¥15,000",
    "SAKAMOTO",
    "CRAFTED IN TOKYO",
    "PREMIUM STREETWEAR",
    "LIMITED EDITION",
    "サカモト",
  ];

  const track = phrases.map((p) => `${p}  •  `).join("");

  return (
    <div className="w-full bg-[#0a0a0a] border-y border-white/10 py-4 overflow-hidden">
      <div className="marquee-track flex whitespace-nowrap">
        <span className="text-white/60 text-sm font-medium tracking-[0.15em] uppercase">
          {track}
        </span>
        <span className="text-white/60 text-sm font-medium tracking-[0.15em] uppercase">
          {track}
        </span>
      </div>
    </div>
  );
}
