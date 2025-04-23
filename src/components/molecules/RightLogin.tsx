"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react"; // Ensure you have @iconify/react installed
import { MagicLinkForm } from "@/components/atoms/MagicLinkForm"; // Adjust path if needed
import { handleCredentialsLogin, handleSignup } from "@/lib/actions"; // Adjust path if needed
import { useState } from "react";
import { Loader2 } from "lucide-react"; // For loading spinner

interface AuthPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RightLogin({ activeTab, setActiveTab }: AuthPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // State for loading indicators

  const fadeAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  };

  // --- Updated Submit Handler for Credentials Login ---
  const handleCredentialsSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the server action
      const result = await handleCredentialsLogin(formData);
      
      if (result?.success && result.url) {
        // Handle successful login - use router for client-side navigation
        window.location.href = result.url;
        return;
      }
      
      // If there's an error, display it
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (error: any) {
      // Handle unexpected errors
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };
  // --- Updated Submit Handler for Signup ---
  const handleSignupSubmit = async (formData: FormData) => {
    setIsLoading(true); // Start loading
    setError(null);     // Clear previous errors
    try {
      // Call the server action
      const result = await handleSignup(formData);

      // Check if the server action returned an error object
      if (result?.error) {
        setError(result.error);
      }
      // If successful signup AND auto-signin, the redirect will happen automatically.

    } catch (err) {
      // Catch unexpected errors
      console.error("Client-side Signup Submit Error:", err);
      setError("An unexpected error occurred during signup.");
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
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
                <form action={handleCredentialsSubmit} className="space-y-4">
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
                      disabled={isLoading} // Disable input when loading
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
                      disabled={isLoading} // Disable input when loading
                    />
                  </div>
                  <motion.div whileHover={{ scale: isLoading ? 1 : 1.03 }} whileTap={{ scale: isLoading ? 1 : 0.97 }}>
                    <Button
                      type="submit"
                      className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300"
                      disabled={isLoading} // Disable button when loading
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

                {/* Separator */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <span className="relative bg-white px-2 text-sm text-gray-500">
                    Or, sign in with
                  </span>
                </div>

                {/* Magic Link Form Component */}
                <MagicLinkForm />

                {/* Google Sign In (Disabled Example) */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center bg-white border-gray-300 hover:bg-gray-50 transition-colors duration-300 w-full opacity-50 cursor-not-allowed"
                    disabled // Keep disabled or implement Google Sign-In
                  >
                    <span className="w-5 h-5 mr-2">
                      <Icon icon="cib:google" className="w-full h-full text-red-500" />
                    </span>
                    <span className="text-black">Sign in with Google</span>
                  </Button>
                </motion.div>

                {/* Switch to Signup */}
                <p className="text-center text-sm text-black">
                  New here?{" "}
                  <button
                    type="button" // Important: prevent form submission
                    onClick={() => !isLoading && setActiveTab("signup")} // Prevent switch while loading
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
                <form action={handleSignupSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstName"
                        className="text-sm font-medium text-black"
                      >
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        className="w-full text-black"
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
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        className="w-full text-black"
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
                    <Input
                      id="signupEmail"
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
                      htmlFor="signupPassword"
                      className="text-sm font-medium text-black"
                    >
                      Password
                    </label>
                    <Input
                      id="signupPassword"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full text-black"
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
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
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
                      disabled={isLoading} // Disable button when loading
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

                {/* Separator */}
                <div className="relative flex items-center justify-center">
                   <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <span className="relative bg-white px-2 text-sm text-gray-500">
                    Or, sign up with
                  </span>
                </div>

                 {/* Google Sign Up (Disabled Example) */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center bg-white border-gray-300 hover:bg-gray-50 transition-colors duration-300 w-full opacity-50 cursor-not-allowed"
                    disabled // Keep disabled or implement Google Sign-In/Up
                  >
                    <span className="w-5 h-5 mr-2">
                      <Icon icon="cib:google" className="w-full h-full text-red-500" />
                    </span>
                    <span className="text-black">Sign up with Google</span>
                  </Button>
                </motion.div>

                <p className="text-xs text-center text-gray-500 px-4">
                  By clicking "Sign up", you agree to our Terms & Conditions
                  and have read the Privacy Policy. {/* Link these ideally */}
                </p>

                 {/* Switch to Login */}
                <p className="text-center text-sm text-black">
                  Already have an account?{" "}
                  <button
                    type="button" // Important: prevent form submission
                    onClick={() => !isLoading && setActiveTab("login")} // Prevent switch while loading
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