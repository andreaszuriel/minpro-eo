"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { MagicLinkForm } from "@/components/atoms/MagicLinkForm";
import { CredentialsLoginForm } from "@/components/atoms/CredentialsLoginForm";
import { GoogleAuthForm } from "@/components/atoms/GoogleAuthForm";
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
        onValueChange={setActiveTab}
        className="w-full"
      >
        {/* Hidden TabsList used for programmatic control */}
        <TabsList className="hidden">
          <TabsTrigger value="login">Log In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        {/* AnimatePresence handles transitions between login/signup tabs */}
        <AnimatePresence mode="wait">
          {/* --- Login Tab --- */}
          {activeTab === "login" && (
            <TabsContent value="login" asChild>
              <motion.div key="login" {...fadeAnimation} className="mt-0 space-y-6">
                <h2 className="text-3xl font-display font-bold text-center text-black">
                  Log In
                </h2>

                {/* Display error message if present */}
                {error && (
                  <p className="text-red-500 text-center text-sm bg-red-100 p-2 rounded">{error}</p>
                )}

                {/* Credentials Login Form */}
                <CredentialsLoginForm setError={setError} isLoading={isLoading} setIsLoading={setIsLoading} />

                {/* Separator */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <span className="relative bg-white px-2 text-sm text-gray-500">
                    Or, sign in with
                  </span>
                </div>

                {/* Magic Link Form */}
                <MagicLinkForm />

                {/* Google Sign In */}
                <GoogleAuthForm />

                {/* Switch to Signup */}
                <p className="text-center text-sm text-black">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => !isLoading && setActiveTab("signup")}
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

                {/* Display error message if present */}
                {error && (
                  <p className="text-red-500 text-center text-sm bg-red-100 p-2 rounded">{error}</p>
                )}

                {/* Signup Form */}
                <form action={async (formData: FormData) => {
                  setIsLoading(true);
                  setError(null);
                  try {
                    const result = await import("@/lib/actions").then(m => m.handleSignup)(formData);
                    if (result?.error) {
                      setError(result.error);
                    }
                  } catch (err) {
                    console.error("Client-side Signup Submit Error:", err);
                    setError("An unexpected error occurred during signup.");
                  } finally {
                    setIsLoading(false);
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstName"
                        className="text-sm font-medium text-black"
                      >
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        className="w-full text-black border-gray-300 rounded-md p-2"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="lastName"
                        className="text-sm font-medium text-black"
                      >
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        className="w-full text-black border-gray-300 rounded-md p-2"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="signupEmail"
                      className="text-sm font-medium text-black"
                    >
                      Email
                    </label>
                    <input
                      id="signupEmail"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="w-full text-black border-gray-300 rounded-md p-2"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="signupPassword"
                      className="text-sm font-medium text-black"
                    >
                      Password
                    </label>
                    <input
                      id="signupPassword"
                      name="status"
                      type="password"
                      placeholder="••••••••"
                      className="w-full text-black border-gray-300 rounded-md p-2"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-black"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="w-full text-black border-gray-300 rounded-md p-2"
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
                          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing Up...
                        </>
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Separator */}
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

                {/* Switch to Login */}
                <p className="text-center text-sm text-black">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => !isLoading && setActiveTab("login")}
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