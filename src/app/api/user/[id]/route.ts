import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from '@prisma/client';

// Define expected output structure matching frontend
interface PointsData {
    totalPoints: number;
    nextExpiration?: string | null;
}

interface CouponData {
    id: number; 
    code: string;
    expiresAt: string; // ISO String
    discount?: number;
    isReferral?: boolean;
}

interface UserProfileResponse {
    id: string;
    name: string | null;
    email?: string; 
    createdAt: string; // ISO String
    role: 'customer' | 'organizer'; 
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

        // --- Fetch Base User Data (Common Fields) ---
        const baseUser = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                createdAt: true,
                role: true,
                image: true,
                email: isOwner || isAdmin, // Select email only if owner/admin
                referralCode: isOwner || isAdmin, // Select ref code only if owner/admin
                isAdmin: isOwner || isAdmin, // Select admin status only if owner/admin
            },
        });

        if (!baseUser) {
            console.log(`User ${id} not found.`);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Initialize response structure
        let responseData: UserProfileResponse = {
            id: baseUser.id,
            name: baseUser.name,
            createdAt: baseUser.createdAt.toISOString(), // Ensure ISO string
            role: baseUser.role,
            image: baseUser.image,
            email: baseUser.email || undefined,
            referralCode: baseUser.referralCode || undefined,
            isAdmin: baseUser.isAdmin || false,
            pointsData: null,
            couponsData: [],
        };


        // --- If Owner or Admin, Fetch and Process Points & Coupons ---
        if (isOwner || isAdmin) {
            console.log(`Fetching points/coupons for user ${id} (Owner: ${isOwner}, Admin: ${isAdmin})`);

            // 1. Fetch Active Point Transactions
            const activePoints = await prisma.pointTransaction.findMany({
                where: {
                    userId: id,
                    expiresAt: { gte: new Date() },
                    isExpired: false, // Good to double-check
                },
                select: {
                    points: true,
                    expiresAt: true,
                },
                orderBy: {
                    expiresAt: 'asc', // Get earliest expiration first
                },
            });

            let totalPoints = 0;
            let nextExpiration: string | null = null;
            if (activePoints.length > 0) {
                totalPoints = activePoints.reduce((sum, pt) => sum + pt.points, 0);
                nextExpiration = activePoints[0].expiresAt.toISOString(); // Get first expiration date
            }

            responseData.pointsData = {
                totalPoints: totalPoints,
                nextExpiration: nextExpiration,
            };


            // 2. Fetch Active Coupons
            const activeCoupons = await prisma.coupon.findMany({
                where: {
                    userId: id,
                    expiresAt: { gte: new Date() },
                    // Add isUsed: false if applicable
                },
                select: {
                    id: true,
                    code: true,
                    discount: true, 
                    expiresAt: true,
                    isReferral: true, 
                },
                orderBy: { expiresAt: 'asc' },
            });

            // Format coupons to match frontend expectation (CouponData interface)
            responseData.couponsData = activeCoupons.map(coupon => ({
                id: coupon.id,
                code: coupon.code,
                expiresAt: coupon.expiresAt.toISOString(), // Ensure ISO string
                discount: coupon.discount,
                isReferral: coupon.isReferral,
            }));

        } else {
            console.log(`Fetching public data only for user ${id}`);
            // pointsData is already null, couponsData is already []
        }

        console.log(`Returning data for user ${id}:`, responseData);
        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Error fetching user ${context?.params?.id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
           // Log specific Prisma errors
           console.error("Prisma Error Code:", error.code);
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}