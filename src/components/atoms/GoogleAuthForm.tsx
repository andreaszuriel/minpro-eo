"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export function GoogleAuthForm() {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="outline"
        className="flex items-center justify-center bg-white border-gray-300 hover:bg-gray-50 transition-colors duration-300 w-full opacity-50 cursor-not-allowed"
        disabled
      >
        <span className="w-5 h-5 mr-2">
          <Icon icon="cib:google" className="w-full h-full text-red-500" />
        </span>
        <span className="text-black">Sign in with Google</span>
      </Button>
    </motion.div>
  );
}