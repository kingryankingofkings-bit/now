
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  registerFan, loginFan,
} from "@/lib/localDb";
import {
  Crown, User, Lock, Mail, Phone, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register" | "king">(
    (searchParams.get("mode") as "login" | "register" | "king") || "login"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const tier: "fan" = "fan"; // Only free fan accounts, no paid tier
  const [kingPassword, setKingPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { toast.error("Fill in all fields"); return; }
    const result = loginFan(username.trim(), password);
    if (!result) { toast.error("Invalid username or password"); return; }
    // Save fan user to localStorage for auth hook
    localStorage.setItem("fan_user", JSON.stringify({
      id: result.id,
      username: result.username,
      name: result.name,
      displayName: result.name,
      tier: result.tier,
      avatar: result.avatar || null,
      bio: result.bio || null,
      cover: (result as any).cover || null,
    }));
    toast.success(`Welcome back, ${result.name}!`);
    navigate("/feed");
    setTimeout(() => window.location.reload(), 100);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !displayName.trim() || !email.trim()) { toast.error("Fill in all required fields"); return; }
    const result = registerFan({
      username: username.trim(),
      password,
      displayName: displayName.trim(),
      email: email.trim(),
      phone,
      tier,
    });
    if (!result.success) { toast.error(result.error || "Registration failed"); return; }
    // Now login
    const loginResult = loginFan(username.trim(), password);
    if (loginResult) {
      localStorage.setItem("fan_user", JSON.stringify({
        id: loginResult.id,
        username: loginResult.username,
        name: loginResult.name,
        displayName: loginResult.name,
        tier: loginResult.tier,
        avatar: loginResult.avatar || null,
        bio: loginResult.bio || null,
        cover: (loginResult as any).cover || null,
      }));
      toast.success(`Welcome, ${loginResult.name}!`);
      navigate("/feed");
      setTimeout(() => window.location.reload(), 100);
    }
  };

  const handleKingLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (kingPassword !== "creator2024") { toast.error("Incorrect password"); return; }
    const user = { id: "king", name: "CreatorKing", role: "king" as const, createdAt: new Date().toISOString() };
    localStorage.setItem("mdk2_user", JSON.stringify(user));
    toast.success("Welcome, King!");
    // Redirect the King directly to the management interface instead of the public feed
    navigate("/admin");
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-[#8b8680] hover:text-[#c9a96e] mb-8 transition-colors"><ArrowLeft className="w-3 h-3" /> Back to Home</Link>
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#e8e6e3] mb-2">Welcome</h1>
          <p className="text-sm text-[#8b8680]">Sign in to access your account.</p>
        </div>
        <div className="flex gap-2 mb-6">
          {(["login", "register", "king"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === m ? "bg-[#c9a96e] text-[#1a1d21]" : "bg-[#23262a] text-[#8b8680] hover:text-[#e8e6e3]"}`}
            >
              {m === "login" ? "Login" : m === "register" ? "Sign Up" : "King"}
            </button>
          ))}
        </div>
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="text-xs text-[#8b8680] mb-1 block">Username</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" /><input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" placeholder="Your username" /></div></div>
            <div><label className="text-xs text-[#8b8680] mb-1 block">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" placeholder="Your password" /></div></div>
            <button type="submit" className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors">Sign In</button>
          </form>
        )}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div><label className="text-xs text-[#8b8680] mb-1 block">Username *</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" /><input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" placeholder="Choose a username" /></div></div>
            <div><label className="text-xs text-[#8b8680] mb-1 block">Display Name *</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg px-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" placeholder="Your display name" /></div>
            <div><label className="text-xs text-[#8b8680] mb-1 block">Email *</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" placeholder="your@email.com" /></div></div>
            <div><label className="text-xs text-[#8b8680] mb-1 block">Password *</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" placeholder="Min 4 characters" /></div></div>
            <div><label className="text-xs text-[#8b8680] mb-1 block">Phone</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" /><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" placeholder="Optional" /></div></div>
            <button
              type="submit"
              className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors"
            >
              Create Free Fanatic Account
            </button>
          </form>
        )}
        {mode === "king" && (
          <form onSubmit={handleKingLogin} className="space-y-4">
            <div className="text-center mb-6"><Crown className="w-12 h-12 text-[#c9a96e] mx-auto mb-3" /><h2 className="font-serif text-xl text-[#e8e6e3]">King Access</h2><p className="text-xs text-[#8b8680]">Enter the creator password</p></div>
            <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" /><input type="password" value={kingPassword} onChange={(e) => setKingPassword(e.target.value)} className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]" placeholder="Creator password" /></div>
            <button type="submit" className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors">Enter as King</button>
          </form>
        )}
      </div>
    </div>
  );
}