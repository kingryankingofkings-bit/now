
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  getPosts,
  addPost,
  editPost,
  deletePost,
  getProducts,
  addProduct,
  editProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  getMessages,
  getFanConversations,
  getWallet,
  requestWithdrawal,
  completeWithdrawal,
  getPolls,
  addPoll,
  deletePoll,
  getStories,
  addStory,
  deleteStory,
  setKingLive,
  getKingLive,
  type Post,
  type Product,
  type MediaType,
} from "@/lib/localDb";
import {
  Crown, BarChart3, FileText, ShoppingBag, DollarSign, TrendingUp,
  Plus, Trash2, Edit3, X, Check, Users, MessageSquare, Star,
  Image, Video, Music, File, Lock, Wallet as WalletIcon, ArrowDownToLine,
  BarChart3 as PollIcon, Flame, Bot,
  Broadcast,
} from "lucide-react";

type Tab = "overview" | "posts" | "products" | "orders" | "messages" | "wallet" | "polls" | "stories";

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#8b8680]">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[rgba(201,169,110,0.1)] flex items-center justify-center"><Icon className="w-4 h-4 text-[#c9a96e]" /></div>
      </div>
      <p className="font-mono text-2xl text-[#e8e6e3] font-semibold">{value}</p>
    </div>
  );
}

