import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConcertEvent } from '@/components/data/concertlist';

interface TicketPurchaseBoxProps {
  concert: ConcertEvent;
  selectedTier: string;
  setSelectedTier: (value: string) => void;
  quantity: number;
  setQuantity: (value: number) => void;
  totalPrice: number;
  formatCurrency: (amount: number) => string;
}

export default function TicketPurchaseBox({
  concert,
  selectedTier,
  setSelectedTier,
  quantity,
  setQuantity,
  totalPrice,
  formatCurrency,
}: TicketPurchaseBoxProps) {
  return (
    <div className="w-full md:w-1/3 bg-slate-100 shadow-2xl p-6 rounded-lg order-1 md:order-2">
      {/* Availability */}
      <div className="text-center mb-8">
        {concert.seats > 0 ? (
          <div className="text-green-600 font-bold text-4xl">Available</div>
        ) : (
          <div className="text-red-600 font-bold text-4xl">Sold Out</div>
        )}
      </div>

      {concert.seats > 0 ? (
        /* Ticket Selection */
        <div className="space-y-6">
          <div>
            <label htmlFor="ticket-type" className="text-black block text-sm font-medium mb-1">
              Type
            </label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger id="ticket-type" className="w-full text-black bg-slate-300">
                <SelectValue placeholder="Select ticket type" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black border border-gray-300">
                {concert.tiers.map((tier) => (
                  <SelectItem
                    key={tier}
                    value={tier}
                    className="text-black hover:bg-slate-100"
                  >
                    {tier} - {formatCurrency(concert.price[tier])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="ticket-quantity" className="text-black block text-sm font-medium mb-1">
              Quantity
            </label>
            <Select
              value={quantity.toString()}
              onValueChange={(value) => setQuantity(parseInt(value))}
            >
              <SelectTrigger id="ticket-quantity" className="text-black w-full bg-slate-300">
                <SelectValue placeholder="Select quantity" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black border border-gray-300">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((qty) => (
                  <SelectItem
                    key={qty}
                    value={qty.toString()}
                    className="text-black hover:bg-slate-100"
                  >
                    {qty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-black text-center text-2xl font-bold my-6">
            {formatCurrency(totalPrice)}
          </div>

          <Button className="w-full bg-primary-600 hover:bg-primary-700">BUY TICKETS</Button>
        </div>
      ) : (
        <div className="text-center text-gray-600 italic">Sorry, this event is sold out.</div>
      )}
    </div>
  );
}