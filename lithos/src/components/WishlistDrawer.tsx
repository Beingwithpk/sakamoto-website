import { X, Trash2, ShoppingBag, Heart } from "lucide-react";

export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: WishlistItem[];
  onRemoveItem: (id: number) => void;
  onMoveToCart: (item: WishlistItem) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onMoveToCart,
}: WishlistDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer animate-modal-fade"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#0e0e0e] border-l border-white/10 shadow-2xl flex flex-col h-full z-10 animate-modal-scale">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-[#e8702a] fill-[#e8702a]" />
            <h2 className="text-white text-lg font-semibold uppercase tracking-wider">
              Wishlist ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <Heart size={48} className="text-white/20" />
              <div>
                <p className="text-white/80 font-medium">Your wishlist is empty</p>
                <p className="text-white/40 text-xs mt-1">
                  Save pieces you love to track them here.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition-colors border border-white/10"
              >
                Go Explore
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0"
              >
                {/* Image */}
                <div className="w-20 h-24 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-white/40 text-[10px] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-white text-sm font-medium mt-0.5">
                      {item.name}
                    </h3>
                    <p className="text-[#e8702a] text-sm font-semibold mt-1">
                      ₹{item.price.toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => onMoveToCart(item)}
                      className="flex items-center gap-2 bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <ShoppingBag size={12} />
                      Add to Bag
                    </button>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-white/30 hover:text-red-400 p-1.5 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
