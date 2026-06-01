
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getOrders,
  getFavoritePosts,
  getReferralCodeForUser,
  getFan,
  getFans,
  updateFanProfile,
  recordPageView,
  getSiteSettings,
  getTheme,
  setTheme,
  createInviteCodeForFan,
  getStaticPoints,
  redeemStaticPoints,
} from "@/lib/localDb";
import { Link } from "react-router";
import {
  Crown, User, ShoppingBag, MessageSquare, Shield, Heart,
  LogIn, Bookmark, Clock, Image, Music, Video, File,
  Edit3, Copy, Check, Download, Trophy, Star,
  Settings, Grid3X3, BarChart3, Bot, Percent, Zap,
  Sun, Moon, ArrowRight, Users,
  UserPlus,
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import DonationOverlay from "@/components/DonationOverlay";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, isKing, isFanatic, tier, logout } = useAuth();
  const [settings, setSiteSettings] = useState(getSiteSettings());
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.name || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar || "");
  const [editCover, setEditCover] = useState("");
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"dark" | "light">(getTheme());
  const [showDonate, setShowDonate] = useState(false);

  // Static points state for fanatics
  const [staticPoints, setStaticPoints] = useState(0);
  // Invite code state for generated referral invites
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const orders = getOrders().filter((o) => o.userId === user?.id);
  const favorites = user ? getFavoritePosts(user.id) : [];

  // Total number of registered fans for display on King profile
  const fanCount = getFans().length;

  useEffect(() => {
    recordPageView("profile");
    setSiteSettings(getSiteSettings());
    if (user?.id) {
      if (isKing) {
        const kingProfile = JSON.parse(localStorage.getItem("mdk_king_profile") || localStorage.getItem("mdk2_king_profile") || "{}");
        setEditDisplayName(kingProfile.displayName || user.name || "");
        setEditBio(kingProfile.bio || user.bio || "");
        setEditAvatar(kingProfile.avatar || user.avatar || "");
        setEditCover(kingProfile.cover || "");
      } else {
        setReferralCode(getReferralCodeForUser(user.id));
        const fan = getFan(user.id);
        if (fan) {
          setEditDisplayName(fan.displayName || "");
          setEditBio(fan.bio || "");
          setEditAvatar(fan.avatar || "");
          setEditCover(fan.cover || "");
        }
      }

      // Initialize static points
      setStaticPoints(getStaticPoints(user.id));
    }
  }, [user, isKing]);

  const handleSaveProfile = () => {
    if (!user?.id) return;
    if (isKing) {
      const profileData = {
        displayName: editDisplayName.trim() || user.name,
        bio: editBio.trim(),
        avatar: editAvatar.trim() || null,
        cover: editCover.trim() || null,
      };
      localStorage.setItem("mdk2_king_profile", JSON.stringify(profileData));
      // Also update mdk2_user so avatar persists across sessions
      const kingUser = JSON.parse(localStorage.getItem("mdk2_user") || "{}");
      kingUser.name = profileData.displayName;
      kingUser.bio = profileData.bio;
      kingUser.avatar = profileData.avatar;
      kingUser.cover = profileData.cover;
      localStorage.setItem("mdk2_user", JSON.stringify(kingUser));
    } else {
      updateFanProfile(user.id, {
        displayName: editDisplayName.trim() || user.name,
        bio: editBio.trim(),
        avatar: editAvatar.trim() || null,
        cover: editCover.trim() || null,
      });
      // Also update fan_user so avatar persists
      const fanUser = JSON.parse(localStorage.getItem("fan_user") || "{}");
      fanUser.name = editDisplayName.trim() || user.name;
      fanUser.bio = editBio.trim();
      fanUser.avatar = editAvatar.trim() || null;
      fanUser.cover = editCover.trim() || null;
      localStorage.setItem("fan_user", JSON.stringify(fanUser));
    }
    toast.success("Profile saved!");
    setEditing(false);
    // Refresh to show updated avatar
    window.location.reload();
  };

  const copyReferral = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(`${window.location.origin}/#/login?ref=${referralCode}`);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeState(newTheme);
    setTheme(newTheme);
    document.documentElement.classList.toggle("light-mode", newTheme === "light");
  };

  // Generate a new invite code for the current fan and copy it to clipboard
  const handleCreateInvite = () => {
    if (!user?.id) return;
    const code = createInviteCodeForFan(user.id);
    setInviteCode(code);
    navigator.clipboard.writeText(code);
    setInviteCopied(true);
    toast.success("Invite code copied to clipboard!");
    setTimeout(() => setInviteCopied(false), 2000);
  };

  // Redeem static points for discount codes
  const handleRedeem = (threshold: number) => {
    if (!user?.id) return;
    const code = redeemStaticPoints(user.id, threshold);
    if (!code) {
      toast.error("Not enough Static Points");
      return;
    }
    // Copy code to clipboard and show success
    navigator.clipboard.writeText(code.code);
    toast.success(`Redeemed! Code ${code.code} copied to clipboard`);
    // Update static points
    setStaticPoints(getStaticPoints(user.id));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="text-center">
          <User className="w-12 h-12 text-[#3a3d42] mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#e8e6e3] mb-2">Profile</h2>
          <p className="text-sm text-[#8b8680] mb-6">Login to view your profile and activity.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors">
            <LogIn className="w-4 h-4" /> Login
          </Link>
        </div>
      </div>
    );
  }

  const accent = settings.accentColor || "#c9a96e";
  // Display role information. Both "fan" and "fanatic" tiers are labelled as Fanatic for clarity
  // since there is no paid subscription tier. Use a heart icon to represent dedicated supporters.
  const stats = [
    {
      label: "Role",
      value: isKing ? "King" : "Fanatic",
      icon: isKing ? Crown : Heart,
    },
    ...(isKing
      ? [
          {
            label: "Fans",
            value: fanCount,
            icon: Users,
          },
        ]
      : []),
    { label: "Orders", value: orders.length, icon: ShoppingBag },
    { label: "Saved", value: favorites.length, icon: Bookmark },
  ];

  // Navigation links for the hub
  const navLinks = [
    { to: "/feed", label: "Feed", desc: "Browse all content", icon: Grid3X3, color: accent },
    { to: "/shop", label: "Merchandise", desc: "Exclusive products", icon: ShoppingBag, color: accent },
    { to: "/messages", label: "Messages", desc: isKing ? "Fanatic conversations" : "Chat with creator", icon: MessageSquare, color: accent },
    { to: "/leaderboard", label: "Leaderboard", desc: "Top supporters", icon: Trophy, color: accent },
    ...(isFanatic ? [{ to: "/downloads", label: "Downloads", desc: "Your downloaded content", icon: Download, color: "#4caf93" }] : []),
    ...(isKing ? [
      { to: "/admin", label: "King Panel", desc: "Manage everything", icon: Crown, color: accent },
      { to: "/ai-agent", label: "AI Agent", desc: "Your social manager", icon: Bot, color: accent },
    ] : []),
    { to: "/settings", label: "Settings", desc: "Customize your experience", icon: Settings, color: "#8b8680" },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-[800px] mx-auto px-6">
        {/* Cover Photo */}
        <div className="relative mb-10">
          <div className="h-40 rounded-2xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${accent}22 0%, #23262a 100%)` }}>
            {editCover || (user as any).cover ? (
              <img src={editCover || (user as any).cover || ""} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-4 left-8 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: accent }} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 rounded-full bg-[#23262a] border-4 border-[var(--bg-primary)] flex items-center justify-center relative overflow-hidden">
              {user.avatar || editAvatar ? (
                <img src={user.avatar || editAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-[#8b8680]" />
              )}
              {isKing && (
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[var(--bg-primary)]" style={{ backgroundColor: accent }}>
                  <Crown className="w-3.5 h-3.5 text-[#1a1d21]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-6 mt-14">
          <h1 className="font-serif text-2xl font-bold text-[#e8e6e3]">{user.name}</h1>
          {user.bio && <p className="text-sm text-[#8b8680] mt-2 max-w-md mx-auto">{user.bio}</p>}
          <p className="text-xs text-[#8b8680] mt-2 font-mono">@{user.id}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {isKing ? (
              <span
                className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded"
                style={{ color: accent, backgroundColor: `${accent}18` }}
              >
                <Shield className="w-3 h-3" /> KING ACCOUNT
              </span>
            ) : (
              // For both fan and fanatic tiers, show a unified Fanatic badge. There is only one free tier.
              <span className="flex items-center gap-1 text-xs font-mono text-[#c9a96e] bg-[rgba(201,169,110,0.1)] px-2 py-1 rounded">
                <Heart className="w-3 h-3" /> FANATIC
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {(!isKing && user?.role !== "king") && (
              <button
                onClick={() => setShowDonate(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[rgba(201,169,110,0.3)] text-xs font-medium text-[#c9a96e] hover:bg-[rgba(201,169,110,0.1)] hover:border-[rgba(201,169,110,0.5)] transition-all"
              >
                <Heart className="w-3 h-3" /> Donate To The King
              </button>
            )}
            <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-1 text-xs transition-colors" style={{ color: accent }}>
              <Edit3 className="w-3 h-3" /> {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Edit Profile Form */}
        {editing && (
          <div className="mb-8 p-5 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.15)]">
            <h3 className="text-sm font-medium text-[#e8e6e3] mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <ImageUpload
                label="Cover Photo"
                value={editCover}
                onChange={setEditCover}
                aspect="wide"
              />
              <div className="flex justify-center">
                <ImageUpload
                  label="Profile Photo"
                  value={editAvatar}
                  onChange={setEditAvatar}
                  aspect="avatar"
                />
              </div>
              <input type="text" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)}
                className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]"
                placeholder="Display name" />
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
                className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e] resize-none"
                placeholder="Write a short bio..." />
              <button onClick={handleSaveProfile} className="px-5 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a] transition-colors">Save Changes</button>
            </div>
          </div>
        )}

        {/* Fanatic Tools: Invite friends & Static Points. Only show for non-King accounts. */}
        {!isKing && (
          <div className="mb-10">
            <h2 className="font-serif text-lg font-semibold text-[#e8e6e3] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: accent }} /> Fanatic Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Invite Friends Card */}
              <div className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-5 h-5" style={{ color: accent }} />
                  <p className="text-sm font-medium text-[#e8e6e3]">Invite Friends</p>
                </div>
                {inviteCode ? (
                  <div className="mb-2">
                    <p className="text-xs text-[#8b8680] mb-1">Your invite code:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-[#1a1d21] rounded-lg px-3 py-2 text-xs text-[#c9a96e] font-mono truncate">{inviteCode}</code>
                      <button onClick={() => { navigator.clipboard.writeText(inviteCode || ""); setInviteCopied(true); toast.success("Copied to clipboard"); setTimeout(() => setInviteCopied(false), 2000); }} className="p-2 bg-[#c9a96e] text-[#1a1d21] rounded-lg hover:bg-[#d4b87a] transition-colors">
                        {inviteCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#8b8680] mt-1">Share this code. When someone signs up using it, you both get a 10% off reward.</p>
                  </div>
                ) : (
                  <p className="text-xs text-[#8b8680] mb-4">Generate an invite code and share it to earn discounts.</p>
                )}
                <button onClick={handleCreateInvite} className="w-full py-2 text-xs font-medium rounded-lg bg-[#c9a96e] text-[#1a1d21] hover:bg-[#d4b87a] transition-colors">{inviteCode ? "Generate New Code" : "Create Invite Code"}</button>
              </div>
              {/* Static Points Card */}
              <div className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5" style={{ color: accent }} />
                  <p className="text-sm font-medium text-[#e8e6e3]">Static Points</p>
                </div>
                <p className="text-2xl font-mono text-[#c9a96e] mb-1">{staticPoints}</p>
                <p className="text-[10px] text-[#8b8680] mb-3">Earn points by interacting, buying and donating. Redeem them for discounts.</p>
                <div className="flex gap-2">
                  <button disabled={staticPoints < 100} onClick={() => handleRedeem(100)} className={`flex-1 py-2 text-xs font-medium rounded-lg ${staticPoints < 100 ? "bg-[#2a2d32] text-[#4b4e55] cursor-not-allowed" : "bg-[#4caf93] text-[#1a1d21] hover:bg-[#5fcfa6]"}`}>Redeem 100</button>
                  <button disabled={staticPoints < 500} onClick={() => handleRedeem(500)} className={`flex-1 py-2 text-xs font-medium rounded-lg ${staticPoints < 500 ? "bg-[#2a2d32] text-[#4b4e55] cursor-not-allowed" : "bg-[#4caf93] text-[#1a1d21] hover:bg-[#5fcfa6]"}`}>Redeem 500</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] p-4 text-center">
                <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: accent }} />
                <p className="font-mono text-xl text-[#e8e6e3] font-semibold">{stat.value}</p>
                <p className="text-xs text-[#8b8680]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Hub Navigation */}
        <div className="mb-10">
          <h2 className="font-serif text-lg font-semibold text-[#e8e6e3] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: accent }} /> Quick Access
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.to} to={link.to}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.06)] hover:border-[rgba(201,169,110,0.2)] transition-all group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${link.color}18` }}>
                    <Icon className="w-4 h-4" style={{ color: link.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e8e6e3] group-hover:text-[#c9a96e] transition-colors">{link.label}</p>
                    <p className="text-[10px] text-[#8b8680]">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-[#8b8680] group-hover:text-[#c9a96e] transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="mb-10 flex items-center justify-between p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="w-5 h-5 text-[#c9a96e]" /> : <Sun className="w-5 h-5 text-[#c9a96e]" />}
            <div>
              <p className="text-sm font-medium text-[#e8e6e3]">Theme</p>
              <p className="text-[10px] text-[#8b8680]">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="px-3 py-1.5 text-xs bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a]">
            Switch to {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>

        {/* FAVORITES */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="w-5 h-5" style={{ color: accent }} />
            <h2 className="font-serif text-xl font-semibold text-[#e8e6e3]">Saved Content</h2>
            <span className="text-xs text-[#8b8680] font-mono">{favorites.length}</span>
          </div>
          {favorites.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
              <Bookmark className="w-8 h-8 text-[#3a3d42] mx-auto mb-2" />
              <p className="text-sm text-[#8b8680]">No saved posts yet</p>
              <Link to="/feed" className="text-xs mt-1 inline-block transition-colors" style={{ color: accent }}>Browse the feed</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((post) => (
                <Link key={post.id} to="/feed" className="flex items-start gap-3 p-3 rounded-lg bg-[#23262a] hover:bg-[#2a2d32] transition-colors group">
                  <div className="w-12 h-12 rounded-lg bg-[#2a2d32] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {post.mediaUrl && post.mediaType === "image" ? (
                      <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      post.mediaType === "video" ? <Video className="w-5 h-5" style={{ color: accent }} /> :
                      post.mediaType === "audio" ? <Music className="w-5 h-5" style={{ color: accent }} /> :
                      post.mediaType === "document" ? <File className="w-5 h-5" style={{ color: accent }} /> :
                      <Image className="w-5 h-5 text-[#8b8680]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#e8e6e3] truncate group-hover:text-[#c9a96e] transition-colors">{post.title}</h4>
                    <p className="text-xs text-[#8b8680] line-clamp-1 mt-0.5">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#8b8680] flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span className="text-[10px] text-[#8b8680]">{post.likes} likes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Order History */}
        {orders.length > 0 && (
          <div className="mb-10">
            <h2 className="font-serif text-xl font-semibold text-[#e8e6e3] mb-4">Order History</h2>
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-[#23262a]">
                  <div>
                    <p className="text-sm text-[#e8e6e3]">{order.productName}</p>
                    <p className="text-xs text-[#8b8680]">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm" style={{ color: accent }}>${order.totalPrice}</p>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${order.status === "completed" ? "bg-[rgba(76,175,147,0.1)] text-[#4caf93]" : order.status === "pending" ? "bg-[rgba(201,169,110,0.1)] text-[#c9a96e]" : "bg-[rgba(201,74,74,0.1)] text-[#c94a4a]"}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="text-center">
          <button onClick={logout} className="px-6 py-2 text-sm text-[#8b8680] transition-colors border border-[rgba(201,169,110,0.15)] rounded-lg hover:border-[#c9a96e] hover:text-[#c9a96e]">
            Log Out
          </button>
        </div>

        {/* Donation Overlay */}
        {showDonate && !isKing && (
          <DonationOverlay
            fanId={user.id}
            fanName={user.name}
            onClose={() => setShowDonate(false)}
          />
        )}
      </div>
    </div>
  );
}