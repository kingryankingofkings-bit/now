
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import {
  getSiteSettings, updateSiteSettings, type SiteSettings,
  getContentPrefs, setContentPrefs, type ContentPrefs,
  getNotifPrefs, setNotifPrefs, type NotifPrefs,
  getAutoLikeEnabled, setAutoLikeEnabled,
  updateFanProfile, getFan,
  recordPageView,
} from "@/lib/localDb";
import {
  Settings as SettingsIcon,
  Crown,
  ArrowLeft,
  Palette,
  Sparkles,
  Bell,
  SlidersHorizontal,
  User,
  Save,
  ToggleLeft,
  ToggleRight,
  FileText,
  Video,
  Music,
  Pen,
  ShoppingBag,
  BarChart3,
  MessageCircle,
  Heart,
  DollarSign,
  Link as LinkIcon,
  X as XIcon,
  Facebook,
  Spotify,
  Music as MusicIcon,
  Ghost,
  Twitch,
} from "lucide-react";
import { getSocialLinks, saveSocialLinks, type SocialLink } from "@/lib/localDb";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

type SettingsTab = "site" | "content" | "notifications" | "profile";

const ACCENT_COLORS = [
  { label: "Gold", value: "#c9a96e" },
  { label: "Rose", value: "#e07a7a" },
  { label: "Teal", value: "#4caf93" },
  { label: "Violet", value: "#9b7ed8" },
  { label: "Orange", value: "#e89a4c" },
  { label: "Blue", value: "#6b9dc7" },
];

