import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/services/email.service"; 
import crypto from 'crypto';
import { forgotPasswordSchema } from "@/lib/validation/validation.schema";

// Function to generate a secure token
function generateResetToken(): { rawToken: string; hashedToken: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Hash the token before storing it in the DB
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, hashedToken };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate with Zod
        const validationResult = forgotPasswordSchema.safeParse(body);
        
        if (!validationResult.success) {
            // Format Zod errors
            const formattedErrors = validationResult.error.format();
            return NextResponse.json({ 
                message: "Validation failed", 
                errors: formattedErrors 
            }, { status: 400 });
        }

        const { email } = validationResult.data;
        const lowerCaseEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: lowerCaseEmail },
            select: { id: true, name: true, email: true }
        });

        // For security reasons, we don't reveal if the email exists or not
        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email.substring(0,3)}...`);
            return NextResponse.json({ 
                message: "If an account with that email exists, a password reset link has been sent." 
            });
        }

        // User exists, proceed with token generation
        const { rawToken, hashedToken } = generateResetToken();
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour from now

        // Check if a token already exists for this user and delete it
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id }
        });

        // Store the HASHED token in the database
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                expires: expires,
            }
        });

        // Construct the reset URL (using the RAW token)
        const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${rawToken}`;

        // Send the email
        try {
            await EmailService.sendPasswordResetEmail(user, resetUrl);
            console.log(`Password reset email sent to ${user.email}`);
        } catch (emailError) {
            console.error(`Failed to send password reset email to ${user.email}:`, emailError);
            // Don't expose email errors to the client
        }

        return NextResponse.json({ 
            message: "If an account with that email exists, a password reset link has been sent." 
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        // Generic error for internal issues
        return NextResponse.json({ 
            message: "An error occurred. Please try again later." 
        }, { status: 500 });
    }
}