import { DiscountType } from '@prisma/client';

// --- Interfaces  ---
export interface CouponInfo {
  discount: number;
  discountType: DiscountType;
}

export interface PromotionInfo {
  discount: number;
  discountType: DiscountType;
}

export interface PriceCalculationInputs {
  unitPrice: number;
  quantity: number;
  coupon?: CouponInfo;
  promotion?: PromotionInfo;
  pointsToUse: number;
  taxRate: number; // As a decimal (e.g., 0.1 for 10%)
}

export interface PriceBreakdown {
  basePrice: number;
  couponDiscount: number;
  promotionDiscount: number;
  pointsDiscount: number; // Direct value reduction
  subtotalBeforeTax: number;
  taxAmount: number;
  finalPrice: number;
}

// --- Calculation Functions ---

/**
 * Calculate the base price.
 */
const calculateBasePrice = (unitPrice: number, quantity: number): number => {
  return unitPrice * quantity;
};

/**
 * Calculate discount amount, ensuring it doesn't exceed the base amount.
 */
const calculateDiscountAmount = (
  baseAmount: number,
  discountValue: number,
  discountType: DiscountType
): number => {
  let amount = 0;
  if (discountType === 'PERCENTAGE') {
    // Calculate percentage discount, round down to avoid fractional cents
    amount = Math.floor((baseAmount * discountValue) / 100);
  } else {
    // Fixed amount discount
    amount = discountValue;
  }
  // Ensure discount doesn't exceed the amount it applies to
  return Math.min(amount, baseAmount);
};

/**
 * Calculate the complete price breakdown including discounts and tax.
 */
export const calculatePriceBreakdown = (inputs: PriceCalculationInputs): PriceBreakdown => {
  const { unitPrice, quantity, coupon, promotion, pointsToUse, taxRate } = inputs;

  const basePrice = calculateBasePrice(unitPrice, quantity);

  // Calculate discounts based on the base price
  const couponDiscount = coupon
    ? calculateDiscountAmount(basePrice, coupon.discount, coupon.discountType)
    : 0;

  const promotionDiscount = promotion
    ? calculateDiscountAmount(basePrice, promotion.discount, promotion.discountType)
    : 0;

  // Points are a direct value reduction after other discounts, but capped at the remaining price.
  // First, calculate price after percentage/fixed discounts
  const priceAfterCouponAndPromo = Math.max(0, basePrice - couponDiscount - promotionDiscount);

  // Points discount cannot exceed the price remaining after other discounts, nor the base price itself.
  const pointsDiscount = Math.min(Math.max(0, pointsToUse), priceAfterCouponAndPromo);

  // Calculate subtotal before tax
  // It's base price minus *all* discounts (coupons, promo, points)
  const subtotalBeforeTax = Math.max(0, basePrice - couponDiscount - promotionDiscount - pointsDiscount);

  // Calculate tax on the subtotal
  const taxAmount = Math.round(subtotalBeforeTax * taxRate);

  // Final price is subtotal plus tax
  const finalPrice = subtotalBeforeTax + taxAmount;

  return {
    basePrice,
    couponDiscount,
    promotionDiscount,
    pointsDiscount,
    subtotalBeforeTax,
    taxAmount,
    finalPrice,
  };
};

/**
 * Validate a points input string against available points.
 * Returns the validated number of points (0 if invalid or exceeds available).
 */
export const validatePointsInput = (pointsInput: string, availablePoints: number): number => {
  const pointsInputNumber = parseInt(pointsInput.replace(/[^0-9]/g, ''), 10); // Ensure only digits are parsed

  if (isNaN(pointsInputNumber) || pointsInputNumber < 0) {
    return 0;
  }
  // Ensure user doesn't use more points than they have
  return Math.min(pointsInputNumber, availablePoints);
};