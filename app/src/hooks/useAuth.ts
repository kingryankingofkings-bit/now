import { useState, useEffect, useCallback } from "react";
import { authEvents } from "@/lib/authEvents";

export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string | null;
  bio?: string | null;
  cover?: string | null;
  role?: "king";
  tier?: "fan" | "fanatic";
  createdAt?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const kingData = localStorage.getItem("mdk2_user") || localStorage.getItem("mdk_user") || localStorage.getItem("ch_user");
      if (kingData) {
        try {
          const king = JSON.parse(kingData);
          setUser({
            id: king.id,
            name: king.name || "CreatorKing",
            role: "king",
            ...king,
          });
          setIsLoading(false);
          return;
        } catch {
          /* ignore invalid JSON */
        }
      }

      const fanData = localStorage.getItem("fan_user");
      if (fanData) {
        try {
          const fan = JSON.parse(fanData);
          setUser({
            id: String(fan.id),
            name: fan.name || fan.displayName || fan.username,
            username: fan.username,
            avatar: fan.avatar || null,
            bio: fan.bio || null,
            cover: fan.cover || null,
            tier: fan.tier || "fan",
          });
          setIsLoading(false);
          return;
        } catch {
          /* ignore invalid JSON */
        }
      }

      setUser(null);
      setIsLoading(false);
    };

    checkAuth();
    const unsubscribe = authEvents.subscribe(checkAuth);
    return unsubscribe;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mdk2_user");
    localStorage.removeItem("mdk_user");
    localStorage.removeItem("ch_user");
    localStorage.removeItem("fan_user");
    setUser(null);
    authEvents.emit();
    window.location.reload();
  }, []);

  const isAuthenticated = !!user;
  const isKing = user?.role === "king";
  const isFanatic = user?.tier === "fanatic";
  const tier = user?.tier || null;

  return { user, isAuthenticated, isKing, isFanatic, tier, isLoading, logout };
}
