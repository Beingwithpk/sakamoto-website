import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, X, LogOut, ShoppingBag, Heart, Package } from "lucide-react";
import { supabase } from "./lib/supabase";
import RevealLayer from "./components/RevealLayer";
import MarqueeTicker from "./components/MarqueeTicker";
import FeaturedCollections from "./components/FeaturedCollections";
import ProductGrid, { type Product } from "./components/ProductGrid";
import AdminPortal from "./components/AdminPortal";
import Accessories, { type Accessory } from "./components/Accessories";
import AboutSection from "./components/AboutSection";
import StoresSection from "./components/StoresSection";
import ContactSection from "./components/ContactSection";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import CartDrawer, { type CartItem } from "./components/CartDrawer";
import WishlistDrawer, { type WishlistItem } from "./components/WishlistDrawer";
import CheckoutModal from "./components/CheckoutModal";
import CustomerPortalModal from "./components/CustomerPortalModal";


const BG_IMAGE_1 = "/images/hero-base.png";
const BG_IMAGE_2 = "/images/hero-reveal.png";

const NAV_LINKS = [
  { label: "Collections", target: "Collections" },
  { label: "About", target: "About" },
  { label: "Stores", target: "Stores" },
  { label: "Contact", target: "Contact" },
];

interface User {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isAdmin?: boolean;
}

