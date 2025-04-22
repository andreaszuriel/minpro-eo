"use client"; 

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { MagicLinkForm } from "@/components/atoms/MagicLinkForm"; 

interface AuthPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RightLogin({ activeTab, setActiveTab }: AuthPanelProps) {
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
        <TabsList className="hidden">
          <TabsTrigger value="login">Log In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === "login" && (
            <TabsContent value="login" asChild>
              <motion.div key="login" {...fadeAnimation} className="mt-0 space-y-6">
                <h2 className="text-3xl font-display font-bold text-center text-black">
                  Log In
                </h2>

                <MagicLinkForm />

                <div className="relative flex items-center justify-center">
                  <span className="bg-white px-2 text-sm text-gray-500">
                    Or, sign in with
                  </span>
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center bg-white border-red-100 transition-colors duration-300 w-full opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <span className="w-5 h-5 mr-2">
                      <Icon icon="cib:google" className="w-full h-full text-amber-500" />
                    </span>
                    <span className="text-black">Sign in with Google</span>
                  </Button>
                </motion.div>

                <p className="text-center text-sm text-black">
                  New here?{" "}
                  <button
                    onClick={() => setActiveTab("signup")}
                    className="text-primary-600 hover:text-secondary-500 font-medium transition-colors duration-300"
                  >
                    Sign up
                  </button>
                </p>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === "signup" && (
            <TabsContent value="signup" asChild>
              <motion.div key="signup" {...fadeAnimation} className="mt-0 space-y-6">
                <h2 className="text-3xl font-display font-bold text-center text-black">
                  Sign Up
                </h2>

                <div className="space-y-4">
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
                        placeholder="John"
                        className="w-full text-black"
                        disabled
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
                        placeholder="Doe"
                        className="w-full text-black"
                        disabled
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
                      type="email"
                      placeholder="your@email.com"
                      className="w-full text-black"
                      disabled
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
                      type="password"
                      placeholder="••••••••"
                      className="w-full text-black"
                      disabled
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
                      type="password"
                      placeholder="••••••••"
                      className="w-full text-black"
                      disabled
                    />
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Sign Up
                  </Button>
                </motion.div>

                <div className="relative flex items-center justify-center">
                  <span className="bg-white px-2 text-sm text-gray-500">
                    Or, sign up with
                  </span>
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center bg-white border-red-100 transition-colors duration-300 w-full opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <span className="w-5 h-5 mr-2">
                      <Icon icon="cib:google" className="w-full h-full text-amber-500" />
                    </span>
                    <span className="text-black">Sign up with Google</span>
                  </Button>
                </motion.div>

                <p className="text-xs text-center text-gray-500">
                  By clicking "Sign up", you agree to livewave Terms & Conditions
                  and have read the Privacy Policy.
                </p>

                <p className="text-center text-sm text-black">
                  Already have an account?{" "}
                  <button
                    onClick={() => setActiveTab("login")}
                    className="text-primary-600 hover:text-secondary-500 font-medium transition-colors duration-300"
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