import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router";
import {
  Crown,
  Star,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  Grid3X3,
  Bot,
  Trophy,
  Home,
  Video as VideoIcon,
  File as FileIcon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Navigation() {
  const { user, isAuthenticated, isKing, isFanatic, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Navigation links: convert categories into top-level pages. We removed
  // sorting-based filters (recent, liked, update, audio) and instead expose
  // dedicated routes for Videos and Writings. Merchandise directs to the shop.
  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/feed", label: "Feed", icon: Grid3X3 },
    { to: "/feed?category=video", label: "Videos", icon: VideoIcon },
    { to: "/feed?category=writing", label: "Writings", icon: FileIcon },
    { to: "/shop", label: "Merchandise", icon: ShoppingBag },
    { to: "/profile", label: "Profile", icon: User },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/login");
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#1a1d21]/90 backdrop-blur-xl border-b border-[rgba(201,169,110,0.08)]">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* ─── Logo ─── */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 shrink-0"
        >
          <Crown className="w-6 h-6 text-[#c9a96e]" />
          <span className="font-serif text-xl font-bold gold-gradient-text">
            Digital Kingdom
          </span>
        </button>

        {/* ─── Center Nav Links (desktop) ─── */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-[#c9a96e] bg-[rgba(201,169,110,0.08)]"
                    : "text-[#8b8680] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </button>
            );
          })}

          {/* Leaderboard link */}
          <button
            onClick={() => navigate("/leaderboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/leaderboard")
                ? "text-[#c9a96e] bg-[rgba(201,169,110,0.08)]"
                : "text-[#8b8680] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
        </div>

        {/* ─── Right Section ─── */}
        <div className="flex items-center gap-3">
          {/* King badge + links */}
          {isKing && (
            <>
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(201,169,110,0.12)] border border-[rgba(201,169,110,0.2)]">
                <Crown className="w-3.5 h-3.5 text-[#c9a96e]" />
                <span className="text-xs font-medium text-[#c9a96e]">King</span>
              </div>
              <button
                onClick={() => navigate("/admin")}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#c9a96e] bg-[rgba(201,169,110,0.08)] hover:bg-[rgba(201,169,110,0.15)] transition"
              >
                King Panel
              </button>
              <button
                onClick={() => navigate("/ai-agent")}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#e8e6e3] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition"
              >
                <Bot className="w-3.5 h-3.5" />
                AI Agent
              </button>
            </>
          )}

          {/* Fanatic badge */}
          {isFanatic && !isKing && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(76,175,147,0.12)] border border-[rgba(76,175,147,0.2)]">
              <Star className="w-3.5 h-3.5 text-[#4caf93]" />
              <span className="text-xs font-medium text-[#4caf93]">Fanatic</span>
            </div>
          )}

          {/* Authenticated user dropdown */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-[rgba(201,169,110,0.3)] transition"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-[rgba(201,169,110,0.2)]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#c9a96e] flex items-center justify-center text-sm font-bold text-[#1a1d21]">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.15)] shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-[rgba(201,169,110,0.08)] mb-1">
                    <p className="text-sm font-medium text-[#e8e6e3] truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-[#8b8680] truncate">
                      @{user?.username || ""}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/settings");
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#8b8680] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.04)] transition"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#c94a4a] hover:bg-[rgba(201,74,74,0.08)] transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Sign In button */
            <button
              onClick={() => navigate("/login")}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#c9a96e] text-[#1a1d21] hover:bg-[#d4b87a] transition"
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[#8b8680] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.04)] transition"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ─── Mobile Menu ─── */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#1a1d21]/95 backdrop-blur-xl border-b border-[rgba(201,169,110,0.08)] px-4 py-4 space-y-1 shadow-2xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-[#c9a96e] bg-[rgba(201,169,110,0.08)]"
                    : "text-[#8b8680] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </button>
            );
          })}

          <button
            onClick={() => navigate("/leaderboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/leaderboard")
                ? "text-[#c9a96e] bg-[rgba(201,169,110,0.08)]"
                : "text-[#8b8680] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            <Trophy className="w-5 h-5" />
            Leaderboard
          </button>

          {/* Mobile: King links */}
          {isKing && (
            <>
              <div className="pt-2 border-t border-[rgba(201,169,110,0.08)] mt-2">
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#c9a96e] bg-[rgba(201,169,110,0.08)] hover:bg-[rgba(201,169,110,0.15)] transition"
                >
                  <Crown className="w-5 h-5" />
                  King Panel
                </button>
                <button
                  onClick={() => navigate("/ai-agent")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#e8e6e3] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition mt-1"
                >
                  <Bot className="w-5 h-5" />
                  AI Agent
                </button>
              </div>
            </>
          )}

          {/* Mobile: auth actions */}
          <div className="pt-2 border-t border-[rgba(201,169,110,0.08)] mt-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 mb-1">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-[rgba(201,169,110,0.2)]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#c9a96e] flex items-center justify-center text-sm font-bold text-[#1a1d21]">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#e8e6e3]">{user?.name}</p>
                    <p className="text-xs text-[#8b8680]">@{user?.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/settings")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#8b8680] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.04)] transition"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#c94a4a] hover:bg-[rgba(201,74,74,0.08)] transition"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-[#c9a96e] text-[#1a1d21] hover:bg-[#d4b87a] transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
