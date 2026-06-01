import { useState } from "react";
import { X, Heart, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { createDonation } from "@/lib/localDb";
// Payment processing within this overlay has been simplified to use PayPal only.
// We no longer collect or store card details. When the user chooses an amount
// and continues, we simulate a PayPal checkout and immediately process the donation.
import RewardCodeDisplay from "./RewardCodeDisplay";

interface DonationOverlayProps {
  fanId: string;
  fanName: string;
  onClose: () => void;
}

// Steps in the overlay. We removed the separate payment step since we no longer
// collect card details. Once an amount is selected the user can donate with PayPal.
type Step = "amount" | "success";

const PRESET_AMOUNTS = [1, 2, 5, 10, 20];

export default function DonationOverlay({ fanId, fanName, onClose }: DonationOverlayProps) {
  const [step, setStep] = useState<Step>("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const [rewardPercent, setRewardPercent] = useState(0);
  const [rewardScope, setRewardScope] = useState<"one_item" | "entire_order">("one_item");

  // The final amount to donate. We derive this from the selected preset or custom field.
  const amount = selectedAmount ?? (customAmount ? Number(customAmount) : 0);

  const handleSelectAmount = (amt: number) => {
    setSelectedAmount(amt);
    setCustomAmount("");
  };

  // When the user chooses to donate, immediately process via PayPal (simulated).
  const handleDonate = () => {
    if (amount <= 0) {
      toast.error("Select an amount");
      return;
    }
    processDonation();
  };

  const processDonation = () => {
    const result = createDonation(fanId, fanName, amount.toFixed(2));
    setRewardCode(result.code.code);
    setRewardPercent(result.code.discountPercent);
    setRewardScope(result.code.scope);
    setStep("success");
    toast.success(`Thank you for your $${amount} donation!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative liquid-glass rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-[#8b8680] hover:text-[#e8e6e3]"><X className="w-5 h-5" /></button>

        {step === "amount" && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(201,169,110,0.1)] border border-[rgba(201,169,110,0.2)] flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-[#c9a96e]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#e8e6e3]">Support The King</h3>
              <p className="text-xs text-[#8b8680] mt-1">Every donation unlocks a reward code for the shop</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {PRESET_AMOUNTS.map((amt) => (
                <button key={amt} onClick={() => handleSelectAmount(amt)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedAmount === amt
                      ? "bg-[#c9a96e] text-[#1a1d21] border-[#c9a96e]"
                      : "bg-[#23262a] text-[#e8e6e3] border border-[rgba(201,169,110,0.15)] hover:border-[#c9a96e]"
                  }`}>
                  <DollarSign className="w-3 h-3 inline" />{amt}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-xs text-[#8b8680] mb-1 block">Custom Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8680]" />
                <input type="number" min="1" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  className="w-full bg-[#23262a] border border-[rgba(201,169,110,0.15)] rounded-lg pl-10 pr-4 py-3 text-sm text-[#e8e6e3] focus:outline-none focus:border-[#c9a96e]"
                  placeholder="Enter amount" />
              </div>
            </div>

            <button
              onClick={handleDonate}
              disabled={amount <= 0}
              className="w-full py-3 bg-[#c9a96e] text-[#1a1d21] font-medium rounded-lg hover:bg-[#d4b87a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Donate ${amount} with PayPal
            </button>
          </>
        )}

        {step === "success" && rewardCode && (
          <RewardCodeDisplay
            code={rewardCode}
            discountPercent={rewardPercent}
            scope={rewardScope}
            donationAmount={amount.toFixed(2)}
            onClose={onClose}
          />
        )}

        {/* The success step is rendered above. */}
      </div>
    </div>
  );
}
