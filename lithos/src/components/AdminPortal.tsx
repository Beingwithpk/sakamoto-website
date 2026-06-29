import React, { useState } from "react";
import { Plus, Edit2, Trash2, ArrowLeft, AlertCircle, Sparkles, Check, Image as ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product } from "./ProductGrid";

interface AdminPortalProps {
  products: Product[];
  onBack: () => void;
  onRefreshProducts: () => Promise<void>;
}

export default function AdminPortal({ products, onBack, onRefreshProducts }: AdminPortalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Tops");
  const [image, setImage] = useState("");
  const [isNew, setIsNew] = useState(false);
  
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
    setError(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !category.trim() || !image.trim()) {
      setError("All fields are required.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid price.");
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
          
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-[#e8702a] hover:bg-[#d2611f] text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-98 shadow-lg shadow-[#e8702a]/15 shrink-0"
          >
            <Plus size={16} />
            Add New Product
          </button>
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

        {/* Products List */}
        {products.length === 0 ? (
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

              {/* Price & Category */}
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
    </div>
  );
}
