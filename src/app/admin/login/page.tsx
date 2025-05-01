"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

export default function AdminLogin() {
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

      setIsLoading(false); 

      if (response?.error) {
        // Map common errors to user-friendly messages
        if (response.error === "CredentialsSignin") {
             setError("Invalid email or password. Please try again.");
        } else if (response.error === "AccessDenied") { 
             setError("Access Denied. You might not have admin privileges.");
        }
         else {
             setError("Login failed. Please check your credentials.");
        }
        console.error("SignIn Error:", response.error); 
      } else if (response?.ok && !response.error) {
         // Login was successful
        setRedirecting(true); // Show feedback to the user
        window.location.href = '/admin/dashboard';

      } else {
          setError("An unexpected issue occurred during login. Please try again.");
          console.warn("Unexpected SignIn Response:", response);
      }
    } catch (err: any) {
      console.error("Catch Block Error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false); // Ensure loading is stopped on catch
      setRedirecting(false); // Ensure redirecting is reset
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