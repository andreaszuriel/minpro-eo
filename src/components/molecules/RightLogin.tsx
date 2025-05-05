import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MagicLinkForm } from "@/components/atoms/MagicLinkForm";
import { CredentialsLoginForm } from "@/components/atoms/CredentialsLoginForm";
import { SignupForm } from "@/components/atoms/SignupForm";
import Link from "next/link";
import { ChevronLeft, LogIn, UserPlus, Mail, Lock, AlertCircle } from "lucide-react";

interface AuthPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function EnhancedAuthPanel({ activeTab, setActiveTab }: AuthPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (tab: string) => {
    if (!isLoading) {
      setError(null);
      setActiveTab(tab);
    }
  };

  // Shared animations
  const containerAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4 }
  };

  const tabAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">
            {activeTab === "login" ? "Welcome Back" : "Join Us"}
          </h1>
          
          {/* Visual tab indicators */}
          <div className="flex space-x-1">
            <button
              onClick={() => handleTabChange("login")}
              className={`p-1 rounded-md transition-all duration-300 ${
                activeTab === "login" 
                  ? "bg-white/20 text-white" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              disabled={isLoading}
            >
              <LogIn size={18} />
            </button>
            <button
              onClick={() => handleTabChange("signup")}
              className={`p-1 rounded-md transition-all duration-300 ${
                activeTab === "signup" 
                  ? "bg-white/20 text-white" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              disabled={isLoading}
            >
              <UserPlus size={18} />
            </button>
          </div>
        </div>
        
        <p className="mt-2 text-white/80 text-sm">
          {activeTab === "login"
            ? "Sign in to access your account and continue your journey"
            : "Create an account to get started with our services"
          }
        </p>
      </div>

      {/* Hidden TabsList */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="login">Log In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <div className="p-6">
          {/* Error Display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-start"
              >
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* Login Tab Content */}
            {activeTab === "login" && (
              <TabsContent value="login" asChild>
                <motion.div 
                  key="login" 
                  {...tabAnimation} 
                  className="space-y-5"
                >
                  <CredentialsLoginForm
                    setError={setError}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />

                  <div className="text-center">
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-primary-600 hover:text-secondary-500 text-sm font-medium transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>

                  <div className="relative flex items-center justify-center mt-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200"></span>
                    </div>
                    <span className="relative bg-white px-3 text-sm text-gray-500">
                      Or continue with
                    </span>
                  </div>

                  <MagicLinkForm />

                  <div className="text-center mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => handleTabChange("signup")}
                        className="text-primary-600 hover:text-secondary-500 font-medium transition-colors disabled:opacity-50"
                        disabled={isLoading}
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                </motion.div>
              </TabsContent>
            )}

            {/* Signup Tab Content */}
            {activeTab === "signup" && (
              <TabsContent value="signup" asChild>
                <motion.div 
                  key="signup" 
                  {...tabAnimation} 
                  className="space-y-5"
                >
                  <SignupForm
                    setError={setError}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />

                  <div className="relative flex items-center justify-center mt-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200"></span>
                    </div>
                    <span className="relative bg-white px-3 text-sm text-gray-500">
                      Or sign up with
                    </span>
                  </div>

                  <MagicLinkForm />

                  <div className="mt-4">
                    <p className="text-xs text-center text-gray-500 px-4">
                      By clicking "Sign up", you agree to our{" "}
                      <Link href="/terms" className="underline hover:text-gray-700">
                        Terms & Conditions
                      </Link>{" "}
                      and have read the{" "}
                      <Link href="/privacy" className="underline hover:text-gray-700">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>

                  <div className="text-center mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => handleTabChange("login")}
                        className="text-primary-600 hover:text-secondary-500 font-medium transition-colors disabled:opacity-50"
                        disabled={isLoading}
                      >
                        Log in
                      </button>
                    </p>
                  </div>
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </motion.div>
  );
}