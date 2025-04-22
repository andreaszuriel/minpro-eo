// app/auth/verify-request/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <motion.div
        className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center space-y-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center"
          >
            <Icon icon="mdi:email-check-outline" className="w-10 h-10 text-primary-600" />
          </motion.div>

          <h1 className="text-2xl font-display font-bold text-black">Check your email</h1>
          
          <p className="text-gray-600">
            A sign in link has been sent to your email address.
            Please check your inbox and click the link to complete the sign in process.
          </p>

          <div className="pt-4 w-full">
            <motion.div 
              className="mt-2" 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/auth/signin" passHref>
                <Button
                  variant="outline"
                  className="w-full border-gray-200 text-black hover:bg-gray-50 transition-colors duration-300"
                >
                  Back to sign in
                </Button>
              </Link>
            </motion.div>
          </div>

          <p className="text-sm text-gray-500 pt-4">
            Didn&apos;t receive an email? Check your spam folder or try signing in again.
          </p>
        </div>
      </motion.div>
    </div>
  );
}