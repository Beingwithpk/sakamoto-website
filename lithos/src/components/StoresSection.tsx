import { MapPin, Clock, Phone } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const STORES = [
  {
    city: "Shibuya, Tokyo",
    name: "SAKAMOTO Shibuya Flagship",
    address: "2 Chome-24-12 Shibuya, Tokyo 150-0002, Japan",
    hours: "Daily: 11:00 AM – 9:00 PM",
    phone: "+81 3-5456-1081",
  },
  {
    city: "Colaba, Mumbai",
    name: "SAKAMOTO Colaba House",
    address: "A-23 Mandlik Rd, Colaba, Mumbai, Maharashtra 400001, India",
    hours: "Daily: 11:00 AM – 8:00 PM",
    phone: "+91 22-2202-0056",
  },
  {
    city: "Chanakyapuri, New Delhi",
    name: "SAKAMOTO The Pavilion",
    address: "Diplomatic Enclave, Chanakyapuri, New Delhi, Delhi 110021, India",
    hours: "Daily: 11:00 AM – 8:00 PM",
    phone: "+91 11-4600-0128",
  },
  {
    city: "Soho, New York",
    name: "SAKAMOTO Soho Atelier",
    address: "128 Mercer St, New York, NY 10012, United States",
    hours: "Daily: 10:00 AM – 8:00 PM",
    phone: "+1 212-966-2244",
  },
];

export default function StoresSection() {
  const headingRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="Stores" className="bg-[#0a0a0a] py-20 sm:py-28 px-5 sm:px-10 md:px-14 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div ref={headingRef} className="scroll-fade-in mb-12 sm:mb-16">
          <p className="text-[#e8702a] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Locate Us
          </p>
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
            Flagship{" "}
            <span className="font-playfair italic font-normal">Stores</span>
          </h2>
        </div>

        {/* Store Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STORES.map((store, i) => (
            <StoreCard key={store.name} store={store} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoreCard({
  store,
  delay,
}: {
  store: typeof STORES[0];
  delay: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>(0.1);

  return (
    <div
      ref={ref}
      className="scroll-fade-in bg-white/5 border border-white/10 hover:border-[#e8702a]/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div>
        <span className="text-[#e8702a] text-[10px] font-bold tracking-[0.15em] uppercase border border-[#e8702a]/30 rounded-full px-3 py-1 bg-[#e8702a]/5">
          {store.city}
        </span>
        <h3 className="text-white text-xl font-light mt-4 mb-5 tracking-tight">
          {store.name}
        </h3>

        <div className="space-y-3.5">
          <div className="flex items-start gap-3 text-white/60 text-sm">
            <MapPin size={16} className="text-[#e8702a] flex-shrink-0 mt-0.5" />
            <p>{store.address}</p>
          </div>
          <div className="flex items-center gap-3 text-white/60 text-sm">
            <Clock size={16} className="text-[#e8702a] flex-shrink-0" />
            <p>{store.hours}</p>
          </div>
          <div className="flex items-center gap-3 text-white/60 text-sm">
            <Phone size={16} className="text-[#e8702a] flex-shrink-0" />
            <p>{store.phone}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(store.name + " " + store.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white text-xs font-semibold hover:text-[#e8702a] transition-colors"
        >
          Get Directions →
        </a>
      </div>
    </div>
  );
}
