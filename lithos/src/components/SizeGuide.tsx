import { useState } from "react";
import { ArrowLeft, Ruler, CheckCircle } from "lucide-react";

interface SizeGuideProps {
  onBackToStore: () => void;
}

export default function SizeGuide({ onBackToStore }: SizeGuideProps) {
  const [activeTab, setActiveTab] = useState<"tops" | "bottoms">("tops");
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  const topsSizes = [
    { size: "S", chest: { cm: "112", in: "44" }, length: { cm: "70", in: "27.5" }, sleeve: { cm: "84", in: "33" } },
    { size: "M", chest: { cm: "118", in: "46.5" }, length: { cm: "72", in: "28.3" }, sleeve: { cm: "86", in: "33.8" } },
    { size: "L", chest: { cm: "124", in: "49" }, length: { cm: "74", in: "29.1" }, sleeve: { cm: "88", in: "34.6" } },
    { size: "XL", chest: { cm: "130", in: "51.2" }, length: { cm: "76", in: "30" }, sleeve: { cm: "90", in: "35.4" } },
    { size: "XXL", chest: { cm: "136", in: "53.5" }, length: { cm: "78", in: "30.7" }, sleeve: { cm: "92", in: "36.2" } },
  ];

  const bottomsSizes = [
    { size: "S (30)", waist: { cm: "76-81", in: "30-32" }, hip: { cm: "104", in: "41" }, inseam: { cm: "74", in: "29.1" } },
    { size: "M (32)", waist: { cm: "81-86", in: "32-34" }, hip: { cm: "110", in: "43.3" }, inseam: { cm: "75", in: "29.5" } },
    { size: "L (34)", waist: { cm: "86-91", in: "34-36" }, hip: { cm: "116", in: "45.7" }, inseam: { cm: "76", in: "29.9" } },
    { size: "XL (36)", waist: { cm: "91-96", in: "36-38" }, hip: { cm: "122", in: "48" }, inseam: { cm: "77", in: "30.3" } },
    { size: "XXL (38)", waist: { cm: "96-101", in: "38-40" }, hip: { cm: "128", in: "50.4" }, inseam: { cm: "78", in: "30.7" } },
  ];

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
              Garment Sizing
            </p>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight font-playfair italic">
              Size <span className="font-sans font-normal text-2xl sm:text-3xl not-italic">Guide</span>
            </h1>
          </div>
        </div>

        {/* Tab Selection & Unit Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-white/5 pb-4 mb-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("tops")}
              className={`text-sm font-semibold uppercase tracking-wider transition-colors relative pb-2 ${
                activeTab === "tops" ? "text-[#e8702a]" : "text-white/40 hover:text-white/60"
              }`}
            >
              Tops & Outerwear
              {activeTab === "tops" && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#e8702a]" />}
            </button>
            <button
              onClick={() => setActiveTab("bottoms")}
              className={`text-sm font-semibold uppercase tracking-wider transition-colors relative pb-2 ${
                activeTab === "bottoms" ? "text-[#e8702a]" : "text-white/40 hover:text-white/60"
              }`}
            >
              Pants & Bottoms
              {activeTab === "bottoms" && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#e8702a]" />}
            </button>
          </div>

          {/* Unit Toggle Button */}
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setUnit("cm")}
              className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${
                unit === "cm" ? "bg-white text-black" : "text-white/50 hover:text-white"
              }`}
            >
              Metric (CM)
            </button>
            <button
              onClick={() => setUnit("in")}
              className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${
                unit === "in" ? "bg-white text-black" : "text-white/50 hover:text-white"
              }`}
            >
              Imperial (IN)
            </button>
          </div>
        </div>

        {/* Size Table */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-xl mb-12">
          {activeTab === "tops" ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider bg-white/[0.02]">
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Chest Width</th>
                  <th className="px-6 py-4">Body Length</th>
                  <th className="px-6 py-4">Sleeve Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topsSizes.map((row) => (
                  <tr key={row.size} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#e8702a]">{row.size}</td>
                    <td className="px-6 py-4 text-white/80">{unit === "cm" ? `${row.chest.cm} cm` : `${row.chest.in} in`}</td>
                    <td className="px-6 py-4 text-white/80">{unit === "cm" ? `${row.length.cm} cm` : `${row.length.in} in`}</td>
                    <td className="px-6 py-4 text-white/80">{unit === "cm" ? `${row.sleeve.cm} cm` : `${row.sleeve.in} in`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider bg-white/[0.02]">
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Waist Width</th>
                  <th className="px-6 py-4">Hip Circumference</th>
                  <th className="px-6 py-4">Inseam Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bottomsSizes.map((row) => (
                  <tr key={row.size} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#e8702a]">{row.size}</td>
                    <td className="px-6 py-4 text-white/80">{unit === "cm" ? `${row.waist.cm} cm` : `${row.waist.in} in`}</td>
                    <td className="px-6 py-4 text-white/80">{unit === "cm" ? `${row.hip.cm} cm` : `${row.hip.in} in`}</td>
                    <td className="px-6 py-4 text-white/80">{unit === "cm" ? `${row.inseam.cm} cm` : `${row.inseam.in} in`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* fit info card */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 mb-10 flex gap-4">
          <CheckCircle size={20} className="text-[#e8702a] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[#e8702a] text-sm font-semibold uppercase tracking-wider mb-1">
              Sakamoto Fit Silhouette
            </h4>
            <p className="text-white/60 text-xs leading-relaxed font-light">
              Most SAKAMOTO streetwear drops are pattern cut for a <strong>relaxed, loose, oversized silhouette</strong>. If you prefer a standard, trimmer fit, we recommend ordering one size smaller than your usual measurement.
            </p>
          </div>
        </div>

        {/* measuring guide instructions */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
            <Ruler size={18} className="text-[#e8702a]" />
            How to Measure
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.01]">
              <h5 className="text-[#e8702a] text-xs font-bold uppercase tracking-wider mb-1">1. Chest</h5>
              <p className="text-white/50 text-[11px] leading-relaxed font-light">
                Measure under your arms around the fullest part of your chest, keeping the tape level.
              </p>
            </div>
            <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.01]">
              <h5 className="text-[#e8702a] text-xs font-bold uppercase tracking-wider mb-1">2. Body Length</h5>
              <p className="text-white/50 text-[11px] leading-relaxed font-light">
                Measure from the highest point of your shoulder seam straight down to the bottom hemline.
              </p>
            </div>
            <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.01]">
              <h5 className="text-[#e8702a] text-xs font-bold uppercase tracking-wider mb-1">3. Waist (Pants)</h5>
              <p className="text-white/50 text-[11px] leading-relaxed font-light">
                Measure around your natural waistline where your pants usually sit, keeping one finger gap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
