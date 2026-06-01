# Donation & Reward Code System - Implementation Plan

## Features

### 1. Fan Payment Method (Settings)
- New "Payment Method" tab in Settings for fans
- Add/edit card: cardholder name, card number, expiry, CVV
- Stored in localStorage, validated on save
- Used for shop purchases and donations

### 2. "Donate To The King" Button (Profile)
- Subtle gold-outlined button on fan profile pages
- Opens overlay with preset amounts ($1, $2, $5, $10, $20) + custom
- Uses saved payment method or prompts to add one
- After donating, shows reward code with animation

### 3. Reward Code System (localDb + Shop)
- Weighted probability table for discount rewards:
  - 5% off one item: 60.00%
  - 10% off one item: 17.00%
  - 15% off one item: 10.00%
  - 20% off one item: 6.00%
  - 25% off one item: 4.00%
  - 5% off entire order: 1.50%
  - 10% off entire order: 0.80%
  - 15% off entire order: 0.45%
  - 50% off entire order: 0.05%
  - Total: 99.80% (rounding, rest to 5% one item)
- Codes stored in localStorage with used/unused status
- Shop checkout has "Apply Code" input

## Files to Modify
1. `src/lib/localDb.ts` - Add payment method, donation, reward code types and functions
2. `src/pages/Profile.tsx` - Add Donate button + overlay
3. `src/pages/Settings.tsx` - Add Payment Method tab
4. `src/pages/Shop.tsx` - Add reward code input at checkout

## New Components
5. `src/components/DonationOverlay.tsx` - Donation amount selection overlay
6. `src/components/RewardCodeDisplay.tsx` - Shows generated reward code
