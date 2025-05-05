// src/components/atoms/CredentialsLoginForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { handleCredentialsLogin } from "@/lib/actions";

interface CredentialsLoginFormProps {
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CredentialsLoginForm({ 
  setError, 
  isLoading, 
  setIsLoading 
}: CredentialsLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      action={async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
          // Call the server action
          const result = await handleCredentialsLogin(formData);

          // Handle the result from the server action
          if (result?.error) {
            setError(result.error); // Display validation or auth errors
          } else if (result?.success && result.redirectUrl) {
            // If server action indicates success and provides URL, navigate client-side
            router.push(result.redirectUrl);
          } else {
            console.warn("Login successful but no redirect URL provided.");
            router.push("/auth/verify-signin");
          }
        } catch (error: any) {
          // Catch unexpected errors during server action execution itself
          console.error("Client-side Login Submit Error:", error);
          setError("An unexpected error occurred during login.");
        } finally {
          if (!router) setIsLoading(false); // Stop loading if not redirecting
        }
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label htmlFor="credentialsEmail" className="text-sm font-medium text-gray-700 flex items-center">
          <Mail className="h-4 w-4 mr-2 text-primary-500" />
          Email
        </label>
        <div className={`relative transition-all duration-300 ${
          focused === 'email' ? 'scale-[1.02]' : ''
        }`}>
          <Input
            id="credentialsEmail"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full text-black border-gray-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
            required
            disabled={isLoading}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="credentialsPassword" className="text-sm font-medium text-gray-700 flex items-center">
          <Lock className="h-4 w-4 mr-2 text-primary-500" />
          Password
        </label>
        <div className={`relative transition-all duration-300 ${
          focused === 'password' ? 'scale-[1.02]' : ''
        }`}>
          <Input
            id="credentialsPassword"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full text-black border-gray-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500"
            required
            disabled={isLoading}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
          />
        </div>
      </div>

      <motion.div 
        whileHover={{ scale: isLoading ? 1 : 1.02 }} 
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="mt-6"
      >
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-secondary-600 hover:to-secondary-700 text-white font-medium py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              Sign In with Email
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}