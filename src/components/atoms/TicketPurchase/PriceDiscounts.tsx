// src/components/TicketPurchase/PriceDiscounts.tsx
import React from 'react';
import { useTicketPurchase } from '@/components/contexts/TicketPurchaseContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Tag, Coins, XCircle } from 'lucide-react';
import { CouponData } from '@/components/contexts/TicketPurchaseContext'; 

export const PriceDiscounts: React.FC = () => {
  const {
    sessionStatus,
    isUserDataLoading,
    userDataError,
    availableCoupons,
    selectedCouponId,
    setSelectedCouponId,
    formatCurrency,
    promoCodeInput,
    setPromoCodeInput,
    handleApplyPromo,
    isApplyingPromo,
    promoError,
    appliedPromotion,
    clearPromotion,
    pointsToUseInput,
    handlePointsInputChange,
    handlePointsInputBlur,
    availablePoints,
    pointsToUseValidated,
    selectedTier // Need selectedTier to enable/disable inputs
  } = useTicketPurchase();

  const getCouponLabel = (coupon: CouponData): string => {
    let label = `${coupon.code} (`;
    label += coupon.discountType === 'PERCENTAGE' ? `${coupon.discount}%` : `${formatCurrency(coupon.discount)}`;
    label += ` off)`;
    // TODO: add expiry:
    // const expiry = new Date(coupon.expiresAt);
    // label += ` - Expires ${expiry.toLocaleDateString()}`;
    return label;
  };

  // Only render discount sections if logged in and tier selected
  if (sessionStatus !== 'authenticated' || !selectedTier) {
    return null; // Or return a placeholder/login prompt if needed outside main component
  }

  return (
    <div className="space-y-4 border-t border-b border-slate-200 py-4">
      {/* Coupon Selection */}
      <div>
        <Label htmlFor="coupon-select" className="text-gray-700 text-sm font-medium mb-1 flex items-center">
          <Tag className="h-4 w-4 mr-1.5 text-primary-600" /> Apply Coupon
        </Label>
        {isUserDataLoading && <div className="text-sm text-gray-500 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading coupons...</div>}
        {userDataError && <div className="text-sm text-red-600">Error loading coupons.</div>}
        {!isUserDataLoading && !userDataError && (
          <Select
            value={selectedCouponId || "none"} // Use "none" for the placeholder item
            onValueChange={(value) => setSelectedCouponId(value === "none" ? "" : value)}
            disabled={availableCoupons.length === 0}
          >
            <SelectTrigger id="coupon-select" className="w-full bg-slate-50 border-slate-200 text-gray-800 disabled:text-gray-400">
              <SelectValue placeholder={availableCoupons.length > 0 ? "Select a coupon" : "No coupons available"} />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200">
              <SelectItem value="none" className="text-gray-500 italic cursor-pointer">No Coupon</SelectItem>
              {availableCoupons.map((coupon) => (
                <SelectItem key={coupon.id} value={String(coupon.id)} className="text-gray-800 cursor-pointer">{getCouponLabel(coupon)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Promotional Code */}
      <div>
        <Label htmlFor="promo-code" className="text-gray-700 text-sm font-medium mb-1 flex items-center">
          <Tag className="h-4 w-4 mr-1.5 text-primary-600" /> Promotional Code
        </Label>
        {!appliedPromotion ? (
          <>
            <div className="flex space-x-2">
              <Input
                id="promo-code"
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border-slate-200 text-gray-800"
                placeholder="Enter promo code"
                disabled={isApplyingPromo} // Only disable during apply action
              />
              <Button
                onClick={handleApplyPromo}
                disabled={!promoCodeInput.trim() || isApplyingPromo}
                className="bg-primary-600 hover:bg-primary-700 text-white shrink-0" // Prevent button shrinking
                size="sm" // Adjust size if needed
              >
                {isApplyingPromo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
            {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
          </>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
             <span>
                Applied: {appliedPromotion.code} ({appliedPromotion.discountType === 'PERCENTAGE' ? `${appliedPromotion.discount}%` : formatCurrency(appliedPromotion.discount)} off)
             </span>
             <button onClick={clearPromotion} className="ml-2 text-green-600 hover:text-green-800" aria-label="Remove promotion">
                 <XCircle className="h-4 w-4" />
             </button>
          </div>
        )}
      </div>

      {/* Points Usage */}
      <div>
        <Label htmlFor="points-input" className="text-gray-700 text-sm font-medium mb-1 flex items-center">
          <Coins className="h-4 w-4 mr-1.5 text-amber-500" /> Use Points
        </Label>
        {isUserDataLoading && <div className="text-sm text-gray-500 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading points...</div>}
        {userDataError && <div className="text-sm text-red-600">Error loading points.</div>}
        {!isUserDataLoading && !userDataError && (
          <>
            <Input
              id="points-input"
              type="text" // Use text to allow formatting/validation flexibility
              inputMode="numeric" // Hint for mobile keyboards
              value={pointsToUseInput}
              onChange={handlePointsInputChange}
              onBlur={handlePointsInputBlur}
              className="w-full bg-slate-50 border-slate-200 text-gray-800"
              placeholder="0"
              disabled={availablePoints === 0}
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {availablePoints.toLocaleString()} points (1 point = {formatCurrency(1)}) {/* Clarify point value */}
            </p>
            {/* Show validation message if input exceeds available points */}
            {parseInt(pointsToUseInput || '0', 10) > availablePoints && availablePoints > 0 && (
                 <p className="text-xs text-red-500 mt-1">Cannot use more points than available.</p>
            )}
            {/* Optionally show the value of points being used */}
            {pointsToUseValidated > 0 && (
                 <p className="text-xs text-amber-600 mt-1">Using {pointsToUseValidated.toLocaleString()} points (-{formatCurrency(pointsToUseValidated)})</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};