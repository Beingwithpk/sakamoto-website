import { ShoppingBag, Heart } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";

export interface Product {
  id: number;
  name: string;
  price: number; // Raw price number in INR
  category: string;
  image: string;
  isNew?: boolean;
  stock_quantity?: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: "Oversized Essential Tee", price: 3999, category: "Tops", image: "/images/product-tee-black.png", isNew: true, stock_quantity: 12 },
  { id: 2, name: "Heavyweight Hoodie", price: 7999, category: "Outerwear", image: "/images/product-hoodie.png", isNew: true, stock_quantity: 8 },
  { id: 3, name: "Utility Cargo Pants", price: 6499, category: "Bottoms", image: "/images/product-cargo.png", stock_quantity: 15 },
  { id: 4, name: "Bomber Jacket", price: 12999, category: "Outerwear", image: "/images/product-jacket.png", isNew: true, stock_quantity: 0 },
  { id: 5, name: "Kanji Print Tee", price: 4299, category: "Tops", image: "/images/product-tee-white.png", stock_quantity: 6 },
  { id: 6, name: "Wide-Leg Trousers", price: 5999, category: "Bottoms", image: "/images/product-pants.png", stock_quantity: 2 },
  { id: 7, name: "Canvas Overshirt", price: 8499, category: "Outerwear", image: "/images/product-overshirt.png", isNew: true, stock_quantity: 10 },
  { id: 8, name: "Merino Knit Sweater", price: 9999, category: "Knitwear", image: "/images/product-knit.png", stock_quantity: 14 },
];

interface ProductGridProps {
  products: Product[];
  onAddCodeCart: (product: Product) => void;
  onAddCodeWishlist: (product: Product) => void;
  wishlistIds: number[];
}

export default function ProductGrid({ products, onAddCodeCart, onAddCodeWishlist, wishlistIds }: ProductGridProps) {
  const headingRef = useScrollReveal<HTMLDivElement>();

  const displayProducts = products && products.length > 0 ? products : PRODUCTS;

  return (
    <section id="Collections" className="bg-[#111111] py-20 sm:py-28 px-5 sm:px-10 md:px-14">
      {/* Heading */}
      <div ref={headingRef} className="scroll-fade-in flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16 gap-4">
        <div>
          <p className="text-[#e8702a] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Just Dropped
          </p>
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
            New{" "}
            <span className="font-playfair italic font-normal">Arrivals</span>
          </h2>
        </div>
        <button className="text-white/60 text-sm font-medium hover:text-white transition-colors flex items-center gap-2 group">
          View All Products
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {displayProducts.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            delay={i * 0.08}
            onAddCart={onAddCodeCart}
            onAddWishlist={onAddCodeWishlist}
            isWishlisted={wishlistIds.includes(product.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: Product;
  delay: number;
  onAddCart: (product: Product) => void;
  onAddWishlist: (product: Product) => void;
  isWishlisted: boolean;
}

function ProductCard({ product, delay, onAddCart, onAddWishlist, isWishlisted }: ProductCardProps) {
  const ref = useScrollReveal<HTMLDivElement>(0.05);
  const stock = product.stock_quantity !== undefined ? product.stock_quantity : 10;

  return (
    <div
      ref={ref}
      className="scroll-fade-in product-card group cursor-pointer"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1a1a] mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="product-card-img w-full h-full object-cover"
          loading="lazy"
        />

        {/* New badge */}
        {product.isNew && (
          <span className="absolute top-3 left-3 bg-[#e8702a] text-white text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full animate-pulse">
            New
          </span>
        )}

        {/* Sold out badge */}
        {stock === 0 && (
          <span className="absolute top-3 right-3 bg-red-600 text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full shadow-lg border border-red-500/25">
            Sold Out
          </span>
        )}

        {/* Hover overlay */}
        <div className="product-overlay absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2.5 text-center p-4">
          {stock > 0 ? (
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCart(product);
                }}
                className="bg-white text-gray-900 rounded-full p-3 hover:scale-110 transition-transform active:scale-95"
                title="Add to bag"
              >
                <ShoppingBag size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddWishlist(product);
                }}
                className={`rounded-full p-3 hover:scale-110 transition-transform active:scale-95 ${
                  isWishlisted
                    ? "bg-[#e8702a] text-white border border-[#e8702a]"
                    : "bg-white/20 backdrop-blur-sm text-white border border-white/30"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} className={isWishlisted ? "fill-white" : ""} />
              </button>
            </div>
          ) : (
            <>
              <span className="text-white text-xs font-semibold uppercase tracking-wider bg-red-600/80 px-3.5 py-1.5 rounded-full border border-red-500/25 shadow-md">
                Sold Out
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddWishlist(product);
                }}
                className={`rounded-full p-2.5 hover:scale-115 transition-transform active:scale-90 ${
                  isWishlisted
                    ? "bg-[#e8702a] text-white"
                    : "bg-white/10 text-white border border-white/15"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={14} className={isWishlisted ? "fill-white" : ""} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <p className="text-white/40 text-[11px] tracking-[0.12em] uppercase mb-1">
        {product.category}
      </p>
      <h3 className="text-white text-sm font-medium mb-1 group-hover:text-[#e8702a] transition-colors">
        {product.name}
      </h3>
      <div className="flex items-center justify-between">
        <p className="text-white/75 text-sm font-semibold">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        {stock > 0 && stock <= 3 && (
          <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 animate-pulse">
            Only {stock} left!
          </span>
        )}
      </div>
    </div>
  );
}
