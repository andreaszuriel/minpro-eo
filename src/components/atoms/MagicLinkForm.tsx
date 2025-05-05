"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { handleMagicLinkLogin } from "@/lib/actions";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface MagicLinkFormProps {
  setError?: (error: string | null) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export function MagicLinkForm({
  setError,
  isLoading: externalIsLoading,
  setIsLoading: externalSetIsLoading
}: MagicLinkFormProps) {
  // Internal state if not provided from parent
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  // Use provided state handlers or internal ones
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const setIsLoadingState = externalSetIsLoading || setInternalIsLoading;
  const handleError = setError || ((error: string | null) => console.error(error));

  return (
    <form
      action={async (formData: FormData) => {
        setIsLoadingState(true);
        handleError(null);
        
        try {
          const result = await handleMagicLinkLogin(formData);
          
          // If we get here, it means no redirect occurred and we might have an error
          if (result && 'error' in result) {
            handleError(result.error);
            setIsLoadingState(false);
          } else {
            // This should rarely be reached due to the redirect
            console.log("Magic link process initiated");
          }
        } catch (error: any) {
          // Check if this is an intentional redirect error from Next.js
          if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            console.log("Redirecting to magic link confirmation page...");
            // Let Next.js handle the redirect
            throw error;
          }
          
          // Only handle actual errors
          console.error("Error sending magic link:", error);
          handleError("An unexpected error occurred when sending the magic link.");
          setIsLoadingState(false);
        }
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label htmlFor="magicLinkEmail" className="text-sm font-medium text-gray-700 flex items-center">
          <Mail className="h-4 w-4 mr-2 text-primary-500" />
          Email
        </label>
        <div className={`relative transition-all duration-300 ${
          focused === 'email' ? 'scale-[1.02]' : ''
        }`}>
          <Input
            id="magicLinkEmail"
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
              Sending Link...
            </>
          ) : (
            <>
              Send Magic Link
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}