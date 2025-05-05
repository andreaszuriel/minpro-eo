import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/services/transactions.service";
import { ApiError, isValidStatus } from "@/lib/utils";
import { DiscountType, Prisma, TransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma"; 

const handleApiRoute = async (req: NextRequest, handler: () => Promise<Response | NextResponse>) => { // Adjusted return type
  try {
    return await handler();
  } catch (error) {
    console.error("API Error in /api/transactions:", error);

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors if needed
        return NextResponse.json({ error: "Database error occurred." }, { status: 500 });
    } else if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 }); // Use 400 for general input/logic errors
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

export async function GET(req: NextRequest) {
  return handleApiRoute(req, async () => {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      throw new ApiError("Missing userId", 400);
    }

    const transactions = await TransactionService.getOrganizerTransactions(userId);

    return new Response(JSON.stringify({ transactions }), { status: 200 });
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(req, async () => {
    const data = await req.json();

    // --- Basic Required Fields Validation ---
    const requiredFields = [
      'userId', 'eventId', 'ticketQuantity', 'tierType', 'basePrice', 'paymentDeadline'
      // Note: finalPrice is now calculated, not required input
    ];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) { // Check for null as well
        throw new ApiError(`Missing required field: ${field}`, 400);
      }
    }
    if (typeof data.ticketQuantity !== 'number' || data.ticketQuantity <= 0) {
        throw new ApiError('Invalid ticketQuantity', 400);
    }
     if (typeof data.basePrice !== 'number' || data.basePrice < 0) {
        throw new ApiError('Invalid basePrice', 400);
    }

    // --- Fetch User, Event, and Validate Inputs ---
    const userId = data.userId as string;
    const eventId = data.eventId as number;
    const pointsToUse = (data.pointsToUse || 0) as number;
    const couponId = data.couponId as number | undefined; // Expect coupon ID
    const promotionCode = data.promotionCode as string | undefined; 

    if (pointsToUse < 0 || !Number.isInteger(pointsToUse)) {
        throw new ApiError("Invalid pointsToUse value", 400);
    }

    // Fetch necessary data in parallel
    const [user, event] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                points: true,
                coupons: { // Fetch potentially usable coupons for validation
                    where: {
                        id: couponId, // Only fetch the specific coupon if ID is provided
                        isUsed: false,
                        expiresAt: { gte: new Date() }
                    },
                    select: { id: true, discount: true, discountType: true }
                }
            }
        }),
        prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, seats: true } // Select only needed fields
        })
    ]);

    if (!user) {
        throw new ApiError("User not found", 404);
    }
    if (!event) {
        throw new ApiError("Event not found", 404);
    }

    // --- Coupon Validation ---
    let couponDiscount = 0;
    let validatedCouponId: number | undefined = undefined;
    let selectedCoupon: { id: number; discount: number; discountType: DiscountType } | null = null;

    if (couponId) {
        selectedCoupon = user.coupons.find(c => c.id === couponId) ?? null;
        if (!selectedCoupon) {
            throw new ApiError("Invalid or unusable coupon provided", 400);
        }
        // Calculate discount
        if (selectedCoupon.discountType === 'PERCENTAGE') {
            couponDiscount = Math.floor((data.basePrice * selectedCoupon.discount) / 100);
        } else { // FIXED_AMOUNT
            couponDiscount = selectedCoupon.discount;
        }
        // Ensure discount doesn't exceed base price
        couponDiscount = Math.min(couponDiscount, data.basePrice);
        validatedCouponId = selectedCoupon.id; // Confirm the ID is valid and store it
    }

    // --- Promotion Code Validation ---
    let promotionDiscount = 0;
    let validatedPromotionId: string | undefined = undefined;
    // Find valid promotion
    if (promotionCode && promotionCode.trim() !== '') {
        const promotion = await prisma.promotion.findFirst({
            where: {
                code: promotionCode,
                eventId: eventId,
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
            },
        });

        if (!promotion) {
            throw new ApiError("Invalid or expired promotion code", 400);
        }

        if (promotion.usageLimit !== null && promotion.usageCount >= promotion.usageLimit) {
            throw new ApiError("Promotion usage limit exceeded", 400);
        }
        // Calculate discount based on promotion type
        if (promotion.discountType === 'PERCENTAGE') {
            promotionDiscount = Math.floor((data.basePrice * promotion.discount) / 100);
        } else {
            promotionDiscount = promotion.discount;
        }
        // Ensure promotion discount doesn't exceed base price  
        promotionDiscount = Math.min(promotionDiscount, data.basePrice);
        validatedPromotionId = promotion.id;
    }

    // --- Points Validation ---
    if (pointsToUse > 0) {
        if (user.points < pointsToUse) {
            throw new ApiError(`Insufficient points. Available: ${user.points}`, 400);
        }
    }

    // --- Ticket Availability Check ---
     const soldTickets = await prisma.ticket.count({ where: { eventId: event.id } });
     if (soldTickets + data.ticketQuantity > event.seats) {
       throw new ApiError("Not enough tickets available", 409); // 409 Conflict might be suitable
     }

    // --- Calculate Final Price ---
    // Apply both coupon and promotion discounts
    let finalPrice = data.basePrice - couponDiscount - promotionDiscount - pointsToUse;
    finalPrice = Math.max(0, finalPrice); // Ensure final price is not negative

    // --- Prepare Transaction Data ---
    const transactionData: Prisma.TransactionCreateInput = {
      ticketQuantity: data.ticketQuantity,
      basePrice: data.basePrice,
      finalPrice: finalPrice, // Use calculated final price
      couponDiscount: couponDiscount, // Store calculated discount
      pointsUsed: pointsToUse, // Store validated points used
      paymentDeadline: new Date(data.paymentDeadline),
      tierType: data.tierType,
      status: TransactionStatus.PENDING, // Default to PENDING, can be overridden below
      user: { connect: { id: userId } },
      event: { connect: { id: eventId } },
      // Connect coupon only if one was validated and used
      ...(validatedCouponId && { coupon: { connect: { id: validatedCouponId } } }),
      // Connect promotion only if one was validated and used
      ...(validatedPromotionId && { promotion: { connect: { id: validatedPromotionId } } }),
    };

    // Optional fields & Status Override (e.g., if payment proof submitted immediately)
    if (data.paymentProof) {
        transactionData.paymentProof = data.paymentProof;
        transactionData.status = TransactionStatus.WAITING_ADMIN; // Change status if proof provided
    }
    if (data.status && isValidStatus(data.status) && data.status !== 'PENDING') {
    }

    // --- Create Transaction via Service ---
    const transaction = await TransactionService.createTransaction(transactionData);

    // --- Return Response ---
    return NextResponse.json(transaction, { status: 201 });
  });
}