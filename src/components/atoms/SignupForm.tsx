"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { motion } from "framer-motion";
import { handleSignup } from "@/lib/actions"; 
import { Loader2, User, Mail, Lock, Ticket } from "lucide-react";
import { useState } from "react";

interface SignupFormProps {
  setError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function SignupForm({ setError, isLoading, setIsLoading }: SignupFormProps) {
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const checkPasswordMatch = () => {
    if (confirmPassword === "") return true;
    return password === confirmPassword;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (confirmPassword !== "") {
      setPasswordMatch(e.target.value === confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setPasswordMatch(e.target.value === "" || e.target.value === password);
  };

  return (
    <form
      action={async (formData: FormData) => {
        // Check if passwords match before submitting
        if (!passwordMatch) {
          setError("Passwords do not match");
          return;
        }
        
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
          <label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center">
            <User className="h-4 w-4 mr-2 text-primary-500" />
            First Name
          </label>
          <Input 
            id="firstName"
            name="firstName"
            placeholder="John"
            className="w-full text-black border-gray-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500" 
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium text-gray-700 flex items-center">
            <User className="h-4 w-4 mr-2 text-primary-500 opacity-0" />
            Last Name
          </label>
          <Input 
            id="lastName"
            name="lastName"
            placeholder="Doe"
            className="w-full text-black border-gray-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500" 
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="signupEmail" className="text-sm font-medium text-gray-700 flex items-center">
          <Mail className="h-4 w-4 mr-2 text-primary-500" />
          Email
        </label>
        <Input 
          id="signupEmail"
          name="email"
          type="email"
          placeholder="your@email.com"
          className="w-full text-black border-gray-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500" 
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signupPassword" className="text-sm font-medium text-gray-700 flex items-center">
          <Lock className="h-4 w-4 mr-2 text-primary-500" />
          Password
        </label>
        <Input 
          id="signupPassword"
          name="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="••••••••"
          className="w-full text-black border-gray-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500" 
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label 
          htmlFor="confirmPassword" 
          className={`text-sm font-medium flex items-center ${
            passwordMatch ? 'text-gray-700' : 'text-red-500'
          }`}
        >
          <Lock className={`h-4 w-4 mr-2 ${
            passwordMatch ? 'text-primary-500' : 'text-red-500'
          }`} />
          Confirm Password
          {!passwordMatch && (
            <span className="ml-2 text-xs text-red-500">
              Passwords do not match
            </span>
          )}
        </label>
        <Input 
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          placeholder="••••••••"
          className={`w-full text-black bg-slate-50 ${
            passwordMatch 
              ? 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
              : 'border-red-300 focus:ring-red-500 focus:border-red-500'
          }`}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="referrerCode" className="text-sm font-medium text-gray-700 flex items-center">
          <Ticket className="h-4 w-4 mr-2 text-primary-500" />
          Referral Code (optional)
        </label>
        <Input 
          id="referrerCode"
          name="referrerCode"
          type="text"
          placeholder="Enter referral code"
          className="w-full text-black border-gray-200 bg-slate-50 focus:ring-primary-500 focus:border-primary-500" 
          disabled={isLoading}
        />
      </div>

      <motion.div 
        whileHover={{ scale: isLoading ? 1 : 1.02 }} 
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="mt-6"
      >
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-secondary-600 hover:to-secondary-700 text-white font-medium py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          disabled={isLoading || !passwordMatch}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </motion.div>
    </form>
  );
}