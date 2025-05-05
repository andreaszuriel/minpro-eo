'use client';

import { useState, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle, User, Lock, ShieldCheck } from 'lucide-react';
import { signIn } from "next-auth/react";
import { toast, Toaster } from 'sonner';

function AdminLoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true); 
    setError(null);

    try {
      const response = await signIn("credentials-signin", { 
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });

      // Check the response AFTER the await completes
      if (response?.error) {
        setIsLoading(false); // Stop loading on error
        // Map common errors to user-friendly messages
        if (response.error === "CredentialsSignin") {
          setError("Invalid email or password. Please try again.");
          toast.error("Login Failed", { description: "Invalid email or password. Please try again." });
        } else if (response.error === "AccessDenied") { 
          setError("Access Denied. You do not have admin privileges.");
          toast.error("Access Denied", { description: "You do not have admin privileges." });
        } else {
          setError(response.error || "Login failed. Please check your credentials or try again later.");
          toast.error("Login Error", { description: response.error || "Please check your credentials." });
        }
        console.error("SignIn Error:", response.error);
      } else if (response?.ok && !response.error) {
        setError(null); // Clear any previous errors
        setRedirecting(true); // Show redirecting state
        toast.success("Login Successful", { description: "Redirecting to admin dashboard..." });
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1000); // Brief delay to show success message
      } else {
        // Unexpected response structure
        setIsLoading(false); // Stop loading
        setError("An unexpected issue occurred during login. Please try again.");
        toast.error("Login Error", { description: "An unexpected issue occurred. Please try again." });
        console.warn("Unexpected SignIn Response:", response);
      }
    } catch (err: any) {
      console.error("Catch Block Error (AdminLogin):", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("System Error", { description: "An unexpected error occurred. Please try again." });
      setIsLoading(false); // Ensure loading is stopped on catch
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
            <ShieldCheck className="w-6 h-6 mr-3 text-primary-600" />
            Admin Sign In
          </h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Access the administration panel
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-5"
          >
            {/* Email Input */}
            <div>
              <label
                htmlFor="adminEmail"
                className="flex items-center text-sm font-medium text-gray-700 mb-1"
              >
                <User className="h-4 w-4 mr-2 text-primary-600" />
                Email Address
              </label>
              <Input
                id="adminEmail"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                disabled={isLoading || redirecting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-black border-slate-300 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="adminPassword"
                className="flex items-center text-sm font-medium text-gray-700 mb-1"
              >
                <Lock className="h-4 w-4 mr-2 text-primary-600" />
                Password
              </label>
              <Input
                id="adminPassword"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading || redirecting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-black border-slate-300 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || redirecting}
              className="cursor-pointer w-full bg-secondary-600 hover:bg-secondary-700 text-white transition-all shadow-lg shadow-secondary-500/20 group py-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : redirecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
                </>
              ) : (
                'Access Admin Panel'
              )}
            </Button>

            {/* Optional: Forgot Password Link */}
            <div className="text-center mt-2">
              <Button
                variant="link"
                onClick={() => window.location.href = '/auth/forgot-password'}
                className="text-primary-600 hover:text-primary-800"
                type="button"
              >
                Forgot your password?
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main page component using Suspense
export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    }>
      {/* Toaster for feedback */}
      <Toaster position="top-right" richColors closeButton />
      <AdminLoginContent />
    </Suspense>
  );
}