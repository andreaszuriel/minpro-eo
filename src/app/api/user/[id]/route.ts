import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DiscountType, Prisma, UserRole } from '@prisma/client';

// Define expected output structure 
interface PointsData {
    currentBalance: number;
    nextExpiration?: string | null; 
}

interface CouponData {
    id: number;
    code: string;
    discount: number;
    discountType: DiscountType;
    expiresAt: string; // ISO String
    isReferral: boolean;
}

interface UserProfileResponse {
    id: string;
    name: string | null;
    email?: string;
    createdAt: string; // ISO String
    role: UserRole;
    image: string | null;
    referralCode?: string | null;
    isAdmin?: boolean;
    pointsData: PointsData | null;
    couponsData: CouponData[];
}


export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const { id } = context.params;

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const session = await auth();
        const isOwner = session?.user?.id === id;
        const isAdmin = session?.user?.isAdmin === true;

        // --- Fetch Base User Data ---
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                createdAt: true,
                role: true,
                image: true,
                // Select sensitive fields only if authorized
                email: isOwner || isAdmin,
                referralCode: isOwner || isAdmin,
                isAdmin: isOwner || isAdmin,
                points: isOwner || isAdmin, // Select points only if authorized
            },
        });

        if (!user) {
            console.log(`User ${id} not found.`);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Initialize response structure
        let responseData: UserProfileResponse = {
            id: user.id,
            name: user.name,
            createdAt: user.createdAt.toISOString(),
            role: user.role,
            image: user.image,
            email: user.email ?? undefined, // Use ?? for null/undefined
            referralCode: user.referralCode ?? undefined,
            isAdmin: user.isAdmin ?? false,
            pointsData: null, // Initialize as null
            couponsData: [],  // Initialize as empty array
        };


        // --- If Owner or Admin, Fetch and Format Points & Coupons ---
        if (isOwner || isAdmin) {
            console.log(`Fetching points/coupons for user ${id} (Owner: ${isOwner}, Admin: ${isAdmin})`);

            // 1. Format Points Data 
            responseData.pointsData = {
                currentBalance: user.points ?? 0,
            };

            // Get next point expiration date (if any points exist)
            if (user.points > 0) {
                const nextExpiringPoints = await prisma.pointTransaction.findFirst({
                    where: {
                        userId: id,
                        isExpired: false,
                        expiresAt: { gt: new Date() },
                        points: { gt: 0 } // Only positive points (ignore redeemed/negative)
                    },
                    orderBy: { expiresAt: 'asc' },
                    select: { expiresAt: true }
                });

                if (nextExpiringPoints) {
                    responseData.pointsData.nextExpiration = nextExpiringPoints.expiresAt.toISOString();
                }
            }

            // 2. Fetch *Active and Unused* Coupons
            const activeCoupons = await prisma.coupon.findMany({
                where: {
                    userId: id,
                    expiresAt: { gte: new Date() },
                    isUsed: false, // Explicitly fetch only unused coupons
                },
                select: {
                    id: true,
                    code: true,
                    discount: true,
                    discountType: true,
                    expiresAt: true,
                    isReferral: true,
                },
                orderBy: { expiresAt: 'asc' },
            });

            // Format coupons
            responseData.couponsData = activeCoupons.map(coupon => ({
                id: coupon.id,
                code: coupon.code,
                expiresAt: coupon.expiresAt.toISOString(),
                discount: coupon.discount,
                discountType: coupon.discountType,
                isReferral: coupon.isReferral,
            }));

        } else {
            console.log(`Fetching public data only for user ${id}`);
            // pointsData remains null, couponsData remains []
        }

        console.log(`Returning data for user ${id}:`, JSON.stringify(responseData)); // Log the final data
        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Error fetching user ${context?.params?.id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
           console.error("Prisma Error Code:", error.code);
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}