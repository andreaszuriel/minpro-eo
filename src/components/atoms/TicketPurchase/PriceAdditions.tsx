import React from 'react';
import { useTicketPurchase } from '@/components/contexts/TicketPurchaseContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minus, Plus } from 'lucide-react';

export const PriceAdditions: React.FC = () => {
  const {
    concert,
    selectedTier,
    setSelectedTier,
    quantity,
    incrementQuantity,
    decrementQuantity,
    remainingSeats,
    formatCurrency,
    currentTierPrice // Get current tier price from context
  } = useTicketPurchase();

  const handleTierChange = (value: string) => {
    setSelectedTier(value);
    // No need to reset discounts here, context handles it
  };

  return (
    <div className="space-y-6">
      {/* Ticket Tier Selection */}
      <div>
        <Label htmlFor="ticket-type" className="text-gray-700 block text-sm font-medium mb-1">
          Ticket Type
        </Label>
        {concert.tiers?.length > 0 ? (
          <Select value={selectedTier} onValueChange={handleTierChange}>
            <SelectTrigger id="ticket-type" className="w-full bg-slate-50 border-slate-200 text-gray-800">
              <SelectValue placeholder="Select ticket type" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200">
              {concert.tiers.map((tier) => (
                <SelectItem key={tier} value={tier} className="text-gray-800 cursor-pointer">
                  <div className="flex justify-between items-center w-full">
                    <span>{tier}</span>
                    <span className="ml-4 text-primary-600 font-semibold">
                      {formatCurrency(concert.price?.[tier] ?? 0)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-gray-500">No ticket types available.</p>
        )}
      </div>

      {/* Quantity Selector */}
      <div>
        <Label className="text-gray-700 block text-sm font-medium mb-2">Quantity</Label>
        <div className={`flex items-center border rounded-md ${!selectedTier ? 'bg-gray-100 cursor-not-allowed' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={decrementQuantity}
            disabled={quantity <= 1 || !selectedTier}
            className={`p-2 rounded-l-md ${quantity <= 1 || !selectedTier ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500'}`}
            aria-label="Decrease quantity"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className={`flex-grow text-center font-medium px-2 ${!selectedTier ? 'text-gray-400' : 'text-gray-800'}`}>
            {selectedTier ? quantity : '-'}
          </div>
          <button
            onClick={incrementQuantity}
            disabled={!selectedTier || quantity >= 10 || quantity >= remainingSeats}
            className={`p-2 rounded-r-md ${!selectedTier || quantity >= 10 || quantity >= remainingSeats ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500'}`}
            aria-label="Increase quantity"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
         {selectedTier && quantity >= remainingSeats && remainingSeats > 0 && (
             <p className="text-xs text-red-500 mt-1">Only {remainingSeats} seat(s) remaining for this tier.</p>
         )}
         {selectedTier && quantity >= 10 && (
              <p className="text-xs text-amber-600 mt-1">Maximum 10 tickets per purchase.</p>
         )}
      </div>

      {/* Display Unit Price (Optional, but helpful) */}
      {selectedTier && currentTierPrice > 0 && (
        <div className="text-sm text-gray-600 text-right">
          Unit Price: {formatCurrency(currentTierPrice)}
        </div>
      )}
    </div>
  );
};