export default function Admin() {
  const { isAuthenticated, isKing } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState(getOrders());
  const [fans, setFans] = useState(getFanConversations());
  const [wallet, setWallet] = useState(getWallet());
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newPost, setNewPost] = useState({ title: "", content: "", type: "thought" as const, tier: "public" as const, mediaType: "none" as MediaType, mediaUrl: null as string | null, downloadUrl: null as string | null });
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", category: "digital" as const });
  // polls & stories
  const [polls, setPolls] = useState(getPolls());
  const [stories, setStories] = useState(getStories());
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: "", options: ["", ""] });
  const [newStory, setNewStory] = useState({ content: "", imageUrl: "" });

  // Track live streaming state. When the King toggles the live button, this state is updated
  // and persisted via setKingLive. A live stream will show a banner on the feed page.
  const [kingLive, setKingLiveFlag] = useState(getKingLive());

  const handleToggleLive = () => {
    const next = !kingLive;
    setKingLive(next);
    setKingLiveFlag(next);
    toast.success(next ? "You are now live!" : "Live stream ended.");
  };

  const refresh = () => {
    setPosts(getPosts());
    setProducts(getProducts());
    setOrders(getOrders());
    setFans(getFanConversations());
    setWallet(getWallet());
    setPolls(getPolls());
    setStories(getStories());
  };

  useEffect(() => { refresh(); }, []);

  if (!isAuthenticated || !isKing) {
    return (
      <div className="min-h-screen bg-[#1a1d21] pt-24 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-12 h-12 text-[#c94a4a] mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#e8e6e3] mb-2">King Access Only</h2>
          <p className="text-sm text-[#8b8680] mb-6">This area is restricted to the King account.</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-[#c9a96e] text-[#1a1d21] rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const fanaticFans = fans.filter((f) => f.fanTier === "fanatic").length;

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    addPost(newPost);
    setNewPost({ title: "", content: "", type: "thought", tier: "public", mediaType: "none", mediaUrl: null, downloadUrl: null });
    setShowCreatePost(false);
    refresh();
    toast.success("Post published!");
  };

  const handleCreateProduct = () => {
    if (!newProduct.name.trim() || !newProduct.price) return;
    addProduct(newProduct);
    setNewProduct({ name: "", description: "", price: "", category: "digital" });
    setShowCreateProduct(false);
    refresh();
    toast.success("Product created!");
  };

  const handleCreatePoll = () => {
    if (!newPoll.question.trim() || newPoll.options.some((o) => !o.trim())) return;
    addPoll({ question: newPoll.question, options: newPoll.options.filter((o) => o.trim()), endsAt: null });
    setNewPoll({ question: "", options: ["", ""] });
    setShowCreatePoll(false);
    refresh();
    toast.success("Poll created!");
  };

  const handleCreateStory = () => {
    if (!newStory.content.trim()) return;
    addStory({ content: newStory.content, imageUrl: newStory.imageUrl || null });
    setNewStory({ content: "", imageUrl: "" });
    setShowCreateStory(false);
    refresh();
    toast.success("Story published!");
  };

  const handleEditProduct = () => {
    if (!editingProduct) return;
    editProduct(editingProduct.id, { name: editingProduct.name, description: editingProduct.description, price: editingProduct.price, category: editingProduct.category });
    setShowEditProduct(false);
    setEditingProduct(null);
    refresh();
    toast.success("Product updated!");
  };

  const MEDIA_ICONS: Record<MediaType, React.ReactNode> = {
    image: <Image className="w-4 h-4" />, video: <Video className="w-4 h-4" />, audio: <Music className="w-4 h-4" />, document: <File className="w-4 h-4" />, none: null,
  };

  const tabs = [
    { key: "overview" as Tab, label: "Overview", icon: BarChart3 },
    { key: "posts" as Tab, label: "Posts", icon: FileText },
    { key: "products" as Tab, label: "Products", icon: ShoppingBag },
    { key: "orders" as Tab, label: "Orders", icon: DollarSign },
    { key: "messages" as Tab, label: "Messages", icon: MessageSquare },
    { key: "wallet" as Tab, label: "Wallet", icon: WalletIcon },
    { key: "polls" as Tab, label: "Polls", icon: PollIcon },
    { key: "stories" as Tab, label: "Stories", icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-[#1a1d21] pt-20 pb-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-6 h-6 text-[#c9a96e]" />
          <div><h1 className="font-serif text-3xl font-bold text-[#e8e6e3]">King Panel</h1><p className="text-xs text-[#8b8680]">Manage your entire digital mansion</p></div>
        </div>

        <div className="flex flex-wrap gap-1 mb-8 p-1 bg-[#23262a] rounded-xl">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-[#c9a96e] text-[#1a1d21]" : "text-[#8b8680] hover:text-[#e8e6e3]"}`}>
                <Icon className="w-4 h-4" /><span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Posts" value={posts.length} icon={FileText} />
              <StatCard label="Likes" value={totalLikes} icon={TrendingUp} />
              <StatCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} />
              <StatCard label="Pending Orders" value={orders.filter((o) => o.status === "pending").length} icon={ShoppingBag} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Products" value={products.length} icon={ShoppingBag} />
              {/* Show a single Fanatics statistic combining all fans regardless of tier */}
              <StatCard label="Fanatics" value={fans.length} icon={Star} />
            </div>
            {/* AI Agent quick link */}
            <div className="p-4 rounded-xl bg-[rgba(201,169,110,0.05)] border border-[rgba(201,169,110,0.15)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-[#c9a96e]" />
                <div>
                  <p className="text-sm font-medium text-[#e8e6e3]">AI Social Manager</p>
                  <p className="text-xs text-[#8b8680]">Get insights, schedule posts, and grow your audience</p>
                </div>
              </div>
              <button onClick={() => navigate("/ai-agent")} className="px-4 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a]">Open AI Agent</button>
            </div>

            {/* Live stream toggle */}
            <div className="p-4 rounded-xl bg-[rgba(201,169,110,0.05)] border border-[rgba(201,169,110,0.15)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Broadcast className="w-5 h-5 text-[#c9a96e]" />
                <div>
                  <p className="text-sm font-medium text-[#e8e6e3]">Live Appearance</p>
                  <p className="text-xs text-[#8b8680]">Go live to make an appearance to your Fanatics</p>
                </div>
              </div>
              <button onClick={handleToggleLive} className="px-4 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a]">
                {kingLive ? "End Appearance" : "Make an Appearance"}
              </button>
            </div>
          </div>
        )}

        {/* Posts */}
        {tab === "posts" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-[#e8e6e3]">All Posts</h3>
              <button onClick={() => setShowCreatePost(true)} className="flex items-center gap-2 px-4 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a]"><Plus className="w-4 h-4" /> New Post</button>
            </div>
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#c9a96e] px-2 py-0.5 bg-[rgba(201,169,110,0.1)] rounded">{post.type}</span>
                        <span className="text-xs font-mono text-[#8b8680]">{post.tier}</span>
                        {post.mediaType !== "none" && <span className="text-xs font-mono text-[#4caf93] bg-[rgba(76,175,147,0.1)] px-2 py-0.5 rounded flex items-center gap-1">{MEDIA_ICONS[post.mediaType]} {post.mediaType}</span>}
                      </div>
                      <h4 className="text-sm font-medium text-[#e8e6e3] truncate">{post.title}</h4>
                      <p className="text-xs text-[#8b8680] mt-1 line-clamp-1">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#8b8680]"><span>{post.likes || 0} likes</span><span>{new Date(post.createdAt).toLocaleDateString()}</span></div>
                    </div>
                    <button onClick={() => { deletePost(post.id); refresh(); toast.success("Post deleted"); }} className="p-2 text-[#8b8680] hover:text-[#c94a4a] ml-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-[#e8e6e3]">All Products</h3>
              <button onClick={() => setShowCreateProduct(true)} className="flex items-center gap-2 px-4 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a]"><Plus className="w-4 h-4" /> New Product</button>
            </div>
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <img src={product.imageUrl || "/images/shop-digital.jpg"} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-sm font-medium text-[#e8e6e3]">{product.name}</h4>
                        <p className="font-mono text-sm text-[#c9a96e]">${product.price}</p>
                        <p className="text-xs text-[#8b8680]">{product.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingProduct(product); setShowEditProduct(true); }} className="p-2 text-[#8b8680] hover:text-[#c9a96e]" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => { deleteProduct(product.id); refresh(); toast.success("Deleted"); }} className="p-2 text-[#8b8680] hover:text-[#c94a4a]" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <div>
            <h3 className="font-serif text-lg text-[#e8e6e3] mb-6">All Orders</h3>
            {orders.length > 0 ? (
              <div className="overflow-x-auto rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-[#8b8680] border-b border-[rgba(201,169,110,0.1)]"><th className="p-4">ID</th><th className="p-4">User</th><th className="p-4">Product</th><th className="p-4">Qty</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-[rgba(201,169,110,0.05)]">
                        <td className="p-4 font-mono text-[#c9a96e]">#{order.id}</td>
                        <td className="p-4 text-[#e8e6e3]">{order.userName}</td>
                        <td className="p-4 text-[#e8e6e3]">{order.productName}</td>
                        <td className="p-4 text-[#e8e6e3]">{order.quantity}</td>
                        <td className="p-4 font-mono text-[#e8e6e3]">${order.totalPrice}</td>
                        <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded ${order.status === "completed" ? "bg-[rgba(76,175,147,0.1)] text-[#4caf93]" : order.status === "pending" ? "bg-[rgba(201,169,110,0.1)] text-[#c9a96e]" : "bg-[rgba(201,74,74,0.1)] text-[#c94a4a]"}`}>{order.status}</span></td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {order.status === "pending" && (
                              <><button onClick={() => { updateOrderStatus(order.id, "completed"); refresh(); }} className="p-1.5 text-[#4caf93] hover:bg-[rgba(76,175,147,0.1)] rounded" title="Complete"><Check className="w-4 h-4" /></button>
                              <button onClick={() => { updateOrderStatus(order.id, "cancelled"); refresh(); }} className="p-1.5 text-[#c94a4a] hover:bg-[rgba(201,74,74,0.1)] rounded" title="Cancel"><X className="w-4 h-4" /></button></>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-[#8b8680]">No orders yet</p>}
          </div>
        )}

        {/* Messages */}
        {tab === "messages" && (
          <div>
            {/* Rename to Fanatic Conversations to reflect unified supporter terminology */}
            <h3 className="font-serif text-lg text-[#e8e6e3] mb-6">Fanatic Conversations</h3>
            <div className="space-y-3">
              {fans.map((conv) => (
                <div key={conv.fanId} className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conv.fanTier === "fanatic" ? "bg-[rgba(201,169,110,0.15)]" : "bg-[#2a2d32]"}`}>
                        <User className={`w-5 h-5 ${conv.fanTier === "fanatic" ? "text-[#c9a96e]" : "text-[#8b8680]"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#e8e6e3]">{conv.fanName}</p>
                          {/* Always label supporters as Fanatics regardless of underlying tier */}
                          <span className="flex items-center gap-1 text-[10px] text-[#c9a96e] bg-[rgba(201,169,110,0.1)] px-1.5 py-0.5 rounded font-mono">
                            <Star className="w-2.5 h-2.5" /> FANATIC
                          </span>
                        </div>
                        <p className="text-xs text-[#8b8680]">{conv.messages?.length || 0} messages</p>
                      </div>
                    </div>
                    {conv.unread > 0 && <span className="bg-[#c9a96e] text-[#1a1d21] text-xs font-mono px-2 py-0.5 rounded-full">{conv.unread} new</span>}
                  </div>
                  <p className="text-xs text-[#8b8680] line-clamp-2 pl-13">{conv.lastMessage.content}</p>
                </div>
              ))}
              {fans.length === 0 && <p className="text-sm text-[#8b8680]">No fan conversations yet</p>}
            </div>
          </div>
        )}

        {/* Wallet */}
        {tab === "wallet" && (
          <div>
            {/* Balance Card */}
            <div className="rounded-xl bg-gradient-to-r from-[#2a2d32] to-[#23262a] border border-[rgba(201,169,110,0.15)] p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8b8680] font-mono uppercase tracking-wider">Available Balance</span>
                <WalletIcon className="w-5 h-5 text-[#c9a96e]" />
              </div>
              <p className="font-mono text-4xl text-[#c9a96e] font-bold">${wallet.balance}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-[#8b8680]">
                <span>{wallet.entries.length} transactions</span>
                <span>{wallet.withdrawals.filter((w) => w.status === "pending").length} pending withdrawals</span>
              </div>
            </div>

            {/* Withdraw */}
            <div className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] p-5 mb-6">
              <h4 className="text-sm font-medium text-[#e8e6e3] mb-3 flex items-center gap-2"><ArrowDownToLine className="w-4 h-4 text-[#c9a96e]" /> Withdraw to Bank</h4>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" />
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="Amount to withdraw" min="0.01" step="0.01" />
                </div>
                <button onClick={() => {
                  if (!withdrawAmount || Number(withdrawAmount) <= 0) { toast.error("Enter a valid amount"); return; }
                  if (Number(withdrawAmount) > Number(wallet.balance)) { toast.error("Insufficient balance"); return; }
                  const ok = requestWithdrawal(Number(withdrawAmount).toFixed(2));
                  if (ok) { toast.success(`$${Number(withdrawAmount).toFixed(2)} withdrawal initiated!`); setWithdrawAmount(""); refresh(); }
                }} disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > Number(wallet.balance)} className="px-5 py-2.5 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a] transition-colors disabled:opacity-50 flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4" /> Withdraw
                </button>
              </div>
            </div>

            {/* Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-[#e8e6e3] mb-3">Transactions</h4>
                {wallet.entries.length === 0 ? <p className="text-xs text-[#8b8680]">No transactions yet</p> : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {wallet.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-[#23262a] border border-[rgba(201,169,110,0.05)]">
                        <div>
                          <p className="text-sm text-[#e8e6e3]">{entry.description}</p>
                          <p className="text-[10px] text-[#8b8680]">{new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                        <span className="font-mono text-sm text-[#4caf93]">+${entry.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#e8e6e3] mb-3">Withdrawals</h4>
                {wallet.withdrawals.length === 0 ? <p className="text-xs text-[#8b8680]">No withdrawals yet</p> : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {wallet.withdrawals.map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-[#23262a] border border-[rgba(201,169,110,0.05)]">
                        <div>
                          <p className="text-sm text-[#e8e6e3]">Withdrawal</p>
                          <p className="text-[10px] text-[#8b8680]">{new Date(w.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm text-[#c94a4a]">-${w.amount}</span>
                          <span className={`ml-2 text-[10px] px-2 py-0.5 rounded font-mono ${w.status === "completed" ? "bg-[rgba(76,175,147,0.1)] text-[#4caf93]" : "bg-[rgba(201,169,110,0.1)] text-[#c9a96e]"}`}>{w.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Polls */}
        {tab === "polls" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-[#e8e6e3]">Community Polls</h3>
              <button onClick={() => setShowCreatePoll(true)} className="flex items-center gap-2 px-4 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a]"><Plus className="w-4 h-4" /> New Poll</button>
            </div>
            <div className="space-y-3">
              {polls.map((poll) => (
                <div key={poll.id} className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#e8e6e3]">{poll.question}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {poll.options.map((opt, i) => (
                          <span key={i} className="text-xs bg-[#1a1d21] text-[#8b8680] px-2 py-1 rounded">{opt} ({poll.votes[i] || 0})</span>
                        ))}
                      </div>
                      <p className="text-xs text-[#8b8680] mt-2">{poll.votedBy.length} votes</p>
                    </div>
                    <button onClick={() => { deletePoll(poll.id); refresh(); toast.success("Poll deleted"); }} className="p-2 text-[#8b8680] hover:text-[#c94a4a] ml-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {polls.length === 0 && <p className="text-sm text-[#8b8680]">No polls yet</p>}
            </div>
          </div>
        )}

        {/* Stories */}
        {tab === "stories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-[#e8e6e3]">Active Stories (24h)</h3>
              <button onClick={() => setShowCreateStory(true)} className="flex items-center gap-2 px-4 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a]"><Plus className="w-4 h-4" /> New Story</button>
            </div>
            <div className="space-y-3">
              {stories.map((story) => (
                <div key={story.id} className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-[#e8e6e3]">{story.content}</p>
                      {story.imageUrl && <img src={story.imageUrl} alt="" className="mt-2 w-16 h-16 rounded-lg object-cover" />}
                      <p className="text-xs text-[#8b8680] mt-2">{new Date(story.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => { deleteStory(story.id); refresh(); toast.success("Story deleted"); }} className="p-2 text-[#8b8680] hover:text-[#c94a4a] ml-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {stories.length === 0 && <p className="text-sm text-[#8b8680]">No active stories</p>}
            </div>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowCreatePost(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative liquid-glass rounded-2xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-serif text-xl text-[#e8e6e3]">Create Post</h3><button onClick={() => setShowCreatePost(false)} className="p-1 text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <input type="text" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="Post title..." />
              <textarea value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows={4} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e] resize-none" placeholder="What's on your mind..." />
              <div className="flex flex-wrap gap-2">
                {(["none", "image", "video", "audio", "document"] as MediaType[]).map((mt) => (
                  <button key={mt} onClick={() => setNewPost({ ...newPost, mediaType: mt })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${newPost.mediaType === mt ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#1a1d21] text-[#8b8680] hover:text-[#e8e6e3]"}`}>{mt !== "none" && MEDIA_ICONS[mt]} {mt === "none" ? "Text" : mt.charAt(0).toUpperCase() + mt.slice(1)}</button>
                ))}
              </div>
              {newPost.mediaType !== "none" && (
                <div className="space-y-2 w-full">
                  {/* File upload for media. Allows uploading images, videos, audio or documents. The file is converted to a Data URL and stored in mediaUrl. */}
                  <input
                    type="file"
                    accept={
                      newPost.mediaType === "image"
                        ? "image/*"
                        : newPost.mediaType === "video"
                        ? "video/*"
                        : newPost.mediaType === "audio"
                        ? "audio/*"
                        : ".pdf,.doc,.docx,.txt,.rtf"
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewPost({ ...newPost, mediaUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full bg-[#1a1d21] border border-dashed border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-4 text-xs text-[#8b8680] cursor-pointer hover:border-[#c9a96e]"
                  />
                  <p className="text-xs text-[#8b8680] text-center">or paste a URL:</p>
                  <input
                    type="text"
                    value={newPost.mediaUrl || ""}
                    onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                    className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]"
                    placeholder={`Paste ${newPost.mediaType} URL...`}
                  />
                </div>
              )}
              <input
                type="text"
                value={newPost.downloadUrl || ""}
                onChange={(e) => setNewPost({ ...newPost, downloadUrl: e.target.value })}
                className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]"
                placeholder="Download file URL (optional, Fanatic-only)..."
              />
              <div className="flex gap-2">
                <select value={newPost.type} onChange={(e) => setNewPost({ ...newPost, type: e.target.value as any })} className="bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-3 py-2 text-xs text-[#e8e6e3]"><option value="thought">Thought</option><option value="creation">Creation</option><option value="update">Update</option></select>
                {/* Post access tier: public or fanatic (exclusive to registered fans). */}
                <select
                  value={newPost.tier}
                  onChange={(e) => setNewPost({ ...newPost, tier: e.target.value as any })}
                  className="bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-3 py-2 text-xs text-[#e8e6e3]"
                >
                  <option value="public">Public</option>
                  <option value="fanatic">Fanatic</option>
                </select>
                <button onClick={handleCreatePost} disabled={!newPost.title.trim() || !newPost.content.trim()} className="ml-auto px-5 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a] disabled:opacity-50">Publish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowCreateProduct(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative liquid-glass rounded-2xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-serif text-xl text-[#e8e6e3]">Create Product</h3><button onClick={() => setShowCreateProduct(false)} className="p-1 text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="Product name..." />
              <textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} rows={3} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e] resize-none" placeholder="Description..." />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="29.99" />
                <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as any })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-3 py-2.5 text-sm text-[#e8e6e3]"><option value="digital">Digital</option><option value="physical">Physical</option><option value="merch">Merch</option><option value="exclusive">Exclusive</option></select>
              </div>
              <button onClick={handleCreateProduct} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a]">Create Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowEditProduct(false); setEditingProduct(null); }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative liquid-glass rounded-2xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-serif text-xl text-[#e8e6e3]">Edit Product</h3><button onClick={() => { setShowEditProduct(false); setEditingProduct(null); }} className="p-1 text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3]" />
              <textarea value={editingProduct.description || ""} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} rows={3} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3]" />
                <select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-3 py-2.5 text-sm text-[#e8e6e3]"><option value="digital">Digital</option><option value="physical">Physical</option><option value="merch">Merch</option><option value="exclusive">Exclusive</option></select>
              </div>
              <button onClick={handleEditProduct} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a]">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreatePoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowCreatePoll(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative liquid-glass rounded-2xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-serif text-xl text-[#e8e6e3]">Create Poll</h3><button onClick={() => setShowCreatePoll(false)} className="p-1 text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <input type="text" value={newPoll.question} onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="Poll question..." />
              {newPoll.options.map((opt, i) => (
                <input key={i} type="text" value={opt} onChange={(e) => {
                  const opts = [...newPoll.options];
                  opts[i] = e.target.value;
                  setNewPoll({ ...newPoll, options: opts });
                }} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder={`Option ${i + 1}`} />
              ))}
              <button onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ""] })} className="text-xs text-[#c9a96e] hover:text-[#d4b87a]">+ Add option</button>
              <button onClick={handleCreatePoll} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a]">Create Poll</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowCreateStory(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative liquid-glass rounded-2xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-serif text-xl text-[#e8e6e3]">Create Story</h3><button onClick={() => setShowCreateStory(false)} className="p-1 text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <textarea value={newStory.content} onChange={(e) => setNewStory({ ...newStory, content: e.target.value })} rows={3} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e] resize-none" placeholder="Story content..." />
              <input type="text" value={newStory.imageUrl} onChange={(e) => setNewStory({ ...newStory, imageUrl: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]" placeholder="Image URL (optional)..." />
              <button onClick={handleCreateStory} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a]">Publish Story</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}