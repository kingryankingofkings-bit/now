
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getProducts, createOrder, addToWallet, recordPageView,
  getActiveSales, getActiveSaleForProduct, getDiscountedPrice, createSale, deleteSale, cleanupExpiredSales,
  type Product, type Sale, type DiscountPercent,
} from "@/lib/localDb";
import { toast } from "sonner";
import {
  ShoppingBag, Tag, Package, Star, X, Minus, Plus, Zap, Percent, Clock,
  Crown, Trash2, AlertCircle, Check, ChevronDown, ChevronUp,
} from "lucide-react";

type Category = "all" | "digital" | "physical" | "merch" | "exclusive";

const DURATION_OPTIONS: { label: string; ms: number }[] = [
  { label: "1 Hour", ms: 3600000 },
  { label: "6 Hours", ms: 21600000 },
  { label: "12 Hours", ms: 43200000 },
  { label: "24 Hours", ms: 86400000 },
  { label: "3 Days", ms: 259200000 },
  { label: "1 Week", ms: 604800000 },
];

/* ─── Sale Badge ─── */
function SaleBadge({ sale }: { sale: Sale }) {
  const hoursLeft = Math.max(0, Math.ceil((new Date(sale.expiresAt).getTime() - Date.now()) / 3600000));
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1 px-2 py-1 bg-[#c94a4a] text-white rounded text-[10px] font-mono font-bold">
        <Percent className="w-3 h-3" /> {sale.discountPercent}% OFF
      </span>
      <span className="flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-mono text-[#e8e6e3]">
        <Clock className="w-2.5 h-2.5" /> Ends in {hoursLeft >= 24 ? `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h` : `${hoursLeft}h`}
      </span>
    </div>
  );
}

