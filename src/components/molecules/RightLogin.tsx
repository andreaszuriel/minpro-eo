"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { MagicLinkForm } from "@/components/atoms/MagicLinkForm";
import { CredentialsLoginForm } from "@/components/atoms/CredentialsLoginForm";
import { GoogleAuthForm } from "@/components/atoms/GoogleAuthForm";
import { SignupForm } from "@/components/atoms/SignupForm"; 
import { useState } from "react";

interface AuthPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RightLogin({ activeTab, setActiveTab }: AuthPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  };

  const handleTabChange = (tab: string) => {
    if (!isLoading) { // Prevent switching tabs while an action is in progress
      setError(null); // Clear error when switching tabs
      setActiveTab(tab);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Tabs
        defaultValue="login"
        value={activeTab}
        // Use the handler to clear errors on tab change
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Hidden TabsList */}
        <TabsList className="hidden">
          <TabsTrigger value="login">Log In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {/* --- Login Tab --- */}
          {activeTab === "login" && (
            <TabsContent value="login" asChild>
              <motion.div key="login" {...fadeAnimation} className="mt-0 space-y-6">
                <h2 className="text-3xl font-display font-bold text-center text-black">
                  Log In
                </h2>

                {error && (
                  <p className="text-red-500 text-center text-sm bg-red-100 p-2 rounded">{error}</p>
                )}

                {/* Pass down state setters */}
                <CredentialsLoginForm
                  setError={setError}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <span className="relative bg-white px-2 text-sm text-gray-500">
                    Or, sign in with
                  </span>
                </div>

                <MagicLinkForm />
                <GoogleAuthForm />

                <p className="text-center text-sm text-black">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => handleTabChange("signup")} // Use handler
                    className="text-primary-600 hover:text-secondary-500 font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    Sign up
                  </button>
                </p>
              </motion.div>
            </TabsContent>
          )}

          {/* --- Signup Tab --- */}
          {activeTab === "signup" && (
            <TabsContent value="signup" asChild>
              <motion.div key="signup" {...fadeAnimation} className="mt-0 space-y-6">
                <h2 className="text-3xl font-display font-bold text-center text-black">
                  Sign Up
                </h2>

                {error && (
                  <p className="text-red-500 text-center text-sm bg-red-100 p-2 rounded">{error}</p>
                )}

                 <SignupForm
                   setError={setError}
                   isLoading={isLoading}
                   setIsLoading={setIsLoading}
                 />


                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <span className="relative bg-white px-2 text-sm text-gray-500">
                    Or, sign up with
                  </span>
                </div>

                {/* Google Sign Up */}
                <GoogleAuthForm />

                <p className="text-xs text-center text-gray-500 px-4">
                  By clicking "Sign up", you agree to our Terms & Conditions
                  and have read the Privacy Policy.
                </p>

                <p className="text-center text-sm text-black">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleTabChange("login")} // Use handler
                    className="text-primary-600 hover:text-secondary-500 font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    Log In
                  </button>
                </p>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}