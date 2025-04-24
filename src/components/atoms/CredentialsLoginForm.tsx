"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { handleCredentialsLogin } from "@/lib/actions";
import { Loader2 } from "lucide-react";

interface CredentialsLoginFormProps {
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CredentialsLoginForm({ setError, isLoading, setIsLoading }: CredentialsLoginFormProps) {
  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await handleCredentialsLogin(formData);
      
      if (result?.success && result.url) {
        window.location.href = result.url;
        return;
      }
      
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="credentialsEmail"
          className="text-sm font-medium text-black"
        >
          Email
        </label>
        <Input
          id="credentialsEmail"
          name="email"
          type="email"
          placeholder="your@email.com"
          className="w-full text-black"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="credentialsPassword"
          className="text-sm font-medium text-black"
        >
          Password
        </label>
        <Input
          id="credentialsPassword"
          name="password"
          type="password"
          placeholder="••••••••"
          className="w-full text-black"
          required
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
              Signing In...
            </>
          ) : (
            "Sign In with Email"
          )}
        </Button>
      </motion.div>
    </form>
  );
}