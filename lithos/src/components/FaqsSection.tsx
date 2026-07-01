import { useState } from "react";
import { Plus, Minus, ArrowLeft, HelpCircle } from "lucide-react";

export interface Faq {
  id: number;
  question: string;
  answer: string;
  display_order: number;
}

const DEFAULT_FAQS: Faq[] = [
  { id: 1, question: "What is your shipping policy?", answer: "We offer standard and express shipping options. Standard shipping (3–5 business days) is free on all orders above ₹15,000, otherwise ₹250. Express shipping (1–2 business days) is available for flat ₹600.", display_order: 1 },
  { id: 2, question: "How do I return or exchange my order?", answer: "We accept returns and exchanges on unworn, unwashed items in their original packaging with tags attached within 14 days of delivery. Please contact our support team to register your request.", display_order: 2 },
  { id: 3, question: "Are your streetwear collections unisex?", answer: "Yes, all SAKAMOTO collections feature gender-neutral patterns and relaxed oversized fits designed for modern unisex styling. Please refer to our Size Guide for detailed measurements.", display_order: 3 },
  { id: 4, question: "How should I wash and care for my items?", answer: "To preserve premium Japanese cotton prints, we recommend washing garments inside out in cold water with similar colors. Line dry or tumble dry low. Do not iron directly on graphics or embroideries.", display_order: 4 },
  { id: 5, question: "Do you release limited drops?", answer: "Yes, we release limited-edition drops throughout the year. Once an item in a drop is sold out, it is rarely restocked. Follow our newsletter and marquee ticker for release dates.", display_order: 5 }
];

interface FaqsSectionProps {
  faqs: Faq[];
  onBackToStore: () => void;
}

export default function FaqsSection({ faqs, onBackToStore }: FaqsSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const displayFaqs = faqs && faqs.length > 0 
    ? [...faqs].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    : DEFAULT_FAQS;

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
              Customer Support
            </p>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight font-playfair italic">
              Frequently Asked <span className="font-sans font-normal text-2xl sm:text-3xl not-italic">Questions</span>
            </h1>
          </div>
        </div>

        {/* FAQs List */}
        <div className="space-y-4">
          {displayFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id || index}
                className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors group"
                >
                  <span className="text-sm font-medium text-white/90 pr-4 group-hover:text-[#e8702a] transition-colors">
                    {faq.question}
                  </span>
                  <span className="shrink-0 bg-white/5 p-1.5 rounded-full border border-white/5 text-white/60 group-hover:text-white transition-colors">
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </span>
                </button>

                {/* Animated collapse block */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 border-t border-white/5" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="p-5 text-xs text-white/50 leading-relaxed font-light">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="max-w-3xl mx-auto w-full mt-16 text-center border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/35 uppercase tracking-wider font-semibold">
        <div className="flex items-center gap-2">
          <HelpCircle size={14} className="text-[#e8702a]" />
          <span>Sakamoto Support Desk</span>
        </div>
        <span>Japanese Craftsmanship & Design</span>
      </div>
    </div>
  );
}
