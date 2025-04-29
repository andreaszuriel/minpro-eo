import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from 'nanoid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === "IDR") {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Create a custom nanoid with only uppercase letters and numbers, avoiding similar-looking characters
export function generateUniqueSerialCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nanoid = customAlphabet(alphabet, 12);
  return `TIX-${nanoid()}`;
}

export function isValidStatus(status: string): status is 'PENDING' | 'WAITING_ADMIN' | 'PAID' | 'EXPIRED' | 'CANCELED' {
  return ['PENDING', 'WAITING_ADMIN', 'PAID', 'EXPIRED', 'CANCELED'].includes(status);
}

export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}