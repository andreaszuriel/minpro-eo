"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react"; 

interface CredentialsLoginFormProps {
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function CredentialsLoginForm({ setError, isLoading, setIsLoading }: CredentialsLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false
      });
      
      if (response?.error) {
        setError(response.error);
        setIsLoading(false);
      } else {
        // Authentication successful
        setRedirecting(true);
        
        // Force a hard navigation to refresh the session
        window.location.href = "/auth/verify-signin";
        
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit(formData);
    }} className="space-y-4">
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
          disabled={isLoading || redirecting}
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
          disabled={isLoading || redirecting}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <motion.div whileHover={{ scale: (isLoading || redirecting) ? 1 : 1.05 }} whileTap={{ scale: (isLoading || redirecting) ? 1 : 0.95 }}>
        <Button
          type="submit"
          className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300"
          disabled={isLoading || redirecting}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : redirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Success! Redirecting...
            </>
          ) : (
            "Sign In with Email"
          )}
        </Button>
      </motion.div>
    </form>
  );
}