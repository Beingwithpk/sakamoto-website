import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const COLLECTIONS = [
  {
    title: "Essentials",
    subtitle: "Everyday fundamentals",
    image: "/images/collection-essentials.png",
  },
  {
    title: "Streetwear",
    subtitle: "Urban edge",
    image: "/images/collection-streetwear.png",
  },
  {
    title: "Limited Edition",
    subtitle: "Exclusive drops",
    image: "/images/collection-limited.png",
  },
];

export default function FeaturedCollections() {
  const headingRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="bg-[#0a0a0a] py-20 sm:py-28 px-5 sm:px-10 md:px-14">
      {/* Heading */}
      <div ref={headingRef} className="scroll-fade-in mb-12 sm:mb-16">
        <p className="text-[#e8702a] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
          Curated For You
        </p>
        <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
          Curated{" "}
          <span className="font-playfair italic font-normal">Collections</span>
        </h2>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {COLLECTIONS.map((col, i) => (
          <CollectionCard key={col.title} {...col} delay={i * 0.15} />
        ))}
      </div>
    </section>
  );
}

function CollectionCard({
  title,
  subtitle,
  image,
  delay,
}: {
  title: string;
  subtitle: string;
  image: string;
  delay: number;
}) {
  const ref = useScrollReveal<HTMLDivElement>(0.1);

  return (
    <div
      ref={ref}
      className="scroll-fade-in collection-card group relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4]"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Image */}
      <div
        className="collection-card-img absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${image})` }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
        <p className="text-white/60 text-xs tracking-[0.15em] uppercase mb-1">
          {subtitle}
        </p>
        <div className="flex items-end justify-between">
          <h3 className="text-white text-2xl sm:text-3xl font-light tracking-tight">
            {title}
          </h3>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-2.5 group-hover:bg-[#e8702a] group-hover:border-[#e8702a] transition-all duration-300">
            <ArrowRight size={18} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
