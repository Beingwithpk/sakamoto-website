import { Send } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function Newsletter() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="scroll-fade-in relative bg-[#0a0a0a] py-24 sm:py-32 px-5 sm:px-10 md:px-14 overflow-hidden"
    >
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#e8702a]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#e8702a]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto text-center">
        <p className="text-[#e8702a] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
          Stay Connected
        </p>
        <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-4">
          Join the{" "}
          <span className="font-playfair italic font-normal">Movement</span>
        </h2>
        <p className="text-white/60 text-sm sm:text-base mb-10 max-w-md mx-auto">
          Be the first to know about new drops, exclusive collections, and
          behind-the-scenes stories from our Tokyo studio.
        </p>

        {/* Email form */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm rounded-full px-6 py-3.5 outline-none focus:border-[#e8702a] focus:ring-1 focus:ring-[#e8702a]/50 transition-all"
          />
          <button
            type="submit"
            className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-semibold px-7 py-3.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30 flex items-center justify-center gap-2"
          >
            Subscribe
            <Send size={14} />
          </button>
        </form>

        <p className="text-white/30 text-xs mt-5">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
