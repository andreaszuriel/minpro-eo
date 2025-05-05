'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { Loader2, Mail, AlertTriangle, CircleCheck, KeyRound } from 'lucide-react';
import { z } from "zod";
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

// Type for validation errors
type ValidationErrors = {
  [key: string]: string | string[] | ValidationErrors;
};

// Helper function to extract error messages
const extractErrorMessages = (errors: ValidationErrors): string[] => {
  let messages: string[] = [];
  
  Object.entries(errors).forEach(([key, value]) => {
    if (key === '_errors' && Array.isArray(value)) {
      messages = [...messages, ...value];
    } else if (typeof value === 'object' && value !== null) {
      messages = [...messages, ...extractErrorMessages(value as ValidationErrors)];
    }
  });
  
  return messages;
};

function ForgotPasswordContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    setError(null);
    setValidationErrors([]);
    
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
        // Handle validation errors separately
        if (result.errors) {
          const errorMessages = extractErrorMessages(result.errors);
          setValidationErrors(errorMessages);
          toast.error("Validation Error", { 
              description: errorMessages[0] || "Please check your inputs." 
          });
          throw new Error("Validation failed");
        }
        
        throw new Error(result.message || "Failed to process your request");
      }

      // Show success message
      setSuccess(true);
      toast.success("Email Sent", { 
        description: "If an account exists, you'll receive reset instructions." 
      });
      reset(); // Clear the form
    } catch (error) {
      // Only set general error if it's not a validation error
      if (validationErrors.length === 0) {
        const message = error instanceof Error ? error.message : "An error occurred. Please try again.";
        setError(message);
        toast.error("Request Failed", { description: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Centering container for the page
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      {/* Card matching modal style */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5">
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h1 className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
            <KeyRound className="w-6 h-6 mr-3 text-primary-600" />
            Forgot Your Password?
          </h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {/* Form Area */}
        <div className="p-6 md:p-8">
          {/* Error Message Styling */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md mb-4 text-sm">
              <div className="flex items-center mb-1">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="font-medium">Please fix the following:</span>
              </div>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Form Error Messages */}
          {(errors.email || errors.confirmEmail) && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md mb-4 text-sm">
              <div className="flex items-center mb-1">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="font-medium">Please fix the following:</span>
              </div>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {errors.email && <li>{errors.email.message}</li>}
                {errors.confirmEmail && <li>{errors.confirmEmail.message}</li>}
              </ul>
            </div>
          )}
          
          {/* Success Message Styling */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4 text-sm flex items-start">
              <CircleCheck className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Password reset email sent!</p>
                <p className="mt-1">
                  If an account with this email exists, you will receive instructions to reset your password.
                </p>
              </div>
            </div>
          )}

          {/* Show form only if not yet successful */}
          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="flex items-center text-sm font-medium text-gray-700 mb-1"
                >
                  <Mail className="h-4 w-4 mr-2 text-primary-600" />
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter your email"
                  required
                  className="w-full text-black border-slate-300 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isLoading}
                />
              </div>

              {/* Confirm Email Input */}
              <div>
                <label
                  htmlFor="confirmEmail"
                  className="flex items-center text-sm font-medium text-gray-700 mb-1"
                >
                  <Mail className="h-4 w-4 mr-2 text-primary-600" />
                  Confirm Email Address
                </label>
                <Input
                  id="confirmEmail"
                  type="email"
                  {...register("confirmEmail")}
                  placeholder="Confirm your email"
                  required
                  className="w-full text-black border-slate-300 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full bg-secondary-600 hover:bg-secondary-700 text-white transition-all shadow-lg shadow-secondary-500/20 group py-2.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              {/* Back to Login Link */}
              <div className="text-center mt-2">
                <Button
                  variant="link"
                  onClick={() => router.push('/auth/signin')}
                  className="text-primary-600 hover:text-primary-800"
                >
                  Return to login
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center mt-6">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main page component using Suspense
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    }>
      {/* Toaster for feedback */}
      <Toaster position="top-right" richColors closeButton />
      <ForgotPasswordContent />
    </Suspense>
  );
}