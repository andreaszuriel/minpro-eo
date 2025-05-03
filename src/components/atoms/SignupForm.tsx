// src/components/atoms/SignupForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { motion } from "framer-motion";
import { handleSignup } from "@/lib/actions"; 
import { Loader2 } from "lucide-react";

interface SignupFormProps {
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function SignupForm({ setError, isLoading, setIsLoading }: SignupFormProps) {

  return (
    <form
      action={async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await handleSignup(formData);
          if (result?.error) {
            setError(result.error);
          }
        } catch (err: any) {
           if (err?.digest?.startsWith('NEXT_REDIRECT')) {
                console.log("Signup redirect initiated by server action.");
                return; 
           }
           // Catch actual unexpected errors
          console.error("Client-side Signup Submit Error:", err);
          setError("An unexpected error occurred during signup.");
        } finally {
          setIsLoading(false);
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium text-black">
            First Name
          </label>
          <Input 
            id="firstName"
            name="firstName"
            placeholder="John"
            className="w-full text-black border-gray-300" 
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-black">
            Last Name
          </label>
          <Input 
            id="lastName"
            name="lastName"
            placeholder="Doe"
            className="w-full text-black border-gray-300" 
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="signupEmail" className="text-sm font-medium text-black">
          Email
        </label>
        <Input 
          id="signupEmail"
          name="email"
          type="email"
          placeholder="your@email.com"
          className="w-full text-black border-gray-300" 
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signupPassword" className="text-sm font-medium text-black">
          Password
        </label>
        <Input 
          id="signupPassword"
          name="password"
          type="password"
          placeholder="••••••••"
          className="w-full text-black border-gray-300" 
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-black">
          Confirm Password
        </label>
        <Input 
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          className="w-full text-black border-gray-300"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="referrerCode" className="text-sm font-medium text-black">
          Referral Code (optional)
        </label>
        <Input 
          id="referrerCode"
          name="referrerCode"
          type="text"
          placeholder="Enter referral code"
          className="w-full text-black border-gray-300" 
          disabled={isLoading}
        />
      </div>

      <motion.div whileHover={{ scale: isLoading ? 1 : 1.03 }} whileTap={{ scale: isLoading ? 1 : 0.97 }}>
        <Button
          type="submit"
          className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing Up...
            </>
          ) : (
            "Sign Up"
          )}
        </Button>
      </motion.div>
    </form>
  );
}