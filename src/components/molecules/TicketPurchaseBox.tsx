"use client";

import React from 'react';
import { useTicketPurchase, ConcertInfo, TicketPurchaseProvider } from '@/components/contexts/TicketPurchaseContext'; // Import context hook and type
import { PriceAdditions } from '@/components/atoms/TicketPurchase/PriceAdditions';
import { PriceDiscounts } from '@/components/atoms/TicketPurchase/PriceDiscounts';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Ticket, ShoppingCart, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TicketPurchaseLayout: React.FC = () => {
  const {
    concert,
    sessionStatus,
    isUserDataLoading,
    remainingSeats,
    isLowStock,
    selectedTier,
    quantity,
    priceBreakdown,
    formatCurrency,
    handlePurchase,
    taxRate,
    currentTierPrice, 
    selectedCouponDetails,
    appliedPromotion,
  } = useTicketPurchase();

  const eventDate = concert?.startDate ? new Date(concert.startDate) : new Date();
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString('default', { month: 'short' });
  const formattedEventDate = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  const router = useRouter();

  const isCheckoutDisabled =
    !selectedTier ||
    quantity <= 0 ||
    currentTierPrice <= 0 ||
    sessionStatus === 'loading' ||
    (sessionStatus === 'authenticated' && isUserDataLoading) || // Disable while user data loads after auth
    remainingSeats <= 0; // Disable if sold out


  const getCheckoutButtonTitle = () => {
      if(remainingSeats <= 0) return 'Tickets are sold out';
      if (!selectedTier) return 'Please select a ticket type';
      if (quantity <= 0) return 'Please select quantity'; // Good Hfallback
      if (currentTierPrice <= 0 && selectedTier) return 'Selected tier has no price';
      if (sessionStatus === 'loading') return 'Verifying login status...';
      if (sessionStatus === 'unauthenticated') return 'Please sign in to purchase';
      if (isUserDataLoading) return 'Loading user details...';
      return 'Proceed to Checkout'; // Default enabled title
  }

  return (
    <div className="h-fit w-full md:w-1/3 bg-white backdrop-blur-sm shadow-xl rounded-xl overflow-hidden order-1 md:order-2 border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white text-primary-700 rounded-lg p-2 mr-3 text-center w-14 shadow-lg">
            <span className="block text-xs font-bold uppercase">{month}</span>
            <span className="block text-xl font-bold">{day}</span>
          </div>
          <div>
            <h4 className="font-bold">Event Date</h4>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formattedEventDate}</span>
              <span className="mx-1">•</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{concert.time}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Seat Availability */}
        <div className="mb-6">
          {remainingSeats > 0 ? (
            <div className="flex justify-between items-center">
              <div className={`${isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'} border rounded-full px-4 py-1 inline-flex items-center`}>
                <Ticket className="h-4 w-4 mr-2" />
                <span className="font-medium text-sm">{isLowStock ? 'Selling Fast!' : 'Tickets Available'}</span>
              </div>
              <div className="text-sm text-gray-700">{remainingSeats.toLocaleString()} seats left</div>
            </div>
          ) : (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-full px-4 py-1 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="font-medium">Sold Out</span>
            </div>
          )}
        </div>

        {/* Render sections only if not sold out */}
        {remainingSeats > 0 ? (
          <div className="space-y-6">
            {/* Price Additions (Tier, Quantity) */}
            <PriceAdditions />

            {/* Discounts Section (conditionally rendered based on auth status) */}
            {sessionStatus === 'authenticated' && <PriceDiscounts />}

            {/* Login Prompt */}
            {sessionStatus === 'unauthenticated' && selectedTier && (
              <div className="text-sm text-center text-gray-600 bg-slate-50 p-3 rounded-md border border-slate-200">
                <a href="/api/auth/signin" className="text-primary-600 hover:underline font-medium">Sign in</a> to use coupons or points.
              </div>
            )}
            {sessionStatus === 'loading' && selectedTier && (
              <div className="text-sm text-center text-gray-500 flex items-center justify-center py-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking login status...</div>
            )}

            {/* Price Summary */}
            {selectedTier && currentTierPrice > 0 ? (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Summary</h3>
                {/* Base Price */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Base Price ({quantity} × {formatCurrency(currentTierPrice)})</span>
                  <span>{formatCurrency(priceBreakdown.basePrice)}</span>
                </div>
                {/* Coupon Discount */}
                {priceBreakdown.couponDiscount > 0 && selectedCouponDetails && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon ({selectedCouponDetails.code})</span>
                    <span>-{formatCurrency(priceBreakdown.couponDiscount)}</span>
                  </div>
                )}
                {/* Promotion Discount */}
                {priceBreakdown.promotionDiscount > 0 && appliedPromotion && (
                   <div className="flex justify-between text-sm text-green-600">
                    <span>Promotion ({appliedPromotion.code})</span>
                    <span>-{formatCurrency(priceBreakdown.promotionDiscount)}</span>
                  </div>
                )}
                {/* Points Discount */}
                {priceBreakdown.pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Points Used ({priceBreakdown.pointsDiscount.toLocaleString()})</span>
                    <span>-{formatCurrency(priceBreakdown.pointsDiscount)}</span>
                  </div>
                )}
                {/* Subtotal */}
                 { (priceBreakdown.couponDiscount > 0 || priceBreakdown.promotionDiscount > 0 || priceBreakdown.pointsDiscount > 0) && (
                     <div className="flex justify-between text-sm text-gray-700 pt-1 border-t border-slate-200/60 mt-1">
                        <span>Subtotal</span>
                        <span>{formatCurrency(priceBreakdown.subtotalBeforeTax)}</span>
                    </div>
                 )}
                {/* Tax */}
                {priceBreakdown.taxAmount > 0 && (
                   <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax ({taxRate * 100}%)</span> {/* Display tax rate */}
                        <span>{formatCurrency(priceBreakdown.taxAmount)}</span>
                    </div>
                )}
                {/* Final Price */}
                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center">
                  <span className="font-semibold text-gray-800 text-lg">Total</span>
                  <div className="text-2xl font-bold text-primary-700">
                    {formatCurrency(priceBreakdown.finalPrice)}
                  </div>
                </div>
              </div>
            ) : (
                selectedTier && currentTierPrice <= 0 ? (
                     <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center text-yellow-700">
                        Selected ticket tier is not available or has no price defined.
                    </div>
                ) : (
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center text-gray-500">
                        Select a ticket type to see the price.
                    </div>
                )
            )}

            {/* Checkout Button */}
            {sessionStatus === 'authenticated' ? (
      <Button
        className="cursor-pointer w-full py-3 text-lg bg-secondary-600 hover:bg-secondary-700 transition-all shadow-lg shadow-secondary-500/20 group disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
        disabled={isCheckoutDisabled}
        onClick={handlePurchase}
        title={getCheckoutButtonTitle()}
      >
        <ShoppingCart className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
        REVIEW & CHECKOUT
      </Button>
    ) : (
      <Button
        className="cursor-pointer w-full py-3 text-lg bg-primary-600 hover:bg-secondary-700 transition-all shadow-lg shadow-primary-500/20 group relative"
        onClick={() => router.push('/auth/signin')}
        title="Log in to purchase tickets"
      >
        <LogIn className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
        LOG IN TO PURCHASE
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white opacity-0 group-hover:opacity-30 transition-opacity"></span>
      </Button>
    )}
            {/* Low Stock Warning */}
            {isLowStock && !isCheckoutDisabled && (
              <p className="text-amber-600 text-sm text-center flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-1" /> Hurry! Tickets are selling fast
              </p>
            )}
          </div>
        ) : (
             // Message when sold out but before the main sold out banner
             <div className="text-center text-gray-600 mt-6">
                 Tickets for this event are currently sold out.
             </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-xs text-center text-gray-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Secure payment • 100% guarantee
        </div>
      </div>
    </div>
  );
};


// Waps the layout with the provider
export default function TicketPurchaseBox({ concert }: { concert: ConcertInfo }) {
   // Add a key based on concert ID to ensure context resets if the concert changes
   return (
       <TicketPurchaseProvider key={concert.id} concertData={concert}>
          <TicketPurchaseLayout />
       </TicketPurchaseProvider>
   )
}