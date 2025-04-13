// app/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { 
  Music, 
  Ticket, 
  DollarSign, 
  Users, 
  BarChart3 
} from "lucide-react";
import { Icon } from '@iconify/react';
import Image from "next/image";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Background and Content */}
      <div className="relative w-full md:w-1/2 h-[50vh] md:h-screen">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://i.pinimg.com/1200x/7b/83/48/7b83481a4cf0c574be1e71dd0294121e.jpg"
            alt="Concert Background"
            layout="fill"
            objectFit="cover"
            className="opacity-70"
          />
        </div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black opacity-40 z-10"></div>

        {/* Left Side Content Container */}
        <div className="relative z-20 h-full flex items-center">
          {/* Brand and Benefits */}
          <div className="px-12 py-8 text-white max-w-xl">
            {/* Brand Name */}
            <div className="flex items-center mb-10">
              <Music className="w-8 h-8 mr-3 text-tertiary-500" />
              <h1 className="text-5xl font-bold font-brand">livewave</h1>
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              <h2 className="text-xl font-display font-semibold mb-6">
                Why choose Livewave for your concert experience?
              </h2>

              <div className="flex items-start space-x-3">
                <Ticket className="w-6 h-6 mt-1 text-tertiary-500 flex-shrink-0" />
                <div>
                  <p className="font-bold">Seamless ticketing, start to stage</p>
                  <p className="text-gray-300">
                    Effortless tools to create, promote, and sell tickets in minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <DollarSign className="w-6 h-6 mt-1 text-tertiary-500 flex-shrink-0" />
                <div>
                  <p className="font-bold">Transparent pricing, no hidden fees</p>
                  <p className="text-gray-300">
                    Keep more of your earnings — and your fans happy too.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="w-6 h-6 mt-1 text-tertiary-500 flex-shrink-0" />
                <div>
                  <p className="font-bold">Built for artists & organizers</p>
                  <p className="text-gray-300">
                    Whether indie or major, our tools scale with your vision.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <BarChart3 className="w-6 h-6 mt-1 text-tertiary-500 flex-shrink-0" />
                <div>
                  <p className="font-bold">Real-time insights & audience reach</p>
                  <p className="text-gray-300">
                    Track engagement, ticket sales, and grow your community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Form Section */}
      <div className="w-full md:w-1/2 min-h-screen bg-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsContent value="login" className="mt-0">
              <div className="space-y-6">
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

                <Button className="w-full bg-primary-600 hover:bg-secondary-700">
                  Log In
                </Button>

                <div className="relative flex items-center justify-center">
                  <span className="bg-white px-2 text-sm text-gray-500">
                    Or, sign in with
                  </span>
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center bg-white hover:bg-red-50 border-red-100"
                  >
                    <Icon icon="logos:google-icon" className="w-5 h-5 mr-2 text-red-500" />
                    <span className="text-black">Google</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center bg-white hover:bg-blue-50 border-blue-100"
                  >
                    <Icon icon="logos:facebook" className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="text-black">Facebook</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center bg-white hover:bg-gray-50 border-gray-100"
                  >
                    <Icon icon="logos:apple" className="w-5 h-5 mr-2 text-gray-800" />
                    <span className="text-black">Apple</span>
                  </Button>
                </div>

                <p className="text-center text-sm text-black">
                  New here?{" "}
                  <button
                    onClick={() => setActiveTab("signup")}
                    className="text-primary-600 hover:text-secondary-500 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <div className="space-y-6">
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

                <Button className="w-full bg-primary-600 hover:bg-secondary-700">
                  Sign Up
                </Button>

                <div className="relative flex items-center justify-center">
                  <span className="bg-white px-2 text-sm text-gray-500">
                    Or, sign up with
                  </span>
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center bg-white hover:bg-red-50 border-red-100"
                  >
                    <Icon icon="logos:google-icon" className="w-5 h-5 mr-2 text-red-500" />
                    <span className="text-black">Google</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center bg-white hover:bg-blue-50 border-blue-100"
                  >
                    <Icon icon="logos:facebook" className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="text-black">Facebook</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center bg-white hover:bg-gray-50 border-gray-100"
                  >
                    <Icon icon="logos:apple" className="w-5 h-5 mr-2 text-gray-800" />
                    <span className="text-black">Apple</span>
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  By clicking "Sign up", you agree to livewave Terms & Conditions 
                  and have read the Privacy Policy.
                </p>

                <p className="text-center text-sm text-black">
                  Already have an account?{" "}
                  <button
                    onClick={() => setActiveTab("login")}
                    className="text-primary-600 hover:text-secondary-500 font-medium transition-colors"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}