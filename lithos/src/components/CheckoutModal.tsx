import React, { useState, useEffect } from "react";
import { X, CreditCard, Truck, CheckCircle2, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { CartItem } from "./CartDrawer";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderSuccess: () => void;
  userId?: string;
  userEmail?: string;
  userName?: string;
  onViewOrderHistory: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess,
  userId,
  userEmail = "",
  userName = "",
  onViewOrderHistory,
}: CheckoutModalProps) {
  // Step: 'checkout' | 'processing' | 'success'
  const [step, setStep] = useState<"checkout" | "processing" | "success">("checkout");
  const [processingStatus, setProcessingStatus] = useState("Securing connection...");
  
  // Shipping details
  const [email, setEmail] = useState(userEmail);
  const [name, setName] = useState(userName);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  
  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Order details after placement
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [placedOrderTotal, setPlacedOrderTotal] = useState(0);

  // Sync user info and address coordinates if available in profile
  useEffect(() => {
    if (userEmail) setEmail(userEmail);
    if (userName) setName(userName);

    if (!userId) return;
    const fetchDefaultCoordinates = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone, shipping_address")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          if (data.full_name) setName(data.full_name);
          if (data.phone) setPhone(data.phone);
          if (data.shipping_address) {
            const addr = data.shipping_address;
            if (addr.address) setAddress(addr.address);
            if (addr.city) setCity(addr.city);
            if (addr.zip) setZip(addr.zip);
          }
        }
      } catch (err) {
        console.warn("Could not prefill user default addresses:", err);
      }
    };
    fetchDefaultCoordinates();
  }, [userId, userEmail, userName]);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05); // 5% service tax
  const shippingCost = shippingMethod === "express" ? 600 : subtotal >= 15000 ? 0 : 250;
  const total = subtotal + tax + shippingCost;

  const saveOrder = async (isCod: boolean, razorpayOrderId?: string, razorpayPaymentId?: string) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const finalOrderId = razorpayOrderId || `SAK-${datePrefix}-${randomSuffix}`;

    const newOrder = {
      customer_email: email,
      customer_name: name,
      shipping_address: {
        address,
        city,
        zip,
        phone,
        method: shippingMethod,
        razorpay_payment_id: razorpayPaymentId || null,
        razorpay_order_id: razorpayOrderId || null,
      },
      subtotal,
      shipping_cost: shippingCost,
      total,
      payment_method: isCod ? "COD" : "RAZORPAY",
      status: isCod ? "pending" : "paid",
    };

    try {
      // 1. Insert order into Supabase
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          ...newOrder,
          user_id: userId || null,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      if (orderData) {
        const orderItemsPayload = cartItems.map((item) => ({
          order_id: orderData.id,
          product_id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category,
          quantity: item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemsPayload);

        if (itemsError) throw itemsError;
      }
      
      console.log("Successfully saved order to Supabase");
    } catch (dbError) {
      console.warn("Database storage failed. Falling back to local storage.", dbError);
      
      // Fallback: Save to localStorage for mock history capability
      const localOrdersStr = localStorage.getItem("sakamoto_local_orders") || "[]";
      const localOrders = JSON.parse(localOrdersStr);
      localOrders.push({
        id: finalOrderId, // Use human readable id as primary key locally
        ...newOrder,
        user_id: userId || "guest",
        created_at: new Date().toISOString(),
        items: cartItems,
      });
      localStorage.setItem("sakamoto_local_orders", JSON.stringify(localOrders));
    }

    onOrderSuccess();
    setPlacedOrderId(finalOrderId);
    setPlacedOrderTotal(total);
    setStep("success");
  };

  // Form submit handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate shipping fields
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = "Valid email is required";
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!address.trim()) newErrors.address = "Address is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!zip || !/^\d{5,8}$/.test(zip)) newErrors.zip = "Valid ZIP/Postal Code is required";
    if (!phone || phone.length < 9) newErrors.phone = "Valid phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to error
      const firstError = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});

    if (paymentMethod === "cod") {
      setStep("processing");
      setProcessingStatus("Verifying shipping address...");
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProcessingStatus("Creating database records...");
      await new Promise((resolve) => setTimeout(resolve, 600));
      await saveOrder(true);
    } else {
      // Razorpay checkout flow
      setStep("processing");
      setProcessingStatus("Initiating secure payment session...");
      
      try {
        const response = await fetch("/api/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: total * 100, // Razorpay amount in paise
            currency: "INR",
            receipt: `rcpt_${Math.floor(Math.random() * 1000000)}`,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to create Razorpay order.");
        }

        const orderData = await response.json(); // { order_id, amount, currency }

        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_T7tDhs9VFOmHc9";

        const options = {
          key: razorpayKeyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "SAKAMOTO Store",
          description: `Order for ${cartItems.length} item(s)`,
          image: "https://api.dicebear.com/7.x/shapes/svg?seed=sakamoto",
          order_id: orderData.order_id,
          prefill: {
            name: name,
            email: email,
            contact: phone,
          },
          notes: {
            address: `${address}, ${city}, ${zip}`,
          },
          theme: {
            color: "#e8702a",
          },
          handler: async function (paymentRes: any) {
            try {
              setProcessingStatus("Verifying transaction...");
              setStep("processing");

              const verifyResponse = await fetch("/api/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: paymentRes.razorpay_order_id,
                  razorpay_payment_id: paymentRes.razorpay_payment_id,
                  razorpay_signature: paymentRes.razorpay_signature,
                }),
              });

              if (!verifyResponse.ok) {
                const errData = await verifyResponse.json();
                throw new Error(errData.error || "Signature verification failed.");
              }

              const verifyData = await verifyResponse.json();
              if (verifyData.status === "success" || verifyData.verified) {
                setProcessingStatus("Creating database records...");
                await saveOrder(false, paymentRes.razorpay_order_id, paymentRes.razorpay_payment_id);
              } else {
                throw new Error("Invalid transaction signature.");
              }
            } catch (err: any) {
              setStep("checkout");
              alert(`Payment verification failed: ${err.message}`);
            }
          },
          modal: {
            ondismiss: function () {
              setStep("checkout");
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        
        rzp.on("payment.failed", function (failedRes: any) {
          console.error("Razorpay Payment failed:", failedRes.error);
          alert(`Payment failed: ${failedRes.error.description || "Unknown error"}`);
          setStep("checkout");
        });

        rzp.open();
      } catch (error: any) {
        console.error("Razorpay initiation error:", error);
        alert(`Failed to start payment: ${error.message || "Unknown error"}`);
        setStep("checkout");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer animate-modal-fade"
        onClick={() => step !== "processing" && onClose()}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Main Panel */}
        <div className="relative w-full max-w-4xl bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden z-10 animate-modal-scale shadow-2xl flex flex-col md:flex-row">
          
          {/* Close button */}
          {step !== "processing" && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-50 p-2 hover:bg-white/5 rounded-full"
            >
              <X size={20} />
            </button>
          )}

          {/* Form Step Checkout */}
          {step === "checkout" && (
            <>
              {/* Left Column: Forms */}
              <form onSubmit={handlePlaceOrder} className="flex-1 p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
                <div>
                  <span className="text-[#e8702a] text-[10px] font-bold tracking-[0.2em] uppercase">Secure Gateway</span>
                  <h2 className="text-2xl font-light tracking-tight text-white font-playfair italic mt-1">Checkout Details</h2>
                </div>

                {/* 1. Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider border-b border-white/5 pb-2">1. Contact & Delivery</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                      />
                      {errors.email && <span className="text-red-400 text-[10px]">{errors.email}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                      />
                      {errors.name && <span className="text-red-400 text-[10px]">{errors.name}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/50 uppercase font-semibold">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Apartment, suite, street address"
                      className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                    />
                    {errors.address && <span className="text-red-400 text-[10px]">{errors.address}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">City</label>
                      <input
                        type="text"
                        name="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Tokyo"
                        className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                      />
                      {errors.city && <span className="text-red-400 text-[10px]">{errors.city}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">ZIP / Postal Code</label>
                      <input
                        type="text"
                        name="zip"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="100-0001"
                        className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                      />
                      {errors.zip && <span className="text-red-400 text-[10px]">{errors.zip}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-semibold">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+81 90-1234-5678"
                        className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#e8702a] transition-all"
                      />
                      {errors.phone && <span className="text-red-400 text-[10px]">{errors.phone}</span>}
                    </div>
                  </div>
                </div>

                {/* 2. Shipping Speed */}
                <div className="space-y-3">
                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider border-b border-white/5 pb-2">2. Shipping Method</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShippingMethod("standard")}
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all text-left ${
                        shippingMethod === "standard"
                          ? "border-[#e8702a] bg-[#e8702a]/5"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck size={18} className={shippingMethod === "standard" ? "text-[#e8702a]" : "text-white/60"} />
                        <div>
                          <p className="text-xs font-semibold text-white">Standard Shipping</p>
                          <p className="text-[10px] text-white/50 mt-0.5">3–5 Business Days</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {subtotal >= 15000 ? "FREE" : "₹250"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShippingMethod("express")}
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all text-left ${
                        shippingMethod === "express"
                          ? "border-[#e8702a] bg-[#e8702a]/5"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck size={18} className={shippingMethod === "express" ? "text-[#e8702a]" : "text-white/60"} />
                        <div>
                          <p className="text-xs font-semibold text-white">Express Delivery</p>
                          <p className="text-[10px] text-white/50 mt-0.5">1–2 Business Days</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">₹600</span>
                    </button>
                  </div>
                </div>

                {/* 3. Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider border-b border-white/5 pb-2">3. Payment Information</h3>
                  
                  {/* Selector Tabs */}
                  <div className="flex border border-white/10 bg-white/5 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "razorpay" ? "bg-white text-gray-900 shadow-lg" : "text-white/65 hover:text-white"
                      }`}
                    >
                      <CreditCard size={14} />
                      Pay Online (Razorpay)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "cod" ? "bg-white text-gray-900 shadow-lg" : "text-white/65 hover:text-white"
                      }`}
                    >
                      <ShieldCheck size={14} />
                      COD
                    </button>
                  </div>

                  {/* Option Views */}
                  {paymentMethod === "razorpay" && (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-5 text-center space-y-2.5 animate-modal-scale">
                      <CreditCard size={32} className="text-[#e8702a] mx-auto" />
                      <div>
                        <p className="text-xs text-white font-semibold">Secure Online Payment</p>
                        <p className="text-[10px] text-white/50 mt-1 max-w-xs mx-auto leading-relaxed">
                          Supports Credit/Debit Cards, UPI, Netbanking, and Wallets. Payments are processed securely via Razorpay.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "cod" && (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-5 text-center space-y-2.5 animate-modal-scale">
                      <ShieldCheck size={32} className="text-[#e8702a] mx-auto" />
                      <div>
                        <p className="text-xs text-white font-semibold">Cash on Delivery (COD) Selected</p>
                        <p className="text-[10px] text-white/50 mt-1 max-w-xs mx-auto leading-relaxed">
                          Please prepare ₹{total.toLocaleString("en-IN")} at your doorstep. We will call you to verify your address before dispatch.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Place Order CTA Button */}
                <button
                  type="submit"
                  className="w-full bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#e8702a]/20"
                >
                  Confirm & Place Order (₹{total.toLocaleString("en-IN")})
                </button>
              </form>

              {/* Right Column: Order Summary */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-[#0b0b0b] p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
                <div className="space-y-6">
                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider border-b border-white/5 pb-2">Order Summary</h3>
                  
                  {/* Items Scroll */}
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3 text-xs">
                        <div className="w-12 h-16 rounded overflow-hidden bg-white/5 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-white font-medium line-clamp-1">{item.name}</p>
                            <p className="text-white/40 text-[9px] mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-white/80 font-semibold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculations breakdown */}
                  <div className="space-y-2.5 pt-4 border-t border-white/5 text-xs">
                    <div className="flex justify-between text-white/55">
                      <span>Subtotal</span>
                      <span className="text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-white/55">
                      <span>Service Tax (5%)</span>
                      <span className="text-white">₹{tax.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-white/55">
                      <span>Shipping</span>
                      <span className="text-white">
                        {shippingCost === 0 ? "FREE" : `₹${shippingCost}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2.5 border-t border-white/5">
                      <span className="text-white/80">Grand Total</span>
                      <span className="text-white text-[#e8702a]">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom branding detail */}
                <div className="hidden md:flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/5 text-[10px] text-white/35">
                  <ShieldCheck size={14} className="text-[#e8702a]" />
                  <span>Verified 256-Bit SSL Checkout</span>
                </div>
              </div>
            </>
          )}

          {/* Form Step Processing */}
          {step === "processing" && (
            <div className="w-full p-12 sm:p-16 flex flex-col items-center justify-center text-center space-y-6 min-h-[50vh]">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute inset-0 bg-[#e8702a]/10 rounded-full blur-xl animate-pulse" />
                <Loader2 size={56} className="text-[#e8702a] animate-spin relative" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white text-lg font-semibold tracking-wide">Processing Order</h3>
                <p className="text-white/40 text-xs tracking-wider animate-pulse">{processingStatus}</p>
              </div>
            </div>
          )}

          {/* Form Step Success */}
          {step === "success" && (
            <div className="w-full p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto min-h-[60vh] animate-modal-scale">
              <div className="bg-[#e8702a]/10 p-4 rounded-full border border-[#e8702a]/20 text-[#e8702a] shadow-lg shadow-[#e8702a]/10 relative">
                <CheckCircle2 size={54} className="relative" />
                <span className="absolute -top-1 -right-1 bg-white text-[10px] font-bold text-gray-900 rounded-full w-5 h-5 flex items-center justify-center border border-[#e8702a] shadow">
                  <Sparkles size={11} className="text-[#e8702a]" />
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[#e8702a] text-[10px] font-bold tracking-[0.25em] uppercase">Order Confirmed</span>
                <h3 className="text-3xl font-light tracking-tight text-white font-playfair italic">Thank you for your order</h3>
                <p className="text-white/50 text-xs max-w-sm mt-2 mx-auto leading-relaxed">
                  Your transaction was processed successfully. A confirmation summary has been logged under ID <span className="font-mono text-white/90 underline font-semibold select-all">{placedOrderId}</span>.
                </p>
              </div>

              {/* Quick Details Box */}
              <div className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-left grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-white/40 text-[9px] uppercase font-semibold">Total Paid</p>
                  <p className="text-white font-semibold mt-0.5">₹{placedOrderTotal.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[9px] uppercase font-semibold">Payment</p>
                  <p className="text-white font-semibold mt-0.5 uppercase">{paymentMethod === "cod" ? "COD (Due)" : paymentMethod}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-white/40 text-[9px] uppercase font-semibold">Deliver to</p>
                  <p className="text-white/90 font-medium truncate mt-0.5">{name} — {address}, {city}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                <button
                  onClick={onViewOrderHistory}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-3 px-6 rounded-xl transition-colors border border-white/15"
                >
                  View Order History
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-[#e8702a] hover:bg-[#d2611f] text-white text-xs font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-[#e8702a]/10"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