export default function App() {
  /* ── cursor tracking with smoothing ── */
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });

  const loop = useCallback(() => {
    smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
    smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;
    setCursorPos({ x: smooth.current.x, y: smooth.current.y });
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMove);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  /* ── active nav + mobile menu state ── */
  const [activeNav, setActiveNav] = useState("Collections");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ── Auth State ── */
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  /* ── Products list from database ── */
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      if (data) {
        const mappedProducts = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          category: item.category,
          image: item.image,
          isNew: item.is_new,
        }));
        setProducts(mappedProducts);
      }
    } catch (err) {
      console.error("Error fetching products from database:", err);
    }
  }, []);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Cart & Wishlist Drawer State ── */
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  /* ── Nav background on scroll ── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track latest cart and wishlist items using refs to avoid stale closures in auth subscription
  const cartRef = useRef<CartItem[]>([]);
  const wishlistRef = useRef<WishlistItem[]>([]);
  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);
  useEffect(() => {
    wishlistRef.current = wishlistItems;
  }, [wishlistItems]);

  // Sync Supabase Cart & Wishlist with local state on login
  const syncUserDataOnLogin = async (userId: string) => {
    try {
      // 1. Fetch Cart from Supabase
      const { data: dbCart, error: cartError } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId);

      if (cartError) throw cartError;

      // 2. Fetch Wishlist from Supabase
      const { data: dbWishlist, error: wishlistError } = await supabase
        .from("wishlist_items")
        .select("*")
        .eq("user_id", userId);

      if (wishlistError) throw wishlistError;

      const currentCart = cartRef.current;
      const currentWishlist = wishlistRef.current;

      // Merge Carts
      let mergedCart = dbCart.map(item => ({
        id: item.product_id,
        name: item.name,
        price: Number(item.price),
        image: item.image,
        category: item.category,
        quantity: item.quantity,
      }));

      if (currentCart.length > 0) {
        for (const localItem of currentCart) {
          const existingDb = dbCart.find(db => db.product_id === localItem.id);
          if (existingDb) {
            const newQty = existingDb.quantity + localItem.quantity;
            await supabase
              .from("cart_items")
              .update({ quantity: newQty })
              .eq("user_id", userId)
              .eq("product_id", localItem.id);
            
            mergedCart = mergedCart.map(c => c.id === localItem.id ? { ...c, quantity: newQty } : c);
          } else {
            await supabase
              .from("cart_items")
              .insert({
                user_id: userId,
                product_id: localItem.id,
                name: localItem.name,
                price: localItem.price,
                image: localItem.image,
                category: localItem.category,
                quantity: localItem.quantity,
              });
            mergedCart.push(localItem);
          }
        }
      }
      setCartItems(mergedCart);

      // Merge Wishlists
      let mergedWishlist = dbWishlist.map(item => ({
        id: item.product_id,
        name: item.name,
        price: Number(item.price),
        image: item.image,
        category: item.category,
      }));

      if (currentWishlist.length > 0) {
        for (const localItem of currentWishlist) {
          const existingDb = dbWishlist.find(db => db.product_id === localItem.id);
          if (!existingDb) {
            await supabase
              .from("wishlist_items")
              .insert({
                user_id: userId,
                product_id: localItem.id,
                name: localItem.name,
                price: localItem.price,
                image: localItem.image,
                category: localItem.category,
              });
            mergedWishlist.push(localItem);
          }
        }
      }
      setWishlistItems(mergedWishlist);
    } catch (err) {
      console.error("Error syncing user data from Supabase:", err);
    }
  };

  // Session & Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        let isUserAdmin = false;
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .maybeSingle();
          isUserAdmin = !!profile?.is_admin;
        } catch (err) {
          console.error("Error checking admin profile on mount:", err);
        }

        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatarUrl: session.user.user_metadata.avatar_url,
          isAdmin: isUserAdmin,
        });
        setIsAdmin(isUserAdmin);
        syncUserDataOnLogin(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        let isUserAdmin = false;
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .maybeSingle();
          isUserAdmin = !!profile?.is_admin;
        } catch (err) {
          console.error("Error checking admin profile on auth change:", err);
        }

        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          avatarUrl: session.user.user_metadata.avatar_url,
          isAdmin: isUserAdmin,
        });
        setIsAdmin(isUserAdmin);
        syncUserDataOnLogin(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsAdminView(false);
        setCartItems([]);
        setWishlistItems([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ── Helper: Scroll to Section ── */
  const scrollToSection = (id: string) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false);
  };

  /* ── Commerce Handler: Cart ── */
  const handleAddToCart = async (product: Product | Accessory) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          quantity: 1,
        },
      ];
    });
    setIsCartOpen(true); // Open drawer on addition

    if (user?.id) {
      try {
        const { data } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .maybeSingle();

        if (data) {
          await supabase
            .from("cart_items")
            .update({ quantity: data.quantity + 1 })
            .eq("user_id", user.id)
            .eq("product_id", product.id);
        } else {
          await supabase
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
              quantity: 1,
            });
        }
      } catch (err) {
        console.error("Failed to sync cart add to Supabase:", err);
      }
    }
  };

  const handleUpdateCartQuantity = async (id: number, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );

    if (user?.id) {
      try {
        const { data } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("user_id", user.id)
          .eq("product_id", id)
          .maybeSingle();

        if (data) {
          const newQty = Math.max(1, data.quantity + delta);
          await supabase
            .from("cart_items")
            .update({ quantity: newQty })
            .eq("user_id", user.id)
            .eq("product_id", id);
        }
      } catch (err) {
        console.error("Failed to update cart quantity in Supabase:", err);
      }
    }
  };

  const handleRemoveCartItem = async (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));

    if (user?.id) {
      try {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id);
      } catch (err) {
        console.error("Failed to remove item from Supabase cart:", err);
      }
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = async () => {
    setCartItems([]);
    if (user?.id) {
      try {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);
      } catch (err) {
        console.error("Failed to clear Supabase cart on checkout success:", err);
      }
    }
  };


  /* ── Commerce Handler: Wishlist ── */
  const handleToggleWishlist = async (product: Product | Accessory) => {
    let wasAdded = false;
    setWishlistItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      wasAdded = true;
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
        },
      ];
    });

    if (user?.id) {
      try {
        if (wasAdded) {
          await supabase
            .from("wishlist_items")
            .insert({
              user_id: user.id,
              product_id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
            });
        } else {
          await supabase
            .from("wishlist_items")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", product.id);
        }
      } catch (err) {
        console.error("Failed to toggle Supabase wishlist:", err);
      }
    }
  };

  const handleMoveWishlistToCart = (item: WishlistItem) => {
    handleToggleWishlist(item); // Remove from wishlist
    handleAddToCart(item); // Add to cart
  };

  const handleLoginSuccess = async (userData: User) => {
    if (userData.id) {
      let isUserAdmin = false;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", userData.id)
          .maybeSingle();
        isUserAdmin = !!profile?.is_admin;
      } catch (err) {
        console.error("Error checking admin status on login:", err);
      }
      setUser({ ...userData, isAdmin: isUserAdmin });
      setIsAdmin(isUserAdmin);
    } else {
      setUser(userData);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    setUser(null);
    setIsAdmin(false);
    setIsAdminView(false);
    setCartItems([]);
    setWishlistItems([]);
    setShowUserDropdown(false);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  if (isAdminView && isAdmin) {
    return (
      <AdminPortal
        products={products}
        onBack={() => setIsAdminView(false)}
        onRefreshProducts={fetchProducts}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] tracking-[-0.02em] text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ══════════════ NAV ══════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5 transition-all duration-500 ${
          scrolled || mobileMenuOpen
            ? "bg-black/90 backdrop-blur-lg border-b border-white/10"
            : ""
        }`}
      >
        {/* Left – logo + wordmark */}
        <a href="#" className="flex items-center gap-2 z-10">
          <svg
            width="26"
            height="26"
            viewBox="0 0 256 256"
            fill="#ffffff"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic">
            SAKAMOTO
          </span>
        </a>

        {/* Center pill */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/25 rounded-full px-2 py-2 items-center gap-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollToSection(link.target)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeNav === link.target
                  ? "bg-white text-gray-900"
                  : "text-white/70 hover:bg-white/15 hover:text-white"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right – Actions & Profile */}
        <div className="flex items-center gap-3 sm:gap-4 z-10">
          {/* Customer Portal Header Indicator */}
          <button
            onClick={() => setIsCustomerPortalOpen(true)}
            className="text-white/70 hover:text-white relative p-1.5 transition-colors"
            title="Customer Portal"
          >
            <Package size={20} />
          </button>

          {/* Wishlist Header Indicator */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="text-white/70 hover:text-white relative p-1.5 transition-colors"
            title="Wishlist"
          >
            <Heart size={20} className={wishlistCount > 0 ? "fill-[#e8702a] text-[#e8702a]" : ""} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e8702a] text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border border-black shadow">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Header Indicator */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-white/70 hover:text-white relative p-1.5 transition-colors"
            title="Cart"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e8702a] text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border border-black shadow">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Sign In / Profile */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full hover:bg-white/15 transition-all"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover bg-white/10"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#e8702a] flex items-center justify-center text-[10px] font-bold uppercase text-white">
                      {user.name[0]}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-semibold tracking-wide text-white/95">
                    {user.name.split(" ")[0]}
                  </span>
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2.5 w-48 bg-[#0f0f0f] border border-white/10 rounded-xl p-2 shadow-2xl z-20 animate-modal-scale">
                      <div className="px-3.5 py-2.5 border-b border-white/5">
                        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                          Signed in as
                        </p>
                        <p className="text-xs text-white/80 font-medium truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsAdminView(true);
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 mt-1.5 text-white/70 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors text-left border-t border-white/5 pt-2.5"
                        >
                          <svg className="w-4 h-4 text-[#e8702a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Portal
                        </button>
                      )}
                       <button
                        onClick={() => {
                          setIsCustomerPortalOpen(true);
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 mt-1.5 text-white/70 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors text-left"
                      >
                        <Package size={16} className="text-[#e8702a]" />
                        My Account
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 mt-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors text-left"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white text-gray-900 text-xs sm:text-sm font-semibold px-4 sm:px-6 py-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger / close */}
          <button
            className="md:hidden text-white p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu overlay ── */}
      <div
        className={`fixed inset-0 z-[99] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 transition-all duration-500 md:hidden ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {NAV_LINKS.map((link) => (
          <button
            key={link.label}
            onClick={() => scrollToSection(link.target)}
            className={`text-2xl font-light transition-colors ${
              activeNav === link.target ? "text-[#e8702a]" : "text-white/70 hover:text-white"
            }`}
          >
            {link.label}
          </button>
        ))}

        <div className="border-t border-white/10 w-2/3 my-2" />

        {user ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <span className="text-white text-lg font-medium">{user.name}</span>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setIsAdminView(true);
                  setMobileMenuOpen(false);
                }}
                className="text-lg text-[#e8702a] font-semibold tracking-wide border border-[#e8702a]/30 px-6 py-2 rounded-full bg-[#e8702a]/5 hover:bg-[#e8702a]/10"
              >
                Admin Portal
              </button>
            )}
            <button
              onClick={() => {
                setIsCustomerPortalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-lg text-white/80 hover:text-white font-medium"
            >
              My Account
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-red-400 font-semibold"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsAuthModalOpen(true);
              setMobileMenuOpen(false);
            }}
            className="bg-white text-gray-900 text-sm font-semibold px-8 py-3 rounded-full hover:bg-gray-100"
          >
            Sign In
          </button>
        )}
      </div>

      {/* ══════════════ HERO SECTION ══════════════ */}
      <section
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: "100dvh" }}
      >
        {/* 1 ─ Base image */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 z-[15]" />

        {/* 2 ─ Reveal layer */}
        <RevealLayer
          image={BG_IMAGE_2}
          cursorX={cursorPos.x}
          cursorY={cursorPos.y}
        />

        {/* 3 ─ Heading */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: "-0.05em", animationDelay: "0.25s" }}
            >
              Style beyond
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: "-0.08em", animationDelay: "0.42s" }}
            >
              the ordinary
            </span>
          </h1>
        </div>

        {/* 4 ─ Bottom-left paragraph */}
        <div
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade"
          style={{ animationDelay: "0.7s" }}
        >
          <p className="text-sm text-white/80 leading-relaxed">
            Rooted in Japanese craftsmanship, SAKAMOTO creates garments that
            bridge heritage and modernity — designed to be worn, not just
            displayed.
          </p>
        </div>

        {/* 5 ─ Bottom-right block */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
          style={{ animationDelay: "0.85s" }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Explore our latest collection of premium streetwear, handcrafted
            with intention and purpose for those who move differently.
          </p>
          <button
            onClick={() => scrollToSection("Collections")}
            className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30"
          >
            Explore Collection
          </button>
        </div>
      </section>

      {/* ══════════════ MARQUEE ══════════════ */}
      <MarqueeTicker />

      {/* ══════════════ FEATURED COLLECTIONS ══════════════ */}
      <FeaturedCollections
        onAddCodeCart={handleAddToCart}
        onAddCodeWishlist={handleToggleWishlist}
        wishlistIds={wishlistItems.map((item) => item.id)}
      />

      {/* ══════════════ PRODUCT GRID ══════════════ */}
      <ProductGrid
        products={products}
        onAddCodeCart={handleAddToCart}
        onAddCodeWishlist={handleToggleWishlist}
        wishlistIds={wishlistItems.map((item) => item.id)}
      />

      {/* ══════════════ ACCESSORIES ══════════════ */}
      <Accessories
        onAddCodeCart={handleAddToCart}
        onAddCodeWishlist={handleToggleWishlist}
        wishlistIds={wishlistItems.map((item) => item.id)}
      />

      {/* ══════════════ ABOUT ══════════════ */}
      <AboutSection />

      {/* ══════════════ STORES ══════════════ */}
      <StoresSection />

      {/* ══════════════ CONTACT ══════════════ */}
      <ContactSection />

      {/* ══════════════ NEWSLETTER ══════════════ */}
      <Newsletter />

      {/* ══════════════ FOOTER ══════════════ */}
      <Footer />

      {/* ══════════════ AUTH MODAL ══════════════ */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* ══════════════ CART DRAWER ══════════════ */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
      />

      {/* ══════════════ WISHLIST DRAWER ══════════════ */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlistItems}
        onRemoveItem={handleToggleWishlist}
        onMoveToCart={handleMoveWishlistToCart}
      />

      {/* ══════════════ CHECKOUT MODAL ══════════════ */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onOrderSuccess={handleOrderSuccess}
        userId={user?.id}
        userEmail={user?.email}
        userName={user?.name}
        onViewOrderHistory={() => {
          setIsCheckoutOpen(false);
          setIsCustomerPortalOpen(true);
        }}
      />

      {/* ══════════════ CUSTOMER PORTAL MODAL ══════════════ */}
      <CustomerPortalModal
        isOpen={isCustomerPortalOpen}
        onClose={() => setIsCustomerPortalOpen(false)}
        userId={user?.id}
        userEmail={user?.email}
        onProfileUpdate={(newName) => {
          if (user) {
            setUser({ ...user, name: newName });
          }
        }}
      />
    </div>
  );
}