export default function Settings() {
  const { user, isAuthenticated, isKing } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>(isKing ? "site" : "profile");
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(getSiteSettings());
  const [contentPrefs, setContentPrefsState] = useState<ContentPrefs>(getContentPrefs(user?.id || ""));
  const [notifPrefs, setNotifPrefsState] = useState<NotifPrefs>(getNotifPrefs(user?.id || ""));
  const [editDisplayName, setEditDisplayName] = useState(user?.name || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar || "");
  const [editCover, setEditCover] = useState("");
  const [autoLike, setAutoLike] = useState(getAutoLikeEnabled());

  // Social links state. Only used for the King to edit his external platforms. Each entry has
  // a platform identifier, URL, and active flag. The King can update the URL and whether
  // the icon is visible on the feed.
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    recordPageView("settings");
    if (user?.id) {
      if (isKing) {
        const kp = JSON.parse(localStorage.getItem("mdk2_king_profile") || localStorage.getItem("mdk_king_profile") || localStorage.getItem("ch_king_profile") || "{}");
        setEditDisplayName(kp.displayName || user.name || "");
        setEditBio(kp.bio || user.bio || "");
        setEditAvatar(kp.avatar || user.avatar || "");
        setEditCover(kp.cover || "");

        // Load social links from localStorage for the King
        setSocialLinks(getSocialLinks());
      } else {
        setContentPrefsState(getContentPrefs(user.id));
        setNotifPrefsState(getNotifPrefs(user.id));
        const fan = getFan(user.id);
        if (fan) {
          setEditDisplayName(fan.displayName || "");
          setEditBio(fan.bio || "");
          setEditAvatar(fan.avatar || "");
          setEditCover(fan.cover || "");
        }
      }
    }
  }, [user, isKing]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="text-center">
          <SettingsIcon className="w-12 h-12 text-[#3a3d42] mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#e8e6e3] mb-2">Settings</h2>
          <p className="text-sm text-[#8b8680] mb-6">Login to access your settings.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a]">Login</Link>
        </div>
      </div>
    );
  }

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
    }
    toast.success("Profile saved!");
  };

  const handleSaveSite = () => { updateSiteSettings(siteSettings); toast.success("Site settings saved!"); };
  const handleSaveContentPrefs = () => { if (user?.id) setContentPrefs(user.id, contentPrefs); toast.success("Content preferences saved!"); };
  const handleSaveNotifPrefs = () => { if (user?.id) setNotifPrefs(user.id, notifPrefs); toast.success("Notification preferences saved!"); };
  const handleToggleAutoLike = () => { const next = !autoLike; setAutoLike(next); setAutoLikeEnabled(next); toast.success(next ? "Auto-like enabled!" : "Auto-like disabled."); };

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode; kingOnly?: boolean }[] = [
    { key: "site", label: "Site Editor", icon: <Palette className="w-4 h-4" />, kingOnly: true },
    { key: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { key: "content", label: "Content Prefs", icon: <SlidersHorizontal className="w-4 h-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  ];

  // Map social platform identifiers to icons for display in the social link editor. This mirrors
  // the mapping used in the Feed page. If a platform is not recognized, fall back to the X icon.
  const linkIconMap: Record<string, any> = {
    x: XIcon,
    tiktok: Video,
    facebook: Facebook,
    spotify: Spotify,
    snapchat: Ghost,
    twitch: Twitch,
    ytmusic: MusicIcon,
  };

  /**
   * Handle changes to a social link entry. Updates the local state. The index identifies
   * which link to update; field can be "url" or "isActive". Value is the new value.
   */
  const handleSocialChange = (index: number, field: "url" | "isActive", value: string | boolean) => {
    setSocialLinks((prev) => {
      const copy = [...prev];
      const entry = { ...copy[index] } as SocialLink;
      if (field === "url") {
        entry.url = value as string;
      } else {
        entry.isActive = value as boolean;
      }
      copy[index] = entry;
      return copy;
    });
  };

  /**
   * Persist the social links to localStorage. Called when the King clicks the save button.
   */
  const handleSaveSocialLinks = () => {
    saveSocialLinks(socialLinks);
    toast.success("Social links saved!");
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-[900px] mx-auto px-6">
        <div className="mb-8">
          <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-[#8b8680] hover:text-[#c9a96e] mb-4 transition-colors"><ArrowLeft className="w-3 h-3" /> Back to Profile</Link>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-[#c9a96e]" />
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#e8e6e3]">Settings</h1>
              <p className="text-sm text-[#8b8680]">{isKing ? "Customize your site and preferences" : "Customize your experience"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.filter((t) => !t.kingOnly || isKing).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#23262a] text-[#8b8680] hover:text-[#e8e6e3]"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* SITE EDITOR */}
        {activeTab === "site" && isKing && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#c9a96e]" />
                  <div>
                    <p className="text-sm font-medium text-[#e8e6e3]">AI Auto-Like Comments</p>
                    <p className="text-xs text-[#8b8680]">When enabled, the AI Agent will automatically like all fan and fanatic comments on your posts</p>
                  </div>
                </div>
                <button onClick={handleToggleAutoLike} className={`p-2 rounded-lg transition-all ${autoLike ? "bg-[#4caf93] text-white" : "bg-[#23262a] text-[#8b8680]"}`}>
                  {autoLike ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-[#c9a96e]" />
                <h2 className="font-serif text-lg font-semibold text-[#e8e6e3]">Site Editor</h2>
              </div>
              <div>
                <label className="text-xs text-[#8b8680] mb-1.5 block">Site Title</label>
                <input type="text" value={siteSettings.siteTitle} onChange={(e) => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" />
              </div>
              <div>
                <label className="text-xs text-[#8b8680] mb-1.5 block">Tagline</label>
                <input type="text" value={siteSettings.tagline} onChange={(e) => setSiteSettings({ ...siteSettings, tagline: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" />
              </div>
              <div>
                <label className="text-xs text-[#8b8680] mb-1.5 block">Hero Title</label>
                <input type="text" value={siteSettings.heroTitle} onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" />
              </div>
              <div>
                <label className="text-xs text-[#8b8680] mb-1.5 block">Hero Subtitle</label>
                <textarea value={siteSettings.heroSubtitle} onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })} rows={3} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e] resize-none" />
              </div>
              <div>
                <label className="text-xs text-[#8b8680] mb-1.5 block">Hero Button Text</label>
                <input type="text" value={siteSettings.heroCtaText} onChange={(e) => setSiteSettings({ ...siteSettings, heroCtaText: e.target.value })} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" />
              </div>
              <div>
                <label className="text-xs text-[#8b8680] mb-2 block">Accent Color</label>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <button key={c.value} onClick={() => setSiteSettings({ ...siteSettings, accentColor: c.value })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${siteSettings.accentColor === c.value ? "bg-[rgba(201,169,110,0.1)] ring-1 ring-[#c9a96e]" : "hover:bg-[rgba(255,255,255,0.03)]"}`}>
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: c.value }} />
                      <span className="text-[10px] text-[#8b8680]">{c.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-[#8b8680]">Custom:</label>
                  <input type="color" value={siteSettings.accentColor} onChange={(e) => setSiteSettings({ ...siteSettings, accentColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                  <code className="text-xs text-[#c9a96e] font-mono">{siteSettings.accentColor}</code>
                </div>
              </div>
              <button onClick={handleSaveSite} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Site Settings
              </button>
            </div>
            {/* Social Links Editor for the King */}
            <div className="p-5 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-[#c9a96e]" />
                <h2 className="font-serif text-lg font-semibold text-[#e8e6e3]">Social Links</h2>
              </div>
              <div className="space-y-3">
                {socialLinks.map((link, idx) => {
                  const Icon = linkIconMap[link.platform] || XIcon;
                  return (
                    <div key={link.platform} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-[#c9a96e]" />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleSocialChange(idx, "url", e.target.value)}
                        placeholder={`${link.platform.toUpperCase()} URL`}
                        className="flex-1 bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-3 py-2 text-xs text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e]"
                      />
                      <label className="flex items-center gap-1 text-xs text-[#8b8680]">
                        <input
                          type="checkbox"
                          checked={link.isActive}
                          onChange={(e) => handleSocialChange(idx, "isActive", e.target.checked)}
                          className="form-checkbox rounded bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] text-[#c9a96e]"
                        />
                        Active
                      </label>
                    </div>
                  );
                })}
                <button
                  onClick={handleSaveSocialLinks}
                  className="px-4 py-2 bg-[#c9a96e] text-[#1a1d21] text-sm font-medium rounded-lg hover:bg-[#d4b87a]"
                >
                  Save Social Links
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="p-5 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-[#c9a96e]" />
              <h2 className="font-serif text-lg font-semibold text-[#e8e6e3]">Profile Customization</h2>
            </div>

            <ImageUpload label="Cover Photo" value={editCover} onChange={setEditCover} aspect="wide" />

            <div className="flex justify-center">
              <ImageUpload label="Profile Photo" value={editAvatar} onChange={setEditAvatar} aspect="avatar" />
            </div>

            {!isKing && (
              <div>
                <label className="text-xs text-[#8b8680] mb-1.5 block">Display Name</label>
                <input type="text" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" />
              </div>
            )}

            <div>
              <label className="text-xs text-[#8b8680] mb-1.5 block">Bio</label>
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} className="w-full bg-[#1a1d21] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#e8e6e3] placeholder:text-[#8b8680] focus:outline-none focus:border-[#c9a96e] resize-none" placeholder="Write a short bio about yourself..." />
            </div>

            <button onClick={handleSaveProfile} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        )}

        {/* CONTENT PREFS */}
        {activeTab === "content" && (
          <div className="p-5 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal className="w-4 h-4 text-[#c9a96e]" />
              <h2 className="font-serif text-lg font-semibold text-[#e8e6e3]">Content Preferences</h2>
            </div>

            <div>
              <label className="text-xs text-[#8b8680] mb-2 block">Default Feed Sort</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: "recent" as const, label: "Recent", icon: <FileText className="w-3.5 h-3.5" /> },
                  { key: "liked" as const, label: "Most Liked", icon: <Heart className="w-3.5 h-3.5" /> },
                  { key: "video" as const, label: "Videos", icon: <Video className="w-3.5 h-3.5" /> },
                  { key: "audio" as const, label: "Audios", icon: <Music className="w-3.5 h-3.5" /> },
                  { key: "writing" as const, label: "Writings", icon: <Pen className="w-3.5 h-3.5" /> },
                  { key: "update" as const, label: "Updates", icon: <Sparkles className="w-3.5 h-3.5" /> },
                ].map((opt) => (
                  <button key={opt.key} onClick={() => setContentPrefsState({ ...contentPrefs, feedSort: opt.key })}
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-all ${contentPrefs.feedSort === opt.key ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#1a1d21] text-[#8b8680] hover:text-[#e8e6e3]"}`}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-[#8b8680] block">Hide from Feed</label>
              {[
                { key: "hideMerch" as const, label: "Merchandise tab", desc: "Hide the merch filter from your feed" },
                { key: "hideUpdates" as const, label: "Update posts", desc: "Hide creator update posts from your feed" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-[#1a1d21]">
                  <div>
                    <p className="text-sm text-[#e8e6e3]">{item.label}</p>
                    <p className="text-[10px] text-[#8b8680]">{item.desc}</p>
                  </div>
                  <button onClick={() => setContentPrefsState({ ...contentPrefs, [item.key]: !contentPrefs[item.key] })}
                    className={`p-2 rounded-lg transition-all ${contentPrefs[item.key] ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#23262a] text-[#8b8680]"}`}>
                    {contentPrefs[item.key] ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>

            <button onClick={handleSaveContentPrefs} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Content Preferences
            </button>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="p-5 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)] space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-[#c9a96e]" />
              <h2 className="font-serif text-lg font-semibold text-[#e8e6e3]">Notification Preferences</h2>
            </div>
            <p className="text-xs text-[#8b8680]">Choose what site activity you want to be notified about</p>

            <div className="space-y-2">
              {[
                { key: "newPosts" as const, label: "New Posts", desc: "When new content is published", icon: <FileText className="w-4 h-4" /> },
                { key: "newVideos" as const, label: "New Videos", desc: "When a video is uploaded", icon: <Video className="w-4 h-4" /> },
                { key: "newImages" as const, label: "New Photos", desc: "When an image post is shared", icon: <Music className="w-4 h-4" /> },
                { key: "newAudio" as const, label: "New Audio", desc: "When audio/music is posted", icon: <Music className="w-4 h-4" /> },
                { key: "newWriting" as const, label: "New Writing", desc: "When a written piece is published", icon: <Pen className="w-4 h-4" /> },
                { key: "newProducts" as const, label: "New Products", desc: "When a new shop item is added", icon: <ShoppingBag className="w-4 h-4" /> },
                { key: "newPolls" as const, label: "New Polls", desc: "When a new poll is created", icon: <BarChart3 className="w-4 h-4" /> },
                { key: "mentions" as const, label: "Mentions", desc: "When you are mentioned", icon: <MessageCircle className="w-4 h-4" /> },
                { key: "tips" as const, label: "Tips", desc: "When someone tips on a post", icon: <DollarSign className="w-4 h-4" /> },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-[#1a1d21]">
                  <div className="flex items-center gap-3">
                    <span className="text-[#c9a96e]">{item.icon}</span>
                    <div>
                      <p className="text-sm text-[#e8e6e3]">{item.label}</p>
                      <p className="text-[10px] text-[#8b8680]">{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => setNotifPrefsState({ ...notifPrefs, [item.key]: !notifPrefs[item.key] })}                    className={`p-2 rounded-lg transition-all ${notifPrefs[item.key] ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#23262a] text-[#8b8680]"}`}>
                    {notifPrefs[item.key] ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>

            <button onClick={handleSaveNotifPrefs} className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Notification Preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}