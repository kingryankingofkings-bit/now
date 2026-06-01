
import { useState, useEffect } from "react";
import { getLeaderboard, recordPageView } from "@/lib/localDb";
import { Trophy, Crown, Medal, Star, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<ReturnType<typeof getLeaderboard>>([]);

  useEffect(() => {
    recordPageView("leaderboard");
    setLeaders(getLeaderboard());
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="max-w-[680px] mx-auto px-4">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-[#8b8680] hover:text-[#c9a96e] mb-4 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#c9a96e]" />
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#e8e6e3]">Top Supporters</h1>
              {/* Update wording to Fanatics to match unified supporter terminology */}
              <p className="text-sm text-[#8b8680]">The Fanatics who support this creator the most.</p>
            </div>
          </div>
        </div>

        {leaders.length === 0 ? (
          <div className="text-center py-16 rounded-xl bg-[#23262a] border border-[rgba(201,169,110,0.08)]">
            <Trophy className="w-12 h-12 text-[#3a3d42] mx-auto mb-4" />
            <p className="text-sm text-[#8b8680]">No supporters yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((l, i) => (
              <div key={l.username} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${i === 0 ? "bg-[rgba(201,169,110,0.08)] border border-[rgba(201,169,110,0.2)]" : "bg-[#23262a] border border-[rgba(201,169,110,0.06)]"}`}>
                {/* Rank */}
                <div className="flex-shrink-0">
                  {i === 0 ? (
                    <div className="w-10 h-10 rounded-full bg-[#c9a96e] flex items-center justify-center">
                      <Crown className="w-5 h-5 text-[#1a1d21]" />
                    </div>
                  ) : i === 1 ? (
                    <div className="w-10 h-10 rounded-full bg-[#8b8680] flex items-center justify-center">
                      <Medal className="w-5 h-5 text-[#1a1d21]" />
                    </div>
                  ) : i === 2 ? (
                    <div className="w-10 h-10 rounded-full bg-[#6b5a3e] flex items-center justify-center">
                      <Medal className="w-5 h-5 text-[#e8e6e3]" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#23262a] border border-[rgba(201,169,110,0.1)] flex items-center justify-center">
                      <span className="text-sm font-mono text-[#8b8680]">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#e8e6e3] truncate">{l.name}</p>
                    {l.tier === "fanatic" && <Star className="w-3 h-3 text-[#c9a96e] flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-[#8b8680] font-mono">@{l.username}</p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-lg text-[#c9a96e] font-semibold">${l.totalSpent}</p>
                  <p className="text-[10px] text-[#8b8680]">total spent</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}