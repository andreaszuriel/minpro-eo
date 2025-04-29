"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });

      if (response?.error) {
        setError(response.error);
        setIsLoading(false);
      } else {
        setRedirecting(true);
        // Redirect to admin dashboard instead of user-specific dashboard
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-auto mt-20"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-display font-bold text-center text-black mb-6">
        Admin Sign-In
      </h2>

      {error && (
        <p className="text-red-500 text-center text-sm bg-red-100 p-2 rounded mb-4">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmit(formData);
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label
            htmlFor="adminEmail"
            className="text-sm font-medium text-black"
          >
            Email
          </label>
          <Input
            id="adminEmail"
            name="email"
            type="email"
            placeholder="admin@example.com"
            className="w-full text-black"
            required
            disabled={isLoading || redirecting}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="adminPassword"
            className="text-sm font-medium text-black"
          >
            Password
          </label>
          <Input
            id="adminPassword"
            name="password"
            type="password"
            placeholder="••••••••"
            className="w-full text-black"
            required
            disabled={isLoading || redirecting}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <motion.div
          whileHover={{ scale: isLoading || redirecting ? 1 : 1.05 }}
          whileTap={{ scale: isLoading || redirecting ? 1 : 0.95 }}
        >
          <Button
            type="submit"
            className="w-full bg-primary-600 hover:bg-secondary-700 transition-colors duration-300"
            disabled={isLoading || redirecting}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : redirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Success! Redirecting...
              </>
            ) : (
              "Access Admin Panel"
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}