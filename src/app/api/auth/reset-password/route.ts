import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/utils/password";
import crypto from 'crypto';
import { Prisma } from "@prisma/client";
import { EmailService } from "@/services/email.service";
import { z } from 'zod';
import { passwordValidation } from "@/lib/validation/validation.schema";

// Create a specific schema for password reset with token
const passwordResetWithTokenSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordValidation, // Use the base password validation directly
  confirmPassword: z.string().min(1, "Password confirmation is required")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Validate request body with Zod
        const validationResult = passwordResetWithTokenSchema.safeParse(body);
        
        if (!validationResult.success) {
          // Format Zod errors for response
          const formattedErrors = validationResult.error.format();
          return NextResponse.json({ 
            message: "Validation failed", 
            errors: formattedErrors 
          }, { status: 400 });
        }
        
        // Extract validated data - now properly typed after Zod validation
        const { token, newPassword } = validationResult.data;

        // Hash the token for comparison with stored token
        const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');

        const tokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token: hashedToken }
        });

        // Check if token exists and hasn't expired
        if (!tokenRecord || tokenRecord.expires < new Date()) {
             console.log(`Invalid or expired password reset token attempted: ${token.substring(0,5)}...`);
             return NextResponse.json({ 
               message: "Invalid or expired password reset link. Please request a new one." 
             }, { status: 400 });
        }

        const userId = tokenRecord.userId; 

        const hashedPassword = await saltAndHashPassword(newPassword);

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });
            
            await tx.passwordResetToken.delete({
                where: { id: tokenRecord.id }
            });
        });

        console.log(`Password successfully reset for user ID: ${userId}`);

        // Fetch only the necessary user details for the confirmation email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true }
        });

        if (user) {
            try {
                await EmailService.sendPasswordChangeConfirmation(user);
                console.log(`Password change confirmation email sent to ${user.email}`);
            } catch (emailError) {
                console.error(`Failed to send password change confirmation email to ${user.email}:`, emailError);
                // Continue with success response since the password was reset successfully
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
        
        return NextResponse.json({ 
          message: "An error occurred while resetting your password." 
        }, { status: 500 });
    }
}