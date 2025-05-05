"use client";

import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema for the forgot password form
const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  confirmEmail: z.string().min(1, "Email confirmation is required")
}).refine(data => data.email === data.confirmEmail, {
  message: "Emails do not match",
  path: ["confirmEmail"]
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to process your request");
      }

      // Show success message
      setSuccess(true);
      reset(); // Clear the form
    } catch (error) {
      console.error("Forgot password error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-display font-bold text-center text-black mb-6">
          Forgot Password
        </h1>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800">
              <p className="font-medium">Password reset email sent!</p>
              <p className="text-sm mt-1">
                If an account with this email exists, you will receive an email with instructions to reset your password.
              </p>
            </div>
            <div className="text-center mt-4">
              <Link 
                href="/auth/login" 
                className="text-primary-600 hover:text-secondary-500 font-medium transition-colors duration-300"
              >
                Return to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                className="text-black mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700">
                Confirm Email
              </label>
              <input
                id="confirmEmail"
                type="email"
                placeholder="Confirm your email"
                {...register("confirmEmail")}
                className="text-black mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={isLoading}
              />
              {errors.confirmEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmEmail.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Send Reset Link"}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link 
                href="/auth/login" 
                className="text-primary-600 hover:text-secondary-500 text-sm font-medium transition-colors duration-300"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}