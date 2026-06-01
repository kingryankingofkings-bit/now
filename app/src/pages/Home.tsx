import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  getPosts,
  getProducts,
  getPolls,
  getSocialLinks,
  getActiveSales,
  votePoll,
  getSiteSettings,
  getCollections,
  getFans,
} from "@/lib/localDb";
import type { Post, Product, Poll, SocialLink, Sale } from "@/lib/localDb";
import {
  Crown, ShoppingBag, Heart, ArrowRight, BarChart3, Clock,
  Lock, ChevronLeft, ChevronRight, ExternalLink, Zap,
} from "lucide-react";
import { toast } from "sonner";

/* ───── helpers ───── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const hoursLeft = (expiresAt: string) => {
  const h = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 3600000));
  return h;
};

/* ───── gradient placeholders for posts/products ───── */
const GRADIENTS = [
  "from-[#c9a96e]/20 to-[#8b5cf6]/20",
  "from-[#06b6d4]/20 to-[#3b82f6]/20",
  "from-[#f59e0b]/20 to-[#ef4444]/20",
  "from-[#10b981]/20 to-[#3b82f6]/20",
  "from-[#8b5cf6]/20 to-[#ec4899]/20",
  "from-[#f97316]/20 to-[#c9a96e]/20",
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isKing } = useAuth();
  const settings = getSiteSettings();

  const [posts, setPosts] = useState<Post[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [vaultIndex, setVaultIndex] = useState(0);

  // Compute the number of fans/fanatics. This is displayed as "Fellow Fanatics" on the
  // homepage stats. We call getFans() only once on mount; it reads from localStorage.
  const fanCount = getFans().length;

  useEffect(() => {
    setPosts(getPosts());
    setProducts(getProducts().filter((p) => p.isActive));
    setPolls(getPolls());
    setSocials(getSocialLinks());
    setSales(getActiveSales());
    // If the currently signed in user is the King, redirect to the King panel by default.
    // This ensures the King always lands on the management interface instead of the public home.
    if (isKing) {
      navigate("/admin", { replace: true });
    }
  }, [isKing, navigate]);

  /* derived data */
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const creationPosts = posts
    .filter((p) => p.type === "creation" || p.type === "thought")
    .slice(0, 4);
  const updatePosts = posts.filter((p) => p.type === "update").slice(0, 3);
  // Fanatic-only posts (formerly VIP)
  const fanaticPosts = posts.filter((p) => p.tier === "fanatic");
  const shopProducts = products.slice(0, 4);
  const activePoll = polls[0];

  /* poll voting */
  const handleVote = (pollId: number, optionIndex: number) => {
    const uid = isAuthenticated ? "user" : "anon";
    try {
      votePoll(pollId, optionIndex, uid);
      setPolls(getPolls());
      toast.success("Vote recorded!");
    } catch {
      toast.error("Already voted!");
    }
  };

  const totalVotes = (poll: Poll) =>
    Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* faint watermark labels */}
        <span className="absolute top-32 left-12 text-xs tracking-[0.3em] text-[#8b8680]/15 font-mono select-none">STUDIO</span>
        <span className="absolute top-40 right-16 text-xs tracking-[0.3em] text-[#8b8680]/15 font-mono select-none">LOUNGE</span>
        <span className="absolute bottom-48 right-24 text-xs tracking-[0.3em] text-[#8b8680]/15 font-mono select-none">FEED</span>
        <span className="absolute bottom-32 left-20 text-xs tracking-[0.3em] text-[#8b8680]/15 font-mono select-none">SHOP</span>

        {/* subtle bg glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: `radial-gradient(circle, ${settings.accentColor}, transparent 70%)` }} />

        <div className="relative z-10 liquid-glass rounded-2xl p-8 md:p-12 max-w-xl mx-4 w-full">
          <p className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-medium mb-4" style={{ color: settings.accentColor }}>
            <Crown className="w-3.5 h-3.5" /> Welcome to the Studio
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#e8e6e3] mb-4 leading-tight">
            {settings.heroTitle}
          </h1>
          <p className="text-sm text-[#8b8680] mb-8 leading-relaxed max-w-md">
            {settings.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              // Join the ranks button: if the King is logged in, jump to the King panel. If any user is
              // already authenticated (fan or fanatic), go straight to the feed. Otherwise, open the signup page.
              if (isKing) {
                navigate("/admin");
              } else if (isAuthenticated) {
                navigate("/feed");
              } else {
                navigate("/login?mode=register");
              }
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition hover:opacity-90"
            style={{ backgroundColor: settings.accentColor, color: "#1a1d21" }}
          >
            {settings.heroCtaText} <ArrowRight className="w-4 h-4" />
          </button>
            <button
              onClick={() => {
                // "See The King" button: unauthenticated visitors are taken to the signup page,
                // while logged-in users are taken to the feed to see the creator's posts.
                if (!isAuthenticated) {
                  navigate("/login?mode=register");
                } else {
                  navigate("/feed");
                }
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
              style={{ borderColor: "rgba(201,169,110,0.2)", color: settings.accentColor }}
            >
              <Crown className="w-4 h-4" /> See The King
            </button>
            <button
              onClick={() => {
                if (isAuthenticated && !isKing) {
                  navigate("/profile");
                } else {
                  navigate("/shop");
                }
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
              style={{ borderColor: "rgba(201,169,110,0.2)", color: settings.accentColor }}
            >
              <Heart className="w-4 h-4" /> Support
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SALES COUNTDOWN ═══════════════════ */}
      {sales.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 -mt-20 relative z-20 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sales.slice(0, 2).map((sale) => {
              const h = hoursLeft(sale.expiresAt);
              return (
                <div key={sale.id} className="bg-[#23262a] rounded-xl border border-[rgba(201,169,110,0.1)] p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${settings.accentColor}18` }}>
                    <Clock className="w-5 h-5" style={{ color: settings.accentColor }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#e8e6e3]">{sale.name}</p>
                    <p className="text-xs text-[#8b8680]">{sale.discountPercent}% OFF</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono" style={{ color: settings.accentColor }}>{h}</p>
                    <p className="text-[10px] text-[#8b8680] uppercase tracking-wider">h left</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════ STATS ═══════════════════ */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="flex items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold font-mono text-[#e8e6e3]">{fanCount}</p>
            <p className="text-xs text-[#8b8680] uppercase tracking-wider mt-1">Fellow Fanatics</p>
          </div>
          <div className="w-px h-12 bg-[rgba(201,169,110,0.15)]" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold font-mono text-[#e8e6e3]">{posts.length}</p>
            <p className="text-xs text-[#8b8680] uppercase tracking-wider mt-1">Posts</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMMUNITY POLLS ═══════════════════ */}
      {activePoll && (
        <section className="max-w-2xl mx-auto px-6 mb-16">
          <div className="bg-[#23262a] rounded-xl border border-[rgba(201,169,110,0.08)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#c9a96e]" />
              <h2 className="font-serif text-lg font-bold text-[#e8e6e3]">Community Polls</h2>
            </div>
            <p className="text-sm text-[#e8e6e3] font-medium mb-4">{activePoll.question}</p>
            <div className="space-y-2">
              {activePoll.options.map((opt, i) => {
                const tv = totalVotes(activePoll);
                const votes = activePoll.votes[i] || 0;
                const pct = tv > 0 ? Math.round((votes / tv) * 100) : 0;
                return (
                  <button
                    key={i}
                    onClick={() => handleVote(activePoll.id, i)}
                    className="w-full relative text-left px-4 py-2.5 rounded-lg text-sm transition overflow-hidden bg-[#1a1d21] hover:bg-[rgba(201,169,110,0.08)]"
                  >
                    <div className="absolute inset-y-0 left-0 bg-[rgba(201,169,110,0.1)]" style={{ width: `${pct}%` }} />
                    <span className="relative z-10 flex justify-between">
                      <span className="text-[#e8e6e3]">{opt}</span>
                      <span className="text-[#8b8680] text-xs">{votes}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#8b8680] mt-3">{totalVotes(activePoll)} votes</p>
          </div>
        </section>
      )}

      {/* ═══════════════════ FEATURED CREATIONS ═══════════════════ */}
      {creationPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: settings.accentColor }}>Latest Drops</p>
              <h2 className="font-serif text-3xl font-bold text-[#e8e6e3]">Featured Creations</h2>
            </div>
            <Link to="/feed" className="text-sm font-medium flex items-center gap-1 transition hover:opacity-80" style={{ color: settings.accentColor }}>
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {creationPosts.map((post, idx) => (
              <div key={post.id} className="group cursor-pointer" onClick={() => navigate(`/feed`)}>
                <div className={`relative aspect-video rounded-xl bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} overflow-hidden mb-3`}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <span className="font-serif text-4xl font-bold text-white/20 uppercase">{post.type}</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                      post.type === "creation" ? "bg-[rgba(201,169,110,0.2)] text-[#c9a96e]" :
                      post.type === "thought" ? "bg-[rgba(139,134,128,0.2)] text-[#8b8680]" :
                      "bg-[rgba(76,175,147,0.2)] text-[#4caf93]"
                    }`}>{post.type}</span>
                  </div>
                </div>
                <h3 className="font-serif text-base font-bold text-[#e8e6e3] group-hover:text-[#c9a96e] transition">{post.title}</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-[#8b8680]">{fmtDate(post.createdAt)}</p>
                  <p className="text-xs text-[#8b8680]">{post.likes} likes</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ THE VAULT ═══════════════════ */}
      {fanaticPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: settings.accentColor }}>Exclusive Content</p>
              <h2 className="font-serif text-3xl font-bold text-[#e8e6e3]">The Vault</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVaultIndex(Math.max(0, vaultIndex - 1))} className="w-9 h-9 rounded-lg border border-[rgba(201,169,110,0.15)] flex items-center justify-center text-[#8b8680] hover:text-[#e8e6e3] hover:border-[#c9a96e] transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
            <button onClick={() => setVaultIndex(Math.min(fanaticPosts.length - 1, vaultIndex + 1))} className="w-9 h-9 rounded-lg border border-[rgba(201,169,110,0.15)] flex items-center justify-center text-[#8b8680] hover:text-[#e8e6e3] hover:border-[#c9a96e] transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {fanaticPosts.slice(vaultIndex, vaultIndex + 4).map((post, idx) => (
              <div key={post.id} className="relative aspect-[3/4] rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] overflow-hidden group cursor-pointer" onClick={() => navigate("/feed")}>
                <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[(idx + 2) % GRADIENTS.length]} opacity-30`} />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Lock className="w-8 h-8 text-[#c9a96e] mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#c9a96e] bg-[rgba(201,169,110,0.15)] px-2 py-1 rounded">FANATIC ONLY</span>
                  <p className="text-sm text-[#e8e6e3] mt-3 px-4 text-center font-medium">{post.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ LIVE WIRE ═══════════════════ */}
      {updatePosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-16">
          <div className="mb-8">
            <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: settings.accentColor }}>Community & Updates</p>
            <h2 className="font-serif text-3xl font-bold text-[#e8e6e3]">Live Wire</h2>
          </div>
          <div className="space-y-4">
            {updatePosts.map((post) => (
              <div key={post.id} className="flex gap-6 items-start group cursor-pointer" onClick={() => navigate("/feed")}>
                <p className="text-xs text-[#8b8680] font-mono shrink-0 w-16 pt-1">{fmtDate(post.createdAt)}</p>
                <div className="flex-1 border-l border-[rgba(201,169,110,0.1)] pl-6 pb-6">
                  <h3 className="font-serif text-base font-bold text-[#e8e6e3] group-hover:text-[#c9a96e] transition mb-1">{post.title}</h3>
                  <p className="text-sm text-[#8b8680] line-clamp-2 mb-2">{post.content}</p>
                  <span className="text-xs font-medium flex items-center gap-1" style={{ color: settings.accentColor }}>
                    Read More <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ THE LINK WALL ═══════════════════ */}
      {socials.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-16">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: settings.accentColor }}>Find Me Everywhere</p>
            <h2 className="font-serif text-3xl font-bold text-[#e8e6e3]">The Link Wall</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#23262a] rounded-xl border border-[rgba(201,169,110,0.08)] p-6 flex flex-col items-center gap-3 hover:border-[rgba(201,169,110,0.2)] transition group"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-[#1a1d21]" style={{ backgroundColor: `${settings.accentColor}30` }}>
                  <span style={{ color: settings.accentColor }}>{s.platform.charAt(0)}</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#e8e6e3] group-hover:text-[#c9a96e] transition">{s.platform}</p>
                  <p className="text-[10px] text-[#8b8680] mt-0.5">{s.displayName}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ SHOP ═══════════════════ */}
      {shopProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: settings.accentColor }}>Support the Craft</p>
              <h2 className="font-serif text-3xl font-bold text-[#e8e6e3]">Shop</h2>
            </div>
            <Link to="/shop" className="text-sm font-medium flex items-center gap-1 transition hover:opacity-80" style={{ color: settings.accentColor }}>
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {shopProducts.map((p, idx) => (
              <div key={p.id} className="group cursor-pointer" onClick={() => navigate("/shop")}>
                <div className={`aspect-square rounded-xl bg-gradient-to-br ${GRADIENTS[(idx + 3) % GRADIENTS.length]} border border-[rgba(201,169,110,0.08)] flex items-center justify-center mb-3 overflow-hidden relative`}>
                  <ShoppingBag className="w-10 h-10 text-white/20" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
                </div>
                <p className="text-sm font-medium text-[#e8e6e3] group-hover:text-[#c9a96e] transition line-clamp-1">{p.name}</p>
                <p className="text-sm font-bold font-mono mt-0.5" style={{ color: settings.accentColor }}>${p.price}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-[rgba(201,169,110,0.08)] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#c9a96e]" />
              <span className="font-serif text-lg font-bold gold-gradient-text">Digital Kingdom</span>
            </div>
            <p className="text-xs text-[#8b8680]">Your personal digital mansion. All content copyright &copy; {new Date().getFullYear()}.</p>
            <div className="flex items-center gap-4">
              {["/", "/feed", "/shop", "/messages", "/profile", "/leaderboard"].map((path) => (
                <Link
                  key={path}
                  to={path}
                  className="text-xs text-[#8b8680] hover:text-[#c9a96e] transition capitalize"
                >
                  {path === "/" ? "Home" : path.replace("/", "")}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
