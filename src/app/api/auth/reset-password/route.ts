import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/utils/password";
import crypto from 'crypto';
import { Prisma } from "@prisma/client";
import { EmailService } from "@/services/email.service";

export async function POST(request: NextRequest) {
    try {
        const { token, newPassword, confirmPassword } = await request.json();

        // Basic validation 
        if (!token || typeof token !== 'string') { /* ... */ }
        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) { /* ... */ }
        if (newPassword !== confirmPassword) { /* ... */ }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const tokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token: hashedToken }
        });

        // Check if token exists and hasn't expired
        if (!tokenRecord || tokenRecord.expires < new Date()) {
             console.log(`Invalid or expired password reset token attempted: ${token.substring(0,5)}...`);
             // Explicitly return here to ensure tokenRecord is non-null below
            return NextResponse.json({ message: "Invalid or expired password reset link." }, { status: 400 });
        }

        const userId = tokenRecord.userId; 

        const hashedPassword = await saltAndHashPassword(newPassword);

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId }, // userId is guaranteed non-null
                data: { password: hashedPassword }
            });
            await tx.passwordResetToken.delete({
                where: { id: tokenRecord.id } // tokenRecord is guaranteed non-null
            });
        });

        console.log(`Password successfully reset for user ID: ${userId}`);

        // Fetch only the necessary user details for the confirmation email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true } // Fetch only what the email function needs
        });

        if (user) {
            try {
                // Pass the partial user object - types now match the updated EmailService function
                await EmailService.sendPasswordChangeConfirmation(user);
                console.log(`Password change confirmation email sent to ${user.email}`);
            } catch (emailError) {
                console.error(`Failed to send password change confirmation email to ${user.email}:`, emailError);
            }
        } else {
            console.error(`Could not find user with ID ${userId} after password reset to send confirmation email.`);
        }

        return NextResponse.json({ message: "Password has been reset successfully." });

    } catch (error) {
        console.error("Reset password error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json({ message: "Invalid or expired password reset link." }, { status: 400 });
        }
        return NextResponse.json({ message: "An error occurred while resetting your password." }, { status: 500 });
    }
}