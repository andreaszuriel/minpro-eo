"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music, 
  Ticket, 
  DollarSign, 
  Users, 
  BarChart3 
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

// Interface for BenefitItem props
interface BenefitItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

// BenefitItem component
const BenefitItem = ({ icon: Icon, title, description }: BenefitItemProps) => (
  <motion.div 
    className="flex items-start space-x-3"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Icon className="w-6 h-6 mt-1 text-primary-700 flex-shrink-0" />
    <div>
      <p className="font-bold">{title}</p>
      <p className="text-gray-300">{description}</p>
    </div>
  </motion.div>
);

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");

  const benefits = [
    {
      icon: Ticket,
      title: "Seamless ticketing, start to stage",
      description: "Effortless tools to create, promote, and sell tickets in minutes."
    },
    {
      icon: DollarSign,
      title: "Transparent pricing, no hidden fees",
      description: "Keep more of your earnings — and your fans happy too."
    },
    {
      icon: Users,
      title: "Built for artists & organizers",
      description: "Whether indie or major, our tools scale with your vision."
    },
    {
      icon: BarChart3,
      title: "Real-time insights & audience reach",
      description: "Track engagement, ticket sales, and grow your community."
    }
  ];

  const socialProviders = [
    {
      name: "Google",
      icon: "cib:google",
    },
    {
      name: "Facebook",
      icon: "cib:facebook",
    },
    {
      name: "Apple",
      icon: "cib:apple",
    }
  ];

  const fadeAnimation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Background and Content */}
      <div className="relative w-full md:w-1/2 h-[50vh] md:h-screen">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://i.pinimg.com/1200x/fc/4b/79/fc4b7979b5310698b585bfce4ead1a4a.jpg" 
            alt="Concert atmosphere with crowd and stage lights"
            priority 
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover opacity-70"
          />
        </div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black opacity-40 z-10"></div>

        {/* Left Side Content Container */}
        <div className="relative z-20 h-full flex items-center">
          {/* Brand and Benefits */}
          <div className="px-8 md:px-12 py-8 text-white max-w-xl">
            {/* Brand Name */}
            <motion.div 
              className="flex items-center mb-10"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Music className="w-8 h-8 mr-3 text-primary-700" />
              <h1 className="text-5xl font-bold font-brand">livewave</h1>
            </motion.div>

            {/* Benefits */}
            <div className="space-y-6">
              <motion.h2 
                className="text-xl font-display font-semibold mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Why choose Livewave for your concert experience?
              </motion.h2>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <BenefitItem 
                    key={index}
                    icon={benefit.icon}
                    title={benefit.title}
                    description={benefit.description}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Form Section */}
      <div className="w-full md:w-1/2 bg-slate-200 flex items-center justify-center p-4 min-h-[50vh] md:min-h-screen">
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
                  <motion.div 
                    key="login"
                    {...fadeAnimation}
                    className="mt-0 space-y-6"
                  >
                    <h2 className="text-3xl font-display font-bold text-center text-black">Log In</h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-black">
                          Email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          className="w-full text-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-black">
                          Password
                        </label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="w-full text-black"
                        />
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300">
                        Log In
                      </Button>
                    </motion.div>

                    <div className="relative flex items-center justify-center">
                      <span className="bg-white px-2 text-sm text-gray-500">
                        Or, sign in with
                      </span>
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t"></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {socialProviders.map((provider, index) => (
                        <motion.div key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          {provider.name === "Google" && (
                            <Button 
                              variant="outline" 
                              className="flex items-center justify-center bg-white hover:bg-red-50 border-red-100 transition-colors duration-300 w-full"
                            >
                              <span className="w-5 h-5 mr-2">
                                <Icon icon="cib:google" className="w-full h-full text-amber-500" />
                              </span>
                              <span className="text-black">Google</span>
                            </Button>
                          )}
                          {provider.name === "Facebook" && (
                            <Button 
                              variant="outline" 
                              className="flex items-center justify-center bg-white hover:bg-blue-50 border-blue-100 transition-colors duration-300 w-full"
                            >
                              <span className="w-5 h-5 mr-2">
                                <Icon icon="cib:facebook" className="w-full h-full text-blue-600" />
                              </span>
                              <span className="text-black">Facebook</span>
                            </Button>
                          )}
                          {provider.name === "Apple" && (
                            <Button 
                              variant="outline" 
                              className="flex items-center justify-center bg-white hover:bg-gray-50 border-gray-100 transition-colors duration-300 w-full"
                            >
                              <span className="w-5 h-5 mr-2">
                                <Icon icon="cib:apple" className="w-full h-full text-gray-800" />
                              </span>
                              <span className="text-black">Apple</span>
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>

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
                  <motion.div 
                    key="signup"
                    {...fadeAnimation}
                    className="mt-0 space-y-6"
                  >
                    <h2 className="text-3xl font-display font-bold text-center text-black">Sign Up</h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="firstName" className="text-sm font-medium text-black">
                            First Name
                          </label>
                          <Input
                            id="firstName"
                            placeholder="John"
                            className="w-full text-black"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="lastName" className="text-sm font-medium text-black">
                            Last Name
                          </label>
                          <Input
                            id="lastName"
                            placeholder="Doe"
                            className="w-full text-black"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="signupEmail" className="text-sm font-medium text-black">
                          Email
                        </label>
                        <Input
                          id="signupEmail"
                          type="email"
                          placeholder="your@email.com"
                          className="w-full text-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="signupPassword" className="text-sm font-medium text-black">
                          Password
                        </label>
                        <Input
                          id="signupPassword"
                          type="password"
                          placeholder="••••••••"
                          className="w-full text-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-black">
                          Confirm Password
                        </label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="w-full text-black"
                        />
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300">
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

                    <div className="grid grid-cols-3 gap-3">
                      {socialProviders.map((provider, index) => (
                        <motion.div key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          {provider.name === "Google" && (
                            <Button 
                              variant="outline" 
                              className="flex items-center justify-center bg-white hover:bg-red-50 border-red-100 transition-colors duration-300 w-full"
                            >
                              <span className="w-5 h-5 mr-2">
                                <Icon icon="cib:google" className="w-full h-full text-amber-500" />
                              </span>
                              <span className="text-black">Google</span>
                            </Button>
                          )}
                          {provider.name === "Facebook" && (
                            <Button 
                              variant="outline" 
                              className="flex items-center justify-center bg-white hover:bg-blue-50 border-blue-100 transition-colors duration-300 w-full"
                            >
                              <span className="w-5 h-5 mr-2">
                                <Icon icon="cib:facebook" className="w-full h-full text-blue-600" />
                              </span>
                              <span className="text-black">Facebook</span>
                            </Button>
                          )}
                          {provider.name === "Apple" && (
                            <Button 
                              variant="outline" 
                              className="flex items-center justify-center bg-white hover:bg-gray-50 border-gray-100 transition-colors duration-300 w-full"
                            >
                              <span className="w-5 h-5 mr-2">
                                <Icon icon="cib:apple" className="w-full h-full text-gray-800" />
                              </span>
                              <span className="text-black">Apple</span>
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <p className="text-xs text-center text-gray-500">
                      By clicking “Sign up“, you agree to livewave Terms & Conditions 
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
      </div>
    </div>
  );
}