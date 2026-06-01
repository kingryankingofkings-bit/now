import { useState } from "react";
import { Gift, Copy, Check, Sparkles, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface RewardCodeDisplayProps {
  code: string;
  discountPercent: number;
  scope: "one_item" | "entire_order";
  donationAmount: string;
  onClose: () => void;
}

export default function RewardCodeDisplay({ code, discountPercent, scope, donationAmount, onClose }: RewardCodeDisplayProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToShop = () => {
    onClose();
    navigate("/shop");
  };

  const getRarityLabel = () => {
    if (discountPercent >= 50) return { label: "LEGENDARY", color: "#c9a96e", bg: "rgba(201,169,110,0.15)" };
    if (discountPercent >= 25) return { label: "EPIC", color: "#9b7ed8", bg: "rgba(155,126,216,0.15)" };
    if (discountPercent >= 20) return { label: "RARE", color: "#6b9dc7", bg: "rgba(107,157,199,0.15)" };
    if (discountPercent >= 15) return { label: "UNCOMMON", color: "#4caf93", bg: "rgba(76,175,147,0.15)" };
    return { label: "COMMON", color: "#8b8680", bg: "rgba(139,134,128,0.1)" };
  };

  const rarity = getRarityLabel();

  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-[rgba(201,169,110,0.1)] border border-[rgba(201,169,110,0.2)] flex items-center justify-center mx-auto mb-3">
        <Gift className="w-6 h-6 text-[#c9a96e]" />
      </div>

      <h3 className="font-serif text-xl font-bold text-[#e8e6e3] mb-1">Thank You!</h3>
      <p className="text-xs text-[#8b8680] mb-4">Your ${donationAmount} donation means the world</p>

      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: rarity.bg }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-3 h-3" style={{ color: rarity.color }} />
          <span className="text-[10px] font-bold tracking-wider" style={{ color: rarity.color }}>{rarity.label} REWARD</span>
          <Sparkles className="w-3 h-3" style={{ color: rarity.color }} />
        </div>
        <p className="text-2xl font-bold font-mono text-[#e8e6e3]">{discountPercent}% OFF</p>
        <p className="text-xs text-[#8b8680]">{scope === "one_item" ? "One Item" : "Entire Order"}</p>
      </div>

      <div className="mb-6">
        <p className="text-[10px] text-[#8b8680] uppercase tracking-wider mb-2">Your Reward Code</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-[#1a1d21] rounded-lg px-4 py-3 text-lg text-[#c9a96e] font-mono tracking-wider">{code}</code>
          <button onClick={handleCopy}
            className="p-3 bg-[#c9a96e] text-[#1a1d21] rounded-lg hover:bg-[#d4b87a] transition-colors">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-[#8b8680] mt-2">Enter this code at checkout in the shop</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-3 border border-[rgba(201,169,110,0.2)] text-[#8b8680] rounded-lg hover:text-[#e8e6e3] transition-colors text-sm">
          Close
        </button>
        <button onClick={handleGoToShop}
          className="flex-1 py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors text-sm flex items-center justify-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Go To Shop
        </button>
      </div>
    </div>
  );
}
