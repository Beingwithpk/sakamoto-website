import React, { useState, useEffect } from "react";
import { X, CreditCard, QrCode, Truck, CheckCircle2, Loader2, Sparkles, ShieldCheck } from "lucide-react";
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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  
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

  // Luhn algorithm validator for simulated cards
  const validateLuhn = (num: string) => {
    const cleanNum = num.replace(/\s+/g, "");
    if (!/^\d{13,19}$/.test(cleanNum)) return false;
    
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNum.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Inputs formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ").substring(0, 19);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 2) {
      raw = raw.substring(0, 2) + "/" + raw.substring(2, 4);
    }
    setExpiry(raw.substring(0, 5));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").substring(0, 4);
    setCvv(raw);
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

    // Validate payment fields if Card selected
    if (paymentMethod === "card") {
      const cleanCard = cardNumber.replace(/\s+/g, "");
      if (!cleanCard || cleanCard.length < 13) {
        newErrors.cardNumber = "Valid card number is required";
      } else if (!validateLuhn(cleanCard) && cleanCard !== "4242424242424242") { // Allow 4242 debug card bypass
        newErrors.cardNumber = "Card failed Luhn checksum validation (invalid card)";
      }
      
      if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
        newErrors.expiry = "Use MM/YY format";
      } else {
        const [m, y] = expiry.split("/").map(Number);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        if (m < 1 || m > 12 || y < currentYear || (y === currentYear && m < currentMonth)) {
          newErrors.expiry = "Card has expired";
        }
      }

      if (!cvv || cvv.length < 3) newErrors.cvv = "Valid CVV is required";
      if (!cardName.trim()) newErrors.cardName = "Cardholder name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to error
      const firstError = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setStep("processing");

    // Simulate payment authorization updates
    const processSteps = [
      { text: "Verifying shipping address...", delay: 600 },
      { text: "Contacting payment gateway auth...", delay: 1000 },
      { text: "Securing payment confirmation...", delay: 800 },
      { text: "Creating database records...", delay: 600 },
    ];

    for (const stepInfo of processSteps) {
      setProcessingStatus(stepInfo.text);
      await new Promise((resolve) => setTimeout(resolve, stepInfo.delay));
    }

    // Generate simulated Order ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const finalOrderId = `SAK-${datePrefix}-${randomSuffix}`;

    const newOrder = {
      customer_email: email,
      customer_name: name,
      shipping_address: {
        address,
        city,
        zip,
        phone,
        method: shippingMethod,
      },
      subtotal,
      shipping_cost: shippingCost,
      total,
      payment_method: paymentMethod.toUpperCase(),
      status: paymentMethod === "cod" ? "pending" : "paid",
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

  // QR Timer simulation
  const [qrTimer, setQrTimer] = useState(300); // 5 min
  useEffect(() => {
    if (paymentMethod !== "upi" || step !== "checkout") return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod, step]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "card" ? "bg-white text-gray-900 shadow-lg" : "text-white/65 hover:text-white"
                      }`}
                    >
                      <CreditCard size={14} />
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "upi" ? "bg-white text-gray-900 shadow-lg" : "text-white/65 hover:text-white"
                      }`}
                    >
                      <QrCode size={14} />
                      UPI QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === "cod" ? "bg-white text-gray-900 shadow-lg" : "text-white/65 hover:text-white"
                      }`}
                    >
                      COD
                    </button>
                  </div>

                  {/* Option Views */}
                  {paymentMethod === "card" && (
                    <div className="space-y-4 bg-white/5 border border-white/5 rounded-xl p-4 animate-modal-scale">
                      <div className="flex justify-between items-center text-[10px] text-white/50 uppercase font-semibold">
                        <span>Card Details</span>
                        <div className="flex gap-1.5 text-white/40">
                          <span className="border border-white/10 px-1 rounded bg-black">Visa</span>
                          <span className="border border-white/10 px-1 rounded bg-black">MC</span>
                          <span className="border border-white/10 px-1 rounded bg-black">Amex</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-white/50 uppercase font-semibold">Card Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="cardNumber"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4242 4242 4242 4242"
                            className="w-full bg-[#090909] border border-white/10 rounded-lg px-3.5 py-2 pl-10 text-sm text-white focus:outline-none focus:border-[#e8702a]"
                          />
                          <CreditCard size={16} className="absolute left-3.5 top-2.5 text-white/40" />
                        </div>
                        {errors.cardNumber && <span className="text-red-400 text-[10px]">{errors.cardNumber}</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-white/50 uppercase font-semibold">Expiry Date</label>
                          <input
                            type="text"
                            name="expiry"
                            value={expiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            className="bg-[#090909] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#e8702a]"
                          />
                          {errors.expiry && <span className="text-red-400 text-[10px]">{errors.expiry}</span>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] text-white/50 uppercase font-semibold">CVV Code</label>
                          <input
                            type="password"
                            name="cvv"
                            value={cvv}
                            onChange={handleCvvChange}
                            placeholder="•••"
                            className="bg-[#090909] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#e8702a]"
                          />
                          {errors.cvv && <span className="text-red-400 text-[10px]">{errors.cvv}</span>}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-white/50 uppercase font-semibold">Cardholder Name</label>
                        <input
                          type="text"
                          name="cardName"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="NAME ON CARD"
                          className="bg-[#090909] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white uppercase focus:outline-none focus:border-[#e8702a] tracking-wider"
                        />
                        {errors.cardName && <span className="text-red-400 text-[10px]">{errors.cardName}</span>}
                      </div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className="flex flex-col items-center gap-4 bg-white/5 border border-white/5 rounded-xl p-6 text-center animate-modal-scale">
                      <div className="bg-white p-3 rounded-xl shadow-lg border-2 border-[#e8702a]">
                        {/* SVG QR Code Simulation */}
                        <svg width="128" height="128" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100" height="100" fill="white" />
                          <path d="M5 5h30v30H5V5zm4 4v22h22V9H9zM5 65h30v30H5V65zm4 4v22h22V69H9zM65 5h30v30H65V5zm4 4v22h22V9H69z" fill="black" />
                          <path d="M15 15h10v10H15V15zm0 60h10v10H15V75zm60-60h10v10H75V15z" fill="black" />
                          <path d="M45 10h10v10H45V10zm5 15h10v20H50V25zm10 5h10v10H60V30zm5 15h15v10H65V45zm-15 5h10v10H50V50zm-10 5h20v10H40V55zm5 15h10v15H45V70zm15 5h15v10H60V75zm15-15h10v10H75V60zm5 15h10v10H80V75zm10-35h5v20h-5V40zm-45 5h10v10H35V45zm30 15h10v10H65V60z" fill="black" />
                        </svg>
                      </div>

                      <div>
                        <p className="text-xs text-white font-medium">Scan to Pay via UPI apps</p>
                        <p className="text-[10px] text-white/50 mt-1 max-w-xs leading-relaxed">
                          Scan the code with any app like GPay, PhonePe, or BHIM. Transaction code: <span className="font-mono text-white/70">SAK-{Math.floor(100000 + Math.random() * 900000)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#e8702a] font-semibold bg-[#e8702a]/10 px-3 py-1.5 rounded-full border border-[#e8702a]/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8702a] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e8702a]"></span>
                        </span>
                        Awaiting Payment: {formatTime(qrTimer)}
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
