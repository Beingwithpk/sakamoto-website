import { X, ShoppingBag, Heart } from "lucide-react";
import { type Product } from "./ProductGrid";

interface CollectionItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
}

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionTitle: string;
  items: CollectionItem[];
  onAddCart: (item: Product) => void;
  onAddWishlist: (item: Product) => void;
  wishlistIds: number[];
}

export default function CollectionModal({
  isOpen,
  onClose,
  collectionTitle,
  items,
  onAddCart,
  onAddWishlist,
  wishlistIds,
}: CollectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer animate-modal-fade"
        onClick={onClose}
      />

      {/* Slide Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-[#0e0e0e] border-l border-white/10 shadow-2xl flex flex-col h-full z-10 animate-modal-scale">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[#e8702a] text-[10px] font-bold tracking-[0.15em] uppercase">
              Curated Lookbook
            </span>
            <h2 className="text-white text-2xl font-playfair italic mt-0.5">
              {collectionTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Collection items catalog list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => {
              const isWishlisted = wishlistIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-4 flex flex-col justify-between group transition-all duration-300"
                >
                  <div>
                    {/* Item Image */}
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1a1a] mb-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.isNew && (
                        <span className="absolute top-2.5 left-2.5 bg-[#e8702a] text-white text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <span className="text-white/40 text-[9px] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-white text-sm font-medium mt-0.5 leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  <div>
                    <p className="text-[#e8702a] text-sm font-semibold mt-2 mb-3">
                      ₹{item.price.toLocaleString("en-IN")}
                    </p>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          onAddCart({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            category: item.category,
                            image: item.image,
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white text-gray-900 text-xs font-semibold py-2.5 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <ShoppingBag size={12} />
                        Add to Bag
                      </button>
                      <button
                        onClick={() =>
                          onAddWishlist({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            category: item.category,
                            image: item.image,
                          })
                        }
                        className={`px-3 py-2.5 rounded-full border transition-all ${
                          isWishlisted
                            ? "bg-[#e8702a] text-white border-[#e8702a]"
                            : "bg-white/10 text-white border-white/10 hover:bg-white/15"
                        }`}
                      >
                        <Heart
                          size={12}
                          className={isWishlisted ? "fill-white" : ""}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
