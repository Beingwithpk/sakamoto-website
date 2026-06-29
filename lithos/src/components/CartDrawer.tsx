import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export interface CartItem {
  id: number;
  name: string;
  price: number; // raw number for calculations
  image: string;
  quantity: number;
  category: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
            <ShoppingBag size={20} className="text-[#e8702a]" />
            <h2 className="text-white text-lg font-semibold uppercase tracking-wider">
              Your Bag ({items.reduce((sum, item) => sum + item.quantity, 0)})
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
              <ShoppingBag size={48} className="text-white/20" />
              <div>
                <p className="text-white/80 font-medium">Your bag is empty</p>
                <p className="text-white/40 text-xs mt-1">
                  Explore new drops to add premium pieces.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition-colors border border-white/10"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0"
              >
                {/* Product Image */}
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

                  {/* Quantity Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-white/10 rounded-full bg-white/5 px-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-1.5 text-white/55 hover:text-white transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-white px-2.5 text-xs font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-1.5 text-white/55 hover:text-white transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-white/30 hover:text-red-400 p-1.5 transition-colors"
                      title="Remove piece"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-[#0c0c0c] space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-white/60">Subtotal</span>
              <span className="text-white text-lg">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[10px] text-white/30 text-center leading-relaxed">
              Shipping & taxes calculated at checkout. Free shipping over ₹15,000.
            </p>
            <button
              onClick={onCheckout}
              className="w-full bg-[#e8702a] hover:bg-[#d2611f] text-white font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#e8702a]/20"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
