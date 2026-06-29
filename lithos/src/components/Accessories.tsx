import { ShoppingBag, Heart } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";

export interface Accessory {
  id: number;
  name: string;
  price: number; // Raw price number in INR
  image: string;
  category: string;
}

const ACCESSORIES: Accessory[] = [
  { id: 101, name: "Structured Cap", price: 1999, image: "/images/acc-cap.png", category: "Accessories" },
  { id: 102, name: "Crossbody Bag", price: 9999, image: "/images/acc-bag.png", category: "Accessories" },
  { id: 103, name: "Leather Belt", price: 3499, image: "/images/acc-belt.png", category: "Accessories" },
  { id: 104, name: "Acetate Sunglasses", price: 5999, image: "/images/acc-sunglasses.png", category: "Accessories" },
];

interface AccessoriesProps {
  onAddCodeCart: (item: Accessory) => void;
  onAddCodeWishlist: (item: Accessory) => void;
  wishlistIds: number[];
}

export default function Accessories({ onAddCodeCart, onAddCodeWishlist, wishlistIds }: AccessoriesProps) {
  const headingRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="bg-[#0a0a0a] py-20 sm:py-28 px-5 sm:px-10 md:px-14">
      {/* Heading */}
      <div ref={headingRef} className="scroll-fade-in flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16 gap-4">
        <div>
          <p className="text-[#e8702a] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Complete The Look
          </p>
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
            <span className="font-playfair italic font-normal">Accessories</span>
          </h2>
        </div>
        <button className="text-white/60 text-sm font-medium hover:text-white transition-colors flex items-center gap-2 group">
          Shop All Accessories
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-5 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible scrollbar-hide">
        {ACCESSORIES.map((acc, i) => (
          <AccessoryCard
            key={acc.id}
            accessory={acc}
            delay={i * 0.12}
            onAddCart={onAddCodeCart}
            onAddWishlist={onAddCodeWishlist}
            isWishlisted={wishlistIds.includes(acc.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface AccessoryCardProps {
  accessory: Accessory;
  delay: number;
  onAddCart: (item: Accessory) => void;
  onAddWishlist: (item: Accessory) => void;
  isWishlisted: boolean;
}

function AccessoryCard({ accessory, delay, onAddCart, onAddWishlist, isWishlisted }: AccessoryCardProps) {
  const ref = useScrollReveal<HTMLDivElement>(0.1);

  return (
    <div
      ref={ref}
      className="scroll-fade-in group cursor-pointer flex-shrink-0 w-[260px] sm:w-auto"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] mb-3">
        <img
          src={accessory.image}
          alt={accessory.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Action icons overlay */}
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddCart(accessory);
            }}
            className="bg-white text-gray-900 rounded-full p-2.5 hover:scale-110 active:scale-95 transition-all"
            title="Add to bag"
          >
            <ShoppingBag size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddWishlist(accessory);
            }}
            className={`rounded-full p-2.5 hover:scale-110 active:scale-95 transition-all ${
              isWishlisted
                ? "bg-[#e8702a] text-white border border-[#e8702a]"
                : "bg-white/20 backdrop-blur-sm text-white border border-white/30"
            }`}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} className={isWishlisted ? "fill-white" : ""} />
          </button>
        </div>
      </div>

      {/* Info */}
      <h3 className="text-white text-sm font-medium mb-1 group-hover:text-[#e8702a] transition-colors">
        {accessory.name}
      </h3>
      <p className="text-white/75 text-sm font-semibold">
        ₹{accessory.price.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
