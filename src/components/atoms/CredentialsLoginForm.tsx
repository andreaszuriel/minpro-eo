"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { handleCredentialsLogin } from "@/lib/actions"; 

interface CredentialsLoginFormProps {
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CredentialsLoginForm({ setError, isLoading, setIsLoading }: CredentialsLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter(); 

  return (
    // Use the form's action prop to call the server action
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
          disabled={isLoading} // Only disable based on isLoading
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          disabled={isLoading} // Only disable based on isLoading
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <motion.div whileHover={{ scale: isLoading ? 1 : 1.05 }} whileTap={{ scale: isLoading ? 1 : 0.95 }}>
        <Button
          type="submit"
          className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300"
          disabled={isLoading} // Disable button only when loading
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