/* ─── Purchase Modal ─── */
function PurchaseModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const { user, isAuthenticated } = useAuth();
  const activeSale = getActiveSaleForProduct(product.id);
  const displayPrice = activeSale ? getDiscountedPrice(product.price, activeSale.discountPercent) : product.price;

  const handlePurchase = () => {
    if (!isAuthenticated || !user) { toast.error("Please login to purchase"); return; }
    const total = (Number(displayPrice) * quantity).toFixed(2);
    createOrder({
      userId: user.id, userName: user.name,
      productId: product.id, productName: product.name,
      quantity, totalPrice: total, status: "pending",
    });
    addToWallet({ type: "order", amount: total, description: `Shop purchase: ${product.name} x${quantity}${activeSale ? ` (SALE -${activeSale.discountPercent}%)` : ""}`, fromName: user.name });
    toast.success(activeSale ? `Order placed! You saved ${activeSale.discountPercent}%!` : "Order placed successfully!");
    onClose();
  };

  const total = (Number(displayPrice) * quantity).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative liquid-glass rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button>
        <div className="flex items-start gap-4 mb-6">
          <img src={product.imageUrl || "/images/shop-digital.jpg"} alt={product.name} className="w-20 h-20 rounded-lg object-cover" />
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#e8e6e3]">{product.name}</h3>
            {activeSale ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-lg text-[#c94a4a]">${displayPrice}</span>
                <span className="font-mono text-sm text-[#8b8680] line-through">${product.price}</span>
                <span className="text-xs font-mono bg-[#c94a4a] text-white px-1.5 py-0.5 rounded">{activeSale.discountPercent}% OFF</span>
              </div>
            ) : (
              <p className="font-mono text-lg text-[#c9a96e] mt-1">${product.price}</p>
            )}
          </div>
        </div>
        {product.description && <p className="text-sm text-[#8b8680] mb-6">{product.description}</p>}
        {activeSale && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-[rgba(201,74,74,0.1)] border border-[rgba(201,74,74,0.2)] rounded-lg">
            <Percent className="w-4 h-4 text-[#c94a4a]" />
            <p className="text-xs text-[#e8e6e3]">Sale ends in {Math.max(0, Math.ceil((new Date(activeSale.expiresAt).getTime() - Date.now()) / 3600000))} hours</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-6 p-4 bg-[rgba(255,255,255,0.03)] rounded-lg">
          <span className="text-sm text-[#8b8680]">Quantity</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 rounded-lg bg-[#2a2d32] text-[#e8e6e3] hover:bg-[#343a40]"><Minus className="w-4 h-4" /></button>
            <span className="font-mono text-lg text-[#e8e6e3] w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="p-1 rounded-lg bg-[#2a2d32] text-[#e8e6e3] hover:bg-[#343a40]"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6 pt-4 border-t border-[rgba(201,169,110,0.1)]">
          <span className="text-sm text-[#8b8680]">Total</span>
          <span className="font-mono text-2xl text-[#c9a96e]">${total}</span>
        </div>
        <button onClick={handlePurchase} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors">
          Pay with PayPal
        </button>
      </div>
    </div>
  );
}

/* ─── King Sale Manager ─── */
function SaleManager() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [discount, setDiscount] = useState<DiscountPercent>(10);
  const [durationMs, setDurationMs] = useState<number>(86400000);
  const [saleName, setSaleName] = useState("");
  const [activeSales, setActiveSales] = useState<Sale[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const allProducts = getProducts().filter((p) => p.isActive);

  const refresh = () => {
    cleanupExpiredSales();
    setActiveSales(getActiveSales());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const toggleProduct = (id: number) => {
    setSelectedProductIds((prev) => prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedProductIds.length === allProducts.length) setSelectedProductIds([]);
    else setSelectedProductIds(allProducts.map((p) => p.id));
  };

  const handleCreateSale = () => {
    if (selectedProductIds.length === 0) { toast.error("Select at least one product"); return; }
    if (!saleName.trim()) { toast.error("Give your sale a name"); return; }
    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    createSale({
      name: saleName.trim(),
      discountPercent: discount,
      productIds: selectedProductIds,
      expiresAt,
    });
    toast.success(`Sale created! ${discount}% off on ${selectedProductIds.length} products.`);
    setShowCreate(false);
    setSelectedProductIds([]);
    setSaleName("");
    refresh();
  };

  const handleEndSale = (id: number) => {
    deleteSale(id);
    refresh();
    toast.success("Sale ended");
  };

  return (
    <div className="mb-10 p-5 rounded-xl border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.03)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(201,169,110,0.1)] flex items-center justify-center">
            <Crown className="w-4 h-4 text-[#c9a96e]" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#e8e6e3]">Sale Manager</h2>
            <p className="text-xs text-[#8b8680]">Create temporary discounts for your merchandise</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeSales.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-[#c94a4a] text-white text-[10px] font-mono rounded-full">
              <Percent className="w-3 h-3" /> {activeSales.length} ACTIVE
            </span>
          )}
          <button onClick={() => setShowDetails(!showDetails)} className="text-xs text-[#8b8680] hover:text-[#c9a96e] flex items-center gap-1">
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} {showDetails ? "Collapse" : "Manage"}
          </button>
          <button onClick={() => { setShowCreate(true); setShowDetails(true); }} className="px-3 py-1.5 bg-[#c9a96e] text-[#1a1d21] text-xs font-medium rounded-lg hover:bg-[#d4b87a]">
            + New Sale
          </button>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Active sales list */}
          {activeSales.length > 0 && (
            <div className="space-y-2 mb-4">
              {activeSales.map((sale) => {
                const hoursLeft = Math.max(0, Math.ceil((new Date(sale.expiresAt).getTime() - Date.now()) / 3600000));
                const productNames = allProducts
                  .filter((p) => sale.productIds.includes(p.id))
                  .map((p) => p.name)
                  .join(", ");
                return (
                  <div key={sale.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#23262a] border border-[rgba(201,74,74,0.15)]">
                    <Percent className="w-4 h-4 text-[#c94a4a] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#e8e6e3]">{sale.name}</span>
                        <span className="text-[10px] font-mono bg-[#c94a4a] text-white px-1.5 py-0.5 rounded">{sale.discountPercent}% OFF</span>
                      </div>
                      <p className="text-[10px] text-[#8b8680] truncate">{productNames}</p>
                      <p className="text-[10px] text-[#8b8680] flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" /> Ends in {hoursLeft >= 24 ? `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h` : `${hoursLeft}h`}
                      </p>
                    </div>
                    <button onClick={() => handleEndSale(sale.id)} className="p-1.5 text-[#8b8680] hover:text-[#c94a4a] rounded-lg hover:bg-[rgba(201,74,74,0.1)] transition-colors" title="End sale">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create sale form */}
          {showCreate && (
            <div className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.12)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#e8e6e3]">Create New Sale</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-4 h-4" /></button>
              </div>

              {/* Sale name */}
              <input type="text" value={saleName} onChange={(e) => setSaleName(e.target.value)}
                className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]"
                placeholder="Sale name (e.g., Flash Friday Sale)" />

              {/* Discount selection */}
              <div>
                <p className="text-xs text-[#8b8680] mb-2">Discount Amount</p>
                <div className="flex gap-2">
                  {([10, 20, 50] as DiscountPercent[]).map((pct) => (
                    <button key={pct} onClick={() => setDiscount(pct)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${discount === pct ? "bg-[#c94a4a] text-white" : "bg-[#1a1d21] text-[#8b8680] hover:text-[#e8e6e3]"}`}>
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration selection */}
              <div>
                <p className="text-xs text-[#8b8680] mb-2">Duration</p>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button key={opt.ms} onClick={() => setDurationMs(opt.ms)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${durationMs === opt.ms ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#1a1d21] text-[#8b8680] hover:text-[#e8e6e3]"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#8b8680]">Apply to Products ({selectedProductIds.length} selected)</p>
                  <button onClick={selectAll} className="text-[10px] text-[#c9a96e] hover:text-[#d4b87a]">
                    {selectedProductIds.length === allProducts.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1">
                  {allProducts.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    const salePrice = getDiscountedPrice(product.price, discount);
                    return (
                      <button key={product.id} onClick={() => toggleProduct(product.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${isSelected ? "bg-[rgba(201,169,110,0.1)] border border-[#c9a96e]" : "bg-[#1a1d21] border border-transparent hover:border-[rgba(201,169,110,0.1)]"}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#c9a96e] border-[#c9a96e]" : "border-[#8b8680]"}`}>
                          {isSelected && <Check className="w-3 h-3 text-[#1a1d21]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[#e8e6e3] truncate">{product.name}</p>
                          <p className="text-[10px] text-[#8b8680]">${product.price} {isSelected && <span className="text-[#c94a4a]">&rarr; ${salePrice}</span>}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary + Create */}
              <div className="pt-3 border-t border-[rgba(201,169,110,0.08)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-[#8b8680]">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Sale expires: {new Date(Date.now() + durationMs).toLocaleString()}
                  </p>
                </div>
                <button onClick={handleCreateSale}
                  disabled={selectedProductIds.length === 0 || !saleName.trim()}
                  className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <Percent className="w-4 h-4" /> Start {discount}% Sale on {selectedProductIds.length} Product{selectedProductIds.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
export default function Shop() {
  const { isKing } = useAuth();
  const [category, setCategory] = useState<Category>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    recordPageView("shop");
    cleanupExpiredSales();
    setProducts(getProducts().filter((p) => p.isActive));
  }, []);

  const filtered = category === "all" ? products : products.filter((p) => p.category === category);

  const categoryIcons: Record<string, React.ReactNode> = {
    digital: <Zap className="w-4 h-4" />,
    physical: <Package className="w-4 h-4" />,
    merch: <Tag className="w-4 h-4" />,
    exclusive: <Star className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-[#c9a96e]" />
            <span className="font-mono text-xs text-[#c9a96e] tracking-[0.2em] uppercase">Support the Craft</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-[#e8e6e3] mb-2">The Shop</h1>
          <p className="text-sm text-[#8b8680]">Exclusive digital art, prints, merch, and one-on-one sessions.</p>
        </div>

        {/* King-only Sale Manager */}
        {isKing && <SaleManager />}

        <div className="flex flex-wrap gap-2 mb-10">
          {(["all", "digital", "physical", "merch", "exclusive"] as Category[]).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === cat ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#23262a] text-[#8b8680] hover:text-[#e8e6e3] hover:bg-[#2a2d32]"}`}>
              {cat !== "all" && categoryIcons[cat]} {cat === "all" ? "All Products" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => {
            const activeSale = getActiveSaleForProduct(product.id);
            const salePrice = activeSale ? getDiscountedPrice(product.price, activeSale.discountPercent) : null;
            return (
              <div key={product.id} className="group rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] overflow-hidden hover:border-[rgba(201,169,110,0.2)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img src={product.imageUrl || "/images/shop-digital.jpg"} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-mono text-[#c9a96e]">
                      {categoryIcons[product.category || "digital"]} {(product.category || "digital").toUpperCase()}
                    </span>
                  </div>
                  {/* Sale badge */}
                  {activeSale && (
                    <div className="absolute top-3 right-3">
                      <SaleBadge sale={activeSale} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-[#e8e6e3] line-clamp-1 mb-1">{product.name}</h3>
                  <p className="text-xs text-[#8b8680] line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    {activeSale ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg text-[#c94a4a]">${salePrice}</span>
                        <span className="font-mono text-xs text-[#8b8680] line-through">${product.price}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-lg text-[#c9a96e]">${product.price}</span>
                    )}
                    <button onClick={() => setSelectedProduct(product)} className="px-4 py-1.5 bg-[#c9a96e] text-[#1a1d21] text-xs font-medium rounded-lg hover:bg-[#d4b87a] transition-colors">
                      {activeSale ? "Buy Now" : "Buy"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedProduct && <PurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}