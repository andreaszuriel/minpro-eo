"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { handleMagicLinkLogin } from "@/lib/actions";
import { Loader2 } from "lucide-react";

export function MagicLinkForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      await handleMagicLinkLogin(formData);
      // The page will redirect after successful form submission
    } catch (error) {
      console.error("Error sending magic link:", error);
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-black">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          className="w-full text-black"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <motion.div 
        className="mt-4"
        whileHover={{ scale: isLoading ? 1 : 1.03 }} 
        whileTap={{ scale: isLoading ? 1 : 0.97 }}
      >
        <Button
          type="submit"
          className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Link...
            </>
          ) : (
            "Send Magic Link"
          )}
        </Button>
      </motion.div>
    </form>
  );
}