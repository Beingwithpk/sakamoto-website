import { useScrollReveal } from "../hooks/useScrollReveal";

export default function AboutSection() {
  const leftRef = useScrollReveal<HTMLDivElement>();
  const rightRef = useScrollReveal<HTMLDivElement>();

  return (
    <section id="About" className="bg-[#111111] py-20 sm:py-28 px-5 sm:px-10 md:px-14 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left — text */}
        <div ref={leftRef} className="scroll-fade-in scroll-fade-left">
          <p className="text-[#e8702a] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Our Story & Philosophy
          </p>
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-8">
            Designed in{" "}
            <span className="font-playfair italic font-normal">Tokyo</span>,
            <br />
            refined for the world
          </h2>

          <div className="space-y-6 text-white/70 text-sm sm:text-base leading-relaxed">
            <p>
              SAKAMOTO was established in 2019 in the backstreets of Shibuya, Tokyo, out of a combined passion for Japanese heritage textiles and modern, oversized silhouettes. We believe that apparel is a three-dimensional medium of self-expression — meant to feel comfortable, look effortless, and endure across seasons.
            </p>
            <p>
              We source our heavyweight cottons and utility canvases from legacy family mills in Okayama and Kurashiki, regions renowned worldwide for indigo-dyeing and weaving excellence. Our details are hand-finished by multi-generational craft artisans who balance precision stitching with local fabric heritage.
            </p>
            <p>
              SAKAMOTO operates on a zero-waste design protocol. We repurpose cut-offs into premium accessory drops, ensuring our footprint is as minimal as our aesthetic. We create garments that develop character over time, adapting to how you move.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/5">
            {[
              { value: "Okayama Cotton", desc: "Premium textured weight" },
              { value: "Shibuya Atelier", desc: "Designed & prototyped in Tokyo" },
              { value: "Sartorial Quality", desc: "Reinforced detailing" },
            ].map((v) => (
              <div key={v.value}>
                <p className="text-white text-sm font-semibold mb-1">{v.value}</p>
                <p className="text-white/50 text-xs leading-normal">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — image */}
        <div ref={rightRef} className="scroll-fade-in scroll-fade-right">
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-2xl">
            <img
              src="/images/collection-streetwear.png"
              alt="SAKAMOTO Shibuya atelier workshop"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Overlay accent */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div>
                <p className="text-white/40 text-[10px] tracking-wider uppercase">
                  Tokyo Workshop
                </p>
                <p className="text-white text-sm font-medium mt-0.5">
                  Est. 2019 · Shibuya Ward
                </p>
              </div>
              <span className="text-white/20 text-xs font-mono">35.6580° N, 139.7016° E</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
