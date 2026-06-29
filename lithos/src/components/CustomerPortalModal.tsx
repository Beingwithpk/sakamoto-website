import React, { useState, useEffect } from "react";
import { X, Calendar, ChevronDown, ChevronUp, ShoppingBag, ShieldCheck, User as UserIcon, Phone, MapPin, Save, Loader2, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

interface OrderItem {
  id: string;
  product_id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

interface Order {
  id: string;
  user_id?: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: any;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_method: string;
  order_items?: OrderItem[];
  items?: any[];
}

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  onProfileUpdate?: (name: string) => void;
}

export default function CustomerPortalModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onProfileUpdate,
}: CustomerPortalModalProps) {
  // Tabs: 'settings' | 'purchases'
  const [activeTab, setActiveTab] = useState<"settings" | "purchases">("settings");

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Purchases States
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // 1. Fetch Profile Data from Supabase
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone, shipping_address")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
          if (data.shipping_address) {
            const addr = data.shipping_address;
            setAddress(addr.address || "");
            setCity(addr.city || "");
            setZip(addr.zip || "");
          }
        }
      } catch (err) {
        console.error("Error loading user profile details:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId]);

  // 2. Fetch Orders History
  useEffect(() => {
    if (!isOpen || activeTab !== "purchases") return;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      let combinedOrders: Order[] = [];

      if (userId) {
        try {
          const { data: dbOrders, error } = await supabase
            .from("orders")
            .select(`
              id,
              created_at,
              customer_name,
              customer_email,
              shipping_address,
              subtotal,
              shipping_cost,
              total,
              status,
              payment_method,
              order_items (
                id,
                product_id,
                name,
                price,
                image,
                category,
                quantity
              )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (error) throw error;

          if (dbOrders) {
            combinedOrders = dbOrders.map((ord: any) => ({
              id: ord.id,
              created_at: ord.created_at,
              customer_name: ord.customer_name,
              customer_email: ord.customer_email,
              shipping_address: ord.shipping_address,
              subtotal: Number(ord.subtotal),
              shipping_cost: Number(ord.shipping_cost),
              total: Number(ord.total),
              status: ord.status,
              payment_method: ord.payment_method,
              order_items: ord.order_items || [],
            }));
          }
        } catch (err) {
          console.warn("Could not load database orders inside portal:", err);
        }
      }

      // Fetch local storage fallback
      try {
        const localOrdersStr = localStorage.getItem("sakamoto_local_orders") || "[]";
        const localOrders: Order[] = JSON.parse(localOrdersStr);
        const currentUserId = userId || "guest";
        const filteredLocal = localOrders
          .filter((ord) => ord.user_id === currentUserId || (currentUserId === "guest" && !ord.user_id))
          .map((ord) => ({
            ...ord,
            order_items: ord.order_items || ord.items || [],
          }));

        const dbIds = new Set(combinedOrders.map((o) => o.id));
        filteredLocal.forEach((ord) => {
          if (!dbIds.has(ord.id)) {
            combinedOrders.push(ord);
          }
        });

        combinedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } catch (err) {
        console.error("Local storage order parse error in portal:", err);
      }

      setOrders(combinedOrders);
      setOrdersLoading(false);
    };

    fetchOrders();
  }, [isOpen, activeTab, userId]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Name cannot be empty";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
          shipping_address: {
            address,
            city,
            zip,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      setSaveSuccess(true);
      if (onProfileUpdate) onProfileUpdate(fullName);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile settings:", err);
      setErrors({ general: "Failed to update profile in database. Please check connection." });
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "shipped":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "delivered":
        return "bg-[#e8702a]/10 text-[#e8702a] border-[#e8702a]/20";
      default:
        return "bg-white/10 text-white/70 border-white/10";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer animate-modal-fade"
        onClick={onClose}
      />

      {/* Panel Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-[#0e0e0e] border-l border-white/10 shadow-2xl flex flex-col h-full z-10 animate-modal-scale">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon size={20} className="text-[#e8702a]" />
            <h2 className="text-white text-lg font-semibold uppercase tracking-wider">
              Customer Portal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-white/5 p-1 gap-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "settings"
                ? "bg-white text-gray-900 shadow-md font-bold"
                : "text-white/60 hover:text-white"
            }`}
          >
            Profile & Settings
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "purchases"
                ? "bg-white text-gray-900 shadow-md font-bold"
                : "text-white/60 hover:text-white"
            }`}
          >
            Purchases History
          </button>
        </div>

        {/* Tab Views */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ── Settings Tab ── */}
          {activeTab === "settings" && (
            userId ? (
              profileLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3 py-12">
                  <Loader2 className="animate-spin text-[#e8702a]" size={32} />
                  <p className="text-white/40 text-xs tracking-wider">Loading settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-6 animate-modal-scale">
                  <div className="space-y-4">
                    <h3 className="text-white text-xs font-semibold uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                      <UserIcon size={14} className="text-[#e8702a]" />
                      Account Identity
                    </h3>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">Registered Email</label>
                      <input
                        type="text"
                        disabled
                        value={userEmail || ""}
                        className="bg-white/5 border border-white/5 text-white/45 rounded-lg px-3.5 py-2.5 text-sm select-none cursor-not-allowed"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your Name"
                        className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                      />
                      {errors.fullName && <span className="text-red-400 text-[10px]">{errors.fullName}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">Phone Number</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+81 90-1234-5678"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                        />
                        <Phone size={14} className="absolute left-3.5 top-3.5 text-white/40" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-white text-xs font-semibold uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                      <MapPin size={14} className="text-[#e8702a]" />
                      Default Shipping Coordinates
                    </h3>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">Street Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Apartment, suite, block details"
                        className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-white/50 uppercase font-semibold">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Tokyo"
                          className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-white/50 uppercase font-semibold">ZIP Code</label>
                        <input
                          type="text"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          placeholder="100-0001"
                          className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {errors.general && <span className="text-red-400 text-xs block">{errors.general}</span>}

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="w-full bg-[#e8702a] hover:bg-[#d2611f] disabled:bg-[#e8702a]/60 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#e8702a]/20"
                  >
                    {saveLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : saveSuccess ? (
                      <>
                        <Sparkles size={16} className="text-white" />
                        Saved Coordinates Successfully
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Update Profile Information
                      </>
                    )}
                  </button>
                </form>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16 animate-modal-scale">
                <UserIcon size={48} className="text-white/20" />
                <div>
                  <p className="text-white/80 font-medium">Guest Session</p>
                  <p className="text-white/40 text-xs mt-1">
                    Sign in to customize account settings and lock-in default shipping addresses.
                  </p>
                </div>
              </div>
            )
          )}

          {/* ── Purchases Tab ── */}
          {activeTab === "purchases" && (
            ordersLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 py-12">
                <Loader2 className="animate-spin text-[#e8702a]" size={32} />
                <p className="text-white/40 text-xs tracking-wider">Loading history...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16 animate-modal-scale">
                <ShoppingBag size={48} className="text-white/20" />
                <div>
                  <p className="text-white/80 font-medium">No order records found</p>
                  <p className="text-white/40 text-xs mt-1">
                    Once you check out items, they will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-modal-scale">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const itemsCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  
                  return (
                    <div
                      key={order.id}
                      className="border border-white/10 rounded-xl bg-white/5 overflow-hidden transition-all duration-300"
                    >
                      {/* Collapsed Card */}
                      <div
                        onClick={() => toggleExpand(order.id)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-white/50 font-mono truncate max-w-[130px] sm:max-w-none">
                              {order.id}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/60">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              {formatDate(order.created_at)}
                            </span>
                            <span>•</span>
                            <span>{itemsCount} {itemsCount === 1 ? "piece" : "pieces"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-[#e8702a] text-sm font-semibold whitespace-nowrap">
                            ₹{order.total.toLocaleString("en-IN")}
                          </p>
                          {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                        </div>
                      </div>

                      {/* Expanded Card Details */}
                      {isExpanded && (
                        <div className="border-t border-white/10 bg-black/40 p-4 space-y-4 animate-modal-scale">
                          
                          <div className="space-y-3">
                            <p className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">Purchased Items</p>
                            <div className="space-y-3">
                              {order.order_items?.map((item) => (
                                <div key={item.id || item.product_id} className="flex gap-3 text-xs">
                                  <div className="w-10 h-12 rounded bg-white/5 overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                      <p className="text-white font-medium truncate">{item.name}</p>
                                      <p className="text-white/40 text-[9px] mt-0.5">{item.category} • Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-white/80 font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3 space-y-1.5 text-xs text-white/60">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span className="text-white">₹{order.subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping</span>
                              <span className="text-white">
                                {order.shipping_cost === 0 ? "FREE" : `₹${order.shipping_cost}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-white font-semibold pt-1 border-t border-white/5">
                              <span>Total Paid</span>
                              <span className="text-[#e8702a]">₹{order.total.toLocaleString("en-IN")}</span>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-[10px] text-white/40 uppercase font-semibold">Payment</p>
                              <p className="text-white/80 mt-0.5 uppercase">{order.payment_method}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/40 uppercase font-semibold">Shipment Address</p>
                              <p className="text-white/80 mt-0.5 truncate" title={`${order.customer_name} - ${order.shipping_address?.address}`}>
                                {order.shipping_address?.address}, {order.shipping_address?.city}
                              </p>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0c0c0c] flex items-center justify-center gap-1.5 text-[10px] text-white/30">
          <ShieldCheck size={13} className="text-[#e8702a]" />
          <span>Sakamoto Security Verified Session</span>
        </div>

      </div>
    </div>
  );
}
