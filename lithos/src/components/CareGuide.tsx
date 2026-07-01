import { ArrowLeft, Sparkles, ShieldAlert, Wind, Droplets } from "lucide-react";

interface CareGuideProps {
  onBackToStore: () => void;
}

export default function CareGuide({ onBackToStore }: CareGuideProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-5 sm:px-10 md:px-14 flex flex-col justify-between animate-modal-scale">
      <div className="max-w-3xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-10">
          <button
            onClick={onBackToStore}
            className="p-2 border border-white/10 rounded-full hover:bg-white/5 hover:border-white/20 transition-all text-white/70 hover:text-white"
            title="Back to Shop"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[#e8702a] text-xs font-semibold tracking-[0.25em] uppercase mb-1">
              Garment Longevity
            </p>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight font-playfair italic">
              Care <span className="font-sans font-normal text-2xl sm:text-3xl not-italic">Guide</span>
            </h1>
          </div>
        </div>

        {/* Universal Care Rules */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-6">
            Universal Care Rules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Droplets size={20} className="text-[#e8702a] shrink-0" />
              <div>
                <h5 className="font-semibold text-sm mb-1">Wash Cold & Inside Out</h5>
                <p className="text-white/40 text-xs leading-relaxed font-light">
                  Turn your garments inside out before washing. Always wash with cold water (30°C / 85°F) to prevent shrinkage and preserve screen prints.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Wind size={20} className="text-[#e8702a] shrink-0" />
              <div>
                <h5 className="font-semibold text-sm mb-1">Air Dry Recommended</h5>
                <p className="text-white/40 text-xs leading-relaxed font-light">
                  Avoid commercial tumble dryers. Hang dry or flat dry away from direct sunlight to maintain fabric structural integrity and avoid fading.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Material Specific Care */}
        <div className="space-y-6 mb-12">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-2">
            Material-Specific Guidelines
          </h3>

          {/* Heavy Cotton */}
          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.01]">
            <h4 className="text-white font-medium text-base mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-[#e8702a]" />
              Heavyweight Cotton (Loopback / Fleece)
            </h4>
            <p className="text-white/50 text-xs leading-relaxed font-light mb-3">
              Crafted from premium long-staple cotton, our heavyweight tees and hoodies are pre-shrunk but require gentle handling to retain their loops.
            </p>
            <ul className="text-white/40 text-[11px] list-disc list-inside space-y-1.5 font-light">
              <li>Wash with similar colors on a gentle spin cycle.</li>
              <li>Do not use liquid fabric softeners (it clogs the fibers and reduces breathability).</li>
              <li>Iron inside out on a low setting. Never run hot iron directly over prints or graphic embroideries.</li>
            </ul>
          </div>

          {/* Merino Wool */}
          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.01]">
            <h4 className="text-white font-medium text-base mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-[#e8702a]" />
              Merino Wool & Knitwear
            </h4>
            <p className="text-white/50 text-xs leading-relaxed font-light mb-3">
              Fine wool knitwear requires maximum caution to prevent shrinking (felting) and misshaping.
            </p>
            <ul className="text-white/40 text-[11px] list-disc list-inside space-y-1.5 font-light">
              <li>Hand wash cold only or seek professional eco-dry cleaning.</li>
              <li>Use mild, wool-safe liquid detergent. Do not bleach or scrub.</li>
              <li><strong>Do not wring or hang wet.</strong> Roll in a clean towel to absorb moisture, then dry flat on a rack.</li>
            </ul>
          </div>

          {/* Technical fabrics */}
          <div className="border border-white/10 rounded-2xl p-6 bg-white/[0.01]">
            <h4 className="text-white font-medium text-base mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-[#e8702a]" />
              Technical Shells & Nylon Outerwear
            </h4>
            <p className="text-white/50 text-xs leading-relaxed font-light mb-3">
              Water-resistant nylon jackets and cargo trousers utilize tech coatings that wear out from harsh washings.
            </p>
            <ul className="text-white/40 text-[11px] list-disc list-inside space-y-1.5 font-light">
              <li>Spot clean surface dirt with a damp micro-fiber cloth instead of complete machine wash.</li>
              <li>If washing, secure all zippers/Velcro, place in mesh laundry bag, and wash cold.</li>
              <li>Do not dry clean technical shells. Air dry away from direct heat sources.</li>
            </ul>
          </div>
        </div>

        {/* storage warning */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 flex gap-4">
          <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-1">
              Important Knitwear Storage Notice
            </h4>
            <p className="text-white/60 text-xs leading-relaxed font-light">
              Never hang heavy knitwear or sweaters on hangers. The weight of the fabric will stretch the shoulders and distort the fit. Instead, fold your knits gently and store them flat in drawers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
