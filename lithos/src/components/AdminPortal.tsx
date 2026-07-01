import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ArrowLeft, AlertCircle, Sparkles, Check, Image as ImageIcon, Calendar, ChevronDown, ChevronUp, Package } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product } from "./ProductGrid";

import type { Faq } from "./FaqsSection";

interface AdminPortalProps {
  products: Product[];
  onBack: () => void;
  onRefreshProducts: () => Promise<void>;
  faqs: Faq[];
  onRefreshFaqs: () => Promise<void>;
}

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
}

export default function AdminPortal({
  products,
  onBack,
  onRefreshProducts,
  faqs,
  onRefreshFaqs,
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "faqs" | "orders">("catalog");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Tops");
  const [image, setImage] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [stock, setStock] = useState("10");
  
  // FAQs form fields
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqDisplayOrder, setFaqDisplayOrder] = useState("1");

  // Orders states
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories = ["Tops", "Outerwear", "Bottoms", "Knitwear", "Accessories"];

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setCategory("Tops");
    setImage("");
    setIsNew(false);
    setStock("10");
    setError(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setImage(product.image);
    setIsNew(!!product.isNew);
    setStock(product.stock_quantity !== undefined ? product.stock_quantity.toString() : "10");
    setError(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openAddFaqModal = () => {
    setEditingFaq(null);
    setFaqQuestion("");
    setFaqAnswer("");
    setFaqDisplayOrder((faqs.length + 1).toString());
    setError(null);
    setSuccessMsg(null);
    setIsFaqModalOpen(true);
  };

  const openEditFaqModal = (faq: Faq) => {
    setEditingFaq(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqDisplayOrder((faq.display_order || 0).toString());
    setError(null);
    setSuccessMsg(null);
    setIsFaqModalOpen(true);
  };

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      setError("Question and Answer are required.");
      return;
    }

    const orderNum = parseInt(faqDisplayOrder, 10);
    if (isNaN(orderNum) || orderNum < 0) {
      setError("Please enter a valid display order.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const faqPayload = {
      question: faqQuestion,
      answer: faqAnswer,
      display_order: orderNum,
    };

    try {
      if (editingFaq) {
        const { error: updateErr } = await supabase
          .from("faqs")
          .update(faqPayload)
          .eq("id", editingFaq.id);
        if (updateErr) throw updateErr;
        setSuccessMsg("FAQ updated successfully!");
      } else {
        const { error: insertErr } = await supabase
          .from("faqs")
          .insert([faqPayload]);
        if (insertErr) throw insertErr;
        setSuccessMsg("FAQ added successfully!");
      }

      await onRefreshFaqs();
      setTimeout(() => setIsFaqModalOpen(false), 800);
    } catch (err: any) {
      console.error("Error saving FAQ:", err);
      setError(err.message || "Failed to save FAQ.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error: delErr } = await supabase
        .from("faqs")
        .delete()
        .eq("id", id);
      if (delErr) throw delErr;
      setSuccessMsg("FAQ deleted successfully!");
      await onRefreshFaqs();
    } catch (err: any) {
      console.error("Error deleting FAQ:", err);
      setError(err.message || "Failed to delete FAQ.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setOrders(data as Order[]);
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to load orders from database.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      setSuccessMsg(`Order status updated to ${newStatus} successfully!`);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Error updating order status:", err);
      setError(err.message || "Failed to update order status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !category.trim() || !image.trim() || stock === "") {
      setError("All fields are required.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const productPayload = {
      name,
      price: priceNum,
      category,
      image,
      is_new: isNew,
      stock_quantity: stockNum,
    };

    try {
      if (editingProduct) {
        // Update product
        const { error: dbErr } = await supabase
          .from("products")
          .update(productPayload)
          .eq("id", editingProduct.id);

        if (dbErr) throw dbErr;
        setSuccessMsg(`Successfully updated "${name}"`);
      } else {
        // Insert product
        const { error: dbErr } = await supabase
          .from("products")
          .insert([productPayload]);

        if (dbErr) throw dbErr;
        setSuccessMsg(`Successfully added "${name}"`);
      }

      await onRefreshProducts();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      console.error("Database save error:", err);
      setError(err.message || "Failed to save product database changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    setError(null);
    setSuccessMsg(null);
    try {
      const { error: dbErr } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (dbErr) throw dbErr;
      
      setSuccessMsg(`Deleted "${productName}"`);
      await onRefreshProducts();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Database delete error:", err);
      setError(err.message || "Failed to delete product from database.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Portal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-8 mb-10 gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 border border-white/10 rounded-full hover:bg-white/5 hover:border-white/20 transition-all text-white/70 hover:text-white"
              title="Back to Catalog"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[#e8702a] text-xs font-semibold tracking-[0.25em] uppercase mb-1">
                Store Management
              </p>
              <h1 className="text-3xl font-light tracking-tight font-playfair italic">
                Sakamoto Admin <span className="font-sans font-normal text-2xl not-italic">Portal</span>
              </h1>
            </div>
          </div>
          
          {activeTab === "catalog" && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 bg-[#e8702a] hover:bg-[#d2611f] text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-98 shadow-lg shadow-[#e8702a]/15 shrink-0"
            >
              <Plus size={16} />
              Add New Product
            </button>
          )}
          {activeTab === "faqs" && (
            <button
              onClick={openAddFaqModal}
              className="flex items-center justify-center gap-2 bg-[#e8702a] hover:bg-[#d2611f] text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-98 shadow-lg shadow-[#e8702a]/15 shrink-0"
            >
              <Plus size={16} />
              Add New FAQ
            </button>
          )}
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm rounded-xl p-4 flex items-start gap-3">
            <Check size={18} className="mt-0.5 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex gap-6 border-b border-white/10 mb-8 pb-3">
          <button
            onClick={() => {
              setActiveTab("catalog");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`text-sm font-semibold tracking-wider uppercase transition-all pb-2.5 relative ${
              activeTab === "catalog"
                ? "text-[#e8702a]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Manage Catalog
            {activeTab === "catalog" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#e8702a]" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("faqs");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`text-sm font-semibold tracking-wider uppercase transition-all pb-2.5 relative ${
              activeTab === "faqs"
                ? "text-[#e8702a]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Manage FAQs
            {activeTab === "faqs" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#e8702a]" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("orders");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`text-sm font-semibold tracking-wider uppercase transition-all pb-2.5 relative ${
              activeTab === "orders"
                ? "text-[#e8702a]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Manage Orders
            {activeTab === "orders" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#e8702a]" />
            )}
          </button>
        </div>

        {/* Products List */}
        {activeTab === "catalog" && (
          products.length === 0 ? (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
              <ImageIcon className="mx-auto text-white/20 mb-4" size={48} />
              <h3 className="text-lg font-medium text-white/80">No products found</h3>
              <p className="text-white/40 text-sm mt-1 mb-6">Database is empty. Add a product to get started.</p>
              <button
                onClick={openAddModal}
                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
              >
                Create Product
              </button>
            </div>
          ) : (
          <div className="overflow-hidden bg-[#111111] border border-white/10 rounded-2xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider bg-white/[0.02]">
                    <th className="px-6 py-4">Product Info</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Badges</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Product details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 rounded bg-[#1a1a1a] overflow-hidden shrink-0 border border-white/10">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback image if missing/broken
                                (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/identicon/svg?seed=" + product.name;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-white/90">{product.name}</div>
                            <div className="text-xs text-white/30 truncate max-w-xs mt-0.5">{product.image}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-white/70">
                        <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-semibold text-white/90">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 text-white/70">
                        {product.stock_quantity !== undefined ? product.stock_quantity : 10}
                      </td>

                      {/* Badges */}
                      <td className="px-6 py-4">
                        {product.isNew ? (
                          <span className="flex items-center gap-1 text-[#e8702a] text-xs font-bold uppercase tracking-wider bg-[#e8702a]/10 border border-[#e8702a]/20 w-fit px-2.5 py-0.5 rounded-full">
                            <Sparkles size={10} />
                            New
                          </span>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-white/60 hover:text-[#e8702a] hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                            title="Edit clothing item"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors border border-transparent hover:border-red-500/10"
                            title="Delete clothing item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {/* Render FAQs Manager */}
        {activeTab === "faqs" && (
          <div>
            {faqs.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                <Sparkles className="mx-auto text-white/20 mb-4" size={48} />
                <h3 className="text-lg font-medium text-white/80">No FAQs found</h3>
                <p className="text-white/40 text-sm mt-1 mb-6">Database is empty. Add an FAQ to get started.</p>
                <button
                  onClick={openAddFaqModal}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
                >
                  Create FAQ
                </button>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-xl animate-modal-fade">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-xs font-semibold uppercase tracking-wider bg-white/[0.02]">
                        <th className="px-6 py-4 w-1/4">Question</th>
                        <th className="px-6 py-4 w-1/2">Answer</th>
                        <th className="px-6 py-4 text-center">Order</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {[...faqs].sort((a,b) => (a.display_order||0)-(b.display_order||0)).map((faq) => (
                        <tr key={faq.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 font-semibold text-white/95">{faq.question}</td>
                          <td className="px-6 py-4 text-white/60 text-xs leading-relaxed max-w-[400px]">
                            {faq.answer}
                          </td>
                          <td className="px-6 py-4 text-center text-white/70">{faq.display_order}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2.5">
                              <button
                                onClick={() => openEditFaqModal(faq)}
                                className="p-2 text-white/60 hover:text-[#e8702a] hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
                                title="Edit FAQ"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors border border-transparent hover:border-red-500/10"
                                title="Delete FAQ"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Render Orders Manager */}
        {activeTab === "orders" && (
          <div>
            {ordersLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
                <div className="w-8 h-8 border-2 border-[#e8702a]/30 border-t-[#e8702a] rounded-full animate-spin" />
                <p className="text-white/40 text-xs tracking-wider">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl animate-modal-scale">
                <Package className="mx-auto text-white/20 mb-4" size={48} />
                <h3 className="text-lg font-medium text-white/80">No orders found</h3>
                <p className="text-white/40 text-sm mt-1">Database is empty. Sales will appear here once checked out.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-modal-fade">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const itemsCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  
                  return (
                    <div
                      key={order.id}
                      className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden transition-all duration-300"
                    >
                      {/* Collapsed view header */}
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-white/[0.02] transition-all gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-xs text-white/50 font-mono truncate max-w-[150px] sm:max-w-none">
                              ID: {order.id}
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-xs text-white/80 font-medium truncate">
                              {order.customer_name} ({order.customer_email})
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3.5 text-xs text-white/40">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              {new Date(order.created_at).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <Package size={12} />
                              {itemsCount} {itemsCount === 1 ? "item" : "items"}
                            </span>
                          </div>
                        </div>

                        {/* Status override and total */}
                        <div className="flex items-center justify-between sm:justify-end gap-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={loading}
                              className="bg-white/5 border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg outline-none focus:border-[#e8702a] transition-all"
                            >
                              <option value="pending" className="bg-[#0e0e0e] text-amber-400 font-semibold">Pending</option>
                              <option value="paid" className="bg-[#0e0e0e] text-emerald-400 font-semibold">Paid</option>
                              <option value="shipped" className="bg-[#0e0e0e] text-blue-400 font-semibold">Shipped</option>
                              <option value="delivered" className="bg-[#0e0e0e] text-[#e8702a] font-semibold">Delivered</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-4">
                            <p className="text-[#e8702a] font-semibold text-base whitespace-nowrap">
                              ₹{order.total.toLocaleString("en-IN")}
                            </p>
                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              className="text-white/40 hover:text-white p-1 transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded order details block */}
                      {isExpanded && (
                        <div className="border-t border-white/10 bg-black/40 p-5 space-y-5 animate-modal-scale">
                          {/* Order Items Table */}
                          <div className="space-y-3">
                            <p className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">Line Items</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {order.order_items?.map((item) => (
                                <div key={item.id} className="flex gap-4 border border-white/5 rounded-xl p-3 bg-white/[0.01]">
                                  <div className="w-12 h-16 rounded bg-white/5 overflow-hidden flex-shrink-0 border border-white/10">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-between text-xs">
                                    <div>
                                      <p className="text-white font-medium truncate">{item.name}</p>
                                      <p className="text-white/45 text-[10px] mt-0.5">{item.category} • Qty: {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-white/70">
                                      <span>₹{item.price.toLocaleString("en-IN")} each</span>
                                      <span className="font-semibold text-white">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Pricing Breakdown */}
                          <div className="border-t border-white/5 pt-4 space-y-1.5 text-xs text-white/50 max-w-sm ml-auto">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span className="text-white/80">₹{order.subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping Cost</span>
                              <span className="text-white/80">{order.shipping_cost === 0 ? "FREE" : `₹${order.shipping_cost}`}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold text-white pt-1.5 border-t border-white/5">
                              <span>Order Total</span>
                              <span className="text-[#e8702a]">₹{order.total.toLocaleString("en-IN")}</span>
                            </div>
                          </div>

                          {/* Delivery coordinates and payment method */}
                          <div className="border-t border-white/5 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-white/60">
                            <div>
                              <p className="text-[10px] text-white/40 uppercase font-semibold mb-1">Shipping Details</p>
                              <p className="text-white/80 font-medium">{order.customer_name}</p>
                              <p className="text-white/60 font-light mt-0.5">{order.shipping_address?.phone || "No phone contact"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/40 uppercase font-semibold mb-1">Delivery Address</p>
                              <p className="text-white/80 leading-relaxed font-light">
                                {order.shipping_address?.address},<br />
                                {order.shipping_address?.city} {order.shipping_address?.zip}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/40 uppercase font-semibold mb-1">Transaction Info</p>
                              <p className="text-white/85">Payment Type: <strong className="text-white">{order.payment_method}</strong></p>
                              <p className="text-white/50 mt-1 flex flex-wrap gap-1 items-center">
                                Payment ID: 
                                <span className="font-mono text-[10px] text-white/70 break-all select-all">
                                  {order.shipping_address?.razorpay_payment_id || "COD Order"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-fade">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
            onClick={() => !loading && setIsModalOpen(false)}
          />

          {/* Form container */}
          <div className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 sm:p-8 overflow-hidden z-10 animate-modal-scale shadow-2xl">
            <h2 className="text-2xl font-light tracking-tight font-playfair italic mb-1">
              {editingProduct ? "Edit Clothing Item" : "Add New Clothing Item"}
            </h2>
            <p className="text-white/40 text-xs mb-6">
              {editingProduct ? "Modify existing properties in the database" : "Insert a new streetwear piece into the catalog"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Graphic Heavyweight Tee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                  required
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3999"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25em 1.25em',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0e0e0e] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Image Path / URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. /images/product-tee-black.png or http://..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                  required
                />
                <p className="text-white/30 text-[10px] mt-1.5">
                  Use local placeholder paths (/images/...) or remote HTTPS image URLs.
                </p>
              </div>

              {/* Badges / Options */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isNew"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#e8702a] focus:ring-[#e8702a] focus:ring-offset-[#0e0e0e] transition-all"
                />
                <label htmlFor="isNew" className="text-white/70 text-sm font-medium cursor-pointer">
                  Mark as "New Arrival" (Shows Sparkle Badge)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="px-5 py-3 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#e8702a] hover:bg-[#d2611f] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#e8702a]/15"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editingProduct ? (
                    "Save Changes"
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQs Modal */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-[150] overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
            onClick={() => setIsFaqModalOpen(false)}
          />
          
          {/* Modal Box */}
          <div className="relative bg-[#0e0e0e] border border-white/15 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl z-10 animate-modal-scale max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-light tracking-tight font-playfair italic text-white mb-6">
              {editingFaq ? "Edit FAQ" : "Add New FAQ"}
            </h2>

            <form onSubmit={handleFaqSubmit} className="space-y-5">
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Question
                </label>
                <input
                  type="text"
                  placeholder="e.g. Do you ship worldwide?"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Answer
                </label>
                <textarea
                  placeholder="e.g. Yes, we ship standard and express worldwide..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  disabled={loading}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={faqDisplayOrder}
                  onChange={(e) => setFaqDisplayOrder(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-[#e8702a] transition-all"
                  required
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/15 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  disabled={loading}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm py-3.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#e8702a] hover:bg-[#d2611f] disabled:opacity-55 text-white font-semibold text-sm py-3.5 rounded-xl transition-all"
                >
                  {loading ? "Saving..." : "Save FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
