import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConcertEvent } from '@/components/data/concertlist';
import { Calendar, Clock, Ticket, ShoppingCart, Plus, Minus, AlertCircle } from 'lucide-react';

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
  const [remainingSeats, setRemainingSeats] = useState<number>(concert.seats);
  const [isLowStock, setIsLowStock] = useState<boolean>(false);
  
  // Format date for the event box
  const eventDate = new Date(concert.startDate);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString('default', { month: 'short' });

  useEffect(() => {
    // Simulate low stock (for UI purposes)
    setIsLowStock(concert.seats < 50);
  }, [concert.seats]);

  // Calculate discount from original price (simulated feature)
  const hasDiscount = selectedTier && concert.price[selectedTier] > 100;
  const originalPrice = hasDiscount ? Math.round(concert.price[selectedTier] * 1.2) : null;
  
  const incrementQuantity = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <div className="w-full md:w-1/3 bg-white backdrop-blur-sm shadow-xl rounded-xl overflow-hidden order-1 md:order-2 border border-slate-200">
      {/* Event Date Header */}
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
              <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
              <span className="mx-1">•</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{concert.time}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Availability Tag */}
        <div className="mb-6">
          {concert.seats > 0 ? (
            <div className="flex justify-between items-center">
              <div className={`${
                isLowStock ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'
              } border rounded-full px-4 py-1 inline-flex items-center`}>
                <Ticket className="h-4 w-4 mr-2" />
                <span className="font-medium">
                  {isLowStock ? 'Selling Fast!' : 'Tickets Available'}
                </span>
              </div>
              
              <div className="text-sm text-gray-700">
                {remainingSeats} seats left
              </div>
            </div>
          ) : (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-full px-4 py-1 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="font-medium">Sold Out</span>
            </div>
          )}
        </div>

        {concert.seats > 0 ? (
          <div className="space-y-6">
            {/* Tier Selection */}
            <div>
              <label htmlFor="ticket-type" className="text-gray-700 block text-sm font-medium mb-1">
                Ticket Type
              </label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger id="ticket-type" className="w-full bg-slate-50 border-slate-200 text-gray-800">
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  {concert.tiers.map((tier) => (
                    <SelectItem key={tier} value={tier} className="text-gray-800">
                      <div className="flex justify-between items-center w-full">
                        <span className="ml-4 font-medium">{tier}</span>
                        <span className="ml-4 text-primary-600 font-bold">
                          {formatCurrency(concert.price[tier])}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="text-gray-700 block text-sm font-medium mb-2">
                Quantity
              </label>
              <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                <button 
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className={`p-2 ${quantity <= 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-slate-100'}`}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="flex-grow text-center font-medium text-gray-800">
                  {quantity}
                </div>
                <button 
                  onClick={incrementQuantity}
                  disabled={quantity >= 10}
                  className={`p-2 ${quantity >= 10 ? 'text-gray-300' : 'text-gray-700 hover:bg-slate-100'}`}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Price ({quantity} × {formatCurrency(concert.price[selectedTier])})</span>
                <span>{formatCurrency(concert.price[selectedTier] * quantity)}</span>
              </div>
              
              {hasDiscount && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600">Discount</span>
                  <span className="text-green-600">
                    -{formatCurrency((originalPrice! - concert.price[selectedTier]) * quantity)}
                  </span>
                </div>
              )}
              
              <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center">
                <span className="font-medium text-gray-800">Total</span>
                <div className="text-right">
                  {hasDiscount && (
                    <div className="text-xs text-gray-500 line-through">
                      {formatCurrency(originalPrice! * quantity)}
                    </div>
                  )}
                  <div className="text-2xl font-bold text-primary-700">
                    {formatCurrency(totalPrice)}
                  </div>
                </div>
              </div>
            </div>

            {/* Buy Button */}
            <Button className="w-full py-6 text-lg bg-secondary-600 hover:bg-secondary-700 transition-all shadow-lg shadow-secondary-500/20 group">
              <ShoppingCart className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              BUY TICKETS
            </Button>
            
            {/* Extra info */}
            {isLowStock && (
              <p className="text-amber-600 text-sm text-center flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Hurry! Tickets are selling fast
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sorry, This Event is Sold Out</h3>
              <p className="text-gray-600 mb-4">Join our waiting list to be notified if more tickets become available.</p>
              <Button variant="outline" className="border-primary-600 text-primary-600 hover:bg-primary-50">
                Join Waiting List
              </Button>
            </div>
          </div>
        )}
        
        {/* Security Badge */}
        <div className="mt-6 text-xs text-center text-gray-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Secure payment • 100% guarantee
        </div>
      </div>
    </div>
  );
}