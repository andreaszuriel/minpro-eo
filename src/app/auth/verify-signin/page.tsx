"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifySignIn() {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle size={64} className="mx-auto text-green-500" />
        </motion.div>
        
        <h1 className="text-3xl font-display font-bold mt-6 text-gray-900">
          Sign In Successful!
        </h1>
        
        <p className="mt-4 text-gray-600">
          You've successfully signed in to your account.
        </p>
        
        <div className="mt-8 text-gray-500">
          Redirecting to home page in{" "}
          <motion.span
            key={countdown}
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-primary-600 font-bold"
          >
            {countdown}
          </motion.span>{" "}
          seconds...
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          whileTap={{ scale: 0.97 }}
          className="mt-6"
        >
          <Button
            className="px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-secondary-700 transition-colors duration-300"
            onClick={() => router.push("/")}
          >
            Go to Home Now
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}